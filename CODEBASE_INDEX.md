# GR Balance - Codebase Index & File Navigator

Last Updated: June 24, 2025

## 🚀 **Quick File Navigator**

### 📋 **Essential Documentation (READ FIRST)**
- **`CLAUDE.md`** - 🚨 **CRITICAL maintenance rules - READ BEFORE ANY CHANGES**
- **`PROGRESS_LOG.md`** - Current project status and recent progress  
- **`README.md`** - Main project documentation and setup guide
- **`CODEBASE_INDEX.md`** - This file - project structure guide

### 📁 **Organized Documentation**
- **`documentation/essential/`** - Copies of critical docs for backup
- **`documentation/setup/`** - Deployment, environment, and integration setup
- **`documentation/business/`** - Product philosophy and business workflows  
- **`documentation/development/`** - Dev guides, troubleshooting, and changelogs
- **`documentation/reports/`** - Performance and status reports

### 🤖 **AI Context & Automation**
- **`ai-context/claude-knowledge/`** - Claude AI patterns and learning
- **`ai-context/automation/`** - Workflow automation documentation
- **`ai-context/patterns/`** - AI development patterns (future use)

---

## 🏗️ **Project Architecture**

### **`/src`** - Main Application Code
```
src/
├── components/           # Reusable React components
│   ├── admin/           # 🔐 Admin panel components
│   │   ├── UserManagement/     # Pending/Approved/Testing user workflows
│   │   ├── ScriptTesting/      # 🧪 Core testing functionality (CRITICAL)
│   │   ├── ClientManagement/   # Client CRUD operations
│   │   └── DeploymentManager/  # Software deployment tools
│   ├── Layout.tsx       # Main app layout wrapper
│   ├── ErrorBoundary.tsx # Error handling component
│   └── ...              # Core UI components
├── pages/               # 📄 Route components
│   ├── AdminPage.tsx    # 🎯 Main admin interface (RESTORED & STABLE)
│   ├── MainPage.tsx     # Core reconciliation interface
│   ├── LoginPage.tsx    # Authentication
│   └── ...              # Other application pages
├── contexts/            # React context providers
│   └── AuthProvider.tsx # 🔐 Authentication state management
├── hooks/               # Custom React hooks
├── services/            # 🔌 External service integrations
│   ├── adminService.ts  # Admin verification and operations
│   └── stripeService.ts # Payment processing
├── utils/               # 🛠️ Utility functions
│   ├── fileProcessor.ts # Core Excel/CSV processing logic
│   └── ...              # File validation, error handling
├── types/               # TypeScript definitions
└── config/              # Configuration files
    ├── supabase.ts      # 🗄️ Database configuration (Supabase only)
    ├── stripe.ts        # Payment configuration
    └── client.ts        # Client-specific settings
```

### **Root Directory Structure**
```
grbalance/
├── 📁 src/              # Main application code (see above)
├── 📁 documentation/    # 📚 Organized documentation
│   ├── essential/       # Critical docs (CLAUDE.md, README.md, PROGRESS_LOG.md)
│   ├── setup/          # Deployment, environment, integration guides
│   ├── business/       # Product philosophy and workflows
│   ├── development/    # Dev guides, troubleshooting, changelogs
│   └── reports/        # Performance and status reports
├── 📁 ai-context/      # 🤖 AI assistance and automation
│   ├── claude-knowledge/ # Claude AI patterns and learning
│   ├── automation/     # Workflow automation docs
│   └── patterns/       # AI development patterns
├── 📁 public/          # Static assets (images, favicon, workers)
├── 📁 netlify/         # Deployment configuration & serverless functions
├── 📁 clients/         # Client-specific scripts and configurations
├── 📁 scripts/         # Build, development, and setup scripts
├── 📁 sample-data/     # Test Excel files for development
├── 📄 CLAUDE.md        # 🚨 CRITICAL maintenance rules
├── 📄 README.md        # Main project documentation
├── 📄 PROGRESS_LOG.md  # Current project status
├── 📄 CODEBASE_INDEX.md # This navigation file
├── 📄 package.json     # Dependencies and scripts
├── 📄 vite.config.js   # Build configuration
├── 📄 tailwind.config.js # Styling configuration
└── 📄 netlify.toml     # Netlify deployment settings
```

---

## 🗄️ **Database Architecture (Supabase)**

### **Tables**
- **`pendingusers`** - New user registrations awaiting approval
- **`ready-for-testing`** - Users in QA pipeline with consultation complete
- **`usage`** - Approved users with active subscriptions and usage tracking
- **`clients`** - Client configurations and settings

### **Workflow Pipeline**
```
Registration → pendingusers → ready-for-testing → usage (approved)
     ↑              ↓              ↓              ↓
   Sign up      Consultation    QA Testing    Production
```

---

## 🔧 **Key Technologies & Stack**

### **Frontend**
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **React Router** for navigation

### **Backend & Services**
- **Supabase** - Database, Auth, Real-time (100% Firebase-free ✅)
- **Netlify** - Hosting and serverless functions
- **Stripe** - Payment processing
- **EmailJS** - Email automation

### **File Processing**
- **ExcelJS** - Excel file parsing and manipulation
- **Papa Parse** - CSV processing
- **Custom validation pipeline** - Data structure validation

---

## 🚨 **Critical Components & Workflows**

### **AdminPage.tsx** - 🎯 **MISSION CRITICAL**
- **Status:** Fully restored and stable (Zero Firebase references)
- **Structure:** Original UI preserved exactly
- **Test Scripts:** Core business functionality - **TOP PRIORITY**
- **Database:** 100% Supabase operations
- **Performance:** Optimized useEffect, no excessive fetching

### **Script Testing Workflow** - 🧪 **CORE BUSINESS VALUE**
- File upload and parsing
- AI-powered reconciliation logic
- Results comparison and export
- **Location:** `src/components/admin/ScriptTesting/`

### **User Management Pipeline**
1. **Pending Users** - Registration and approval workflow
2. **Ready for Testing** - QA and consultation tracking
3. **Approved Users** - Production user management
4. **Bulk Operations** - Multi-user workflows

---

## 🔄 **Recent Major Changes (June 2025)**

### ✅ **Completed**
- **Complete Firebase → Supabase migration** (28+ operations converted)
- **AdminPage structure restoration** from stable state
- **Performance optimization** (eliminated excessive useEffect)
- **Authentication fixes** (sign out functionality)
- **Project cleanup** (removed 100+ temporary files)

### 🎯 **Current Status**
- **Ready for workflow testing**
- **All CRUD operations functional**
- **Zero Firebase dependencies**
- **Clean, production-ready codebase**

---

## 🚀 **Development Commands**

```bash
# Development
npm run dev              # Start development server
npm run dev:clean        # Clean start (kill ports first)

# Build & Deploy
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # ESLint checking
npm run format           # Prettier formatting
npm run typecheck        # TypeScript checking

# Testing
npm test                 # Run Jest tests
npm run test:watch       # Watch mode testing
```

---

## 🛡️ **Emergency Restore Points**

```bash
# Restore to stable AdminPage state
git checkout stable-adminpage-v1

# Restore to post-Firebase conversion
git checkout firebase-conversion-complete
```

---

## 📞 **Getting Help**

1. **Read `CLAUDE.md` first** - Contains critical maintenance rules
2. **Check `PROGRESS_LOG.md`** - Current status and recent work
3. **Review `TROUBLESHOOTING_COPY_BOX.md`** - Common issues
4. **Use git tags** - Restore to known good states if needed

**Remember:** AdminPage structure is OFF-LIMITS for modifications. Only database operations should be changed.