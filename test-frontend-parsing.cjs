#!/usr/bin/env node

/**
 * TEST FRONTEND PARSING LOGIC
 * Simulates the exact parsing logic used by improved-file-communication.ts
 */

const fs = require('fs');
const path = require('path');

function testFrontendParsing(filePath) {
  console.log('🧪 Testing frontend parsing logic...');
  console.log('📁 File:', filePath);
  
  try {
    // Read the response file content
    const responseText = fs.readFileSync(filePath, 'utf8');
    console.log('✅ File read successfully');
    
    // Frontend's exact parsing logic from improved-file-communication.ts:188
    console.log('🔍 Applying frontend regex...');
    const jsonMatch = responseText.match(/window\.(?:claudeResponse|aiResponse)\s*=\s*({[\s\S]*?});/);
    
    if (jsonMatch) {
      console.log('✅ Regex matched successfully');
      console.log('📄 Extracted JSON string length:', jsonMatch[1].length);
      console.log('📄 First 200 chars:', jsonMatch[1].substring(0, 200) + '...');
      
      try {
        // Frontend's JSON.parse step
        console.log('🔍 Attempting JSON.parse...');
        const data = JSON.parse(jsonMatch[1]);
        
        console.log('✅ JSON.parse successful!');
        console.log('📊 Parsed object keys:', Object.keys(data));
        console.log('📊 sessionId:', data.sessionId);
        console.log('📊 response field type:', typeof data.response);
        console.log('📊 response field length:', data.response?.length);
        
        // Test the response field as executable code
        if (data.response) {
          console.log('🔍 Testing response code execution...');
          try {
            const testFunction = new Function(data.response);
            console.log('✅ Response code is valid JavaScript');
          } catch (codeError) {
            console.error('❌ Response code invalid:', codeError.message);
          }
        }
        
        return {
          success: true,
          sessionId: data.sessionId,
          timestamp: data.timestamp || new Date().toISOString(),
          response: data.response || 'Response received',
          status: 'completed'
        };
        
      } catch (parseError) {
        console.error('❌ JSON.parse failed:', parseError.message);
        console.error('📄 Problematic JSON around error:');
        
        // Find where the error occurs
        const errorPos = parseError.message.match(/position (\d+)/);
        if (errorPos) {
          const pos = parseInt(errorPos[1]);
          const start = Math.max(0, pos - 50);
          const end = Math.min(jsonMatch[1].length, pos + 50);
          console.error('Context:', jsonMatch[1].substring(start, end));
          console.error('Error at:', ' '.repeat(Math.min(50, pos - start)) + '^');
        }
        
        return null;
      }
      
    } else {
      console.error('❌ Regex did not match');
      console.log('📄 File content preview:');
      console.log(responseText.substring(0, 500) + '...');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

// Test the response file
const responseFile = path.join(__dirname, 'public', 'claude-communication', 'claude-comm-response-1749298312437-xdstqy-0.js');

console.log('🧪 FRONTEND PARSING SIMULATION TEST');
console.log('===================================');

const result = testFrontendParsing(responseFile);

if (result) {
  console.log('\n✅ FRONTEND PARSING WOULD SUCCEED');
  console.log('📊 Final result:', JSON.stringify(result, null, 2));
} else {
  console.log('\n❌ FRONTEND PARSING WOULD FAIL');
}