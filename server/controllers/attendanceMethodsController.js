const { db, collections, admin } = require("../config/firebase");
const { body, param, validationResult } = require("express-validator");
const winston = require("winston");
const QRCode = require("qrcode");
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
const validateScanQr = [
  body("qrData").notEmpty().withMessage("QR data is required"),
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
];

const validateFacialAttendance = [
  body("employeeId").notEmpty().withMessage("Valid employeeId is required"),
  body("faceTemplate")
    .isArray()
    .withMessage("faceTemplate must be an array")
    .custom((value) => value.length === 128)
    .withMessage("faceTemplate must be 128 numbers"),
  body("faceTemplate.*").isFloat().withMessage("faceTemplate must be numbers"),
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
];

const generateQrCode = [
  param("employeeId").notEmpty().withMessage("Valid employeeId is required"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Validation errors in generateQrCode", {
          errors: errors.array(),
        });
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { employeeId } = req.params;

      const employeeDoc = await db()
        .collection(collections.EMPLOYEES)
        .doc(employeeId)
        .get();

      if (!employeeDoc.exists) {
        logger.warn("Employee not found in generateQrCode", { employeeId });
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      // Check if requester is authorized to generate QR code for this employee
      if (req.user.id !== employeeId && req.user.role !== "admin") {
        logger.warn("Unauthorized QR code generation attempt", {
          employeeId,
          requesterId: req.user.id,
          requesterRole: req.user.role,
        });
        return res.status(403).json({
          success: false,
          message:
            "Access denied: Can only generate QR code for yourself or requires admin role",
        });
      }

      const qrData = JSON.stringify({
        employeeId,
        timestamp: Date.now(),
        expiresAt: Date.now() + 12 * 60 * 60 * 1000, // Expires in 12 hours
      });
      const qrCodeUrl = await QRCode.toDataURL(qrData);
      logger.info("QR code generated successfully", {
        employeeId,
        requesterId: req.user.id,
      });

      res.status(200).json({
        success: true,
        message: "QR code generated successfully",
        data: { qrCodeUrl: qrCodeUrl },
      });
    } catch (error) {
      logger.error("Error in generateQrCode", { error: error.message });
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
];

const scanQrCode = [
  validateScanQr,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Validation errors in scanQrCode", {
          errors: errors.array(),
        });
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { qrData, location, entryTime } = req.body;
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch (error) {
        logger.warn("Invalid QR data format in scanQrCode", { qrData });
        return res.status(400).json({
          success: false,
          message: "Invalid QR data format",
        });
      }

      const { employeeId, timestamp } = parsedData;
      if (!isValidFirebaseId(employeeId)) {
        logger.warn("Invalid employeeId in QR data", { employeeId });
        return res.status(400).json({
          success: false,
          message: "Invalid employeeId in QR data",
        });
      }

      // Check if requester is authorized
      if (req.user.id !== employeeId && req.user.role !== "admin") {
        logger.warn("Unauthorized QR scan attempt", {
          employeeId,
          requesterId: req.user.id,
          requesterRole: req.user.role,
        });
        return res.status(403).json({
          success: false,
          message:
            "Access denied: Can only scan own QR code or requires admin role",
        });
      }

      const employeeDoc = await db()
        .collection(collections.EMPLOYEES)
        .doc(employeeId)
        .get();

      if (!employeeDoc.exists) {
        logger.warn("Employee not found in scanQrCode", { employeeId });
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const employee = { id: employeeDoc.id, ...employeeDoc.data() };

      // Validate QR code timestamp (5-minute expiry)
      if (Date.now() - timestamp > 5 * 60 * 1000) {
        // Fire-and-forget email notification (non-blocking)
        sendEmailAndNotify(
          employee.email,
          "Expired QR Code Attempt",
          `Your QR code scan at ${new Date(
            entryTime
          ).toLocaleString()} was invalid or expired.`,
          { userId: employeeId, type: "expired_qr" }
        ).catch((emailError) => {
          logger.error("Failed to send expired QR notification", {
            error: emailError.message,
            employeeId,
          });
        });

        logger.warn("QR code expired", { employeeId, timestamp });
        return res.status(401).json({
          success: false,
          message: "Invalid or expired QR code",
        });
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
          `Your QR scan at ${new Date(
            entryTime
          ).toLocaleString()} was outside the allowed area.`,
          { userId: employeeId, type: "location_issue" }
        ).catch((emailError) => {
          logger.error("Failed to send QR location notification", {
            error: emailError.message,
            employeeId,
          });
        });

        logger.warn("Location outside allowed area in scanQrCode", {
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
          logger.error("Failed to send QR late arrival notification", {
            error: emailError.message,
            employeeId,
          });
        });
        logger.info("Late QR attendance recorded", { employeeId, entryTime });
      }

      // Create attendance record in Firestore
      const attendanceData = {
        employeeId: employeeId,
        entryTime: admin.firestore.Timestamp.fromDate(new Date(entryTime)),
        location: {
          type: "Point",
          coordinates: location.coordinates,
        },
        method: "qr",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const attendanceRef = await db()
        .collection(collections.ATTENDANCE)
        .add(attendanceData);
      const attendanceDoc = await attendanceRef.get();
      const attendance = { id: attendanceDoc.id, ...attendanceDoc.data() };

      logger.info("QR code attendance recorded successfully", {
        attendanceId: attendance.id,
        employeeId,
        requesterId: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: "QR code attendance recorded successfully",
        data: { attendance },
      });
    } catch (error) {
      logger.error("Error in scanQrCode", { error: error.message });
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
];

