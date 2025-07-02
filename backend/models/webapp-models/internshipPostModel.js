/**
 *  InternshipPosting  ‒  MongoDB schema
 *  -------------------------------------------------------------
 *  ▸ Added   timestamps:true   → enables createdAt / updatedAt
 *  ▸ Added   versionKey:false  → hides “__v” field
 *  ▸ Switched to   new mongoose.Schema(...)   (same functionality,
 *    but matches other models in the project).
 */

const mongoose = require("mongoose");

const internshipPostingSchema = new mongoose.Schema(
  {
    jobTitle:      { type: String, required: true },
    companyName:   { type: String, required: true },
    location:      { type: String, required: true },
    jobDescription:{ type: String, required: true },

    startDate:         { type: Date,   required: true },
    endDateOrDuration: { type: String, required: true }, // date or duration
    duration:          { type: String, required: true }, // "2 months" etc.

    /* --------- internship type --------- */
    internshipType: {
      type:    String,
      enum:    ["FREE", "STIPEND", "PAID"],
      required:true,
    },

    /* --------- internship mode --------- */
    internshipMode: {
      type:    String,
      enum:    ["OFFLINE", "ONLINE", "HYBRID"],
      default: "ONLINE",
      required:true,
    },

    /* --------- compensation --------- */
    compensationDetails: {
      type: {
        type:   String,
        enum:   ["FREE", "STIPEND", "PAID"],
        required:true,
      },
      amount:    { type: Number },
      currency:  { type: String },
      frequency: { type: String, enum: ["MONTHLY", "WEEKLY", "ONE_TIME"] },
      benefits:  { type: [String] },
      additionalCosts: [
        {
          description:{ type: String },
          amount:     { type: Number },
          currency:   { type: String },
        },
      ],
    },

    partnerId:      { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
    qualifications: { type: [String], required: true },

    /* --------- contact --------- */
    contactInfo: {
      name:  { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },

    /* --------- misc --------- */
    imgUrl:          { type: String, default: "https://default-image-url.com/image.png" },

    studentApplied:  { type: Boolean, default: false },
    adminApproved:   { type: Boolean, default: false },
    adminReviewed:   { type: Boolean, default: false },
    deleted:         { type: Boolean, default: false },
  },
  {
    versionKey: false,   // hide "__v"
    timestamps: true,    // adds createdAt / updatedAt (needed for RAG sorting)
  }
);

module.exports = mongoose.model("InternshipPosting", internshipPostingSchema);
