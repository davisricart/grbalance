// Test the response code directly
const responseCode = `const workingData = window.aiFile1Data || window.uploadedFile1 || [];
if (workingData.length === 0) return [];

const sampleRow = workingData[0] || null;
if (!sampleRow) return [];

const possibleColumns = Object.keys(sampleRow).filter(key => key.toLowerCase().includes('card') || key.toLowerCase().includes('brand') || key.toLowerCase().includes('type') || key.toLowerCase().includes('payment'));

let mastercardCount = 0;
const totalCount = workingData.length;
const cardBrandColumn = possibleColumns[0] || 'Card Brand';

workingData.forEach(row => {
  const cardValue = String(row[cardBrandColumn] || '').toLowerCase();
  if (cardValue.includes('mastercard') || cardValue.includes('master card')) mastercardCount++;
});

const percentage = totalCount > 0 ? ((mastercardCount / totalCount) * 100).toFixed(1) : '0.0';

const result = [];
result.push({});
result[0]['Analysis Type'] = 'Mastercard Count Analysis';
result[0]['Total Transactions'] = totalCount;
result[0]['Mastercard Transactions'] = mastercardCount;
result[0]['Percentage'] = percentage + '%';
result[0]['Column Analyzed'] = cardBrandColumn;
result[0]['Processing Time'] = new Date().toISOString();
result[0]['Status'] = 'Completed Successfully';
return result;`;

console.log('Testing unescaped code:');
try {
  const testFunction = new Function(responseCode);
  console.log('✅ Unescaped code is valid');
} catch (e) {
  console.log('❌ Unescaped code failed:', e.message);
}

// Now test with the escaped version from the JSON
const escapedCode = "const workingData = window.aiFile1Data || window.uploadedFile1 || [];\\nif (workingData.length === 0) return [];\\n\\nconst sampleRow = workingData[0] || null;\\nif (!sampleRow) return [];\\n\\nconst possibleColumns = Object.keys(sampleRow).filter(key => key.toLowerCase().includes('card') || key.toLowerCase().includes('brand') || key.toLowerCase().includes('type') || key.toLowerCase().includes('payment'));\\n\\nlet mastercardCount = 0;\\nconst totalCount = workingData.length;\\nconst cardBrandColumn = possibleColumns[0] || 'Card Brand';\\n\\nworkingData.forEach(row => {\\n  const cardValue = String(row[cardBrandColumn] || '').toLowerCase();\\n  if (cardValue.includes('mastercard') || cardValue.includes('master card')) mastercardCount++;\\n});\\n\\nconst percentage = totalCount > 0 ? ((mastercardCount / totalCount) * 100).toFixed(1) : '0.0';\\n\\nconst result = [];\\nresult.push({});\\nresult[0]['Analysis Type'] = 'Mastercard Count Analysis';\\nresult[0]['Total Transactions'] = totalCount;\\nresult[0]['Mastercard Transactions'] = mastercardCount;\\nresult[0]['Percentage'] = percentage + '%';\\nresult[0]['Column Analyzed'] = cardBrandColumn;\\nresult[0]['Processing Time'] = new Date().toISOString();\\nresult[0]['Status'] = 'Completed Successfully';\\nreturn result;";

console.log('\nTesting escaped code from JSON:');
try {
  const testFunction = new Function(escapedCode);
  console.log('✅ Escaped code is valid');
} catch (e) {
  console.log('❌ Escaped code failed:', e.message);
  console.log('First 200 chars:', escapedCode.substring(0, 200));
}