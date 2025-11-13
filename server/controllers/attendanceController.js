const { db, collections, admin } = require("../config/firebase");
const { body, param, validationResult } = require("express-validator");
const logger = require("../utils/logger");
const { sendEmailAndNotify } = require("../utils/email");

// Default environment variables with fallback values
const allowedLocation = {
  lng: parseFloat(process.env.ALLOWED_LNG) || 8.8362755,
  lat: parseFloat(process.env.ALLOWED_LAT) || 33.1245286,
};
const allowedRadius = parseInt(process.env.ALLOWED_RADIUS) || 500; // Default to 500 meters

// Helper function to validate Firebase document ID
const isValidFirebaseId = (id) => {
  return typeof id === "string" && id.length > 0;
};

// Validation middleware
const validateRecordAttendance = [
  body("employeeId").notEmpty().withMessage("Valid employeeId is required"),
  body("entryTime")
    .isISO8601()
    .toDate()
    .withMessage("Valid entryTime is required")
    .custom((value) => {
      // Demo-friendly: Allow any entry time for testing purposes
      // No time restrictions - CEO can test at any time of day
      return true;
    }),
  body("location.coordinates")
    .isArray({ min: 2, max: 2 })
    .withMessage("Location coordinates must be [longitude, latitude]"),
  body("location.coordinates.*")
    .isFloat()
    .withMessage("Coordinates must be numbers"),
  body("method")
    .isIn(["manual", "qr", "facial"])
    .withMessage("Method must be one of: manual, qr, facial"),
];

const validateExitAttendance = [
  body("employeeId").notEmpty().withMessage("Valid employeeId is required"),
  body("exitTime")
    .isISO8601()
    .toDate()
    .withMessage("Valid exitTime is required")
    .custom((value) => {
      // Demo-friendly: Allow any exit time for testing purposes
      // No time restrictions - CEO can test at any time of day
      return true;
    }),
  body("location.coordinates")
    .isArray({ min: 2, max: 2 })
    .withMessage("Location coordinates must be [longitude, latitude]"),
  body("location.coordinates.*")
    .isFloat()
    .withMessage("Coordinates must be numbers"),
];

