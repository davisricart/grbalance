// Pattern Learning Enhancements for AdminPage.tsx
// ADD THESE FUNCTIONS TO YOUR ADMINPAGE.TSX - NO UI CHANGES NEEDED

// Silent pattern collection - learns from script usage
const collectScriptPattern = (scriptContent, files, executionSuccess, errorMessage = null) => {
  try {
    const pattern = {
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      
      // Data structure analysis
      file1Columns: files?.data1 ? Object.keys(files.data1[0] || {}) : [],
      file1Rows: files?.data1 ? files.data1.length : 0,
      file2Columns: files?.data2 ? Object.keys(files.data2[0] || {}) : [],
      file2Rows: files?.data2 ? files.data2.length : 0,
      
      // Script analysis
      scriptType: detectScriptType(scriptContent),
      hasExcelDateHandling: /excel|serial|40000|1899/i.test(scriptContent),
      uses5RecordPreview: /Math\.min\(5,/i.test(scriptContent),
      usesProperWrapper: /\(async function\(\)/.test(scriptContent),
      
      // Execution results
      success: executionSuccess,
      errorType: errorMessage ? categorizeError(errorMessage) : null,
      
      // Data type detection
      hasDateColumns: detectDateColumns(files?.data1),
      hasAmountColumns: detectAmountColumns(files?.data1),
      hasExcelSerialNumbers: detectExcelSerialNumbers(files?.data1)
    };
    
    // Store in localStorage (no server needed)
    const stored = JSON.parse(localStorage.getItem('script_patterns') || '[]');
    stored.push(pattern);
    
    // Keep last 100 patterns to avoid storage bloat
    const trimmed = stored.slice(-100);
    localStorage.setItem('script_patterns', JSON.stringify(trimmed));
    
    console.log('📊 Pattern collected silently:', pattern.scriptType);
  } catch (error) {
    // Silent failure - don't interrupt user workflow
    console.log('Pattern collection failed silently:', error.message);
  }
};

// Helper functions for pattern analysis
const detectScriptType = (scriptContent) => {
  if (/extract.*date|date.*extract/i.test(scriptContent)) return 'date_extraction';
  if (/duplicate|unique|dedup/i.test(scriptContent)) return 'deduplication';
  if (/match|compare|reconcil/i.test(scriptContent)) return 'reconciliation';
  if (/count|sum|total/i.test(scriptContent)) return 'aggregation';
  if (/filter|search|find/i.test(scriptContent)) return 'filtering';
  return 'custom';
};

const categorizeError = (errorMessage) => {
  if (/invalid date/i.test(errorMessage)) return 'excel_date_issue';
  if (/column.*not.*found/i.test(errorMessage)) return 'column_missing';
  if (/undefined|null/i.test(errorMessage)) return 'data_access';
  if (/syntax|unexpected/i.test(errorMessage)) return 'script_syntax';
  return 'other';
};

const detectDateColumns = (data) => {
  if (!data || !data[0]) return [];
  return Object.keys(data[0]).filter(col => 
    /date|time|day|created|updated/i.test(col)
  );
};

const detectAmountColumns = (data) => {
  if (!data || !data[0]) return [];
  return Object.keys(data[0]).filter(col => 
    /amount|total|sum|price|cost|fee|value|currency/i.test(col)
  );
};

const detectExcelSerialNumbers = (data) => {
  if (!data || !data[0]) return false;
  
  // Check first 5 rows for numeric values that look like Excel dates
  const sample = data.slice(0, 5);
  for (const row of sample) {
    for (const value of Object.values(row)) {
      if (typeof value === 'number' && value > 40000 && value < 60000) {
        return true; // Likely Excel serial number range
      }
    }
  }
  return false;
};

// ADD TO EXISTING FUNCTIONS IN ADMINPAGE.TSX:

// Enhance existing runTestScript function
const enhancedRunTestScript = async () => {
  const originalFunction = runTestScript; // Keep reference to original
  
  try {
    const files = await window.parseFiles();
    const scriptContent = scriptInputMethod === 'paste' ? testScriptText : testScript;
    
    // Run original function
    const result = await originalFunction();
    
    // Collect pattern on success
    collectScriptPattern(scriptContent, files, true);
    
    return result;
  } catch (error) {
    // Collect pattern on failure
    const files = await window.parseFiles().catch(() => null);
    const scriptContent = scriptInputMethod === 'paste' ? testScriptText : testScript;
    collectScriptPattern(scriptContent, files, false, error.message);
    
    throw error; // Re-throw to maintain original behavior
  }
};

// INSTALLATION INSTRUCTIONS:
// 1. Add these functions to your AdminPage.tsx (anywhere in the component)
// 2. Replace your existing runTestScript call with enhancedRunTestScript
// 3. No UI changes needed - learning happens silently
// 4. Check browser console for "📊 Pattern collected silently:" messages

// USAGE CHECK:
// After running a few scripts, check browser console:
// console.log(JSON.parse(localStorage.getItem('script_patterns'))); 