const { db, collections, admin } = require("../config/firebase");
const logger = require("../utils/logger");

// Helper function to validate Firebase document ID
const isValidFirebaseId = (id) => {
  return typeof id === "string" && id.length > 0;
};

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query; // Default limit of 20, max 50

    if (!isValidFirebaseId(userId)) {
      logger.warn("Invalid userId in getUserNotifications", { userId });
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Ensure limit is a reasonable number
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 50);

    let notificationsSnapshot;
    
    try {
      notificationsSnapshot = await db()
        .collection(collections.NOTIFICATIONS)
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .limit(limitNum)
        .get();
    } catch (indexError) {
      // If index error, provide helpful message with link
      if (indexError.message && indexError.message.includes('index')) {
        logger.error("Firestore index required for getUserNotifications", {
          error: indexError.message,
          userId,
        });
        
        return res.status(500).json({
          success: false,
          message: "Database index required. Please create the index and try again.",
          indexError: indexError.message,
          instructions: "Click the link in the server console or error message to create the required Firestore index. This only needs to be done once.",
        });
      }
      
      // If not an index error, try without orderBy as fallback
      logger.warn("Error fetching notifications with orderBy, trying without", {
        error: indexError.message,
        userId,
      });
      
      notificationsSnapshot = await db()
        .collection(collections.NOTIFICATIONS)
        .where("userId", "==", userId)
        .limit(limitNum)
        .get();
    }

    const notifications = notificationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      _id: doc.id, // For backward compatibility
      ...doc.data(),
    }));

    logger.info("User notifications retrieved successfully", {
      userId,
      count: notifications.length,
    });

    res.json({
      success: true,
      data: {
        notifications,
      },
    });
  } catch (error) {
    logger.error("Error fetching notifications", {
      error: error.message,
      userId: req.params.userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!isValidFirebaseId(notificationId)) {
      logger.warn("Invalid notificationId in markAsRead", { notificationId });
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID format",
      });
    }

    const notificationDoc = await db()
      .collection(collections.NOTIFICATIONS)
      .doc(notificationId)
      .get();

    if (!notificationDoc.exists) {
      logger.warn("Notification not found in markAsRead", { notificationId });
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await db()
      .collection(collections.NOTIFICATIONS)
      .doc(notificationId)
      .update({
        read: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    const updatedDoc = await db()
      .collection(collections.NOTIFICATIONS)
      .doc(notificationId)
      .get();

    const notification = { id: updatedDoc.id, ...updatedDoc.data() };

    logger.info("Notification marked as read", { notificationId });

    res.json({
      success: true,
      data: {
        notification,
      },
    });
  } catch (error) {
    logger.error("Error marking notification as read", {
      error: error.message,
      notificationId: req.params.notificationId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

// Mark all notifications as read for a user
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidFirebaseId(userId)) {
      logger.warn("Invalid userId in markAllAsRead", { userId });
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Get all unread notifications for the user
    const unreadNotificationsSnapshot = await db()
      .collection(collections.NOTIFICATIONS)
      .where("userId", "==", userId)
      .where("read", "==", false)
      .get();

    // Batch update all unread notifications
    const batch = db().batch();
    let updateCount = 0;

    unreadNotificationsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      updateCount++;
    });

    if (updateCount > 0) {
      await batch.commit();
    }

    logger.info("All notifications marked as read", { userId, count: updateCount });

    res.json({
      success: true,
      message: "All notifications marked as read",
      data: {
        updatedCount: updateCount,
      },
    });
  } catch (error) {
    logger.error("Error marking all notifications as read", {
      error: error.message,
      userId: req.params.userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

// Create a new notification (helper function for internal use)
exports.createNotification = async (userId, message, type) => {
  try {
    if (!isValidFirebaseId(userId)) {
      throw new Error("Invalid user ID format");
    }

    const notificationData = {
      userId,
      message,
      type,
      read: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const notificationRef = await db()
      .collection(collections.NOTIFICATIONS)
      .add(notificationData);

    const notificationDoc = await notificationRef.get();
    const notification = { id: notificationDoc.id, ...notificationDoc.data() };

    logger.info("Notification created", {
      notificationId: notification.id,
      userId,
      type,
    });

    return notification;
  } catch (error) {
    logger.error("Error creating notification", {
      error: error.message,
      userId,
      type,
    });
    throw error;
  }
};

// Delete old notifications (optional cleanup)
exports.deleteOldNotifications = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get old read notifications
    const oldNotificationsSnapshot = await db()
      .collection(collections.NOTIFICATIONS)
      .where("timestamp", "<", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .where("read", "==", true)
      .get();

    // Batch delete
    const batch = db().batch();
    let deleteCount = 0;

    oldNotificationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    if (deleteCount > 0) {
      await batch.commit();
    }

    logger.info("Old notifications deleted", { count: deleteCount });

    res.json({
      success: true,
      message: `Deleted ${deleteCount} old notifications`,
    });
  } catch (error) {
    logger.error("Error deleting old notifications", {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete old notifications",
    });
  }
};

// Get unread notification count for a user
exports.getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidFirebaseId(userId)) {
      logger.warn("Invalid userId in getUnreadCount", { userId });
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const unreadNotificationsSnapshot = await db()
      .collection(collections.NOTIFICATIONS)
      .where("userId", "==", userId)
      .where("read", "==", false)
      .get();

    const count = unreadNotificationsSnapshot.size;

    logger.info("Unread notification count retrieved", { userId, count });

    res.json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    logger.error("Error fetching unread count", {
      error: error.message,
      userId: req.params.userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
    });
  }
};

// Delete a specific notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!isValidFirebaseId(notificationId)) {
      logger.warn("Invalid notificationId in deleteNotification", { notificationId });
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID format",
      });
    }

    const notificationDoc = await db()
      .collection(collections.NOTIFICATIONS)
      .doc(notificationId)
      .get();

    if (!notificationDoc.exists) {
      logger.warn("Notification not found in deleteNotification", { notificationId });
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await db()
      .collection(collections.NOTIFICATIONS)
      .doc(notificationId)
      .delete();

    logger.info("Notification deleted", { notificationId });

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting notification", {
      error: error.message,
      notificationId: req.params.notificationId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};