const recordAttendance = [
  validateRecordAttendance,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Validation errors in recordAttendance", {
          errors: errors.array(),
        });
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { employeeId, entryTime, location, method } = req.body;

      // Check if employee exists and requester is authorized
      const employeeRef = db().collection(collections.EMPLOYEES).doc(employeeId);
      const employeeDoc = await employeeRef.get();

      if (!employeeDoc.exists) {
        logger.warn("Employee not found in recordAttendance", { employeeId });
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const employee = { id: employeeDoc.id, ...employeeDoc.data() };

      if (req.user.id !== employeeId && req.user.role !== "admin") {
        logger.warn("Unauthorized attendance recording", {
          employeeId,
          requesterId: req.user.id,
          requesterRole: req.user.role,
        });
        return res.status(403).json({
          success: false,
          message:
            "Access denied: Can only record own attendance or requires admin role",
        });
      }

      // Check if there's already an open attendance (no exit time)
      try {
        const openAttendanceSnapshot = await db()
          .collection(collections.ATTENDANCE)
          .where("employeeId", "==", employeeId)
          .get();
        
        // Check if any attendance record has no exitTime
        const hasOpenAttendance = openAttendanceSnapshot.docs.some(doc => !doc.data().exitTime);
        
        if (hasOpenAttendance) {
          logger.warn("Attempt to record entry with existing open attendance", {
            employeeId,
            requesterId: req.user.id,
          });
          return res.status(400).json({
            success: false,
            message: "You already have an open attendance entry. Please record exit time first before creating a new entry.",
          });
        }
      } catch (checkError) {
        logger.warn("Error checking for open attendance, proceeding anyway", {
          error: checkError.message,
          employeeId,
        });
        // Continue if check fails - don't block attendance recording
      }

      // Location validation
      const distance =
        Math.sqrt(
          Math.pow(location.coordinates[0] - allowedLocation.lng, 2) +
            Math.pow(location.coordinates[1] - allowedLocation.lat, 2)
        ) * 111000;
      if (distance > allowedRadius) {
        // Fire-and-forget email notification (non-blocking)
        sendEmailAndNotify(
          employee.email,
          "Unauthorized Location Attempt",
          `Your attendance attempt at ${new Date(
            entryTime
          ).toLocaleString()} was outside the allowed area.`,
          { userId: employeeId, type: "location_issue" }
        ).catch((emailError) => {
          logger.error("Failed to send location notification", {
            error: emailError.message,
            employeeId,
          });
        });

        logger.warn("Location outside allowed area in recordAttendance", {
          employeeId,
          distance,
        });
        return res.status(400).json({
          success: false,
          message: "Location outside allowed area",
        });
      }

      // Late attendance notification (fire-and-forget)
      const entryDate = new Date(entryTime);
      if (entryDate.getHours() >= 9) {
        sendEmailAndNotify(
          employee.email,
          "Late Attendance Notification",
          `You recorded attendance at ${entryDate.toLocaleString()}, which is after 9 AM.`,
          { userId: employeeId, type: "late_arrival" }
        ).catch((emailError) => {
          logger.error("Failed to send late arrival notification", {
            error: emailError.message,
            employeeId,
          });
        });
        logger.info("Late attendance recorded", { employeeId, entryTime });
      }

      // Create attendance record in Firestore
      const attendanceData = {
        employeeId: employeeId,
        entryTime: admin.firestore.Timestamp.fromDate(new Date(entryTime)),
        location: {
          type: "Point",
          coordinates: location.coordinates,
        },
        method,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const attendanceRef = await db()
        .collection(collections.ATTENDANCE)
        .add(attendanceData);
      const attendanceDoc = await attendanceRef.get();
      const attendance = { id: attendanceDoc.id, ...attendanceDoc.data() };

      logger.info("Attendance recorded successfully", {
        attendanceId: attendance.id,
        employeeId,
        requesterId: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: "Attendance recorded successfully",
        data: { attendance },
      });
    } catch (error) {
      logger.error("Error in recordAttendance", { error: error.message });
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
];

const getAttendance = [
  param("employeeId").notEmpty().withMessage("Valid employeeId is required"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Validation errors in getAttendance", {
          errors: errors.array(),
        });
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { employeeId } = req.params;

      // Check authorization
      if (req.user.id !== employeeId && req.user.role !== "admin") {
        logger.warn("Unauthorized access to attendance data", {
          employeeId,
          requesterId: req.user.id,
          requesterRole: req.user.role,
        });
        return res.status(403).json({
          success: false,
          message:
            "Access denied: Can only view own attendance or requires admin role",
        });
      }

      // Query attendance records for the employee
      const attendanceSnapshot = await db()
        .collection(collections.ATTENDANCE)
        .where("employeeId", "==", employeeId)
        .orderBy("createdAt", "desc")
        .limit(7)
        .get();

      const attendanceRecords = [];
      for (const doc of attendanceSnapshot.docs) {
        const data = doc.data();
        
        // Populate employee data
        const employeeDoc = await db()
          .collection(collections.EMPLOYEES)
          .doc(data.employeeId)
          .get();

        attendanceRecords.push({
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

      logger.info("Employee attendance retrieved successfully", {
        employeeId,
        requesterId: req.user.id,
      });

      res.status(200).json({
        success: true,
        message: "Attendance retrieved successfully",
        data: { attendance: attendanceRecords },
      });
    } catch (error) {
      logger.error("Error in getAttendance", { error: error.message });
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
];

const recordExit = [
  validateExitAttendance,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Exit attendance validation failed", {
          errors: errors.array(),
          requesterId: req.user?.id,
        });
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { employeeId, exitTime, location } = req.body;
      const requesterId = req.user.id;

      logger.info("Exit attendance request received", {
        employeeId,
        exitTime,
        location,
        requesterId,
      });

      // Check if employee exists
      const employeeDoc = await db()
        .collection(collections.EMPLOYEES)
        .doc(employeeId)
        .get();

      if (!employeeDoc.exists) {
        logger.warn("Employee not found for exit attendance", {
          employeeId,
          requesterId,
        });
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const employee = { id: employeeDoc.id, ...employeeDoc.data() };

      // Demo-friendly: Find the most recent attendance record without exit time
      // Allow searching across multiple days for testing flexibility
      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      let attendanceSnapshot;
      
      try {
        attendanceSnapshot = await db()
          .collection(collections.ATTENDANCE)
          .where("employeeId", "==", employeeId)
          .where("entryTime", ">=", admin.firestore.Timestamp.fromDate(startDate))
          .where("entryTime", "<=", admin.firestore.Timestamp.fromDate(endDate))
          .orderBy("entryTime", "desc")
          .get();
      } catch (indexError) {
        // If index error, fetch all attendance for employee without date filter
        if (indexError.message && indexError.message.includes('index')) {
          logger.warn("Firestore index required for recordExit, using fallback query", {
            error: indexError.message,
            employeeId,
          });
          
          attendanceSnapshot = await db()
            .collection(collections.ATTENDANCE)
            .where("employeeId", "==", employeeId)
            .get();
        } else {
          throw indexError;
        }
      }

      // Find first record without exitTime
      let existingAttendance = null;
      let existingAttendanceId = null;

      // Sort in memory if we used fallback query
      const docs = attendanceSnapshot.docs.sort((a, b) => {
        const aTime = a.data().entryTime?.toDate?.() || new Date(0);
        const bTime = b.data().entryTime?.toDate?.() || new Date(0);
        return bTime - aTime;
      });

      for (const doc of docs) {
        const data = doc.data();
        if (!data.exitTime) {
          existingAttendance = data;
          existingAttendanceId = doc.id;
          break;
        }
      }

      if (!existingAttendance) {
        logger.warn("No entry attendance found for exit", {
          employeeId,
          requesterId,
        });
        return res.status(400).json({
          success: false,
          message:
            "No entry attendance found for today. Please record entry first.",
        });
      }

      // Validate that exit time is after entry time
      const exitDateTime = new Date(exitTime);
      const entryDateTime = existingAttendance.entryTime.toDate();

      if (exitDateTime <= entryDateTime) {
        logger.warn("Exit time is not after entry time", {
          employeeId,
          entryTime: entryDateTime,
          exitTime,
          requesterId,
        });
        return res.status(400).json({
          success: false,
          message: "Exit time must be after entry time",
        });
      }

      // Update the attendance record with exit time
      await db()
        .collection(collections.ATTENDANCE)
        .doc(existingAttendanceId)
        .update({
          exitTime: admin.firestore.Timestamp.fromDate(exitDateTime),
          exitLocation: {
            type: "Point",
            coordinates: location.coordinates,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Get updated document
      const updatedDoc = await db()
        .collection(collections.ATTENDANCE)
        .doc(existingAttendanceId)
        .get();
      const updatedAttendance = { id: updatedDoc.id, ...updatedDoc.data() };

      logger.info("Exit attendance recorded successfully", {
        attendanceId: existingAttendanceId,
        employeeId,
        entryTime: entryDateTime,
        exitTime: exitDateTime,
        requesterId,
      });

      // Send notification to employee (fire-and-forget)
      sendEmailAndNotify(
        employee.id,
        "Exit Recorded",
        `Your exit time has been recorded: ${exitDateTime.toLocaleString()}`
      ).catch((emailError) => {
        logger.error("Failed to send exit notification", {
          error: emailError.message,
          employeeId,
        });
      });

      res.status(200).json({
        success: true,
        message: "Exit time recorded successfully",
        data: {
          attendance: updatedAttendance,
        },
      });
    } catch (error) {
      logger.error("Error in recordExit", { error: error.message });
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
];

module.exports = {
  recordAttendance,
  getAttendance,
  recordExit,
  validateExitAttendance,
};
