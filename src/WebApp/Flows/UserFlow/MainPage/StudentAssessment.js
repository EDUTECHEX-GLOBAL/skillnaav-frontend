import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "../../../../api/axiosInstance";
import { useProctoring } from "./useProctoring";

const StudentAssessment = () => {
  const assessmentId = localStorage.getItem("activeAssessmentId");

  const [mode, setMode] = useState("loading"); // loading | instructions | exam | result
  const [assessment, setAssessment] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [evaluation, setEvaluation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const handleSubmitRef = useRef(null);

  const handleViolationRef = useRef(null);

  const {
    startProctoring,
    stopProctoring,
    enterFullscreen,
    exitFullscreen,
    violationCount,
    warningMessage,
    showWarning,
  } = useProctoring((violation, count) => handleViolationRef.current?.(violation, count));

  const handleViolation = useCallback(
    async (violation, count) => {
      if (count >= 3 && !hasSubmittedRef.current) {
        showWarning("3 warnings reached. The exam will be submitted automatically.", 10000);
        await handleSubmitRef.current?.(true);
        return;
      }

      if (count > 0) {
        showWarning(`${violation.message}. Warning ${count}/3. Auto-submit after 3 warnings.`, 6000);
      }
    },
    [showWarning]
  );

  useEffect(() => {
    handleViolationRef.current = handleViolation;
  }, [handleViolation]);

  // Fetch assessment status and data
  useEffect(() => {
    if (!assessmentId) {
      setMode("error");
      return;
    }

    const fetchAssessment = async () => {
      try {
        // Get assessment status
        const { data: statusData } = await axios.get(`/api/l2-assessments/${assessmentId}`);

        if (["evaluated", "passed", "rejected"].includes(statusData.status)) {
          setEvaluation(statusData.evaluation);
          setMode("result");
          return;
        }

        if (statusData.status === "started") {
          setError("This assessment has already been started and cannot be resumed.");
          setMode("error");
          return;
        }

        if (statusData.status === "submitted") {
          setError("This assessment was already submitted. Results will be available soon.");
          setMode("error");
          return;
        }

        // Set basic assessment info for instructions
        setAssessment({
          _id: assessmentId,
          timeLimitMinutes: statusData.timeLimitMinutes || 20,
          status: statusData.status,
        });
        setMode("instructions");

      } catch (err) {
        console.error("Failed to load assessment:", err);
        setMode("error");
      }
    };

    fetchAssessment();
  }, [assessmentId]);

  // Timer effect
  useEffect(() => {
    if (mode !== "exam") return;

    setCurrentTime(Date.now());
    timerRef.current = setInterval(() => setCurrentTime(Date.now()), 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  const handleStart = async () => {
    try {
      setMode("loading");

      // Request browser permissions and start proctoring
      const media = await startProctoring();
      if (!media?.success || !media?.verified) {
        showWarning(
          "Please allow camera and microphone permissions in your browser. The exam cannot start without both.",
          8000
        );
        setMode("instructions");
        return;
      }

      // Start assessment
      await axios.post(`/api/l2-assessments/${assessmentId}/start`, {
        ipAddress: await getPublicIP(),
        userAgent: navigator.userAgent,
        proctoringVerified: true,
      });

      // Get questions
      const { data } = await axios.get(`/api/l2-assessments/${assessmentId}`);
      setAssessment(data);

      await enterFullscreen(document.documentElement);
      setMode("exam");

    } catch (err) {
      console.error("Failed to start:", err);
      showWarning("Failed to start assessment. Please allow camera and microphone and try again.", 6000);
      setMode("instructions");
    }
  };

  const handleSubmit = useCallback(async (forced = false) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    setSubmitting(true);

    try {
      const mcqAnswers = Object.entries(answers).map(([qid, idx]) => ({
        questionId: qid,
        selectedIndex: idx,
      }));

      await axios.post(`/api/l2-assessments/${assessmentId}/submit`, {
        mcqAnswers,
        forced,
      });

      const { data } = await axios.post(`/api/l2-assessments/${assessmentId}/evaluate`);
      setEvaluation(data.evaluation);
      setMode("result");

    } catch (err) {
      console.error("Submit failed:", err);
      showWarning("Submission failed. Please try again.", 6000);
      setSubmitting(false);
      hasSubmittedRef.current = false;
    } finally {
      stopProctoring();
      exitFullscreen();
    }
  }, [assessmentId, answers, stopProctoring, exitFullscreen, showWarning]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Auto-submit on time expiry
  useEffect(() => {
    if (mode !== "exam" || !assessment) return;

    const startedAt = assessment.startedAt || assessment.timing?.startedAt;
    if (!startedAt) return;

    const limitMs = (assessment.timeLimitMinutes || 20) * 60 * 1000;
    const elapsed = Date.now() - new Date(startedAt).getTime();

    if (elapsed >= limitMs && !hasSubmittedRef.current) {
      handleSubmit(true);
    }
  }, [currentTime, mode, assessment, handleSubmit]);

  const selectAnswer = (questionId, index) => {
    setAnswers(prev => ({ ...prev, [questionId]: index }));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getPublicIP = async () => {
    try {
      const res = await axios.get("https://api.ipify.org?format=json");
      return res.data.ip;
    } catch {
      return "unknown";
    }
  };

  // Loading
  if (mode === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Error
  if (mode === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold mb-4">Assessment Unavailable</h2>
          <p className="text-gray-600 mb-6">{error || "Unable to load the assessment. Please contact support."}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  // Instructions
  if (mode === "instructions") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-6">Assessment Instructions</h1>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-xl">📝</span>
              <div>
                <p className="font-semibold">Questions</p>
                <p className="text-gray-600">Multiple choice questions</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-xl">⏱️</span>
              <div>
                <p className="font-semibold">Time Limit</p>
                <p className="text-gray-600">{assessment?.timeLimitMinutes || 20} minutes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-xl">✅</span>
              <div>
                <p className="font-semibold">Passing Score</p>
                <p className="text-gray-600">70% or higher</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-yellow-800 font-semibold mb-2">Important:</p>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Camera and microphone must remain active</li>
              <li>• Allow browser permissions when requested</li>
              <li>• Stay in fullscreen mode</li>
              <li>• Do not switch tabs or windows</li>
              <li>• 3 warnings will auto-submit the exam</li>
              <li>• Once the exam starts, it cannot be resumed later</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
            <p className="font-semibold mb-2">Permissions needed to start:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Camera access</li>
              <li>Microphone access</li>
            </ul>
            <p className="mt-2 text-gray-700">
              When you click Start Assessment, your browser will ask for these permissions. Please allow both to begin.
            </p>
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  // Exam
  if (mode === "exam") {
    const questions = assessment?.questions || [];
    const totalQuestions = questions.length;
    const currentQuestion = questions[currentQ];

    if (!currentQuestion) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p>Loading question...</p>
        </div>
      );
    }

    // Calculate time remaining
    const startedAt = assessment.startedAt || assessment.timing?.startedAt;
    const remainingMs = startedAt ?
      Math.max(0, (assessment.timeLimitMinutes || 20) * 60 * 1000 - (Date.now() - new Date(startedAt).getTime())) : 0;
    const timeLeft = Math.ceil(remainingMs / 1000);

    const answeredCount = Object.keys(answers).length;

    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">SkillNaav Assessment</h1>
            <p className="text-sm">Question {currentQ + 1} of {totalQuestions}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-300 animate-pulse' : ''}`}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-xs">Time Remaining</div>
            </div>

            {violationCount > 0 && (
              <div className="text-yellow-300 text-sm">
                ⚠️ {violationCount} warning{violationCount > 1 ? 's' : ''}
              </div>
            )}

            <button
              onClick={() => handleSubmit(true)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
            >
              End Exam
            </button>
          </div>

          {warningMessage && (
            <div className="mt-4 mx-auto max-w-3xl rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              {warningMessage}
            </div>
          )}
        </div>

        {/* Question */}
        <div className="max-w-4xl mx-auto p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">{currentQuestion.question}</h2>

            <div className="space-y-3">
              {currentQuestion.options?.map((option, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    answers[currentQuestion.questionId] === idx
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQ}`}
                    checked={answers[currentQuestion.questionId] === idx}
                    onChange={() => selectAnswer(currentQuestion.questionId, idx)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-lg">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              disabled={currentQ === 0}
              onClick={() => setCurrentQ(prev => prev - 1)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {answeredCount} of {totalQuestions} answered
              </p>
            </div>

            {currentQ === totalQuestions - 1 ? (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQ(prev => prev + 1)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next →
              </button>
            )}
          </div>

          {/* Question indicators */}
          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQ(idx)}
                className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                  idx === currentQ
                    ? 'bg-blue-600 text-white'
                    : answers[questions[idx]?.questionId] !== undefined
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Results
  if (mode === "result") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">
            {evaluation?.pass ? "🎉" : "📊"}
          </div>

          <h1 className="text-3xl font-bold mb-4">
            Assessment Complete
          </h1>

          <div className="text-6xl font-bold my-6">
            <span className={evaluation?.pass ? "text-green-600" : "text-orange-600"}>
              {evaluation?.mcqScore || 0}%
            </span>
          </div>

          {evaluation?.pass ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-semibold">
                Congratulations! You passed the assessment.
              </p>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-orange-800 font-semibold">
                Assessment completed. Keep practicing!
              </p>
            </div>
          )}

          {evaluation?.feedback && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700">{evaluation.feedback}</p>
            </div>
          )}

          <button
            onClick={() => {
              localStorage.removeItem("activeAssessmentId");
              window.location.href = "/user-main-page";
            }}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default StudentAssessment;
