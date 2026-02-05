import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useProctoring } from "./useProctoring";


const StudentAssessment = () => {
  const assessmentId = localStorage.getItem("activeAssessmentId");

  const [mode, setMode] = useState("instructions"); // instructions | exam | result
  const [assessment, setAssessment] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [evaluation, setEvaluation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isForcedSubmit, setIsForcedSubmit] = useState(false);




  const timerRef = useRef(null);
  const MAX_VIOLATIONS = 3;

  const handleViolation = (violation, count) => {
    console.warn("🚨 Proctoring violation:", violation, "Count:", count);

    alert(`Violation detected: ${violation.message}`);

    if (count >= MAX_VIOLATIONS) {
      alert("Too many violations. Assessment will be submitted automatically.");
      handleSubmit(true); // force submit
    }
  };

  const {
    violations,
    videoRef,
    startProctoring,
    stopProctoring,
    enterFullscreen,
    exitFullscreen,
    violationCount,
  } = useProctoring(handleViolation);


  /* =================================
     FETCH ASSESSMENT (SAFE VERSION)
  ================================= */
useEffect(() => {
  if (!assessmentId) return;

  const fetchAssessment = async () => {
    const { data } = await axios.get(`/api/l2-assessments/${assessmentId}`);
    setAssessment(data);

    // RESULT
    if (data.status === "evaluated") {
      setMode("result");
      return;
    }

    // STARTED (resume safely)
    if (data.status === "started" && data.startedAt) {
      const startedAt = new Date(data.startedAt).getTime();
      const now = Date.now();
      const limitSeconds = data.timeLimitMinutes * 60;
      const elapsedSeconds = Math.floor((now - startedAt) / 1000);
      const remaining = limitSeconds - elapsedSeconds;

      if (remaining <= 0) {
        handleSubmit(true);
        return;
      }

      setTimeLeft(remaining);
      setMode("exam");
      return;
    }

    // SENT (not started yet)
    setMode("instructions");
  };

  fetchAssessment();
}, [assessmentId]);




  useEffect(() => {
    const warnUser = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    if (mode === "exam") {
      window.addEventListener("beforeunload", warnUser);
    }

    return () => {
      window.removeEventListener("beforeunload", warnUser);
    };
  }, [mode]);

  /* =================================
     TIMER
  ================================= */
 useEffect(() => {
  if (mode !== "exam") return;

  timerRef.current = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        clearInterval(timerRef.current);
        handleSubmit(true);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timerRef.current);
}, [mode]);


  useEffect(() => {
  if (mode !== "exam") return;

  return () => {
    stopProctoring();
    exitFullscreen();
    localStorage.removeItem("examLocked");
  };
}, [mode]);



  /* =================================
     START ASSESSMENT
  ================================= */
const handleStart = async () => {
  await axios.post(`/api/l2-assessments/${assessmentId}/start`);

  localStorage.setItem("examLocked", "true");

  const ok = await startProctoring();
  if (!ok) return;

  await enterFullscreen(document.documentElement);
  setMode("exam");
};


  const handleQuitExam = async () => {
  const confirmQuit = window.confirm(
    "Are you sure you want to quit the exam?\n\nYour exam will be submitted and cannot be resumed."
  );

  if (!confirmQuit) return;

  await handleSubmit(true); // forced submit
};


  /* =================================
     SELECT ANSWER
  ================================= */
  const selectAnswer = (questionId, index) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: index,
    }));
  };



  /* =================================
     SUBMIT + EVALUATE
  ================================= */
