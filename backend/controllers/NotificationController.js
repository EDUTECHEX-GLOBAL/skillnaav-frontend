const Notification = require("../models/webapp-models/NotificationModel");
const sendNotificationUtil = require("../utils/Notification");
const mongoose = require("mongoose");
const notifyUser = require("../utils/notifyUser");

// 👉 Create & save a new notification (can be called from Python or other services)
const createNotification = async (req, res) => {
  try {
    let { studentId, email, title, message, link, type } = req.body;

    if (!studentId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "studentId, title, and message are required",
      });
    }

    // Auto-set type if not provided
    if (!type) {
      if (title.toLowerCase().includes("offer")) {
        type = "offer";
      } else if (title.toLowerCase().includes("recommendation")) {
        type = "recommendation";
      } else {
        type = "general";
      }
    }

    // Save in-app notification with type
    const notification = await sendNotificationUtil({
      studentId,
      title,
      message,
      link,
      type, // ✅ now guaranteed to have correct type
    });

    // Send email if available
    if (email) {
      try {
        await notifyUser(email, title, message);
      } catch (err) {
        console.error(`❌ Failed to send email to ${email}:`, err.message);
      }
    }

    res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
    });
  }
};




// 👉 Fetch all notifications for a student
const getNotificationsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const notifications = await Notification.find({ studentId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

// 👉 Mark a notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true }, // ✅ matches your schema field `read`
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

// 👉 Delete a notification by ID
const deleteNotification = async (req, res) => {
  const { notificationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID",
    });
  }

  try {
    const deletedNotification = await Notification.findByIdAndDelete(
      notificationId
    );

    if (!deletedNotification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

module.exports = {
  createNotification,
  getNotificationsByStudent,
  markNotificationAsRead,
  deleteNotification,
};
