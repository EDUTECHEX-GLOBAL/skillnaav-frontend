const express = require('express');
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
} = require('../../controllers/pipeline/assessmentController');

router.post('/generate', generateAssessment);
router.post('/:id/send', sendAssessment);

// student routes
router.get('/:id', getAssessmentForStudent);
router.post('/:id/start', startAssessment);
router.post('/:id/submit', submitAssessment);
router.post('/:id/evaluate', evaluateAssessment);
router.post('/:id/track-activity', trackSuspiciousActivity);

// list routes  
router.get('/internship/:internshipId', getAssessmentsByInternship);
router.get('/student/:studentId', getAssessmentsByStudent);


module.exports = router;