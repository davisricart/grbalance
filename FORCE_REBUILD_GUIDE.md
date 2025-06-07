# Force Rebuild & Cache Clear Guide

## Step 1: Test the Standalone Debug Page

**Navigate to**: `http://localhost:5173/debug-test`

**Expected Result**: You should see a page with colored boxes (red, blue, green, purple) and data tables.

**If you DON'T see this page**: There's definitely a build/cache/sync issue.

## Step 2: Force Clear All Caches

### Browser Cache (Do ALL of these):
1. **Hard Refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear Browser Data**:
   - Open DevTools (F12)
   - Right-click refresh button → "Empty Cache and Hard Reload"
   - Or: Chrome Settings → Privacy → Clear browsing data → Cached images and files
3. **Disable Cache**: 
   - DevTools → Network tab → Check "Disable cache"
   - Keep DevTools open while testing

### Node.js/Vite Cache:
```bash
# Stop the dev server first (Ctrl+C)

# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock
rm -rf node_modules
rm package-lock.json

# Clear Vite cache
rm -rf node_modules/.vite
rm -rf dist

# Reinstall dependencies
npm install

# Restart dev server
npm run dev
```

### Additional Cache Locations:
```bash
# Clear any temp files
rm -rf .cache
rm -rf temp
rm -rf tmp

# Clear OS temp (Windows)
# Delete contents of: %TEMP%\vite*

# Clear OS temp (Mac/Linux)
rm -rf /tmp/vite*
```

## Step 3: Verify Code Changes

Run these commands to confirm the debug code exists:

```bash
# Check for AdminPage failsafe test
grep -n "FAILSAFE ADMIN TEST" src/pages/AdminPage.tsx

# Check for StepBuilderDemo debug
grep -n "STEPBUILDERDEMO IS RENDERING" src/components/StepBuilderDemo.tsx

# Check for ClientPreview debug
grep -n "CLIENT PREVIEW COMPONENT IS RENDERING" src/components/StepBuilderDemo.tsx

# Check debug test page exists
ls -la src/pages/DebugTestPage.tsx
```

**Expected**: All commands should return results. If any fail, the code isn't synced.

## Step 4: Force Restart Everything

```bash
# Kill all Node processes
pkill -f node
# Or on Windows: taskkill /im node.exe /f

# Restart from scratch
cd /path/to/grbalance
npm run dev
```

## Step 5: Test Sequence

1. **Test Debug Page**: `http://localhost:5173/debug-test`
   - Should see colored boxes immediately
   - Should see console log: `🚨🚨🚨 DEBUG TEST PAGE IS RENDERING`

2. **Test AdminPage**: `http://localhost:5173/admin`
   - Should see red box in top-right corner immediately
   - Should show current activeTab value

3. **Test Testing Tab**: Click "Script Testing" tab
   - Should see green box: "TESTING TAB IS ACTIVE!"
   - Should see orange box: "STEPBUILDERDEMO IS RENDERING!"

## Step 6: Alternative Hot Module Reload Fix

If caches are cleared but changes still don't appear:

```bash
# Add this to vite.config.ts temporarily
export default defineConfig({
  // ... existing config
  server: {
    hmr: {
      overlay: true
    },
    force: true  // Force rebuild everything
  }
})
```

## Step 7: Nuclear Option - Fresh Clone

If nothing works:
```bash
# Backup any uncommitted changes first
git add .
git commit -m "backup before fresh clone"

# Clone fresh copy in new directory
cd ..
git clone <repository-url> grbalance-fresh
cd grbalance-fresh
npm install
npm run dev
```

## Verification Checklist

- [ ] Can access debug page: `http://localhost:5173/debug-test`
- [ ] See colored boxes on debug page
- [ ] See console logs: `🚨🚨🚨 DEBUG TEST PAGE IS RENDERING`
- [ ] See red box on AdminPage
- [ ] See green box on Testing tab
- [ ] See orange box in StepBuilderDemo

## Contact Points

If none of this works, the issue might be:
1. **Git branch**: Wrong branch checked out
2. **File permissions**: Files not readable/writable
3. **Port conflicts**: Another service on port 5173
4. **Firewall/Antivirus**: Blocking file changes
5. **IDE sync**: Editor not saving files

**Next Step**: Try the debug page first: `http://localhost:5173/debug-test`