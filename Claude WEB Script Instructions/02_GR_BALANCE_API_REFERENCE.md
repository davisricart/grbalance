# GR Balance Script API Reference

## 🔧 AVAILABLE FUNCTIONS

These functions are available in the `window` object when your script runs:

### 1. `window.parseFiles()`
**Purpose**: Converts uploaded Excel files to JavaScript objects  
**Returns**: `{ data1: Array, data2: Array }`

```javascript
// Usage Example
(async () => {
  try {
    const { data1, data2 } = await window.parseFiles();
    
    // data1 = Array of objects from first uploaded file
    // data2 = Array of objects from second uploaded file (if exists)
    
    console.log('File 1 rows:', data1.length);
    console.log('File 2 rows:', data2?.length || 0);
    
  } catch (error) {
    window.showError('Failed to parse files: ' + error.message);
  }
})();
```

### 2. `window.showResults(resultsArray)`
**Purpose**: Display results in the client portal table  
**Parameter**: Array of objects where each object represents a table row

```javascript
// Usage Example
const results = [
  { "Card Brand": "Visa", "Count": 25, "Amount": "$1,250.00" },
  { "Card Brand": "Mastercard", "Count": 18, "Amount": "$890.50" },
  { "Card Brand": "American Express", "Count": 7, "Amount": "$875.25" }
];

window.showResults(results);
```

### 3. `window.showError(message)`
**Purpose**: Display error message to user  
**Parameter**: String error message

```javascript
// Usage Example
window.showError('Invalid file format. Please upload Excel files only.');
```

### 4. `window.findColumn(row, possibleNames)`
**Purpose**: Smart column name matching (handles variations in column names)  
**Parameters**: 
- `row`: Object (single row from data)
- `possibleNames`: Array of possible column name variations

```javascript
// Usage Example
const row = data1[0]; // First row to check columns
const cardTypeColumn = window.findColumn(row, [
  'Card Type',
  'Card Brand', 
  'Payment Method',
  'card_type',
  'CardType'
]);

if (cardTypeColumn) {
  console.log('Found card type column:', cardTypeColumn);
} else {
  window.showError('Could not find card type column in uploaded file');
}
```

## 📊 DATA STRUCTURE EXAMPLES

### Input Data Format (from parseFiles)
```javascript
// data1 example (Payment transactions)
[
  {
    "Transaction ID": "TXN001",
    "Card Brand": "Visa", 
    "Amount": 125.50,
    "Date": "2024-01-15",
    "Merchant": "Coffee Shop"
  },
  {
    "Transaction ID": "TXN002", 
    "Card Brand": "Mastercard",
    "Amount": 89.25,
    "Date": "2024-01-15", 
    "Merchant": "Gas Station"
  }
  // ... more rows
]

// data2 example (Summary totals)
[
  {
    "Card Type": "Visa",
    "Total Amount": 1250.00,
    "Transaction Count": 25
  },
  {
    "Card Type": "Mastercard", 
    "Total Amount": 890.50,
    "Transaction Count": 18
  }
  // ... more rows  
]
```

### Output Data Format (for showResults)
```javascript
// Results should be array of objects
// Object keys become table headers
// Object values become table cells

const results = [
  {
    "Card Brand": "Visa",           // Clear, descriptive header
    "File 1 Count": 25,             // Specific to source 
    "File 2 Count": 25,             // Specific to source
    "Match Status": "✅ Perfect",    // Visual indicators OK
    "Difference": "$0.00"           // Formatted values
  }
];

// ❌ BAD - Don't use generic headers
const badResults = [
  { "col1": "Visa", "col2": 25, "col3": 25, "col4": "match" }
];

// ✅ GOOD - Use descriptive headers  
const goodResults = [
  { "Card Brand": "Visa", "Transactions": 25, "Status": "✅ Match" }
];
```

## 🔄 EXECUTION FLOW

1. Script starts execution
2. Call `await window.parseFiles()` to get data
3. Process/analyze the data
4. Call `window.showResults(results)` to display
5. Handle any errors with `window.showError()`

## ⚠️ CRITICAL REQUIREMENTS

- **ALWAYS use async/await** with parseFiles()
- **ALWAYS use descriptive column names** in results
- **ALWAYS handle errors** with try/catch and showError()
- **Results MUST be array of objects** (not array of arrays)
- **Column names become table headers** - make them user-friendly