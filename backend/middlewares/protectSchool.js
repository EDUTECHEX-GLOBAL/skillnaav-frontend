const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const SchoolAdmin = require("../models/webapp-models/schoolAdmin/SchoolAdminModel");

const protectSchool = asyncHandler(async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.schoolAdmin = await SchoolAdmin.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});

module.exports = { protectSchool };
