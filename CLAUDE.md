# CRITICAL INSTRUCTIONS FOR GRBALANCE PROJECT

## AdminPage Maintenance Rules
- **NEVER modify AdminPage structure** - The UI/tabs/layout are finalized
- **PRESERVE test script functionality** - This is the most critical feature
- **NO Firebase references** - Project is 100% Supabase now
- **Structure restored to commit f82c24e** - This is the solid baseline

## Development Environment
- Windows PowerShell environment
- Use Netlify for builds (npm install/build issues locally)
- Use semicolons (;) not && for PowerShell commands
- Git push to deploy changes via Netlify

## Auth System
- Uses AuthProvider with Supabase auth
- Sign out fixed to properly clear state
- All Firebase auth removed completely

## Test Script Priority
- AdminPage test script functionality is TOP PRIORITY
- Any changes must preserve test script tabs and features
- Test all reconciliation/parsing functionality after changes

## Email System (Resend Integration) - COMPLETED ✅
- **Contact Form**: Netlify function at `/.netlify/functions/send-email`
- **Welcome Emails**: Service in `src/services/welcomeEmailService.ts`
- **Environment**: VITE_RESEND_API_KEY configured in Netlify
- **Deployment**: https://grbalance.netlify.app
- **Status**: Fully functional and tested
- **CRITICAL**: Styling configurations restored after initial implementation broke them

## Admin User Management - COMPLETED ✅
- **Pending User Deletion**: Fixed to properly delete from both pendingUsers table AND Supabase Auth
- **Implementation**: Uses secure Netlify function `/.netlify/functions/delete-user` with service role key
- **File**: `/src/pages/AdminPage.tsx` - `rejectPendingUser` function (line ~1320)
- **Status**: Verified working - no more orphaned auth records
- **Security**: Frontend calls backend function, service role key stays server-side

## Admin Workflow Improvements - COMPLETED ✅
- **Website Name Preservation**: QA testing website names now carry over to approved users
- **File**: `/src/pages/AdminPage.tsx` - `onFinalApprove` function fetches client_path from clients table
- **ApprovedUsersTab**: Updated to display actual website names instead of generated ones
- **Status**: Website URLs now consistent between QA testing and approved phases

## Admin Tab Enhancements - COMPLETED ✅
- **Send Back to QA**: Added button in approved users tab to move users back to QA testing
- **Inline Confirmations**: Replaced popup alerts with elegant inline warning messages
- **Delete/Deactivate**: Updated with proper inline confirmations matching other tabs
- **Files**: `ApprovedUsersTab.tsx`, `AdminPage.tsx`
- **Status**: All administrative actions now have consistent UX

## QA Testing State Persistence - COMPLETED ✅
- **Problem**: Script upload status and website creation status lost on navigation
- **Solution**: Moved state management from component-level to AdminPage parent component
- **Files**: `ReadyForTestingTab.tsx`, `AdminPage.tsx`
- **Status**: Script uploads and website status now persist when navigating away and back
- **Note**: State persists across tab navigation within admin dashboard

## Move to Approved Fix - COMPLETED ✅
- **Problem**: Button not working due to client_path column error in usage table
- **Solution**: Removed client_path from usage table insert, added lookup from clients table
- **Files**: `AdminPage.tsx` - `onFinalApprove` and `fetchApprovedUsers` functions
- **Status**: Move to Approved button now works properly, website names preserved

## Trial User Authentication & Routing - COMPLETED ✅
- **Problem**: Trial users redirected to pending approval page despite proper authentication
- **Root Cause**: Race condition - ApprovedUserRoute checked auth state before AuthProvider finished database lookup
- **Solution**: Fixed AuthProvider to keep isLoading=true until database status check completes
- **Files**: `src/contexts/AuthProvider.tsx`, `src/App.tsx`
- **Status**: Trial users now properly access main app without pending approval redirect

## Usage Tracking System - COMPLETED ✅
- **Implementation**: Complete usage tracking with database integration
- **Service**: `src/services/usageService.ts` - handles limits, increments, and checks
- **Integration**: MainPage checks limits before reconciliation, increments after success
- **Components**: UsageCounter displays real-time usage from database
- **Enforcement**: Trial users blocked when hitting tier limits (starter: 50, professional: 75, business: 150)
- **Status**: Fully functional usage tracking and limit enforcement

## Header Login Button Fix - COMPLETED ✅  
- **Problem**: Login button missing or stuck showing "Loading..." 
- **Root Cause**: isLoading condition hiding button + AuthProvider not setting isLoading=false for unauthenticated users
- **Solution**: Removed isLoading condition from button visibility, fixed AuthProvider loading state
- **Files**: `src/components/Header.tsx`, `src/contexts/AuthProvider.tsx`
- **Status**: Login button properly shows "Login" for unauthenticated users

## Landing Page Login Access - COMPLETED ✅
- **Addition**: "Already have an account? Sign In" link on landing page
- **Purpose**: Existing users can access login without going through registration flow
- **Location**: Below main CTA buttons alongside consultation booking link
- **Files**: `src/pages/LandingPage.tsx`
- **Status**: Multiple login access points for better UX

## Trial System & Security Enhancements - COMPLETED ✅ (2025-08-03)
- **Admin Delete Issues**: Fixed delete functionality, removed non-existent column references
- **Auto-Activation Bug**: Resolved users appearing as already activated, now requires manual workflow
- **Activation State Persistence**: Made activation state persistent using database trial data
- **Trial Billing Integration**: Fixed trial users not showing Stripe payment options
- **Client Portal Security**: Added CAPTCHA to match main login security consistency
- **Data Persistence Root Cause**: Enhanced deletion to prevent client_path collision inheritance
- **Status**: Complete trial-to-paid conversion workflow with consistent security

## Client Portal CAPTCHA Validation Fix - COMPLETED ✅ (2025-08-17)
- **Problem**: Client portal login showed "Portal Not Found" page instead of inline CAPTCHA validation errors
- **Root Cause**: Single error state used for both fatal errors (client not found) and form validation errors
- **Solution**: Separated error states - `fatalError` for portal issues, `error` for form validation
- **Files**: `src/pages/ClientPortalPage.tsx` - error state management and render logic
- **Status**: Client portal now shows proper inline CAPTCHA validation like main login form

## Configuration Files - CRITICAL
- **tailwind.config.js**: Must maintain proper Tailwind configuration
- **postcss.config.js**: Required for PostCSS/Tailify processing
- **src/App.tsx**: Route structure and Suspense boundaries are precise
- **WARNING**: Any changes to build configs can break all page styling