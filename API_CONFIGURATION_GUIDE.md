# API Configuration Guide - Dynamic Backend URL ✅

## Overview
The frontend is now configured to use a **dynamic backend API URL** from environment variables, making it easy to switch between development, production, or any custom server URL.

---

## 🔧 How It Works

### Frontend API Configuration

**File: `client/src/utils/api.js`**

```javascript
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:10000";
```

**Breakdown:**
- `import.meta.env.VITE_API_BASE_URL` - Reads from `.env` file
- `|| "http://localhost:10000"` - Fallback if not set
- Vite requires `VITE_` prefix for environment variables

**Logging (Development Only):**
```javascript
if (import.meta.env.MODE === "development") {
  console.log("🔗 API Base URL:", baseURL);
  console.log("🌍 Mode:", import.meta.env.MODE);
}
```

This helps you verify the correct URL is being used!

---

## 📝 Setup Instructions

### Step 1: Create `.env` File in Client Directory

Create a file at: `client/.env`

**Content:**
```env
# API Configuration
# Backend API base URL

# Development (local server)
VITE_API_BASE_URL=http://localhost:10000

# Production (uncomment and update with your URL)
# VITE_API_BASE_URL=https://your-api-domain.com

# Local network (for testing on mobile devices)
# VITE_API_BASE_URL=http://192.168.1.100:10000
```

### Step 2: Restart Frontend Development Server

**Important:** Vite only reads `.env` on startup!

```bash
# Stop the frontend server (Ctrl+C)
cd client
npm run dev
```

### Step 3: Verify Configuration

**Check browser console** after page loads:

```
🔗 API Base URL: http://localhost:10000
🌍 Mode: development
```

If you see this, configuration is working! ✅

---

## 🌍 Configuration Examples

### 1. Local Development (Default)

**File: `client/.env`**
```env
VITE_API_BASE_URL=http://localhost:10000
```

**Use case:**
- ✅ Running backend on same computer
- ✅ Default setup
- ✅ No network needed

### 2. Production Deployment

**File: `client/.env`**
```env
VITE_API_BASE_URL=https://api.yourcompany.com
```

**Use case:**
- ✅ Deployed backend on cloud (Heroku, AWS, etc.)
- ✅ Frontend deployed separately (Vercel, Netlify, etc.)
- ✅ HTTPS required for production

### 3. Local Network Testing (Mobile Devices)

**File: `client/.env`**
```env
VITE_API_BASE_URL=http://192.168.1.100:10000
```

**Use case:**
- ✅ Testing on phone/tablet
- ✅ Backend running on your computer
- ✅ Both devices on same Wi-Fi

**How to find your IP:**
```bash
# Windows
ipconfig
# Look for "IPv4 Address" under your Wi-Fi adapter

# Mac/Linux
ifconfig
# Look for "inet" address
```

### 4. Different Port

**File: `client/.env`**
```env
VITE_API_BASE_URL=http://localhost:8080
```

**Use case:**
- ✅ Backend running on different port
- ✅ Multiple backends for testing

### 5. Docker/Container

**File: `client/.env`**
```env
VITE_API_BASE_URL=http://backend:10000
```

**Use case:**
- ✅ Docker Compose setup
- ✅ Service name as hostname

---

## 🔍 Troubleshooting

### Issue 1: Changes Not Applied

**Symptom:** Updated `.env` but API still uses old URL

**Solution:**
```bash
# Vite doesn't hot-reload .env changes!
# You MUST restart the dev server:
npm run dev
```

### Issue 2: API Calls to Wrong URL

**Check browser console:**
```
🔗 API Base URL: http://localhost:10000
```

**If wrong:**
1. Update `client/.env`
2. Restart dev server
3. Hard refresh browser (Ctrl+Shift+R)

### Issue 3: CORS Errors in Production

**Error:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Backend fix needed (`server/index.js`):**
```javascript
const cors = require("cors");

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
```

**Backend `.env`:**
```env
FRONTEND_URL=https://your-frontend-domain.com
```

### Issue 4: Environment Variable Not Found

**Check .env file name:**
- ✅ Must be exactly `.env` (starts with dot!)
- ❌ Not `env.txt` or `.env.txt`
- ✅ Must be in `client/` directory
- ✅ Must use `VITE_` prefix

**Verify in code:**
```javascript
// ✅ Correct
import.meta.env.VITE_API_BASE_URL

// ❌ Wrong (missing VITE_ prefix)
import.meta.env.API_BASE_URL
```

---

## 📁 File Structure

