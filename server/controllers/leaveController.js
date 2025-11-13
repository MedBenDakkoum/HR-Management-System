const { db, collections, admin } = require("../config/firebase");
const { body, param, validationResult } = require("express-validator");
const winston = require("winston");
const { sendEmailAndNotify } = require("../utils/email");

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Helper function to validate Firebase document ID
const isValidFirebaseId = (id) => {
  return typeof id === "string" && id.length > 0;
};

// Validation middleware
const validateRequestLeave = [
  body("employeeId").notEmpty().withMessage("Valid employeeId is required"),
  body("startDate")
    .isISO8601()
    .toDate()
    .withMessage("Valid startDate is required"),
  body("endDate")
    .isISO8601()
    .toDate()
    .withMessage("Valid endDate is required")
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error("endDate must be after or equal to startDate");
      }
      return true;
    }),
  body("reason").notEmpty().withMessage("Reason is required"),
];

const validateApproveLeave = [
  body("leaveId").notEmpty().withMessage("Valid leaveId is required"),
  body("status")
    .isIn(["approved", "rejected"])
    .withMessage("Status must be one of: approved, rejected"),
];

const validateGetLeaves = [
  param("employeeId").notEmpty().withMessage("Valid employeeId is required"),
];

const requestLeave = [
  validateRequestLeave,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Validation errors in requestLeave", {
          errors: errors.array(),
        });
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { employeeId, startDate, endDate, reason } = req.body;

      if (!isValidFirebaseId(employeeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID format",
        });
      }

      // Check if employee exists and requester is authorized
      const employeeDoc = await db()
        .collection(collections.EMPLOYEES)
        .doc(employeeId)
        .get();

      if (!employeeDoc.exists) {
        logger.warn("Employee not found in requestLeave", { employeeId });
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const employee = { id: employeeDoc.id, ...employeeDoc.data() };

      if (req.user.id !== employeeId && req.user.role !== "admin") {
        logger.warn("Unauthorized leave request", {
          employeeId,
          requesterId: req.user.id,
          requesterRole: req.user.role,
        });
        return res.status(403).json({
          success: false,
          message:
            "Access denied: Can only request own leave or requires admin role",
        });
      }

      // Create leave request
      const leaveData = {
        employeeId: employeeId,
        startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
        endDate: admin.firestore.Timestamp.fromDate(new Date(endDate)),
        reason,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const leaveRef = await db().collection(collections.LEAVES).add(leaveData);
      const leaveDoc = await leaveRef.get();
      const leave = { id: leaveDoc.id, ...leaveDoc.data() };

      logger.info("Leave requested successfully", {
        leaveId: leave.id,
        employeeId,
        requesterId: req.user.id,
      });

      // Send response FIRST (don't wait for notifications)
      res.status(201).json({
        success: true,
        message: "Leave request submitted successfully",
        data: { leave },
      });

      // Notify employee (fire-and-forget, non-blocking)
      sendEmailAndNotify(
        employee.email,
        "Leave Request Submitted",
        `Your leave request from ${new Date(
          startDate
        ).toLocaleDateString()} to ${new Date(
          endDate
        ).toLocaleDateString()} has been submitted for review.`,
        { userId: employeeId, type: "leave_request" }
      ).catch((emailError) => {
        logger.error("Failed to send leave request notification to employee", {
          error: emailError.message,
          employeeId,
        });
      });

      // Notify all admins about the new leave request (fire-and-forget)
      db()
        .collection(collections.EMPLOYEES)
        .where("role", "==", "admin")
        .get()
        .then(async (adminsSnapshot) => {
          for (const adminDoc of adminsSnapshot.docs) {
            const adminUser = { id: adminDoc.id, ...adminDoc.data() };
            
            const notificationData = {
              userId: adminUser.id,
              message: `${employee.name} requested leave from ${new Date(
                startDate
              ).toLocaleDateString()} to ${new Date(
                endDate
              ).toLocaleDateString()}. Reason: ${reason}`,
              type: "leave_request",
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            };
            
            await db().collection(collections.NOTIFICATIONS).add(notificationData);
          }
          logger.info("Admin notifications sent for leave request", {
            leaveId: leave.id,
          });
        })
        .catch((notifyError) => {
          logger.error("Failed to send leave request notifications to admins", {
            error: notifyError.message,
            leaveId: leave.id,
          });
        });
    } catch (error) {
      logger.error("Error in requestLeave", { error: error.message });
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
];

const approveLeave = [
  validateApproveLeave,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Validation errors in approveLeave", {
          errors: errors.array(),
        });
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { leaveId, status } = req.body;

      if (!isValidFirebaseId(leaveId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid leave ID format",
        });
      }

      const leaveDoc = await db()
        .collection(collections.LEAVES)
        .doc(leaveId)
        .get();

      if (!leaveDoc.exists) {
        logger.warn("Leave not found in approveLeave", { leaveId });
        return res.status(404).json({
          success: false,
          message: "Leave request not found",
        });
      }

      const leaveData = leaveDoc.data();

      // Populate employee data
      const employeeDoc = await db()
        .collection(collections.EMPLOYEES)
        .doc(leaveData.employeeId)
        .get();

      if (!employeeDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const employee = { id: employeeDoc.id, ...employeeDoc.data() };

      // Update leave status
      await db().collection(collections.LEAVES).doc(leaveId).update({
        status: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Get updated leave
      const updatedLeaveDoc = await db()
        .collection(collections.LEAVES)
        .doc(leaveId)
        .get();
      const leave = { id: updatedLeaveDoc.id, ...updatedLeaveDoc.data() };

      logger.info("Leave status updated successfully", {
        leaveId,
        status,
        requesterId: req.user.id,
      });

      // Send response FIRST (don't wait for notification)
      res.status(200).json({
        success: true,
        message: `Leave ${status} successfully`,
        data: { leave },
      });

      // Send notification to employee (fire-and-forget, non-blocking)
      sendEmailAndNotify(
        employee.email,
        `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        `Your leave request from ${new Date(
          leaveData.startDate.toDate()
        ).toLocaleDateString()} to ${new Date(
          leaveData.endDate.toDate()
        ).toLocaleDateString()} has been ${status}.`,
        { userId: employee.id, type: `leave_${status}` }
      ).catch((emailError) => {
        logger.error("Failed to send leave approval notification", {
          error: emailError.message,
          leaveId,
          employeeId: employee.id,
        });
      });
    } catch (error) {
      logger.error("Error in approveLeave", { error: error.message });
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
];

const getLeaves = [
  validateGetLeaves,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Validation errors in getLeaves", {
          errors: errors.array(),
        });
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { employeeId } = req.params;

      if (!isValidFirebaseId(employeeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID format",
        });
      }

      // Check authorization
      if (req.user.id !== employeeId && req.user.role !== "admin") {
        logger.warn("Unauthorized access to leave data", {
          employeeId,
          requesterId: req.user.id,
          requesterRole: req.user.role,
        });
        return res.status(403).json({
          success: false,
          message:
            "Access denied: Can only view own leaves or requires admin role",
        });
      }

      const leavesSnapshot = await db()
        .collection(collections.LEAVES)
        .where("employeeId", "==", employeeId)
        .get();

      const leaves = [];
      for (const doc of leavesSnapshot.docs) {
        const data = doc.data();

        // Populate employee data
        const employeeDoc = await db()
          .collection(collections.EMPLOYEES)
          .doc(data.employeeId)
          .get();

        leaves.push({
          id: doc.id,
          ...data,
          employee: employeeDoc.exists
            ? {
                id: employeeDoc.id,
                name: employeeDoc.data().name,
                email: employeeDoc.data().email,
              }
            : null,
        });
      }

      logger.info("Employee leaves retrieved successfully", {
        employeeId,
        requesterId: req.user.id,
      });

      res.status(200).json({
        success: true,
        message: "Leaves retrieved successfully",
        data: { leaves },
      });
    } catch (error) {
      logger.error("Error in getLeaves", { error: error.message });
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
];

const getAllLeaves = async (req, res) => {
  try {
    const leavesSnapshot = await db().collection(collections.LEAVES).get();

    const leaves = [];
    for (const doc of leavesSnapshot.docs) {
      const data = doc.data();

      // Populate employee data
      const employeeDoc = await db()
        .collection(collections.EMPLOYEES)
        .doc(data.employeeId)
        .get();

      leaves.push({
        id: doc.id,
        ...data,
        employee: employeeDoc.exists
          ? {
              id: employeeDoc.id,
              name: employeeDoc.data().name,
              email: employeeDoc.data().email,
            }
          : null,
      });
    }

    logger.info("All leaves retrieved successfully", {
      requesterId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "All leaves retrieved successfully",
      data: { leaves },
    });
  } catch (error) {
    logger.error("Error in getAllLeaves", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteLeave = [
  param("leaveId").notEmpty().withMessage("Valid leaveId is required"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Validation errors in deleteLeave", {
          errors: errors.array(),
        });
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { leaveId } = req.params;

      if (!isValidFirebaseId(leaveId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid leave ID format",
        });
      }

      const leaveDoc = await db()
        .collection(collections.LEAVES)
        .doc(leaveId)
        .get();

      if (!leaveDoc.exists) {
        logger.warn("Leave not found in deleteLeave", { leaveId });
        return res.status(404).json({
          success: false,
          message: "Leave request not found",
        });
      }

      const leaveData = leaveDoc.data();

      // Check authorization - only the employee who created the leave or admin can delete
      if (req.user.id !== leaveData.employeeId && req.user.role !== "admin") {
        logger.warn("Unauthorized delete attempt", {
          leaveId,
          requesterId: req.user.id,
          requesterRole: req.user.role,
        });
        return res.status(403).json({
          success: false,
          message: "Access denied: Can only delete own leave requests or requires admin role",
        });
      }

      // Only allow deleting pending leave requests
      if (leaveData.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: `Cannot delete ${leaveData.status} leave requests`,
        });
      }

      // Delete the leave request
      await db().collection(collections.LEAVES).doc(leaveId).delete();

      logger.info("Leave deleted successfully", {
        leaveId,
        requesterId: req.user.id,
      });

      res.status(200).json({
        success: true,
        message: "Leave request deleted successfully",
      });
    } catch (error) {
      logger.error("Error in deleteLeave", { error: error.message });
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
];

module.exports = {
  requestLeave,
  approveLeave,
  getLeaves,
  getAllLeaves,
  deleteLeave,
};
