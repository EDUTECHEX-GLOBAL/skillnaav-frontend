// File: adminRoutes.js

const express = require('express');
const { loginUser, verifyLoginOtp, forgotPassword, resetPassword } = require('../../controllers/adminController');
const router = express.Router();

// Login Route
router.post('/login', loginUser);
router.post("/verify-login-otp", verifyLoginOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;