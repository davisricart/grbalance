# 🚨 CLAUDE HELP - React Development Server Issues

## CURRENT STATUS:
- **Project**: React/TypeScript with Vite (GR Balance)
- **OS**: Windows 10, Node v22.15.0
- **Migration**: Recently completed Firebase → Supabase migration
- **Problem**: Multiple localhost connection issues despite servers running

## CURRENT ERROR:
```
Failed to load resource: the server responded with a status of 404 (chrome-error://chromewebdata/...)
localhost:5173 - 404 errors
```

## SERVERS CURRENTLY RUNNING:
Based on netstat and terminal output:

1. **Port 3000**: ✅ RUNNING (original server)
   ```
   ➜ Local: http://localhost:3000/
   ➜ Network: http://172.26.16.1:3000/
   ```

2. **Port 4000**: ✅ RUNNING (clean server)
   ```
   ➜ Local: http://localhost:4000/
   ➜ Network: http://172.26.16.1:4000/
   ```

3. **Port 5173**: ❌ PROBLEMATIC (404 errors)
   - Server process exists but returning 404s
   - Created from malformed command: `npm run dev -- --port 3001`

## BLOCKING ISSUES ENCOUNTERED:
1. **Ad Blocker**: Blocking `lucide-react.js` with `net::ERR_BLOCKED_BY_CLIENT`
2. **Port Confusion**: Multiple servers running on different ports
3. **Vite Command**: `vite` not in PATH, must use `npx vite`

## WHAT'S BEEN TRIED:
- ✅ Multiple ports (3000, 4000, 5173)
- ✅ Network IPs instead of localhost
- ❌ Ad blocker still blocking resources
- ❌ Port 5173 returning 404s

## WHAT NEEDS TO HAPPEN:
1. **Kill all servers and start fresh on ONE port**
2. **Fix ad blocker blocking `lucide-react.js`**
3. **Test admin functionality at `/admin`**

## PACKAGE.JSON DEV SCRIPT:
```json
"scripts": {
  "dev": "vite",
  "dev:clean": "npm run kill-ports && npm run dev"
}
```

## VITE CONFIG:
```javascript
server: {
  host: '0.0.0.0',
  port: 3000,
  strictPort: false
}
```

## TERMINAL COMMANDS THAT WORK:
```bash
npm run dev           # Starts on port 3000
npx vite --port 4000  # Starts on port 4000
npm run kill-ports    # Kills specific ports
```

## FIREBASE CLEANUP STATUS:
✅ **COMPLETE** - All Firebase references removed:
- AdminPage.tsx cleaned
- Firebase scripts deleted
- functions-backup directory removed
- No Firebase imports in source code

## RECOMMENDED SOLUTION:
1. Kill all servers: `npm run kill-ports`
2. Start ONE clean server: `npm run dev`
3. Access at: `http://localhost:3000/`
4. If blocked, try: `http://172.26.16.1:3000/`
5. Fix ad blocker by whitelisting localhost

## AD BLOCKER FIX:
Add to whitelist:
- `localhost`
- `127.0.0.1`
- `172.26.16.1`
- `*.lucide-react.*`

## NEXT TESTING PRIORITY:
Once server accessible, test admin login at `/admin` with `davisricart@gmail.com`

---
**COPY THIS ENTIRE BOX FOR CLAUDE ASSISTANCE**

# Claude Help Request: Fix Persistent 406 Auth Errors

## Current Issue
Despite implementing error handling improvements in `useAuthState.ts`, we're still seeing persistent **406 (Not Acceptable)** errors in the browser console from Supabase auth requests. The application works perfectly, but these console errors need to be eliminated.

## Errors Observed
- Multiple GET requests to `auth-DoljvRgB.js` returning 406 status
- All pointing to `https://qkrptazfydtaoyhhczyr.supabase.co/rest/`
- Errors appear on pages where users are not authenticated (like pending approval page)

## What We've Tried
1. ✅ Improved error handling in `useAuthState` hook
2. ✅ Added request caching to prevent duplicates  
3. ✅ Added proper cleanup and mounted checks
4. ✅ Changed console.error to console.warn

## Current Architecture
- **Supabase Config**: `src/config/supabase.ts` - basic client setup
- **Auth Hook**: `src/hooks/useAuthState.ts` - handles auth state across app
- **Multiple Components**: AdminPage, Header, App.tsx all use `useAuthState`

## Suspected Root Causes
1. **Race Conditions**: Multiple components calling auth simultaneously
2. **Initialization Timing**: Auth requests happening before proper setup
3. **CORS/Headers**: Supabase client configuration issues
4. **Request Format**: Something in how requests are structured

## Requested Structural Changes
Please help with ONE of these approaches:

### Option A: Centralized Auth Provider
Create a React Context provider to manage auth state globally instead of multiple hook instances.

### Option B: Lazy Auth Loading  
Only initialize auth when actually needed, not on every component mount.

### Option C: Supabase Client Optimization
Review and optimize the Supabase client configuration to prevent 406 responses.

### Option D: Request Interceptor
Add a request interceptor to handle 406s gracefully or prevent them entirely.

## Files to Focus On
- `src/config/supabase.ts` - Client configuration
- `src/hooks/useAuthState.ts` - Auth state management  
- `src/App.tsx` - Main app auth flow
- Any new auth provider/context files

## Success Criteria
- ✅ Zero 406 errors in browser console
- ✅ All functionality continues to work perfectly
- ✅ Clean, maintainable auth structure
- ✅ No performance degradation

## Additional Context
- App is deployed on Netlify
- Using Supabase for auth and database
- Users see pending approval page after registration
- Admin dashboard works perfectly despite errors
- This is purely a "clean console" improvement

Please provide a comprehensive structural solution to eliminate these 406 auth errors permanently while maintaining all current functionality. 