# Admin Initialization Guide

## Overview

The admin initialization system allows you to create the first admin user for your FLESK HR system. This is essential for setting up the system for the first time.

---

## 🎯 Features

- ✅ Create initial admin user
- ✅ Multiple initialization methods (API, CLI, Environment)
- ✅ Check initialization status
- ✅ Prevents duplicate admin creation during init
- ✅ Secure password hashing
- ✅ Comprehensive logging

---

## 🚀 Method 1: API Endpoint (Recommended for Web Setup)

### 1.1 Check Initialization Status

**Endpoint**: `GET /api/init/status`

**Description**: Check if the system has been initialized with an admin user.

**Request**:
```bash
curl http://localhost:5000/api/init/status
```

**Response**:
```json
{
  "success": true,
  "data": {
    "isInitialized": false,
    "hasAdmin": false,
    "totalEmployees": 0,
    "message": "System needs initialization - no admin user found"
  }
}
```

### 1.2 Initialize Admin User

**Endpoint**: `POST /api/init/admin`

**Description**: Create the first admin user. Only works if no admin exists.

**Request Body**:
```json
{
  "name": "Admin User",
  "email": "admin@flesk.com",
  "password": "securepassword123",
  "position": "System Administrator"
}
```

**Request Example**:
```bash
curl -X POST http://localhost:5000/api/init/admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@flesk.com",
    "password": "securepassword123",
    "position": "System Administrator"
  }'
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Initial admin user created successfully",
  "data": {
    "admin": {
      "id": "abc123xyz789",
      "_id": "abc123xyz789",
      "name": "Admin User",
      "email": "admin@flesk.com",
      "role": "admin",
      "position": "System Administrator"
    }
  }
}
```

**Error Response (400) - Admin Exists**:
```json
{
  "success": false,
  "message": "Admin user already exists. Cannot initialize again."
}
```

**Error Response (400) - Invalid Password**:
```json
{
  "success": false,
  "message": "Password must be at least 6 characters long"
}
```

---

## 💻 Method 2: Command Line Script (Recommended for Server Setup)

### 2.1 Interactive Mode

Run the script and follow the prompts:

```bash
node scripts/init-admin.js
```

**Example Session**:
```
🔥 FLESK Admin Initialization

=====================================

Checking for existing admin...
✓ No admin found. Proceeding with initialization...

Admin Name [Admin]: John Doe
Admin Email [admin@flesk.com]: john@company.com
Admin Password (min 6 chars) [admin123456]: MySecurePass123

📝 Creating admin user...

✅ Admin user created successfully!

=====================================
Admin Details:
=====================================
Name:     John Doe
Email:    john@company.com
Password: MySecurePass123
Role:     admin
ID:       xyz789abc123
=====================================

⚠️  Important: Please save these credentials securely!
💡 You can now login with these credentials.
```

### 2.2 Command Line Arguments

Provide all details via command line arguments:

```bash
node scripts/init-admin.js \
  --email admin@company.com \
  --password securepass123 \
  --name "Admin User" \
  --position "CEO"
```

### 2.3 Environment Variables

Set defaults in `.env` file:

```env
ADMIN_EMAIL=admin@flesk.com
ADMIN_PASSWORD=admin123456
```

Then run:
```bash
node scripts/init-admin.js
```

### 2.4 Show Help

```bash
node scripts/init-admin.js --help
```

---

## 🌍 Method 3: Environment Variables + Existing Endpoint

You can also use environment variables with the existing employee registration endpoint:

### 3.1 Set Environment Variables

Add to `.env`:
```env
ADMIN_EMAIL=admin@flesk.com
ADMIN_PASSWORD=admin123456
```

### 3.2 Use Employee Registration

The employee registration endpoint already supports creating the first admin without authentication:

```bash
curl -X POST http://localhost:5000/api/employees/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@flesk.com",
    "password": "admin123456",
    "role": "admin",
    "position": "Administrator"
  }'
```

**Note**: This only works if no admin exists. Once an admin exists, authentication is required.

---

## 🔧 Setup Instructions

### Step 1: Choose Your Method

- **Web Setup**: Use API endpoints (Method 1)
- **Server Setup**: Use CLI script (Method 2)
- **Quick Setup**: Use environment variables (Method 3)

### Step 2: Verify Initialization

Check status:
```bash
curl http://localhost:5000/api/init/status
```

Or login with the created credentials:
```bash
curl -X POST http://localhost:5000/api/employees/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@flesk.com",
    "password": "admin123456"
  }'
```

### Step 3: Secure Your Admin Account

After initialization:
1. ✅ Change the default password immediately
2. ✅ Use a strong, unique password
3. ✅ Enable two-factor authentication (if available)
4. ✅ Restrict admin email to your organization domain

---

## 📊 API Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/init/status` | No | Check if system is initialized |
| POST | `/api/init/admin` | No* | Create first admin user |

*Only works if no admin exists. Returns 400 if admin already exists.

---

## 🔒 Security Considerations

### Password Requirements
- Minimum 6 characters (configurable)
- Hashed using bcrypt with 10 salt rounds
- Never stored or logged in plain text

### Best Practices
1. **Change Default Credentials**: If using defaults, change them immediately
2. **Strong Passwords**: Use complex passwords with mixed characters
3. **Secure Storage**: Store admin credentials in a secure password manager
4. **Limit Access**: Only authorized personnel should have admin credentials
5. **Regular Updates**: Change passwords periodically

