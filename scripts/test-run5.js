import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Import the compareAndDisplayData function using ES modules
import { compareAndDisplayData } from './run5.js';

// Read the sample files
const hubFile = './sample_hub_report.xlsx';
const salesFile = './sample_sales_report.xlsx';

try {
    // Create the hub report data
    const hubData = [
        ["Date", "TransacticTransacticAccount NrDBA", "Invoice", "Auth", "BRIC", "Sold By", "Customer Name", "Total Transaction Amount", "Payment AAuthorizeTip", "$ Discount", "% Discount", "$ Tax", "Cash Discounting Amount", "State Tax", "County Tax", "City Tax", "Custom Tax", "Payment Type", "Card Brand", "First 6", "Last 4", "Comment"],
        ["3/13/2025 19:58", "PayAnywh Chip Read", "3.13E+12 Beauty an", "2.69E+08 056240", "070M754A", "info@bea", "YADIRA RO", "196.65", "196.65", "0.00", "0%", "0.00", "6.65", "n/a", "n/a", "n/a", "n/a", "Credit Sale", "Visa", "438857", "5145", ""],
        ["3/13/2025 18:23", "PayAnywh Contactle", "3.13E+12 Beauty an", "2.69E+08", "102028", "070M74V8", "VISA CARD", "51.75", "51.75", "0.00", "0%", "0.00", "1.75", "n/a", "n/a", "n/a", "n/a", "Credit Sale", "Visa", "411774", "7080", ""],
        ["3/13/2025 17:17", "PayAnywh Chip Read", "3.13E+12 Beauty an", "2.69E+08 013248", "070M748L", "info@bea", "BITA HOURI", "51.75", "51.75", "0.00", "0%", "0.00", "1.75", "n/a", "n/a", "n/a", "n/a", "Credit Sale", "Discover", "601100", "7028", ""],
        ["3/13/2025 14:34", "PayAnywh Chip Read", "3.13E+12 Beauty an", "2.69E+08", "805464", "070M74X5", "ABDELIDA", "155.25", "155.25", "0.00", "0%", "0.00", "5.25", "n/a", "n/a", "n/a", "n/a", "Credit Sale", "American", "376762", "3016", ""],
        ["3/13/2025 14:34", "PayAnywh Keyed", "3.13E+12 Beauty an", "2.69E+08", "220068", "08UM74X5", "Unnamed", "62.10", "62.10", "0.00", "0%", "0.00", "2.10", "n/a", "n/a", "n/a", "n/a", "Credit Sale", "American", "377230", "4015", ""],
        ["3/13/2025 14:18", "PayAnywh Chip Read", "3.13E+12 Beauty an", "2.69E+08", "803349", "08UM74H6", "MONA S D", "476.10", "476.10", "0.00", "0%", "0.00", "16.10", "n/a", "n/a", "n/a", "n/a", "Credit Sale", "American", "377230", "4015", ""],
        ["3/13/2025 14:13", "PayAnywh Chip Read", "3.13E+12 Beauty an", "2.69E+08", "21314", "070M74G1", "YENNY OR", "36.23", "36.23", "0.00", "0%", "0.00", "1.23", "n/a", "n/a", "n/a", "n/a", "Credit Sale", "Visa", "434756", "8880", ""],
        ["3/13/2025 12:59", "PayAnywh Contactle", "3.13E+12 Beauty an", "2.69E+08", "88083", "08UM74W4", "VISA CARD", "36.23", "36.23", "0.00", "0%", "0.00", "1.23", "n/a", "n/a", "n/a", "n/a", "Credit Sale", "Visa", "473702", "2680", ""],
        ["3/12/2025 23:13", "PayAnywh Contactle", "3.13E+12 Beauty an", "2.69E+08", "141336", "070M72TE", "TAYLOR B", "531.99", "531.99", "0.00", "0%", "0.00", "17.99", "n/a", "n/a", "n/a", "n/a", "Credit Sale", "Visa", "416469", "5358", ""],
        ["3/12/2025 18:10", "PayAnywh Chip Read", "3.13E+12 Beauty an", "2.69E+08 01720Z", "070M72W1", "info@bea", "NICOLE SU", "62.10", "62.10", "0.00", "0%", "0.00", "2.10", "n/a", "n/a", "n/a", "n/a", "Credit Sale", "Mastercard", "521307", "7595", ""],
        ["3/12/2025 14:46", "PayAnywh Contactle", "3.13E+12 Beauty an", "2.69E+08 01018D", "070M720E", "info@bea", "Unnamed", "41.40", "41.40", "0.00", "0%", "0.00", "1.40", "n/a", "n/a", "n/a", "n/a", "Credit Sale", "Visa", "438547", "8836", ""],
        ["3/12/2025 13:38", "PayAnywh Contactle", "3.13E+12 Beauty an", "2.69E+08", "12691", "070M712G", "Unnamed", "98.33", "98.33", "0.00", "0%", "0.00", "3.33", "n/a", "n/a", "n/a", "n/a", "Credit Sale", "Visa", "400278", "751", ""],
        ["3/12/2025 11:02", "PayAnywh Contactle", "3.13E+12 Beauty an", "2.69E+08 06554C", "076M71J1", "info@bea", "Unnamed", "51.75", "51.75", "0.00", "0%", "0.00", "1.75", "n/a", "n/a", "n/a", "n/a", "Credit Sale", "Visa", "407123", "4959", ""]
    ];

    // Create the sales report data
    const salesData = [
        ["Name", "Date Closed", "Ticket ID", "Client", "Amount", "Type"],
        ["American Express", "3/13/2025", "11374", "Mona Dave", "460.00", "Payment"],
        ["American Express", "3/13/2025", "11422", "Arshvi Gesu", "60.00", "Payment"],
        ["Cash", "3/12/2025", "11093", "Helen Burgos", "35.00", "Payment"],
        ["Cash", "3/13/2025", "11072", "Lorena Ospina", "110.00", "Payment"],
        ["Visa", "3/12/2025", "11092", "Hailey Liz", "40.00", "Payment"],
        ["Visa", "3/12/2025", "11189", "Maria Polanco", "95.00", "Payment"],
        ["Visa", "3/12/2025", "11335", "Nicole Sunga", "60.00", "Payment"],
        ["Visa", "3/12/2025", "11391", "Taylor Brooks", "514.00", "Payment"],
        ["Visa", "3/12/2025", "11394", "Elicet Reynoso", "50.00", "Payment"],
        ["Visa", "3/13/2025", "10872", "Alejandra Carmona", "50.00", "Payment"],
        ["Visa", "3/13/2025", "11055", "Taleen Kakish", "35.00", "Payment"],
        ["Visa", "3/13/2025", "11382", "Adi Diaz", "150.00", "Payment"],
        ["Visa", "3/13/2025", "11409", "Yadira Rosa", "170.00", "Payment"],
        ["Visa", "3/13/2025", "11412", "Bita Hourizadeh", "50.00", "Payment"],
        ["Visa", "3/13/2025", "11418", "Yinny Ortiz", "35.00", "Payment"]
    ];
    
    console.log('Running comparison with sample files...\n');
    
    // Run the comparison
    const results = compareAndDisplayData(XLSX, hubData, salesData);
    
    // Display the results
    if (Array.isArray(results)) {
        // Display transactions
        console.log('Transactions:');
        console.log('Date\tCustomer Name\tTotal Transaction Amount\tCash Discounting Amount\tCard Brand\tTotal (-) Fee');
        
        for (let i = 1; i < results.length; i++) {
            const row = results[i];
            if (!row || row.length === 0 || row.every(cell => !cell)) {
                break;
            }
            // Format the row for display
            const formattedRow = row.map((cell, index) => {
                if (index === 2 || index === 3 || index === 5) { // Amount columns
                    return typeof cell === 'number' ? cell.toFixed(2) : cell;
                }
                return cell;
            });
            console.log(formattedRow.join('\t'));
        }
        
        // Find and display comparison section
        const comparisonIndex = results.findIndex(row => 
            row && row[0] === 'Card Brand' && row[1] === 'Hub Report'
        );
        
        if (comparisonIndex !== -1) {
            console.log('\nComparison Summary:');
            console.log('Card Brand\tHub Report\tSales Report\tDifference');
            
            for (let i = comparisonIndex + 1; i < results.length; i++) {
                const row = results[i];
                if (row && row[0]) {
                    // Format numbers in the comparison
                    const formattedRow = row.map((cell, index) => {
                        if (index > 0) { // Amount columns in comparison
                            return typeof cell === 'number' ? cell.toFixed(2) : cell;
                        }
                        return cell;
                    });
                    console.log(formattedRow.join('\t'));
                }
            }
        }
    }
    
    console.log('\nComparison completed successfully!');

} catch (error) {
    console.error('Error during comparison:', error);
} 