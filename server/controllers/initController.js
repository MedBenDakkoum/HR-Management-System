const { db, collections, admin } = require("../config/firebase");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");

// Initialize first admin user
exports.initAdmin = async (req, res) => {
  try {
    // Check if any admin already exists
    const adminsSnapshot = await db()
      .collection(collections.EMPLOYEES)
      .where("role", "==", "admin")
      .limit(1)
      .get();

    if (!adminsSnapshot.empty) {
      logger.warn("Init admin attempted but admin already exists");
      return res.status(400).json({
        success: false,
        message: "Admin user already exists. Cannot initialize again.",
      });
    }

    // Get admin credentials from request body or use defaults
    const {
      name = "Admin",
      email = process.env.ADMIN_EMAIL || "admin@flesk.com",
      password = process.env.ADMIN_PASSWORD || "admin123456",
      position = "Administrator",
    } = req.body;

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if email already exists
    const existingEmployeeSnapshot = await db()
      .collection(collections.EMPLOYEES)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existingEmployeeSnapshot.empty) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const adminData = {
      name,
      email,
      password: hashedPassword,
      role: "admin",
      position,
      hireDate: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const adminRef = await db()
      .collection(collections.EMPLOYEES)
      .add(adminData);

    const adminDoc = await adminRef.get();
    const adminUser = { id: adminDoc.id, ...adminDoc.data() };

    logger.info("Initial admin user created successfully", {
      email: adminUser.email,
      adminId: adminUser.id,
    });

    // Remove password from response
    const { password: _, ...adminResponse } = adminUser;

    res.status(201).json({
      success: true,
      message: "Initial admin user created successfully",
      data: {
        admin: {
          id: adminResponse.id,
          _id: adminResponse.id, // For backward compatibility
          name: adminResponse.name,
          email: adminResponse.email,
          role: adminResponse.role,
          position: adminResponse.position,
        },
      },
    });
  } catch (error) {
    logger.error("Error in initAdmin", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Check system initialization status
exports.checkInitStatus = async (req, res) => {
  try {
    // Check if any admin exists
    const adminsSnapshot = await db()
      .collection(collections.EMPLOYEES)
      .where("role", "==", "admin")
      .limit(1)
      .get();

    const isInitialized = !adminsSnapshot.empty;

    // Get total employee count
    const employeesSnapshot = await db()
      .collection(collections.EMPLOYEES)
      .get();

    const totalEmployees = employeesSnapshot.size;

    logger.info("System initialization status checked", {
      isInitialized,
      totalEmployees,
    });

    res.status(200).json({
      success: true,
      data: {
        isInitialized,
        hasAdmin: isInitialized,
        totalEmployees,
        message: isInitialized
          ? "System is initialized with admin user"
          : "System needs initialization - no admin user found",
      },
    });
  } catch (error) {
    logger.error("Error in checkInitStatus", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

