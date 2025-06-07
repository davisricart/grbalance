#!/usr/bin/env node

/**
 * LOCAL AI AGENT MOCK
 * Monitors for request files and generates response files
 * This simulates the Claude AI agent for local development
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const COMMUNICATION_DIR = path.join(__dirname, 'public', 'claude-communication');
const POLLING_INTERVAL = 1000; // 1 second

console.log('🤖 Local AI Agent Mock starting...');
console.log('📁 Monitoring:', COMMUNICATION_DIR);

// Ensure communication directory exists
if (!fs.existsSync(COMMUNICATION_DIR)) {
  fs.mkdirSync(COMMUNICATION_DIR, { recursive: true });
}

// Watch for new request files
const watcher = chokidar.watch(`${COMMUNICATION_DIR}/*-request-*.txt`, {
  ignored: /response/,
  persistent: true
});

watcher.on('add', async (filePath) => {
  console.log('📨 New request detected:', path.basename(filePath));
  await processRequest(filePath);
});

watcher.on('change', async (filePath) => {
  console.log('📝 Request updated:', path.basename(filePath));
  await processRequest(filePath);
});

async function processRequest(requestFilePath) {
  try {
    // Read the request
    const requestContent = fs.readFileSync(requestFilePath, 'utf8');
    console.log('📖 Request content preview:', requestContent.substring(0, 100) + '...');
    
    // Extract session ID from filename
    const filename = path.basename(requestFilePath);
    const sessionMatch = filename.match(/request-(.+?)\.txt$/);
    if (!sessionMatch) {
      console.error('❌ Could not extract session ID from:', filename);
      return;
    }
    
    const sessionId = sessionMatch[1];
    
    // Generate response based on request content
    const response = generateMockResponse(requestContent, sessionId);
    
    // Write response file
    const responseFilePath = path.join(COMMUNICATION_DIR, `claude-comm-response-${sessionId}.js`);
    fs.writeFileSync(responseFilePath, response);
    
    console.log('✅ Response generated:', path.basename(responseFilePath));
    
    // Move request to processed folder
    const processedDir = path.join(COMMUNICATION_DIR, 'processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir);
    }
    
    const processedPath = path.join(processedDir, `${Date.now()}-${path.basename(requestFilePath)}`);
    fs.renameSync(requestFilePath, processedPath);
    
  } catch (error) {
    console.error('❌ Error processing request:', error.message);
  }
}

function generateMockResponse(requestContent, sessionId) {
  // Parse the request to understand what kind of analysis is needed
  const instruction = requestContent.toLowerCase();
  
  let responseCode = '';
  
  if (instruction.includes('count') && instruction.includes('mastercard')) {
    // Mastercard counting analysis
    responseCode = `
// Mastercard Analysis Response
console.log('🔍 Analyzing Mastercard transactions...');

const workingData = window.aiFile1Data || window.uploadedFile1 || [];
console.log('📊 Working with', workingData.length, 'rows');

if (workingData.length === 0) {
  console.warn('⚠️ No data available for analysis');
  return [{
    'Analysis': 'No Data',
    'Message': 'Please upload a file first',
    'Timestamp': new Date().toISOString()
  }];
}

// Find potential card brand columns
const sampleRow = workingData[0] || {};
const possibleColumns = Object.keys(sampleRow).filter(key => 
  key.toLowerCase().includes('card') || 
  key.toLowerCase().includes('brand') || 
  key.toLowerCase().includes('type') ||
  key.toLowerCase().includes('payment')
);

console.log('🔍 Found possible card columns:', possibleColumns);

let mastercardCount = 0;
let totalCount = workingData.length;
let cardBrandColumn = possibleColumns[0] || 'Card Brand';

// Count Mastercard transactions
workingData.forEach((row, index) => {
  const cardValue = String(row[cardBrandColumn] || '').toLowerCase();
  if (cardValue.includes('mastercard') || cardValue.includes('master card')) {
    mastercardCount++;
  }
});

const percentage = totalCount > 0 ? ((mastercardCount / totalCount) * 100).toFixed(1) : '0.0';

console.log('✅ Analysis complete:', {
  total: totalCount,
  mastercard: mastercardCount,
  percentage: percentage + '%'
});

// Return analysis results
return [{
  'Analysis Type': 'Mastercard Count Analysis',
  'Total Transactions': totalCount,
  'Mastercard Transactions': mastercardCount,
  'Percentage': percentage + '%',
  'Column Analyzed': cardBrandColumn,
  'Processing Time': new Date().toISOString(),
  'Status': 'Completed Successfully'
}];
`;
  } else if (instruction.includes('amount') || instruction.includes('total')) {
    // Amount analysis
    responseCode = `
// Amount Analysis Response
console.log('💰 Analyzing transaction amounts...');

const workingData = window.aiFile1Data || window.uploadedFile1 || [];
console.log('📊 Working with', workingData.length, 'rows');

if (workingData.length === 0) {
  return [{
    'Analysis': 'No Data',
    'Message': 'Please upload a file first',
    'Timestamp': new Date().toISOString()
  }];
}

// Find amount columns
const sampleRow = workingData[0] || {};
const amountColumns = Object.keys(sampleRow).filter(key => 
  key.toLowerCase().includes('amount') || 
  key.toLowerCase().includes('total') ||
  key.toLowerCase().includes('price') ||
  key.toLowerCase().includes('fee')
);

const amountColumn = amountColumns[0] || 'Amount';
let totalAmount = 0;
let validTransactions = 0;

workingData.forEach(row => {
  const amount = parseFloat(String(row[amountColumn] || '0').replace(/[$,]/g, ''));
  if (!isNaN(amount) && amount > 0) {
    totalAmount += amount;
    validTransactions++;
  }
});

const averageAmount = validTransactions > 0 ? (totalAmount / validTransactions) : 0;

console.log('✅ Amount analysis complete:', {
  total: '$' + totalAmount.toFixed(2),
  average: '$' + averageAmount.toFixed(2),
  valid: validTransactions
});

return [{
  'Analysis Type': 'Amount Analysis',
  'Total Amount': '$' + totalAmount.toFixed(2),
  'Valid Transactions': validTransactions,
  'Average Amount': '$' + averageAmount.toFixed(2),
  'Column Analyzed': amountColumn,
  'Processing Time': new Date().toISOString(),
  'Status': 'Completed Successfully'
}];
`;
  } else if (instruction.includes('card brand') || instruction.includes('payment')) {
    // Card brand distribution
    responseCode = `
// Card Brand Distribution Analysis
console.log('💳 Analyzing card brand distribution...');

const workingData = window.aiFile1Data || window.uploadedFile1 || [];

if (workingData.length === 0) {
  return [{
    'Analysis': 'No Data',
    'Message': 'Please upload a file first'
  }];
}

const sampleRow = workingData[0] || {};
const brandColumns = Object.keys(sampleRow).filter(key => 
  key.toLowerCase().includes('card') || 
  key.toLowerCase().includes('brand') ||
  key.toLowerCase().includes('type') ||
  key.toLowerCase().includes('payment')
);

const brandColumn = brandColumns[0] || 'Card Brand';
const brandCounts = {};

workingData.forEach(row => {
  const brand = String(row[brandColumn] || 'Unknown').trim();
  brandCounts[brand] = (brandCounts[brand] || 0) + 1;
});

const results = Object.entries(brandCounts).map(([brand, count]) => ({
  'Card Brand': brand,
  'Transaction Count': count,
  'Percentage': ((count / workingData.length) * 100).toFixed(1) + '%'
}));

console.log('✅ Card brand analysis complete');

return results;
`;
  } else {
    // Default summary analysis
    responseCode = `
// Default Data Summary Analysis
console.log('📊 Performing data summary analysis...');

const workingData = window.aiFile1Data || window.uploadedFile1 || [];

if (workingData.length === 0) {
  return [{
    'Analysis': 'No Data Available',
    'Message': 'Please upload a file to analyze',
    'Timestamp': new Date().toISOString()
  }];
}

const sampleRow = workingData[0] || {};
const columns = Object.keys(sampleRow);

console.log('✅ Data summary complete');

return [{
  'Analysis Type': 'Data Summary',
  'Total Rows': workingData.length,
  'Total Columns': columns.length,
  'Columns': columns.join(', '),
  'Sample Data': JSON.stringify(sampleRow),
  'Processing Time': new Date().toISOString(),
  'Status': 'Analysis Complete'
}];
`;
  }
  
  // Wrap the response code in the expected format
  return `// AI Response Generated at ${new Date().toISOString()}
// Session: ${sessionId}
console.log('🤖 AI Response executing...');

try {
  const result = (function() {
    ${responseCode}
  })();
  
  console.log('✅ AI Analysis Result:', result);
  
  // Store result for frontend
  window.aiAnalysisResult = result;
  window.aiAnalysisComplete = true;
  
  // Dispatch event to notify frontend
  window.dispatchEvent(new CustomEvent('aiAnalysisComplete', { 
    detail: { result, sessionId: '${sessionId}' }
  }));
  
} catch (error) {
  console.error('❌ AI Analysis Error:', error);
  window.aiAnalysisResult = [{
    'Error': 'Analysis Failed',
    'Message': error.message,
    'Timestamp': new Date().toISOString()
  }];
  window.aiAnalysisComplete = true;
}`;
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Local AI Agent shutting down...');
  watcher.close();
  process.exit(0);
});

console.log('✅ Local AI Agent Mock is running!');
console.log('💡 Submit analysis requests through the frontend to see this in action.');
console.log('🔄 Press Ctrl+C to stop');