const express = require("express");
const router = express.Router();

const {
  generateAssessment,
  sendAssessment,
  getAssessmentsByInternship,
  getAssessmentsByStudent,
  startAssessment,
  submitAssessment,
  getAssessmentForStudent,
  evaluateAssessment,
} = require("../../controllers/pipeline/assessmentController");

// ✅ IMPORTANT: order matters
router.post("/generate", generateAssessment);
router.post("/:id/send", sendAssessment);

router.post("/:id/start", startAssessment);
router.post("/:id/submit", submitAssessment);
router.post("/:id/evaluate", evaluateAssessment);

router.get("/internship/:internshipId", getAssessmentsByInternship);
router.get("/student/:studentId", getAssessmentsByStudent);
router.get("/:id", getAssessmentForStudent);

module.exports = router;
