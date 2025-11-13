const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/auth");

// Get all notifications for a user
router.get(
  "/:userId/notifications",
  authMiddleware(["employee", "stagiaire", "admin"]),
  notificationController.getUserNotifications
);

// Get unread notification count
router.get(
  "/:userId/unread-count",
  authMiddleware(["employee", "stagiaire", "admin"]),
  notificationController.getUnreadCount
);

// Mark a notification as read
router.patch(
  "/notifications/:notificationId/read",
  authMiddleware(["employee", "stagiaire", "admin"]),
  notificationController.markAsRead
);

// Mark all notifications as read for a user
router.patch(
  "/:userId/notifications/read-all",
  authMiddleware(["employee", "stagiaire", "admin"]),
  notificationController.markAllAsRead
);

// Delete a specific notification
router.delete(
  "/notifications/:notificationId",
  authMiddleware(["employee", "stagiaire", "admin"]),
  notificationController.deleteNotification
);

// Delete old notifications (admin only or scheduled task)
router.delete(
  "/notifications/cleanup",
  authMiddleware(["admin"]),
  notificationController.deleteOldNotifications
);

module.exports = router;
