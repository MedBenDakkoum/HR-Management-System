# Employee Controller - MongoDB to Firebase Migration

## ✅ Migration Complete

The `employeeController.js` has been successfully migrated from MongoDB to Firebase Firestore.

---

## 📝 Changes Made

### 1. **Imports Updated**

**Before (MongoDB):**
```javascript
const Employee = require("../models/Employee");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
```

**After (Firebase):**
```javascript
const { db, collections, admin } = require("../config/firebase");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
```

### 2. **ID Validation**

**Before (MongoDB):**
```javascript
body("employeeId").isMongoId().withMessage("Valid employeeId is required")
```

**After (Firebase):**
```javascript
body("employeeId").notEmpty().withMessage("Valid employeeId is required")

// Added helper function
const isValidFirebaseId = (id) => {
  return typeof id === "string" && id.length > 0;
};
```

---

## 🔄 Function-by-Function Migration

### 1. **registerEmployee**

**Changes:**
- `Employee.find({ role: "admin" })` → `.where("role", "==", "admin").get()`
- `Employee.findOne({ email })` → `.where("email", "==", email).limit(1).get()`
- `new Employee().save()` → `.collection().add()`
- Added `createdAt` and `updatedAt` timestamps
- Return `id` instead of `_id` (with backward compatibility)

**Database Operations:**
```javascript
// Check existing admins
const adminsSnapshot = await db()
  .collection(collections.EMPLOYEES)
  .where("role", "==", "admin")
  .get();

// Check existing employee by email
const existingEmployeeSnapshot = await db()
  .collection(collections.EMPLOYEES)
  .where("email", "==", email)
  .limit(1)
  .get();

// Create employee
const employeeData = {
  name,
  email,
  password: hashedPassword,
  role: role || "employee",
  position,
  internshipDetails: internshipDetails || null,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

const employeeRef = await db()
  .collection(collections.EMPLOYEES)
  .add(employeeData);
```

### 2. **loginEmployee**

**Changes:**
- `Employee.findOne({ email })` → `.where("email", "==", email).limit(1).get()`
- Check `employeeSnapshot.empty` instead of null check
- Extract document ID and data separately
- JWT payload uses `id` instead of `_id`

**Database Operations:**
```javascript
// Find employee by email
const employeeSnapshot = await db()
  .collection(collections.EMPLOYEES)
  .where("email", "==", email)
  .limit(1)
  .get();

if (employeeSnapshot.empty) {
  return res.status(401).json({ message: "Invalid credentials" });
}

const employeeDoc = employeeSnapshot.docs[0];
const employee = { id: employeeDoc.id, ...employeeDoc.data() };

// Generate JWT with employee.id
const token = jwt.sign(
  { id: employee.id, role: employee.role },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);
```

### 3. **registerFace**

**Changes:**
- `Employee.findById()` → `.doc(employeeId).get()`
- `employee.save()` → `.doc(employeeId).update()`
- Added `updatedAt` timestamp

**Database Operations:**
```javascript
const employeeDoc = await db()
  .collection(collections.EMPLOYEES)
  .doc(employeeId)
  .get();

if (!employeeDoc.exists) {
  return res.status(404).json({ message: "Employee not found" });
}

await db().collection(collections.EMPLOYEES).doc(employeeId).update({
  faceDescriptor: faceDescriptor,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});
```

### 4. **updateFaceTemplate**

**Changes:**
- Added `isValidFirebaseId()` validation
- `Employee.findById()` → `.doc(employeeId).get()`
- `.save()` → `.update()`
- Return both `id` and `_id` for compatibility

**Database Operations:**
```javascript
const employeeDoc = await db()
  .collection(collections.EMPLOYEES)
  .doc(employeeId)
  .get();

await db().collection(collections.EMPLOYEES).doc(employeeId).update({
  faceDescriptor: faceDescriptor,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

// Fetch updated document
const updatedDoc = await db()
  .collection(collections.EMPLOYEES)
  .doc(employeeId)
  .get();
```

### 5. **updateQrCode**

**Changes:**
- Similar to updateFaceTemplate
- Added ID validation
- Update operation instead of save

**Database Operations:**
```javascript
await db().collection(collections.EMPLOYEES).doc(employeeId).update({
  qrCode: qrCode,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});
```

