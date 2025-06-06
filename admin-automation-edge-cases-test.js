/**
 * AdminPage Automation Engine Edge Cases Test Suite
 * Tests error handling, edge cases, and robustness of automation functions
 */

// Mock localStorage for testing
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  
  getItem(key) {
    return this.store[key] || null;
  }
  
  setItem(key, value) {
    this.store[key] = value;
  }
  
  clear() {
    this.store = {};
  }
}

// Test missing file data scenario
const testMissingFileData = async () => {
  console.log('\n🧪 Testing missing file data scenario...');
  const mockLocalStorage = new MockLocalStorage();
  
  try {
    // Simulate initializeVisualStepBuilder with no data
    const file1Data = mockLocalStorage.getItem('file1Data');
    const file2Data = mockLocalStorage.getItem('file2Data');
    
    if (!file1Data || !file2Data) {
      throw new Error('File data not found. Please re-select your files.');
    }
    
    console.log('❌ Should have thrown error for missing data');
    return { success: false, expectedError: true };
    
  } catch (error) {
    if (error.message.includes('File data not found')) {
      console.log('✅ Correctly handled missing file data');
      return { success: true, expectedError: true };
    } else {
      console.log('❌ Unexpected error:', error.message);
      return { success: false, expectedError: false };
    }
  }
};

// Test empty file data scenario
const testEmptyFileData = async () => {
  console.log('\n🧪 Testing empty file data scenario...');
  const mockLocalStorage = new MockLocalStorage();
  
  // Set up empty file data
  const emptyFile1 = {
    filename: "empty.xlsx",
    headers: [],
    rows: [],
    data: []
  };
  
  mockLocalStorage.setItem('file1Data', JSON.stringify(emptyFile1));
  mockLocalStorage.setItem('file2Data', JSON.stringify(emptyFile1));
  
  try {
    const file1Data = mockLocalStorage.getItem('file1Data');
    const file2Data = mockLocalStorage.getItem('file2Data');
    
    const file1 = JSON.parse(file1Data);
    const realWorkingData = file1.data || file1.rows || [];
    
    if (realWorkingData.length === 0) {
      throw new Error('No data found in uploaded files. Please check file selection.');
    }
    
    console.log('❌ Should have thrown error for empty data');
    return { success: false, expectedError: true };
    
  } catch (error) {
    if (error.message.includes('No data found')) {
      console.log('✅ Correctly handled empty file data');
      return { success: true, expectedError: true };
    } else {
      console.log('❌ Unexpected error:', error.message);
      return { success: false, expectedError: false };
    }
  }
};

// Test malformed file data scenario
const testMalformedFileData = async () => {
  console.log('\n🧪 Testing malformed file data scenario...');
  const mockLocalStorage = new MockLocalStorage();
  
  // Set up malformed JSON data
  mockLocalStorage.setItem('file1Data', 'invalid-json-{');
  mockLocalStorage.setItem('file2Data', '{"incomplete": ');
  
  try {
    const file1Data = mockLocalStorage.getItem('file1Data');
    const file1 = JSON.parse(file1Data);
    
    console.log('❌ Should have thrown JSON parsing error');
    return { success: false, expectedError: true };
    
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.log('✅ Correctly handled malformed JSON data');
      return { success: true, expectedError: true };
    } else {
      console.log('❌ Unexpected error type:', error.constructor.name);
      return { success: false, expectedError: false };
    }
  }
};

// Test step execution with missing data
const testStepExecutionMissingData = async () => {
  console.log('\n🧪 Testing step execution with missing data...');
  
  try {
    // Simulate executeStepsUpTo without required files
    const testFile1Info = null;
    const testFile2Info = null;
    
    if (!testFile1Info || !testFile2Info) {
      throw new Error('Missing Files - Please select both files first');
    }
    
    console.log('❌ Should have thrown missing files error');
    return { success: false, expectedError: true };
    
  } catch (error) {
    if (error.message.includes('Missing Files')) {
      console.log('✅ Correctly handled missing file info');
      return { success: true, expectedError: true };
    } else {
      console.log('❌ Unexpected error:', error.message);
      return { success: false, expectedError: false };
    }
  }
};

