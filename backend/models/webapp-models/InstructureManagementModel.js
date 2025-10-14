    // backend/models/webapp-models/InstructureManagementModel.js
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
    {
        url: String,          // served from /uploads/instructors/...
        originalName: String,
        mimeType: String,
        size: Number,
    },
    { _id: false }
);

const InstructureSchema = new mongoose.Schema(
    {
        // Personal & Contact
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true, index: true },
        phone: { type: String, required: true, trim: true },
        altPhone: { type: String, trim: true },

        country: { type: String, trim: true },
        state: { type: String, trim: true },
        city: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        address1: { type: String, trim: true },
        address2: { type: String, trim: true },

        // Professional & Teaching
        qualification: { type: String, trim: true },
        experienceYears: { type: Number, min: 0 },
        organization: { type: String, trim: true },
        specializations: [{ type: String, trim: true }],
        skills: [{ type: String, trim: true }],
        languages: [{ type: String, trim: true }],
        teachingMode: { type: String, trim: true },
        bio: { type: String, trim: true },

        // Availability
        availableDays: [{ type: String, trim: true }],
        availableStart: { type: String, trim: true }, // "HH:mm"
        availableEnd: { type: String, trim: true }, // "HH:mm"
        timezone: { type: String, trim: true },

        // Compensation / Payout
        rateType: { type: String, trim: true },
        expectedRate: { type: Number, min: 0 },
        currency: { type: String, trim: true },
        payoutMethod: { type: String, trim: true },
        payoutIdentifier: { type: String, trim: true },

        // Compliance & Documents
        backgroundCheck: { type: String, trim: true },
        ndaSigned: { type: Boolean, default: false },
        agreeToTerms: { type: Boolean, default: false },

        // Assignment
        assignInternship: { type: String, trim: true },
        notes: { type: String, trim: true },

        // Files
        resume: fileSchema,     // required by controller
        photo: fileSchema,     // optional
        certificates: [fileSchema],   // optional
    },
    { timestamps: true }
);

module.exports = mongoose.model("Instructure", InstructureSchema);
