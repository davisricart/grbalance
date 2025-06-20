# Technical Changelog - Firebase to Supabase Migration

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