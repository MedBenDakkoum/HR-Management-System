# Document Controller - MongoDB to Firebase Migration

## ✅ Migration Complete

The `documentController.js` has been successfully migrated from MongoDB to Firebase Firestore.

---

## 📝 Changes Made

### 1. **Imports Updated**

**Before (MongoDB):**
```javascript
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const Document = require("../models/Document");
```

**After (Firebase):**
```javascript
const { db, collections, admin } = require("../config/firebase");
```

### 2. **ID Validation**

**Before (MongoDB):**
```javascript
if (!mongoose.Types.ObjectId.isValid(employeeId)) {
  return res.status(400).json({ message: "Invalid employee ID format" });
}
```

**After (Firebase):**
```javascript
const isValidFirebaseId = (id) => {
  return typeof id === "string" && id.length > 0;
};

if (!isValidFirebaseId(employeeId)) {
  return res.status(400).json({ message: "Invalid employee ID format" });
}
```

---

## 🔄 Function-by-Function Migration

### 1. **generateAttestation**

**Changes:**
- `Employee.findById()` → `db().collection(collections.EMPLOYEES).doc(employeeId).get()`
- `new Document().save()` → `db().collection(collections.DOCUMENTS).add()`
- Added `createdAt` timestamp using `admin.firestore.FieldValue.serverTimestamp()`
- Changed `employee: employeeId` to `employeeId: employeeId`
- Added handling for Firestore Timestamp objects in date conversion

**Database Operations:**
```javascript
// Fetch employee
const employeeDoc = await db()
  .collection(collections.EMPLOYEES)
  .doc(employeeId)
  .get();

const employee = { id: employeeDoc.id, ...employeeDoc.data() };

// Save document
const documentData = {
  employeeId: employeeId,
  type: "attestation",
  fileUrl: cloudinaryResult.secure_url,
  legalInfo: legalInfo || null,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
};

const documentRef = await db()
  .collection(collections.DOCUMENTS)
  .add(documentData);
```

### 2. **generatePaySlip**

**Changes:**
- `Employee.findById()` → `db().collection(collections.EMPLOYEES).doc(employeeId).get()`
- `new Document().save()` → `db().collection(collections.DOCUMENTS).add()`
- Added additional fields to document: `month`, `year`, `salary`, `deductions`, `bonuses`, `netPay`
- Added `createdAt` timestamp

**Database Operations:**
```javascript
// Fetch employee
const employeeDoc = await db()
  .collection(collections.EMPLOYEES)
  .doc(employeeId)
  .get();

// Save pay slip document
const documentData = {
  employeeId: employeeId,
  type: "payslip",
  fileUrl: cloudinaryResult.secure_url,
  month,
  year,
  salary,
  deductions,
  bonuses,
  netPay: salary - deductions + bonuses,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
};

const documentRef = await db()
  .collection(collections.DOCUMENTS)
  .add(documentData);
```

### 3. **getDocuments**

**Changes:**
- `mongoose.Types.ObjectId.isValid()` → `isValidFirebaseId()`
- `Document.find({ employee: employeeId }).populate()` → Query + manual population
- Manual iteration to populate employee data

**Database Operations:**
```javascript
// Query documents
const documentsSnapshot = await db()
  .collection(collections.DOCUMENTS)
  .where("employeeId", "==", employeeId)
  .get();

// Manual population
const documents = [];
for (const doc of documentsSnapshot.docs) {
  const data = doc.data();
  
  const employeeDoc = await db()
    .collection(collections.EMPLOYEES)
    .doc(data.employeeId)
    .get();

  documents.push({
    id: doc.id,
    ...data,
    employee: employeeDoc.exists
      ? { id: employeeDoc.id, name: employeeDoc.data().name }
      : null,
  });
}
```

### 4. **getAllAttestations**

**Changes:**
- `Document.find({ type: "attestation" }).populate()` → Query + manual population
- Changed from `.empty` check to `documentsSnapshot.empty`

**Database Operations:**
```javascript
const documentsSnapshot = await db()
  .collection(collections.DOCUMENTS)
  .where("type", "==", "attestation")
  .get();

// Manual population loop
for (const doc of documentsSnapshot.docs) {
  const data = doc.data();
  const employeeDoc = await db()
    .collection(collections.EMPLOYEES)
    .doc(data.employeeId)
    .get();
  // ... populate and add to array
}
```

