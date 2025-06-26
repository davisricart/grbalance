# Testing Instructions for GR Balance Scripts

## 🧪 TESTING WORKFLOW

### 1. Initial Script Testing (Admin Script Testing Tab)
```
1. Go to Admin panel → Script Testing tab
2. Upload your test files (Excel format)
3. Paste your script in the code editor
4. Click "Run Test Script" 
5. Verify results appear correctly in table
6. Check console for any errors or warnings
```

### 2. Client Portal Testing (Live Environment)
```
1. Go to client portal (logged in as approved user)
2. Upload the SAME test files used in admin testing
3. Click "Run Comparison"
4. Verify results are IDENTICAL to admin testing
5. Test Excel download functionality
```

## ✅ SUCCESS CRITERIA CHECKLIST

### Script Execution
- [ ] Script runs without errors
- [ ] No console error messages
- [ ] Handles missing/invalid data gracefully
- [ ] Provides helpful error messages to user

### Data Processing  
- [ ] Correctly identifies required columns
- [ ] Handles column name variations
- [ ] Processes all valid rows
- [ ] Skips invalid rows with warnings
- [ ] Produces accurate calculations

### Results Display
- [ ] Table appears with clear headers
- [ ] Data is properly formatted (currency, percentages, etc.)
- [ ] Results are sorted logically
- [ ] Table is visually professional
- [ ] All columns are readable

### Cross-Platform Consistency
- [ ] Admin Script Testing results match Client Portal results EXACTLY
- [ ] Excel download works correctly
- [ ] File upload accepts expected formats
- [ ] Performance is acceptable for large files

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: "Could not find column X"
```javascript
// Problem: Column name doesn't match expectations
// Solution: Add more column name variations
const columnName = window.findColumn(data[0], [
  'Expected Name',
  'Alternative Name', 
  'another_format',
  'CAPS_VERSION'
]);
```

### Issue: Results show "undefined" or "NaN"
```javascript
// Problem: Data parsing/formatting issue
// Solution: Add robust data cleaning
function cleanValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  return value.toString().trim();
}
```

### Issue: Script works in admin but fails in client portal
```javascript
// Problem: Different execution environment
// Solution: Use exact same API calls and error handling
// Always test both environments with same data
```

### Issue: Table headers show as "0", "1", "2"
```javascript
// Problem: Returning array of arrays instead of array of objects
// ❌ Wrong format:
const results = [
  ['Header1', 'Header2', 'Header3'],
  ['Value1', 'Value2', 'Value3']
];

// ✅ Correct format:
const results = [
  { 'Header1': 'Value1', 'Header2': 'Value2', 'Header3': 'Value3' }
];
```

## 📊 TESTING DATA RECOMMENDATIONS

### Small Test Dataset (10-20 rows)
- Quick testing and debugging
- Easy to verify calculations manually
- Good for initial development

### Medium Test Dataset (100-500 rows)  
- Performance testing
- Edge case discovery
- Realistic data volume

### Large Test Dataset (1000+ rows)
- Stress testing
- Real-world performance
- Memory usage validation

### Edge Case Test Data
- Empty files
- Files with missing headers
- Files with all the same values
- Files with special characters
- Files with mixed data types

## 🔍 DEBUGGING TIPS

### Use Console Logging
```javascript
console.log('📊 Data loaded:', data1.length, 'rows');
console.log('🔍 Found column:', columnName);
console.log('✅ Processing complete:', results.length, 'results');
```

### Validate Data at Each Step
```javascript
// Check data structure
console.log('Sample row:', data1[0]);

// Check column detection
console.log('Available columns:', Object.keys(data1[0]));

// Check processing results
console.log('Sample result:', results[0]);
```

### Test Error Handling
```javascript
// Intentionally trigger errors to test handling:
// - Upload wrong file format
// - Upload empty file  
// - Remove required columns
// - Add malformed data
```

## 🚀 DEPLOYMENT READINESS

Before deploying a script to production:

1. ✅ **Test with multiple file formats** (different column names, data types)
2. ✅ **Test error scenarios** (missing files, invalid data)
3. ✅ **Verify admin/client consistency** (same results everywhere)
4. ✅ **Check performance** (reasonable execution time)
5. ✅ **Validate output format** (clean, professional table)
6. ✅ **Test Excel download** (correct headers and data)
7. ✅ **Review console logs** (no unexpected errors)
8. ✅ **User acceptance** (client can understand results)

## 📞 ESCALATION PATH

If testing reveals issues:

1. **Script Errors**: Fix code logic and retry
2. **Data Format Issues**: Update column detection patterns  
3. **Performance Issues**: Optimize processing or add progress indicators
4. **UI Display Issues**: Check results format and headers
5. **Consistency Issues**: Verify both environments use same execution path

Remember: The goal is ZERO differences between admin testing and client portal results!