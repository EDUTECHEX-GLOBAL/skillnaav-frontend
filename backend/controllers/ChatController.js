const Chat = require("../models/webapp-models/ChatModel");
const Userwebapp = require("../models/webapp-models/userModel"); // Import User model

/**
 * ✅ Get chat messages between Admin & Partner for a specific internship
 */
const getChatMessages = async (req, res) => {
  const { internshipId, partnerId } = req.params;

  console.log("📩 Fetching messages for internshipId:", internshipId, "partnerId:", partnerId);

  try {
    if (!internshipId || !partnerId) {
      return res
        .status(400)
        .json({ error: "Internship ID and Partner ID are required." });
    }

    const messages = await Chat.find({
      internship: internshipId,
      $or: [{ sender: partnerId }, { receiver: partnerId }],
    }).sort({ createdAt: 1 });

    console.log(`✅ Found ${messages.length} messages for partnerId ${partnerId}`);

    return res.status(200).json(messages || []);
  } catch (err) {
    console.error("❌ Error fetching chat messages:", err);
    return res.status(500).json({
      error: "Failed to fetch chat messages",
      details: err.message,
    });
  }
};

/**
 * ✅ Admin/Partner sends a new message
 */
const sendMessage = async (req, res) => {
  const { internshipId, senderId, receiverId, message } = req.body;

  try {
    if (!internshipId || !senderId || !receiverId || !message?.trim()) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const newMessage = await Chat.create({
      internship: internshipId,
      sender: senderId,
      receiver: receiverId,
      message: message.trim(),
    });

    console.log("💬 New message created:", newMessage);

    // If using Socket.IO, emit the message to the room (internshipId)
    if (req.io) {
      req.io.to(internshipId).emit("newMessage", newMessage);
    }

    return res.status(201).json(newMessage);
  } catch (err) {
    console.error("❌ Error sending message:", err);
    return res
      .status(500)
      .json({ error: "Failed to send message", details: err.message });
  }
};

/**
 * ✅ Reply to an existing chat thread
 * (Essentially the same as sendMessage, but kept separate for clarity)
 */
const sendReply = async (req, res) => {
  const { internshipId, senderId, receiverId, message } = req.body;

  try {
    if (!internshipId || !senderId || !receiverId || !message?.trim()) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const newMessage = await Chat.create({
      internship: internshipId,
      sender: senderId,
      receiver: receiverId,
      message: message.trim(),
    });

    console.log("↩️ Reply created:", newMessage);

    if (req.io) {
      req.io.to(internshipId).emit("newMessage", newMessage);
    }

    return res.status(201).json(newMessage);
  } catch (err) {
    console.error("❌ Error sending reply:", err);
    return res
      .status(500)
      .json({ error: "Failed to send reply", details: err.message });
  }
};

/**
 * ✅ Get all messages for a specific internship (no partner filter)
 */
const getMessages = async (req, res) => {
  const { internshipId } = req.params;

  console.log("📥 Fetching all messages for internshipId:", internshipId);

  try {
    if (!internshipId) {
      return res.status(400).json({ error: "Internship ID is required." });
    }

    const messages = await Chat.find({ internship: internshipId }).sort({
      createdAt: 1,
    });

    console.log(`✅ Found ${messages.length} messages for internshipId ${internshipId}`);

    return res.status(200).json(messages || []);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch messages", details: err.message });
  }
};

module.exports = {
  getChatMessages,
  sendMessage,
  sendReply,
  getMessages,
};
