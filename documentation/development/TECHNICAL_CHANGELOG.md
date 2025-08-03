# Technical Changelog - Firebase to Supabase Migration

## Latest Updates (January 2025)

### 2025-02-02 - Critical Admin Dashboard & Client Portal Fixes
**Issue**: Multiple workflow management issues causing client data to disappear and script deployment failures
**Root Cause Analysis**: 
- Script deployment was broken due to incorrect table mapping (admin uploaded to `clients.deployed_scripts` but portal read from `client_scripts`)
- Client activation was setting wrong status combinations causing invisibility in admin dashboard
- Destructive deletion operations in workflow transitions
- Trial information display missing after activation
- Welcome emails missing personalized client portal URLs

**Solutions Implemented**:

1. **Script Deployment Fix**:
   - Fixed `clientScriptService.ts` to read from `clients.deployed_scripts` instead of `client_scripts`
   - Updated `MainPage.tsx` to load all available scripts and populate dropdown correctly
   - Added `handleDeployScript` implementation in `AdminPage.tsx`

2. **Admin Dashboard Visibility Fix**:
   - Modified client activation to maintain `'approved'` status in usage table for admin visibility
   - Fixed status mapping: `usage.status = 'approved'` + `clients.status = 'active'`
   - Removed destructive deletion operations from workflow transitions

3. **Data Consistency Fixes**:
   - Fixed `sendBackToQA` to update status instead of deleting records
   - Fixed `deleteApprovedUser` to use soft delete instead of hard delete
   - Removed "NUCLEAR RESET" operations that deleted client records
   - Updated `deactivateApprovedUser` to update both tables consistently

4. **Trial Information Display**:
   - Fixed database query errors (removed non-existent columns: `siteUrl`, `deployedScripts`, `approvedat`)
   - Updated trial display logic to show for activated clients within 14-day period
   - Fixed trial calculation to use `approvedAt` as trial start time

5. **Welcome Email Personalization**:
   - Fixed client path passing to use calculated `clientPath` instead of potentially undefined `user.client_path`
   - Welcome emails now include personalized URLs: `grbalance.com/grsalon`

**Files Modified**:
- `src/pages/AdminPage.tsx` - Fixed fetchApprovedUsers, sendBackToQA, deleteApprovedUser, handleDeployScript
- `src/components/admin/UserManagement/ApprovedUsersTab.tsx` - Fixed activation logic, trial display, client path passing
- `src/components/admin/UserManagement/ReadyForTestingTab.tsx` - Removed destructive deletion operations
- `src/services/clientScriptService.ts` - Fixed script loading source
- `src/pages/MainPage.tsx` - Fixed script dropdown population
- `src/pages/ClientPortalPage.tsx` - Added automatic authentication for active clients

**Database Operations**:
- Multiple restore scripts executed to fix client data consistency
- Status corrections applied to maintain proper workflow visibility

**Result**: 
- ✅ Clients remain visible in admin dashboard after activation
- ✅ Scripts deployed via admin QA testing appear on client portal
- ✅ Trial information displays correctly with green status boxes
- ✅ Welcome emails include personalized client portal URLs
- ✅ No more client data disappearing during workflow transitions
- ✅ Client portal authentication works for active clients

### 2025-01-23 - BookingPage Email Integration Fix
**Issue**: BookingPage contact form was using mock email submission instead of actual EmailJS
**Solution**: 
- Added EmailJS integration to BookingPage.tsx matching ContactPage configuration
- Implemented proper email validation with domain/TLD requirements
- Added EmailJS initialization with user ID: `e-n1Rxb8CRaf_RfPm`
- Updated form to use service: `service_grbalance` and template: `template_rm62n5a`
- Changed error message to match validation requirements

**Files Modified**:
- `src/pages/BookingPage.tsx` - Added EmailJS imports, validation, and proper email sending

**Result**: Both ContactPage and BookingPage now send emails to the same destination

---

## Database Schema Changes

### Supabase `clients` Table Structure
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  client_path TEXT UNIQUE NOT NULL,
  business_name TEXT,
  email TEXT,
  subscription_tier TEXT,
  website_created BOOLEAN DEFAULT FALSE,
  website_created_at TIMESTAMP,
  status TEXT DEFAULT 'testing',
  site_url TEXT,
  deployed_scripts JSONB DEFAULT '[]',
  usage JSONB DEFAULT '{"comparisons_used": 0, "comparisons_limit": 100}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Script Storage Format in `deployed_scripts`
```json
[
  {
    "id": "script-name",
    "name": "script-name",
    "content": "// Full JavaScript code...",
    "uploaded_at": "2025-06-20T04:22:00.200Z"
  }
]
```

