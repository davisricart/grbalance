# GR Balance Development Rules & Assembly Line Workflow

## 🏭 **ASSEMBLY LINE WORKFLOW - DEFINITIVE PROCESS**

### **STARTING POINT: Claude Web**
```
User Request → Claude Web → Script Generation → Admin Testing → Client Portal Deployment
```

### **STEP 1: Claude Web Script Generation**
- **Input**: User provides files and step-by-step instructions
- **Output**: Complete script following GR Balance template
- **Requirements**: Must follow project knowledge section exactly

### **STEP 2: Admin Script Testing**
- **Location**: `localhost:[PORT]/admin` Script Testing section
- **Purpose**: Test script with exact same APIs as client portal
- **Environment**: React/TypeScript with GR Balance system APIs

### **STEP 3: Client Portal Deployment**
- **Location**: `grbalance.netlify.app/test` (or client-specific paths)
- **Environment**: Simulated GR Balance APIs via execute-script function
- **Result**: Identical results to admin testing

## 📋 **MANDATORY SCRIPT TEMPLATE - NO EXCEPTIONS**

### **✅ REQUIRED FORMAT (CONFIRMED WORKING):**
```javascript
// Script Name: [User Specified Name]
// Generated for GR Balance File Comparison System
// Date: [Current Date]

(async function() {
  try {
    console.log('🚀 Starting [Script Name]...');
    
    // STEP 1: GET DATA USING GR BALANCE APIS
    const files = await window.parseFiles();
    if (!files?.data1?.length) {
      window.showError('File 1 required');
      return;
    }
    
    const data1 = files.data1;
    const data2 = files.data2; // Optional
    
    // STEP 2: ANALYZE DATA STRUCTURE (REQUIRED)
    console.log('📊 Data analysis:', {
      file1Columns: Object.keys(data1[0] || {}),
      file1Sample: data1[0],
      file1Rows: data1.length,
      file2Columns: data2 ? Object.keys(data2[0] || {}) : 'N/A',
      file2Rows: data2 ? data2.length : 'N/A'
    });
    
    // STEP 3: FIND REQUIRED COLUMNS
    const column1 = window.findColumn(data1[0], ['Column Name', 'alt_name', 'ALT_NAME']);
    if (!column1) {
      window.showError(`Required column not found. Available: ${Object.keys(data1[0]).join(', ')}`);
      return;
    }
    
    // STEP 4: PROCESS DATA WITH EXCEL DATE HANDLING (IF NEEDED)
    const processedData = data1.map(row => {
      // EXCEL DATE HANDLING (REQUIRED FOR DATE COLUMNS)
      let dateValue = row[dateColumn];
      if (dateValue && typeof dateValue === 'number' && dateValue > 40000) {
        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(excelEpoch.getTime() + Math.floor(dateValue) * 24 * 60 * 60 * 1000);
        dateValue = jsDate.toISOString().split('T')[0];
      }
      
      // Your processing logic here...
      return processedRow;
    });
    
    // STEP 5: DISPLAY RESULTS
    window.showResults(processedData, {
      title: 'Descriptive Title',
      summary: 'Processing summary with key metrics'
    });
    
    // STEP 6: ADD PREVIEW TABLES (IF NEEDED) - ALWAYS 5 RECORDS
    if (additionalData?.length > 0) {
      const previewData = additionalData.slice(0, 5);
      const tableHtml = \`
        <div class="p-4">
          <h3 class="text-lg font-medium mb-4">Preview Table</h3>
          <table class="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead class="bg-gray-50">
              <tr>
                \${Object.keys(previewData[0]).map(header => 
                  \`<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">\${header}</th>\`
                ).join('')}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              \${previewData.map(row => \`
                <tr class="hover:bg-gray-50">
                  \${Object.keys(row).map(key => 
                    \`<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">\${row[key] || ''}</td>\`
                  ).join('')}
                </tr>
              \`).join('')}
            </tbody>
          </table>
          <div class="mt-4 text-sm text-gray-500">
            Showing first 5 of \${additionalData.length} total records
          </div>
        </div>
      \`;
      window.addAdditionalTable(tableHtml, 'preview-table');
    }
    
    console.log('✅ Script completed successfully!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
    window.showError(\`Analysis failed: \${error.message}\`);
  }
})();
```

