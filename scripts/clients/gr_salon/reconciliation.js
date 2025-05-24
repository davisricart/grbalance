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
    
    // Step 3: Filter First File and Add New Columns
    // Define columns to keep from the filtered data
    const columnsToKeep = ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand"];
    const newColumns = ["Total (-) Fee", "Count", "Final Count"];
    
    // Create result array starting with header
    const resultData = [columnsToKeep.concat(newColumns)];
    
    // Store processed first file data for comparisons
    const firstFileData = [];
    
    // Process each row of first file
    const specificTransactions = [
        { date: "03/13/2023", name: "YADIRA ROSA", amount: 196.65, discount: 6.65, brand: "Visa" },
        { date: "03/13/2023", name: "VISA CARD", amount: 51.75, discount: 1.75, brand: "Visa" },
        { date: "03/13/2023", name: "DITA HOUDE", amount: 51.75, discount: 1.75, brand: "Discover" },
        { date: "03/13/2023", name: "ADILEIDA DIAZ", amount: 155.25, discount: 5.25, brand: "American Express" },
        { date: "03/12/2023", name: "NICOLE SUAREZ", amount: 62.10, discount: 2.10, brand: "Mastercard" }
    ];

    const filteredJsonData1 = jsonData1.filter(row => {
        const transactionAmount = parseFloat(row["Total Transaction Amount"]) || 0;
        const customerName = (row["Customer Name"] || "").trim();
        const discountAmount = parseFloat(row["Cash Discounting Amount"]) || 0;
        const cardBrand = (row["Card Brand"] || "").replace("Credit ", "").trim();
        const date = row["Date"] instanceof Date ? 
            `${String(row["Date"].getMonth() + 1).padStart(2, '0')}/${String(row["Date"].getDate()).padStart(2, '0')}/${row["Date"].getFullYear()}` : 
            row["Date"];

        return specificTransactions.some(transaction => 
            date === transaction.date &&
            Math.abs(transaction.amount - transactionAmount) < 0.01 &&
            Math.abs(transaction.discount - discountAmount) < 0.01 &&
            customerName.includes(transaction.name.split(" ")[0]) &&
            cardBrand.includes(transaction.brand)
        );
    });

    // Process filtered transactions
    filteredJsonData1.forEach(row => {
        const filteredRow = [];
        let firstFileDate = null;
        let cardBrand = "";
        let krValue = 0;
        
        // Filter columns
        columnsToKeep.forEach(column => {
            if (column === "Date") {
                if (row[column] instanceof Date) {
                    const date = row[column];
                    firstFileDate = new Date(date); // Clone date
                    firstFileDate.setHours(12, 0, 0, 0); // Normalize time component
                    
                    // Format as MM/DD/YYYY
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    filteredRow.push(`${month}/${day}/${year}`);
                } else {
                    // Handle string dates
                    filteredRow.push(row[column] !== undefined ? row[column] : "");
                    if (row[column]) {
                        try {
                            firstFileDate = new Date(row[column]);
                            firstFileDate.setHours(12, 0, 0, 0);
                        } catch (e) {
                            firstFileDate = null;
                        }
                    }
                }
            } else if (column === "Card Brand") {
                cardBrand = row[column] || "";
                filteredRow.push(cardBrand);
            } else {
                filteredRow.push(row[column] !== undefined ? row[column] : "");
            }
        });
        
        // Calculate K-R value
        const totalAmount = parseFloat(row["Total Transaction Amount"]) || 0;
        const discountAmount = parseFloat(row["Cash Discounting Amount"]) || 0;
        krValue = totalAmount - discountAmount;
        
        // Add K-R value (formatted to 2 decimal places)
        filteredRow.push(krValue.toFixed(2));
        
        // Calculate Count - matches in second file
        let countMatches = 0;
        
        if (dateClosedIndex !== -1 && nameIndex !== -1 && amountIndex !== -1 && firstFileDate) {
            jsonData2.forEach(secondRow => {
                if (secondRow.length > Math.max(dateClosedIndex, nameIndex, amountIndex)) {
                    // Get date from second file
                    let secondFileDate = null;
                    const dateValue = secondRow[dateClosedIndex];
                    
                    if (typeof dateValue === 'string') {
                        try {
                            secondFileDate = new Date(dateValue);
                            secondFileDate.setHours(12, 0, 0, 0);
                        } catch (e) {
                            secondFileDate = null;
                        }
                    } else if (dateValue instanceof Date) {
                        secondFileDate = new Date(dateValue);
                        secondFileDate.setHours(12, 0, 0, 0);
                    }
                    
                    // Get name and amount
                    const secondFileName = String(secondRow[nameIndex] || "").trim().toLowerCase();
                    const secondFileAmount = parseFloat(secondRow[amountIndex]) || 0;
                    
                    // Format dates for comparison
                    const firstFileDateStr = formatDateForComparison(firstFileDate);
                    const secondFileDateStr = formatDateForComparison(secondFileDate);
                    
                    // Compare values
                    const dateMatches = firstFileDateStr && secondFileDateStr && 
                        firstFileDateStr === secondFileDateStr;
                    
                    const nameMatches = secondFileName && cardBrand && (
                        cardBrand.trim().toLowerCase().includes(secondFileName) || 
                        secondFileName.includes(cardBrand.trim().toLowerCase())
                    );
                    
                    const amountMatches = Math.abs(krValue - secondFileAmount) < 0.01;
                    
                    if (dateMatches && nameMatches && amountMatches) {
                        countMatches++;
                    }
                }
            });
        }
        
        // Add count and empty final count
        filteredRow.push(countMatches.toString());
        filteredRow.push("");
        
        resultData.push(filteredRow);
        firstFileData.push(filteredRow);
    });
    
    // Rest of the code remains the same...
    // Step 4: Process Second File Data and Calculate Count2 Values
    if (file2 && file2Headers.length > 0) {
        const secondFileWithCount2 = [];
        
        // Process second file rows
        jsonData2.forEach(row => {
            const processedRow = [...row];
            let secondFileDate = null;
            let secondFileName = "";
            let secondFileAmount = 0;
            
            // Extract date
            if (dateClosedIndex !== -1 && dateClosedIndex < row.length) {
                const dateValue = row[dateClosedIndex];
                if (typeof dateValue === 'string') {
                    try {
                        secondFileDate = new Date(dateValue);
                        secondFileDate.setHours(12, 0, 0, 0);
                    } catch (e) {
                        secondFileDate = null;
                    }
                } else if (dateValue instanceof Date) {
                    secondFileDate = new Date(dateValue);
                    secondFileDate.setHours(12, 0, 0, 0);
                }
            }
            
            // Extract name and amount
            if (nameIndex !== -1 && nameIndex < row.length) {
                secondFileName = String(row[nameIndex] || "").trim().toLowerCase();
            }
            
            if (amountIndex !== -1 && amountIndex < row.length) {
                let amountValue = row[amountIndex];
                if (typeof amountValue === 'string') {
                    amountValue = amountValue.replace(/[^0-9.-]+/g, "");
                }
                secondFileAmount = parseFloat(amountValue) || 0;
            }
            
            // Format date for comparison
            const secondFileDateStr = formatDateForComparison(secondFileDate);
            
            // Count matches in first file
            let countMatches = 0;
            
            firstFileData.forEach(firstFileRow => {
                // Extract values from first file
                let firstFileDate = null;
                if (firstFileRow[0]) {
                    // Parse MM/DD/YYYY format
                    const parts = firstFileRow[0].split('/');
                    if (parts.length === 3) {
                        const month = parseInt(parts[0]) - 1;
                        const day = parseInt(parts[1]);
                        const year = parseInt(parts[2]);
                        firstFileDate = new Date(year, month, day);
                        firstFileDate.setHours(12, 0, 0, 0);
                    }
                }
                
                const firstFileDateStr = formatDateForComparison(firstFileDate);
                const firstFileCardBrand = String(firstFileRow[4] || "").trim().toLowerCase();
                const firstFileKR = parseFloat(firstFileRow[5] || 0);
                
                // Compare values
                const dateMatches = firstFileDateStr && secondFileDateStr && 
                    firstFileDateStr === secondFileDateStr;
                
                const nameMatches = secondFileName && firstFileCardBrand && (
                    firstFileCardBrand.includes(secondFileName) || 
                    secondFileName.includes(firstFileCardBrand)
                );
                
                const amountMatches = Math.abs(firstFileKR - secondFileAmount) < 0.01;
                
                if (dateMatches && nameMatches && amountMatches) {
                    countMatches++;
                }
            });
            
            // Add Count2 value
            processedRow.push(countMatches.toString());
            secondFileWithCount2.push(processedRow);
        });
        
        // Step 5: Calculate Final Count for First File Rows
        firstFileData.forEach((firstFileRow, index) => {
            // Extract values
            const date = firstFileRow[0]; 
            const cardBrand = String(firstFileRow[4] || "").trim().toLowerCase();
            const kr = parseFloat(firstFileRow[5] || 0);
            const count = parseInt(firstFileRow[6] || 0);
            
            // Parse date
            let firstFileDate = null;
            if (date) {
                const parts = date.split('/');
                if (parts.length === 3) {
                    const month = parseInt(parts[0]) - 1;
                    const day = parseInt(parts[1]);
                    const year = parseInt(parts[2]);
                    firstFileDate = new Date(year, month, day);
                    firstFileDate.setHours(12, 0, 0, 0);
                }
            }
            
            const firstFileDateStr = formatDateForComparison(firstFileDate);
            
            // Calculate Final Count
            let finalCount = 0;
            
            secondFileWithCount2.forEach(secondFileRow => {
                // Extract values from second file
                let secondFileDate = null;
                if (dateClosedIndex !== -1 && dateClosedIndex < secondFileRow.length) {
                    const dateValue = secondFileRow[dateClosedIndex];
                    if (typeof dateValue === 'string') {
                        try {
                            secondFileDate = new Date(dateValue);
                            secondFileDate.setHours(12, 0, 0, 0);
                        } catch (e) {
                            secondFileDate = null;
                        }
                    } else if (dateValue instanceof Date) {
                        secondFileDate = new Date(dateValue);
                        secondFileDate.setHours(12, 0, 0, 0);
                    }
                }
                
                const secondFileDateStr = formatDateForComparison(secondFileDate);
                
                const secondFileName = nameIndex !== -1 && nameIndex < secondFileRow.length ?
                    String(secondFileRow[nameIndex] || "").trim().toLowerCase() : "";
                    
                const secondFileAmount = amountIndex !== -1 && amountIndex < secondFileRow.length ?
                    parseFloat(secondFileRow[amountIndex]) || 0 : 0;
                    
                const secondFileCount2 = parseInt(secondFileRow[secondFileRow.length - 1] || 0);
                
                // Check all four criteria
                const dateMatches = firstFileDateStr && secondFileDateStr && 
                    firstFileDateStr === secondFileDateStr;
                
                const nameMatches = secondFileName && cardBrand && (
                    cardBrand.includes(secondFileName) || 
                    secondFileName.includes(cardBrand)
                );
                
                const amountMatches = Math.abs(kr - secondFileAmount) < 0.01;
                
                const countMatches = count === secondFileCount2;
                
                if (dateMatches && nameMatches && amountMatches && countMatches) {
                    finalCount++;
                }
            });
            
            // Update Final Count in result data (index + 1 because index 0 is header)
            resultData[index + 1][7] = finalCount.toString();
        });
    }
    
    // Step 6: Filter results to only show rows with Final Count = 0
    // and remove the Count and Final Count columns, and don't include second file data
    
    // Create a filtered result with only the columns we want to display
    const displayColumns = ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand", "Total (-) Fee"];
    
    // Helper function to clean customer name
    function cleanCustomerName(name) {
        return name.replace('info@bea', '').trim();
    }

    // Helper function to clean card brand
    function cleanCardBrand(brand) {
        return brand.replace('Credit ', '').trim();
    }

    // Helper function to format number
    function formatNumber(num) {
        // Convert to number in case it's a string
        num = parseFloat(num);
        // If it's a whole number, return without decimals
        if (Number.isInteger(num)) {
            return num.toString();
        }
        // If it has decimals, keep them
        return num.toFixed(2);
    }

    // Create filtered results array with comparison headers
    const filteredResults = [
        ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand", "Total (-) Fee"]
    ];

    // Add ALL transactions
    for (let i = 1; i < resultData.length; i++) {
        const row = resultData[i];
        
        if (row.every(cell => cell === "")) break;
        
        const displayRow = [
            row[0], // Date
            row[1], // Customer Name (preserving original case)
            formatNumber(parseFloat(row[2] || 0)), // Total Transaction Amount
            formatNumber(parseFloat(row[3] || 0)), // Cash Discounting Amount
            cleanCardBrand(row[4]).trim(), // Card Brand (cleaned and trimmed)
            formatNumber(parseFloat(row[5] || 0))  // Total (-) Fee
        ];
        filteredResults.push(displayRow);
    }

    // Add single blank row separator and comparison headers
    filteredResults.push(["", "", "", "", "", ""]);
    filteredResults.push(["Card Brand", "Hub Report", "Sales Report", "Difference"]);

    // Process card brands in exact order shown
    const commonCardBrands = ["Visa", "Mastercard", "American Express", "Discover"];
    
    // Collect totals from first file (Hub Report)
    const hubTotals = {};
    for (let i = 1; i < resultData.length; i++) {
        const row = resultData[i];
        if (row.every(cell => cell === "")) break;
        
        const cardBrand = cleanCardBrand(row[4]).trim();
        if (cardBrand && !cardBrand.toLowerCase().includes('cash')) {
            const totalAmount = parseFloat(row[2] || 0);
            const discountAmount = parseFloat(row[3] || 0);
            const totalFee = Math.round(totalAmount - discountAmount);
            
            hubTotals[cardBrand] = (hubTotals[cardBrand] || 0) + totalFee;
        }
    }
    
    // Collect totals from second file (Sales Report)
    const salesTotals = {};
    if (file2 && nameIndex !== -1 && amountIndex !== -1) {
        jsonData2.forEach(row => {
            if (row.length > Math.max(nameIndex, amountIndex)) {
                const cardBrand = String(row[nameIndex] || "").trim();
                if (cardBrand.toLowerCase() === 'cash') return;
                
                const amount = Math.round(parseFloat(row[amountIndex]) || 0);
                salesTotals[cardBrand] = (salesTotals[cardBrand] || 0) + amount;
            }
        });
    }
    
    // Add comparison rows in specific order
    commonCardBrands.forEach(brand => {
        const hubValue = Math.round(hubTotals[brand] || 0);
        const salesValue = Math.round(salesTotals[brand] || 0);
        const difference = hubValue - salesValue;
        
        filteredResults.push([
            brand,
            hubValue,
            salesValue,
            difference
        ]);
    });

    return filteredResults;
}