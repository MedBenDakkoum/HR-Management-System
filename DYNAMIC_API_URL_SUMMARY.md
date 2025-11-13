# Dynamic Backend API URL - Complete Setup ✅

## ✅ Already Implemented!

The backend API URL is **already dynamic**! The code is configured to use environment variables.

```javascript
// client/src/utils/api.js
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:10000";
```

**Current Status:**
- ✅ Code uses `VITE_API_BASE_URL` from environment
- ✅ Defaults to `http://localhost:10000` if not set
- ✅ Logs configuration in browser console (development)
- ✅ Works out of the box with local backend

---

## 🚀 Quick Start

### Option 1: Use Default (No Setup Needed)

**Already working!** If your backend runs on `http://localhost:10000`, you don't need to do anything.

**When you restart frontend, browser console shows:**
```
🔗 API Base URL: http://localhost:10000
🌍 Mode: development
```

### Option 2: Use Custom URL

**1. Create `.env` file in `client/` directory**

Choose ONE method:

**Method A: Use the Script (Easiest)**
```bash
cd client
node create-env.js
```

**Method B: Use PowerShell**
```powershell
cd client
"VITE_API_BASE_URL=http://localhost:10000" | Out-File -FilePath .env -Encoding utf8
```

**Method C: Manual**
- Create file named `.env` in `client/` folder
- Add line: `VITE_API_BASE_URL=http://localhost:10000`

**2. Restart frontend:**
```bash
npm run dev
```

**3. Verify in browser console:**
```
🔗 API Base URL: http://localhost:10000
```

---

## 🌐 Configuration Examples

### Example 1: Local Development (Default)

**No .env needed!** Or create `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:10000
```

### Example 2: Production Server

**Create `client/.env`:**
```env
VITE_API_BASE_URL=https://api.yourcompany.com
```

### Example 3: Custom Port

**Create `client/.env`:**
```env
VITE_API_BASE_URL=http://localhost:8080
```

### Example 4: Mobile Testing (Local Network)

**Find your IP:**
```bash
ipconfig  # Windows
# Look for IPv4 Address: 192.168.1.100
```

**Create `client/.env`:**
```env
VITE_API_BASE_URL=http://192.168.1.100:10000
```

**Access from phone:**
- Frontend: `http://192.168.1.100:5173`
- Backend: Auto-configured to `http://192.168.1.100:10000`

---

## 📁 Files Reference

### Created/Updated:

1. ✅ **`client/src/utils/api.js`**
   - Uses `VITE_API_BASE_URL` environment variable
   - Logs configuration in development
   - Defaults to `http://localhost:10000`

2. ✅ **`client/env.example.txt`**
   - Template with all configuration examples
   - Copy to `.env` and customize

3. ✅ **`client/create-env.js`**
   - Helper script to create `.env` file
   - Usage: `node create-env.js [url]`

4. ✅ **`client/.gitignore`**
   - Already ignores `.env` (prevents committing secrets)

---

## 🎯 How to Change Backend URL

### For Development:

**1. Create/Edit `client/.env`:**
```env
VITE_API_BASE_URL=http://your-url:port
```

**2. Restart frontend:**
```bash
npm run dev
```

**3. Done!** ✅

### For Production Build:

**1. Create/Edit `client/.env`:**
```env
VITE_API_BASE_URL=https://your-production-api.com
```

**2. Build:**
```bash
npm run build
```

**3. Deploy `dist/` folder**

**Alternative:** Set environment variable in your hosting platform:
- Vercel: Environment Variables section
- Netlify: Site settings → Environment variables
- AWS: Lambda environment variables

---

## 🔍 Verification

### Check Current Configuration:

**1. Open browser (F12)**
**2. Check console on page load**
**3. Should see:**
```
🔗 API Base URL: http://localhost:10000
🌍 Mode: development
```

### Check API Calls:

**1. Open Network tab (F12)**
**2. Make any API request (login, etc.)**
**3. Check request URL:**
```
Request URL: http://localhost:10000/api/employees/login
              ↑ Should match your VITE_API_BASE_URL
```

---

## 💡 Important Notes

### 1. Restart Required
**Vite DOES NOT hot-reload `.env` changes!**

Always restart dev server after changing `.env`:
```bash
# Ctrl+C to stop
npm run dev
```

### 2. VITE_ Prefix Required
```env
✅ VITE_API_BASE_URL=http://localhost:10000  # Correct
❌ API_BASE_URL=http://localhost:10000       # Won't work!
```

Vite only exposes variables with `VITE_` prefix to the client!

### 3. .env is Gitignored
- ✅ `.env` is already in `.gitignore`
- ✅ Won't be committed to Git
- ✅ Each developer/environment has their own

### 4. Template Files Not Gitignored
- ✅ `env.example.txt` - Committed (template)
- ✅ `create-env.js` - Committed (helper script)
- ❌ `.env` - NOT committed (your config)

---

## 🎯 Summary

**Feature:** Dynamic backend API URL  
**Implementation:** ✅ Already in code!  
**Configuration:** Environment variable `VITE_API_BASE_URL`  
**Default:** `http://localhost:10000`  
**Setup Required:** No (optional for custom URLs)

**What's Done:**
1. ✅ Code updated to use environment variable
2. ✅ Logging added to show current URL
3. ✅ Template file created (`env.example.txt`)
4. ✅ Helper script created (`create-env.js`)
5. ✅ Documentation provided

**What You Need to Do:**
- **For default local setup:** Nothing! ✅
- **For custom URL:** Create `client/.env` with your URL
- **For production:** Set environment variable in hosting platform

---

## 🚀 Quick Reference

### Create .env (Choose One):

```bash
# Option 1: Use helper script
cd client
node create-env.js

# Option 2: PowerShell
cd client
"VITE_API_BASE_URL=http://localhost:10000" | Out-File -FilePath .env -Encoding utf8

# Option 3: CMD
cd client
echo VITE_API_BASE_URL=http://localhost:10000 > .env

# Option 4: Copy template
cd client
copy env.example.txt .env
# Then edit .env
```

### Verify Setup:

1. Restart frontend: `npm run dev`
2. Check browser console: Should see `🔗 API Base URL: ...`
3. Test API calls: Login, attendance, etc.

---

**Status:** ✅ **FULLY IMPLEMENTED AND WORKING!**

**Your current setup works with default URL. To customize, just create `client/.env` and set `VITE_API_BASE_URL` to your backend URL!** 🎉

---

**Implemented By:** AI Assistant  
**Date:** November 13, 2025  
**Impact:** Easy deployment and configuration! 🚀

