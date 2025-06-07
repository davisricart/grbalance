#!/usr/bin/env node

/**
 * RESPONSE FILE GENERATOR
 * Generates properly formatted response files for frontend integration
 */

function generateResponseFile(sessionId, analysisType = 'mastercard') {
  
  let responseCode = '';
  
  if (analysisType === 'mastercard') {
    responseCode = `const sampleRow = workingData[0] || null; if (!sampleRow) return []; const possibleColumns = Object.keys(sampleRow).filter(key => key.toLowerCase().includes('card') || key.toLowerCase().includes('brand') || key.toLowerCase().includes('type') || key.toLowerCase().includes('payment')); let mastercardCount = 0; const totalCount = workingData.length; const cardBrandColumn = possibleColumns[0] || 'Card Brand'; workingData.forEach(row => { const cardValue = String(row[cardBrandColumn] || '').toLowerCase(); if (cardValue.includes('mastercard') || cardValue.includes('master card')) mastercardCount++; }); const percentage = totalCount > 0 ? ((mastercardCount / totalCount) * 100).toFixed(1) : '0.0'; const result = []; result.push({}); result[0]['Analysis Type'] = 'Mastercard Count Analysis'; result[0]['Total Transactions'] = totalCount; result[0]['Mastercard Transactions'] = mastercardCount; result[0]['Percentage'] = percentage + '%'; result[0]['Column Analyzed'] = cardBrandColumn; result[0]['Processing Time'] = new Date().toISOString(); result[0]['Status'] = 'Completed Successfully'; return result;`;
  } else if (analysisType === 'amount') {
    responseCode = `const sampleRow = workingData[0] || null; if (!sampleRow) return []; const amountColumns = Object.keys(sampleRow).filter(key => key.toLowerCase().includes('amount') || key.toLowerCase().includes('total') || key.toLowerCase().includes('price') || key.toLowerCase().includes('fee')); const amountColumn = amountColumns[0] || 'Amount'; let totalAmount = 0; let validTransactions = 0; workingData.forEach(row => { const amount = parseFloat(String(row[amountColumn] || '0').replace(/[$,]/g, '')); if (!isNaN(amount) && amount > 0) { totalAmount += amount; validTransactions++; } }); const averageAmount = validTransactions > 0 ? (totalAmount / validTransactions) : 0; const result = []; result.push({}); result[0]['Analysis Type'] = 'Amount Analysis'; result[0]['Total Amount'] = '$' + totalAmount.toFixed(2); result[0]['Valid Transactions'] = validTransactions; result[0]['Average Amount'] = '$' + averageAmount.toFixed(2); result[0]['Column Analyzed'] = amountColumn; result[0]['Processing Time'] = new Date().toISOString(); result[0]['Status'] = 'Completed Successfully'; return result;`;
  } else {
    responseCode = `const sampleRow = workingData[0] || null; if (!sampleRow) return []; const columns = Object.keys(sampleRow); const result = []; result.push({}); result[0]['Analysis Type'] = 'Data Summary'; result[0]['Total Rows'] = workingData.length; result[0]['Total Columns'] = columns.length; result[0]['Columns'] = columns.join(', '); result[0]['Processing Time'] = new Date().toISOString(); result[0]['Status'] = 'Analysis Complete'; return result;`;
  }
  
  const timestamp = new Date().toISOString();
  
  const responseFile = `// Claude AI Response for session ${sessionId}
// Generated at ${timestamp}

window.claudeResponse = {"success":true,"sessionId":"${sessionId}","timestamp":"${timestamp}","response":"${responseCode}","status":"completed","model":"claude-3-sonnet","processing_time":"2.5s"};

window.aiResponse = window.claudeResponse;

if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('claudeResponseReady', { detail: window.claudeResponse }));
}

console.log('✅ Claude response loaded for session:', '${sessionId}');`;

  return responseFile;
}

// Generate for the current session
const sessionId = '1749298312437-xdstqy-0';
const responseContent = generateResponseFile(sessionId, 'mastercard');

const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'public', 'claude-communication', `claude-comm-response-${sessionId}.js`);

// Ensure directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write file
fs.writeFileSync(outputPath, responseContent);

console.log('✅ Response file generated:', outputPath);
console.log('📋 Analysis type: Mastercard count');
console.log('🔗 Session ID:', sessionId);

// Export for testing
module.exports = { generateResponseFile };