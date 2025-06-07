#!/usr/bin/env node

/**
 * RESPONSE FILE VALIDATION TEST
 * Tests response files for proper JSON formatting and frontend compatibility
 */

const fs = require('fs');
const path = require('path');

function validateResponseFile(filePath) {
  console.log('🔍 Validating response file:', filePath);
  
  try {
    // Test 1: File exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Response file does not exist');
    }
    
    // Test 2: Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('✅ File read successfully');
    
    // Test 3: Execute JavaScript to set window variables
    const mockWindow = {};
    global.window = mockWindow;
    // Keep original console for validation output
    const originalConsole = console;
    
    eval(content);
    
    // Test 4: Check if claudeResponse was set
    if (!mockWindow.claudeResponse) {
      throw new Error('window.claudeResponse was not set');
    }
    console.log('✅ window.claudeResponse set correctly');
    
    // Test 5: Validate response structure
    const response = mockWindow.claudeResponse;
    const requiredFields = ['success', 'sessionId', 'timestamp', 'response', 'status'];
    
    for (const field of requiredFields) {
      if (!(field in response)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    console.log('✅ All required fields present');
    
    // Test 6: Validate response field is a string (not object)
    if (typeof response.response !== 'string') {
      throw new Error(`response field must be string, got: ${typeof response.response}`);
    }
    console.log('✅ Response field is string type');
    
    // Test 7: Test JSON parsing of the entire response
    try {
      JSON.stringify(response);
      console.log('✅ Response object is JSON serializable');
    } catch (jsonError) {
      throw new Error(`Response object not JSON serializable: ${jsonError.message}`);
    }
    
    // Test 8: Validate the executable code in response field
    try {
      const testFunction = new Function(response.response);
      console.log('✅ Response code is valid JavaScript');
      
      // Test with sample data
      const sampleData = [
        { 'Card Brand': 'Mastercard', 'Amount': 100 },
        { 'Card Brand': 'Visa', 'Amount': 200 }
      ];
      
      mockWindow.aiFile1Data = sampleData;
      const result = testFunction();
      
      if (Array.isArray(result) && result.length > 0) {
        console.log('✅ Response code executes and returns valid results');
        console.log('📊 Sample result:', result[0]);
      } else {
        console.warn('⚠️ Response code executed but returned empty/invalid results');
      }
      
    } catch (codeError) {
      throw new Error(`Response code execution failed: ${codeError.message}`);
    }
    
    // Test 9: Check for proper string escaping
    const responseString = response.response;
    if (responseString.includes('\n') && !responseString.includes('\\n')) {
      throw new Error('Response string contains unescaped newlines');
    }
    console.log('✅ String escaping appears correct');
    
    console.log('🎉 All validation tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

// Test the specific response file
const responseFile = path.join(__dirname, 'public', 'claude-communication', 'claude-comm-response-1749298312437-xdstqy-0.js');

console.log('🧪 RESPONSE FILE VALIDATION TEST');
console.log('================================');

const isValid = validateResponseFile(responseFile);

if (isValid) {
  console.log('\n✅ RESPONSE FILE IS READY FOR FRONTEND USE');
  process.exit(0);
} else {
  console.log('\n❌ RESPONSE FILE NEEDS FIXES');
  process.exit(1);
}