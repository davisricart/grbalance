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

## Configuration Files - CRITICAL
- **tailwind.config.js**: Must maintain proper Tailwind configuration
- **postcss.config.js**: Required for PostCSS/Tailwind processing
- **src/App.tsx**: Route structure and Suspense boundaries are precise
- **WARNING**: Any changes to build configs can break all page styling

## Recent Updates Log
### 2025-01-03 - User Management UX Improvement
- **COMPLETED**: Replaced ugly delete confirmation popup with clean inline warning
- **Location**: `src/components/admin/UserManagement/ApprovedUsersTab.tsx`
- **Change**: Removed browser popup, added inline red warning panel
- **UX**: Shows "This action cannot be undone" with Cancel/Delete buttons
- **Status**: Deployed via commit d439816