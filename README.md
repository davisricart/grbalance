# GR Balance - Multi-Client SaaS Reconciliation Platform

A comprehensive multi-client SaaS platform for payment reconciliation and financial data analysis. This system provides automated client onboarding, website provisioning, custom script deployment, and centralized admin management.

## 🏗️ System Architecture

### Multi-Client SaaS Model

This platform serves multiple clients through a unified admin dashboard while maintaining complete isolation and customization for each client.

**Key Features:**
- **Self-Service Registration**: Clients can sign up and choose subscription plans
- **Admin Approval Workflow**: Pending users reviewed and approved by administrators
- **Automated Site Provisioning**: One-click Netlify website creation for approved clients
- **Custom Script Deployment**: Deploy client-specific reconciliation scripts to their websites
- **User Lifecycle Management**: Full user management with activation/deactivation controls

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for development and build
- Tailwind CSS for responsive design
- Lucide React & HeroIcons for icons

**Backend:**
- Firebase Authentication for user management
- Firestore for data persistence
- Netlify Functions for serverless backend
- Netlify Sites API for automated provisioning

**Infrastructure:**
- Netlify for hosting and CI/CD
- Firebase for authentication and database
- Automated site deployment and management

## 🎯 Core Features

### 🔐 User Management System

**Registration Flow:**
1. **Self-Service Signup**: Users provide business details and select subscription tier
2. **Pending Approval**: New registrations wait for admin review
3. **Admin Review**: Admins approve/reject pending users through dashboard
4. **Account Activation**: Approved users gain full access to their subscription

**User Lifecycle:**
- ✅ **Pending** → **Approved** → **Active**
- ⚠️ **Approved** → **Deactivated** (temporary suspension)
- ✅ **Deactivated** → **Reactivated** (restore access)
- 🗑️ **Pending** → **Rejected** (permanent deletion)

### 🏢 Admin Dashboard

**Comprehensive Management Interface:**

**User Management:**
- View and manage pending user approvals
- Approve/reject new registrations with detailed confirmation dialogs
- Deactivate/reactivate user accounts
- Edit user details, subscription tiers, and billing cycles
- Add private admin notes for internal tracking
- **Software Profile Assignment**: Configure client-specific POS system profiles
- **Individual Insights Control**: Toggle insights tab on/off per client

**Software Profiles Management:**
- Visual display of all available software profiles with keyword detection
- Color-coded keyword chips for automatic column mapping
- Feature availability indicators for each profile type
- Configure profiles for: DaySmart Salon, Square POS, Toast, Shopify, Custom

**Search & Filter System:**
- Real-time search by email, business name, or user ID
- Filter by user status (approved/deactivated) and subscription tier
- Smart counters showing filtered vs total results
- One-click filter clearing

**Website Provisioning:**
- One-click Netlify site creation for approved clients
- Automatic unique subdomain generation
- Environment variable configuration
- Duplicate prevention (one site per user maximum)
- Site deletion and cleanup

**Script Deployment:**
- Custom JavaScript deployment to client sites
- Visual code editor with syntax highlighting
- Real-time deployment status tracking
- Script versioning and management

### 🌐 Automated Site Provisioning

**Netlify Integration:**
```javascript
// Automated site creation process
1. Generate unique site name: clientname-abc123
2. Create Netlify site via API
3. Configure environment variables (CLIENT_ID)
4. Deploy basic client portal structure
5. Store site details in Firebase for persistence
```

**Features:**
- Guaranteed unique site names with random suffixes
- Automatic SSL certificate provisioning
- Environment variable setup with retry logic
- State persistence across admin dashboard refreshes
- Clean deletion with full cleanup

### 📝 Script Deployment System

**Custom Script Management:**
```javascript
// Script deployment process
1. Admin opens script editor for specific client
2. Write/paste custom JavaScript code
3. Deploy to client's Netlify site
4. Script becomes available on client portal
5. Track deployment history and status
```

**Capabilities:**
- Visual code editor with large textarea
- Real-time deployment status
- Client-specific script isolation
- Automatic site updates
- Error handling and rollback

### 🎛️ Software Profiles System

**Dynamic Script Storage Enhancement:**
The platform supports unlimited software types through intelligent profile-based configuration, eliminating the need for manual script development for each new POS system.