### 5. **downloadDocument**

**Changes:**
- `mongoose.Types.ObjectId.isValid()` → `isValidFirebaseId()`
- `Document.findById()` → `db().collection().doc().get()`
- Changed RBAC check from `document.employee.toString()` to `document.employeeId`

**Database Operations:**
```javascript
const documentDoc = await db()
  .collection(collections.DOCUMENTS)
  .doc(docId)
  .get();

if (!documentDoc.exists) {
  return res.status(404).json({ message: "Document not found" });
}

const document = { id: documentDoc.id, ...documentDoc.data() };
```

### 6. **deleteDocument**

**Changes:**
- `mongoose.Types.ObjectId.isValid()` → `isValidFirebaseId()`
- `Document.findById()` → `db().collection().doc().get()`
- `Document.deleteOne({ _id: docId })` → `db().collection().doc(docId).delete()`

**Database Operations:**
```javascript
const documentDoc = await db()
  .collection(collections.DOCUMENTS)
  .doc(docId)
  .get();

// Delete from Cloudinary first
await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });

// Delete from Firestore
await db().collection(collections.DOCUMENTS).doc(docId).delete();
```

### 7. **getAllDocuments**

**Changes:**
- `Document.find({}).populate()` → Query all + manual population
- Loop through all documents to populate employee data

**Database Operations:**
```javascript
const documentsSnapshot = await db()
  .collection(collections.DOCUMENTS)
  .get();

const documents = [];
for (const doc of documentsSnapshot.docs) {
  const data = doc.data();
  const employeeDoc = await db()
    .collection(collections.EMPLOYEES)
    .doc(data.employeeId)
    .get();
  // ... populate and add to array
}
```

---

## 🔧 Technical Details

### Data Structure Changes

**MongoDB Document Schema:**
```javascript
{
  _id: ObjectId,
  employee: ObjectId (ref to Employee),
  type: String,
  fileUrl: String,
  legalInfo: String,
  createdAt: Date
}
```

**Firebase Document Structure:**
```javascript
{
  id: string,
  employeeId: string,
  type: string,
  fileUrl: string,
  legalInfo: string | null,
  createdAt: Timestamp,
  
  // For payslip type:
  month: number,
  year: number,
  salary: number,
  deductions: number,
  bonuses: number,
  netPay: number
}
```

### Key Differences

1. **References**: Changed from ObjectId references to string IDs
2. **Timestamps**: Using Firestore server timestamps instead of JavaScript Date
3. **Population**: Manual population required (no native populate like Mongoose)
4. **ID Field**: Changed from `employee` to `employeeId` for clarity
5. **Validation**: Custom ID validation instead of ObjectId validation

### Date Handling

When working with dates from Firestore (e.g., internship dates):
```javascript
const startDate = employee.internshipDetails.startDate;
// Check if it's a Firestore Timestamp
new Date(startDate.toDate ? startDate.toDate() : startDate)
```

---

## 📊 Operations Migrated

| Operation | Status |
|-----------|--------|
| Generate Attestation | ✅ Migrated |
| Generate Pay Slip | ✅ Migrated |
| Get Documents by Employee | ✅ Migrated |
| Get All Attestations | ✅ Migrated |
| Get All Documents | ✅ Migrated |
| Download Document | ✅ Migrated |
| Delete Document | ✅ Migrated |

---

## 🚀 What Stayed the Same

1. **PDF Generation**: All PDFKit logic remains unchanged
2. **Cloudinary Integration**: File upload/download/delete logic unchanged
3. **RBAC Checks**: Authorization logic remains the same
4. **Response Format**: API responses maintain the same structure
5. **Error Handling**: Error handling patterns preserved

---

## ⚠️ Important Notes

### 1. **Manual Population**
Firebase doesn't have native population like MongoDB. Each related document must be fetched manually:

```javascript
// For each document, fetch the employee
const employeeDoc = await db()
  .collection(collections.EMPLOYEES)
  .doc(data.employeeId)
  .get();
```

**Performance Impact**: This means multiple database queries. Consider:
- Caching frequently accessed employee data
- Using batch reads for better performance
- Implementing pagination for large result sets

### 2. **Timestamp Handling**
When reading dates from Firestore, they come as Timestamp objects:

```javascript
// Convert Firestore Timestamp to JavaScript Date
const date = firestoreTimestamp.toDate();
```

### 3. **No Schema Validation**
Unlike Mongoose schemas, Firestore doesn't enforce structure at the database level. Ensure validation at the application level.

### 4. **Employee ID References**
Changed field name from `employee` to `employeeId` for consistency and clarity that it's a reference ID, not a populated object.

---

## 🧪 Testing Checklist

After migration, test the following:

- [ ] Generate attestation for employee
- [ ] Generate attestation for stagiaire (with internship details)
- [ ] Generate pay slip
- [ ] Get documents for specific employee
- [ ] Get all attestations (admin)
- [ ] Get all documents (admin)
- [ ] Download document (employee - own document)
- [ ] Download document (admin - any document)
- [ ] Delete document (admin only)
- [ ] RBAC: Non-admin trying to generate attestation for another employee
- [ ] RBAC: Employee downloading another employee's document
- [ ] Error handling: Invalid employee ID
- [ ] Error handling: Invalid document ID
- [ ] Error handling: Document not found

---

## 📚 API Endpoints (Unchanged)

All endpoints remain the same:

- `POST /api/documents/attestation` - Generate attestation
- `POST /api/documents/payslip` - Generate pay slip
- `GET /api/documents/employee/:employeeId` - Get employee documents
- `GET /api/documents/attestations` - Get all attestations
- `GET /api/documents/all` - Get all documents
- `GET /api/documents/download/:docId` - Download document
- `DELETE /api/documents/:docId` - Delete document

---

## 🔄 Data Migration Script

If you have existing MongoDB documents, create a migration script:

```javascript
// migrate-documents-to-firebase.js
const mongoose = require('mongoose');
const { db, collections, admin } = require('./config/firebase');
const Document = require('./models/Document');

async function migrateDocuments() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const documents = await Document.find({});
  console.log(`Migrating ${documents.length} documents...`);
  
  for (const doc of documents) {
    const data = {
      employeeId: doc.employee.toString(),
      type: doc.type,
      fileUrl: doc.fileUrl,
      legalInfo: doc.legalInfo || null,
      createdAt: admin.firestore.Timestamp.fromDate(doc.createdAt || new Date()),
    };
    
    // Add payslip-specific fields if applicable
    if (doc.month) data.month = doc.month;
    if (doc.year) data.year = doc.year;
    if (doc.salary) data.salary = doc.salary;
    if (doc.deductions) data.deductions = doc.deductions;
    if (doc.bonuses) data.bonuses = doc.bonuses;
    
    await db().collection(collections.DOCUMENTS).add(data);
  }
  
  console.log('Documents migration complete!');
  process.exit(0);
}

migrateDocuments().catch(console.error);
```

---

## 🎯 Benefits of This Migration

1. **Scalability**: Firestore handles large document collections efficiently
2. **Real-time**: Can add real-time listeners for document changes
3. **Security**: Fine-grained security rules at document level
4. **Integration**: Better integration with Firebase Storage (alternative to Cloudinary)
5. **Offline**: Built-in offline support for mobile/web apps

---

## 📈 Performance Considerations

### Current Implementation
- Multiple sequential queries for population
- One query per document to fetch employee data

### Optimization Opportunities
1. **Batch Reads**: Use `getAll()` to fetch multiple employee documents at once
2. **Denormalization**: Store employee name directly in document for faster reads
3. **Caching**: Cache employee data in memory or Redis
4. **Pagination**: Implement pagination for large document lists

### Example: Batch Read Optimization
```javascript
// Instead of looping and querying each employee
const employeeIds = [...new Set(documents.map(d => d.employeeId))];
const employeeRefs = employeeIds.map(id => 
  db().collection(collections.EMPLOYEES).doc(id)
);
const employeeDocs = await db().getAll(...employeeRefs);

const employeeMap = new Map(
  employeeDocs.map(doc => [doc.id, doc.data()])
);

// Now use the map instead of querying each time
documents.forEach(doc => {
  doc.employee = employeeMap.get(doc.employeeId);
});
```

---

**Migration Date**: November 13, 2025  
**Status**: ✅ Complete and Ready for Testing  
**No Linter Errors**: ✅ Verified

