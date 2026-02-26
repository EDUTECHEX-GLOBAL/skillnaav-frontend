const mongoose = require("mongoose");
const Resume = require("../models/webapp-models/resumeModel");

const uploadResume = async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Resume required" });
    }

    const newResume = new Resume({
      userId,
      fileUrl: file.location,
      fileName: file.originalname,
    });

    await newResume.save();

    res.status(201).json({
      message: "Resume uploaded",
      resume: newResume,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

const getUserResumes = async (req, res) => {
  try {
    const { userId } = req.params;

    const resumes = await Resume.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ uploadedAt: -1 });

    res.json({ resumes });
  } catch (err) {
    console.error("Error fetching resumes:", err);
    res.status(500).json({ message: "Error fetching resumes" });
  }
};

module.exports = { uploadResume, getUserResumes };