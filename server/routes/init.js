const express = require("express");
const router = express.Router();
const { initAdmin, checkInitStatus } = require("../controllers/initController");

// Check if system is initialized (public endpoint)
router.get("/status", checkInitStatus);

// Initialize first admin user (public endpoint - only works if no admin exists)
router.post("/admin", initAdmin);

module.exports = router;

