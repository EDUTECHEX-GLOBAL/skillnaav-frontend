const express = require("express");
const router = express.Router();
const {
  getChatMessages,
  sendMessage,
  getMessages,
} = require("../../controllers/ChatController");

// Partner view: get all messages for a specific internship thread
router.get("/partner/:partnerId/internship/:internshipId", getChatMessages);

// Admin view: get all messages for a specific internship
router.get("/internship/:internshipId", getMessages);

// Send a message — works for both partner->admin and admin->partner
router.post("/send", sendMessage);

module.exports = router;