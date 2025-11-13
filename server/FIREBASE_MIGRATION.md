# Firebase Migration Guide

## Overview
The attendance controllers have been successfully migrated from MongoDB to Firebase Firestore.

## Changes Made

### 1. Files Created/Modified

#### New Files:
- `config/firebase.js` - Firebase configuration and initialization

#### Modified Files:
- `controllers/attendanceController.js` - Migrated to Firebase Firestore
- `controllers/attendanceMethodsController.js` - Migrated to Firebase Firestore
- `controllers/attendanceReportsController.js` - Migrated to Firebase Firestore
- `package.json` - Added `firebase-admin` dependency

### 2. Key Changes

#### Database Operations:
- **MongoDB → Firebase Firestore**
  - `Model.find()` → `db().collection().where().get()`
  - `Model.findById()` → `db().collection().doc(id).get()`
  - `new Model().save()` → `db().collection().add(data)`
  - `Model.findOne().update()` → `db().collection().doc(id).update(data)`
  - `Model.countDocuments()` → `snapshot.size`

#### Data Types:
- **ObjectId → String** - Firebase uses string IDs
- **Date → Timestamp** - Use `admin.firestore.Timestamp.fromDate(date)`
- **Mongoose Schema → Plain Objects** - No schema validation at database level

#### Validation:
- Still using `express-validator` for request validation
- Changed from `.isMongoId()` to `.notEmpty()` for ID validation

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install firebase-admin
```

### Step 2: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file securely

### Step 3: Environment Variables

Add the following to your `.env` file:

#### Option 1: Using Service Account JSON (Recommended for Production)

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

#### Option 2: Using Project ID (For Local Development)

```env
FIREBASE_PROJECT_ID=your-project-id
```

**Note:** For Option 2, you need to authenticate using:
```bash
gcloud auth application-default login
```

### Step 4: Firestore Database Setup

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Choose **Production Mode** or **Test Mode**
4. Select a location for your database

### Step 5: Create Firestore Collections

The following collections will be automatically created when you first insert data:
- `employees`
- `attendance`
- `leaves`
- `documents`
- `notifications`

### Step 6: Firestore Indexes (Optional but Recommended)

Create composite indexes for better query performance:

1. Go to **Firestore** > **Indexes**
2. Add the following composite indexes:

#### Attendance Index:
- Collection: `attendance`
- Fields:
  - `employeeId` (Ascending)
  - `entryTime` (Descending)
  - `createdAt` (Descending)

You can also wait for Firestore to suggest indexes when you run queries.

## Data Migration (MongoDB → Firebase)

If you have existing MongoDB data, create a migration script:

```javascript
// migrate-to-firebase.js
const mongoose = require('mongoose');
const { db, collections, admin } = require('./config/firebase');
const Attendance = require('./models/Attendance');
const Employee = require('./models/Employee');

async function migrateAttendance() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Get all attendance records
  const attendanceRecords = await Attendance.find({});
  
  console.log(`Migrating ${attendanceRecords.length} attendance records...`);
  
  for (const record of attendanceRecords) {
    const data = {
      employeeId: record.employee.toString(),
      entryTime: admin.firestore.Timestamp.fromDate(record.entryTime),
      location: record.location,
      method: record.method,
      createdAt: admin.firestore.Timestamp.fromDate(record.createdAt || new Date()),
    };
    
    if (record.exitTime) {
      data.exitTime = admin.firestore.Timestamp.fromDate(record.exitTime);
    }
    
    if (record.exitLocation) {
      data.exitLocation = record.exitLocation;
    }
    
    await db().collection(collections.ATTENDANCE).add(data);
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

migrateAttendance().catch(console.error);
```

Run migration:
```bash
node migrate-to-firebase.js
```

## Testing

After migration, test the following endpoints:

1. **Record Attendance**: `POST /api/attendance`
2. **Get Attendance**: `GET /api/attendance/employee/:employeeId`
3. **Record Exit**: `POST /api/attendance/exit`
4. **Generate QR Code**: `GET /api/attendance/qr/:employeeId`
5. **Scan QR Code**: `POST /api/attendance/scan-qr`
6. **Facial Attendance**: `POST /api/attendance/facial`
7. **Get Reports**: `GET /api/attendance/report/:employeeId`
8. **Get All Reports**: `GET /api/attendance/reports`
9. **Get Daily Stats**: `GET /api/attendance/daily-stats`
10. **Get Total Count**: `GET /api/attendance/total-count`

## Security Rules

Add security rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Employees collection
    match /employees/{employeeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == employeeId;
      allow write: if request.auth != null && get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Attendance collection
    match /attendance/{attendanceId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.employeeId ||
        get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin'
      );
    }
  }
}
```

## Performance Considerations

1. **Batch Writes**: For bulk operations, use batch writes
2. **Pagination**: Implement pagination for large datasets
3. **Caching**: Consider caching frequently accessed data
4. **Indexes**: Create composite indexes for complex queries

## Troubleshooting

### Error: "Firebase configuration missing"
- Check your `.env` file has `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_PROJECT_ID`
- Verify the service account JSON is valid

### Error: "Permission denied"
- Check Firestore security rules
- Verify authentication token is valid

### Error: "Query requires an index"
- Click the link in the error message to create the index automatically
- Or manually create the index in Firebase Console

## Next Steps

To complete the full migration:
1. Migrate Employee controller
2. Migrate Leave controller
3. Migrate Document controller
4. Migrate Notification controller
5. Update authentication middleware to use Firebase Auth (optional)
6. Remove MongoDB dependencies once fully migrated

## Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Node.js SDK](https://firebase.google.com/docs/firestore/quickstart)

