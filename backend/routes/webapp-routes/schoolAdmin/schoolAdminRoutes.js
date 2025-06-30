// routes/schoolAdminRoutes.js
const express = require("express");
const router = express.Router();
const {
  registerSchoolAdmin,
  loginSchoolAdmin,
    getAllSchoolAdmins,
    approveSchoolAdmin,
    rejectSchoolAdmin,
    getSchoolAdminProfile,
    updateSchoolAdminProfile,
} = require("../../../controllers/schoolAdmin/schoolAdminController");
const { protectSchool } = require("../../../middlewares/protectSchool");

router.post("/register", registerSchoolAdmin);
router.post("/login", loginSchoolAdmin);
router.get("/schooladmins", getAllSchoolAdmins);
router.patch("/approve/:adminId", approveSchoolAdmin);
router.patch("/reject/:adminId", rejectSchoolAdmin);
router.get("/profile", protectSchool, getSchoolAdminProfile);
router.put("/update-profile", protectSchool, updateSchoolAdminProfile);

module.exports = router;
