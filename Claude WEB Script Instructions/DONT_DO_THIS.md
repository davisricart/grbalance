# ❌ COMMON MISTAKES TO AVOID

## ❌ DON'T Return Arrays of Arrays
```javascript
// WRONG - This breaks the table
const results = [
  ["Card Brand", "Count", "Amount"],    // Headers
  ["Visa", 125, "$1,250.50"],          // Data
  ["Mastercard", 89, "$890.25"]        // Data  
];
```

## ✅ DO Return Array of Objects
```javascript
// CORRECT - This creates a proper table
const results = [
  { "Card Brand": "Visa", "Count": 125, "Amount": "$1,250.50" },
  { "Card Brand": "Mastercard", "Count": 89, "Amount": "$890.25" }
];
```

## ❌ DON'T Use Generic Column Names
```javascript
// WRONG - Confusing headers
{ "col1": "Visa", "col2": 125, "col3": "$1,250.50" }
```

## ✅ DO Use Descriptive Names  
```javascript
// CORRECT - Clear, professional headers
{ "Card Brand": "Visa", "Transaction Count": 125, "Total Amount": "$1,250.50" }
```

## ❌ DON'T Forget Error Handling
```javascript
// WRONG - No error handling
const data = await window.parseFiles();
const column = data1[0]["Card Brand"]; // Might not exist!
```

## ✅ DO Handle Missing Data
```javascript
// CORRECT - Safe column detection
const column = window.findColumn(data1[0], ["Card Brand", "Card Type"]);
if (!column) {
  window.showError("Could not find card column in uploaded file");
  return;
}
```

## ❌ DON'T Assume Data Format
```javascript
// WRONG - Assumes numbers are clean
const amount = row["Amount"] + 100; // Might be "$1,250.50" (string)
```

## ✅ DO Clean Data First
```javascript  
// CORRECT - Parse currency strings
const amount = parseFloat(row["Amount"].toString().replace(/[$,]/g, '')) || 0;
```

## ❌ DON'T Forget Async/Await Pattern
```javascript
// WRONG - Missing async wrapper
const { data1, data2 } = window.parseFiles(); // This will fail!
```

## ✅ DO Use Async Pattern
```javascript
// CORRECT - Proper async wrapper
(async () => {
  try {
    const { data1, data2 } = await window.parseFiles();
    // ... rest of script
  } catch (error) {
    window.showError("Error: " + error.message);
  }
})();
```