**Available Profiles:**
- **DaySmart Salon Software**: Beauty/salon industry POS
- **Square POS**: General retail and restaurant 
- **Toast POS**: Restaurant-focused system
- **Shopify POS**: E-commerce and retail
- **Custom/Basic Format**: Flexible configuration for any system

**Smart Column Detection:**
```javascript
// Automatic data parsing with keyword matching
const columnKeywords = {
  date: ['date', 'time', 'timestamp', 'created'],
  amount: ['amount', 'total', 'net', 'gross', 'value'],
  customer: ['customer', 'client', 'name', 'buyer'],
  cardBrand: ['card', 'brand', 'type', 'method'],
  fee: ['fee', 'charge', 'cost', 'commission']
};

// Case-insensitive partial matching
// First match wins approach
// Multiple keyword fallback options
```

**Profile Configuration:**
Each software profile contains:
- **Column Detection Keywords**: Arrays of possible column names for automatic parsing
- **Insights Configuration**: Which analytical features to enable/disable  
- **Available Tabs**: Which UI tabs should be visible (Overview, Insights, Details, Reports)
- **Display Names**: Software-specific tab naming for quality control

**Individual Insights Control:**
- Admin can override profile defaults for each client
- Toggle insights tab on/off regardless of software profile
- Flexible configuration for clients with specific needs
- Quality control through software-specific naming (e.g., "Square POS Insights")

**Business Impact:**
- **Before**: Manual developer work required for each new script/software type
- **After**: Automatic detection and configuration based on software profiles  
- **Result**: Infinite customization without bottlenecks, complete SaaS platform capability

## 🗂️ Database Structure

### Firebase Collections

```javascript
// User registration and management
pendingUsers: {
  "userId": {
    email: "user@example.com",
    businessName: "Example Corp",
    businessType: "retail", 
    subscriptionTier: "professional",
    billingCycle: "monthly",
    createdAt: timestamp,
    status: "pending"
  }
}

// Active user accounts
usage: {
  "userId": {
    email: "user@example.com",
    businessName: "Example Corp",
    businessType: "retail",
    subscriptionTier: "professional", 
    billingCycle: "monthly",
    status: "approved", // approved, deactivated
    comparisonsUsed: 15,
    comparisonsLimit: 75,
    createdAt: timestamp,
    approvedAt: timestamp,
    
    // Site provisioning data
    siteUrl: "https://example-corp-abc123.netlify.app",
    siteId: "netlify-site-id",
    siteName: "example-corp-abc123",
    
    // Software profile configuration
    softwareProfile: "daysmartSalon", // daysmartSalon, square, toast, shopify, custom_basic
    softwareProfileConfig: {
      availableTabs: { overview: true, insights: true, details: true, reports: true },
      insightsConfig: { showInsights: true, showPaymentTrends: true, /* ... */ },
      dataStructure: { /* column keywords and detection rules */ }
    },
    showInsights: true, // Individual override for insights tab (optional)
    
    // Admin management
    adminNotes: "Special requirements for this client",
    updatedAt: timestamp
  }
}
```

### Subscription Tiers

```javascript
const TIER_LIMITS = {
  starter: 50,      // 50 comparisons/month
  professional: 75, // 75 comparisons/month  
  business: 150     // 150 comparisons/month
};
```

## 🚀 API Endpoints

### Netlify Functions

**Site Provisioning:**
   ```bash
POST /.netlify/functions/provision-client
Content-Type: application/json

{
  "clientId": "example-corp",
  "clientName": "Example Corp"
}

Response:
{
  "message": "Site created successfully!",
  "siteUrl": "https://example-corp-abc123.netlify.app",
  "siteId": "abc123-def456-ghi789",
  "siteName": "example-corp-abc123"
}
```

**Script Deployment:**
   ```bash
POST /.netlify/functions/deploy-script
Content-Type: application/json

{
  "siteId": "abc123-def456-ghi789",
  "scriptContent": "function reconcileData() { ... }",
  "scriptName": "reconciliation-v1.js",
  "clientId": "example-corp"
}

Response:
{
  "message": "Script deployed successfully",
  "deployUrl": "https://example-corp-abc123.netlify.app",
  "deployId": "deploy-abc123",
  "scriptName": "reconciliation-v1.js"
}
```

