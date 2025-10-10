import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useProctoring } from "./useProctoring"; // ✅ Changed to named import

const ProctoredAssessment = ({ assessment, studentId, onClose }) => {
  const [answers, setAnswers] = useState(Array(assessment.questions.length).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const containerRef = useRef(null);
  const [startTime, setStartTime] = useState(null);

  const handleViolation = (violation, count) => {
    setWarningMessage(`⚠️ Violation detected: ${violation.message}. Total violations: ${count}`);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 5000);

    // Auto-submit after 3 violations
    if (count >= 3) {
      alert('Too many violations detected. Assessment will be auto-submitted.');
      handleSubmit(true);
    }
  };

  const {
    violations,
    stream,
    isFullscreen,
    videoRef,
    startProctoring,
    stopProctoring,
    enterFullscreen,
    exitFullscreen,
    violationCount
  } = useProctoring(handleViolation);

  // Check for existing submission
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await axios.get(`/api/assessments/submission/${studentId}/${assessment._id}`);
        if (res.data.submission) {
          setSubmission(res.data.submission);
          setShowResults(true);
        }
      } catch (err) {
        // No submission found
      }
    };
    fetchSubmission();
  }, [assessment._id, studentId]);

  // Start proctoring and fullscreen
  const handleStartAssessment = async () => {
    const mediaAccess = await startProctoring();
    if (!mediaAccess) {
      alert('You must grant camera and microphone access to proceed.');
      return;
    }

    if (containerRef.current) {
      await enterFullscreen(containerRef.current);
    }

    setIsReady(true);
    setStartTime(Date.now());
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProctoring();
      exitFullscreen();
    };
  }, [stopProctoring, exitFullscreen]); // ✅ Added dependencies

  const handleOptionSelect = (index, optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[index] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!isAutoSubmit && answers.includes(null)) {
      return alert("Please answer all questions.");
    }

    const timeTaken = Math.floor((Date.now() - startTime) / 1000); // in seconds

    const payload = {
      assessmentId: assessment._id,
      studentId,
      responses: assessment.questions.map((q, i) => ({
        questionText: q.questionText,
        options: q.options,
        studentAnswer: answers[i] ?? -1,
        correctAnswer: q.correctAnswer,
        marks: q.marks || 1,
        topic: q.topic || null
      })),
      timeTaken,
      violations: violations,
      violationCount: violationCount,
      isAutoSubmit: isAutoSubmit,
      proctoringData: {
        mode: 'real',
        cameraEnabled: !!stream,
        microphoneEnabled: !!stream,
        fullscreenEnabled: isFullscreen,
        startedAt: new Date(startTime)
      }
    };

    setSubmitting(true);
    try {
      const response = await axios.post("/api/assessments/submit", payload);
      
      // Show warnings if violations detected
      if (response.data.warnings) {
        alert(response.data.warnings.message);
      }

      const res = await axios.get(`/api/assessments/submission/${studentId}/${assessment._id}`);
      setSubmission(res.data.submission);
      setShowResults(true);
      stopProctoring();
      await exitFullscreen();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already submitted')) {
        alert("You have already submitted this assessment.");
        // Fetch and show existing submission
        try {
          const res = await axios.get(`/api/assessments/submission/${studentId}/${assessment._id}`);
          setSubmission(res.data.submission);
          setShowResults(true);
          stopProctoring();
          await exitFullscreen();
        } catch (fetchErr) {
          console.error("Error fetching existing submission:", fetchErr);
        }
      } else {
        alert("Failed to submit assessment. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = async () => {
    stopProctoring();
    await exitFullscreen();
    onClose();
  };

  const answeredCount = answers.filter((a) => a !== null).length;
  const totalQuestions = assessment.questions.length;

  // Results view
  if (showResults && submission) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] overflow-y-auto p-8">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Results</h2>
            <p className="text-lg text-gray-600 mb-2">
              Score: <span className="font-bold text-purple-600">{submission.score}/{submission.totalMarks}</span> ({Math.round(submission.percentage)}%)
            </p>
            <p className="text-sm text-gray-500">
              Time Taken: {Math.floor(submission.timeTaken / 60)}m {submission.timeTaken % 60}s
            </p>
            {submission.violationCount > 0 && (
              <p className="text-sm text-red-600 mt-2">
                Violations Detected: {submission.violationCount}
              </p>
            )}
          </div>

          <div className="overflow-y-auto max-h-[60vh]">
            {submission.responses.map((resp, idx) => (
              <div key={idx} className="mb-6 p-5 border rounded-xl bg-gray-50 shadow-sm">
                <p className="font-semibold text-gray-700 mb-3 text-lg">
                  {idx + 1}. {resp.questionText}
                </p>
                {resp.options.map((option, optIdx) => {
                  const label = String.fromCharCode(65 + optIdx) + ") ";
                  const isUser = resp.studentAnswer === optIdx;
                  const isCorrect = resp.correctAnswer === optIdx;
                  return (
                    <div
                      key={optIdx}
                      className={`p-3 my-2 rounded-lg flex items-center ${
                        isUser
                          ? resp.isCorrect
                            ? "bg-green-100 border-2 border-green-500"
                            : "bg-red-100 border-2 border-red-500"
                          : isCorrect
                          ? "bg-green-50 border border-green-300"
                          : "bg-gray-50"
                      }`}
                    >
                      <span>
                        <b>{label}</b>
                        {option}
                        {isUser && <span className="ml-2 font-semibold">(Your Answer)</span>}
                        {isCorrect && !isUser && <span className="ml-2 font-semibold text-green-700">(Correct)</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={handleExit}
              className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pre-assessment instructions
  if (!isReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Proctored Assessment Instructions
          </h2>
          
          <div className="mb-6 p-6 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <h3 className="font-bold text-lg mb-3">⚠️ Important Rules:</h3>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Camera and microphone will be monitored throughout</li>
              <li>✓ The assessment will run in fullscreen mode</li>
              <li>✓ Switching tabs or windows will be recorded as a violation</li>
              <li>✓ Using keyboard shortcuts will be blocked</li>
              <li>✓ After 3 violations, the test will auto-submit</li>
              <li>✓ Ensure you're in a quiet, well-lit environment</li>
              <li>✓ Do not leave your seat during the assessment</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Assessment Details:</h3>
            <p className="text-gray-600">Total Questions: {assessment.questions.length}</p>
            <p className="text-gray-600">Total Marks: {assessment.questions.reduce((sum, q) => sum + (q.marks || 1), 0)}</p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleExit}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleStartAssessment}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold"
            >
              I Agree - Start Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main assessment view
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-purple-900 to-indigo-900 z-50 overflow-hidden"
    >
      {/* Warning Banner */}
      {showWarning && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          {warningMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-lg p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Internship Assessment</h2>
          <p className="text-sm text-gray-500">Stay focused - This session is being monitored</p>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Progress:</span>
            <div className="w-32 bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full transition-all"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {answeredCount}/{totalQuestions}
            </span>
          </div>

          {/* Violation Counter */}
          <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-lg">
            <span className="text-sm font-semibold text-red-600">
              Violations: {violationCount}/3
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Questions Section */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {assessment.questions.map((q, i) => (
            <div key={i} className="mb-8 p-6 border-2 rounded-xl bg-gray-50 shadow-md">
              <p className="font-bold text-gray-800 mb-4 text-lg">
                Question {i + 1}: {q.questionText}
              </p>
              <div className="flex flex-col gap-3">
                {q.options.map((opt, j) => (
                  <label
                    key={j}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                      answers[i] === j
                        ? "bg-purple-100 border-2 border-purple-600 shadow-lg"
                        : "hover:bg-gray-100 border-2 border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${i}`}
                      value={j}
                      checked={answers[i] === j}
                      onChange={() => handleOptionSelect(i, j)}
                      className="accent-purple-600 w-5 h-5"
                    />
                    <span className="text-gray-800 font-medium">
                      {String.fromCharCode(65 + j)}) {opt}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Proctoring Sidebar */}
        <div className="w-80 bg-gray-900 text-white p-6 flex flex-col">
          <h3 className="text-xl font-bold mb-4">Live Monitoring</h3>
          
          {/* Camera Feed */}
          <div className="mb-6">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full rounded-lg border-2 border-purple-500"
            />
            <p className="text-xs text-gray-400 mt-2 text-center">
              📹 Your camera is active
            </p>
          </div>

          {/* Violation Log */}
          <div className="flex-1 overflow-y-auto mb-4">
            <h4 className="font-semibold mb-2 text-purple-300">Violation Log:</h4>
            {violations.length === 0 ? (
              <p className="text-sm text-gray-400">No violations detected</p>
            ) : (
              <div className="space-y-2">
                {violations.map((v, idx) => (
                  <div key={idx} className="bg-red-900 p-2 rounded text-xs">
                    <p className="font-semibold">{v.type}</p>
                    <p className="text-gray-300">{v.message}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(v.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="w-full mt-auto px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProctoredAssessment;
