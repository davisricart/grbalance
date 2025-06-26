# 🔧 GR Balance API Functions

## Available Functions in `window` Object

### `window.parseFiles()`
**Purpose**: Get uploaded Excel files as JavaScript objects  
**Returns**: `Promise<{ data1: Array, data2: Array }>`

```javascript
const { data1, data2 } = await window.parseFiles();
// data1 = Array of objects from first file
// data2 = Array of objects from second file (or null if not uploaded)
```

### `window.showResults(resultsArray)`
**Purpose**: Display results in the client portal table  
**Parameter**: Array of objects (each object = one table row)

```javascript
window.showResults([
  { "Card Type": "Visa", "Count": 125, "Amount": "$1,250.50" },
  { "Card Type": "Mastercard", "Count": 89, "Amount": "$890.25" }
]);
```

### `window.showError(message)`
**Purpose**: Display error message to user  
**Parameter**: String error message

```javascript
window.showError("Could not find required column in uploaded file");
```

### `window.findColumn(row, possibleNames)`
**Purpose**: Smart column name matching  
**Parameters**: 
- `row`: First row object (to check available columns)
- `possibleNames`: Array of possible column name variations

**Returns**: String (actual column name) or null (if not found)

```javascript
const cardColumn = window.findColumn(data1[0], [
  'Card Brand',      // Exact match
  'Card Type',       // Alternative name
  'Payment Method',  // Another alternative
  'card_brand',      // Lowercase version
  'CardBrand'        // CamelCase version
]);

if (cardColumn) {
  // Use: data1[0][cardColumn]
} else {
  window.showError("Could not find card column");
}
```

## 🎯 Success Pattern
1. Get data with `parseFiles()`
2. Find columns with `findColumn()`  
3. Process your logic
4. Display with `showResults()`
5. Handle errors with `showError()`