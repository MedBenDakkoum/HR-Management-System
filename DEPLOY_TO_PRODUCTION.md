# Deploy to Production - Complete Checklist 🚀

## ✅ All Fixes Ready for Production

Your code is working locally! Now let's deploy it to production.

---

## 🎯 Quick Deploy Steps

### Step 1: Commit All Changes to Git

```bash
# Navigate to project root
cd C:\Users\21627\OneDrive\Bureau\grh-flesk

# Check what's changed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix: All production issues - Cloudinary-only docs, CORS, logger, timestamps"

# Push to repository
git push
```

**Why:** Vercel deploys from Git repository

### Step 2: Deploy Backend to Vercel

```bash
# Navigate to server
cd server

# Deploy to production
vercel --prod

# If this is first time, you'll be prompted:
# - Project name: grh-flesk-backend
# - Setup: Yes
# - Link to existing: No (or Yes if already created)
```

**Save the deployment URL!** 
Example: `https://grh-flesk-backend.vercel.app`

### Step 3: Set Backend Environment Variables

**Go to:** https://vercel.com → Your Backend Project → Settings → Environment Variables

**Add ALL these variables for Production environment:**

```
JWT_SECRET=your-random-secret-key-here
FIREBASE_PROJECT_ID=flesk-a375d
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@flesk-a375d.iam.gserviceaccount.com
CLOUDINARY_CLOUD_NAME=ds4iqazaj
CLOUDINARY_API_KEY=775923516381513
CLOUDINARY_API_SECRET=your-cloudinary-secret
NODE_ENV=production
```

**Important Notes:**
- `FIREBASE_PRIVATE_KEY` must include `\n` for line breaks
- Copy exactly from your local `.env`
- Set for **Production** environment

**After adding variables, redeploy:**
```bash
vercel --prod
```

### Step 4: Deploy Frontend to Vercel

```bash
# Navigate to client
cd client

# Deploy to production
vercel --prod
```

**Save the deployment URL!**
Example: `https://grh-flesk.vercel.app`

### Step 5: Configure Frontend Environment Variable

**Go to:** https://vercel.com → Your Frontend Project → Settings → Environment Variables

**Add:**
```
VITE_API_BASE_URL=https://grh-flesk-backend.vercel.app
```

**Set for:** Production, Preview, Development (all 3)

**Redeploy frontend:**
```bash
cd client
vercel --prod
```

### Step 6: Configure CORS on Backend

**Go to:** Backend Project → Settings → Environment Variables

**Add:**
```
ALLOWED_ORIGINS=https://grh-flesk.vercel.app
```

Replace with your actual frontend URL from Step 4.

**For multiple domains:**
```
ALLOWED_ORIGINS=https://grh-flesk.vercel.app,https://www.grh-flesk.com
```

**Redeploy backend one more time:**
```bash
cd server
vercel --prod
```

### Step 7: Test Production

**Open your frontend URL:** `https://grh-flesk.vercel.app`

**Test:**
1. ✅ Login
2. ✅ Dashboard loads
3. ✅ Attendance recording
4. ✅ Document generation
5. ✅ Document download
6. ✅ Leave requests
7. ✅ Notifications

---

## 🐛 Common Production Issues & Fixes

### Issue 1: "ENOENT: mkdir logs" or "mkdir documents"

**Cause:** Old code deployed

**Fix:**
```bash
# 1. Ensure latest code is pushed to Git
git add .
git commit -m "Latest fixes"
git push

# 2. Redeploy
cd server
vercel --prod
```

**Verify deployment uses latest commit:**
- Vercel Dashboard → Deployments
- Check commit hash matches your latest

### Issue 2: CORS Errors in Production

**Check:**
1. Is `ALLOWED_ORIGINS` set on backend?
2. Does it match your frontend URL exactly?

**Common mistakes:**
```
✅ https://grh-flesk.vercel.app
❌ https://grh-flesk.vercel.app/  (extra slash)
❌ http://grh-flesk.vercel.app   (http instead of https)
```

**Fix:**
```bash
# Update ALLOWED_ORIGINS in Vercel Dashboard
# Then redeploy
vercel --prod
```

### Issue 3: Environment Variables Not Working

**Symptoms:**
- Cloudinary errors
- Firebase errors
- JWT errors

**Fix:**
1. **Check variables exist:**
   - Vercel Dashboard → Backend → Settings → Environment Variables
   - All variables should be listed

2. **Check environment is set:**
   - Variables should be set for "Production"
   - Not just "Preview" or "Development"

3. **Redeploy after adding variables:**
   ```bash
   vercel --prod
   ```

**Vercel doesn't auto-redeploy when variables change!**

### Issue 4: Firebase Errors

**Error:** "Firebase not initialized" or "Invalid credentials"