```
grh-flesk/
├── client/
│   ├── .env                    ← Create this! (gitignored)
│   ├── env.example.txt         ← Template/reference
│   ├── .gitignore              ← Already configured
│   └── src/
│       └── utils/
│           └── api.js          ← Uses VITE_API_BASE_URL
└── server/
    └── .env                    ← Backend config (already exists)
```

---

## 🚀 Quick Start

### For Development (Default):

**No action needed!** Works out of the box with:
```
Frontend: http://localhost:5173
Backend:  http://localhost:10000
```

### For Custom URL:

1. **Create `client/.env`:**
   ```bash
   # In client directory
   notepad .env
   ```

2. **Add configuration:**
   ```env
   VITE_API_BASE_URL=http://your-custom-url:port
   ```

3. **Restart frontend:**
   ```bash
   npm run dev
   ```

4. **Verify in browser console:**
   ```
   🔗 API Base URL: http://your-custom-url:port
   ```

---

## 🎯 Environment Variables Reference

### Frontend (.env in client/)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `http://localhost:10000` | Backend API URL |

### Backend (.env in server/)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `10000` | Server port |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend URL (for CORS) |
| `JWT_SECRET` | Yes | - | Secret for JWT tokens |
| `FIREBASE_*` | Yes | - | Firebase credentials |
| `CLOUDINARY_*` | Yes | - | Cloudinary credentials |

---

## 🌐 Deployment Scenarios

### Scenario 1: Both on Same Server

**Example:** www.yourcompany.com

```
Frontend: https://www.yourcompany.com (port 443)
Backend:  https://www.yourcompany.com/api (port 443, reverse proxy)
```

**Client `.env`:**
```env
VITE_API_BASE_URL=https://www.yourcompany.com
```

### Scenario 2: Separate Servers

**Example:** 
- Frontend: Vercel
- Backend: Heroku

```
Frontend: https://myapp.vercel.app
Backend:  https://myapp-api.herokuapp.com
```

**Client `.env`:**
```env
VITE_API_BASE_URL=https://myapp-api.herokuapp.com
```

**Server `.env`:**
```env
FRONTEND_URL=https://myapp.vercel.app
```

### Scenario 3: Subdomain

**Example:**
- Frontend: app.yourcompany.com
- Backend: api.yourcompany.com

```
Frontend: https://app.yourcompany.com
Backend:  https://api.yourcompany.com
```

**Client `.env`:**
```env
VITE_API_BASE_URL=https://api.yourcompany.com
```

---

## ✅ Current Setup Status

### Frontend:
- ✅ Uses `VITE_API_BASE_URL` from `.env`
- ✅ Fallback to `http://localhost:10000`
- ✅ Logs configuration in development
- ✅ Supports any backend URL

### What You Need to Do:

**For Development (Already Working):**
- ✅ Nothing! Default works.

**For Production:**
1. Create `client/.env` (copy from `env.example.txt`)
2. Set `VITE_API_BASE_URL=https://your-production-api.com`
3. Rebuild frontend: `npm run build`
4. Deploy `dist/` folder

**For Testing on Mobile:**
1. Find your computer's IP address
2. Create `client/.env`
3. Set `VITE_API_BASE_URL=http://YOUR_IP:10000`
4. Restart dev server
5. Access from mobile: `http://YOUR_IP:5173`

---

## 📝 Quick Reference

### To Change Backend URL:

```bash
# 1. Stop frontend server (Ctrl+C)

# 2. Create/edit client/.env
notepad client\.env

# 3. Add this line:
VITE_API_BASE_URL=http://your-url:port

# 4. Restart frontend
cd client
npm run dev

# 5. Verify in browser console
# Should see: 🔗 API Base URL: http://your-url:port
```

---

## 🎯 Summary

**Feature**: Dynamic backend API URL  
**How**: Environment variable `VITE_API_BASE_URL`  
**Default**: `http://localhost:10000`  
**Location**: `client/.env`  
**Status**: ✅ **ALREADY IMPLEMENTED!**

**To Use:**
1. Create `client/.env` (optional, uses default if not present)
2. Set `VITE_API_BASE_URL=your-url`
3. Restart frontend dev server
4. Check browser console to verify

**For Production:**
- Set `VITE_API_BASE_URL` in your deployment platform's environment variables
- Or create `client/.env` before building

---

**Key Points:**
- ✅ Already configured in code
- ✅ Works with default (localhost:10000)
- ✅ Easy to customize
- ✅ Supports any backend URL
- ✅ Logs current config in console

**Template File:** `client/env.example.txt`  
**Instructions:** Copy to `client/.env` and customize

---

**Updated By:** AI Assistant  
**Date:** November 13, 2025  
**Impact:** Easy to deploy to any backend server! 🚀

