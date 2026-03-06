// File: adminController.js

const User = require('../models/webapp-models/adminModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require("../utils/SendAdminOtp");

// Login Controller
// Login Controller (Step-1: Verify password + send OTP)
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Hash OTP + store expiry (10 minutes)
    user.loginOtpHash = await bcrypt.hash(otp, 10);
    user.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // ✅ Respond immediately (no token yet)
    res.status(200).json({
      otpRequired: true,
      message: "OTP sent to your email.",
      email: user.email,
    });

    // ✅ Send OTP email in background
    setImmediate(async () => {
      try {
        await sendEmail({
          to: user.email,
          subject: "SkillNaav Admin Login OTP",
          text: `Your login OTP is ${otp}. It will expire in 10 minutes.`,
        });
      } catch (err) {
        console.error("❌ Admin Login OTP email failed:", err.message || err);
      }
    });

    return;
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
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

// ✅ Verify Login OTP (Step-2: Verify OTP + return token)
const verifyLoginOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.loginOtpHash || !user.loginOtpExpires) {
      return res.status(400).json({ message: "OTP not requested. Please login again." });
    }

    if (user.loginOtpExpires < new Date()) {
      user.loginOtpHash = null;
      user.loginOtpExpires = null;
      await user.save();
      return res.status(400).json({ message: "OTP expired. Please login again." });
    }

    const isOtpMatch = await bcrypt.compare(otp, user.loginOtpHash);
    if (!isOtpMatch) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // ✅ Clear OTP after successful verification
    user.loginOtpHash = null;
    user.loginOtpExpires = null;
    await user.save();

    // ✅ Generate JWT Token (same as your old login response)
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || "yoursecretkey",
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  loginUser,
  verifyLoginOtp,
  forgotPassword,
  resetPassword,
};