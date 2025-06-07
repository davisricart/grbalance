// Test exactly how StepBuilderDemo will execute the code

// Simulate the response parsing
const responseCode = "const sampleRow = workingData[0] || null;\\nif (!sampleRow) return [];\\n\\nconst possibleColumns = Object.keys(sampleRow).filter(key => key.toLowerCase().includes('card') || key.toLowerCase().includes('brand') || key.toLowerCase().includes('type') || key.toLowerCase().includes('payment'));\\n\\nlet mastercardCount = 0;\\nconst totalCount = workingData.length;\\nconst cardBrandColumn = possibleColumns[0] || 'Card Brand';\\n\\nworkingData.forEach(row => {\\n  const cardValue = String(row[cardBrandColumn] || '').toLowerCase();\\n  if (cardValue.includes('mastercard') || cardValue.includes('master card')) mastercardCount++;\\n});\\n\\nconst percentage = totalCount > 0 ? ((mastercardCount / totalCount) * 100).toFixed(1) : '0.0';\\n\\nconst result = [];\\nresult.push({});\\nresult[0]['Analysis Type'] = 'Mastercard Count Analysis';\\nresult[0]['Total Transactions'] = totalCount;\\nresult[0]['Mastercard Transactions'] = mastercardCount;\\nresult[0]['Percentage'] = percentage + '%';\\nresult[0]['Column Analyzed'] = cardBrandColumn;\\nresult[0]['Processing Time'] = new Date().toISOString();\\nresult[0]['Status'] = 'Completed Successfully';\\nreturn result;";

// Test how StepBuilderDemo creates the function: new Function('workingData', code)
console.log('Testing with StepBuilderDemo approach...');

try {
  console.log('Creating function with escaped code...');
  const transformFunction = new Function('workingData', responseCode);
  console.log('❌ This should not work with escaped newlines');
} catch (e) {
  console.log('✅ Expected failure with escaped code:', e.message.substring(0, 100));
}

// The frontend should unescape the string first
const unescapedCode = responseCode.replace(/\\n/g, '\n').replace(/\\"/g, '"');
console.log('\nTesting with unescaped code...');

try {
  const transformFunction = new Function('workingData', unescapedCode);
  console.log('✅ Unescaped code works!');
  
  // Test execution with sample data
  const sampleData = [
    { 'Card Brand': 'Mastercard', 'Amount': 100 },
    { 'Card Brand': 'Visa', 'Amount': 200 },
    { 'Card Brand': 'Mastercard', 'Amount': 150 }
  ];
  
  const result = transformFunction(sampleData);
  console.log('📊 Execution result:', result);
  
} catch (e) {
  console.log('❌ Unescaped code failed:', e.message);
}