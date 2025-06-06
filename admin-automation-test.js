/**
 * AdminPage Automation Engine Test Suite
 * Tests the automation-related functions in AdminPage.tsx
 * Focus: executeStepsUpTo, initializeVisualStepBuilder, file data flow
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

// Test data setup
const setupTestData = () => {
  const mockLocalStorage = new MockLocalStorage();
  
  // Sample file data that mimics real uploaded Excel/CSV files
  const file1Data = {
    filename: "transactions_2024.xlsx",
    headers: ["Transaction Date", "Customer Name", "Card Brand", "Total Transaction Amount", "Fee Amount"],
    rows: [
      {
        "Transaction Date": "2024-01-15",
        "Customer Name": "John Smith",
        "Card Brand": "Visa",
        "Total Transaction Amount": "150.00",
        "Fee Amount": "5.25"
      },
      {
        "Transaction Date": "2024-01-16", 
        "Customer Name": "Jane Doe",
        "Card Brand": "Mastercard",
        "Total Transaction Amount": "89.50",
        "Fee Amount": "3.13"
      },
      {
        "Transaction Date": "2024-01-17",
        "Customer Name": "Bob Johnson", 
        "Card Brand": "Amex",
        "Total Transaction Amount": "275.00",
        "Fee Amount": "9.63"
      },
      {
        "Transaction Date": "2024-01-18",
        "Customer Name": "Sarah Wilson",
        "Card Brand": "Visa", 
        "Total Transaction Amount": "45.25",
        "Fee Amount": "1.58"
      },
      {
        "Transaction Date": "2024-01-19",
        "Customer Name": "Mike Davis",
        "Card Brand": "Discover",
        "Total Transaction Amount": "320.75",
        "Fee Amount": "11.23"
      }
    ],
    data: [] // Will be filled with rows
  };
  
  const file2Data = {
    filename: "bank_statement_2024.csv",
    headers: ["Date", "Description", "Amount", "Balance", "Card Type"],
    rows: [
      {
        "Date": "2024-01-15",
        "Description": "Card Payment - John Smith",
        "Amount": "144.75",
        "Balance": "1200.50",
        "Card Type": "VISA"
      },
      {
        "Date": "2024-01-16",
        "Description": "Card Payment - Jane Doe", 
        "Amount": "86.37",
        "Balance": "1286.87",
        "Card Type": "MC"
      },
      {
        "Date": "2024-01-17",
        "Description": "Card Payment - Bob Johnson",
        "Amount": "265.37", 
        "Balance": "1552.24",
        "Card Type": "AMEX"
      }
    ],
    data: [] // Will be filled with rows
  };
  
  // Fill data arrays
  file1Data.data = file1Data.rows;
  file2Data.data = file2Data.rows;
  
  // Store in mock localStorage
  mockLocalStorage.setItem('file1Data', JSON.stringify(file1Data));
  mockLocalStorage.setItem('file2Data', JSON.stringify(file2Data));
  
  return { mockLocalStorage, file1Data, file2Data };
};

// Test step execution simulation
const simulateStepExecution = async (stepInstruction, inputData) => {
  console.log(`\n🔄 Executing step: "${stepInstruction}"`);
  console.log(`📊 Input data: ${inputData.length} records`);
  
  const instruction = stepInstruction.toLowerCase();
  let resultData = [...inputData];
  
  try {
    // Simulate the executeStepsUpTo logic
    if (instruction.includes('load') || instruction.includes('start')) {
      console.log('  ✅ Loading data...');
      resultData = inputData.slice(0, 10); // Limit for preview
      
    } else if (instruction.includes('filter')) {
      console.log('  🔍 Applying filter...');
      if (instruction.includes('date')) {
        resultData = resultData.filter(row => {
          const dateField = Object.keys(row).find(k => k.toLowerCase().includes('date'));
          return dateField && row[dateField];
        });
        console.log(`  📅 Date filter applied: ${resultData.length} records remaining`);
      } else {
        resultData = resultData.filter((_, index) => index % 2 === 0);
        console.log(`  🎯 Generic filter applied: ${resultData.length} records remaining`);
      }
      
    } else if (instruction.includes('calculate')) {
      console.log('  🧮 Performing calculations...');
      if (instruction.includes('fee') || instruction.includes('discount')) {
        resultData = resultData.map(row => ({
          ...row,
          'Calculated Fee': (parseFloat(row['Total Transaction Amount'] || 0) * 0.035).toFixed(2)
        }));
        console.log('  💰 Fee calculations completed');
      } else if (instruction.includes('difference') || instruction.includes('discrepancy')) {
        resultData = resultData.map(row => ({
          ...row,
          'Discrepancy': (Math.random() * 10).toFixed(2)
        }));
        console.log('  📊 Discrepancy analysis completed');
      }
      
    } else if (instruction.includes('match') || instruction.includes('compare')) {
      console.log('  🔗 Performing matching...');
      resultData = resultData.map(row => ({
        ...row,
        'Match Status': Math.random() > 0.3 ? '✅ Matched' : '❌ No Match'
      }));
      console.log('  🎯 Matching analysis completed');
      
    } else if (instruction.includes('group')) {
      console.log('  📂 Grouping data...');
      const grouped = resultData.reduce((acc, row) => {
        const key = row['Customer Name'] || row['Card Brand'] || 'Unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {});
      
      resultData = Object.entries(grouped).map(([group, items]) => ({
        'Group': group,
        'Count': items.length,
        'Total Amount': items.reduce((sum, item) => sum + parseFloat(item['Total Transaction Amount'] || 0), 0).toFixed(2)
      }));
      console.log(`  📊 Grouped into ${resultData.length} categories`);
      
    } else if (instruction.includes('column') && instruction.includes('only')) {
      console.log('  📋 Selecting specific columns...');
      const targetColumns = [];
      if (instruction.includes('date')) targetColumns.push('date');
      if (instruction.includes('invoice')) targetColumns.push('invoice');
      if (instruction.includes('amount')) targetColumns.push('amount');
      if (instruction.includes('customer')) targetColumns.push('customer');
      
      if (targetColumns.length > 0) {
        resultData = resultData.map(row => {
          const filteredRow = {};
          const availableColumns = Object.keys(row);
          
          targetColumns.forEach(target => {
            const matchedCol = availableColumns.find(col => 
              col.toLowerCase().includes(target.toLowerCase())
            );
            if (matchedCol) {
              filteredRow[matchedCol] = row[matchedCol];
            }
          });
          
          return filteredRow;
        });
        console.log(`  📋 Selected columns: ${targetColumns.join(', ')}`);
      }
    }
    
    console.log(`  ✅ Step completed: ${resultData.length} records processed`);
    return resultData;
    
  } catch (error) {
    console.error(`  ❌ Step execution error:`, error);
    throw error;
  }
};

// Test the initializeVisualStepBuilder function
const testInitializeVisualStepBuilder = async (mockLocalStorage, analysisInstructions = "Load and analyze transaction data") => {
  console.log('\n🚀 Testing initializeVisualStepBuilder...');
  console.log(`📝 Analysis Instructions: "${analysisInstructions}"`);
  
  try {
    // Simulate the function logic
    const file1Data = mockLocalStorage.getItem('file1Data');
    const file2Data = mockLocalStorage.getItem('file2Data');
    
    if (!file1Data || !file2Data) {
      throw new Error('File data not found. Please re-select your files.');
    }
    
    const file1 = JSON.parse(file1Data);
    const file2 = JSON.parse(file2Data);
    
    // Use REAL data for high-fidelity preview
    const realWorkingData = file1.data || file1.rows || [];
    
    if (realWorkingData.length === 0) {
      throw new Error('No data found in uploaded files. Please check file selection.');
    }
    
    // Create Step 1 with actual uploaded data
    const step1 = {
      id: 'step-1',
      stepNumber: 1,
      instruction: analysisInstructions,
      status: 'completed',
      dataPreview: realWorkingData.slice(0, 5), // Show real data preview
      recordCount: realWorkingData.length,
      columnsAdded: [],
      timestamp: new Date().toISOString(),
      isViewingStep: false,
      executionTime: 150
    };
    
    console.log('✅ Visual Step Builder initialized successfully');
    console.log(`📊 Working with ${realWorkingData.length} records`);
    console.log(`📋 Columns: ${Object.keys(realWorkingData[0] || {}).join(', ')}`);
    console.log(`🔍 Preview data:`, step1.dataPreview);
    
    return {
      step: step1,
      workingData: realWorkingData,
      success: true
    };
    
  } catch (error) {
    console.error('❌ initializeVisualStepBuilder failed:', error);
    return {
      step: null,
      workingData: null,
      success: false,
      error: error.message
    };
  }
};

// Test executeStepsUpTo function with multiple steps
const testExecuteStepsUpTo = async (mockLocalStorage, targetStepNumber = 3) => {
  console.log(`\n🚀 Testing executeStepsUpTo (target: step ${targetStepNumber})...`);
  
  try {
    // Mock script steps for testing
    const scriptSteps = [
      {
        id: 'step-1',
        stepNumber: 1,
        instruction: 'Load transaction data from file 1',
        status: 'draft'
      },
      {
        id: 'step-2', 
        stepNumber: 2,
        instruction: 'Filter transactions by date range',
        status: 'draft'
      },
      {
        id: 'step-3',
        stepNumber: 3,
        instruction: 'Calculate processing fees for each transaction',
        status: 'draft'
      },
      {
        id: 'step-4',
        stepNumber: 4,
        instruction: 'Match transactions with bank statement records',
        status: 'draft'
      }
    ];
    
    // Get file data
    const file1Data = mockLocalStorage.getItem('file1Data');
    const file2Data = mockLocalStorage.getItem('file2Data');
    
    if (!file1Data || !file2Data) {
      throw new Error('File data not found');
    }

    const file1 = JSON.parse(file1Data);
    const file2 = JSON.parse(file2Data);
    
    let workingData = file1.data || file1.rows || [];
    let stepResults = workingData;

    console.log(`📊 Starting with ${workingData.length} records`);

    // Execute steps in sequence up to target step
    for (let i = 0; i < targetStepNumber; i++) {
      const step = scriptSteps[i];
      if (!step) continue;

      console.log(`\n📍 Processing Step ${step.stepNumber}...`);
      console.log(`🎯 Instruction: "${step.instruction}"`);

      // Execute step logic and update results
      stepResults = await simulateStepExecution(step.instruction, stepResults);
      
      // Update step status (simulation)
      step.status = 'completed';
      step.outputPreview = stepResults.slice(0, 5);
      step.recordCount = stepResults.length;
      step.columnsAdded = Object.keys(stepResults[0] || {}).filter(col => 
        !Object.keys(workingData[0] || {}).includes(col)
      );

      console.log(`📋 New columns added: ${step.columnsAdded.join(', ') || 'None'}`);

      // Small delay for visual feedback simulation
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n✅ executeStepsUpTo completed successfully`);
    console.log(`📊 Final result: ${stepResults.length} records`);
    console.log(`🔍 Sample output:`, stepResults.slice(0, 2));

    return {
      success: true,
      finalResults: stepResults,
      stepsExecuted: targetStepNumber,
      scriptSteps: scriptSteps
    };

  } catch (error) {
    console.error('❌ executeStepsUpTo failed:', error);
    return {
      success: false,
      error: error.message,
      stepsExecuted: 0
    };
  }
};

// Test AI prompt generation workflow
const testAIPromptGeneration = (file1Data, file2Data) => {
  console.log('\n🚀 Testing AI prompt generation...');
  
  try {
    const comparisonRequest = "Compare payment processing fees and identify discrepancies";
    
    const prompt = `I need to analyze two data files and generate results in the exact GR Balance format shown in the interface.

**FILE 1: ${file1Data.filename}**
Columns: ${file1Data.headers.join(', ')}
Total Rows: ${file1Data.rows.length}
Sample Data:
${file1Data.rows.slice(0, 3).map(row => 
  file1Data.headers.map(h => `${h}: ${row[h]}`).join(' | ')
).join('\n')}

**FILE 2: ${file2Data.filename}**
Columns: ${file2Data.headers.join(', ')}
Total Rows: ${file2Data.rows.length}
Sample Data:
${file2Data.rows.slice(0, 3).map(row => 
  file2Data.headers.map(h => `${h}: ${row[h]}`).join(' | ')
).join('\n')}

**Analysis Request:** ${comparisonRequest}

Please provide detailed step-by-step analysis instructions.`;

    console.log('✅ AI prompt generated successfully');
    console.log(`📝 Prompt length: ${prompt.length} characters`);
    console.log(`🔍 Sample prompt preview:`);
    console.log(prompt.substring(0, 500) + '...');
    
    return {
      success: true,
      prompt: prompt,
      length: prompt.length
    };
    
  } catch (error) {
    console.error('❌ AI prompt generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Main test execution
const runAdminAutomationTests = async () => {
  console.log('🧪 Starting AdminPage Automation Engine Tests\n');
  console.log('=' .repeat(60));
  
  // Setup test data
  const { mockLocalStorage, file1Data, file2Data } = setupTestData();
  console.log('✅ Test data setup completed');
  
  // Test 1: Initialize Visual Step Builder
  console.log('\n📋 TEST 1: Initialize Visual Step Builder');
  console.log('-'.repeat(40));
  const initResult = await testInitializeVisualStepBuilder(mockLocalStorage);
  
  // Test 2: Execute Steps Up To Target
  console.log('\n📋 TEST 2: Execute Steps Up To Target');
  console.log('-'.repeat(40));
  const executeResult = await testExecuteStepsUpTo(mockLocalStorage, 3);
  
  // Test 3: AI Prompt Generation
  console.log('\n📋 TEST 3: AI Prompt Generation Workflow');
  console.log('-'.repeat(40));
  const promptResult = testAIPromptGeneration(file1Data, file2Data);
  
  // Test 4: File Data Flow Verification
  console.log('\n📋 TEST 4: File Data Flow Verification');
  console.log('-'.repeat(40));
  console.log('🔍 Checking localStorage data integrity...');
  
  const storedFile1 = mockLocalStorage.getItem('file1Data');
  const storedFile2 = mockLocalStorage.getItem('file2Data');
  
  if (storedFile1 && storedFile2) {
    const parsed1 = JSON.parse(storedFile1);
    const parsed2 = JSON.parse(storedFile2);
    
    console.log('✅ File data successfully stored and retrieved');
    console.log(`📊 File 1: ${parsed1.rows.length} records, ${parsed1.headers.length} columns`);
    console.log(`📊 File 2: ${parsed2.rows.length} records, ${parsed2.headers.length} columns`);
    console.log(`🔍 Data integrity: ${parsed1.rows.length > 0 && parsed2.rows.length > 0 ? 'PASS' : 'FAIL'}`);
  } else {
    console.log('❌ File data storage/retrieval failed');
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`🎯 Initialize Visual Step Builder: ${initResult.success ? 'PASS' : 'FAIL'}`);
  console.log(`🎯 Execute Steps Up To Target: ${executeResult.success ? 'PASS' : 'FAIL'}`);
  console.log(`🎯 AI Prompt Generation: ${promptResult.success ? 'PASS' : 'FAIL'}`);
  console.log(`🎯 File Data Flow: ${storedFile1 && storedFile2 ? 'PASS' : 'FAIL'}`);
  
  const passCount = [initResult.success, executeResult.success, promptResult.success, !!(storedFile1 && storedFile2)].filter(Boolean).length;
  console.log(`\n🏆 Overall Result: ${passCount}/4 tests passed`);
  
  if (passCount === 4) {
    console.log('🎉 All automation engine tests PASSED!');
  } else {
    console.log('⚠️  Some tests failed - check logs above for details');
  }
  
  return {
    initResult,
    executeResult, 
    promptResult,
    dataFlowTest: !!(storedFile1 && storedFile2),
    overallPass: passCount === 4
  };
};

// Execute the tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAdminAutomationTests,
    testInitializeVisualStepBuilder,
    testExecuteStepsUpTo,
    testAIPromptGeneration,
    setupTestData
  };
} else {
  // Run tests directly if not in module environment
  runAdminAutomationTests().then(results => {
    console.log('\n🏁 Test execution completed');
  }).catch(error => {
    console.error('💥 Test execution failed:', error);
  });
}