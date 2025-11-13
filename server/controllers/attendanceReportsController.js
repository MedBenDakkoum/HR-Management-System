const { db, collections, admin } = require("../config/firebase");
const { param, query, validationResult } = require("express-validator");
const winston = require("winston");

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

// Validation middleware
const validateReport = [
  param("employeeId").notEmpty().withMessage("Valid employeeId is required"),
  query("period")
    .isIn(["daily", "weekly", "monthly"])
    .withMessage("Period must be one of: daily, weekly, monthly"),
  query("startDate")
    .isISO8601()
    .toDate()
    .withMessage("Valid startDate is required"),
  query("endDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Valid endDate is required"),
];

const getPresenceReport = [
  validateReport,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn("Validation errors in getPresenceReport", {
          errors: errors.array(),
        });
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { employeeId } = req.params;
      const { period, startDate, endDate } = req.query;

      const employeeDoc = await db()
        .collection(collections.EMPLOYEES)
        .doc(employeeId)
        .get();

      if (!employeeDoc.exists) {
        logger.warn("Employee not found in getPresenceReport", { employeeId });
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      const employee = { id: employeeDoc.id, ...employeeDoc.data() };

      // Build query based on period
      let queryRef = db()
        .collection(collections.ATTENDANCE)
        .where("employeeId", "==", employeeId);

      let start, end;
      if (period === "weekly") {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 7);
      } else if (period === "monthly") {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        start.setDate(1);
        end = new Date(start);
        end.setMonth(start.getMonth() + 1);
      } else if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      }

      let attendanceSnapshot;
      
      if (start && end) {
        try {
          queryRef = queryRef
            .where("entryTime", ">=", admin.firestore.Timestamp.fromDate(start))
            .where("entryTime", "<=", admin.firestore.Timestamp.fromDate(end));
          
          attendanceSnapshot = await queryRef.get();
        } catch (indexError) {
          // If index error, log helpful message and return error with index link
          if (indexError.message && indexError.message.includes('index')) {
            logger.error("Firestore index required for getPresenceReport", {
              error: indexError.message,
              employeeId,
            });
            
            return res.status(500).json({
              success: false,
              message: "Database index required. Please create the index and try again.",
              indexError: indexError.message,
              instructions: "Click the link in the error message to create the required Firestore index. This only needs to be done once.",
            });
          }
          throw indexError;
        }
      } else {
        attendanceSnapshot = await queryRef.get();
      }
      
      const attendanceRecords = [];

      for (const doc of attendanceSnapshot.docs) {
        const data = doc.data();
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
                role: employeeDoc.data().role,
              }
            : null,
        });
      }

      const report = {
        employeeId,
        employeeName: employee.name,
        period: period || "custom",
        startDate: start ? start.toISOString().split('T')[0] : null,
        endDate: end ? end.toISOString().split('T')[0] : null,
        totalDays: 0,
        totalHours: 0,
        lateDays: 0,
      };

      attendanceRecords.forEach((record) => {
        if (record.entryTime) {
          report.totalDays += 1;
          const entryDate = record.entryTime.toDate();
          if (entryDate.getHours() >= 9) {
            report.lateDays += 1;
          }

          // Calculate hours worked - ONLY count actual recorded hours
          if (record.exitTime) {
            // Only count hours when both entry AND exit are recorded
            const entryDate = record.entryTime.toDate();
            const exitDate = record.exitTime.toDate();
            const hours = (exitDate - entryDate) / (1000 * 60 * 60);
            report.totalHours += hours;
          }
          // If no exit time recorded, don't count any hours (we don't know actual work time)
        }
      });

      logger.info("Presence report generated successfully", {
        employeeId,
        requesterId: req.user.id,
        startDate: report.startDate,
        endDate: report.endDate,
      });

      res.status(200).json({
        success: true,
        message: "Presence report generated successfully",
        data: { report },
      });
    } catch (error) {
      logger.error("Error in getPresenceReport", { error: error.message });
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
];

