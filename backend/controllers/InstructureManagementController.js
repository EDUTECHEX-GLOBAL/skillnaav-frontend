// backend/controllers/InstructureManagementController.js
const fs = require("fs");
const path = require("path");
const Instructure = require("../models/webapp-models/InstructureManagementModel");

const fileToMeta = (file) => {
    if (!file) return undefined;
    const url = `/uploads/instructors/${path.basename(file.path)}`;
    return {
        url,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
    };
};

const parsePayload = (req) => {
    // 1) If payload is a text field
    if (req.body && typeof req.body.payload === "string") {
        return JSON.parse(req.body.payload);
    }
    // 2) If payload came as a Blob/file part named "payload"
    if (req.files && req.files.payload && req.files.payload[0]) {
        const f = req.files.payload[0];
        const raw = fs.readFileSync(f.path, "utf8");
        fs.unlink(f.path, () => { });
        return JSON.parse(raw);
    }
    return null;
};

exports.createInstructure = async (req, res) => {
    try {
        const payload = parsePayload(req);
        if (!payload) return res.status(400).json({ message: "Missing payload JSON." });

        if (payload.availableStart && payload.availableEnd && payload.availableEnd <= payload.availableStart) {
            return res.status(400).json({ message: "End Time must be after Start Time." });
        }

        const resumeFile = req.files?.resume?.[0];
        if (!resumeFile) return res.status(400).json({ message: "Resume is required." });

        const photoFile = req.files?.photo?.[0];
        const certFiles = req.files?.certificates || [];

        const doc = {
            ...payload,
            resume: fileToMeta(resumeFile),
            photo: fileToMeta(photoFile),
            certificates: certFiles.map(fileToMeta).filter(Boolean),
        };

        const created = await Instructure.create(doc);
        return res.status(201).json(created);
    } catch (err) {
        console.error("createInstructure error:", err);
        return res.status(500).json({ message: "Failed to create instructure." });
    }
};

exports.listInstructures = async (req, res) => {
    try {
        const { q = "", page = 1, limit = 20 } = req.query;
        const query = q
            ? {
                $or: [
                    { firstName: new RegExp(q, "i") },
                    { lastName: new RegExp(q, "i") },
                    { email: new RegExp(q, "i") },
                    { phone: new RegExp(q, "i") },
                    { city: new RegExp(q, "i") },
                    { state: new RegExp(q, "i") },
                    { specializations: { $in: [new RegExp(q, "i")] } },
                    { skills: { $in: [new RegExp(q, "i")] } },
                    { languages: { $in: [new RegExp(q, "i")] } },
                ],
            }
            : {};

        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Instructure.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Instructure.countDocuments(query),
        ]);

        return res.json({ items, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        console.error("listInstructures error:", err);
        return res.status(500).json({ message: "Failed to fetch instructures." });
    }
};

exports.getInstructure = async (req, res) => {
    try {
        const item = await Instructure.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Instructure not found." });
        return res.json(item);
    } catch (err) {
        console.error("getInstructure error:", err);
        return res.status(500).json({ message: "Failed to fetch instructure." });
    }
};

exports.updateInstructure = async (req, res) => {
    try {
        let patch = {};
        if (req.is("multipart/form-data")) {
            const payload = parsePayload(req);
            if (payload) patch = payload;

            const resumeFile = req.files?.resume?.[0];
            const photoFile = req.files?.photo?.[0];
            const certFiles = req.files?.certificates || [];

            if (resumeFile) patch.resume = fileToMeta(resumeFile);
            if (photoFile) patch.photo = fileToMeta(photoFile);
            if (certFiles.length) patch.certificates = certFiles.map(fileToMeta).filter(Boolean);
        } else {
            patch = req.body || {};
        }

        if (patch.availableStart && patch.availableEnd && patch.availableEnd <= patch.availableStart) {
            return res.status(400).json({ message: "End Time must be after Start Time." });
        }

        const updated = await Instructure.findByIdAndUpdate(req.params.id, patch, { new: true });
        if (!updated) return res.status(404).json({ message: "Instructure not found." });
        return res.json(updated);
    } catch (err) {
        console.error("updateInstructure error:", err);
        return res.status(500).json({ message: "Failed to update instructure." });
    }
};

exports.deleteInstructure = async (req, res) => {
    try {
        const deleted = await Instructure.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Instructure not found." });
        return res.json({ ok: true });
    } catch (err) {
        console.error("deleteInstructure error:", err);
        return res.status(500).json({ message: "Failed to delete instructure." });
    }
};
