const express = require('express');
const router = express.Router();
const { googleAuth, googleCallback, updateScheduleInGoogleCalendar } = require('../../controllers/GoogleController');

router.get('/auth', googleAuth);
router.get('/callback', googleCallback);
router.post('/update-schedule', updateScheduleInGoogleCalendar);

module.exports = router;