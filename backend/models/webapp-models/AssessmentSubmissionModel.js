const mongoose = require("mongoose");

// Schema for each question response
const responseSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: { type: [String], required: true }, // All 4 options
  correctAnswer: { type: Number, required: true }, // 1-based index
  studentAnswer: { type: Number, required: true }, // 1-based index
  isCorrect: { type: Boolean, required: true },
  marks: { type: Number, required: true },
  topic: { type: String }, // optional, useful for AI feedback
});

// Main submission schema
const assessmentSubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Userwebapp",
    required: true,
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InternshipAssessment",
    required: true,
  },
  responses: [responseSchema], // Student answers with details
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
  timeTaken: { type: Number, required: true }, // in seconds
  fitStatus: { type: String, enum: ["fit", "not fit"], required: true }, // optional pass/fail label
  submittedAt: { type: Date, default: Date.now },

  // Optional proctoring session info
  proctoringSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProctoringSession",
  },
  proctoringData: {
    mode: { type: String, enum: ["test", "real"] },
    violationCount: { type: Number, default: 0 },
    sessionDuration: { type: Number }, // in seconds
  },
});

module.exports = mongoose.model("AssessmentSubmission", assessmentSubmissionSchema);
