# 📊 Real Data Examples

## What Excel Data Looks Like After Upload

### Example: Payment Transactions File
```javascript
// After window.parseFiles(), data1 might look like:
[
  {
    "Transaction ID": "TXN001",
    "Date": "2024-01-15", 
    "Card Brand": "Visa",
    "Amount": 125.50,
    "Merchant": "Coffee Shop",
    "Status": "Approved"
  },
  {
    "Transaction ID": "TXN002",
    "Date": "2024-01-15",
    "Card Brand": "Mastercard", 
    "Amount": 89.25,
    "Merchant": "Gas Station",
    "Status": "Approved"
  }
  // ... more rows
]
```

### Example: Daily Totals File  
```javascript
// data2 might look like:
[
  {
    "Date": "2024-01-15",
    "Card Type": "Visa",
    "Total Amount": 1250.75,
    "Transaction Count": 15
  },
  {
    "Date": "2024-01-15", 
    "Card Type": "Mastercard",
    "Total Amount": 890.50,
    "Transaction Count": 12
  }
  // ... more rows
]
```

## Common Column Name Variations

**Card Types**: "Card Brand", "Card Type", "Payment Method", "card_brand"  
**Amounts**: "Amount", "Total", "Transaction Amount", "amount", "total_amount"  
**Dates**: "Date", "Transaction Date", "Created Date", "date"

## Expected Output Format

```javascript
// Good output for showResults():
[
  { 
    "Card Brand": "Visa",           // Clear header
    "Transaction Count": 125,        // Number
    "Total Amount": "$15,750.50",   // Formatted currency  
    "Percentage": "45.5%"           // Formatted percentage
  },
  {
    "Card Brand": "Mastercard",
    "Transaction Count": 89,
    "Total Amount": "$11,200.25", 
    "Percentage": "32.4%"
  }
]
```