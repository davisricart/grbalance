# Claude CLI Instructions: Remove Firebase & Complete Supabase Migration

## ❌ Problem
You've migrated to Supabase but Firebase code is still causing environment variable errors:
```
VITE_FIREBASE_STORAGE_BUCKET: ❌ Missing
VITE_FIREBASE_MESSAGING_SENDER_ID: ❌ Missing
```

## ✅ Solution
Complete Firebase removal and ensure clean Supabase-only implementation.

## 🎯 Priority Tasks (Execute in Order)

### 1. Remove Firebase Initialization (CRITICAL)
**File:** `src/main.tsx` - Remove Firebase imports and initialization

### 2. Clean Up Import/Export Files
**File:** `src/utils/index.ts` - Remove `export * from './firebaseDebug';`

### 3. Delete Firebase Debug File
**File:** `src/utils/firebaseDebug.ts` - DELETE ENTIRE FILE

### 4. Update Vite Config
**File:** `vite.config.js` - Remove Firebase CSP entries and optimizations

### 5. Remove Firebase Dependencies
**File:** `package.json` - Remove all firebase packages

### 6. Clean Authentication Files
- `src/hooks/useAuthState.ts` - Replace Firebase auth with Supabase
- `src/pages/LoginPage.tsx` - Replace Firebase auth with Supabase  
- `src/pages/RegisterPage.tsx` - Replace Firebase auth with Supabase

### 7. Update Privacy Policy
**File:** `src/pages/PrivacyPage.tsx` - Remove Firebase references

### 8. Clean Admin Files
- `src/services/adminService.ts` - Remove Firebase User type
- `netlify/functions/verify-admin.js` - Remove Firebase admin completely

### 9. Update Environment Documentation
**File:** `ENVIRONMENT_VARIABLES.md` - Remove Firebase section, add Supabase section

### 10. Clean Build Files
**Directory:** `dist/` - DELETE AND REBUILD

## 🔧 Detailed Implementation

### Step 1: Update main.tsx
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Supabase is initialized in config/supabase.ts
console.log('✅ Application starting with Supabase backend');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 2: Create/Update Supabase Config
**File:** `src/config/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Step 3: Update Environment Variables
**Add to Netlify:**
```
VITE_SUPABASE_URL=https://qkrptazfydtaoyhhczyr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Remove from Netlify:**
- All `VITE_FIREBASE_*` variables
- All `FIREBASE_*` variables

### Step 4: Update Vite Config CSP
**File:** `vite.config.js`
Remove Firebase domains from CSP:
```javascript
// Remove these Firebase entries:
// https://*.firebaseapp.com 
// https://*.googleapis.com 
// https://*.google.com 
// wss://*.firebaseio.com 
// https://*.cloudfunctions.net 
// https://identitytoolkit.googleapis.com 
// https://securetoken.googleapis.com
```

### Step 5: Remove Firebase from package.json
Remove these dependencies:
```json
"firebase": "^x.x.x",
"firebase-admin": "^x.x.x"
```

### Step 6: Authentication Migration
Replace all Firebase auth with Supabase:

**LoginPage.tsx:**
```typescript
import { supabase } from '../config/supabase'

// Replace signInWithEmailAndPassword with:
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})
```

**RegisterPage.tsx:**
```typescript
import { supabase } from '../config/supabase'

// Replace createUserWithEmailAndPassword with:
const { data, error } = await supabase.auth.signUp({
  email,
  password
})
```

## 🚀 Build & Deploy Commands
```bash
# Clean install
rm -rf node_modules package-lock.json dist
npm install

# Remove Firebase packages
npm uninstall firebase firebase-admin

# Install Supabase (if not already installed)
npm install @supabase/supabase-js

# Clean build
npm run build

# Deploy
netlify deploy --prod
```

## ✅ Verification Steps
1. **Console Check:** No Firebase environment variable errors
2. **Network Tab:** No requests to Firebase domains
3. **Supabase Dashboard:** Confirm all data operations work
4. **Authentication:** Login/register flows work with Supabase
5. **Build:** Clean build with no Firebase references

## 🎯 Success Criteria
- ❌ Zero Firebase imports anywhere in codebase
- ❌ Zero Firebase environment variables needed
- ❌ Zero Firebase network requests
- ✅ All authentication via Supabase
- ✅ All data operations via Supabase
- ✅ Clean console with no Firebase errors
- ✅ Successful production build and deploy

## 🔍 Files to Check After Completion
Search codebase for any remaining:
- `firebase` (case insensitive)
- `FIREBASE` (environment variables)
- Firebase imports
- Firebase function calls

If any found, remove them completely.

---
*This migration removes Firebase completely and ensures clean Supabase-only implementation.* 