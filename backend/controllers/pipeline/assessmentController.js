const mongoose = require("mongoose");
const CandidatePipeline = require("../../models/pipeline/CandidatePipeline");
const Assessment = require("../../models/pipeline/Assessment");
const { generateMcqSetAI  } = require("../../services/assessmentGenerator");
const { gradeMcq } = require("../../services/assessmentEvaluator");
const { logEvent } = require("../../services/pipelineEvents");
const InternshipPost = require("../../models/webapp-models/internshipPostModel");
const sendNotification = require("../../utils/Notification"); 


const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);




/**
 * POST /api/l2-assessments/generate
 * body: { internshipId, studentId, partnerId, config? }
 */
async function generateAssessment(req, res) {
  try {
    const { internshipId, studentId, partnerId, config } = req.body;

    // Validate IDs
    if (
      !isValidObjectId(internshipId) ||
      !isValidObjectId(studentId) ||
      !isValidObjectId(partnerId)
    ) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    // Load internship
    const internship = await InternshipPost.findById(internshipId).lean();
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    // Map fields safely
    const internshipTitle = internship.jobTitle || "Untitled Internship";
    const internshipDescription = internship.jobDescription || "No description provided.";
    const skills = Array.isArray(internship.skills)
      ? internship.skills
      : Array.isArray(internship.qualifications)
      ? internship.qualifications
      : [];

    // Config snapshot
    const cfg = {
      allowText: !!config?.allowText,
      allowFileUpload: !!config?.allowFileUpload,
      difficulty: Number(config?.difficulty || 2),
      questionCount: Number(config?.questionCount || 10),
      timeLimitMinutes: Number(config?.timeLimitMinutes || 20),
      passScore: Number(config?.passScore || 70),
    };

    // Safety check before AI call
    if (!internshipTitle || !internshipDescription) {
      return res.status(400).json({
        message: "Internship title or description is missing. Cannot generate assessment.",
      });
    }

    // Generate AI questions
    const questions = await generateMcqSetAI({
      internshipTitle,
      internshipDescription,
      skills,
      questionCount: cfg.questionCount,
      difficulty: cfg.difficulty,
    });

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ message: "AI failed to generate questions" });
    }

    // Ensure single attempt
    let assessment = await Assessment.findOne({
      internshipId,
      studentId,
      attempt: 1,
    });

    if (!assessment) {
      assessment = await Assessment.create({
        internshipId,
        studentId,
        partnerId,
        configSnapshot: cfg,
        timing: { timeLimitMinutes: cfg.timeLimitMinutes },
        questions,
        status: "generated",
        attempt: 1,
      });
    }

    // Update candidate pipeline (L2 stage)
    await CandidatePipeline.findOneAndUpdate(
      { internshipId, studentId },
      {
        $set: {
          partnerId,
          stage: "L2",
          "l2.enabled": true,
          "l2.status": "generated",
          "l2.assessmentId": assessment._id,
          "l2.updatedAt": new Date(),
        },
        $setOnInsert: { internshipId, studentId },
      },
      { upsert: true }
    );

    // Event logging
    logEvent({
      internshipId,
      studentId,
      partnerId,
      type: "L2_GENERATED",
      actorKind: "partner",
      actorId: partnerId,
      payload: {
        assessmentId: String(assessment._id),
        source: "AI",
        internshipTitle,
      },
    });

    return res.status(201).json({ assessmentId: assessment._id });
  } catch (err) {
    console.error("❌ generateAssessment error:", err);
    return res.status(500).json({ message: "Failed to generate assessment", error: err.message });
  }
}



/**
 * POST /api/l2-assessments/:id/send
 * body: { partnerId }
 * Idempotent: if already sent/started/submitted/evaluated, returns ok.
 */
async function sendAssessment(req, res) {
  const { id } = req.params;
  const { partnerId } = req.body;

  if (!isValidObjectId(id) || !isValidObjectId(partnerId)) {
    return res.status(400).json({ message: "Invalid ids" });
  }

  const assessment = await Assessment.findById(id);
  if (!assessment) {
    return res.status(404).json({ message: "Assessment not found" });
  }

  // ✅ Idempotent behavior
  if (["sent", "started", "submitted", "evaluated"].includes(assessment.status)) {
    return res.json({ ok: true, status: assessment.status });
  }

  assessment.status = "sent";
  await assessment.save();

  await CandidatePipeline.findOneAndUpdate(
    { internshipId: assessment.internshipId, studentId: assessment.studentId },
    {
      $set: {
        stage: "L2",
        "l2.status": "sent",
        "l2.updatedAt": new Date(),
      },
    },
    { upsert: true }
  );

  // 🔔 SEND NOTIFICATION TO STUDENT
  await sendNotification({
    studentId: assessment.studentId,
    title: "Level 2 Assessment Assigned",
    message:
      "Your Level 2 assessment has been assigned. Please complete it within the given time limit.",
    link: `/student/assessments/${assessment._id}`,
    type: "general",
  });

  // Event logging
  logEvent({
    internshipId: assessment.internshipId,
    studentId: assessment.studentId,
    partnerId,
    type: "L2_SENT",
    actorKind: "partner",
    actorId: partnerId,
    payload: { assessmentId: String(assessment._id) },
  });

  return res.json({ ok: true, status: "sent" });
}


