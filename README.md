# Payment Reconciliation System Template

A customizable web-based system for reconciling payment transactions between different payment processing systems. This repository serves as a template for creating client-specific reconciliation systems.

## Multi-Client Architecture

This system is designed to serve multiple clients from a single codebase while maintaining complete isolation and customization for each client.

### Core Principles

- **One Codebase**: All clients share the same core application code
- **Script Isolation**: Each client has their own custom reconciliation scripts
- **Secure Access**: Clients only see and access their assigned scripts
- **Individual Branding**: Each client gets their own Netlify site with custom branding
- **Centralized Updates**: Core improvements benefit all clients instantly

### Repository Structure for Multi-Client

```
grbalance/ (Master Repository)
├── src/                              # Shared frontend code
├── scripts/                          # Client-specific scripts (isolated)
│   ├── client1_reconciliation.js     # Client 1's custom scripts
│   ├── client1_paymentHub.js
│   ├── grSalon_reconciliation.js     # GR Salon's custom scripts  
│   ├── grSalon_daySmartSquare.js
│   ├── client3_squareIntegration.js  # Client 3's custom scripts
│   └── standard_reconciliation.js    # Admin/demo scripts
├── config/                           # Client-specific configurations
│   ├── client1.json                  # Client 1 branding & settings
│   ├── grSalon.json                  # GR Salon branding & settings
│   ├── client3.json                  # Client 3 branding & settings
│   └── default.json                  # Default configuration
├── netlify/                          # Shared serverless functions
└── netlify.toml                      # Build configuration
```

### Client Script Isolation

**Each client gets completely separate scripts:**

- **GR Salon**: `grSalon_reconciliation.js`, `grSalon_daySmartSquare.js`
- **Client 2**: `client2_reconciliation.js`, `client2_paymentHub.js`  
- **Client 3**: `client3_squareIntegration.js`, `client3_customLogic.js`

**Security Features:**
- Clients can only see scripts assigned to them in dropdown
- Database controls which scripts each user can access
- No shared scripts between clients (complete isolation)
- Admin profile has access to demo/testing scripts only

### Database Structure (Firebase)

```javascript
// User-Client Mapping
users: {
  "grSalonUser@email.com": {
    clientId: "grSalon",
    scripts: ["grSalon_reconciliation", "grSalon_daySmartSquare"],
    role: "user"
  },
  "client2User@email.com": {
    clientId: "client2",
    scripts: ["client2_reconciliation", "client2_paymentHub"],
    role: "user"
  }
}

// Client Configurations
clients: {
  "grSalon": {
    name: "GR Salon",
    scripts: ["grSalon_reconciliation", "grSalon_daySmartSquare"],
    branding: {
      logo: "path/to/logo.png",
      primaryColor: "#your-color",
      siteName: "GR Salon Reconciliation Portal"
    }
  },
  "client2": {
    name: "Client 2 Corp",
    scripts: ["client2_reconciliation", "client2_paymentHub"],
    branding: {
      logo: "path/to/client2-logo.png", 
      primaryColor: "#their-color",
      siteName: "Client 2 Payment Portal"
    }
  }
}
```

### Deployment Strategy

**One Repository → Multiple Netlify Sites**

1. **Master Repository**: Single GitHub repo with all code
2. **Multiple Netlify Sites**: Each client gets their own site pointing to the same repo
3. **Environment Variables**: Each Netlify site has client-specific environment variables

**Example Sites:**
- `grSalon.grbalance.com` → CLIENT_ID=grSalon
- `client2.grbalance.com` → CLIENT_ID=client2  
- `client3.grbalance.com` → CLIENT_ID=client3

**Environment Variables per Site:**
```bash
# grSalon.grbalance.com
CLIENT_ID=grSalon
SITE_NAME="GR Salon Reconciliation Portal"
PRIMARY_COLOR=#your-color

# client2.grbalance.com
CLIENT_ID=client2
SITE_NAME="Client 2 Payment Portal"  
PRIMARY_COLOR=#their-color
```

