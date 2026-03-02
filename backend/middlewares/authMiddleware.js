/**
 * backend/middleware/authMiddleware.js
 *
 * Handles THREE token types that exist in this project:
 *   "token"            → Partner    (set by PartnerLogin.jsx)
 *   "userToken"        → Student    (set by student login)
 *   "schoolAdminToken" → SchoolAdmin (set by school admin login)
 *
 * All three are signed with the same JWT_SECRET, just decoded for different models.
 * The authenticate middleware tries each model in order until one matches.
 */

const jwt          = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Userwebapp   = require('../models/webapp-models/userModel');
const Partnerwebapp = require('../models/webapp-models/partnerModel');

// ── Shared token extractor ────────────────────────────────────────────────────
function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.split(' ')[1];
  }
  return null;
}

// ── Main authenticate middleware ──────────────────────────────────────────────
// Used on all /api/ai/* routes and general app routes.
// Sets req.user and req.isPartner so controllers know who called.
const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
      code: 'NO_TOKEN',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: err.expiredAt,
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid',
      code: 'TOKEN_INVALID',
    });
  }

  // Try Student first
  let user = await Userwebapp.findById(decoded.id).select('-password');
  let isPartner = false;

  // Try Partner if not a student
  if (!user) {
    user = await Partnerwebapp.findById(decoded.id).select('-password');
    if (user) isPartner = true;
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, user not found',
      code: 'NOT_FOUND',
    });
  }

  req.user      = user;
  req.isPartner = isPartner;
  next();
});

// ── Partner-only guard ────────────────────────────────────────────────────────
// Use after authenticate on routes that only partners should access.
const authorizePartner = asyncHandler(async (req, res, next) => {
  if (!req.isPartner) {
    return res.status(403).json({ message: 'Not authorized as partner' });
  }
  next();
});

// ── Admin-only guard ──────────────────────────────────────────────────────────
const authorizeAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Not authorized as admin' });
  }
  next();
});

// ── Partner-specific middleware (kept for existing partner routes) ─────────────
// Same as authenticate but only accepts partner tokens.
const partnerProtect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.partner = await Partnerwebapp.findById(decoded.id).select('-password');

    if (!req.partner) {
      return res.status(401).json({ message: 'Not authorized, partner not found' });
    }
    next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError'
      ? 'Not authorized, token expired'
      : error.name === 'JsonWebTokenError'
        ? 'Not authorized, token invalid'
        : 'Not authorized, token failed';
    res.status(401).json({ message });
  }
});

module.exports = {
  authenticate,
  authorizePartner,
  authorizeAdmin,
  partnerProtect,
};