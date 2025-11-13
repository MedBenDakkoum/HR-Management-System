# Vercel Deployment Guide - CORS Configuration ✅

## Overview
Complete guide to deploy your app on Vercel with proper CORS configuration.

---

## 📁 Files Created

1. ✅ `server/vercel.json` - Backend Vercel configuration
2. ✅ `client/vercel.json` - Frontend Vercel configuration
3. ✅ `server/env-example.txt` - Environment variables template

---

## 🚀 Deployment Steps

### Step 1: Prepare Backend for Vercel

**1.1. Ensure `server/vercel.json` exists** ✅ (Already created!)

**1.2. Update `server/package.json` scripts:**
```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "vercel-build": "echo 'Building for Vercel...'"
  }
}
```

**1.3. Create `.vercelignore` in server/ (optional):**
```
node_modules
.env
logs
*.log
.git
```

### Step 2: Deploy Backend to Vercel

**2.1. Install Vercel CLI (if not installed):**
```bash
npm install -g vercel
```

**2.2. Login to Vercel:**
```bash
vercel login
```

**2.3. Deploy backend:**
```bash
cd server
vercel
```

**Follow prompts:**
- Set up and deploy? → **Yes**
- Which scope? → **Your account**
- Link to existing project? → **No** (first time)
- Project name? → **grh-flesk-backend**
- Directory? → **./server** or **.** (if already in server/)
- Override settings? → **No**

**2.4. Set environment variables:**
```bash
vercel env add JWT_SECRET
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_PRIVATE_KEY
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
```

**Important:** Add these variables for **Production** environment!

**Or use Vercel Dashboard:**
1. Go to vercel.com
2. Select your backend project
3. Settings → Environment Variables
4. Add all required variables

### Step 3: Configure CORS for Production

**3.1. Get your frontend URL after deployment**

Example: `https://grh-flesk.vercel.app`

**3.2. Add to backend environment variables:**

**Via CLI:**
```bash
vercel env add ALLOWED_ORIGINS
# Value: https://grh-flesk.vercel.app
```

**Via Dashboard:**
1. Backend project → Settings → Environment Variables
2. Add variable:
   - Name: `ALLOWED_ORIGINS`
   - Value: `https://grh-flesk.vercel.app`
   - Environment: Production

**3.3. For multiple domains:**
```
ALLOWED_ORIGINS=https://grh-flesk.vercel.app,https://www.grh-flesk.com
```

**3.4. Redeploy backend:**
```bash
vercel --prod
```

### Step 4: Deploy Frontend to Vercel

**4.1. Deploy frontend:**
```bash
cd client
vercel
```

**4.2. Set frontend environment variable:**

**Via CLI:**
```bash
vercel env add VITE_API_BASE_URL
# Value: https://your-backend-name.vercel.app
```

**Via Dashboard:**
1. Frontend project → Settings → Environment Variables
2. Add variable:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://your-backend-name.vercel.app`
   - Environment: Production, Preview, Development

**4.3. Redeploy frontend:**
```bash
vercel --prod
```

---

## 🔧 Vercel Configuration Details

### Backend (`server/vercel.json`)

```json
{
  "version": 2,
  "name": "grh-flesk-backend",
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js",
      "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "index.js": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.js"
    }
  ]
}
```

**Key settings:**
- ✅ `version: 2` - Vercel config version
- ✅ `builds` - Build index.js as Node.js serverless function
- ✅ `routes` - Route all requests to index.js
- ✅ `maxDuration: 30` - Max function execution time (30s)
- ✅ `rewrites` - SPA routing support

### Frontend (`client/vercel.json`)