### Adding New Clients

**Step-by-Step Process:**

1. **Create Client Scripts**
   ```bash
   # Add to scripts/ folder
   newClient_reconciliation.js
   newClient_customLogic.js
   ```

2. **Create Client Configuration**
   ```bash
   # Add to config/ folder
   config/newClient.json
   ```

3. **Update Database**
   ```javascript
   // Add to Firestore
   clients/newClient: {
     name: "New Client Corp",
     scripts: ["newClient_reconciliation", "newClient_customLogic"],
     branding: { ... }
   }
   ```

4. **Create Netlify Site**
   - Point to same GitHub repo
   - Set CLIENT_ID=newClient environment variable
   - Configure custom domain: newClient.grbalance.com

5. **Add Users**
   ```javascript
   // Add to Firestore
   users/newClientUser@email.com: {
     clientId: "newClient",
     scripts: ["newClient_reconciliation", "newClient_customLogic"]
   }
   ```

### Benefits of This Architecture

✅ **Scalable**: Add unlimited clients without code duplication  
✅ **Maintainable**: Core improvements benefit all clients instantly  
✅ **Secure**: Complete script and data isolation between clients  
✅ **Customizable**: Each client gets tailored scripts and branding  
✅ **Cost-Effective**: One codebase, multiple revenue streams  
✅ **Professional**: Each client gets their own branded portal  

### Development Workflow

**For Core Features** (benefits all clients):
1. Develop in master branch
2. Deploy updates all client sites automatically
3. Examples: UI improvements, new features, bug fixes

**For Client-Specific Work**:
1. Create new scripts in `scripts/clientName_*.js`
2. Add client configuration in `config/clientName.json`
3. Update database with client/user mappings
4. Create new Netlify site with client environment variables

This architecture allows you to scale efficiently while providing each client with a completely customized, professional solution.

## Template Features

- Configurable transaction data comparison
- Customizable card brand mapping
- Adjustable fee calculations
- Flexible report formats
- Modular client-specific logic
- **Visual Dashboard**: Summary cards showing key metrics at a glance
- **Enhanced Results Display**: Color-coded discrepancies with trend indicators
- **Smart Highlighting**: Large discrepancies highlighted for immediate attention
- **Consistent Admin UI**: The admin login page now matches the main site branding, using the emerald theme, logo, and modern rounded card styling for a unified user experience.

## Architecture Philosophy

**Lightweight & Cost-Effective Design:**
- **No Data Storage**: All processing is client-side with uploaded files only
- **Stateless Operations**: No historical data retention or user data persistence
- **Minimal Infrastructure**: Reduces hosting costs and complexity
- **Privacy-First**: User data never leaves their session

## Design Guidelines

**Simple, Beautiful, and Flowing UI Principles:**

### Visual Design Philosophy
- **Minimalistic**: Clean, uncluttered interfaces that focus on essential functionality
- **Consistent**: Unified design language across all pages and components
- **Professional**: Modern, business-appropriate aesthetics
- **Accessible**: Clear contrast, readable fonts, and intuitive navigation

### Color Scheme
- **Primary**: Emerald green (`emerald-600`, `emerald-700`) for primary actions and branding
- **Secondary**: Gray tones (`gray-50` to `gray-900`) for typography and backgrounds
- **Accent**: Light emerald (`emerald-50`, `emerald-100`) for highlights and hover states
- **Status Colors**: 
  - Success: Green variants
  - Warning: Yellow/amber variants
  - Error: Red variants
  - Info: Blue variants

### Typography
- **Headers**: Bold, clear hierarchy (text-2xl, text-3xl, text-4xl)
- **Body**: Readable, consistent spacing (text-sm, text-base)
- **Interactive Elements**: Medium weight for buttons and links
- **Labels**: Medium weight for form labels and navigation

### Layout Principles
- **Responsive**: Mobile-first design with clean grid layouts
- **Whitespace**: Generous padding and margins for breathing room
- **Cards**: Rounded corners (rounded-lg, rounded-xl) with subtle shadows
- **Forms**: Clean, well-spaced inputs with clear labels
- **Tables**: Professional styling with hover states and clear data presentation

