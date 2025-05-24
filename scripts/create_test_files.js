import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

// Create Hub Report data
const hubData = [
    ['Date', 'Customer Name', 'Total Transaction Amount', 'Cash Discounting Amount', 'Card Brand', 'Payment Type', 'First 6', 'Last 4'],
    ['05/01/2024', 'John Smith', 125.99, 3.15, 'Visa', 'Credit', '424242', '1234'],
    ['05/01/2024', 'Mary Johnson', 89.50, 2.24, 'Mastercard', 'Credit', '552233', '5678'],
    ['05/01/2024', 'Bob Wilson', 299.99, 7.50, 'American Express', 'Credit', '378282', '9012'],
    ['05/01/2024', 'Sarah Davis', 75.25, 1.88, 'Discover', 'Credit', '601100', '3456'],
    ['05/01/2024', 'Mike Brown', 199.99, 5.00, 'Visa', 'Credit', '424242', '7890'],
    ['05/01/2024', 'Lisa Anderson', 45.75, 1.14, 'Mastercard', 'Credit', '552233', '4321'],
    ['05/01/2024', 'Tom White', 159.99, 4.00, 'American Express', 'Credit', '378282', '8765'],
    ['05/01/2024', 'Emma Taylor', 229.50, 5.74, 'Visa', 'Credit', '424242', '2109']
];

// Create Sales Report data - intentionally missing some transactions to test matching
const salesData = [
    ['Date Closed', 'Name', 'Amount', 'Status'],
    ['05/01/2024', 'Visa', 122.84, 'Completed'],        // Matches John Smith (125.99 - 3.15)
    ['05/01/2024', 'Mastercard', 87.26, 'Completed'],   // Matches Mary Johnson (89.50 - 2.24)
    ['05/01/2024', 'Amex', 292.49, 'Completed'],        // Matches Bob Wilson (299.99 - 7.50)
    ['05/01/2024', 'Discover', 73.37, 'Completed'],     // Matches Sarah Davis (75.25 - 1.88)
    ['05/01/2024', 'Visa', 194.99, 'Completed'],        // Matches Mike Brown (199.99 - 5.00)
    // Missing Lisa Anderson's Mastercard transaction
    // Missing Tom White's Amex transaction
    // Missing Emma Taylor's Visa transaction
];

// Create workbooks
const hubWb = XLSX.utils.book_new();
const salesWb = XLSX.utils.book_new();

// Create worksheets
const hubWs = XLSX.utils.aoa_to_sheet(hubData);
const salesWs = XLSX.utils.aoa_to_sheet(salesData);

// Add worksheets to workbooks
XLSX.utils.book_append_sheet(hubWb, hubWs, 'Sheet1');
XLSX.utils.book_append_sheet(salesWb, salesWs, 'Sheet1');

// Write files
XLSX.writeFile(hubWb, 'sample_hub_report.xlsx');
XLSX.writeFile(salesWb, 'sample_sales_report.xlsx');

console.log('Sample files created:');
console.log('1. sample_hub_report.xlsx');
console.log('2. sample_sales_report.xlsx');
console.log('\nThese files contain test data with:');
console.log('- 8 transactions in Hub Report');
console.log('- 5 matching transactions in Sales Report');
console.log('- 3 unmatched transactions to test reconciliation'); 