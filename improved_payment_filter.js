// Script Name: Enhanced Payment Filter Test
// Show payments over $100 from Payment Hub file with improved error handling

console.log('🚀 Starting enhanced payment filter test...');

const files = await window.parseFiles();
if (!files || !files.data1) {
  window.showError('File 1 is required');
  return;
}

const data = files.data1;
if (!data || data.length === 0) {
  window.showError('File 1 is empty or invalid');
  return;
}

console.log('📊 Available columns:', Object.keys(data[0] || {}));

// Find the Payment Amount column (more flexible matching)
const paymentCol = window.findColumn(data[0], [
  'Payment Amount', 'Amount', 'Total', 'payment_amount', 
  'PAYMENT AMOUNT', 'Payment', 'Charge', 'Value'
]);

if (!paymentCol) {
  window.showError('Could not find Payment Amount column. Available columns: ' + Object.keys(data[0]).join(', '));
  return;
}

console.log('✅ Found Payment Amount column:', paymentCol);

// Filter for payments over $100 with better data handling
const results = [];
let skippedRows = 0;

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  
  // Handle different amount formats ($100.00, 100.00, "100", etc.)
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
      'Card Brand': row['Card Brand'] || row['card_brand'] || row['Brand'] || '',
      'Original Amount': row[paymentCol] // Show original format for verification
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

window.showResults(results, {
  title: 'Payments Over $100',
  summary: `Found ${results.length} payments over $100.00 (Total: $${totalAmount.toFixed(2)})${skippedRows > 0 ? `. Skipped ${skippedRows} rows with invalid amounts.` : ''}`
});

console.log(`✅ Test completed! Found ${results.length} payments, skipped ${skippedRows} invalid rows`);