async function getAssessmentsByInternship(req, res) {
  const { internshipId } = req.params;
  if (!isValidObjectId(internshipId)) return res.status(400).json({ message: "Invalid internshipId" });

  const items = await Assessment.find({ internshipId }).sort({ updatedAt: -1 }).lean();
  return res.json({ items });
}

async function getAssessmentsByStudent(req, res) {
  const { studentId } = req.params;
  if (!isValidObjectId(studentId)) return res.status(400).json({ message: "Invalid studentId" });

  const items = await Assessment.find({ studentId }).sort({ updatedAt: -1 }).lean();
  return res.json({ items });
}

/**
 * Student starts test
 * POST /api/l2-assessments/:id/start
 */
async function startAssessment(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid assessment id" });

  const assessment = await Assessment.findById(id);
  if (!assessment) return res.status(404).json({ message: "Assessment not found" });

  if (["submitted", "evaluated"].includes(assessment.status)) {
    return res.status(409).json({ message: "Assessment already completed" });
  }

  if (!assessment.timing.startedAt) assessment.timing.startedAt = new Date();
  assessment.status = "started";
  await assessment.save();

  await CandidatePipeline.findOneAndUpdate(
    { internshipId: assessment.internshipId, studentId: assessment.studentId },
    { $set: { stage: "L2", "l2.status": "started", "l2.updatedAt": new Date() } },
    { upsert: true }
  );

  logEvent({
    internshipId: assessment.internshipId,
    studentId: assessment.studentId,
    partnerId: assessment.partnerId,
    type: "L2_STARTED",
    actorKind: "student",
    actorId: assessment.studentId,
    payload: { assessmentId: String(assessment._id) },
  });

  return res.json({ ok: true, startedAt: assessment.timing.startedAt });
}

/**
 * Submit answers
 * POST /api/l2-assessments/:id/submit
 * body: { mcqAnswers, textAnswer?, files? }
 */
async function submitAssessment(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid assessment id" });

  const { mcqAnswers, textAnswer, files } = req.body;

  const assessment = await Assessment.findById(id);
  if (!assessment) return res.status(404).json({ message: "Assessment not found" });

  if (["submitted", "evaluated"].includes(assessment.status)) {
    return res.status(409).json({ message: "Assessment already submitted" });
  }

  // simple time-limit check
  if (assessment.timing.startedAt) {
    const elapsedMs = Date.now() - new Date(assessment.timing.startedAt).getTime();
    const limitMs = (assessment.timing.timeLimitMinutes || 20) * 60 * 1000;
   if (elapsedMs > limitMs) {
  // Save whatever answers were sent (or empty)
  assessment.submission = assessment.submission || {};
  assessment.submission.mcqAnswers = Array.isArray(mcqAnswers) ? mcqAnswers : [];
  assessment.timing.submittedAt = new Date();

  // Auto-evaluate
  const { mcqScore, correctCount, total, pass } = gradeMcq({
    questions: assessment.questions || [],
    answers: assessment.submission.mcqAnswers,
    passScore: assessment.configSnapshot.passScore || 70,
  });

  assessment.evaluation = {
    mcqScore,
    finalScore: mcqScore,
    pass,
    feedback: `Auto-submitted due to time expiry (${correctCount}/${total})`,
    evaluatedAt: new Date(),
  };

  assessment.status = "evaluated";
  await assessment.save();

 await CandidatePipeline.findOneAndUpdate(
  { internshipId: assessment.internshipId, studentId: assessment.studentId },
  {
    $set: pass
      ? {
          stage: "L3",                // ✅ MOVE TO LEVEL 3
          "l2.status": "passed",
          "l2.score": mcqScore,
          "l2.updatedAt": new Date(),

          "l3.enabled": true,
          "l3.status": "pending",
          "l3.updatedAt": new Date(),
        }
      : {
          stage: "L2",
          "l2.status": "rejected",
          "l2.score": mcqScore,
          "l2.updatedAt": new Date(),
        },
  },
  { upsert: true }
);


  logEvent({
    internshipId: assessment.internshipId,
    studentId: assessment.studentId,
    partnerId: assessment.partnerId,
    type: "L2_AUTO_SUBMITTED",
    actorKind: "system",
    actorId: null,
    payload: {
      assessmentId: String(assessment._id),
      reason: "time_expired",
      mcqScore,
    },
  });

  return res.status(410).json({
    message: "Time limit exceeded. Assessment auto-submitted.",
    evaluation: assessment.evaluation,
  });
}

  }

  assessment.submission = assessment.submission || {};
  assessment.submission.mcqAnswers = Array.isArray(mcqAnswers) ? mcqAnswers : [];
  if (assessment.configSnapshot.allowText) assessment.submission.textAnswer = textAnswer || null;
  if (assessment.configSnapshot.allowFileUpload && Array.isArray(files)) assessment.submission.files = files;

  assessment.timing.submittedAt = new Date();
  assessment.status = "submitted";
  await assessment.save();

  await CandidatePipeline.findOneAndUpdate(
    { internshipId: assessment.internshipId, studentId: assessment.studentId },
    { $set: { stage: "L2", "l2.status": "submitted", "l2.updatedAt": new Date() } },
    { upsert: true }
  );

  logEvent({
    internshipId: assessment.internshipId,
    studentId: assessment.studentId,
    partnerId: assessment.partnerId,
    type: "L2_SUBMITTED",
    actorKind: "student",
    actorId: assessment.studentId,
    payload: { assessmentId: String(assessment._id) },
  });

  return res.json({ ok: true });
}

