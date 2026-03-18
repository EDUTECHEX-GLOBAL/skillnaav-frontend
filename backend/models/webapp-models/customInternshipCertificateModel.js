//File: customInternshipCertificateModel.js

const mongoose = require("mongoose");

const customInternshipCertificateSchema = new mongoose.Schema(
    {
        partnerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Partner",
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        fileName: {
            type: String,
            default: "",
            trim: true,
        },
        imageUrl: {
            type: String,
            required: true,
            trim: true,
        },
        s3Key: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "CustomInternshipCertificate",
    customInternshipCertificateSchema
);