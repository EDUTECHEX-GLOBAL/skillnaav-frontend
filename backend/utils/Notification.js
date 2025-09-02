const Notification = require('../models/webapp-models/NotificationModel');

const sendNotification = async ({ studentId, title, message, link = null, type }) => {
  if (!studentId || !title || !message) {
    throw new Error('Missing required fields for notification');
  }

  // Auto-set type here as a safeguard
  let finalType = type;
  if (!finalType) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes("offer")) finalType = "offer";
    else if (titleLower.includes("recommendation")) finalType = "recommendation";
    else finalType = "general";
  }

  const notification = new Notification({
    studentId,
    title,
    message,
    link,
    type: finalType,  // ✅ now guaranteed to be correct
    isRead: false
  });

  await notification.save();
  return notification;
};

module.exports = sendNotification;
