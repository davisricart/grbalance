# Payment Reconciliation System Template

A customizable web-based system for reconciling payment transactions between different payment processing systems. This repository serves as a template for creating client-specific reconciliation systems.

## Template Features

- Configurable transaction data comparison
- Customizable card brand mapping
- Adjustable fee calculations
- Flexible report formats
- Modular client-specific logic

## Directory Structure

```
├── scripts/
│   ├── run5.js                    # Main reconciliation script
│   ├── test-run5.js              # Test harness
│   └── clients/
│       └── template/             # Template client configuration
│           └── reconciliation.js # Core reconciliation logic
├── src/                          # Frontend source code
└── config/                       # Configuration files
```

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