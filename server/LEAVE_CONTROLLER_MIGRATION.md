# Leave Controller - MongoDB to Firebase Migration

## ✅ Migration Complete

The `leaveController.js` has been successfully migrated from MongoDB to Firebase Firestore.

---

## 📝 Changes Made

### 1. **Imports Updated**

**Before (MongoDB):**
```javascript
const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");
```

**After (Firebase):**
```javascript
const { db, collections, admin } = require("../config/firebase");
```

### 2. **ID Validation**

**Before (MongoDB):**
```javascript
body("employeeId").isMongoId().withMessage("Valid employeeId is required")
body("leaveId").isMongoId().withMessage("Valid leaveId is required")
param("employeeId").isMongoId().withMessage("Valid employeeId is required")
```

**After (Firebase):**
```javascript
body("employeeId").notEmpty().withMessage("Valid employeeId is required")
body("leaveId").notEmpty().withMessage("Valid leaveId is required")
param("employeeId").notEmpty().withMessage("Valid employeeId is required")

// Added helper function
const isValidFirebaseId = (id) => {
  return typeof id === "string" && id.length > 0;
};
```

---

## 🔄 Function-by-Function Migration

### 1. **requestLeave**

**Changes:**
- Added `isValidFirebaseId()` validation
- `Employee.findById()` → `.doc(employeeId).get()`
- `new Leave().save()` → `.collection().add()`
- `Employee.find({ role: "admin" })` → `.where("role", "==", "admin").get()`
- Manual Notification creation with Firestore
- Dates converted to Firestore Timestamps
- Added `status: "pending"` and `createdAt` fields

**Database Operations:**
```javascript
// Check employee exists
const employeeDoc = await db()
  .collection(collections.EMPLOYEES)
  .doc(employeeId)
  .get();

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

// Find all admins
const adminsSnapshot = await db()
  .collection(collections.EMPLOYEES)
  .where("role", "==", "admin")
  .get();

// Create notifications for admins
for (const adminDoc of adminsSnapshot.docs) {
  const notificationData = {
    userId: admin.id,
    message: `...`,
    type: "leave_request",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  await db().collection(collections.NOTIFICATIONS).add(notificationData);
}
```

### 2. **approveLeave**

**Changes:**
- Added `isValidFirebaseId()` validation
- `Leave.findById().populate()` → `.doc(leaveId).get()` + manual population
- `leave.save()` → `.doc(leaveId).update()`
- Added `updatedAt` timestamp
- Convert Firestore Timestamps to JavaScript Dates for email

**Database Operations:**
```javascript
// Get leave document
const leaveDoc = await db()
  .collection(collections.LEAVES)
  .doc(leaveId)
  .get();

const leaveData = leaveDoc.data();

// Populate employee data
const employeeDoc = await db()
  .collection(collections.EMPLOYEES)
  .doc(leaveData.employeeId)
  .get();

const employee = { id: employeeDoc.id, ...employeeDoc.data() };

// Update leave status
await db().collection(collections.LEAVES).doc(leaveId).update({
  status: status,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

// Convert Timestamps for email
const startDate = leaveData.startDate.toDate();
const endDate = leaveData.endDate.toDate();
```

### 3. **getLeaves**

**Changes:**
- Added `isValidFirebaseId()` validation
- `Leave.find({ employee: employeeId }).populate()` → Query + manual population
- Loop through results to populate employee data

**Database Operations:**
```javascript
// Query leaves by employeeId
const leavesSnapshot = await db()
  .collection(collections.LEAVES)
  .where("employeeId", "==", employeeId)
  .get();

// Manual population
const leaves = [];
for (const doc of leavesSnapshot.docs) {
  const data = doc.data();

  // Fetch employee data
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
```

### 4. **getAllLeaves**

**Changes:**
- `Leave.find().populate()` → `.get()` + manual population
- Same pattern as getLeaves but without filtering

**Database Operations:**
```javascript
const leavesSnapshot = await db().collection(collections.LEAVES).get();

const leaves = [];
for (const doc of leavesSnapshot.docs) {
  const data = doc.data();

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
```

---

## 🔧 Technical Details

### Data Structure Changes

**MongoDB Leave Schema:**
```javascript
{
  _id: ObjectId,
  employee: ObjectId (ref to Employee),
  startDate: Date,
  endDate: Date,
  reason: String,
  status: String (default: "pending")
}
```

**Firebase Leave Document:**
```javascript
{
  id: string,
  employeeId: string,
  startDate: Timestamp,
  endDate: Timestamp,
  reason: string,
  status: string, // "pending", "approved", "rejected"
  createdAt: Timestamp,
  updatedAt: Timestamp (optional)
}
```

