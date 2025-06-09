# GR Balance Codebase Index & Navigation Guide

*Last Updated: January 2025*

This comprehensive index provides quick navigation and search capabilities for the GR Balance codebase. Use Ctrl+F to search for specific functions, components, or functionality.

## 🏗️ Project Architecture Overview

**GR Balance** is a React + TypeScript application with:
- **Frontend**: React SPA with Tailwind CSS
- **Backend**: Netlify serverless functions
- **Database**: Firebase Firestore + Authentication
- **Deployment**: Netlify with multi-tenant client sites
- **File Processing**: SheetJS (XLSX) for Excel/CSV reconciliation

---

## 🔍 Quick Search Keywords

### Common Issues & Locations
- **File Upload Issues**: `handleTestFileUpload:2917`, `bulletproofFileValidator.ts`, `fileProcessor.ts`
- **Script Execution Errors**: `runTestScript:3120`, `clearScriptSteps:2375`, `execute-script.js`
- **Authentication Problems**: `useAuthState.ts`, `LoginPage.tsx`, `firebase-admin` functions
- **Button Not Working**: Search function name + `:line_number`
- **Admin Functions**: `AdminPage.tsx:1-6000+` (267KB file)
- **Client Management**: `provision-client.js`, `delete-client-site.js`, functions
- **Data Processing**: `standardReconciliation.js`, `applyStepTransformation:2595`

### File Types & Locations
- **React Components**: `src/components/`
- **Pages & Routes**: `src/pages/`
- **Utilities**: `src/utils/`
- **API Functions**: `netlify/functions/`
- **Business Logic**: `scripts/`
- **Types**: `src/types/`

---

## 📱 React Components Index

### Core Components (`src/components/`)

| Component | File | Purpose | Key Props |
|-----------|------|---------|-----------|
| **BookingCalendar** | BookingCalendar.tsx | Cal.com integration | None (self-contained) |
| **DynamicExcelFileReader** | DynamicExcelFileReader.tsx | Secure file upload | `onFileLoad`, `onError`, `selectedFile` |
| **DynamicFileDropdown** | DynamicFileDropdown.tsx | File selection UI | `value`, `onChange`, `filter` |
| **ErrorBoundary** | ErrorBoundary.tsx | Error handling | `children`, error recovery |
| **Footer** | Footer.tsx | Site footer | None |
| **Header** | Header.tsx | Navigation | Uses `useAuthState` |
| **Layout** | Layout.tsx | Page wrapper | `children` |
| **LoadingSpinner** | LoadingSpinner.tsx | Loading states | `size`, `className` |
| **ROICalculator** | ROICalculator.tsx | ROI calculations | Interactive component |
| **UsageCounter** | UsageCounter.tsx | Usage tracking | Firebase integration |
| **VirtualTable** | VirtualTable.tsx | Performance tables | `data`, `maxRows` |
| **VisualStepBuilder** | VisualStepBuilder.tsx | Script builder UI | Complex step props |

---

## 🏃‍♂️ Page Components & Routes

| Route | Component | File | Purpose |
|-------|-----------|------|---------|
| `/` | LandingPage | LandingPage.tsx | Marketing homepage |
| `/app` | ReconciliationApp | ReconciliationApp.tsx | Main app container |
| `/login` | LoginPage | LoginPage.tsx | Authentication |
| `/register` | RegisterPage | RegisterPage.tsx | User registration |
| `/admin` | AdminPage | AdminPage.tsx | Admin interface (267KB) |
| `/pricing` | PricingPage | PricingPage.tsx | Subscription plans |
| `/demo` | DemoPage | DemoPage.tsx | Static demo |
| `/interactive-demo` | InteractiveDemoPage | InteractiveDemoPage.tsx | Interactive demo |
| `/book` | BookingPage | BookingPage.tsx | Consultation booking |
| `/docs` | DocumentationPage | DocumentationPage.tsx | User guides |
| `/support` | SupportPage | SupportPage.tsx | FAQ & help |
| `/contact` | ContactPage | ContactPage.tsx | Contact form |
| `/privacy` | PrivacyPage | PrivacyPage.tsx | Privacy policy |
| `/terms` | TermsPage | TermsPage.tsx | Terms of service |
| `/pending-approval` | PendingApprovalPage | PendingApprovalPage.tsx | Registration status |
| `*` | NotFoundPage | NotFoundPage.tsx | 404 error |

