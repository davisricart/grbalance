// Test the analysis code with sample data
const sampleData = [
  { 'Card Brand': 'Mastercard', 'Amount': 100, 'Customer': 'John' },
  { 'Card Brand': 'Visa', 'Amount': 200, 'Customer': 'Jane' },
  { 'Card Brand': 'Mastercard', 'Amount': 150, 'Customer': 'Bob' },
  { 'Card Brand': 'American Express', 'Amount': 300, 'Customer': 'Alice' }
];

// Mock window object
global.window = {
  aiFile1Data: sampleData,
  uploadedFile1: sampleData
};

// The analysis code from the response file (unescaped)
const analysisCode = `// Mastercard Count Analysis
const workingData = window.aiFile1Data || window.uploadedFile1 || [];
if (workingData.length === 0) {
  return [{'Analysis': 'No Data', 'Message': 'Please upload a file first'}];
}

// Find card brand column
const sampleRow = workingData[0] || {};
const possibleColumns = Object.keys(sampleRow).filter(key => 
  key.toLowerCase().includes('card') || 
  key.toLowerCase().includes('brand') || 
  key.toLowerCase().includes('type') ||
  key.toLowerCase().includes('payment')
);

let mastercardCount = 0;
const totalCount = workingData.length;
const cardBrandColumn = possibleColumns[0] || 'Card Brand';

workingData.forEach(row => {
  const cardValue = String(row[cardBrandColumn] || '').toLowerCase();
  if (cardValue.includes('mastercard') || cardValue.includes('master card')) {
    mastercardCount++;
  }
});

const percentage = totalCount > 0 ? ((mastercardCount / totalCount) * 100).toFixed(1) : '0.0';

return [{
  'Analysis Type': 'Mastercard Count Analysis',
  'Total Transactions': totalCount,
  'Mastercard Transactions': mastercardCount,
  'Percentage': percentage + '%',
  'Column Analyzed': cardBrandColumn,
  'Processing Time': new Date().toISOString(),
  'Status': 'Completed Successfully'
}];`;

console.log('🧪 Testing analysis code with sample data...');
console.log('📊 Sample data:', sampleData);

try {
  const testFunction = new Function('workingData', analysisCode);
  const result = testFunction(sampleData);
  
  console.log('✅ Analysis executed successfully!');
  console.log('📋 Result:', JSON.stringify(result, null, 2));
  
} catch (error) {
  console.error('❌ Analysis failed:', error.message);
}