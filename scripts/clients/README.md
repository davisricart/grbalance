# Client Scripts

This directory contains reconciliation scripts for different clients. Each client should have their own directory with their specific scripts.

## Structure

```
clients/
├── gr_salon/              # GR Salon specific scripts
│   └── reconciliation.js  # (formerly run5.js)
├── template/              # Template for new clients
│   └── reconciliation.js  # Base template to copy for new clients
└── README.md             # This file

```

## Adding a New Client

1. Create a new directory for your client: `clients/client_name/`
2. Copy the template script: `template/reconciliation.js`
3. Modify the script according to the client's specific:
   - Excel format
   - Column names
   - Calculation rules
   - Card brand names
   - Output format

## Template Script Features

The template script includes:
- Excel file parsing
- Date formatting
- Number formatting
- Card brand cleaning
- Comparison logic
- Report generation

## Client-Specific Customizations

Common things to modify for each client:
1. Column names and order
2. Date formats
3. Card brand naming conventions
4. Calculation rules
5. Report format
6. Additional client-specific logic 