// models/OfferLetter.js
const mongoose = require("mongoose");

const offerLetterSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Student"
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  position: { type: String, required: true },
  startDate: { type: Date, required: true },
  internshipId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Internship"
  },
  companyName: String,
  location: String,
  duration: String,
  stipend: {
    amount: Number,
    currency: String,
    frequency: String
  },
  jobDescription: String,
  qualifications: [String],
  contactInfo: {
    name: String,
    email: String,
    phone: String
  },
  status: {
    type: String,
    enum: ["Sent", "Accepted", "Rejected"],
    default: "Sent"
  },
  sentDate: { type: Date, default: Date.now },
  s3Url: { type: String },

  // ✅ Important fix: added missing comma above
  schoolAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SchoolAdmin",
    default: null
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

module.exports = mongoose.model("OfferLetter", offerLetterSchema);
