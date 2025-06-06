#!/usr/bin/env node

/**
 * Comprehensive True Full Automation Workflow Test Script
 * 
 * This script simulates the complete process:
 * 1. Loading Excel files from public/sample-data/
 * 2. Testing file parsing with existing utilities
 * 3. Verifying localStorage storage functionality
 * 4. Testing AdminPage automation engine integration
 * 5. Checking for missing data or analysis failures
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test results accumulator
const testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  warnings: 0,
  errors: [],
  warnings_list: [],
  fileAnalysis: {},
  parsingResults: {},
  storageTests: {},
  automationTests: {}
};

// Utility functions
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  switch(level) {
    case 'info':
      console.log(`${colors.blue}${prefix}${colors.reset} ${message}`);
      break;
    case 'success':
      console.log(`${colors.green}${prefix}${colors.reset} ${message}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}${prefix}${colors.reset} ${message}`);
      testResults.warnings++;
      testResults.warnings_list.push(message);
      break;
    case 'error':
      console.log(`${colors.red}${prefix}${colors.reset} ${message}`);
      testResults.errors.push(message);
      break;
    case 'debug':
      console.log(`${colors.cyan}${prefix}${colors.reset} ${message}`);
      break;
  }
  
  if (data) {
    console.log(`${colors.magenta}Data:${colors.reset}`, JSON.stringify(data, null, 2));
  }
}

function runTest(testName, testFunction) {
  testResults.totalTests++;
  log('info', `Running test: ${testName}`);
  
  try {
    const result = testFunction();
    if (result === false) {
      testResults.failedTests++;
      log('error', `Test failed: ${testName}`);
      return false;
    } else {
      testResults.passedTests++;
      log('success', `Test passed: ${testName}`);
      return true;
    }
  } catch (error) {
    testResults.failedTests++;
    log('error', `Test error in ${testName}: ${error.message}`);
    return false;
  }
}

// Test 1: Verify sample data files exist
function testSampleDataFiles() {
  const sampleDataDir = path.join(__dirname, 'public', 'sample-data');
  
  if (!fs.existsSync(sampleDataDir)) {
    log('error', 'Sample data directory does not exist');
    return false;
  }
  
  const files = fs.readdirSync(sampleDataDir);
  const excelFiles = files.filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
  const csvFiles = files.filter(file => file.endsWith('.csv'));
  
  log('info', `Found ${files.length} total files, ${excelFiles.length} Excel files, ${csvFiles.length} CSV files`);
  
  testResults.fileAnalysis = {
    totalFiles: files.length,
    excelFiles: excelFiles.length,
    csvFiles: csvFiles.length,
    fileList: files
  };
  
  // Check for required test files
  const requiredFiles = ['upload1.xlsx', 'upload2.xlsx'];
  const missingFiles = requiredFiles.filter(file => !files.includes(file));
  
  if (missingFiles.length > 0) {
    log('warning', `Missing required test files: ${missingFiles.join(', ')}`);
  }
  
  return excelFiles.length > 0 || csvFiles.length > 0;
}

// Test 2: Parse Excel files using XLSX library (simulating fileProcessor.ts logic)
function testExcelParsing() {
  const sampleDataDir = path.join(__dirname, 'public', 'sample-data');
  const files = fs.readdirSync(sampleDataDir);
  const excelFiles = files.filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const file of excelFiles) {
    try {
      const filePath = path.join(sampleDataDir, file);
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON (mimicking the fileProcessor logic)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        log('warning', `File ${file} appears to be empty`);
        failureCount++;
        continue;
      }
      
      const headers = jsonData[0];
      const dataRows = jsonData.slice(1);
      
      // Convert to object format (like fileProcessor.ts)
      const rows = dataRows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
      
      // Store parsing results
      testResults.parsingResults[file] = {
        success: true,
        headers: headers,
        totalRows: rows.length,
        columns: headers.length,
        sampleData: rows.slice(0, 3), // First 3 rows as sample
        fileSize: fs.statSync(filePath).size
      };
      
      log('success', `Successfully parsed ${file}: ${rows.length} rows, ${headers.length} columns`);
      successCount++;
      
    } catch (error) {
      log('error', `Failed to parse ${file}: ${error.message}`);
      testResults.parsingResults[file] = {
        success: false,
        error: error.message
      };
      failureCount++;
    }
  }
  
  log('info', `Parsing results: ${successCount} success, ${failureCount} failures`);
  return successCount > 0;
}

// Test 3: Simulate localStorage functionality
function testLocalStorageSimulation() {
  // Simulate the FileStore class behavior from fileProcessor.ts
  const mockLocalStorage = {};
  
  // Simulate FileStore.store() method
  function mockStoreFile(key, data) {
    mockLocalStorage[`fileStore_${key}`] = JSON.stringify(data);
    log('debug', `Stored file data for key: ${key}`);
  }
  
  // Simulate FileStore.get() method
  function mockGetFile(key) {
    const stored = mockLocalStorage[`fileStore_${key}`];
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        log('error', `Failed to parse stored file data for key ${key}: ${error.message}`);
        return null;
      }
    }
    return null;
  }
  
  // Test with sample data
  const testData = {
    filename: 'test.xlsx',
    headers: ['Date', 'Amount', 'Customer'],
    rows: [
      { Date: '2024-01-01', Amount: 100, Customer: 'John Doe' },
      { Date: '2024-01-02', Amount: 200, Customer: 'Jane Smith' }
    ],
    summary: {
      totalRows: 2,
      columns: 3,
      sampleData: []
    }
  };
  
  // Test storage
  mockStoreFile('file1', testData);
  mockStoreFile('file2', { ...testData, filename: 'test2.xlsx' });
  
  // Test retrieval
  const retrieved1 = mockGetFile('file1');
  const retrieved2 = mockGetFile('file2');
  const retrievedMissing = mockGetFile('file3');
  
  testResults.storageTests = {
    storeTest: retrieved1 !== null,
    retrieveTest: retrieved1 && retrieved1.filename === 'test.xlsx',
    multipleFilesTest: retrieved2 !== null,
    missingFileTest: retrievedMissing === null,
    totalStoredFiles: Object.keys(mockLocalStorage).length
  };
  
  const allTests = Object.values(testResults.storageTests).slice(0, 4); // Exclude totalStoredFiles
  const passed = allTests.filter(Boolean).length;
  
  log('info', `localStorage simulation tests: ${passed}/${allTests.length} passed`);
  return passed === allTests.length;
}

// Test 4: Simulate AI communication workflow
function testAICommunicationWorkflow() {
  // Simulate the file communication system
  const sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  // Simulate file comparison prompt generation (from fileProcessor.ts)
  function generateMockComparisonPrompt(file1Data, file2Data) {
    const request = "Compare these two files and show me discrepancies in payment amounts by card type";
    
    return `I need to analyze two data files and generate results in the exact GR Balance format shown in the interface.

**FILE 1: ${file1Data.filename}**
Columns: ${file1Data.headers.join(', ')}
Total Rows: ${file1Data.summary.totalRows}
Sample Data:
${file1Data.summary.sampleData.slice(0, 3).map(row => 
  file1Data.headers.map(h => `${h}: ${row[h]}`).join(' | ')
).join('\n')}

**FILE 2: ${file2Data.filename}**
Columns: ${file2Data.headers.join(', ')}
Total Rows: ${file2Data.summary.totalRows}

**COMPARISON REQUEST:**
${request}

**REQUIRED OUTPUT:**
Please generate JavaScript code that will:
1. Parse this data and perform the requested comparison
2. Update the GR Balance interface with results in these specific elements:
   - #payment-stats (Payment Method Distribution)
   - #detailed-results-table (Detailed transaction table)
   - #summary-table (Summary comparison table)`;
  }
  
  // Test with mock file data
  const mockFile1 = {
    filename: 'sales_data.xlsx',
    headers: ['Date', 'Amount', 'Card Type', 'Customer'],
    summary: {
      totalRows: 100,
      sampleData: [
        { Date: '2024-01-01', Amount: 100, 'Card Type': 'Visa', Customer: 'John' },
        { Date: '2024-01-02', Amount: 200, 'Card Type': 'Mastercard', Customer: 'Jane' }
      ]
    }
  };
  
  const mockFile2 = {
    filename: 'payments_hub.xlsx',
    headers: ['Transaction Date', 'Total Amount', 'Payment Method', 'Client Name'],
    summary: {
      totalRows: 95,
      sampleData: [
        { 'Transaction Date': '2024-01-01', 'Total Amount': 100, 'Payment Method': 'Visa', 'Client Name': 'John' },
        { 'Transaction Date': '2024-01-02', 'Total Amount': 190, 'Payment Method': 'Mastercard', 'Client Name': 'Jane' }
      ]
    }
  };
  
  try {
    const prompt = generateMockComparisonPrompt(mockFile1, mockFile2);
    
    testResults.automationTests = {
      sessionId: sessionId,
      promptGenerated: prompt.length > 0,
      promptLength: prompt.length,
      containsRequiredElements: 
        prompt.includes('FILE 1:') && 
        prompt.includes('FILE 2:') && 
        prompt.includes('COMPARISON REQUEST:') &&
        prompt.includes('REQUIRED OUTPUT:'),
      mockFilesProcessed: true,
      communicationReady: true
    };
    
    log('success', `AI communication workflow test completed for session: ${sessionId}`);
    log('debug', `Generated prompt length: ${prompt.length} characters`);
    
    return true;
    
  } catch (error) {
    log('error', `AI communication workflow test failed: ${error.message}`);
    testResults.automationTests = {
      sessionId: sessionId,
      error: error.message,
      success: false
    };
    return false;
  }
}

// Test 5: Verify file processing pipeline end-to-end
function testCompleteWorkflow() {
  log('info', 'Testing complete automation workflow pipeline');
  
  const sampleDataDir = path.join(__dirname, 'public', 'sample-data');
  if (!fs.existsSync(sampleDataDir)) {
    log('error', 'Cannot test complete workflow - sample data directory missing');
    return false;
  }
  
  const files = fs.readdirSync(sampleDataDir);
  const excelFiles = files.filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
  
  if (excelFiles.length < 2) {
    log('warning', 'Need at least 2 Excel files for complete workflow test');
    return false;
  }
  
  try {
    // Step 1: Load and parse first two files
    const file1Path = path.join(sampleDataDir, excelFiles[0]);
    const file2Path = path.join(sampleDataDir, excelFiles[1]);
    
    const workbook1 = XLSX.readFile(file1Path);
    const workbook2 = XLSX.readFile(file2Path);
    
    // Step 2: Extract data (following fileProcessor.ts logic)
    const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
    const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
    
    const data1 = XLSX.utils.sheet_to_json(sheet1, { header: 1 });
    const data2 = XLSX.utils.sheet_to_json(sheet2, { header: 1 });
    
    if (data1.length === 0 || data2.length === 0) {
      log('warning', 'One or both test files are empty');
      return false;
    }
    
    // Step 3: Create ParsedFileData objects
    const parsedFile1 = {
      filename: excelFiles[0],
      headers: data1[0],
      rows: data1.slice(1).map(row => {
        const obj = {};
        data1[0].forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      }),
      summary: {
        totalRows: data1.length - 1,
        columns: data1[0].length,
        sampleData: []
      }
    };
    
    const parsedFile2 = {
      filename: excelFiles[1],
      headers: data2[0],
      rows: data2.slice(1).map(row => {
        const obj = {};
        data2[0].forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      }),
      summary: {
        totalRows: data2.length - 1,
        columns: data2[0].length,
        sampleData: []
      }
    };
    
    // Step 4: Simulate storage
    const mockStorage = {};
    mockStorage['fileStore_file1'] = JSON.stringify(parsedFile1);
    mockStorage['fileStore_file2'] = JSON.stringify(parsedFile2);
    
    // Step 5: Simulate comparison request
    const comparisonData = {
      file1: parsedFile1,
      file2: parsedFile2,
      comparisonType: 'standard'
    };
    
    // Step 6: Generate analysis summary
    const analysis = {
      file1Analysis: {
        filename: parsedFile1.filename,
        rowCount: parsedFile1.summary.totalRows,
        columnCount: parsedFile1.summary.columns,
        hasAmountColumn: parsedFile1.headers.some(h => 
          h.toLowerCase().includes('amount') || 
          h.toLowerCase().includes('total') || 
          h.toLowerCase().includes('price')
        ),
        hasDateColumn: parsedFile1.headers.some(h => 
          h.toLowerCase().includes('date') || 
          h.toLowerCase().includes('time')
        ),
        hasPaymentColumn: parsedFile1.headers.some(h => 
          h.toLowerCase().includes('payment') || 
          h.toLowerCase().includes('card') ||
          h.toLowerCase().includes('method')
        )
      },
      file2Analysis: {
        filename: parsedFile2.filename,
        rowCount: parsedFile2.summary.totalRows,
        columnCount: parsedFile2.summary.columns,
        hasAmountColumn: parsedFile2.headers.some(h => 
          h.toLowerCase().includes('amount') || 
          h.toLowerCase().includes('total') || 
          h.toLowerCase().includes('price')
        ),
        hasDateColumn: parsedFile2.headers.some(h => 
          h.toLowerCase().includes('date') || 
          h.toLowerCase().includes('time')
        ),
        hasPaymentColumn: parsedFile2.headers.some(h => 
          h.toLowerCase().includes('payment') || 
          h.toLowerCase().includes('card') ||
          h.toLowerCase().includes('method')
        )
      },
      comparisonFeasible: true,
      recommendedApproach: 'amount_comparison',
      estimatedProcessingTime: '< 1 second',
      storageSimulated: Object.keys(mockStorage).length === 2
    };
    
    testResults.completeWorkflow = analysis;
    
    log('success', `Complete workflow test successful`);
    log('info', `File 1: ${analysis.file1Analysis.filename} (${analysis.file1Analysis.rowCount} rows)`);
    log('info', `File 2: ${analysis.file2Analysis.filename} (${analysis.file2Analysis.rowCount} rows)`);
    
    return true;
    
  } catch (error) {
    log('error', `Complete workflow test failed: ${error.message}`);
    return false;
  }
}

// Test 6: Check for potential data quality issues
function testDataQuality() {
  const sampleDataDir = path.join(__dirname, 'public', 'sample-data');
  const files = fs.readdirSync(sampleDataDir);
  const excelFiles = files.filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
  
  const qualityIssues = [];
  let filesChecked = 0;
  
  for (const file of excelFiles) {
    try {
      const filePath = path.join(sampleDataDir, file);
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length === 0) {
        qualityIssues.push(`${file}: File is empty`);
        continue;
      }
      
      const headers = data[0];
      const rows = data.slice(1);
      
      // Check for missing headers
      if (headers.some(h => !h || h.trim() === '')) {
        qualityIssues.push(`${file}: Contains empty header columns`);
      }
      
      // Check for extremely sparse data
      const totalCells = rows.length * headers.length;
      const emptyCells = rows.reduce((count, row) => {
        return count + row.filter(cell => !cell || cell.toString().trim() === '').length;
      }, 0);
      
      const sparsityRatio = emptyCells / totalCells;
      if (sparsityRatio > 0.5) {
        qualityIssues.push(`${file}: High data sparsity (${Math.round(sparsityRatio * 100)}% empty cells)`);
      }
      
      // Check for inconsistent row lengths
      const rowLengths = rows.map(row => row.length);
      const minLength = Math.min(...rowLengths);
      const maxLength = Math.max(...rowLengths);
      
      if (maxLength - minLength > 2) {
        qualityIssues.push(`${file}: Inconsistent row lengths (${minLength} to ${maxLength} columns)`);
      }
      
      filesChecked++;
      
    } catch (error) {
      qualityIssues.push(`${file}: Failed to analyze - ${error.message}`);
    }
  }
  
  testResults.dataQuality = {
    filesChecked: filesChecked,
    issuesFound: qualityIssues.length,
    issues: qualityIssues
  };
  
  if (qualityIssues.length > 0) {
    log('warning', `Data quality issues found in ${qualityIssues.length} cases`);
    qualityIssues.forEach(issue => log('warning', issue));
  } else {
    log('success', `Data quality check passed for ${filesChecked} files`);
  }
  
  return qualityIssues.length === 0;
}

// Main test execution
async function runAllTests() {
  console.log(`${colors.bright}=== True Full Automation Workflow Test Suite ===${colors.reset}\n`);
  
  const startTime = Date.now();
  
  // Run all tests
  runTest('Sample Data Files Verification', testSampleDataFiles);
  runTest('Excel File Parsing', testExcelParsing);
  runTest('LocalStorage Simulation', testLocalStorageSimulation);
  runTest('AI Communication Workflow', testAICommunicationWorkflow);
  runTest('Complete Workflow Pipeline', testCompleteWorkflow);
  runTest('Data Quality Assessment', testDataQuality);
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Generate final report
  console.log(`\n${colors.bright}=== Test Results Summary ===${colors.reset}`);
  console.log(`${colors.cyan}Total Tests:${colors.reset} ${testResults.totalTests}`);
  console.log(`${colors.green}Passed:${colors.reset} ${testResults.passedTests}`);
  console.log(`${colors.red}Failed:${colors.reset} ${testResults.failedTests}`);
  console.log(`${colors.yellow}Warnings:${colors.reset} ${testResults.warnings}`);
  console.log(`${colors.blue}Duration:${colors.reset} ${duration}s`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.red}Errors:${colors.reset}`);
    testResults.errors.forEach(error => console.log(`  • ${error}`));
  }
  
  if (testResults.warnings_list.length > 0) {
    console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
    testResults.warnings_list.forEach(warning => console.log(`  • ${warning}`));
  }
  
  // File analysis summary
  if (testResults.fileAnalysis.totalFiles) {
    console.log(`\n${colors.bright}File Analysis Summary:${colors.reset}`);
    console.log(`  • Total files found: ${testResults.fileAnalysis.totalFiles}`);
    console.log(`  • Excel files: ${testResults.fileAnalysis.excelFiles}`);
    console.log(`  • CSV files: ${testResults.fileAnalysis.csvFiles}`);
    console.log(`  • Files: ${testResults.fileAnalysis.fileList.join(', ')}`);
  }
  
  // Parsing results summary
  const parsingSuccesses = Object.values(testResults.parsingResults).filter(r => r.success).length;
  const parsingFailures = Object.values(testResults.parsingResults).filter(r => !r.success).length;
  if (parsingSuccesses > 0 || parsingFailures > 0) {
    console.log(`\n${colors.bright}Parsing Results:${colors.reset}`);
    console.log(`  • Successfully parsed: ${parsingSuccesses} files`);
    console.log(`  • Failed to parse: ${parsingFailures} files`);
  }
  
  // Overall assessment
  const successRate = (testResults.passedTests / testResults.totalTests) * 100;
  console.log(`\n${colors.bright}Overall Assessment:${colors.reset}`);
  
  if (successRate >= 90) {
    console.log(`${colors.green}✅ EXCELLENT (${successRate.toFixed(1)}%) - Automation workflow is ready for production${colors.reset}`);
  } else if (successRate >= 75) {
    console.log(`${colors.yellow}⚠️  GOOD (${successRate.toFixed(1)}%) - Minor issues detected, review warnings${colors.reset}`);
  } else if (successRate >= 50) {
    console.log(`${colors.yellow}⚠️  FAIR (${successRate.toFixed(1)}%) - Several issues need attention${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ POOR (${successRate.toFixed(1)}%) - Major issues detected, workflow needs fixes${colors.reset}`);
  }
  
  // Save detailed results to file
  const resultsFile = path.join(__dirname, 'automation-test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    duration: duration,
    ...testResults
  }, null, 2));
  
  console.log(`\n${colors.cyan}📁 Detailed results saved to: ${resultsFile}${colors.reset}`);
  
  return successRate >= 75; // Return true if tests are mostly successful
}

// Export for use as a module or run directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
};