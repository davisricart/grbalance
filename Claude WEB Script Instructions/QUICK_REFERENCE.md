# 🚀 QUICK REFERENCE CARD

## SCRIPT CHECKLIST ✅
- [ ] Wrapped in `(async () => { ... })()`
- [ ] Uses `window.parseFiles()` for data
- [ ] Includes try/catch error handling  
- [ ] Calls `window.showResults(arrayOfObjects)`
- [ ] Object keys are descriptive column names
- [ ] Currency formatted with $ symbols

## COMMON ISSUES & FIXES
❌ **"Cannot read property of undefined"** → Check data validation  
❌ **Empty table display** → Verify object key names  
❌ **Misaligned columns** → Ensure consistent object structure  
❌ **Numbers show as text** → Use parseFloat() or parseInt()  
❌ **Table shows [object Object]** → Check data format is array of objects

## PERFORMANCE LIMITS
- **Max file size**: 50MB per file
- **Max rows**: 10,000 recommended  
- **Processing time**: <30 seconds target
- **Memory usage**: Monitor console for warnings

## TEMPLATE VERSIONING
- **Current Version**: 1.0
- **Last Updated**: June 26, 2025  
- **Changes**: Initial release with Cursor AI enhancements

## 🎯 SUCCESS PATTERN
```javascript
(async () => {
  try {
    const { data1, data2 } = await window.parseFiles();
    
    const results = [
      { "Description": "Clear header", "Value": 123, "Status": "✅ Good" }
    ];
    
    window.showResults(results);
  } catch (error) {
    window.showError("Something went wrong: " + error.message);
  }
})();
```