async function handleSubmit(forced = false) {
  console.log("SUBMIT CLICKED", { forced, answers });
  if (submitting) return;

  setSubmitting(true);
  setIsForcedSubmit(forced);

  try {
    clearInterval(timerRef.current);

    const mcqAnswers = Object.entries(answers).map(
      ([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex,
      })
    );

    await axios.post(`/api/l2-assessments/${assessmentId}/submit`, {
      mcqAnswers,
      forced,
    });

    const { data } = await axios.post(
      `/api/l2-assessments/${assessmentId}/evaluate`
    );

    setEvaluation(data.evaluation);
    setMode("result");
 } catch (err) {
  if (err.response?.status === 410) {
    alert("⏰ Time is over. Your exam was auto-submitted.");

    const evaluation = err.response.data?.evaluation;
    if (evaluation) {
      setEvaluation(evaluation);
      setMode("result");
    } else {
      // fallback: fetch assessment
      const { data } = await axios.get(
        `/api/l2-assessments/${assessmentId}`
      );
      if (data?.evaluation) {
        setEvaluation(data.evaluation);
        setMode("result");
      }
    }
  } else {
    console.error("Submission failed", err);
    alert("Submission failed. Please contact support.");
  }
}

}

  /* =================================
     FORMAT TIMER
  ================================= */
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!assessment) {
    return <div className="p-6">Loading assessment...</div>;
  }

  /* =================================
     INSTRUCTIONS VIEW
  ================================= */
  if (mode === "instructions") {
    return (
      <div className="max-w-3xl mx-auto p-6 font-poppins">
        <h2 className="text-2xl font-semibold mb-4">
          Assessment Instructions
        </h2>

        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Total Questions: {assessment.questions.length}</li>
          <li>Time Limit: {assessment.timeLimitMinutes} minutes</li>
          <li>Passing Score: 70%</li>
          <li>Do not refresh or close the tab</li>
        </ul>

        <button
          onClick={handleStart}
          className="mt-6 bg-purple-600 text-white px-6 py-3 rounded hover:bg-purple-700"
        >
          Start Assessment 
        </button>
      </div>
    );
  }

  /* =================================
     EXAM VIEW
  ================================= */
 if (mode === "exam") {
  const q = assessment.questions[currentQ];

  return (
    <div className="min-h-screen bg-gray-100 font-poppins flex justify-center">
      <div className="w-full max-w-5xl bg-white shadow-lg rounded-xl p-6 mt-6">

        {/* HEADER */}
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              SkillNaav Assessment
            </h2>
            <p className="text-sm text-gray-500">
              Question {currentQ + 1} of {assessment.questions.length}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-red-600 font-bold text-lg">
              ⏱ {formatTime(timeLeft)}
            </span>

            <button
              onClick={handleQuitExam}
              className="text-red-600 border border-red-500 px-3 py-1 rounded hover:bg-red-50"
            >
              Quit Exam
            </button>
          </div>
        </div>

        {/* QUESTION */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {q.question}
          </h3>

          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => selectAnswer(q.questionId, idx)}
                className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition
                  ${
                    answers[q.questionId] === idx
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center
                    ${
                      answers[q.questionId] === idx
                        ? "border-purple-600"
                        : "border-gray-400"
                    }`}
                >
                  {answers[q.questionId] === idx && (
                    <div className="w-3 h-3 bg-purple-600 rounded-full" />
                  )}
                </div>

                <span className="text-gray-800">{opt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Progress</span>
            <span>
              {currentQ + 1}/{assessment.questions.length}
            </span>
          </div>

          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{
                width: `${((currentQ + 1) / assessment.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="flex justify-between items-center">
          <button
            disabled={currentQ === 0}
            onClick={() => setCurrentQ((q) => q - 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            ◀ Previous
          </button>

       {currentQ === assessment.questions.length - 1 ? (
 <button
  onClick={() => handleSubmit(false)}
  disabled={submitting}
  className={`px-6 py-2 rounded text-white
    ${submitting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}
  `}
>
  {submitting ? "Submitting..." : "Submit Exam"}
</button>


) : (
  <button
    onClick={() => setCurrentQ((q) => q + 1)}
    className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
  >
    Next ▶
  </button>
)}

        </div>

        {/* QUESTION PALETTE */}
        <div className="mt-8 border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">
            Question Palette
          </h4>

          <div className="grid grid-cols-8 gap-2">
            {assessment.questions.map((qItem, idx) => (
              <button
                key={qItem.questionId}
                onClick={() => setCurrentQ(idx)}
                className={`py-2 rounded text-sm font-semibold
                  ${
                    idx === currentQ
                      ? "bg-purple-600 text-white"
                      : answers[qItem.questionId] !== undefined
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

  /* =================================
     RESULT VIEW
  ================================= */
  if (mode === "result") {
    return (
      <div className="max-w-xl mx-auto p-6 font-poppins text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Assessment Completed
        </h2>

        <p className="text-lg mb-2">
          Score: <strong>{evaluation?.mcqScore}%</strong>
        </p>

        {evaluation?.pass ? (
          <p className="text-green-600 font-semibold">
            🎉 You cleared the assessment!
          </p>
        ) : (
          <p className="text-red-600 font-semibold">
            Thank you for completing the assessment.
          </p>
        )}

        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("openTab", {
                detail: { tab: "applications" },
              })
            )
          }
          className="mt-6 bg-purple-600 text-white px-6 py-2 rounded"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  return null;
};

export default StudentAssessment;
