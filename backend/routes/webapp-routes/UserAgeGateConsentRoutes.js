const express = require("express");
const router = express.Router();

const {
    saveUserAgeGateConsent,
    getMyUserAgeGateConsent,
    requestAgeReverification,
} = require("../../controllers/UserAgeGateConsentControllers");

const { authenticate } = require("../../middlewares/authMiddleware");
const { profilePicUpload } = require("../../utils/multer");

router.post(
    "/",
    authenticate,
    profilePicUpload.single("ageVerificationPhoto"), // ✅ same like profileImage flow
    saveUserAgeGateConsent
);

router.get("/", authenticate, getMyUserAgeGateConsent);

// ✅ Admin: request selfie re-verification
router.patch("/request-reverify/:userId", requestAgeReverification);

module.exports = router;