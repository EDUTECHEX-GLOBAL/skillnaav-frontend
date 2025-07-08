// routes/offerLetterRoutes.js
const express = require('express');
const router = express.Router();
const { sendOfferLetter, getOfferLetterByStudent, updateOfferStatus, getOffersByInternship } = require('../../controllers/offerLetterController');


router.post('/', sendOfferLetter);  // Handles POST /api/offer-letters
router.get('/:studentId', getOfferLetterByStudent); // GET Offer Letter
router.patch('/:id/status', updateOfferStatus);     // PATCH Accept/Reject
router.get("/internship/:internshipId", getOffersByInternship);


module.exports = router;