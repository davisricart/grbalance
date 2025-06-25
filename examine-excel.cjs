const XLSX = require('xlsx');

// Examine Sales Totals.xlsx
console.log('=== SALES TOTALS.XLSX ===');
try {
  const wb1 = XLSX.readFile('sample-data/Sales Totals.xlsx');
  const ws1 = wb1.Sheets[wb1.SheetNames[0]];
  const data1 = XLSX.utils.sheet_to_json(ws1, {header: 1});
  
  console.log('Headers:', data1[0]);
  console.log('Total rows:', data1.length);
  
  if (data1.length > 1) {
    console.log('Sample data row 1:', data1[1]);
    console.log('Sample data row 2:', data1[2] || 'N/A');
  }
} catch (error) {
  console.error('Error reading Sales Totals:', error.message);
}

console.log('\n=== PAYMENTS HUB TRANSACTION.XLSX ===');
try {
  const wb2 = XLSX.readFile('sample-data/Payments Hub Transaction.xlsx');
  const ws2 = wb2.Sheets[wb2.SheetNames[0]];
  const data2 = XLSX.utils.sheet_to_json(ws2, {header: 1});
  
  console.log('Headers:', data2[0]);
  console.log('Total rows:', data2.length);
  
  if (data2.length > 1) {
    console.log('Sample data row 1:', data2[1]);
    console.log('Sample data row 2:', data2[2] || 'N/A');
  }
} catch (error) {
  console.error('Error reading Payments Hub:', error.message);
} 