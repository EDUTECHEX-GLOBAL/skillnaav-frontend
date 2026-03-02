/**
 * backend/routes/webapp-routes/Airoutes.js
 *
 * Path map from THIS file:
 *   ../../middleware/authMiddleware   → backend/middleware/authMiddleware.js  ✅
 *   ../../controllers/aiController   → backend/controllers/aiController.js   ✅
 *
 * Add to server.js:
 *   app.use('/api/ai', require('./routes/webapp-routes/Airoutes'));
 *
 * Run once if not already installed:
 *   npm install multer
 */

const express = require('express');
const multer  = require('multer');
const router  = express.Router();

// ✅ Destructure so a missing export fails loudly at startup, not silently at runtime
const { authenticate }      = require('../../middlewares/authMiddleware');
const {
  shortlistCandidates,
  getShortlistedByAdmin,
  getShortlisted,
  analyzeSkills,
  extractResume,
  generateCV,
  assignInstructors,
} = require('../../controllers/aicontroller');

// multer: memory storage, PDF/DOCX only, 10MB max
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF and DOCX files are allowed'));
  },
});

// ── Shortlisting ──────────────────────────────────────────────────────────────
router.post('/partner/shortlist',                authenticate, shortlistCandidates);
router.get('/partner/shortlisted/by-admin',      authenticate, getShortlistedByAdmin);
router.get('/partner/shortlisted/:internshipId', authenticate, getShortlisted);

// ── Skill Analysis (Bedrock) ──────────────────────────────────────────────────
router.post('/analyze-skills', authenticate, upload.single('file'), analyzeSkills);

// ── Resume + CV ───────────────────────────────────────────────────────────────
router.post('/extract-resume', authenticate, extractResume);
router.post('/cv/generate',    authenticate, generateCV);

// ── Instructor Assignment ─────────────────────────────────────────────────────
router.post('/assign-instructors', authenticate, assignInstructors);

module.exports = router;