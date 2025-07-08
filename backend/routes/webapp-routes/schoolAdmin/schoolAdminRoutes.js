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
    uploadStudentsFromCSV,
     activateFreeSubscription,
     getDashboardMetrics,
  getStudentsBySchoolAdmin,
} = require("../../../controllers/schoolAdmin/schoolAdminController");
const { protectSchool } = require("../../../middlewares/protectSchool");
const { csvUpload } = require("../../../utils/multer");


router.post("/register", registerSchoolAdmin);
router.post("/login", loginSchoolAdmin);
router.get("/schooladmins", getAllSchoolAdmins);
router.patch("/approve/:adminId", approveSchoolAdmin);
router.patch("/reject/:adminId", rejectSchoolAdmin);
router.get("/profile", protectSchool, getSchoolAdminProfile);
router.put("/update-profile", protectSchool, updateSchoolAdminProfile);
router.post(
  "/upload-students",
  protectSchool,
  csvUpload.single("csvFile"),
  uploadStudentsFromCSV
);
router.post("/activate-free", protectSchool, activateFreeSubscription);
router.get("/dashboard-metrics", protectSchool, getDashboardMetrics);
router.get("/students", protectSchool, getStudentsBySchoolAdmin);




module.exports = router;
