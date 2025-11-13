#!/usr/bin/env node

/**
 * Initialize Admin User Script
 * 
 * This script creates the first admin user for the system.
 * 
 * Usage:
 *   node scripts/init-admin.js
 *   
 *   Or with custom credentials:
 *   node scripts/init-admin.js --email admin@company.com --password securepass123 --name "Admin User"
 */

require('dotenv').config();
const { db, collections, admin } = require("../config/firebase");
const bcrypt = require("bcryptjs");
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Parse command line arguments
const args = process.argv.slice(2);
const getArgValue = (arg) => {
  const index = args.indexOf(arg);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
};

const emailArg = getArgValue('--email');
const passwordArg = getArgValue('--password');
const nameArg = getArgValue('--name');
const positionArg = getArgValue('--position');

// Helper function to prompt user input
const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

async function initializeAdmin() {
  try {
    console.log('\n🔥 FLESK Admin Initialization\n');
    console.log('=====================================\n');

    // Check if admin already exists
    console.log('Checking for existing admin...');
    const adminsSnapshot = await db()
      .collection(collections.EMPLOYEES)
      .where("role", "==", "admin")
      .limit(1)
      .get();

    if (!adminsSnapshot.empty) {
      console.log('\n❌ Error: Admin user already exists!');
      console.log('Cannot create another admin through initialization.');
      console.log('\nTo create additional admins, use the employee registration endpoint with admin credentials.\n');
      process.exit(1);
    }

    console.log('✓ No admin found. Proceeding with initialization...\n');

    // Get admin details
    let name = nameArg;
    let email = emailArg;
    let password = passwordArg;
    let position = positionArg || 'Administrator';

    // Interactive prompts if not provided via command line
    if (!name) {
      name = await prompt('Admin Name [Admin]: ') || 'Admin';
    }

    if (!email) {
      email = await prompt('Admin Email [admin@flesk.com]: ') || 'admin@flesk.com';
    }

    if (!password) {
      password = await prompt('Admin Password (min 6 chars) [admin123456]: ') || 'admin123456';
    }

    // Validate inputs
    if (!email || !email.includes('@')) {
      console.log('\n❌ Error: Valid email is required');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('\n❌ Error: Password must be at least 6 characters');
      process.exit(1);
    }

    // Check if email already exists
    const existingEmployeeSnapshot = await db()
      .collection(collections.EMPLOYEES)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existingEmployeeSnapshot.empty) {
      console.log('\n❌ Error: An account with this email already exists');
      process.exit(1);
    }

    console.log('\n📝 Creating admin user...');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const adminData = {
      name,
      email,
      password: hashedPassword,
      role: "admin",
      position,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const adminRef = await db()
      .collection(collections.EMPLOYEES)
      .add(adminData);

    const adminDoc = await adminRef.get();

    console.log('\n✅ Admin user created successfully!\n');
    console.log('=====================================');
    console.log('Admin Details:');
    console.log('=====================================');
    console.log(`Name:     ${name}`);
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     admin`);
    console.log(`ID:       ${adminDoc.id}`);
    console.log('=====================================\n');
    console.log('⚠️  Important: Please save these credentials securely!');
    console.log('💡 You can now login with these credentials.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
FLESK Admin Initialization Script

Usage:
  node scripts/init-admin.js [options]

Options:
  --email <email>       Admin email address
  --password <pass>     Admin password (min 6 characters)
  --name <name>         Admin full name
  --position <title>    Admin position/title
  --help, -h           Show this help message

Examples:
  # Interactive mode (prompts for inputs)
  node scripts/init-admin.js

  # With command line arguments
  node scripts/init-admin.js --email admin@company.com --password secure123 --name "John Admin"

  # Using environment variables (set in .env)
  ADMIN_EMAIL=admin@company.com ADMIN_PASSWORD=secure123 node scripts/init-admin.js

Environment Variables:
  ADMIN_EMAIL          Default admin email
  ADMIN_PASSWORD       Default admin password

Note:
  - This script can only be run once (when no admin exists)
  - Password must be at least 6 characters
  - Email must be unique in the system
  `);
  process.exit(0);
}

// Run initialization
initializeAdmin().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