### Production Deployment
```env
# Use strong, unique credentials in production
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=VeryStrongP@ssw0rd!2024

# Never commit these to version control
# Add .env to .gitignore
```

---

## 🧪 Testing

### Test Initialization Status
```bash
# Should return isInitialized: false initially
curl http://localhost:5000/api/init/status
```

### Test Admin Creation
```bash
# Create admin
curl -X POST http://localhost:5000/api/init/admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@admin.com",
    "password": "testpass123"
  }'

# Verify status changed
curl http://localhost:5000/api/init/status
# Should now return isInitialized: true
```

### Test Login
```bash
# Login with created admin
curl -X POST http://localhost:5000/api/employees/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@admin.com",
    "password": "testpass123"
  }'
```

### Test Duplicate Prevention
```bash
# Try to create another admin via init
curl -X POST http://localhost:5000/api/init/admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "another@admin.com",
    "password": "testpass123"
  }'
# Should return 400 error
```

---

## 🐛 Troubleshooting

### Error: "Admin user already exists"

**Problem**: Trying to initialize when admin already exists.

**Solution**: 
1. Check status: `curl http://localhost:5000/api/init/status`
2. If admin exists, use regular employee registration endpoint with admin credentials
3. To reset, delete existing admin from Firebase Console (use with caution!)

### Error: "An account with this email already exists"

**Problem**: Email is already registered in the system.

**Solution**: 
1. Use a different email address
2. Or delete the existing account from Firebase Console

### Error: "Password must be at least 6 characters"

**Problem**: Password is too short.

**Solution**: Use a password with at least 6 characters.

### Error: "Firebase configuration missing"

**Problem**: Firebase not configured properly.

**Solution**:
1. Check `.env` file has `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_PROJECT_ID`
2. Verify Firebase project is set up correctly
3. Check `config/firebase.js` is initialized

### CLI Script Errors

**Problem**: Script fails with module errors.

**Solution**:
```bash
# Install dependencies
npm install

# Run from project root
cd server
node scripts/init-admin.js
```

---

## 📝 Examples

### Example 1: Web-based Setup

```javascript
// Frontend code to initialize admin
async function initializeSystem() {
  // Check status
  const statusResponse = await fetch('/api/init/status');
  const status = await statusResponse.json();
  
  if (!status.data.isInitialized) {
    // Create admin
    const response = await fetch('/api/init/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@company.com',
        password: 'securepass123',
        position: 'Administrator'
      })
    });
    
    const result = await response.json();
    console.log('Admin created:', result);
  }
}
```

### Example 2: Automated Setup Script

```bash
#!/bin/bash

# automated-setup.sh
# Automated admin initialization script

echo "Setting up FLESK HR System..."

# Check if initialized
STATUS=$(curl -s http://localhost:5000/api/init/status)
IS_INIT=$(echo $STATUS | jq -r '.data.isInitialized')

if [ "$IS_INIT" = "false" ]; then
  echo "Creating admin user..."
  
  curl -X POST http://localhost:5000/api/init/admin \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$ADMIN_NAME\",
      \"email\": \"$ADMIN_EMAIL\",
      \"password\": \"$ADMIN_PASSWORD\"
    }"
  
  echo "Admin created successfully!"
else
  echo "System already initialized"
fi
```

### Example 3: Docker Initialization

```dockerfile
# Dockerfile
FROM node:18

WORKDIR /app
COPY . .

RUN npm install

# Initialize admin on container start
CMD ["sh", "-c", "node scripts/init-admin.js && npm start"]
```

With `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: .
    environment:
      - ADMIN_EMAIL=admin@company.com
      - ADMIN_PASSWORD=securepass123
      - FIREBASE_SERVICE_ACCOUNT=${FIREBASE_SERVICE_ACCOUNT}
    ports:
      - "5000:5000"
```

---

## 🎯 Quick Start Guide

### For First-Time Setup:

1. **Check Status**:
   ```bash
   curl http://localhost:5000/api/init/status
   ```

2. **Initialize Admin** (choose one):
   
   **Option A - CLI** (Recommended):
   ```bash
   node scripts/init-admin.js
   ```
   
   **Option B - API**:
   ```bash
   curl -X POST http://localhost:5000/api/init/admin \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@flesk.com","password":"admin123456"}'
   ```

3. **Login**:
   ```bash
   curl -X POST http://localhost:5000/api/employees/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@flesk.com","password":"admin123456"}'
   ```

4. **Change Password** (via update employee endpoint)

---

## 📚 Related Documentation

- **Employee Controller**: See `employeeController.js` for employee management
- **Firebase Setup**: See `FIREBASE_MIGRATION.md` for Firebase configuration
- **Authentication**: See auth middleware for JWT token handling

---

## ✅ Checklist

Before going to production:

- [ ] Admin user initialized
- [ ] Default password changed
- [ ] Strong password policy enforced
- [ ] Admin credentials secured
- [ ] Environment variables set correctly
- [ ] Firebase security rules configured
- [ ] Init endpoints tested
- [ ] Login verified
- [ ] Documentation reviewed

---

**Created**: November 13, 2025  
**Status**: Production Ready  
**Version**: 1.0.0

*Your FLESK HR System is ready to go! 🎉*