### Component Standards
- **Buttons**: 
  - Primary: `bg-emerald-600 hover:bg-emerald-700`
  - Secondary: `bg-gray-600 hover:bg-gray-700`
  - Rounded corners and smooth transitions
- **Forms**: 
  - Focus states with emerald ring: `focus:ring-emerald-500`
  - Consistent padding: `px-4 py-3`
  - Clear labels with proper spacing
- **Navigation**:
  - Clean, minimal header design
  - Breadcrumbs for complex flows
  - Intuitive back/forward actions

### User Experience
- **Progressive Disclosure**: Show information when needed, hide complexity
- **Clear Feedback**: Loading states, success messages, error handling
- **Intuitive Flow**: Logical progression through multi-step processes
- **Consistent Interactions**: Same patterns for similar actions across the app

### Implementation Notes
- Use Tailwind CSS classes consistently
- Maintain `transition-colors duration-200` for interactive elements
- Include proper hover and focus states for accessibility
- Test on mobile devices for responsive behavior
- Keep animations subtle and purposeful

## Directory Structure

```
├── scripts/
│   ├── standardReconciliation.js      # Main reconciliation script (standalone)
│   ├── claudeStandardReconciliation.js # Claude AI version (standalone)
│   └── clients/
│       └── template/
│           └── reconciliation.js      # Core reconciliation logic for template client
├── src/                              # Frontend source code
└── config/                           # Configuration files
```

## Script Organization Standard

All comparison scripts must be standalone `.js` files located in the `scripts` directory. No comparison logic should be embedded in React components. This ensures all business logic is modular, testable, and reusable.

## Backend API

A Node.js Express backend provides endpoints to:
- List available scripts: `GET /api/scripts`
- Execute a script: `POST /api/scripts/:scriptName/execute` (accepts two files: `file1` and `file2`)

### Running the Backend

1. Install dependencies:
   ```bash
   npm install express multer xlsx
   ```
2. Start the server:
   ```bash
   node server.js
   ```
   The API will be available at `http://localhost:3001` by default.

## Frontend Integration

- The frontend fetches the list of available scripts from the backend and allows the user to select and execute them with uploaded files.
- Results are displayed in the UI and can be downloaded as Excel.

## Customization Points

1. **Report Formats**
   - Column mappings
   - Date formats
   - Amount formats

2. **Card Brand Handling**
   - Brand name mappings
   - Brand-specific rules

3. **Fee Calculations**
   - Processing fees
   - Discount rates
   - Tax handling

4. **Client Branding**
   - Logo
   - Color scheme
   - Custom styling

## Creating a New Client Instance

1. Clone this template repository
2. Update client configuration in `config/`
3. Customize reconciliation logic as needed
4. Adjust branding and UI elements
5. Deploy client-specific instance

## Development Guidelines

1. Keep core logic separate from client-specific code
2. Document all customizations
3. Maintain test coverage for changes
4. Follow the existing code style

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure client settings
4. Start development server: `npm run dev`

### Building for Production

```bash
npm run build
```

## Support

For template support or customization guidance, please contact the development team.

## Security

- **API keys and secrets are never committed to the repository.**
  - All sensitive credentials are stored in `.env` files, which are gitignored.
  - Sample config files only use placeholders, never real secrets.
- **Firebase and other API keys are loaded via environment variables** (e.g., `import.meta.env.VITE_FIREBASE_API_KEY`).
- **Admin credentials and scripts** use environment variables and are never exposed to the frontend or public repo.
- **Security best practices:**
  - Never commit real `.env` files or secrets.
  - Review and enforce strict Firebase security rules.
  - Keep all secret keys for third-party APIs (Stripe, Square, etc.) server-side only.
  - Periodically audit the repo for accidental key leaks.

**This section is a reminder to always follow these practices as the project evolves.**

## grbalance

## Script Organization Standard

All comparison scripts must be standalone `.js` files located in the `