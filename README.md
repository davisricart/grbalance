# Payment Reconciliation System

A web-based system for reconciling payment transactions between different payment processing systems.

## Features

- Compares transaction data from Hub Report and Sales Report
- Handles multiple card brands (Visa, Mastercard, American Express, Discover)
- Calculates fees and discounts
- Provides detailed transaction matching
- Shows summary totals by card brand

## File Structure

```
project/
├── scripts/
│   ├── run5.js              # Main reconciliation script
│   ├── test-run5.js         # Test harness
│   └── clients/
│       └── gr_salon/
│           └── reconciliation.js  # Client-specific reconciliation logic
```

## Usage

1. Upload Hub Report Excel file
2. Upload Sales Report Excel file
3. System will process and display:
   - Individual transactions with fees
   - Summary by card brand
   - Total differences

## Deployment

The application is deployed on Netlify at: https://grsalonsample.netlify.app

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/davisricart/NEW_Customer.git
cd NEW_Customer/project
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## File Format Requirements

### Transaction Section
- Date
- Customer Name (preserves original case)
- Total Transaction Amount
- Cash Discounting Amount
- Card Brand
- Total (-) Fee

### Comparison Section
- Card Brand
- Hub Report
- Sales Report
- Difference

## Development Guidelines

1. Always run tests before committing changes
2. Follow the existing code style and formatting
3. Update documentation when making significant changes
4. Use meaningful commit messages

## Support

For support or questions, please contact the development team. 