---

## 🔧 AdminPage.tsx Function Directory
*Critical functions in the 6000+ line admin interface*

### File Upload/Processing (Lines 2900-3100)
```typescript
handleTestFileUpload(fileNumber: 1|2, file: File)  // Line 2917
processTestFiles()                                  // Line 3053  
parseFile(file: File)                              // Import
handleTestScriptUpload(file: File)                 // Line 3034
```

### Script Execution (Lines 3100-3400)
```typescript
runTestScript()                     // Line 3120 - Main script execution
runComparisonWithAutoProcess()      // Line 3108 - Auto-process wrapper
initializeTestEnvironment()        // Line 2701 - Setup XLSX + helpers
executeStepsUpTo(stepNumber)       // Line 2011 - Sequential execution
executeVisualStep(stepNumber)      // Line 2543 - Single step execution
clearScriptSteps()                 // Line 2375 - Clear history/results
```

### UI Interaction Handlers (Lines 1100-1600)
```typescript
handleLogin(e)                     // Line 1138 - Admin auth
handleEditUser(user)               // Line 981  - User edit modal
handleUpdateUser()                 // Line 993  - User updates
showNotification(type, title, msg) // Line 344  - Toast notifications
showConfirmation(...)              // Line 1106 - Confirmation dialogs
```

### User Management (Lines 400-900)
```typescript
fetchClients()                     // Line 396  - Load clients
fetchPendingUsers()                // Line 427  - Load pending
fetchApprovedUsers()               // Line 446  - Load approved
approvePendingUser(userId)         // Line 695  - Approve registration
rejectPendingUser(userId)          // Line 744  - Reject registration
deactivateApprovedUser(userId)     // Line 766  - Deactivate user
deleteUser(userId)                 // Line 513  - Soft delete
restoreUser(userId)                // Line 536  - Restore deleted
permanentlyDeleteUser(userId)      // Line 570  - Hard delete
```

### Website/Deployment (Lines 1200-1600)
```typescript
handleProvisionWebsite(user)       // Line 1250 - Create Netlify site
handleDeleteWebsite(user)          // Line 1357 - Delete site
handleDeployScript(user)           // Line 1410 - Deploy script
handleDeleteScript(userId, name)   // Line 1525 - Remove script
redeployClientSite(user)           // Line 1573 - Redeploy site
```

### Data Processing (Lines 2400-2700)
```typescript
applyStepTransformation(instruction, data) // Line 2595 - Transform data
updateClientResultsReplica(data)           // Line 2158 - Display results
generateFinalScript()                      // Line 2408 - Generate JS
addScriptStep(instruction)                 // Line 1920 - Add step
removeScriptStep(stepId)                   // Line 1998 - Remove step
```

### Visual Step Builder (Lines 2400-2700)
```typescript
initializeVisualStepBuilder(instructions) // Line 2477 - Start builder
addVisualStep(instruction)                 // Line 2526 - Add step
revertVisualStep(stepNumber)               // Line 2654 - Revert to step
viewVisualStep(stepNumber)                 // Line 2680 - Toggle details
updateScriptStepsTable()                   // Line 1947 - Refresh table
```

---

## 🌐 Netlify Functions API

### Data Processing Endpoints
| Function | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `execute-script.js` | POST | Reconciliation processing | `file1Data`, `file2Data` |
| `execute-script-new.js` | POST | Enhanced reconciliation | `file1Data`, `file2Data` |

### Client Management
| Function | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `provision-client.js` | POST | Create client site | `clientId`, `clientName` |
| `delete-client-site.js` | POST | Delete client site | `siteUrl`, `clientId` |
| `redeploy-client-site.js` | POST | Redeploy site | `siteId`, `clientId`, `clientName` |

### Script Management  
| Function | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `deploy-script.js` | POST | Deploy custom script | `siteId`, `scriptContent`, `scriptName` |
| `get-available-scripts.js` | GET/POST | List deployed scripts | `clientId` |
| `scripts.js` | GET | List standard scripts | None |

