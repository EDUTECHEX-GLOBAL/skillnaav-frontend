import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useProctoring } from "./useProctoring";

const StudentAssessment = () => {
  const assessmentId = localStorage.getItem("activeAssessmentId");

  const [mode, setMode] = useState("loading"); // loading | instructions | exam | result
  const [assessment, setAssessment] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [evaluation, setEvaluation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ✅ TIMING PATTERN TRACKING (for anti-cheat)
  const [timingPattern, setTimingPattern] = useState({});
  const questionStartTimeRef = useRef(null);

  const timerRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const MAX_VIOLATIONS = 3;

  /* =================================
     VIOLATION HANDLER
  ================================= */
  const handleViolation = async (violation, count) => {
    console.warn("🚨 Proctoring violation:", violation, "Count:", count);

    // ✅ REPORT TO BACKEND
    try {
      await axios.post(
        `/api/l2-assessments/${assessmentId}/track-activity`,
        {
          activityType: violation.type.toLowerCase(),
          details: violation.message,
        }
      );
    } catch (err) {
      console.error("Failed to report violation:", err);
    }

    // Show warning to user
    if (count === 1) {
      alert(`⚠️ Warning: ${violation.message}\n\nViolation ${count}/${MAX_VIOLATIONS}`);
    } else if (count === 2) {
      alert(`⚠️ Second Warning: ${violation.message}\n\nViolation ${count}/${MAX_VIOLATIONS}\n\nOne more violation will auto-submit your exam!`);
    } else if (count >= MAX_VIOLATIONS) {
      alert("🚫 Too many violations detected.\n\nYour assessment will be submitted automatically.");
      await handleSubmit(true);
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
     TRACK TIME PER QUESTION
  ================================= */
  useEffect(() => {
    if (mode !== "exam" || !assessment) return;

    // Start timing for current question
    questionStartTimeRef.current = Date.now();

    return () => {
      // Save time spent when leaving question
      if (questionStartTimeRef.current) {
        const q = assessment.questions[currentQ];
        const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);

        setTimingPattern((prev) => ({
          ...prev,
          [q.questionId]: (prev[q.questionId] || 0) + timeSpent,
        }));
      }
    };
  }, [currentQ, mode, assessment]);

  /* =================================
     FETCH ASSESSMENT METADATA (NO QUESTIONS)
  ================================= */
  useEffect(() => {
    if (!assessmentId) {
      setError("No assessment ID found. Please go back to applications.");
      setMode("error");
      return;
    }

    const fetchAssessmentMetadata = async () => {
      try {
        // ✅ FETCH BASIC INFO FIRST (from Applications API or different endpoint)
        const { data } = await axios.get(`/api/applications/assessment/${assessmentId}/status`);

        // Create minimal assessment object
        setAssessment({
          _id: assessmentId,
          timeLimitMinutes: data.timeLimitMinutes || 20,
          status: data.status,
          questions: data.questions || [], // Empty if not started
        });

        // ALREADY EVALUATED
        if (data.status === "evaluated") {
          if (data.evaluation) {
            setEvaluation(data.evaluation);
          }
          setMode("result");
          return;
        }

        // ALREADY STARTED (fetch full assessment with questions)
        if (data.status === "started" && data.startedAt) {
          // NOW fetch with questions
          const { data: fullData } = await axios.get(`/api/l2-assessments/${assessmentId}`);
          setAssessment(fullData);

          const startedAt = new Date(data.startedAt).getTime();
          const now = Date.now();
          const limitSeconds = data.timeLimitMinutes * 60;
          const elapsedSeconds = Math.floor((now - startedAt) / 1000);
          const remaining = Math.max(0, limitSeconds - elapsedSeconds);

          if (remaining <= 0) {
            alert("⏰ Time expired. Submitting automatically...");
            await handleSubmit(true);
            return;
          }

          setTimeLeft(remaining);
          setMode("exam");

          // ✅ Re-enable proctoring if exam was in progress
          const examLocked = localStorage.getItem("examLocked");
          if (examLocked === "true") {
            const ok = await startProctoring();
            if (ok) {
              await enterFullscreen(document.documentElement);
            }
          }
          return;
        }

        // NOT STARTED YET
        if (data.status === "sent" || data.status === "generated") {
          setMode("instructions");
          return;
        }

        // ALREADY SUBMITTED
        if (data.status === "submitted") {
          alert("Assessment already submitted. Evaluating...");
          await evaluateAssessment();
          return;
        }

        setMode("instructions");
      } catch (err) {
        console.error("❌ Failed to fetch assessment:", err);

        // ✅ FALLBACK: Try direct fetch (might work if already started)
        if (err.response?.status === 404) {
          try {
            const { data } = await axios.get(`/api/l2-assessments/${assessmentId}`);
            setAssessment(data);

            if (data.status === "started") {
              setMode("exam");
            } else {
              setMode("instructions");
            }
            return;
          } catch (fallbackErr) {
            setError("Assessment not found or not accessible");
            setMode("error");
            return;
          }
        }

        setError(err.response?.data?.message || "Failed to load assessment");
        setMode("error");
      }
    };

    fetchAssessmentMetadata();
  }, [assessmentId]);

  /* =================================
     PREVENT PAGE CLOSE WARNING
  ================================= */
  useEffect(() => {
    const warnUser = (e) => {
      e.preventDefault();
      e.returnValue = "You have an exam in progress. Are you sure you want to leave?";
      return e.returnValue;
    };

    if (mode === "exam") {
      window.addEventListener("beforeunload", warnUser);
    }

    return () => {
      window.removeEventListener("beforeunload", warnUser);
    };
  }, [mode]);

  /* =================================
     COUNTDOWN TIMER
  ================================= */
  useEffect(() => {
    if (mode !== "exam" || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!hasSubmittedRef.current) {
            handleSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [mode, timeLeft]);

  /* =================================
     CLEANUP ON UNMOUNT
  ================================= */
  useEffect(() => {
    return () => {
      if (mode === "exam") {
        stopProctoring();
        exitFullscreen();
        localStorage.removeItem("examLocked");
      }
    };
  }, [mode]);

  /* =================================
     START ASSESSMENT
  ================================= */
  const handleStart = async () => {
    try {
      setMode("loading");

      // ✅ CAPTURE IP & USER AGENT
      const ipAddress = await getPublicIP();
      const userAgent = navigator.userAgent;

      // Start assessment on backend
      const { data: startData } = await axios.post(`/api/l2-assessments/${assessmentId}/start`, {
        ipAddress,
        userAgent,
      });

      // ✅ NOW FETCH FULL ASSESSMENT WITH QUESTIONS
      const { data: fullAssessment } = await axios.get(`/api/l2-assessments/${assessmentId}`);
      setAssessment(fullAssessment);

      // Enable proctoring
      localStorage.setItem("examLocked", "true");

      const ok = await startProctoring();
      if (!ok) {
        alert("Camera/microphone access is required to take this assessment.");
        setMode("instructions");
        return;
      }

      await enterFullscreen(document.documentElement);

      // Set initial time
      setTimeLeft(fullAssessment.timeLimitMinutes * 60);
      setMode("exam");
    } catch (err) {
      console.error("Failed to start assessment:", err);
      alert("Failed to start assessment. Please try again.");
      setMode("instructions");
    }
  };

  /* =================================
     GET PUBLIC IP (OPTIONAL)
  ================================= */
  const getPublicIP = async () => {
    try {
      const res = await axios.get("https://api.ipify.org?format=json");
      return res.data.ip;
    } catch {
      return "unknown";
    }
  };

  /* =================================
     QUIT EXAM
  ================================= */
  const handleQuitExam = async () => {
    const confirmQuit = window.confirm(
      "⚠️ Are you sure you want to quit?\n\nYour exam will be submitted immediately and cannot be resumed."
    );

    if (!confirmQuit) return;

    await handleSubmit(true);
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
  const handleSubmit = async (forced = false) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    setSubmitting(true);

    try {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // ✅ PREPARE TIMING PATTERN
      const timingPatternArray = Object.entries(timingPattern).map(
        ([questionId, timeSpentSeconds]) => ({
          questionId,
          timeSpentSeconds,
        })
      );

      // ✅ PREPARE MCQ ANSWERS
      const mcqAnswers = Object.entries(answers).map(
        ([questionId, selectedIndex]) => ({
          questionId,
          selectedIndex,
        })
      );

      // Submit to backend
      await axios.post(`/api/l2-assessments/${assessmentId}/submit`, {
        mcqAnswers,
        timingPattern: timingPatternArray,
        forced,
      });

      // Evaluate
      await evaluateAssessment();
    } catch (err) {
      if (err.response?.status === 410) {
        // Time expired - auto-submitted
        alert("⏰ Time expired. Your assessment has been auto-submitted.");
        const evaluation = err.response.data?.evaluation;
        if (evaluation) {
          setEvaluation(evaluation);
          setMode("result");
        } else {
          await evaluateAssessment();
        }
      } else if (err.response?.status === 409) {
        // Already submitted
        alert("Assessment already submitted.");
        await evaluateAssessment();
      } else {
        console.error("Submission failed:", err);
        alert("Failed to submit assessment. Please contact support.");
        setSubmitting(false);
        hasSubmittedRef.current = false;
      }
    } finally {
      stopProctoring();
      exitFullscreen();
      localStorage.removeItem("examLocked");
    }
  };

  /* =================================
     EVALUATE ASSESSMENT
  ================================= */
  const evaluateAssessment = async () => {
    try {
      const { data } = await axios.post(
        `/api/l2-assessments/${assessmentId}/evaluate`
      );
      setEvaluation(data.evaluation);
      setMode("result");
    } catch (err) {
      console.error("Evaluation failed:", err);
      alert("Failed to evaluate assessment. Please contact support.");
    } finally {
      setSubmitting(false);
    }
  };

  /* =================================
     FORMAT TIME
  ================================= */
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* =================================
     LOADING STATE
  ================================= */
  if (mode === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  /* =================================
     ERROR STATE
  ================================= */
  if (mode === "error") {
    return (
      <div className="max-w-xl mx-auto p-6 font-poppins text-center">
        <div className="text-red-600 text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-semibold mb-4 text-red-600">Error</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("openTab", { detail: { tab: "applications" } })
            )
          }
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading assessment...</p>
      </div>
    );
  }

  /* =================================
     INSTRUCTIONS VIEW
  ================================= */
  if (mode === "instructions") {
    return (
      <div className="max-w-3xl mx-auto p-6 font-poppins">
        <h2 className="text-2xl font-semibold mb-6">Assessment Instructions</h2>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-800 font-semibold">⚠️ Important Information</p>
          <p className="text-blue-700 text-sm mt-1">
            This assessment requires camera and microphone access for proctoring.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-purple-600 text-xl">📝</div>
            <div>
              <p className="font-semibold">Total Questions</p>
              <p className="text-gray-600">{assessment.questions?.length || 0} questions</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-purple-600 text-xl">⏱️</div>
            <div>
              <p className="font-semibold">Time Limit</p>
              <p className="text-gray-600">{assessment.timeLimitMinutes} minutes</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-purple-600 text-xl">✅</div>
            <div>
              <p className="font-semibold">Passing Score</p>
              <p className="text-gray-600">70% or higher</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-yellow-800 font-semibold mb-2">Rules & Guidelines:</p>
          <ul className="list-disc ml-6 text-yellow-700 text-sm space-y-1">
            <li>Do not refresh or close the browser tab</li>
            <li>Do not switch to other tabs or windows</li>
            <li>Do not exit fullscreen mode</li>
            <li>Camera and microphone must remain on</li>
            <li>Maximum {MAX_VIOLATIONS} violations allowed</li>
          </ul>
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold"
        >
          I Understand - Start Assessment
        </button>
      </div>
    );
  }

  /* =================================
     EXAM VIEW
  ================================= */
  if (mode === "exam") {
    const q = assessment.questions[currentQ];
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = assessment.questions.length;

    return (
      <div className="min-h-screen bg-gray-100 font-poppins flex justify-center">
        <div className="w-full max-w-5xl bg-white shadow-lg rounded-xl p-6 mt-6 mb-6">
          {/* HEADER */}
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                SkillNaav Assessment
              </h2>
              <p className="text-sm text-gray-500">
                Question {currentQ + 1} of {totalQuestions}
              </p>
            </div>

            <div className="flex items-center gap-6">
              {/* TIMER */}
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold text-lg ${timeLeft < 60 ? "text-red-600 animate-pulse" : "text-gray-700"
                    }`}
                >
                  ⏱ {formatTime(timeLeft)}
                </span>
              </div>

              {/* VIOLATIONS */}
              {violationCount > 0 && (
                <div className="text-red-600 text-sm font-semibold">
                  ⚠️ {violationCount}/{MAX_VIOLATIONS} violations
                </div>
              )}

              {/* QUIT BUTTON */}
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
                    ${answers[q.questionId] === idx
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0
                      ${answers[q.questionId] === idx
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

          {/* PROGRESS BAR */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Progress: {answeredCount} answered</span>
              <span>
                {currentQ + 1}/{totalQuestions}
              </span>
            </div>

            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{
                  width: `${((currentQ + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="flex justify-between items-center mb-6">
            <button
              disabled={currentQ === 0}
              onClick={() => setCurrentQ((q) => q - 1)}
              className="px-6 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ◀ Previous
            </button>

            {currentQ === totalQuestions - 1 ? (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className={`px-8 py-2 rounded text-white font-semibold
                  ${submitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                  }
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
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">
              Question Palette
            </h4>

            <div className="grid grid-cols-8 gap-2">
              {assessment.questions.map((qItem, idx) => (
                <button
                  key={qItem.questionId}
                  onClick={() => setCurrentQ(idx)}
                  className={`py-2 rounded text-sm font-semibold transition
                    ${idx === currentQ
                      ? "bg-purple-600 text-white"
                      : answers[qItem.questionId] !== undefined
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
      <div className="max-w-2xl mx-auto p-6 font-poppins">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">
            {evaluation?.pass ? "🎉" : "📊"}
          </div>

          <h2 className="text-3xl font-semibold mb-2">
            Assessment Completed
          </h2>

          <div className="text-5xl font-bold my-6">
            <span
              className={evaluation?.pass ? "text-green-600" : "text-orange-600"}
            >
              {evaluation?.mcqScore}%
            </span>
          </div>

          {evaluation?.pass ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-semibold text-lg">
                ✅ Congratulations! You passed the assessment!
              </p>
              <p className="text-green-700 text-sm mt-2">
                You will be notified about the next steps shortly.
              </p>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-orange-800 font-semibold text-lg">
                Thank you for completing the assessment
              </p>
              <p className="text-orange-700 text-sm mt-2">
                Unfortunately, you did not meet the passing criteria this time.
              </p>
            </div>
          )}

          {evaluation?.feedback && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {evaluation.feedback}
              </p>
            </div>
          )}

          <button
            onClick={() => {
              localStorage.removeItem("activeAssessmentId");
              window.dispatchEvent(
                new CustomEvent("openTab", { detail: { tab: "applications" } })
              );
            }}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-semibold"
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default StudentAssessment;