## 🚨 **CRITICAL REQUIREMENTS - NO EXCEPTIONS**

### **1. SCRIPT WRAPPER**
- ✅ **MUST USE**: `(async function() { ... })()`
- ❌ **NEVER USE**: Direct execution, arrow functions, named functions

### **2. GR BALANCE APIS (MANDATORY)**
- ✅ `window.parseFiles()` - Get data in object format
- ✅ `window.showResults(data, options)` - Display main results
- ✅ `window.showError(message)` - Handle errors
- ✅ `window.findColumn(row, names)` - Smart column matching
- ✅ `window.addAdditionalTable(html, id)` - Add extra tables

### **3. EXCEL DATE HANDLING (REQUIRED FOR DATE PROCESSING)**
```javascript
// Handle Excel serial numbers (REQUIRED pattern)
function processDateValue(dateValue) {
  if (!dateValue || dateValue === '') return null;
  
  // Handle Excel serial numbers (numeric values > 40000)
  if (typeof dateValue === 'number' && dateValue > 40000) {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + Math.floor(dateValue) * 24 * 60 * 60 * 1000);
    return jsDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  }
  
  // Handle string dates - trim at first space if present
  let dateStr = String(dateValue);
  const firstSpaceIndex = dateStr.indexOf(' ');
  if (firstSpaceIndex !== -1) {
    dateStr = dateStr.substring(0, firstSpaceIndex);
  }
  
  return dateStr;
}
```

### **4. PREVIEW TABLE STANDARD**
- ✅ **ALWAYS 5 RECORDS** for all preview/sample tables
- ✅ Use `data.slice(0, 5)` or equivalent
- ✅ Include "Showing first 5 of X total records" message

### **5. TABLE FORMATTING (STANDARD)**
```html
<table class="min-w-full divide-y divide-gray-200 border border-gray-300">
  <thead class="bg-gray-50">
    <tr>
      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Header</th>
    </tr>
  </thead>
  <tbody class="bg-white divide-y divide-gray-200">
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">Data</td>
    </tr>
  </tbody>
</table>
```

## 🎯 **DEVELOPMENT PHILOSOPHY**

### **Claude Adapts to GR Balance - NOT Vice Versa**
- ✅ Use established GR Balance APIs
- ✅ Follow proven script template
- ✅ Maintain consistent formatting
- ❌ Don't invent new APIs
- ❌ Don't suggest system changes
- ❌ Don't deviate from template

### **System Architecture (FIXED)**
- **Admin Testing**: React/TypeScript environment with native GR Balance APIs
- **Client Portal**: Simulated GR Balance environment via execute-script function
- **Both environments**: Identical APIs, identical results

## 📝 **CLAUDE WEB INSTRUCTION TEMPLATE**

### **For New Claude Sessions:**
```
"Follow the GR Balance Development Rules. The system uses this EXACT script format:

(async function() {
  try {
    const files = await window.parseFiles();
    // Process using window.findColumn(), handle Excel dates if needed
    window.showResults(results, {title: 'Title', summary: 'Summary'});
  } catch (error) {
    window.showError(\`Error: \${error.message}\`);
  }
})();

REQUIREMENTS:
- MUST use (async function(){})() wrapper
- MUST use window.parseFiles(), window.showResults(), window.showError()
- MUST include Excel date handling for date columns
- MUST use 5 records for all preview tables
- MUST analyze data structure before processing
- MUST include comprehensive error handling

NO EXCEPTIONS - this is the only format that works."
```

## 🔧 **SYSTEM COMPONENTS**

