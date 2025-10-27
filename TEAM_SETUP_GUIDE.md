# Team Setup Guide - eChanneling Corporate Agent Frontend

## ⚠️ Important: Cross-Platform Issues Resolved

This guide addresses the recent issues team members have been facing:
- **Windows SWC Binary Error** (affecting Ojitha's machine)
- **Missing DATABASE_URL** configuration
- **Fast Refresh warnings** (browser cache issues)
- **WebSocket connection errors** (expected - backend not running)

---

## 🚀 Quick Setup (All Platforms)

### For ALL Team Members - Run This First:

```bash
# 1. Pull latest changes
git pull

# 2. Run the cross-platform setup script
npm run setup:cross-platform

# 3. Start the development server
npm run dev
```

The setup script will automatically:
- ✅ Fix SWC binary issues (Windows)
- ✅ Configure DATABASE_URL
- ✅ Install all dependencies correctly
- ✅ Set up SQLite database
- ✅ Clear all caches

---

## 🪟 Windows-Specific Instructions

### If you see "Failed to load SWC binary" error:

1. **Run PowerShell as Administrator**
2. **Execute the setup:**
   ```powershell
   npm run setup:windows
   ```

3. **If the error persists:**
   - Install Visual Studio Build Tools 2022:
     ```powershell
     winget install Microsoft.VisualStudio.2022.BuildTools
     ```
   - During installation, select:
     - "Desktop development with C++"
     - ".NET build tools"
   
4. **Alternative Solution - Use WSL2:**
   ```powershell
   wsl --install
   # Then run the project inside WSL
   ```

---

## 🍎 macOS-Specific Instructions

### Ensure Xcode Command Line Tools are installed:

```bash
xcode-select --install
```

### Run the setup:

```bash
npm run setup:cross-platform
```

---

## 🐧 Linux Instructions

### Install build essentials first:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install build-essential

# Fedora/RHEL
sudo dnf install gcc-c++ make

# Then run setup
npm run setup:cross-platform
```

---

## 🔧 Manual Database Setup (If Automatic Setup Fails)

1. **Create/Update .env.local file:**
   ```env
   DATABASE_URL="file:./dev.db"
   NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
   ```

2. **Run Prisma commands:**
   ```bash
   # Generate Prisma Client
   DATABASE_URL="file:./dev.db" npx prisma generate
   
   # Push schema to database
   DATABASE_URL="file:./dev.db" npx prisma db push
   ```

---

## ⚠️ Known Issues & Solutions

### 1. Fast Refresh Warnings
**Symptoms:** Repeated "Fast Refresh had to perform a full reload" messages

**Solution:**
- Clear browser cache: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
- Or use incognito/private window
- The app works fine despite these warnings

### 2. WebSocket Connection Errors
**Symptoms:** "WebSocket connection to 'ws://localhost:3001/socket.io/' failed"

**Status:** ✅ **EXPECTED** - Backend socket server not running
- Does NOT affect CRUD operations
- Frontend works perfectly without it

### 3. Redux-Persist Warning
**Symptoms:** "redux-persist failed to create sync storage"

**Status:** ✅ **NON-CRITICAL** - Only affects server-side rendering
- Client-side persistence works fine

### 4. Database Errors
**Symptoms:** "Environment variable not found: DATABASE_URL"

**Solution:** Run `npm run setup:cross-platform`

---

## 📋 Verification Checklist

After setup, verify:

- [ ] Server starts on http://localhost:3000
- [ ] Dashboard loads without errors
- [ ] Can navigate between pages
- [ ] Forms work (try login/register)
- [ ] Data persists after refresh

---

## 🆘 Troubleshooting Steps

If you encounter issues:

1. **Clean everything:**
   ```bash
   rm -rf node_modules .next package-lock.json
   npm cache clean --force
   ```

2. **Re-run setup:**
   ```bash
   npm run setup:fresh
   ```

3. **Check Node.js version:**
   ```bash
   node --version  # Should be v18 or higher
   ```

4. **Verify environment:**
   ```bash
   # Check if DATABASE_URL exists
   cat .env.local | grep DATABASE_URL
   ```

---

## 👥 Team Contacts for Issues

- **Frontend Lead:** Janinu Weerakkody
- **Windows Issues:** Contact Ojitha Rajapaksha for tested solutions
- **Database Issues:** Run `npm run db:setup`

---

## 📝 Notes for Deployment

- Production uses PostgreSQL (not SQLite)
- Environment variables differ for production
- See `DEPLOYMENT_GUIDE.md` for production setup

---

## ✅ Success Indicators

You know setup is successful when:
1. `npm run dev` starts without errors
2. Browser opens http://localhost:3000
3. Dashboard loads with sample data
4. No critical errors in console (WebSocket errors are OK)

---

Last Updated: October 2024
Tested On: Windows 11, macOS Sonoma, Ubuntu 22.04
