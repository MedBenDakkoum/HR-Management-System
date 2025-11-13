# Environment Files Setup Guide 🔧

## Quick Setup

The frontend API URL is already dynamic! It's configured in the code but you need to create the `.env` file.

---

## 📝 Step-by-Step Setup

### Step 1: Create Client .env File

**Option A: Using Command Line (Windows)**
```bash
cd client
echo VITE_API_BASE_URL=http://localhost:10000 > .env
```

**Option B: Manual Creation**
1. Open File Explorer
2. Navigate to `client/` folder
3. Right-click → New → Text Document
4. Name it **exactly** `.env` (not `.env.txt`)
5. Open in notepad and add:
   ```env
   VITE_API_BASE_URL=http://localhost:10000
   ```

**Option C: Copy Template**
```bash
cd client
copy env.example.txt .env
```
Then edit `.env` with your URL.

### Step 2: Verify the File

**Check file name:**
- ✅ Must be exactly `.env` (starts with dot)
- ✅ No extension (not `.env.txt`)
- ✅ Located in `client/` directory

**Windows might hide the extension!**
1. Open File Explorer
2. View tab → Check "File name extensions"
3. Ensure it's `.env` not `.env.txt`

### Step 3: Restart Frontend Server

```bash
# Stop frontend (Ctrl+C)
cd client
npm run dev
```

### Step 4: Verify in Browser

**Open browser console** (F12), you should see:
```
🔗 API Base URL: http://localhost:10000
🌍 Mode: development
```

---

## 🎯 Configuration Options

### Development (Default)

**No .env file needed!** Uses default: `http://localhost:10000`

Or create `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:10000
```

### Production

**Create `client/.env`:**
```env
VITE_API_BASE_URL=https://your-production-api.com
```

**Then build:**
```bash
cd client
npm run build
```

### Local Network (Mobile Testing)

**Find your computer's IP:**
```bash
# Windows
ipconfig

# Look for "IPv4 Address" (e.g., 192.168.1.100)
```

**Create `client/.env`:**
```env
VITE_API_BASE_URL=http://192.168.1.100:10000
```

**Access from mobile:**
- Frontend: `http://192.168.1.100:5173`
- Calls backend: `http://192.168.1.100:10000`

---

## 🚀 Quick Commands

### Create .env with Default Config

**Windows PowerShell:**
```powershell
cd client
"VITE_API_BASE_URL=http://localhost:10000" | Out-File -FilePath .env -Encoding utf8
```

**Windows CMD:**
```cmd
cd client
echo VITE_API_BASE_URL=http://localhost:10000 > .env
```

**Git Bash / Linux / Mac:**
```bash
cd client
echo "VITE_API_BASE_URL=http://localhost:10000" > .env
```

### Verify .env Exists

**Windows:**
```cmd
cd client
dir .env
```

**Linux/Mac:**
```bash
cd client
ls -la .env
```

### Read .env Content

**Windows:**
```cmd
cd client
type .env
```

**Linux/Mac:**
```bash
cd client
cat .env
```

---

## ✅ Verification Checklist

After creating `.env`:

- [ ] File is named exactly `.env` (not `.env.txt`)
- [ ] File is in `client/` directory
- [ ] File contains `VITE_API_BASE_URL=...`
- [ ] Frontend dev server restarted
- [ ] Browser console shows correct URL
- [ ] API calls work (check Network tab)

---

## 🐛 Common Issues

### Issue 1: "Still using localhost:10000"

**Even though you changed .env?**

**Solution:**
1. **Restart dev server** (Vite doesn't hot-reload .env!)
2. **Hard refresh browser** (Ctrl+Shift+R)
3. **Check browser console** for logged URL

### Issue 2: ".env not found"

**Check file location:**
```
✅ Correct: client/.env
❌ Wrong:   server/.env
❌ Wrong:   .env (in root)
```

### Issue 3: "Variable not working"

**Check prefix:**
```
✅ Correct: VITE_API_BASE_URL
❌ Wrong:   API_BASE_URL (missing VITE_)
```

Vite requires `VITE_` prefix for security!

### Issue 4: "Network Error"

**Causes:**
- Backend server not running
- Wrong URL in `.env`
- Firewall blocking requests

**Check:**
1. Backend server running? (`npm run dev` in server/)
2. URL correct in `.env`?
3. Can access backend in browser? (http://localhost:10000)

---

## 📊 How It All Connects

```
User opens browser
    ↓
Loads frontend (http://localhost:5173)
    ↓
Frontend reads .env
    ↓
Gets VITE_API_BASE_URL
    ↓
Makes API calls to that URL
    ↓
Backend responds
```

**Example API call:**
```javascript
// Frontend code
await api("/api/employees/login", "POST", {...});

// Becomes
await fetch("http://localhost:10000/api/employees/login", {...});
//           ↑ From VITE_API_BASE_URL
```

---

## 🎨 Template Files Provided

### 1. `client/env.example.txt`
- ✅ Template with all options
- ✅ Copy to `.env` and customize
- ✅ Documented examples

### 2. `.gitignore`
- ✅ Already ignores `.env`
- ✅ Prevents committing secrets
- ✅ Standard Vite setup

---

## 🎯 Summary

**Feature:** Dynamic backend URL from environment  
**Variable:** `VITE_API_BASE_URL`  
**Default:** `http://localhost:10000`  
**Status:** ✅ **ALREADY IMPLEMENTED!**

**To Use:**
1. (Optional) Create `client/.env`
2. (Optional) Set `VITE_API_BASE_URL=your-url`
3. Restart frontend dev server
4. Done! ✅

**Already Works:** Yes, with default localhost:10000  
**Requires .env:** No, optional (uses default)  
**Template Provided:** Yes (`client/env.example.txt`)

---

**Implementation:** Already in code  
**Configuration:** Optional (uses sensible default)  
**Template:** Provided for easy setup  
**Documentation:** This guide! 📖

---

**Updated By:** AI Assistant  
**Date:** November 13, 2025  
**Impact:** Easy deployment to any backend server! 🚀