### **Admin Environment (Primary Testing)**
- **Location**: `src/pages/AdminPage.tsx`
- **URL**: `localhost:[PORT]/admin` Script Testing section
- **APIs**: Native React implementation
- **Purpose**: Primary testing environment

### **Client Portal Environment (Production)**
- **Location**: `netlify/functions/execute-script.js`
- **URLs**: `grbalance.netlify.app/test`, client-specific paths
- **APIs**: Simulated via Function constructor
- **Purpose**: Live client execution

### **Both Environments Provide:**
```javascript
window.parseFiles()         // File data access
window.showResults()        // Result display
window.showError()          // Error handling
window.findColumn()         // Column matching
window.addAdditionalTable() // Additional tables
```

## 📊 **DATA PROCESSING STANDARDS**

### **File Structure**
- **File 1**: Always required, primary data source
- **File 2**: Optional, comparison/lookup data
- **Formats**: Excel (.xlsx/.xls), CSV (.csv)
- **Headers**: Always expected in first row

### **Data Conversion**
- **Input**: Array of arrays (raw file data)
- **Output**: Array of objects (GR Balance format)
- **Conversion**: Handled by `window.parseFiles()`

### **Column Detection**
- **Method**: `window.findColumn(row, ['Name1', 'name_2', 'NAME3'])`
- **Matching**: Case-insensitive, partial matching
- **Fallback**: Clear error message with available columns

## 🚨 **FORBIDDEN PATTERNS**

### **❌ NEVER USE:**
- Direct DOM manipulation (`document.querySelector`)
- Alternative async patterns
- Arrow functions in main structure
- Modern ES6+ that triggers CSP
- Custom preview counts (not 5)
- Ignoring Excel date serial numbers
- Custom table styling (use standard format)

### **❌ NEVER SUGGEST:**
- System architecture changes
- New API creation
- Alternative execution methods
- Different script templates

## ✅ **SUCCESS CRITERIA**

### **A Perfect Script Should:**
1. **Upload to admin** and execute immediately without modification
2. **Show identical results** in both admin and client portal
3. **Handle all edge cases** (missing columns, Excel dates, empty data)
4. **Use exactly 5 records** for all preview tables
5. **Include comprehensive logging** for debugging
6. **Follow GR Balance APIs** exclusively

### **Testing Checklist:**
- [ ] Script uses `(async function(){})()` wrapper
- [ ] Uses `window.parseFiles()` for data access
- [ ] Uses `window.showResults()` for display
- [ ] Includes Excel date handling if processing dates
- [ ] Preview tables show exactly 5 records
- [ ] Error handling with `window.showError()`
- [ ] Console logging for debugging
- [ ] Works in admin Script Testing
- [ ] Produces identical results in client portal

## 🎯 **FINAL INSTRUCTION FOR ALL CLAUDE SESSIONS**

```
"You are working within the established GR Balance File Comparison System. 

MANDATORY REQUIREMENTS:
✅ Use EXACT script template with (async function(){})() wrapper
✅ Use window.parseFiles(), window.showResults(), window.showError() APIs
✅ Include Excel date handling for date processing
✅ Use exactly 5 records for all preview tables
✅ Analyze data structure before generating scripts
✅ Follow GR Balance table formatting standards

FORBIDDEN ACTIONS:
❌ Create new APIs or suggest system changes
❌ Deviate from proven script template
❌ Use alternative async patterns
❌ Ignore Excel date serial numbers
❌ Use arbitrary preview counts

SUCCESS METRIC: Script works immediately in admin testing and produces identical results in client portal with zero modifications needed."
```

## 📅 **VERSION CONTROL**

- **Created**: [Current Date]
- **Status**: DEFINITIVE - No changes without system-wide testing
- **Purpose**: Single source of truth for all GR Balance development
- **Scope**: Applies to all future Claude sessions and script development

---

**This document represents the complete, consolidated rules for GR Balance development. All future development must follow these standards without exception.** 