/**
 * Auto-grade MCQ
 * POST /api/l2-assessments/:id/evaluate
 */
async function evaluateAssessment(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid assessment id" });

  const assessment = await Assessment.findById(id);
  if (!assessment) return res.status(404).json({ message: "Assessment not found" });

  if (!["submitted", "evaluated"].includes(assessment.status)) {
    return res.status(409).json({ message: "Assessment not submitted yet" });
  }

  if (assessment.status === "evaluated") {
    return res.json({ ok: true, evaluation: assessment.evaluation });
  }

  const { mcqScore, correctCount, total, pass } = gradeMcq({
    questions: assessment.questions || [],
    answers: assessment.submission?.mcqAnswers || [],
    passScore: assessment.configSnapshot.passScore || 70,
  });

  assessment.evaluation = assessment.evaluation || {};
  assessment.evaluation.mcqScore = mcqScore;
  assessment.evaluation.finalScore = mcqScore;
  assessment.evaluation.pass = pass;
  assessment.evaluation.feedback = `Auto-graded MCQ: ${correctCount}/${total} correct.`;
  assessment.evaluation.evaluatedAt = new Date();
  assessment.status = "evaluated";
  await assessment.save();

  await CandidatePipeline.findOneAndUpdate(
  { internshipId: assessment.internshipId, studentId: assessment.studentId },
  {
    $set: pass
      ? {
          stage: "L3",
          "l2.status": "passed",
          "l2.score": mcqScore,
          "l2.updatedAt": new Date(),

          "l3.enabled": true,
          "l3.status": "pending",
          "l3.updatedAt": new Date(),
        }
      : {
          stage: "L2",
          "l2.status": "rejected",
          "l2.score": mcqScore,
          "l2.updatedAt": new Date(),
        },
  },
  { upsert: true }
);


  logEvent({
    internshipId: assessment.internshipId,
    studentId: assessment.studentId,
    partnerId: assessment.partnerId,
    type: "L2_EVALUATED",
    actorKind: "system",
    actorId: null,
    payload: { assessmentId: String(assessment._id), mcqScore, pass },
  });

  return res.json({ ok: true, evaluation: assessment.evaluation });
}

/**
 * GET /api/l2-assessments/:id
 * Student-safe fetch
 */
async function getAssessmentForStudent(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid assessment id" });
  }

  const assessment = await Assessment.findById(id).lean();
  if (!assessment) {
    return res.status(404).json({ message: "Assessment not found" });
  }

  // ❗ DO NOT expose correctIndexHash
  const safeQuestions = assessment.questions.map(q => ({
    questionId: q.questionId,
    question: q.question,
    options: q.options
  }));

  return res.json({
    assessmentId: assessment._id,
    internshipId: assessment.internshipId,
    timeLimitMinutes: assessment.timing.timeLimitMinutes,
    status: assessment.status,
    startedAt: assessment.timing.startedAt,
    questions: safeQuestions
  });
}


module.exports = {
  generateAssessment,
  sendAssessment,
  getAssessmentsByInternship,
  getAssessmentsByStudent,
  startAssessment,
  submitAssessment,
  getAssessmentForStudent,
  evaluateAssessment,
};