### 6. **getEmployees**

**Changes:**
- `Employee.find().select("-password -qrCode")` → `.get()` + manual filtering
- Map through documents to exclude sensitive fields
- Add `id` and `_id` for compatibility

**Database Operations:**
```javascript
const employeesSnapshot = await db()
  .collection(collections.EMPLOYEES)
  .get();

const employees = employeesSnapshot.docs.map((doc) => {
  const data = doc.data();
  // Exclude password and qrCode
  const { password, qrCode, ...employeeData } = data;
  return {
    id: doc.id,
    _id: doc.id, // For backward compatibility
    ...employeeData,
    faceDescriptorRegistered: data.faceDescriptor?.length === 128,
  };
});
```

### 7. **getEmployeeById**

**Changes:**
- Added `isValidFirebaseId()` validation
- `.findById()` → `.doc(id).get()`
- Manual field filtering (no `.select()` in Firestore)
- RBAC logic unchanged

**Database Operations:**
```javascript
const employeeDoc = await db()
  .collection(collections.EMPLOYEES)
  .doc(employeeId)
  .get();

if (!employeeDoc.exists) {
  return res.status(404).json({ message: "Employee not found" });
}

const data = employeeDoc.data();
// Exclude password and qrCode
const { password, qrCode, ...employeeData } = data;

const employee = {
  id: employeeDoc.id,
  _id: employeeDoc.id, // For backward compatibility
  ...employeeData,
  faceDescriptorRegistered: data.faceDescriptor?.length === 128,
};
```

### 8. **updateEmployee**

**Changes:**
- Added ID validation
- `.findById()` → `.doc(id).get()`
- `.save()` → `.update()` with only changed fields
- Added `updatedAt` timestamp

**Database Operations:**
```javascript
const employeeDoc = await db()
  .collection(collections.EMPLOYEES)
  .doc(employeeId)
  .get();

const updateData = {
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

if (name) updateData.name = name;
if (email) updateData.email = email;
if (role) updateData.role = role;
if (position) updateData.position = position;
if (internshipDetails) updateData.internshipDetails = internshipDetails;

await db()
  .collection(collections.EMPLOYEES)
  .doc(employeeId)
  .update(updateData);
```

### 9. **deleteEmployee**

**Changes:**
- Added ID validation
- `Employee.findByIdAndDelete()` → `.doc(id).delete()`
- Check existence before deletion

**Database Operations:**
```javascript
const employeeDoc = await db()
  .collection(collections.EMPLOYEES)
  .doc(employeeId)
  .get();

if (!employeeDoc.exists) {
  return res.status(404).json({ message: "Employee not found" });
}

await db().collection(collections.EMPLOYEES).doc(employeeId).delete();
```

### 10. **getCurrentUser**

**Changes:**
- `.findById()` → `.doc(req.user.id).get()`
- Manual field selection

**Database Operations:**
```javascript
const employeeDoc = await db()
  .collection(collections.EMPLOYEES)
  .doc(req.user.id)
  .get();

const data = employeeDoc.data();
const employee = {
  id: employeeDoc.id,
  _id: employeeDoc.id,
  name: data.name,
  email: data.email,
  role: data.role,
};
```

### 11. **requestFaceUpdate**

**Changes:**
- Changed `.isMongoId()` to `.notEmpty()`
- Added ID validation with `isValidFirebaseId()`
- Wrapped email sending in try-catch for graceful failure

---

## 🔧 Technical Details

### Data Structure Changes

