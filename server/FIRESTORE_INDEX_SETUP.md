# Firestore Index Setup Guide

## Overview
When you first run queries with `where()` + `orderBy()` clauses, Firestore will require composite indexes. This guide shows you how to create them.

---

## 🔍 What Will Happen

When you first call certain endpoints, you'll see errors like:

```
The query requires an index. You can create it here: 
https://console.firebase.google.com/v1/r/project/YOUR_PROJECT/firestore/indexes?create_composite=...
```

**Don't panic!** This is normal. Firestore needs you to create indexes for complex queries.

---

## 📝 Required Indexes

### 1. Notifications - User ID + Timestamp
**Used by**: `GET /api/notifications/:userId/notifications`

**Query**:
```javascript
.where("userId", "==", userId)
.orderBy("timestamp", "desc")
```

**Index:**
- Collection: `notifications`
- Fields:
  - `userId` (Ascending)
  - `timestamp` (Descending)
- Query scope: Collection

### 2. Notifications - User ID + Read Status
**Used by**: `PATCH /api/notifications/:userId/notifications/read-all`

**Query**:
```javascript
.where("userId", "==", userId)
.where("read", "==", false)
```

**Index:**
- Collection: `notifications`
- Fields:
  - `userId` (Ascending)
  - `read` (Ascending)
- Query scope: Collection

### 3. Notifications - Timestamp + Read (for cleanup)
**Used by**: `DELETE /api/notifications/notifications/cleanup`

**Query**:
```javascript
.where("timestamp", "<", thirtyDaysAgo)
.where("read", "==", true)
```

**Index:**
- Collection: `notifications`
- Fields:
  - `timestamp` (Ascending)
  - `read` (Ascending)
- Query scope: Collection

### 4. Attendance - Employee ID + Entry Time
**Used by**: `GET /api/attendance/employee/:employeeId`

**Query**:
```javascript
.where("employeeId", "==", employeeId)
.orderBy("createdAt", "desc")
```

**Index:**
- Collection: `attendance`
- Fields:
  - `employeeId` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

### 5. Attendance - Employee ID + Entry Time (Reports)
**Used by**: `GET /api/attendance/report/:employeeId`

**Query**:
```javascript
.where("employeeId", "==", employeeId)
.where("entryTime", ">=", start)
.where("entryTime", "<=", end)
```

**Index:**
- Collection: `attendance`
- Fields:
  - `employeeId` (Ascending)
  - `entryTime` (Ascending)
- Query scope: Collection

### 6. Attendance - Entry Time Only
**Used by**: `GET /api/attendance/daily-stats`

**Query**:
```javascript
.where("entryTime", ">=", startDate)
```

**Index:**
- Collection: `attendance`
- Fields:
  - `entryTime` (Ascending)
- Query scope: Collection

### 7. Leaves - Employee ID
**Used by**: `GET /api/leaves/employee/:employeeId`

**Query**:
```javascript
.where("employeeId", "==", employeeId)
```

**Index:**
- Collection: `leaves`
- Fields:
  - `employeeId` (Ascending)
- Query scope: Collection

### 8. Documents - Employee ID
**Used by**: `GET /api/documents/employee/:employeeId`

**Query**:
```javascript
.where("employeeId", "==", employeeId)
```

**Index:**
- Collection: `documents`
- Fields:
  - `employeeId` (Ascending)
- Query scope: Collection

### 9. Documents - Type
**Used by**: `GET /api/documents/attestations`

**Query**:
```javascript
.where("type", "==", "attestation")
```

**Index:**
- Collection: `documents`
- Fields:
  - `type` (Ascending)
- Query scope: Collection

### 10. Employees - Email
**Used by**: Login, registration checks

**Query**:
```javascript
.where("email", "==", email)
```

**Index:**
- Collection: `employees`
- Fields:
  - `email` (Ascending)
- Query scope: Collection

### 11. Employees - Role
**Used by**: Admin checks, leave notifications

**Query**:
```javascript
.where("role", "==", "admin")
```

**Index:**
- Collection: `employees`
- Fields:
  - `role` (Ascending)
- Query scope: Collection

---

## 🚀 Easy Setup Method: Automatic

### The Easiest Way:

1. **Just use the app normally**
2. When you get an error with a link, **click the link**
3. Firebase Console will open with the index pre-configured
4. **Click "Create Index"**
5. Wait 1-2 minutes for the index to build
6. **Try again** - it will work!

**Example Error:**
```
The query requires an index. You can create it here: 
https://console.firebase.google.com/v1/r/project/flesk-hr-123/firestore/indexes?create_composite=...
```

→ Click the link → Click "Create Index" → Done!

---

## 🛠️ Manual Setup Method

If you prefer to create indexes manually:

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Click on **Indexes** tab

### Step 2: Create Composite Index
1. Click **Create Index**
2. Select collection (e.g., `notifications`)
3. Add fields:
   - Field: `userId`, Order: `Ascending`
   - Field: `timestamp`, Order: `Descending`
4. Query scope: `Collection`
5. Click **Create Index**

### Step 3: Wait for Index to Build
- Small collections: ~1 minute
- Large collections: Can take several minutes
- You'll see "Building..." status

### Step 4: Test
Once status shows "Enabled", test your endpoint again.

---

## 📋 Quick Start Checklist

When first setting up the system:

1. [ ] Create Firebase project
2. [ ] Enable Firestore database
3. [ ] Add service account to environment variables
4. [ ] Start the server
5. [ ] Try to use the app normally
6. [ ] Click index creation links when they appear
7. [ ] Wait for indexes to build
8. [ ] Retry the operations

**That's it!** Firebase will guide you through index creation.

---

## ⚡ Pre-create All Indexes (Advanced)

If you want to create all indexes upfront, use the Firebase CLI:

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Login
```bash
firebase login
```

### Step 3: Create `firestore.indexes.json`

Create this file in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "read", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "timestamp", "order": "ASCENDING" },
        { "fieldPath": "read", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "attendance",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "employeeId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "attendance",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "employeeId", "order": "ASCENDING" },
        { "fieldPath": "entryTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "leaves",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "employeeId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "documents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "employeeId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "documents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "employees",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "email", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "employees",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "role", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### Step 4: Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

This will create all indexes at once!

---

## 🐛 Troubleshooting

### Error: "The query requires an index"
**Solution**: Click the link in the error message and create the index.

### Error: "Index creation failed"
**Solution**: 
1. Check you have proper permissions in Firebase project
2. Verify collection and field names are correct
3. Try creating the index manually in Firebase Console

### Indexes Taking Too Long
**Solution**:
- Small datasets: Should complete in 1-2 minutes
- Large datasets: Can take 10-30 minutes
- Check index status in Firebase Console

### Error: "Permission denied"
**Solution**:
1. Check Firestore security rules
2. Verify user is authenticated
3. Check user has proper role permissions

---

## 📊 Index Status

You can check index status in Firebase Console:
- **Building**: Index is being created (wait)
- **Enabled**: Index is ready to use
- **Error**: Index creation failed (recreate)

---

**Created**: November 13, 2025  
**Status**: Ready to Use  
**Recommendation**: Use automatic index creation (click links in errors)