## API Endpoints

### Supabase REST API Calls
```javascript
// Base Configuration
const SUPABASE_URL = 'https://qkrptazfydtaoyhhczyr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Create Client Website
POST /rest/v1/clients
Headers: apikey, Authorization, Content-Type, Prefer: return=representation

// Update Client with Script
PATCH /rest/v1/clients?id=eq.{userId}
Body: { deployed_scripts: [...] }

// Get Client by Path
GET /rest/v1/clients?client_path=eq.{clientPath}

// Delete Client
DELETE /rest/v1/clients?id=eq.{userId}
```

## Code Changes by File

### `ReadyForTestingTab.tsx`
- **Function**: Main QA Testing interface
- **Changes**: 
  - Direct Supabase API calls replacing Firebase functions
  - Inline confirmation UI for "Send Back" actions
  - Script upload to Supabase with PATCH operations
  - Persistent website status checking
  - Custom URL input field restoration

### `ClientPortalPage.tsx`  
- **Function**: Individual client portal pages
- **Changes**:
  - Simplified to render `ReconciliationApp` directly
  - Removed custom dashboard UI
  - Maintains client authentication check

### `MainPage.tsx` (ReconciliationApp)
- **Function**: Core reconciliation interface
- **Changes**:
  - Added client path detection from URL (`/salontest`)
  - `loadClientScriptsFromSupabase()` function
  - Dynamic script loading from Supabase `deployed_scripts`
  - UI text updates: "Codes" and "Select a Code"

### `useAuthState.ts`
- **Function**: User authentication state management
- **Changes**:
  - Emergency admin bypass for `davisricart@gmail.com`
  - Maintains Firebase Auth for login/signup
  - Auto-approval for main app access

### `AdminPage.tsx`
- **Function**: Admin dashboard
- **Changes**:
  - Enhanced date validation in `getDaysAgo()` function
  - Improved error handling for null/undefined dates

### `App.tsx`
- **Function**: Main routing configuration  
- **Changes**:
  - Added dynamic client portal route: `/:clientname`
  - Imported `ClientPortalPage` component

## Configuration Updates

### `netlify.toml`
```toml
# Minimal functions for admin verification only
[functions]
  node_bundler = "esbuild" 
  external_node_modules = ["firebase-admin"]

# Supabase domains in CSP
Content-Security-Policy = "... https://*.supabase.co ..."
```

### `index.html`
- Cache busting: `v=6.0-inline-confirm`
- Maintained Firebase config for authentication only

## Removed Dependencies

### Netlify Functions (moved to `functions-backup/`)
- `create-client-website-direct.js`
- `delete-client-data.js`
- `approve-client-live.js`
- `upload-client-script.js`
- `cleanup-duplicate-clients.js`

### External Node Modules
- Removed Supabase SDK dependencies
- Using direct fetch() API calls instead
- Eliminated complex bundling requirements

## Performance Optimizations

### Caching Strategy
- Aggressive cache busting for critical updates
- Version-based asset loading
- Persistent website status from Supabase checks

### API Efficiency
- Batch client queries for status checks
- Single API calls instead of function chains
- Direct database operations without middleware

### Error Handling
- Comprehensive try-catch blocks
- Graceful fallbacks for missing data
- Console logging without user-facing popups

## Security Considerations

### Authentication
- Firebase Auth maintained for login/signup
- Admin verification through dedicated function
- Emergency bypass with email validation

### API Security
- Row Level Security (RLS) on Supabase tables
- API key restrictions by domain
- Input sanitization for client paths

### Data Validation
- Client path regex filtering (`[^a-z0-9]`)
- Script content validation before storage
- Proper JSON structure for deployed_scripts

## Testing Procedures

### Deployment Testing
1. Hard browser refresh to clear cache
2. Console log verification for each operation
3. Supabase dashboard data verification
4. End-to-end workflow testing

### Error Testing
- Invalid client paths
- Missing Supabase records
- Network error scenarios
- Malformed script uploads

## Monitoring & Maintenance

### Key Metrics to Monitor
- Supabase API response times
- Client portal load speeds
- Script upload success rates
- Admin action completion rates

### Regular Maintenance Tasks
- Supabase database cleanup
- Script validation checks
- Console log review
- Cache version updates

## Deployment Process

### Git Workflow
```bash
git add .
git commit -m "Description 🤖 Generated with [Claude Code](https://claude.ai/code)"
git push  # Triggers automatic Netlify deployment
```

### Cache Invalidation
- Update `index.html` version parameter
- Force browser refresh with Ctrl+Shift+R
- Monitor console for cache bust confirmations

---

*Technical documentation maintained for development team reference*