**Client Configuration:**
   ```bash
GET /.netlify/functions/get-client-config?clientId=example-corp
Content-Type: application/json

Response:
{
  "clientId": "example-corp",
  "softwareProfile": "daysmartSalon",
  "softwareProfileName": "DaySmart Salon Software",
  "availableTabs": {
    "overview": true,
    "insights": true,
    "details": true,
    "reports": true
  },
  "insightsConfig": {
    "showInsights": true,
    "showPaymentTrends": true,
    "showCustomerBehavior": true,
    "showOperationalMetrics": true,
    "showRiskFactors": true,
    "showBusinessIntelligence": true
  },
  "dataStructure": {
    "dateColumn": ["date", "time", "timestamp"],
    "amountColumn": ["amount", "total", "net"],
    "customerColumn": ["customer", "client", "name"],
    "cardBrandColumn": ["card", "brand", "type"],
    "feeColumn": ["fee", "charge", "cost"]
  }
}
```

## 🎨 UI/UX Design

### Design System

**Color Palette:**
- **Primary**: Emerald (`emerald-600`, `emerald-700`) for main actions
- **Secondary**: Gray tones for typography and backgrounds  
- **Status**: Green (success), Orange (warning), Red (danger), Blue (info)

**Component Standards:**
- **Responsive Design**: Mobile-first with card-based layouts
- **Consistent Spacing**: Generous padding with `p-4`, `p-6` patterns
- **Interactive Elements**: Smooth transitions with hover states
- **Form Design**: Clean inputs with focus rings and clear labels

**User Experience:**
- **Progressive Disclosure**: Information shown when needed
- **Clear Feedback**: Loading states, success messages, error dialogs
- **Warning Confirmations**: Detailed warnings before destructive actions
- **Smart Filtering**: Real-time search and filter capabilities

### Responsive Layout

**Desktop View:**
- Multi-column grid layouts for user information
- Horizontal action button groups
- Full-width search and filter controls

**Mobile View:**
- Stacked card layouts replacing wide tables
- Vertically organized user information
- Touch-friendly button sizes and spacing

## 🔧 Development Setup

### Prerequisites

- Node.js 18+ and npm 8+
- Firebase account and project
- Netlify account with API access
- Git for version control

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/grbalance
cd grbalance

# Install dependencies  
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Firebase and Netlify credentials

# Start development server
npm run dev
```

### Environment Variables

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Netlify Configuration  
NETLIFY_TOKEN=your_netlify_api_token
```

### Build for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Admin Workflows

### Onboarding New Clients

1. **User Registration**: Client completes self-service signup form
2. **Admin Review**: Review pending user in admin dashboard
3. **Approval**: Click "Approve" with confirmation dialog
4. **Site Provisioning**: Click "Provision Website" to create Netlify site
5. **Script Deployment**: Deploy custom reconciliation scripts
6. **Client Notification**: Send client their portal URL and login details

### Managing Existing Clients

**Edit User Details:**
- Update business information and subscription tiers
- Add private admin notes for internal tracking
- Adjust usage limits based on new subscription
- **Assign Software Profiles**: Configure client's POS system type
- **Control Insights Access**: Toggle insights tab on/off per client

**Software Profile Management:**
- Select from predefined profiles (DaySmart, Square, Toast, Shopify, Custom)
- Automatic column detection configuration applied
- Software-specific tab naming for quality control
- Individual insights override regardless of profile defaults

**Website Management:**  
- View client site status and URLs
- Deploy updated scripts to client portals
- Delete and recreate sites if needed

**User Status Management:**
- Temporarily deactivate users (preserves data)
- Reactivate users (restores full access)  
- Permanent account deletion if required

### Search and Organization

**Finding Users:**
- Search by email, business name, or user ID
- Filter by approval status (approved/deactivated)
- Filter by subscription tier (starter/professional/business)
- Clear all filters with one click

## 🔒 Security & Privacy

### Authentication & Authorization

- **Firebase Authentication**: Secure user management with email/password
- **Admin-Only Access**: Dashboard requires admin credentials
- **Session Management**: Automatic session handling and token refresh

### Data Protection

- **Client Isolation**: Complete separation of client data and scripts
- **Secure API Calls**: All Netlify API calls use secured tokens
- **Environment Variables**: Sensitive credentials stored securely
- **No Data Persistence**: Reconciliation data processed client-side only

### Site Security

