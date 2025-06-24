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