```json
{
  "version": 2,
  "name": "grh-flesk-frontend",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Key settings:**
- ✅ `framework: vite` - Vite optimization
- ✅ `outputDirectory: dist` - Build output
- ✅ `rewrites` - SPA routing (React Router)

---

## 🌐 CORS on Vercel - How It Works

### Production Setup:

**1. Backend `.env` (Vercel environment variables):**
```env
ALLOWED_ORIGINS=https://your-frontend.vercel.app
NODE_ENV=production
```

**2. Frontend `.env` (Vercel environment variables):**
```env
VITE_API_BASE_URL=https://your-backend.vercel.app
```

**3. CORS Flow:**
```
Frontend (https://your-frontend.vercel.app)
    ↓
Makes API call to https://your-backend.vercel.app
    ↓
Backend checks ALLOWED_ORIGINS
    ↓
Match found! ✅
    ↓
Adds CORS headers
    ↓
Response allowed ✅
```

---

## 🔑 Required Environment Variables on Vercel

### Backend Project (Required):

| Variable | Example | Where to Get |
|----------|---------|--------------|
| `JWT_SECRET` | `random-secret-key-xyz` | Generate random string |
| `FIREBASE_PROJECT_ID` | `flesk-a375d` | Firebase Console |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | Firebase Service Account |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk@...` | Firebase Service Account |
| `CLOUDINARY_CLOUD_NAME` | `ds4iqazaj` | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | `775923516381513` | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | `secret-here` | Cloudinary Dashboard |

### Backend Project (Optional):

| Variable | Example | Purpose |
|----------|---------|---------|
| `ALLOWED_ORIGINS` | `https://app.vercel.app` | CORS configuration |
| `ALLOWED_LNG` | `8.8362755` | Office longitude |
| `ALLOWED_LAT` | `33.1245286` | Office latitude |
| `ALLOWED_RADIUS` | `500` | Allowed distance (meters) |
| `LOG_LEVEL` | `info` | Logging verbosity |

### Frontend Project (Required):

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `https://backend.vercel.app` | Backend API URL |

---

## 📋 Step-by-Step Vercel Deployment

### Deploy Backend First:

```bash
# 1. Navigate to server directory
cd server

# 2. Deploy to Vercel
vercel

# 3. Follow prompts (first time)
# - Project name: grh-flesk-backend
# - Directory: .
# - Override settings: No

# 4. Note the deployment URL
# Example: https://grh-flesk-backend.vercel.app

# 5. Add environment variables in Vercel Dashboard
# Go to: vercel.com → Your Project → Settings → Environment Variables

# 6. Add all required variables (see table above)

# 7. Deploy to production
vercel --prod

# 8. Your backend is live!
# URL: https://grh-flesk-backend.vercel.app
```

### Deploy Frontend Second:

```bash
# 1. Navigate to client directory
cd client

# 2. Deploy to Vercel
vercel

# 3. Follow prompts
# - Project name: grh-flesk-frontend
# - Framework: Vite
# - Directory: .
# - Build command: npm run build
# - Output directory: dist

# 4. Add environment variable in Vercel Dashboard
# Name: VITE_API_BASE_URL
# Value: https://grh-flesk-backend.vercel.app
# Environment: Production, Preview, Development

# 5. Deploy to production
vercel --prod

# 6. Your frontend is live!
# URL: https://grh-flesk-frontend.vercel.app
```

### Update Backend ALLOWED_ORIGINS:

```bash
# Now that you have frontend URL, update backend:

# 1. Go to backend project on Vercel Dashboard
# 2. Settings → Environment Variables
# 3. Add/Edit ALLOWED_ORIGINS
# Value: https://grh-flesk-frontend.vercel.app

# 4. Redeploy backend
vercel --prod
```

---

## 🧪 Testing Deployed App

### Test 1: Check CORS Headers

**1. Open frontend:** `https://grh-flesk-frontend.vercel.app`

**2. Open browser DevTools (F12) → Network tab**

**3. Make API call** (login, etc.)

**4. Check response headers:**
```
Access-Control-Allow-Origin: https://grh-flesk-frontend.vercel.app
Access-Control-Allow-Credentials: true
```

✅ If you see these, CORS is configured correctly!

### Test 2: API Calls Work

**1. Try to login**
**2. Try attendance operations**
**3. Try document generation**

✅ All should work without CORS errors!

### Test 3: Check Backend Logs

**Vercel Dashboard → Backend Project → Functions → View Logs**

Should see:
```
🌐 CORS Configuration:
   Allowed Origins: ['https://grh-flesk-frontend.vercel.app']
```

---

## 🐛 Troubleshooting CORS on Vercel

### Issue 1: "CORS blocked" in Production

**Check 1: ALLOWED_ORIGINS set?**
```
Vercel Dashboard → Backend → Settings → Environment Variables
✅ ALLOWED_ORIGINS should be set to your frontend URL
```

**Check 2: Correct frontend URL?**
```
https://grh-flesk-frontend.vercel.app  ✅ Correct
https://grh-flesk-frontend.vercel.app/ ❌ Extra slash
http://grh-flesk-frontend.vercel.app   ❌ http (should be https)
```

**Check 3: Redeployed after adding variables?**
```bash
vercel --prod
```

Environment variables require redeployment!

### Issue 2: "credentials: 'include' not working"

**Vercel Limitation:** 
Cookies don't work well across different Vercel domains (e.g., `backend.vercel.app` ← `frontend.vercel.app`)

**Solutions:**

**Option A: Use Custom Domain (Recommended)**
```
Frontend: https://app.yourcompany.com
Backend:  https://api.yourcompany.com
         ↑ Same root domain = cookies work!
```

**Option B: Use Authorization Header (Fallback)**

Already implemented in `client/src/utils/api.js`:
```javascript
const mobileToken = localStorage.getItem("mobile_auth_token");
headers: {
  ...(mobileToken && { Authorization: `Bearer ${mobileToken}` }),
}
```

Backend already supports this in `middleware/auth.js` ✅

### Issue 3: Environment Variables Not Applied

**Symptom:** Backend still uses old CORS config

**Solution:**
1. Add variables in Vercel Dashboard
2. **Redeploy:** `vercel --prod`
3. Check logs to verify new config

---

## 📊 Deployment Architecture

### Recommended Setup:

```
Frontend (Vercel)
https://grh-flesk.vercel.app
    ↓ API calls
Backend (Vercel)
https://grh-flesk-api.vercel.app
    ↓ Database
Firebase Firestore (Google Cloud)
    ↓ File storage
Cloudinary (Cloud)
```

### Environment Variables Flow:

```
Vercel Dashboard
    ↓
Environment Variables
    ↓
Injected at build/runtime
    ↓
process.env.ALLOWED_ORIGINS
    ↓
CORS middleware
```

---

## 🔐 Security Best Practices

### 1. Specific Origins (Production)

**✅ DO:**
```env
ALLOWED_ORIGINS=https://grh-flesk.vercel.app
```

**❌ DON'T:**
```env
ALLOWED_ORIGINS=*  # Allows any origin!
```

### 2. HTTPS Only (Production)

**✅ DO:**
```env
ALLOWED_ORIGINS=https://myapp.vercel.app
```

**❌ DON'T:**
```env
ALLOWED_ORIGINS=http://myapp.vercel.app  # HTTP not secure!
```

### 3. Separate Dev and Prod

**Development (.env locally):**
```env
ALLOWED_ORIGINS=http://localhost:5173
```

**Production (Vercel variables):**
```env
ALLOWED_ORIGINS=https://myapp.vercel.app
```

---

## 📝 Quick Reference

### Backend Environment Variables Checklist:

**Vercel Dashboard → Backend Project → Settings → Environment Variables**

- [ ] `JWT_SECRET` (required)
- [ ] `FIREBASE_PROJECT_ID` (required)
- [ ] `FIREBASE_PRIVATE_KEY` (required)
- [ ] `FIREBASE_CLIENT_EMAIL` (required)
- [ ] `CLOUDINARY_CLOUD_NAME` (required)
- [ ] `CLOUDINARY_API_KEY` (required)
- [ ] `CLOUDINARY_API_SECRET` (required)
- [ ] `ALLOWED_ORIGINS` (recommended)
- [ ] `NODE_ENV=production` (automatic)

### Frontend Environment Variables Checklist:

**Vercel Dashboard → Frontend Project → Settings → Environment Variables**

- [ ] `VITE_API_BASE_URL` (required)

Example: `https://grh-flesk-backend.vercel.app`

---

## 🎯 Vercel-Specific CORS Notes

### Why CORS is Tricky on Vercel:

**1. Different Domains:**
```
Frontend: grh-flesk-frontend.vercel.app
Backend:  grh-flesk-backend.vercel.app
          ↑ Different subdomains = CORS required!
```

**2. Serverless Functions:**
- Each request is a new function instance
- CORS must be handled in code (not just vercel.json)
- Our Express CORS middleware handles this ✅

**3. Cookie Limitations:**
- Browsers block third-party cookies
- Different `.vercel.app` domains = third-party
- Solution: Use Authorization header (already implemented!) ✅

### Our Solution Handles All This:

**✅ Express CORS middleware** (in code)
```javascript
app.use(cors({
  origin: getAllowedOrigins(),  // Dynamic from .env
  credentials: true,
}));
```

**✅ Fallback auth** (Authorization header)
```javascript
// Client sends token in header if cookie fails
const authHeader = req.headers.authorization;
if (authHeader && authHeader.startsWith("Bearer ")) {
  token = authHeader.substring(7);
}
```

**✅ Both methods work!**

---

## 🚀 Alternative: Custom Domain (Best for Production)

### With Custom Domain:

**Setup:**
1. Buy domain: `yourcompany.com`
2. Add to Vercel:
   - Frontend: `app.yourcompany.com`
   - Backend: `api.yourcompany.com`

**Benefits:**
- ✅ Same root domain
- ✅ Cookies work perfectly
- ✅ No CORS issues
- ✅ Professional URLs
- ✅ Better SEO

**CORS config:**
```env
# server/.env
ALLOWED_ORIGINS=https://app.yourcompany.com
```

**Much simpler!** ✅

---

## 📋 Deployment Checklist

### Before Deployment:

- [ ] All environment variables documented
- [ ] Firebase credentials ready
- [ ] Cloudinary credentials ready
- [ ] JWT_SECRET generated (random string)
- [ ] Tested locally

### Backend Deployment:

- [ ] `server/vercel.json` created ✅
- [ ] Deployed to Vercel
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Test endpoint: `https://your-backend.vercel.app/`
- [ ] Should show: "FLESK Backend is running"

### Frontend Deployment:

- [ ] `client/vercel.json` created ✅
- [ ] `VITE_API_BASE_URL` set to backend URL
- [ ] Deployed to Vercel
- [ ] Deployment successful
- [ ] Test: Open frontend URL
- [ ] Try to login
- [ ] Check Network tab - no CORS errors

### Final CORS Configuration:

- [ ] Backend has `ALLOWED_ORIGINS` set to frontend URL
- [ ] Backend redeployed after adding variable
- [ ] Test API calls from frontend
- [ ] Check browser console - no CORS errors
- [ ] Check Vercel function logs - shows correct CORS config

---

## 💡 Pro Tips

### Tip 1: Preview Deployments

**Each git push creates preview:**
```
Main branch → https://grh-flesk.vercel.app (production)
Feature branch → https://grh-flesk-git-feature.vercel.app (preview)
```

**For preview CORS:**
```env
ALLOWED_ORIGINS=https://grh-flesk.vercel.app,https://grh-flesk-git-*.vercel.app
```

Or use regex in code (already supported!).

### Tip 2: Check Deployment Logs

**Vercel Dashboard → Deployments → Click deployment → View Function Logs**

Look for:
```
🌐 CORS Configuration:
   Allowed Origins: [...]
```

### Tip 3: Environment Variables Per Environment

**Vercel supports:**
- Production
- Preview
- Development

Set different URLs for each!

### Tip 4: Automatic Deployments

**Connect to GitHub:**
1. Vercel Dashboard → Project → Settings → Git
2. Connect repository
3. Every push auto-deploys!

---

## ✅ What's Configured

### Backend:
- ✅ `vercel.json` created
- ✅ CORS configured in code (dynamic)
- ✅ Supports `ALLOWED_ORIGINS` env var
- ✅ Smart defaults (localhost + local IPs)
- ✅ Logs configuration on startup
- ✅ Works with Vercel serverless functions

### Frontend:
- ✅ `vercel.json` created
- ✅ Vite build configuration
- ✅ SPA routing support
- ✅ Uses `VITE_API_BASE_URL` env var
- ✅ Logs API URL in console

### CORS:
- ✅ Dynamic configuration
- ✅ Multiple origins support
- ✅ Regex patterns for local IPs
- ✅ Cookie + Authorization header support
- ✅ Vercel-compatible

---

## 🎯 Summary

**Issue:** Need Vercel configuration for CORS  
**Solution:** 
1. Created `vercel.json` for backend and frontend
2. Dynamic CORS from environment variables
3. Smart defaults for development
4. Vercel-specific optimizations

**Status:** ✅ **READY FOR DEPLOYMENT!**

**Files Created:**
- ✅ `server/vercel.json`
- ✅ `client/vercel.json`
- ✅ `server/env-example.txt`
- ✅ This deployment guide

**To Deploy:**
1. Set environment variables in Vercel Dashboard
2. Deploy backend: `vercel --prod`
3. Deploy frontend: `vercel --prod`
4. Test CORS
5. Done! ✅

---

**CORS will work on Vercel with proper environment variable configuration!** 🚀

**Key:** Set `ALLOWED_ORIGINS` in backend Vercel environment variables to your frontend URL!

---

**Created By:** AI Assistant  
**Date:** November 13, 2025  
**Ready:** Deployment files and configuration complete! ✅