function calculateDistance(descriptor1, descriptor2) {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length)
    return Infinity;
  return Math.sqrt(
    descriptor1.reduce(
      (sum, val, i) => sum + Math.pow(val - descriptor2[i], 2),
      0
    )
  );
}

const facialAttendance = [
  validateFacialAttendance,
  async (req, res) => {
    try {
      logger.info("Facial attendance request received", {
        requesterId: req.user?.id,
        requesterRole: req.user?.role,
        bodyKeys: Object.keys(req.body),
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Validation errors in facialAttendance", {
          errors: errors.array(),
        });
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { employeeId, faceTemplate, entryTime, location } = req.body;
      
      // Check if req.user exists (should be set by auth middleware)
      if (!req.user || !req.user.id) {
        logger.error("req.user not set in facialAttendance", {
          hasReqUser: !!req.user,
          userId: req.user?.id,
        });
        return res.status(401).json({
          success: false,
          message: "Authentication failed. Please log in again.",
        });
      }
      
      const userIdStr = req.user.id.toString();
      
      logger.info("Processing facial attendance", {
        employeeId,
        requesterId: userIdStr,
        requesterRole: req.user.role,
      });

      // Find the employee by employeeId
      const employeeDoc = await db()
        .collection(collections.EMPLOYEES)
        .doc(employeeId)
        .get();

      if (!employeeDoc.exists) {
        logger.warn(
          "Employee not found in facialAttendance",
          { employeeId, requesterId: userIdStr }
        );
        return res.status(404).json({
          success: false,
          message: "Employee not found. Please ensure the employee account exists.",
        });
      }

      const employee = { id: employeeDoc.id, ...employeeDoc.data() };

      if (!employee.faceDescriptor) {
        logger.warn(
          "Face descriptor not registered for employee",
          { employeeId, requesterId: userIdStr }
        );
        return res.status(400).json({
          success: false,
          message: "Face not registered. Please register your face in Profile page first.",
        });
      }

      // Compare face descriptors
      const distance = calculateDistance(faceTemplate, employee.faceDescriptor);
      logger.info("Face recognition attempt", { 
        employeeId, 
        distance,
        threshold: 0.6,
        recognized: distance < 0.6 
      });
      
      if (distance >= 0.6) {
        logger.warn("Face recognition failed - distance too high", {
          employeeId,
          distance,
          threshold: 0.6,
          requesterId: userIdStr,
        });
        return res.status(400).json({
          success: false,
          message: `Face not recognized (confidence: ${(100 - distance * 100).toFixed(1)}%). Please ensure good lighting, face the camera directly, and hold still. If this persists, re-register your face in Profile.`,
        });
      }

      // Authorization check
      if (userIdStr !== employeeId && req.user.role !== "admin") {
        logger.warn("Unauthorized facial attendance attempt", {
          employeeId,
          requesterId: userIdStr,
          requesterRole: req.user.role,
        });
        return res.status(403).json({
          success: false,
          message:
            "Access denied: You can only record your own facial attendance. Admins can record for any employee.",
        });
      }

      // Location validation
      const distanceCheck =
        Math.sqrt(
          Math.pow(location.coordinates[0] - allowedLocation.lng, 2) +
            Math.pow(location.coordinates[1] - allowedLocation.lat, 2)
        ) * 111000;
      if (distanceCheck > allowedRadius) {
        // Fire-and-forget email notification (non-blocking)
        sendEmailAndNotify(
          employee.email,
          "Unauthorized Location Attempt",
          `Your facial scan at ${new Date(
            entryTime
          ).toLocaleString()} was outside the allowed area.`,
          { userId: employeeId, type: "location_issue" }
        ).catch((emailError) => {
          logger.error("Failed to send facial location notification", {
            error: emailError.message,
            employeeId,
          });
        });

        logger.warn("Location outside allowed area in facialAttendance", {
          employeeId,
          distance: distanceCheck,
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
          logger.error("Failed to send facial late arrival notification", {
            error: emailError.message,
            employeeId,
          });
        });
        logger.info("Late facial attendance recorded", {
          employeeId,
          entryTime,
        });
      }

      // Record attendance
      const attendanceData = {
        employeeId: employeeId,
        entryTime: admin.firestore.Timestamp.fromDate(new Date(entryTime)),
        location: {
          type: "Point",
          coordinates: location.coordinates,
        },
        method: "facial",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const attendanceRef = await db()
        .collection(collections.ATTENDANCE)
        .add(attendanceData);
      const attendanceDoc = await attendanceRef.get();
      const attendance = { id: attendanceDoc.id, ...attendanceDoc.data() };

      logger.info("Facial attendance recorded successfully", {
        attendanceId: attendance.id,
        employeeId,
        requesterId: userIdStr,
      });

      res.status(201).json({
        success: true,
        message: "Facial attendance recorded successfully",
        data: { attendance },
      });
    } catch (error) {
      logger.error("Error in facialAttendance", { error: error.message });
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
];

module.exports = {
  generateQrCode,
  scanQrCode,
  facialAttendance,
};
