const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
let db;

const initializeFirebase = () => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      db = admin.firestore();
      return db;
    }

    // Initialize with service account (from environment variable or file)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Parse service account from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Use application default credentials (for local development)
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      throw new Error(
        "Firebase configuration missing. Please set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID environment variable."
      );
    }

    db = admin.firestore();
    console.log("Firebase initialized successfully");
    return db;
  } catch (error) {
    console.error("Error initializing Firebase:", error.message);
    throw error;
  }
};

// Initialize Firebase when this module is imported
initializeFirebase();

// Export Firestore instance and Firebase admin
module.exports = {
  db: () => {
    if (!db) {
      return initializeFirebase();
    }
    return db;
  },
  admin,
  // Firestore references
  collections: {
    EMPLOYEES: "employees",
    ATTENDANCE: "attendance",
    LEAVES: "leaves",
    DOCUMENTS: "documents",
    NOTIFICATIONS: "notifications",
  },
};

