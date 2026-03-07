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
  trackSuspiciousActivity,
} = require("../../controllers/pipeline/assessmentController");

// ✅ RULE: All fixed-path and sub-path routes MUST be declared BEFORE /:id
// Express matches top-to-bottom. If GET /:id comes first, it will match
// POST /generate, GET /internship/*, POST /:id/send — causing silent 404s.

// ── Fixed paths ──────────────────────────────────────────────────────────────
router.post("/generate", generateAssessment);
router.get("/internship/:internshipId", getAssessmentsByInternship);
router.get("/student/:studentId", getAssessmentsByStudent);

// ── Sub-paths on a specific ID (must come before bare /:id) ──────────────────
router.post("/:id/send", sendAssessment);
router.post("/:id/start", startAssessment);
router.post("/:id/submit", submitAssessment);
router.post("/:id/evaluate", evaluateAssessment);
router.post("/:id/track-activity", trackSuspiciousActivity);

// ── Bare /:id — MUST be last ──────────────────────────────────────────────────
router.get("/:id", getAssessmentForStudent);

module.exports = router;