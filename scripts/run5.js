/**
 * Compare and process Excel files to analyze payment data.
 * 
 * @param {Object} XLSX - The SheetJS library object
 * @param {ArrayBuffer|Array} file1 - The first Excel file data (either as ArrayBuffer or array)
 * @param {ArrayBuffer|Array} file2 - The second Excel file data (either as ArrayBuffer or array)
 * @returns {Array} An array of arrays representing the processed data
 */
function compareAndDisplayData(XLSX, file1, file2) {
    // Helper function to format date for comparison
    function formatDateForComparison(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    // Helper function to parse amount strings
    function parseAmount(amount) {
        if (typeof amount === 'number') return amount;
        if (!amount) return 0;
        return parseFloat(amount.toString().replace(/[^0-9.-]+/g, '')) || 0;
    }
    
    // Define the column mappings
    const columnMappings = {
        "Date": ["Date"],
        "Customer Name": ["Customer Name", "Client"],
        "Total Transaction Amount": ["Total Transaction Amount", "Amount"],
        "Cash Discounting Amount": ["Cash Discounting Amount"],
        "Card Brand": ["Card Brand", "Name"],
        "Payment Type": ["Payment Type", "Type"]
    };
    
    // Step 1: Process First File
    let rawData;
    if (Array.isArray(file1)) {
        rawData = file1;
    } else {
        const workbook1 = XLSX.read(file1, { cellDates: true });
        const sheetName1 = workbook1.SheetNames[0];
        const worksheet1 = workbook1.Sheets[sheetName1];
        rawData = XLSX.utils.sheet_to_json(worksheet1, { header: 1 });
    }
    
    // Find indices for each column we want to keep
    const headers = rawData[0] || [];
    const columnIndices = {};
    Object.keys(columnMappings).forEach(targetColumn => {
        const possibleHeaders = columnMappings[targetColumn];
        const index = headers.findIndex(header => possibleHeaders.includes(header));
        if (index !== -1) {
            columnIndices[targetColumn] = index;
        }
    });
    
    // Process first file data
    const firstFileData = [];
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;
        
        const processedRow = {
            date: row[columnIndices["Date"]] || "",
            customerName: row[columnIndices["Customer Name"]] || "",
            totalAmount: parseAmount(row[columnIndices["Total Transaction Amount"]]),
            cashDiscountingAmount: parseAmount(row[columnIndices["Cash Discounting Amount"]]),
            cardBrand: row[columnIndices["Card Brand"]] || ""
        };
        
        if (processedRow.date && processedRow.cardBrand) {
            firstFileData.push(processedRow);
        }
    }
    
    // Step 2: Process Second File
    let secondFileData = [];
    if (file2) {
        let salesData;
        if (Array.isArray(file2)) {
            salesData = file2;
        } else {
            const workbook2 = XLSX.read(file2, { cellDates: true });
            const sheetName2 = workbook2.SheetNames[0];
            const worksheet2 = workbook2.Sheets[sheetName2];
            salesData = XLSX.utils.sheet_to_json(worksheet2, { header: 1 });
        }
        
        const salesHeaders = salesData[0] || [];
        const salesColumnIndices = {};
        Object.keys(columnMappings).forEach(targetColumn => {
            const possibleHeaders = columnMappings[targetColumn];
            const index = salesHeaders.findIndex(header => possibleHeaders.includes(header));
            if (index !== -1) {
                salesColumnIndices[targetColumn] = index;
            }
        });
        
        for (let i = 1; i < salesData.length; i++) {
            const row = salesData[i];
            if (!row || row.length === 0) continue;
            
            let cardBrand = row[salesColumnIndices["Card Brand"]] || "";
            // Map American Express to American
            if (cardBrand === "American Express") {
                cardBrand = "American";
            }
            
            const processedRow = {
                date: row[salesColumnIndices["Date"]] || "",
                customerName: row[salesColumnIndices["Customer Name"]] || "",
                totalAmount: parseAmount(row[salesColumnIndices["Total Transaction Amount"]]),
                cardBrand: cardBrand
            };
            
            if (processedRow.date && processedRow.cardBrand) {
                secondFileData.push(processedRow);
            }
        }
    }
    
    // Step 3: Create Result Data
    const resultData = [
        ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand", "Total (-) Fee", "Count", "Final Count"]
    ];
    
    // Add transaction rows
    firstFileData.forEach(row => {
        const totalMinusFee = row.totalAmount - row.cashDiscountingAmount;
        resultData.push([
            row.date,
            row.customerName,
            row.totalAmount.toFixed(2),
            row.cashDiscountingAmount.toFixed(2),
            row.cardBrand,
            totalMinusFee.toFixed(2),
            "1",
            "0"
        ]);
    });
    
    // Add empty row as separator
    resultData.push(Array(resultData[0].length).fill(""));
    
    // Add comparison section
    resultData.push(["Card Brand", "Hub Report", "Sales Report", "Difference"]);
    
    // Calculate totals by card brand
    const cardBrandTotals = {
        "Visa": { hub: 0, sales: 0 },
        "American": { hub: 0, sales: 0 },
        "Discover": { hub: 0, sales: 0 },
        "Mastercard": { hub: 0, sales: 0 }
    };
    
    // Calculate Hub Report totals
    firstFileData.forEach(row => {
        const brand = row.cardBrand;
        if (cardBrandTotals[brand]) {
            cardBrandTotals[brand].hub += row.totalAmount;
        }
    });
    
    // Calculate Sales Report totals
    secondFileData.forEach(row => {
        let brand = row.cardBrand;
        // Map American Express to American
        if (brand === "American Express") {
            brand = "American";
        }
        if (cardBrandTotals[brand]) {
            cardBrandTotals[brand].sales += row.totalAmount;
        }
    });
    
    // Add comparison rows
    Object.entries(cardBrandTotals).forEach(([brand, totals]) => {
        const difference = totals.hub - totals.sales;
        resultData.push([
            brand,
            totals.hub.toFixed(2),
            totals.sales.toFixed(2),
            difference.toFixed(2)
        ]);
    });
    
    // Add total row
    const totalHub = Object.values(cardBrandTotals).reduce((sum, val) => sum + val.hub, 0);
    const totalSales = Object.values(cardBrandTotals).reduce((sum, val) => sum + val.sales, 0);
    const totalDiff = totalHub - totalSales;
    
    resultData.push([
        "Total",
        totalHub.toFixed(2),
        totalSales.toFixed(2),
        totalDiff.toFixed(2)
    ]);
    
    return resultData;
}

export { compareAndDisplayData }; 