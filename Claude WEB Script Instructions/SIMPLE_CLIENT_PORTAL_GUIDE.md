# Simple Client Portal Guide for Claude Web

## 🎯 What You Need to Know

When building scripts for GR Balance, here's the **exact interface** your script results will appear in:

## 📱 Client Portal Layout

```
┌─────────────────────────────────────────────────┐
│  📁 Primary Dataset     📁 Secondary Dataset    │
│  [Upload File 1]       [Upload File 2]         │
│  ✅ file1.xlsx         ✅ file2.xlsx           │
│                                                 │
│          [🔄 Run Comparison]                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  📊 Results                                     │
│                                                 │
│  ┌─────────────┬─────────────┬─────────────┐    │
│  │ Card Brand  │ Count       │ Amount      │    │
│  ├─────────────┼─────────────┼─────────────┤    │
│  │ Visa        │ 125         │ $15,750.50  │    │
│  │ Mastercard  │ 89          │ $11,200.25  │    │
│  └─────────────┴─────────────┴─────────────┘    │
└─────────────────────────────────────────────────┘
```

## 🔧 How Your Script Works

1. **User uploads 2 Excel files** → Files become `data1` and `data2`
2. **User clicks "Run Comparison"** → Your script executes  
3. **Your script calls `window.showResults(data)`** → Table appears

## 📊 Results Format Required

Your script MUST return this format:

```javascript
// ✅ CORRECT - Array of objects
const results = [
  { "Card Brand": "Visa", "Count": 125, "Amount": "$15,750.50" },
  { "Card Brand": "Mastercard", "Count": 89, "Amount": "$11,200.25" }
];

window.showResults(results);
```

## 🎨 Table Styling (Automatic)

- **Headers**: Light green background, bold text
- **Data**: Clean white rows with borders
- **Format**: Currency with $ signs, numbers with commas

## 📝 Basic Script Template

```javascript
(async () => {
  try {
    // Get the uploaded files
    const { data1, data2 } = await window.parseFiles();
    
    // Your analysis logic here
    const results = [
      { "Description": "Your results", "Value": "123" }
    ];
    
    // Display in table
    window.showResults(results);
    
  } catch (error) {
    window.showError("Something went wrong: " + error.message);
  }
})();
```

## ✅ That's It!

Just make sure your script:
- Uses descriptive column names (they become table headers)
- Formats numbers nicely ($1,250.50)
- Returns array of objects to `window.showResults()`

The client portal handles everything else automatically!