const express = require("express");
const router = express.Router();
const {
  recordAttendance,
  getAttendance,
  recordExit,
  validateExitAttendance,
} = require("../controllers/attendanceController");
const {
  generateQrCode,
  scanQrCode,
  facialAttendance,
} = require("../controllers/attendanceMethodsController");
const {
  getPresenceReport,
  getAllPresenceReports,
  getDailyStats,
  getTotalAttendanceCount,
} = require("../controllers/attendanceReportsController");
const authMiddleware = require("../middleware/auth");

router.post(
  "/",
  authMiddleware(["employee", "stagiaire", "admin"]),
  recordAttendance
);
router.get(
  "/employee/:employeeId",
  authMiddleware(["employee", "stagiaire", "admin"]),
  getAttendance
);
router.get(
  "/qr/:employeeId",
  authMiddleware(["employee", "stagiaire", "admin"]),
  generateQrCode
);
router.post(
  "/scan-qr",
  authMiddleware(["employee", "stagiaire", "admin"]),
  scanQrCode
);
router.post(
  "/facial",
  authMiddleware(["employee", "stagiaire", "admin"]),
  facialAttendance
);
router.post(
  "/exit",
  authMiddleware(["employee", "stagiaire", "admin"]),
  validateExitAttendance,
  recordExit
);
router.get("/report/:employeeId", authMiddleware(["admin"]), getPresenceReport);
router.get("/reports", authMiddleware(["admin"]), getAllPresenceReports);
router.get("/daily-stats", authMiddleware(["admin"]), getDailyStats);
router.get("/total-count", authMiddleware(["admin"]), getTotalAttendanceCount);

module.exports = router;
