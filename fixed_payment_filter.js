// Script Name: Simple Payment Filter Test (Fixed for Script Testing Environment)
// Show payments over $100 from Payment Hub file

console.log('🚀 Starting simple payment filter test...');

// Data is passed directly as parameters, not through window.parseFiles()
if (!file1Data || !file1Data.data) {
  console.error('File 1 is required');
  return { success: false, error: 'File 1 is required' };
}

const data = file1Data.data;
console.log('📊 Total rows:', data.length);
console.log('📊 Available columns:', Object.keys(data[0] || {}));

// Find the Payment Amount column manually (no window.findColumn available)
function findColumn(row, possibleNames) {
  for (const name of possibleNames) {
    if (row.hasOwnProperty(name)) {
      return name;
    }
    // Try case-insensitive match
    const keys = Object.keys(row);
    const match = keys.find(key => key.toLowerCase() === name.toLowerCase());
    if (match) return match;
  }
  return null;
}

const paymentCol = findColumn(data[0], ['Payment Amount', 'Amount', 'Total', 'payment_amount', 'PAYMENT AMOUNT']);
if (!paymentCol) {
  const errorMsg = 'Could not find Payment Amount column. Available: ' + Object.keys(data[0]).join(', ');
  console.error(errorMsg);
  return { success: false, error: errorMsg };
}

console.log('✅ Found Payment Amount column:', paymentCol);

// Filter for payments over $100
const results = [];
let skippedRows = 0;

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  
  let amountStr = row[paymentCol];
  if (!amountStr) {
    skippedRows++;
    continue;
  }
  
  // Clean the amount string (remove $, commas, etc.)
  const cleanAmount = amountStr.toString().replace(/[$,\s]/g, '');
  const amount = parseFloat(cleanAmount);
  
  if (isNaN(amount)) {
    skippedRows++;
    continue;
  }
  
  if (amount > 100) {
    results.push({
      'Row #': i + 1,
      'Date': row['Date'] || row['date'] || '',
      'Customer Name': row['Customer Name'] || row['customer_name'] || row['Name'] || '',
      'Payment Amount': '$' + amount.toFixed(2),
      'Card Brand': row['Card Brand'] || row['card_brand'] || row['Brand'] || ''
    });
  }
}

// Sort results by amount (highest first)
results.sort((a, b) => {
  const amountA = parseFloat(a['Payment Amount'].replace('$', ''));
  const amountB = parseFloat(b['Payment Amount'].replace('$', ''));
  return amountB - amountA;
});

const totalAmount = results.reduce((sum, row) => {
  return sum + parseFloat(row['Payment Amount'].replace('$', ''));
}, 0);

const summary = `Found ${results.length} payments over $100.00 (Total: $${totalAmount.toFixed(2)})${skippedRows > 0 ? `. Skipped ${skippedRows} rows with invalid amounts.` : ''}`;

console.log('✅ Test completed!');
console.log(summary);

// Return results in the expected format
const result = {
  title: 'Payments Over $100',
  summary: summary,
  data: results,
  totalRows: results.length
};

// Set global result for the testing environment
if (typeof window !== 'undefined') {
  window.lastTestResults = result;
}

return result;