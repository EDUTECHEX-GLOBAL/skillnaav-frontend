const Chat = require("../models/webapp-models/ChatModel");
// Import the admin model — collection is 'adminwebapps', field is isAdmin: true
const Admin = require("../models/webapp-models/adminModel");

// Get admin _id from DB dynamically
const getAdminId = async () => {
  const admin = await Admin.findOne({ isAdmin: true }).select("_id").lean();
  if (!admin) {
    console.error("getAdminId: No document found with isAdmin: true in adminwebapps collection.");
    console.error("Run in mongo shell: db.adminwebapps.findOne({ isAdmin: true })");
    throw new Error("No admin user found in the database.");
  }
  console.log("getAdminId resolved:", admin._id.toString());
  return admin._id.toString();
};

// Partner -> Admin : receiver = admin (from DB)
// Admin   -> Partner : receiver = partnerId (from request body)
const resolveReceiver = async (senderId, partnerIdFromBody) => {
  const adminId = await getAdminId();
  const senderIsAdmin = senderId.toString() === adminId.toString();
  console.log("resolveReceiver | sender=" + senderId + " | admin=" + adminId + " | senderIsAdmin=" + senderIsAdmin);
  if (senderIsAdmin) {
    if (!partnerIdFromBody) {
      throw new Error("partnerId (or receiverId) is required when admin sends a message.");
    }
    return partnerIdFromBody;
  }
  return adminId;
};

// GET /partner/:partnerId/internship/:internshipId
const getChatMessages = async (req, res) => {
  const { internshipId, partnerId } = req.params;
  try {
    if (!internshipId || !partnerId) {
      return res.status(400).json({ error: "internshipId and partnerId are required." });
    }
    const messages = await Chat.find({ internship: internshipId }).sort({ createdAt: 1 });
    console.log("getChatMessages: " + messages.length + " messages for internship " + internshipId);
    return res.status(200).json(messages);
  } catch (err) {
    console.error("getChatMessages error:", err);
    return res.status(500).json({ error: "Failed to fetch messages.", details: err.message });
  }
};

// GET /internship/:internshipId  (admin view)
const getMessages = async (req, res) => {
  const { internshipId } = req.params;
  try {
    if (!internshipId) {
      return res.status(400).json({ error: "internshipId is required." });
    }
    const messages = await Chat.find({ internship: internshipId }).sort({ createdAt: 1 });
    console.log("getMessages: " + messages.length + " messages for internship " + internshipId);
    return res.status(200).json(messages);
  } catch (err) {
    console.error("getMessages error:", err);
    return res.status(500).json({ error: "Failed to fetch messages.", details: err.message });
  }
};

// POST /send
// Partner -> Admin : { internshipId, senderId, message }
// Admin   -> Partner : { internshipId, senderId, partnerId, message }
//            also accepts legacy key receiverId in place of partnerId
const sendMessage = async (req, res) => {
  const { internshipId, senderId, message } = req.body;
  const partnerIdFromBody = req.body.partnerId || req.body.receiverId || null;

  console.log("sendMessage | internshipId=" + internshipId + " | senderId=" + senderId + " | partnerIdFromBody=" + partnerIdFromBody);

  try {
    if (!internshipId || !senderId || !message?.trim()) {
      return res.status(400).json({ error: "internshipId, senderId, and message are required." });
    }

    let receiverId;
    try {
      receiverId = await resolveReceiver(senderId, partnerIdFromBody);
    } catch (resolveErr) {
      console.error("resolveReceiver failed:", resolveErr.message);
      return res.status(400).json({ error: resolveErr.message });
    }

    const newMessage = await Chat.create({
      internship: internshipId,
      sender:     senderId,
      receiver:   receiverId,
      message:    message.trim(),
    });

    console.log("Message saved:", newMessage._id);

    if (req.io) {
      req.io.to(internshipId).emit("newMessage", newMessage);
    }

    return res.status(201).json(newMessage);
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ error: "Failed to send message.", details: err.message });
  }
};

module.exports = { getChatMessages, getMessages, sendMessage };