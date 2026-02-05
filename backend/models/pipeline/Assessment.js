const mongoose = require("mongoose");

const { Schema } = mongoose;

/**
 * Assessment
 * Level 2: MCQ single-correct assessment with optional text answer and optional file uploads (S3 URLs).
 * Note: correctIndex is stored as a hash to avoid leaking answers if payload is exposed.
 */
const AssessmentSchema = new Schema(
  {
    internshipId: { type: Schema.Types.ObjectId, ref: "InternshipPost", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true, index: true },

    type: { type: String, enum: ["MCQ_SINGLE_CORRECT"], default: "MCQ_SINGLE_CORRECT" },

    // Snapshot of the config used at generation time (audit-safe)
    configSnapshot: {
      allowText: { type: Boolean, default: false },
      allowFileUpload: { type: Boolean, default: false },
      difficulty: { type: Number, default: 1 },
      questionCount: { type: Number, default: 10 },
      timeLimitMinutes: { type: Number, default: 20 },
      passScore: { type: Number, default: 70 },
    },

    attempt: { type: Number, default: 1 },

    status: {
      type: String,
      enum: ["generated", "sent", "started", "submitted", "evaluated", "expired"],
      default: "generated",
      index: true,
    },

    // Timing + anti-cheat basics (kept lightweight)
    timing: {
      timeLimitMinutes: { type: Number, default: 20 },
      startedAt: { type: Date, default: null },
      submittedAt: { type: Date, default: null },
    },

    // Generated questions
    questions: [
      {
        questionId: { type: String, required: true },
        question: { type: String, required: true },
        options: { type: [String], required: true, validate: (v) => Array.isArray(v) && v.length >= 2 },
        correctIndexHash: { type: String, required: true }, // hash of correctIndex
        explanation: { type: String, default: null }, // optional internal explanation
      },
    ],

    // Student submission
    submission: {
      mcqAnswers: [
        {
          questionId: { type: String, required: true },
          selectedIndex: { type: Number, required: true },
        },
      ],
      textAnswer: { type: String, default: null },
      files: [
        {
          url: { type: String, required: true },
          name: { type: String, default: null },
          size: { type: Number, default: null },
          mime: { type: String, default: null },
        },
      ],
    },

    // Evaluation
    evaluation: {
      mcqScore: { type: Number, default: null },      // percentage 0-100
      finalScore: { type: Number, default: null },    // percentage 0-100
      pass: { type: Boolean, default: null },
      feedback: { type: String, default: null },
      evaluatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Query speed
AssessmentSchema.index({ internshipId: 1, status: 1, updatedAt: -1 });
AssessmentSchema.index({ studentId: 1, status: 1, updatedAt: -1 });

// Uniqueness per attempt (allows multiple attempts later if you choose)
AssessmentSchema.index({ internshipId: 1, studentId: 1, attempt: 1 }, { unique: true });

module.exports = mongoose.model("Assessment", AssessmentSchema);