### Key Differences

1. **References**: 
   - MongoDB: `employee: ObjectId`
   - Firebase: `employeeId: string`

2. **Dates**:
   - MongoDB: JavaScript `Date` objects
   - Firebase: Firestore `Timestamp` objects

3. **Population**:
   - MongoDB: `.populate("employee", "name email")`
   - Firebase: Manual query for each employee

4. **Default Values**:
   - MongoDB: Schema defaults
   - Firebase: Set explicitly in code

5. **Timestamps**:
   - MongoDB: Automatic with `timestamps: true`
   - Firebase: Manual with `FieldValue.serverTimestamp()`

### Notification Creation

**Before (MongoDB):**
```javascript
const Notification = require("../models/Notification");
const notification = new Notification({
  userId: admin._id,
  message: "...",
  type: "leave_request",
});
await notification.save();
```

**After (Firebase):**
```javascript
const notificationData = {
  userId: admin.id,
  message: "...",
  type: "leave_request",
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
};

await db().collection(collections.NOTIFICATIONS).add(notificationData);
```

### Date Handling

When working with Firestore Timestamps:

```javascript
// Store date
startDate: admin.firestore.Timestamp.fromDate(new Date(startDate))

// Read date
const jsDate = firestoreTimestamp.toDate();
const formattedDate = jsDate.toLocaleDateString();
```

---

## 📊 Operations Migrated

| Operation | Status |
|-----------|--------|
| Request Leave | ✅ Migrated |
| Approve/Reject Leave | ✅ Migrated |
| Get Leaves by Employee | ✅ Migrated |
| Get All Leaves | ✅ Migrated |

---

## 🚀 What Stayed the Same

1. **Validation Logic**: Date validation (endDate after startDate) unchanged
2. **RBAC**: Authorization checks preserved
3. **Email Notifications**: sendEmailAndNotify logic unchanged
4. **Status Values**: "pending", "approved", "rejected" maintained
5. **Response Format**: API responses maintain same structure
6. **Error Handling**: Error patterns maintained
7. **Logging**: Winston logger usage unchanged

---

## ⚠️ Important Notes

### 1. **Date Conversion**

Always convert dates to Firestore Timestamps when storing:
```javascript
startDate: admin.firestore.Timestamp.fromDate(new Date(startDate))
```

And convert back to JavaScript Date when reading:
```javascript
const startDate = leaveData.startDate.toDate();
```

### 2. **Manual Population**

Unlike MongoDB's `.populate()`, Firebase requires manual population:
```javascript
for (const doc of leavesSnapshot.docs) {
  const data = doc.data();
  const employeeDoc = await db()
    .collection(collections.EMPLOYEES)
    .doc(data.employeeId)
    .get();
  // ... merge data
}
```

**Performance Impact**: Multiple queries per leave. Consider:
- Batch reads for better performance
- Caching employee data
- Denormalizing employee name into leave document

### 3. **Admin Notifications**

The notification system now uses Firestore. Make sure to migrate notificationController as well for consistency.

### 4. **Status Field**

The default status "pending" is now set explicitly in code rather than at the schema level.

### 5. **RBAC Authorization**

All authorization checks are preserved:
- Employees can only request their own leave
- Employees can only view their own leaves
- Admins can approve/reject any leave
- Admins can view all leaves

---

## 🧪 Testing Checklist

After migration, test the following:

### Leave Request:
- [ ] Employee requests own leave
- [ ] Admin requests leave for employee
- [ ] Try to request leave for another employee (non-admin) - should fail
- [ ] Request leave with endDate before startDate - should fail
- [ ] Verify employee receives email notification
- [ ] Verify admins receive notification

### Leave Approval:
- [ ] Admin approves leave
- [ ] Admin rejects leave
- [ ] Verify employee receives approval email
- [ ] Verify employee receives rejection email
- [ ] Try to approve leave as non-admin - should fail (via middleware)

### Get Leaves:
- [ ] Employee views own leaves
- [ ] Admin views employee's leaves
- [ ] Try to view another employee's leaves (non-admin) - should fail
- [ ] Verify employee data is populated correctly
- [ ] Verify dates are formatted correctly

### Get All Leaves:
- [ ] Admin gets all leaves
- [ ] Verify all leaves have employee data populated
- [ ] Check performance with many leaves

### RBAC:
- [ ] Admin accessing any leave data
- [ ] Employee accessing only own leaves
- [ ] Employee trying to access another employee's leaves - should fail

---

## 📚 API Endpoints (Unchanged)

All endpoints remain the same:

- `POST /api/leaves/request` - Request leave
- `POST /api/leaves/approve` - Approve/reject leave
- `GET /api/leaves/employee/:employeeId` - Get leaves for employee
- `GET /api/leaves/all` - Get all leaves (admin)

---

## 🔄 Data Migration Script

If you have existing MongoDB leaves, create a migration script:

```javascript
// migrate-leaves-to-firebase.js
const mongoose = require('mongoose');
const { db, collections, admin } = require('./config/firebase');
const Leave = require('./models/Leave');

async function migrateLeaves() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const leaves = await Leave.find({});
  console.log(`Migrating ${leaves.length} leaves...`);
  
  for (const leave of leaves) {
    const data = {
      employeeId: leave.employee.toString(),
      startDate: admin.firestore.Timestamp.fromDate(leave.startDate),
      endDate: admin.firestore.Timestamp.fromDate(leave.endDate),
      reason: leave.reason,
      status: leave.status || "pending",
      createdAt: admin.firestore.Timestamp.fromDate(leave.createdAt || new Date()),
    };
    
    if (leave.updatedAt) {
      data.updatedAt = admin.firestore.Timestamp.fromDate(leave.updatedAt);
    }
    
    await db().collection(collections.LEAVES).add(data);
  }
  
  console.log('Leaves migration complete!');
  process.exit(0);
}

migrateLeaves().catch(console.error);
```

---

## 🔐 Firestore Security Rules

Add security rules for leave collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Leaves collection
    match /leaves/{leaveId} {
      // Users can read their own leaves
      allow read: if request.auth != null && 
        resource.data.employeeId == request.auth.uid;
      
      // Admins can read all leaves
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin';
      
      // Users can create leaves for themselves
      allow create: if request.auth != null && 
        request.resource.data.employeeId == request.auth.uid &&
        request.resource.data.status == 'pending';
      
      // Admins can create leaves for anyone
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin';
      
      // Only admins can update leaves (approve/reject)
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin';
      
      // Only admins can delete leaves
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 📈 Performance Considerations

### Current Implementation

**Potential Performance Issue**: Manual population requires N+1 queries
- 1 query to get leaves
- N queries to get employee data (one per leave)

### Optimization Strategies

1. **Batch Reads** (Recommended):
```javascript
// Get all unique employee IDs
const employeeIds = [...new Set(leaves.map(l => l.employeeId))];

// Batch fetch all employees
const employeeRefs = employeeIds.map(id => 
  db().collection(collections.EMPLOYEES).doc(id)
);
const employeeDocs = await db().getAll(...employeeRefs);

// Create a map for quick lookup
const employeeMap = new Map(
  employeeDocs.map(doc => [doc.id, doc.data()])
);

// Use the map instead of querying each time
leaves.forEach(leave => {
  leave.employee = employeeMap.get(leave.employeeId);
});
```

2. **Denormalization** (Advanced):
Store employee name directly in leave document:
```javascript
{
  employeeId: "123",
  employeeName: "John Doe", // Denormalized
  startDate: Timestamp,
  // ...
}
```

3. **Caching**:
Cache frequently accessed employee data in memory or Redis.

### Indexes Required

Create indexes for better query performance:

1. **EmployeeId Index**:
   - Collection: `leaves`
   - Field: `employeeId` (Ascending)
   - Query scope: Collection

2. **Status Index** (Optional):
   - Collection: `leaves`
   - Field: `status` (Ascending)
   - Query scope: Collection

---

## 🎯 Benefits of This Migration

1. **Scalability**: Firestore handles large leave datasets efficiently
2. **Real-time**: Add real-time listeners for live leave status updates
3. **Security**: Fine-grained security rules at document level
4. **Offline**: Built-in offline support for mobile apps
5. **Integration**: Better integration with Firebase ecosystem

---

## 💡 Future Enhancements

Consider these Firebase-specific features:

1. **Real-time Listeners**: Get live updates when leave status changes
2. **Cloud Functions**: Auto-approve leaves based on rules
3. **Cloud Messaging**: Push notifications for leave status
4. **Batch Operations**: Approve multiple leaves at once
5. **Leave Analytics**: Track leave patterns and trends

### Example: Real-time Leave Updates

```javascript
// Frontend - Listen to leave status changes
db().collection('leaves')
  .where('employeeId', '==', currentUserId)
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        // Leave status changed - update UI
        console.log('Leave status updated:', change.doc.data());
      }
    });
  });
```

---

**Migration Date**: November 13, 2025  
**Status**: ✅ Complete and Ready for Testing  
**No Linter Errors**: ✅ Verified  
**Performance**: ⚠️ Consider batch reads for optimization