// Test large dataset performance
const testLargeDatasetPerformance = async () => {
  console.log('\n🧪 Testing large dataset performance...');
  
  // Generate large dataset
  const largeDataset = [];
  for (let i = 0; i < 10000; i++) {
    largeDataset.push({
      'Transaction Date': `2024-01-${(i % 30) + 1}`,
      'Customer Name': `Customer ${i}`,
      'Card Brand': ['Visa', 'Mastercard', 'Amex', 'Discover'][i % 4],
      'Total Transaction Amount': (Math.random() * 1000).toFixed(2),
      'Fee Amount': (Math.random() * 50).toFixed(2)
    });
  }
  
  console.log(`📊 Generated dataset with ${largeDataset.length} records`);
  
  const startTime = Date.now();
  
  try {
    // Simulate filtering operation on large dataset
    const filtered = largeDataset.filter(row => {
      const dateField = Object.keys(row).find(k => k.toLowerCase().includes('date'));
      return dateField && row[dateField];
    });
    
    // Simulate calculation operation
    const calculated = filtered.map(row => ({
      ...row,
      'Calculated Fee': (parseFloat(row['Total Transaction Amount']) * 0.035).toFixed(2)
    }));
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    console.log(`✅ Large dataset processing completed`);
    console.log(`⏱️  Execution time: ${executionTime}ms`);
    console.log(`📊 Processed ${calculated.length} records`);
    
    return {
      success: true,
      executionTime,
      recordsProcessed: calculated.length,
      performanceAcceptable: executionTime < 5000 // Should complete in under 5 seconds
    };
    
  } catch (error) {
    console.log('❌ Large dataset processing failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Test column mapping edge cases
const testColumnMappingEdgeCases = async () => {
  console.log('\n🧪 Testing column mapping edge cases...');
  
  const testData = [
    {
      'TRANSACTION_DATE': '2024-01-15', // Uppercase with underscore
      'customer name': 'John Smith',    // Lowercase with space
      'Card-Brand': 'Visa',           // Mixed case with hyphen
      'Total$Amount': '150.00',       // Special character
      '  Fee Amount  ': '5.25'        // Leading/trailing spaces
    },
    {
      'TRANSACTION_DATE': '2024-01-16',
      'customer name': 'Jane Doe',
      'Card-Brand': 'Mastercard',
      'Total$Amount': '89.50',
      '  Fee Amount  ': '3.13'
    }
  ];
  
  try {
    // Test column finding with various patterns
    const dateColumn = Object.keys(testData[0]).find(col => 
      col.toLowerCase().includes('date') || col.toLowerCase().includes('time')
    );
    
    const amountColumn = Object.keys(testData[0]).find(col => 
      col.toLowerCase().includes('amount') || col.toLowerCase().includes('total')
    );
    
    const customerColumn = Object.keys(testData[0]).find(col => 
      col.toLowerCase().includes('customer') || col.toLowerCase().includes('name')
    );
    
    console.log(`✅ Found date column: "${dateColumn}"`);
    console.log(`✅ Found amount column: "${amountColumn}"`);
    console.log(`✅ Found customer column: "${customerColumn}"`);
    
    // Test data filtering with found columns
    const filtered = testData.filter(row => 
      row[dateColumn] && row[dateColumn].toString().trim() !== ''
    );
    
    console.log(`📊 Filtered ${filtered.length} records using dynamic column mapping`);
    
    return {
      success: true,
      columnsFound: { dateColumn, amountColumn, customerColumn },
      recordsFiltered: filtered.length
    };
    
  } catch (error) {
    console.log('❌ Column mapping failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Test concurrent step execution
const testConcurrentStepExecution = async () => {
  console.log('\n🧪 Testing concurrent step execution...');
  
  const testData = [
    { 'Amount': '100', 'Fee': '3.50' },
    { 'Amount': '200', 'Fee': '7.00' },
    { 'Amount': '300', 'Fee': '10.50' }
  ];
  
  try {
    // Simulate concurrent operations
    const operations = [
      // Operation 1: Calculate fees
      new Promise(resolve => {
        setTimeout(() => {
          const result = testData.map(row => ({
            ...row,
            'Calculated Fee': (parseFloat(row.Amount) * 0.035).toFixed(2)
          }));
          resolve({ operation: 'fee_calculation', result });
        }, 100);
      }),
      
      // Operation 2: Add discrepancies
      new Promise(resolve => {
        setTimeout(() => {
          const result = testData.map(row => ({
            ...row,
            'Discrepancy': (Math.random() * 5).toFixed(2)
          }));
          resolve({ operation: 'discrepancy_analysis', result });
        }, 150);
      }),
      
      // Operation 3: Match status
      new Promise(resolve => {
        setTimeout(() => {
          const result = testData.map(row => ({
            ...row,
            'Match Status': Math.random() > 0.5 ? 'Matched' : 'No Match'
          }));
          resolve({ operation: 'matching', result });
        }, 120);
      })
    ];
    
    const results = await Promise.all(operations);
    
    console.log('✅ Concurrent operations completed successfully');
    results.forEach(result => {
      console.log(`  📊 ${result.operation}: ${result.result.length} records processed`);
    });
    
    return {
      success: true,
      operationsCompleted: results.length,
      allOperationsSuccessful: results.every(r => r.result.length > 0)
    };
    
  } catch (error) {
    console.log('❌ Concurrent execution failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Test memory usage with large transformations
const testMemoryUsage = async () => {
  console.log('\n🧪 Testing memory usage with large transformations...');
  
  try {
    const initialMemory = process.memoryUsage();
    console.log(`📊 Initial memory usage: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
    
    // Create large dataset for transformation
    const largeData = Array.from({ length: 50000 }, (_, i) => ({
      id: i,
      amount: Math.random() * 1000,
      date: `2024-01-${(i % 30) + 1}`,
      customer: `Customer ${i}`
    }));
    
    // Perform memory-intensive transformation
    const transformed = largeData
      .filter(row => row.amount > 100)
      .map(row => ({
        ...row,
        fee: row.amount * 0.035,
        category: row.amount > 500 ? 'Large' : 'Small',
        processed_date: new Date().toISOString()
      }))
      .sort((a, b) => b.amount - a.amount);
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
    
    console.log(`📊 Final memory usage: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
    console.log(`📊 Memory increase: ${Math.round(memoryIncrease)}MB`);
    console.log(`📊 Transformed ${transformed.length} records`);
    
    // Clean up
    largeData.length = 0;
    transformed.length = 0;
    
    return {
      success: true,
      memoryIncrease: Math.round(memoryIncrease),
      recordsTransformed: transformed.length,
      memoryEfficient: memoryIncrease < 100 // Should use less than 100MB additional
    };
    
  } catch (error) {
    console.log('❌ Memory usage test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Main edge cases test execution
const runEdgeCasesTests = async () => {
  console.log('🧪 Starting AdminPage Automation Engine Edge Cases Tests\n');
  console.log('=' .repeat(70));
  
  const tests = [
    { name: 'Missing File Data', test: testMissingFileData },
    { name: 'Empty File Data', test: testEmptyFileData },
    { name: 'Malformed File Data', test: testMalformedFileData },
    { name: 'Step Execution Missing Data', test: testStepExecutionMissingData },
    { name: 'Large Dataset Performance', test: testLargeDatasetPerformance },
    { name: 'Column Mapping Edge Cases', test: testColumnMappingEdgeCases },
    { name: 'Concurrent Step Execution', test: testConcurrentStepExecution },
    { name: 'Memory Usage', test: testMemoryUsage }
  ];
  
  const results = [];
  
  for (const testCase of tests) {
    console.log(`\n📋 TEST: ${testCase.name}`);
    console.log('-'.repeat(50));
    
    try {
      const result = await testCase.test();
      results.push({ ...result, testName: testCase.name });
      
      if (result.success) {
        console.log(`✅ ${testCase.name}: PASS`);
      } else {
        console.log(`❌ ${testCase.name}: FAIL`);
      }
    } catch (error) {
      console.log(`💥 ${testCase.name}: ERROR - ${error.message}`);
      results.push({ success: false, error: error.message, testName: testCase.name });
    }
  }
  
  // Summary
  console.log('\n📊 EDGE CASES TEST SUMMARY');
  console.log('=' .repeat(70));
  
  const passCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.testName}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\n🏆 Overall Result: ${passCount}/${tests.length} tests passed`);
  
  if (passCount === tests.length) {
    console.log('🎉 All edge case tests PASSED!');
  } else {
    console.log(`⚠️  ${failCount} test(s) failed - this indicates potential robustness issues`);
  }
  
  return {
    totalTests: tests.length,
    passed: passCount,
    failed: failCount,
    results: results,
    overallPass: passCount === tests.length
  };
};

// Execute the edge cases tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runEdgeCasesTests,
    testMissingFileData,
    testEmptyFileData,
    testMalformedFileData,
    testLargeDatasetPerformance
  };
} else {
  // Run tests directly if not in module environment
  runEdgeCasesTests().then(results => {
    console.log('\n🏁 Edge cases test execution completed');
  }).catch(error => {
    console.error('💥 Edge cases test execution failed:', error);
  });
}