**Fix:**
1. **Check FIREBASE_PRIVATE_KEY format:**
   ```
   Should be: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
   Note the `\n` for line breaks!

2. **Copy from Firebase Console:**
   - Firebase Console → Project Settings
   - Service Accounts tab
   - Generate new private key
   - Copy the entire JSON file content
   - Extract the values

### Issue 5: Cloudinary Upload Fails

**Error:** Documents not uploading

**Fix:**
1. **Check credentials:**
   ```
   CLOUDINARY_CLOUD_NAME=ds4iqazaj
   CLOUDINARY_API_KEY=775923516381513
   CLOUDINARY_API_SECRET=your-secret
   ```

2. **Test in Vercel logs:**
   - Vercel Dashboard → Functions → View Logs
   - Look for "Cloudinary configured successfully"

### Issue 6: Old Code Still Running

**How to verify you're running latest code:**

**Check Vercel deployment:**
1. Vercel Dashboard → Deployments
2. Look at latest production deployment
3. Check "Source" - should be latest Git commit
4. Check "Status" - should be "Ready"

**If old code:**
```bash
# Force redeploy
vercel --prod --force
```

---

## 📋 Environment Variables Checklist

### Backend Production Variables:

**Required (Vercel Dashboard → Backend → Environment Variables):**
- [ ] `JWT_SECRET` (any random string, 32+ characters)
- [ ] `FIREBASE_PROJECT_ID` (from Firebase Console)
- [ ] `FIREBASE_PRIVATE_KEY` (from Firebase service account JSON)
- [ ] `FIREBASE_CLIENT_EMAIL` (from Firebase service account JSON)
- [ ] `CLOUDINARY_CLOUD_NAME` (from Cloudinary dashboard)
- [ ] `CLOUDINARY_API_KEY` (from Cloudinary dashboard)
- [ ] `CLOUDINARY_API_SECRET` (from Cloudinary dashboard)
- [ ] `NODE_ENV=production` (set automatically by Vercel)

**Optional but Recommended:**
- [ ] `ALLOWED_ORIGINS` (your frontend URL)
- [ ] `LOG_LEVEL=info`

### Frontend Production Variables:

**Required (Vercel Dashboard → Frontend → Environment Variables):**
- [ ] `VITE_API_BASE_URL` (your backend URL from Step 2)

**Set for:** Production, Preview, Development (all 3 checkboxes)

---

## 🔍 Verify Deployment

### Check Backend is Running:

**Visit:** `https://your-backend.vercel.app/`

**Should see:**
```
FLESK Backend is running
```

### Check Backend Logs:

**Vercel Dashboard → Backend → Functions → View Logs**

**Should see:**
```
Cloudinary configured successfully in index.js
Firebase initialized successfully
🌐 CORS Configuration:
   Allowed Origins: [...]
Server running on port 10000
```

**Should NOT see:**
```
❌ ENOENT: no such file or directory, mkdir 'logs'
❌ ENOENT: no such file or directory, mkdir 'documents'
```

### Check Frontend API URL:

**Open frontend:** `https://your-frontend.vercel.app`

**Open browser console (F12):**

**Should see:**
```
🔗 API Base URL: https://your-backend.vercel.app
🌍 Mode: production
```

---

## 🚀 Complete Deployment Commands

**Copy and run these in order:**

```bash
# 1. Commit all changes
git add .
git commit -m "Production fixes: Cloudinary-only docs, shared logger, CORS"
git push

# 2. Deploy backend
cd server
vercel --prod

# 3. Note the backend URL shown
# Example: https://grh-flesk-backend-xyz.vercel.app

# 4. Deploy frontend  
cd ../client
vercel --prod

# 5. Note the frontend URL shown
# Example: https://grh-flesk-xyz.vercel.app
```

**Then in Vercel Dashboard:**

1. **Backend → Settings → Environment Variables:**
   - Add all backend variables listed above
   - Add `ALLOWED_ORIGINS` = your frontend URL

2. **Frontend → Settings → Environment Variables:**
   - Add `VITE_API_BASE_URL` = your backend URL
   - Set for all 3 environments

3. **Redeploy both:**
   ```bash
   cd server
   vercel --prod
   
   cd ../client
   vercel --prod
   ```

---

## 🎯 Quick Troubleshooting

### Still Getting Errors?

**1. Check Vercel Deployment Status:**
- Dashboard → Deployments
- Latest deployment should be "Ready"
- Not "Failed" or "Building"

**2. Check Function Logs:**
- Dashboard → Functions → View Logs
- Look for errors
- Send me the error logs if issues persist

**3. Check Environment Variables:**
- All variables added?
- Set for "Production" environment?
- Redeployed after adding?

**4. Check CORS:**
- Backend console should show correct ALLOWED_ORIGINS
- Should match frontend URL exactly

**5. Force Redeploy:**
```bash
# Backend
cd server
vercel --prod --force

# Frontend
cd client
vercel --prod --force
```

---

## ✅ Summary

**Issue:** Production has same errors as before (but local works)  
**Cause:** Production running old code  
**Solution:** Redeploy with latest code + configure environment variables  

**Steps:**
1. ✅ Commit all changes to Git
2. ✅ Deploy backend (`vercel --prod`)
3. ✅ Set backend environment variables
4. ✅ Deploy frontend (`vercel --prod`)
5. ✅ Set frontend environment variable
6. ✅ Configure CORS (ALLOWED_ORIGINS)
7. ✅ Redeploy both
8. ✅ Test!

**Result:** Production will work like local! 🎉

---

**All fixes are in your code! Just commit, deploy, set environment variables, and redeploy!** 🚀

