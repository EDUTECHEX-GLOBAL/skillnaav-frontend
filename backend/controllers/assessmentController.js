const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const InternshipAssessment = require("../models/webapp-models/InternshipAssessmentModel");
const InternshipPosting = require("../models/webapp-models/internshipPostModel");
const AssessmentSubmission = require("../models/webapp-models/AssessmentSubmissionModel");
const mongoose = require('mongoose');
function toObjectId(id) {
  return new mongoose.Types.ObjectId(id);  // ✅ CORRECT
}



const bedrockClient = new BedrockRuntimeClient({
  region: process.env.ASSESSMENT_AWS_REGION || process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.ASSESSMENT_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.ASSESSMENT_AWS_SECRET_ACCESS_KEY,
  },
});

// Generate AI Assessment
exports.generateAIInternshipAssessment = async (req, res) => {
  try {
    const { internshipId, studentId } = req.body;
    if (!internshipId || !studentId) {
      return res.status(400).json({ message: "internshipId and studentId are required" });
    }

    const internship = await InternshipPosting.findById(internshipId);
    if (!internship) return res.status(404).json({ message: "Internship not found" });

    const existing = await InternshipAssessment.findOne({ internshipId, studentId });
    if (existing) {
      return res.status(200).json({ message: "Assessment already exists", assessment: existing });
    }

    const prompt = `
You are an intelligent assessment generator for internship applicants.

Create exactly 5 multiple-choice questions (MCQs) to test readiness for the internship.

Internship Title: ${internship.jobTitle}
Company: ${internship.companyName}
Required Skills: ${internship.qualifications?.join(", ") || "N/A"}
Internship Description: ${internship.jobDescription || "N/A"}

Return ONLY a valid JSON array with this format:
[
  {
    "questionText": "string",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": 1,
    "marks": 1,
    "type": "mcq"
  }
]
`;

    const modelId = process.env.BEDROCK_MODEL_ID || "meta.llama3-8b-instruct-v1:0";
    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({ prompt, temperature: 0.6, max_gen_len: 800 }),
    });

    const response = await bedrockClient.send(command);
    const rawOutput = JSON.parse(Buffer.from(response.body).toString("utf-8"));
    const modelText = rawOutput?.output_text || rawOutput?.generation || "";

    let questions = [];
    try {
      const match = modelText.match(/\[\s*{[\s\S]*?}\s*\]/);
      if (!match) throw new Error("No valid JSON array found in AI output");

      questions = JSON.parse(match[0]).map((q) => ({ ...q, fromAI: true }));
      questions = questions.filter(q => 
        typeof q.questionText === 'string' &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.options.every(opt => typeof opt === 'string')
      );

      if (questions.length !== 5) throw new Error("AI did not return exactly 5 valid MCQs");
    } catch (err) {
      console.error("⚠️ Error parsing AI JSON:", modelText);
      return res.status(500).json({ message: "AI response invalid JSON format" });
    }

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    const assessment = await InternshipAssessment.create({
      internshipId,
      studentId,
      questions,
      totalMarks,
      aiPromptUsed: prompt,
    });

    res.status(201).json({ message: "AI Assessment generated successfully", assessment });

  } catch (error) {
    console.error("❌ Error generating AI assessment:", error);
    res.status(500).json({ message: "Failed to generate assessment", error: error.message });
  }
};

// Get Assessment for Student
exports.getStudentAssessment = async (req, res) => {
  try {
    const { studentId, internshipId } = req.params;
    if (!studentId || !internshipId) return res.status(400).json({ message: "studentId and internshipId are required" });

    const assessment = await InternshipAssessment.findOne({ studentId, internshipId });
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });

    res.status(200).json({ assessment });
  } catch (error) {
    console.error("❌ Error fetching assessment:", error);
    res.status(500).json({ message: "Failed to fetch assessment", error: error.message });
  }
};

// Submit Assessment
exports.submitAssessment = async (req, res) => {
  try {
    const { studentId, assessmentId, responses, timeTaken } = req.body;

    if (!studentId || !assessmentId || !responses) {
      return res.status(400).json({ message: "studentId, assessmentId, and responses are required" });
    }

    // Calculate score & percentage
    let score = 0, totalMarks = 0;
    responses.forEach(r => {
      r.isCorrect = r.studentAnswer === r.correctAnswer;
      score += r.isCorrect ? r.marks : 0;
      totalMarks += r.marks;
    });

    const percentage = (score / totalMarks) * 100;
    const fitStatus = percentage >= 50 ? "fit" : "not fit"; // Example threshold

    const submission = await AssessmentSubmission.create({
      studentId,
      assessmentId,
      responses,
      score,
      totalMarks,
      percentage,
      timeTaken,
      fitStatus,
    });

    res.status(201).json({ message: "Assessment submitted successfully", submission });

  } catch (error) {
    console.error("❌ Error submitting assessment:", error);
    res.status(500).json({ message: "Failed to submit assessment", error: error.message });
  }
};

// Get assessment submission for a student
exports.getAssessmentSubmission = async (req, res) => {
  try {
    const { studentId, assessmentId } = req.params;
    if (!studentId || !assessmentId) {
      return res.status(400).json({ message: "studentId and assessmentId are required" });
    }

    const submission = await AssessmentSubmission.findOne({
      studentId: toObjectId(studentId),
      assessmentId: toObjectId(assessmentId),
    });

    if (!submission) return res.status(404).json({ message: "Submission not found" });

    res.status(200).json({ submission });
  } catch (error) {
    console.error("❌ Error fetching submission:", error);
    res.status(500).json({ message: "Failed to fetch submission", error: error.message });
  }
};
