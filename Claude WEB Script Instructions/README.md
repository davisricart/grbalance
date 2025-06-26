# 🤖 Claude Web Script Development Kit
## GR Balance Integration Guide

This folder contains everything Claude Web needs to build perfect scripts for the GR Balance platform.

## 🎯 QUICK START

1. **Read the Visual Guide** (`01_CLIENT_PORTAL_VISUAL_GUIDE.md`) - Understand the interface
2. **Learn the API** (`02_GR_BALANCE_API_REFERENCE.md`) - Master the available functions  
3. **Copy the Pattern** (`03_WORKING_SCRIPT_EXAMPLE.js`) - Use this as your template
4. **Check Data Formats** (`04_SAMPLE_DATA_FORMATS.md`) - Handle real-world data
5. **Test Everything** (`05_TESTING_INSTRUCTIONS.md`) - Ensure quality
6. **View the Mockup** (`06_CLIENT_PORTAL_MOCKUP.html`) - See the visual interface

## 🔧 CORE SCRIPT PATTERN

```javascript
(async () => {
  try {
    // 1. Get data from uploaded files
    const { data1, data2 } = await window.parseFiles();
    
    // 2. Find required columns (flexible matching)
    const column = window.findColumn(data1[0], ['Column Name', 'Alt Name']);
    
    // 3. Process your business logic
    const results = processData(data1, data2);
    
    // 4. Display results in table
    window.showResults(results);
    
  } catch (error) {
    window.showError(`Script error: ${error.message}`);
  }
})();
```

## ✅ SUCCESS REQUIREMENTS

### ✅ Script Must:
- Handle column name variations gracefully
- Process data robustly (skip invalid rows)
- Return array of objects for table display
- Use descriptive column names as headers
- Format numbers/currency professionally
- Provide helpful error messages
- Work identically in admin testing AND client portal

### ✅ Results Must:
- Display in clean, professional table
- Have clear, descriptive headers
- Show properly formatted data
- Be downloadable as Excel
- Match admin testing results exactly

## 🎨 UI INTEGRATION POINTS

### File Upload Areas
- **Primary Dataset**: Light green background when uploaded
- **Secondary Dataset**: Light blue background when uploaded
- Files converted to JavaScript objects automatically

### Results Display
- **Table Headers**: Light green background (#f0fdf4)
- **Table Borders**: 1px solid #666 between columns
- **Data Formatting**: Currency ($1,250.50), percentages (45.5%), etc.

### Error Handling
- **User-Friendly Messages**: No technical jargon
- **Console Logging**: For debugging (not user-visible)
- **Graceful Degradation**: Skip invalid data, continue processing

## 📊 EXPECTED OUTPUT FORMATS

### ✅ GOOD - Array of Objects
```javascript
[
  { "Card Brand": "Visa", "Count": 125, "Amount": "$15,750.50" },
  { "Card Brand": "Mastercard", "Count": 89, "Amount": "$11,200.25" }
]
```

### ❌ BAD - Array of Arrays  
```javascript
[
  ["Card Brand", "Count", "Amount"],
  ["Visa", 125, "$15,750.50"]
]
```

## 🔍 COLUMN DETECTION PATTERNS

Always use `window.findColumn()` for flexibility:

```javascript
// Credit card columns
window.findColumn(row, ['Card Brand', 'Card Type', 'Payment Method', 'card_brand'])

// Amount columns  
window.findColumn(row, ['Amount', 'Total', 'Transaction Amount', 'amount'])

// Date columns
window.findColumn(row, ['Date', 'Transaction Date', 'Created Date', 'date'])
```

## 🧪 TESTING WORKFLOW

1. **Admin Testing**: Script Testing tab → Upload files → Run script
2. **Client Testing**: Client portal → Same files → Run comparison  
3. **Verification**: Results must be IDENTICAL
4. **Excel Download**: Test download functionality works

## 🚨 CRITICAL SUCCESS FACTORS

1. **100% Consistency**: Admin and client portal must show identical results
2. **Error Resilience**: Handle missing data, wrong formats, empty files
3. **Professional Output**: Clean formatting, clear headers, logical sorting
4. **Performance**: Reasonable speed for large datasets (1000+ rows)
5. **User Experience**: Helpful error messages, no technical jargon

## 📁 FILE REFERENCE

| File | Purpose |
|------|---------|
| `01_CLIENT_PORTAL_VISUAL_GUIDE.md` | Visual layout and styling reference |
| `02_GR_BALANCE_API_REFERENCE.md` | Complete API documentation |
| `03_WORKING_SCRIPT_EXAMPLE.js` | Copy-paste template script |
| `04_SAMPLE_DATA_FORMATS.md` | Real-world data examples |
| `05_TESTING_INSTRUCTIONS.md` | Quality assurance process |
| `06_CLIENT_PORTAL_MOCKUP.html` | Visual interface mockup |

## 🎉 FINAL CHECKLIST

Before deploying any script:

- [ ] Tested in admin Script Testing tab
- [ ] Tested in client portal with same files
- [ ] Results are identical in both environments
- [ ] Table displays professional formatting
- [ ] Excel download works correctly
- [ ] Error handling provides helpful messages
- [ ] Console shows no unexpected errors
- [ ] Performance is acceptable for target data size

## 💡 PRO TIPS

1. **Always start with the working example** - modify rather than write from scratch
2. **Test with small datasets first** - easier to verify calculations
3. **Use descriptive variable names** - helps with debugging
4. **Add plenty of console.log()** - for development and debugging
5. **Handle edge cases gracefully** - empty files, missing columns, invalid data
6. **Format results for readability** - currency symbols, percentages, proper sorting

---

🎯 **Goal**: Build scripts that work perfectly the first time, every time, with zero differences between testing and production environments.