### Configuration
| Function | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `get-client-config.js` | GET | Client configuration | `clientId` |
| `send-instruction.js` | POST | AI communication | `instruction`, `sessionId` |

---

## 🛠 Utilities & Helpers

### File Security (`src/utils/`)
- **bulletproofFileValidator.ts** - `bulletproofValidateFile()` - Content validation
- **universalFileValidator.ts** - `safeLoadFile()` - Universal validation
- **fileProcessor.ts** - `parseFile()` - Secure file parsing
- **dynamicFileLoader.ts** - `fetchAvailableFiles()` - Runtime file discovery

### Error Handling
- **errorHandling.ts** - `Logger`, `apiCallWithRetry()`, `classifyError()`

### Development
- **firebaseDebug.ts** - `debugFirestorePermissions()`
- **debugFileOperations.ts** - File operation debugging

---

## 📁 Local Scripts & Business Logic

### Core Algorithms (`scripts/`)
- **standardReconciliation.js** - Main reconciliation algorithm
  - Input: `XLSX`, `file1` (ArrayBuffer), `file2` (ArrayBuffer)  
  - Output: Filtered reconciliation results
  - Features: Card brand matching, date/amount comparison, Final Count filtering

### Client-Specific Logic
- **scripts/clients/gr_salon/reconciliation.js** - GR Salon customizations
- **scripts/clients/template/reconciliation.js** - Template for new clients

### Administrative Tools
- **scripts/adminCleanup.js** - Firebase user cleanup
- **scripts/dev-helper.js** - Development environment management
  - Commands: `check`, `kill`, `start`
  - Platform: Windows-specific port management

---

## 🔧 Configuration Files

### Project Configuration
- **netlify.toml** - Netlify deployment config (Node 18, security headers)
- **package.json** - Main dependencies and scripts
- **netlify/functions/package.json** - Function dependencies

### Application Config
- **src/config/client.ts** - Client branding configuration
- **config/template.json** - Template client settings

---

## 🎯 Common Debugging Locations

### File Upload Issues
1. Check `handleTestFileUpload:2917` in AdminPage.tsx
2. Verify `bulletproofFileValidator.ts` validation
3. Review `fileProcessor.ts` parsing logic
4. Check console for validation errors

### Script Execution Failures  
1. Check `runTestScript:3120` validation logic
2. Verify file data availability in console logs
3. Check global window variables are set
4. Review script content in `execute-script.js`

### Authentication Problems
1. Check `useAuthState.ts` hook
2. Review Firebase config in `main.tsx`
3. Check LoginPage.tsx error handling
4. Verify Firebase admin functions

### Button Click Issues
1. Search for onClick handler function name
2. Check function implementation for missing logic
3. Verify state updates and UI refresh
4. Example: `clearScriptSteps:2375` was missing `setStepHistory([])`

### Admin Interface Issues
1. Most functionality in `AdminPage.tsx` (267KB file)
2. User management: Lines 400-900
3. Script testing: Lines 2400-3400
4. Client management: Lines 1200-1600

---

## 🚀 Development Workflow

### Local Development
1. `npm run dev` - Start development server
2. `npm run dev:clean` - Clean start with port management
3. `npm run kill-ports` - Kill development processes

### Testing & Quality
1. `npm run test` - Run tests
2. `npm run typecheck` - TypeScript validation  
3. `npm run lint` - ESLint checks
4. `npm run format` - Prettier formatting

### Deployment
1. `npm run build` - Production build
2. Netlify auto-deploys from main branch
3. Client sites deployed via admin interface

---

## 📚 Key Technologies & Dependencies

### Frontend Stack
- **React 18** + **TypeScript** - UI framework
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Firebase** - Auth + Database
- **SheetJS (XLSX)** - Excel processing
- **Vite** - Build tool

### Backend & Infrastructure
- **Netlify Functions** - Serverless backend
- **Firebase Admin** - Server-side operations
- **Node.js 18** - Runtime environment

### Development Tools
- **ESLint** + **Prettier** - Code quality
- **PostCSS** - CSS processing
- **TypeScript** - Type safety

---

*This index is designed for quick navigation and troubleshooting. Use Ctrl+F to search for specific functions, error messages, or functionality. For detailed implementation, refer to the actual source files using the provided line numbers.*