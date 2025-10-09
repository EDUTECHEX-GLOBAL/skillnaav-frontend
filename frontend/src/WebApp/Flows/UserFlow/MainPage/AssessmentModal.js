import React, { useState, useEffect } from "react";
import axios from "axios";

const AssessmentModal = ({ assessment, studentId, onClose }) => {
  const [answers, setAnswers] = useState(Array(assessment.questions.length).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Automatically check for a submission any time the modal is opened
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await axios.get(`/api/assessments/submission/${studentId}/${assessment._id}`);
        if (res.data.submission) {
          setSubmission(res.data.submission);
          setShowResults(true);
        } else {
          setShowResults(false);
        }
      } catch (err) {
        setShowResults(false);
      }
    };
    fetchSubmission();
  }, [assessment._id, studentId]);

  const handleOptionSelect = (index, optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[index] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.includes(null)) return alert("Please answer all questions.");

    const payload = {
      assessmentId: assessment._id,
      studentId,
      responses: assessment.questions.map((q, i) => ({
        questionText: q.questionText,
        options: q.options,
        studentAnswer: answers[i],
        correctAnswer: q.correctAnswer,
        marks: q.marks || 1,
      })),
      timeTaken: 0,
    };

    setSubmitting(true);
    try {
      await axios.post("/api/assessments/submit", payload);
      // Fetch submission again to show results mode
      const res = await axios.get(`/api/assessments/submission/${studentId}/${assessment._id}`);
      setSubmission(res.data.submission);
      setShowResults(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = answers.filter((a) => a !== null).length;
  const totalQuestions = assessment.questions.length;

  if (showResults && submission) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] overflow-y-auto p-8 flex flex-col relative">
          <div className="mb-2 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Assessment Results</h2>
            <p className="text-md text-gray-600 mb-4">
              Score: {submission.score}/{submission.totalMarks} ({Math.round(submission.percentage)}%)
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
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
                      className={`p-2 my-1 rounded-xl flex items-center ${
                        isUser
                          ? resp.isCorrect
                            ? "bg-green-100 border border-green-400"
                            : "bg-red-100 border border-red-400"
                          : isCorrect
                          ? "bg-green-50 border border-green-200"
                          : ""
                      }`}
                    >
                      <span>
                        <b>{label}</b>
                        {option}
                        {isUser && <span> (Your Answer)</span>}
                        {isCorrect && <span> (Correct Answer)</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] overflow-y-auto p-8 flex flex-col relative">
        {/* Header */}
        <div className="mb-2 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Internship Assessment</h2>
          <p className="text-md text-gray-500 mb-4">Answer all questions before submitting</p>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-sm text-gray-500">Progress:</span>
            <div className="w-48 bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-purple-500 h-2.5 rounded-full"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 ml-2">
              {answeredCount}/{totalQuestions}
            </span>
          </div>
          <button
            onClick={onClose}
            className="absolute top-5 right-7 text-gray-400 hover:text-gray-700 text-2xl font-bold transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto">
          {assessment.questions.map((q, i) => (
            <div key={i} className="mb-6 p-5 border rounded-xl bg-gray-50 shadow-sm">
              <p className="font-semibold text-gray-700 mb-3 text-lg">
                {i + 1}. {q.questionText}
              </p>
              <div className="flex flex-col gap-4">
                {q.options.map((opt, j) => (
                  <label
                    key={j}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                      answers[i] === j
                        ? "bg-purple-100 border-2 border-purple-600 shadow"
                        : "hover:bg-gray-100 border"
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
                    <span className="text-gray-800">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 left-0 bg-white py-4 mt-4 flex justify-end gap-4 border-t">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentModal;
