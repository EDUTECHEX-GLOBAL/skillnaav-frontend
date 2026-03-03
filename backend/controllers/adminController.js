// File: adminController.js

const User = require('../models/webapp-models/adminModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require("../utils/SendAdminOtp");

// Login Controller
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'yoursecretkey',
      { expiresIn: '1h' }
    );

    // Send response
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    // ✅ Always return same message (security best practice)
    if (!user) {
      return res.status(200).json({ message: "If this email exists, OTP has been sent." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP and store with expiry (10 minutes)
    const otpHash = await bcrypt.hash(otp, 10);
    user.resetPasswordOtpHash = otpHash;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // ✅ Respond immediately (fast)
    res.status(200).json({ message: "If this email exists, OTP has been sent." });

    // ✅ Send email in background (do NOT block API response)
    setImmediate(async () => {
      try {
        await sendEmail({
          to: user.email,
          subject: "SkillNaav Admin Password Reset OTP",
          text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
        });
      } catch (err) {
        console.error("❌ Admin OTP email failed:", err.message || err);
      }
    });

    return;
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ Reset Password - Verify OTP and Update Password (hashed)
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.resetPasswordOtpHash || !user.resetPasswordOtpExpires) {
      return res.status(400).json({ message: "Invalid request. Please try again." });
    }

    if (user.resetPasswordOtpExpires < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }

    const isOtpMatch = await bcrypt.compare(otp, user.resetPasswordOtpHash);
    if (!isOtpMatch) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // ✅ Hash new password and save to MongoDB
    user.password = await bcrypt.hash(newPassword, 10);

    // Clear OTP fields
    user.resetPasswordOtpHash = null;
    user.resetPasswordOtpExpires = null;

    await user.save();

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  loginUser,
  forgotPassword,
  resetPassword,
};