const getAllPresenceReports = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;

    const employeesSnapshot = await db()
      .collection(collections.EMPLOYEES)
      .get();

    const reports = [];

    for (const employeeDoc of employeesSnapshot.docs) {
      const employee = { id: employeeDoc.id, ...employeeDoc.data() };
      
      // Build query for this employee
      let queryRef = db()
        .collection(collections.ATTENDANCE)
        .where("employeeId", "==", employee.id);

      let start, end;
      // If no date parameters provided, use hire date to today as default
      if (!period && !startDate && !endDate) {
        const hireDate = employee.hireDate || employee.createdAt;
        if (hireDate) {
          start = hireDate.toDate ? hireDate.toDate() : new Date(hireDate);
          start.setHours(0, 0, 0, 0);
          end = new Date();
          end.setHours(23, 59, 59, 999);
        }
      } else if (period === "weekly" && startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 7);
      } else if (period === "monthly" && startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        start.setDate(1);
        end = new Date(start);
        end.setMonth(start.getMonth() + 1);
      } else if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      }

      let attendanceSnapshot;
      
      if (start && end) {
        try {
          queryRef = queryRef
            .where("entryTime", ">=", admin.firestore.Timestamp.fromDate(start))
            .where("entryTime", "<=", admin.firestore.Timestamp.fromDate(end));
          
          attendanceSnapshot = await queryRef.get();
        } catch (indexError) {
          // If index error occurs, continue without date filter for this employee
          if (indexError.message && indexError.message.includes('index')) {
            logger.warn("Firestore index required, fetching all attendance for employee", {
              employeeId: employee.id,
            });
            // Fetch all attendance for this employee without date filter
            queryRef = db()
              .collection(collections.ATTENDANCE)
              .where("employeeId", "==", employee.id);
            attendanceSnapshot = await queryRef.get();
          } else {
            throw indexError;
          }
        }
      } else {
        attendanceSnapshot = await queryRef.get();
      }
      
      const attendanceRecords = attendanceSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Determine the actual period and start/end dates for the report
      let reportPeriod = period || "all-time";
      let reportStartDate = startDate;
      let reportEndDate = endDate;

      if (!period && !startDate && !endDate) {
        const hireDate = employee.hireDate || employee.createdAt;
        if (hireDate) {
          const hireDateObj = hireDate.toDate ? hireDate.toDate() : new Date(hireDate);
          reportStartDate = hireDateObj.toISOString().split("T")[0];
          reportEndDate = new Date().toISOString().split("T")[0];
        } else {
          reportStartDate = null;
          reportEndDate = null;
        }
      } else if (start && end) {
        // Ensure we have the actual start and end dates in the report
        reportStartDate = start.toISOString().split("T")[0];
        reportEndDate = end.toISOString().split("T")[0];
      }

      const report = {
        employeeId: employee.id,
        employeeName: employee.name,
        employeeRole: employee.role,
        period: reportPeriod,
        startDate: reportStartDate,
        endDate: reportEndDate,
        totalDays: 0,
        totalHours: 0,
        lateDays: 0,
      };

      attendanceRecords.forEach((record) => {
        if (record.entryTime) {
          report.totalDays += 1;
          const entryDate = record.entryTime.toDate();
          if (entryDate.getHours() >= 9) {
            report.lateDays += 1;
          }

          // Calculate hours worked - ONLY count actual recorded hours
          if (record.exitTime) {
            // Only count hours when both entry AND exit are recorded
            const entryDate = record.entryTime.toDate();
            const exitDate = record.exitTime.toDate();
            const hours = (exitDate - entryDate) / (1000 * 60 * 60);
            report.totalHours += hours;
          }
          // If no exit time recorded, don't count any hours (we don't know actual work time)
        }
      });

      reports.push(report);
    }

    logger.info("All presence reports generated successfully", {
      requesterId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "All presence reports generated successfully",
      data: { reports },
    });
  } catch (error) {
    logger.error("Error in getAllPresenceReports", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== "admin") {
      logger.warn("Unauthorized access to getAllEmployees", {
        requesterId: req.user.id,
        requesterRole: req.user.role,
      });
      return res.status(403).json({
        success: false,
        message: "Access denied: Requires admin role",
      });
    }

    const employeesSnapshot = await db()
      .collection(collections.EMPLOYEES)
      .get();

    const employees = employeesSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));

    logger.info("All employees retrieved successfully", {
      requesterId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: { employees },
    });
  } catch (error) {
    logger.error("Error in getAllEmployees", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get total attendance count (for dashboard stats)
const getTotalAttendanceCount = async (req, res) => {
  try {
    const attendanceSnapshot = await db()
      .collection(collections.ATTENDANCE)
      .get();

    const totalCount = attendanceSnapshot.size;

    logger.info("Total attendance count retrieved successfully", {
      requesterId: req.user.id,
      totalCount,
    });

    res.status(200).json({
      success: true,
      message: "Total attendance count retrieved successfully",
      data: { totalCount },
    });
  } catch (error) {
    logger.error("Error in getTotalAttendanceCount", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get daily attendance statistics for the last N days
const getDailyStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const maxDays = Math.min(days, 30); // Limit to 30 days max

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - maxDays + 1);
    startDate.setHours(0, 0, 0, 0);

    // Get all attendance records for the period
    const attendanceSnapshot = await db()
      .collection(collections.ATTENDANCE)
      .where("entryTime", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .get();

    const attendanceRecords = attendanceSnapshot.docs.map((doc) => ({
      id: doc.id,
      employeeId: doc.data().employeeId,
      entryTime: doc.data().entryTime.toDate(),
    }));

    // Group by date
    const dailyStats = [];
    for (let i = 0; i < maxDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Count unique employees for this day
      const dayRecords = attendanceRecords.filter((record) => {
        const recordDate = new Date(record.entryTime);
        return recordDate >= date && recordDate < nextDate;
      });

      // Get unique employee IDs
      const uniqueEmployees = new Set(
        dayRecords.map((record) => record.employeeId)
      );

      dailyStats.push({
        date: date.toISOString().split("T")[0],
        count: uniqueEmployees.size,
      });
    }

    logger.info("Daily attendance statistics retrieved successfully", {
      requesterId: req.user.id,
      days: maxDays,
    });

    res.status(200).json({
      success: true,
      message: "Daily statistics retrieved successfully",
      data: { stats: dailyStats },
    });
  } catch (error) {
    logger.error("Error in getDailyStats", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getPresenceReport,
  getAllPresenceReports,
  getAllEmployees,
  getDailyStats,
  getTotalAttendanceCount,
};