- **HTTPS Only**: All sites provisioned with SSL certificates
- **Environment Variables**: Client-specific variables set automatically
- **Access Controls**: Users only access their assigned client portal

## 📈 Monitoring & Analytics

### Admin Dashboard Metrics

- **User Counts**: Total pending, approved, and deactivated users
- **Site Status**: Number of provisioned websites per subscription tier
- **Search Results**: Live filtering with result counts
- **Activity Tracking**: User registration and approval timestamps

### Operational Insights

- **Subscription Distribution**: Visual breakdown of tier adoption
- **Site Provisioning Success**: Track successful vs failed deployments
- **User Lifecycle**: Monitor approval rates and user activity

## 🚀 Deployment

### Production Deployment

**Netlify Deployment:**
1. Connect GitHub repository to Netlify
2. Configure build settings:
   ```bash
   Build command: npm run build
   Publish directory: dist
   ```
3. Set environment variables in Netlify dashboard
4. Enable automatic deployments on Git push

**Firebase Setup:**
1. Create Firebase project and enable Authentication + Firestore
2. Configure security rules for admin access
3. Set up Firebase hosting (optional) for additional environments

### Multi-Environment Setup

**Development:**
- Local development with Firebase emulators
- Test database with sample data
- Mock Netlify API calls for testing

**Staging:**
- Separate Firebase project for testing
- Limited Netlify site creation for validation
- Full feature testing environment

**Production:**
- Production Firebase project with real user data
- Full Netlify API access for live site creation
- Monitoring and alerting for critical functions

## 🆘 Support & Maintenance

### Common Admin Tasks

**Adding New Subscription Tiers:**
1. Update `TIER_LIMITS` object in AdminPage.tsx
2. Add new tier options to dropdown selects
3. Update pricing display logic
4. Test tier switching and limit calculations

**Customizing Warning Messages:**
- Edit confirmation dialog text in handler functions
- Update warning icons and styling as needed
- Test all destructive action confirmations

**Managing Site Templates:**
- Modify deploy-script.js for different site structures
- Update HTML templates for client portals
- Customize CSS and branding elements

### Troubleshooting

**Site Provisioning Issues:**
- Check Netlify API token permissions
- Verify unique site name generation
- Review error logs in browser console
- Test with different client names

**Script Deployment Problems:**  
- Validate JavaScript syntax before deployment
- Check site ID accuracy and availability
- Review deployment logs for specific errors
- Test with simple scripts first

**User Management Errors:**
- Verify Firebase security rules and permissions
- Check admin authentication status
- Review user data structure and required fields
- Test with different user scenarios

## 📝 Contributing

### Code Standards

- **TypeScript**: Strict typing for all new code
- **ESLint**: Follow configured linting rules
- **Prettier**: Consistent code formatting
- **Component Structure**: Functional components with hooks

### Testing Guidelines

- **Unit Tests**: Test utility functions and business logic
- **Integration Tests**: Test API endpoints and data flows  
- **UI Tests**: Test user interactions and responsive design
- **End-to-End**: Test complete admin workflows

### Documentation

- Update README for new features
- Document API changes and new endpoints
- Add inline code comments for complex logic
- Maintain changelog for version releases

---

## 📊 Project Status

**Current Version**: 2.0.0 - Complete Multi-Client SaaS Platform

**Features Implemented:**
- ✅ Self-service user registration with subscription tiers
- ✅ Comprehensive admin dashboard with user management
- ✅ Automated Netlify site provisioning with duplicate prevention
- ✅ Custom script deployment system with visual editor
- ✅ Advanced search and filtering for user management
- ✅ User lifecycle management (approve/deactivate/reactivate)
- ✅ Edit user details and private admin notes system
- ✅ Responsive mobile-friendly design
- ✅ Warning confirmations for all destructive actions
- ✅ State persistence across page refreshes
- ✅ **Software Profiles System**: Dynamic POS system configuration
- ✅ **Smart Column Detection**: Automatic data parsing with keyword matching
- ✅ **Individual Insights Control**: Per-client insights tab toggle
- ✅ **Quality Control Features**: Software-specific tab naming

**Ready for Production**: ✅ All core features implemented and tested

**Next Phase**: Ready for additional client-specific customizations and advanced features based on business requirements.

---

**Built with ❤️ for efficient multi-client reconciliation management** 