**MongoDB Employee Schema:**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String,
  position: String,
  internshipDetails: Object,
  faceDescriptor: [Number],
  qrCode: String
}
```

**Firebase Employee Document:**
```javascript
{
  id: string,
  name: string,
  email: string (indexed for queries),
  password: string (hashed),
  role: string (indexed for admin queries),
  position: string,
  internshipDetails: object | null,
  faceDescriptor: number[],
  qrCode: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Key Differences

1. **Email Uniqueness**: 
   - MongoDB: Enforced at schema level
   - Firebase: Must check manually before insertion

2. **Field Selection**:
   - MongoDB: `.select("-password -qrCode")`
   - Firebase: Manual destructuring `const { password, qrCode, ...rest } = data`

3. **Queries**:
   - MongoDB: `.findOne({ email })`
   - Firebase: `.where("email", "==", email).limit(1).get()`

4. **Updates**:
   - MongoDB: Modify object and `.save()`
   - Firebase: Call `.update()` with changed fields only

5. **ID Format**:
   - MongoDB: ObjectId (24 char hex string)
   - Firebase: Auto-generated string ID (20 chars)

### Authentication & JWT

**No changes to authentication logic:**
- Password hashing with bcrypt remains the same
- JWT generation unchanged (just uses `id` instead of `_id`)
- Cookie settings preserved
- Token expiration logic unchanged

### Backward Compatibility

To maintain compatibility with existing frontend code, responses include both `id` and `_id`:

```javascript
{
  id: employeeDoc.id,        // Firebase ID
  _id: employeeDoc.id,       // For backward compatibility
  name: employee.name,
  // ... other fields
}
```

---

## 📊 Operations Migrated

| Operation | Status |
|-----------|--------|
| Register Employee | ✅ Migrated |
| Login Employee | ✅ Migrated |
| Register Face | ✅ Migrated |
| Update Face Template | ✅ Migrated |
| Update QR Code | ✅ Migrated |
| Get All Employees | ✅ Migrated |
| Get Employee by ID | ✅ Migrated |
| Update Employee | ✅ Migrated |
| Delete Employee | ✅ Migrated |
| Get Current User | ✅ Migrated |
| Request Face Update | ✅ Migrated |

---

## 🚀 What Stayed the Same

1. **Password Hashing**: bcrypt logic unchanged
2. **JWT Generation**: Same token generation with same expiration
3. **Cookie Management**: All cookie logic preserved
4. **Validation**: express-validator middleware unchanged
5. **RBAC**: All authorization checks preserved
6. **Response Format**: API responses maintain same structure
7. **Error Handling**: Error patterns maintained
8. **Logging**: Winston logger usage unchanged

---

## ⚠️ Important Notes

### 1. **Email Uniqueness**
Firebase doesn't enforce unique constraints like MongoDB. You must check manually:

```javascript
const existingEmployeeSnapshot = await db()
  .collection(collections.EMPLOYEES)
  .where("email", "==", email)
  .limit(1)
  .get();

if (!existingEmployeeSnapshot.empty) {
  // Email already exists
}
```

**Recommendation**: Create a Firestore index on the `email` field for better query performance.

### 2. **Password Security**
Passwords are still hashed with bcrypt before storage. The same security level is maintained.

### 3. **Field Filtering**
Unlike MongoDB's `.select()`, Firebase returns all fields. You must manually exclude sensitive data:

```javascript
const { password, qrCode, ...safeData } = employeeData;
```

### 4. **Timestamps**
Use Firestore server timestamps for consistency:

```javascript
createdAt: admin.firestore.FieldValue.serverTimestamp()
updatedAt: admin.firestore.FieldValue.serverTimestamp()
```

### 5. **Admin Creation**
First admin can be created without authentication. Subsequent admins require existing admin privileges. This logic is preserved from MongoDB implementation.

---

## 🧪 Testing Checklist

After migration, test the following:

### Registration & Authentication:
- [ ] Register first admin (without authentication)
- [ ] Register employee (as admin)
- [ ] Register stagiaire (as admin)
- [ ] Try to register admin (as non-admin) - should fail
- [ ] Try to register employee (as non-admin) - should fail
- [ ] Login with valid credentials
- [ ] Login with invalid email
- [ ] Login with invalid password

### Face Recognition:
- [ ] Register face descriptor
- [ ] Update face template (own profile)
- [ ] Update face template (as admin for another user)
- [ ] Try to update another user's face (as non-admin) - should fail
- [ ] Request face update

### QR Code:
- [ ] Update QR code for employee

### Employee Management:
- [ ] Get all employees (as admin)
- [ ] Get employee by ID (own profile)
- [ ] Get employee by ID (as admin for another user)
- [ ] Try to get another employee (as non-admin) - should fail
- [ ] Update employee details (name, position)
- [ ] Update employee role (as admin)
- [ ] Try to update role (as non-admin) - should fail
- [ ] Delete employee (as admin)

### Current User:
- [ ] Get current user details

### RBAC:
- [ ] Admin accessing any employee data
- [ ] Employee accessing only own data
- [ ] Employee trying to access another employee's data - should fail
- [ ] Admin creating new employees
- [ ] Non-admin trying to create employee - should fail

---

## 📚 API Endpoints (Unchanged)

All endpoints remain the same:

- `POST /api/employees/register` - Register employee
- `POST /api/employees/login` - Login
- `POST /api/employees/register-face` - Register face
- `PUT /api/employees/face/:id` - Update face template
- `PUT /api/employees/qr/:id` - Update QR code
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/me` - Get current user
- `POST /api/employees/request-face-update` - Request face update

---

## 🔄 Data Migration Script

If you have existing MongoDB employees, create a migration script:

```javascript
// migrate-employees-to-firebase.js
const mongoose = require('mongoose');
const { db, collections, admin } = require('./config/firebase');
const Employee = require('./models/Employee');

async function migrateEmployees() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const employees = await Employee.find({});
  console.log(`Migrating ${employees.length} employees...`);
  
  for (const emp of employees) {
    const data = {
      name: emp.name,
      email: emp.email,
      password: emp.password, // Already hashed
      role: emp.role,
      position: emp.position,
      internshipDetails: emp.internshipDetails || null,
      createdAt: admin.firestore.Timestamp.fromDate(emp.createdAt || new Date()),
      updatedAt: admin.firestore.Timestamp.fromDate(emp.updatedAt || new Date()),
    };
    
    // Optional fields
    if (emp.faceDescriptor) data.faceDescriptor = emp.faceDescriptor;
    if (emp.qrCode) data.qrCode = emp.qrCode;
    if (emp.hireDate) data.hireDate = admin.firestore.Timestamp.fromDate(emp.hireDate);
    
    // Use original MongoDB _id as Firestore document ID
    await db().collection(collections.EMPLOYEES).doc(emp._id.toString()).set(data);
  }
  
  console.log('Employees migration complete!');
  process.exit(0);
}

