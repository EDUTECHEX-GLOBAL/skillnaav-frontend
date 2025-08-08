const express = require("express");
const router = express.Router();
const {
  getTemplatesByPartner,
  createTemplate,
  deleteTemplate,
  uploadImage,
} = require("../../controllers/offerTemplateController");

const { imageUploader } = require("../../utils/multer");

router.post(
  "/upload-image",
  imageUploader("offer-template-images").single("image"),
  uploadImage
);

router.get("/", getTemplatesByPartner);
router.post("/", createTemplate);
router.delete("/:templateId", deleteTemplate);

module.exports = router;
