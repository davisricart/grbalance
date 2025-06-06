/**
 * Compare and process Excel files to analyze payment data.
 * 
 * @param {Object} XLSX - The SheetJS library object
 * @param {ArrayBuffer} file1 - The first uploaded Excel file data
 * @param {ArrayBuffer} file2 - The second uploaded Excel file data
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
    
    // Helper function to normalize card brand names
    function normalizeCardBrand(brand) {
        brand = (brand || "").replace("Credit ", "").trim();
        if (brand === "American") {
            return "American Express";
        }
        return brand;
    }

    // Helper function to normalize customer name
    function normalizeCustomerName(name) {
        name = (name || "").trim().toUpperCase();
        if (name === "VISA CARD" || name === "VISA CARDHOLDER") {
            return "VISA CARDHOLDER";
        }
        return name;
    }
    
    // Define the allowed columns
    const allowedColumns = [
        "Date",
        "Transaction Source",
        "Transaction Type",
        "Account Number",
        "DBA",
        "Invoice",
        "Auth",
        "BRIC",
        "Sold By",
        "Customer Name",
        "Total Transaction Amount",
        "Payment Amount",
        "Authorized Amount",
        "Tip",
        "$ Discount",
        "% Discount",
        "$ Tax",
        "Cash Discounting Amount",
        "State Tax",
        "County Tax",
        "City Tax",
        "Custom Tax",
        "Payment Type",
        "Card Brand",
        "First 6",
        "Last 4",
        "Comment"
    ];
    
    // Step 1: Process First File
    // Parse the first Excel file
    const workbook1 = XLSX.read(file1, {
        cellDates: true,
        dateNF: 'yyyy-mm-dd'
    });
    
    // Get first sheet
    const sheetName1 = workbook1.SheetNames[0];
    const worksheet1 = workbook1.Sheets[sheetName1];
    
    // Convert worksheet to JSON with headers
    const rawData = XLSX.utils.sheet_to_json(worksheet1, { header: 1 });
    
    // Filter the columns to keep only allowed ones
    const headers = rawData[0] || [];
    const columnsToKeepIndices = [];
    
    // Find indices of allowed columns
    headers.forEach((header, index) => {
        if (allowedColumns.includes(header)) {
            columnsToKeepIndices.push(index);
        }
    });
    
    // Create filtered data with only allowed columns
    const filteredData = [];
    
    // Add filtered headers
    const filteredHeaders = columnsToKeepIndices.map(index => headers[index]);
    filteredData.push(filteredHeaders);
    
    // Add filtered rows
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        const filteredRow = columnsToKeepIndices.map(index => 
            index < row.length ? row[index] : "");
        filteredData.push(filteredRow);
    }
    
    // Convert filtered data to JSON format (array of objects with headers as keys)
    const jsonData1 = [];
    for (let i = 1; i < filteredData.length; i++) {
        const obj = {};
        filteredData[0].forEach((header, index) => {
            obj[header] = filteredData[i][index];
        });
        jsonData1.push(obj);
    }
    
    // Step 2: Process Second File (if provided)
    let jsonData2 = [];
    let file2Headers = [];
    let dateClosedIndex = -1;
    let nameIndex = -1;
    let amountIndex = -1;
    
    if (file2) {
        // Parse the second Excel file
        const workbook2 = XLSX.read(file2, {
            cellDates: true,
            dateNF: 'yyyy-mm-dd'
        });
        
        // Get first sheet
        const sheetName2 = workbook2.SheetNames[0];
        const worksheet2 = workbook2.Sheets[sheetName2];
        
        // Convert worksheet to JSON with headers
        const data = XLSX.utils.sheet_to_json(worksheet2, { header: 1 });
        
        // Store headers and find required columns
        file2Headers = data[0] || [];
        
        dateClosedIndex = file2Headers.findIndex(header => 
            typeof header === "string" && header.trim().toLowerCase() === "date closed"
        );
        
        nameIndex = file2Headers.findIndex(header => 
            typeof header === "string" && header.trim().toLowerCase() === "name"
        );
        
        amountIndex = file2Headers.findIndex(header => 
            typeof header === "string" && header.trim().toLowerCase() === "amount"
        );
        
        // Get data rows (skip header)
        jsonData2 = data.slice(1);
        
        // Convert amount values to numbers
        if (amountIndex !== -1) {
            jsonData2.forEach(row => {
                if (amountIndex < row.length && row[amountIndex] !== undefined) {
                    let amount = row[amountIndex];
                    if (typeof amount === "string") {
                        amount = amount.replace(/[^0-9.-]+/g, "");
                    }
                    row[amountIndex] = parseFloat(amount) || 0;
                }
            });
        }
    }
    
    // Step 3: Process First File Data
    // Define columns to keep from the filtered data
    const columnsToKeep = ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand"];
    const newColumns = ["Total (-) Fee", "Count", "Final Count"];
    
    // Create result array starting with header
    const resultData = [columnsToKeep.concat(newColumns)];
    
    // Store processed first file data for comparisons
    const firstFileData = [];
    
    // Process each row of first file
    jsonData1.forEach(row => {
        const filteredRow = [];
        let firstFileDate = null;
        let cardBrand = normalizeCardBrand(row["Card Brand"]);
        let transactionAmount = parseFloat(row["Total Transaction Amount"]) || 0;
        let discountAmount = parseFloat(row["Cash Discounting Amount"]) || 0;
        let customerName = normalizeCustomerName(row["Customer Name"]);
        
        // Filter columns
        columnsToKeep.forEach(column => {
            if (column === "Date") {
                if (row[column] instanceof Date) {
                    firstFileDate = row[column];
                    filteredRow.push(formatDateForComparison(row[column]));
                } else {
                    firstFileDate = new Date(row[column]);
                    filteredRow.push(row[column]);
                }
            } else if (column === "Card Brand") {
                filteredRow.push(cardBrand);
            } else if (column === "Customer Name") {
                filteredRow.push(customerName);
            } else if (column === "Total Transaction Amount") {
                filteredRow.push(transactionAmount.toFixed(2));
            } else if (column === "Cash Discounting Amount") {
                filteredRow.push(discountAmount.toFixed(2));
            } else {
                filteredRow.push(row[column]);
            }
        });
        
        // Calculate Total (-) Fee
        const totalMinusFee = transactionAmount - discountAmount;
        
        // Add new columns
        filteredRow.push(totalMinusFee.toFixed(2)); // Total (-) Fee
        filteredRow.push("1"); // Count
        filteredRow.push("0"); // Final Count
        
        // Store data for comparison
        firstFileData.push({
            date: firstFileDate,
            cardBrand: cardBrand,
            amount: transactionAmount,
            customerName: customerName
        });
        
        resultData.push(filteredRow);
    });
    
    // Add empty row as separator
    resultData.push(Array(resultData[0].length).fill(""));
    
    // Add comparison section header
    resultData.push(["Card Brand", "Hub Report", "Sales Report", "Difference"]);
    
    // Calculate totals by card brand
    const cardBrandTotals = {
        "Visa": { hub: 0, sales: 0 },
        "American Express": { hub: 0, sales: 0 },
        "Discover": { hub: 0, sales: 0 },
        "Mastercard": { hub: 0, sales: 0 }
    };
    
    // Calculate Hub Report totals
    firstFileData.forEach(data => {
        const brand = normalizeCardBrand(data.cardBrand);
        if (cardBrandTotals[brand]) {
            cardBrandTotals[brand].hub += data.amount;
        }
    });
    
    // Calculate Sales Report totals (if file2 provided)
    if (dateClosedIndex !== -1 && nameIndex !== -1 && amountIndex !== -1) {
        jsonData2.forEach(row => {
            if (row.length > amountIndex) {
                const brand = normalizeCardBrand(row[nameIndex]);
                const amount = parseFloat(row[amountIndex]) || 0;
                
                if (cardBrandTotals[brand]) {
                    cardBrandTotals[brand].sales += amount;
                }
            }
        });
    }
    
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
    
    // Calculate and add total row
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

// Helper functions
function cleanCustomerName(name) {
    return name.trim().toUpperCase();
}

function cleanCardBrand(brand) {
    return brand.replace("Credit ", "").trim();
}

function formatNumber(num) {
    return parseFloat(num).toFixed(2);
}

export { compareAndDisplayData };