migrateEmployees().catch(console.error);
```

---

## 🔐 Firestore Security Rules

Add security rules for employee collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Employees collection
    match /employees/{employeeId} {
      // Anyone can read their own document
      allow read: if request.auth != null && request.auth.uid == employeeId;
      
      // Admins can read all
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin';
      
      // Only admins can create employees
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin';
      
      // Users can update their own non-sensitive fields
      allow update: if request.auth != null && 
        request.auth.uid == employeeId &&
        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'email', 'password']);
      
      // Admins can update any employee
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin';
      
      // Only admins can delete
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 📈 Performance Considerations

### Indexes Required

Create composite indexes for better query performance:

1. **Email Index** (for login):
   - Collection: `employees`
   - Field: `email` (Ascending)
   - Query scope: Collection

2. **Role Index** (for admin checks):
   - Collection: `employees`
   - Field: `role` (Ascending)
   - Query scope: Collection

### Query Optimization

**Before (MongoDB):**
```javascript
// Single query with select
Employee.findById(id).select("-password -qrCode")
```

**After (Firebase - Optimized):**
```javascript
// Fetch document, then filter in application
const doc = await db().collection(collections.EMPLOYEES).doc(id).get();
const { password, qrCode, ...data } = doc.data();
```

**Note**: Firebase doesn't support field exclusion in queries. All filtering happens in application code.

---

## 🎯 Benefits of This Migration

1. **Scalability**: Firestore automatically scales with user growth
2. **Real-time**: Add real-time listeners for employee updates
3. **Security**: Fine-grained security rules at document level
4. **Offline**: Built-in offline support for mobile apps
5. **Integration**: Better integration with Firebase Auth (future enhancement)
6. **Global**: Multi-region replication for better latency

---

## 💡 Future Enhancements

Consider these Firebase-specific features:

1. **Firebase Authentication**: Replace custom JWT with Firebase Auth
2. **Real-time Listeners**: Add real-time employee status updates
3. **Cloud Functions**: Move sensitive operations to Cloud Functions
4. **Firebase Storage**: Store employee photos/documents
5. **Analytics**: Integrate Firebase Analytics for user behavior
6. **Cloud Messaging**: Use FCM for push notifications

---

**Migration Date**: November 13, 2025  
**Status**: ✅ Complete and Ready for Testing  
**No Linter Errors**: ✅ Verified  
**Backward Compatible**: ✅ Returns both `id` and `_id`

