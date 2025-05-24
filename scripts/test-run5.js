import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Import the compareAndDisplayData function using ES modules
import { compareAndDisplayData } from './run5.js';

// Create sample data for testing
function createSampleExcel(data, filename) {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename);
    return wb;
}

// Sample Hub Report data
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

// Sample Sales Report data
const salesData = [
    ['Date Closed', 'Name', 'Amount', 'Status'],
    ['05/01/2024', 'Visa', 122.84, 'Completed'],
    ['05/01/2024', 'Visa', 194.99, 'Completed'],
    ['05/01/2024', 'Visa', 223.76, 'Completed'],
    ['05/01/2024', 'Mastercard', 87.26, 'Completed'],
    ['05/01/2024', 'Mastercard', 44.61, 'Completed'],
    ['05/01/2024', 'Amex', 292.49, 'Completed'],
    ['05/01/2024', 'Amex', 155.99, 'Completed'],
    ['05/01/2024', 'Discover', 73.37, 'Completed']
];

// Create temporary Excel files
const hubFile = 'test_hub_report.xlsx';
const salesFile = 'test_sales_report.xlsx';

try {
    // Create test Excel files
    createSampleExcel(hubData, hubFile);
    createSampleExcel(salesData, salesFile);

    // Read the files as ArrayBuffer
    const hubBuffer = fs.readFileSync(hubFile);
    const salesBuffer = fs.readFileSync(salesFile);

    // Process the data
    const results = compareAndDisplayData(XLSX, hubBuffer, salesBuffer);

    // Display results in the exact format requested
    console.log('Date\tCustomer Name\tTotal Transaction Amount\tCash Discounting Amount\tCard Brand\tTotal (-) Fee');
    
    // Print transaction rows until we hit empty rows
    for (let i = 1; i < results.length; i++) {
        const row = results[i];
        if (row.every(cell => cell === '')) {
            break;
        }
        // Format numbers to 2 decimal places
        const formattedRow = row.map((cell, index) => {
            if (index === 2 || index === 3 || index === 5) { // Amount columns
                return typeof cell === 'number' ? cell.toFixed(2) : cell;
            }
            return cell;
        });
        console.log(formattedRow.join('\t'));
    }

    // Find the comparison section (after empty rows)
    let comparisonIndex = results.findIndex((row, index) => 
        index > 0 && row[0] === 'Card Brand' && row[1] === 'Hub Report'
    );

    if (comparisonIndex !== -1) {
        console.log('\nCard Brand\tHub Report\tSales Report\tDifference');
        
        // Print comparison rows
        for (let i = comparisonIndex + 1; i < results.length; i++) {
            const row = results[i];
            if (row[0]) {  // Only print rows with a card brand
                // Format numbers to 2 decimal places
                const formattedRow = [
                    row[0],
                    typeof row[1] === 'number' ? row[1].toFixed(2) : row[1],
                    typeof row[2] === 'number' ? row[2].toFixed(2) : row[2],
                    typeof row[3] === 'number' ? row[3].toFixed(2) : row[3]
                ];
                console.log(formattedRow.join('\t'));
            }
        }
    }

} catch (error) {
    console.error('Error:', error);
} finally {
    // Clean up temporary files
    try {
        fs.unlinkSync(hubFile);
        fs.unlinkSync(salesFile);
    } catch (e) {
        console.error('Error cleaning up files:', e);
    }
} 