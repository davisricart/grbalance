exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔍 Function called');
    
    let body;
    try {
      body = JSON.parse(event.body);
      console.log('✅ Body parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { script, file1Data, file2Data } = body;
    
    console.log('📜 Script:', script);
    console.log('📄 File1 length:', file1Data?.length || 0);
    console.log('📄 File2 length:', file2Data?.length || 0);

    if (!script || !file1Data) {
      console.error('❌ Missing parameters:', { script: !!script, file1Data: !!file1Data });
      throw new Error('Missing required parameters');
    }

    // Simple validation
    if (!Array.isArray(file1Data)) {
      console.error('❌ Invalid data format');
      throw new Error('File data must be arrays');
    }

    if (file1Data.length < 2) {
      console.error('❌ Insufficient data');
      throw new Error('Files must have headers and at least one data row');
    }

    console.log('🔄 Starting reconciliation process...');

    // Execute reconciliation using the standard logic
    const result = await executeStandardReconciliation(file1Data, file2Data);

    console.log('✅ Reconciliation completed, rows:', result?.length || 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        result: result,
        message: 'Script executed successfully'
      })
    };

  } catch (error) {
    console.error('❌ Function error:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Script execution failed',
        details: error.message
      })
    };
  }
};

async function executeStandardReconciliation(file1Data, file2Data) {
  try {
    console.log('🔄 Processing files with standard reconciliation logic...');
    
    // Helper function to format date for comparison
    function formatDateForComparison(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    // Define the allowed columns
    const allowedColumns = [
        "Date", "Transaction Source", "Transaction Type", "Account Number", "DBA",
        "Invoice", "Auth", "BRIC", "Sold By", "Customer Name", "Total Transaction Amount",
        "Payment Amount", "Authorized Amount", "Tip", "$ Discount", "% Discount",
        "$ Tax", "Cash Discounting Amount", "State Tax", "County Tax", "City Tax",
        "Custom Tax", "Payment Type", "Card Brand", "First 6", "Last 4", "Comment"
    ];
    
    // Get headers from file1Data
    const headers = file1Data[0] || [];
    const columnsToKeepIndices = [];
    
    // Find indices of allowed columns
    headers.forEach((header, index) => {
        if (allowedColumns.includes(header)) {
            columnsToKeepIndices.push(index);
        }
    });
    
    console.log('📊 Keeping', columnsToKeepIndices.length, 'columns from file1');
    
    // Create filtered data with only allowed columns
    const filteredData = [];
    
    // Add filtered headers
    const filteredHeaders = columnsToKeepIndices.map(index => headers[index]);
    filteredData.push(filteredHeaders);
    
    // Add filtered rows
    for (let i = 1; i < file1Data.length; i++) {
        const row = file1Data[i];
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
    
    console.log('📊 JSON data1 created:', jsonData1.length, 'rows');
    
    // Process Second File (if provided)
    let jsonData2 = [];
    let file2Headers = [];
    let dateClosedIndex = -1;
    let nameIndex = -1;
    let amountIndex = -1;
    
    if (file2Data && Array.isArray(file2Data) && file2Data.length > 0) {
        // Store headers and find required columns
        file2Headers = file2Data[0] || [];
        
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
        jsonData2 = file2Data.slice(1);
        
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
        
        // Calculate Total (-) Fee
        const totalAmount = parseFloat(row["Total Transaction Amount"]) || 0;
        const cashDiscount = parseFloat(row["Cash Discounting Amount"]) || 0;
        krValue = totalAmount - cashDiscount;
        filteredRow.push(parseFloat(krValue.toFixed(2)));
        
        // Initialize Count and Final Count
        filteredRow.push(1); // Count
        filteredRow.push(1); // Final Count
        
        // Store for comparisons
        firstFileData.push({
            date: firstFileDate,
            cardBrand: cardBrand,
            krValue: krValue,
            rowIndex: resultData.length
        });
        
        resultData.push(filteredRow);
    });
    
    console.log('✅ Basic processing completed, result rows:', resultData.length - 1);
    
    // Process comparisons with second file if available
    if (jsonData2.length > 0 && dateClosedIndex !== -1 && nameIndex !== -1 && amountIndex !== -1) {
        console.log('🔄 Processing second file comparisons...');
        
        // Process each row in the second file
        jsonData2.forEach(row2 => {
            if (row2.length > Math.max(dateClosedIndex, nameIndex, amountIndex)) {
                let secondFileDate = null;
                
                // Parse date from second file
                if (row2[dateClosedIndex] instanceof Date) {
                    secondFileDate = new Date(row2[dateClosedIndex]);
                    secondFileDate.setHours(12, 0, 0, 0);
                } else if (row2[dateClosedIndex]) {
                    try {
                        secondFileDate = new Date(row2[dateClosedIndex]);
                        secondFileDate.setHours(12, 0, 0, 0);
                    } catch (e) {
                        secondFileDate = null;
                    }
                }
                
                const secondFileName = (row2[nameIndex] || "").toString().trim();
                const secondFileAmount = row2[amountIndex] || 0;
                
                if (secondFileDate && secondFileName && secondFileAmount !== 0) {
                    // Find matching rows in first file
                    firstFileData.forEach(firstRow => {
                        if (firstRow.date && 
                            Math.abs(firstRow.date.getTime() - secondFileDate.getTime()) < 24 * 60 * 60 * 1000 && // Same day
                            Math.abs(firstRow.krValue - secondFileAmount) < 0.01) { // Amount matches within 1 cent
                            
                            // Update Final Count in result
                            if (firstRow.rowIndex < resultData.length) {
                                resultData[firstRow.rowIndex][7] = 0; // Set Final Count to 0
                            }
                        }
                    });
                }
            }
        });
    }
    
    // Add spacing and card brand summary
    resultData.push(["", "", "", "", "", "", "", ""]);
    resultData.push(["", "", "", "", "", "", "", ""]);
    resultData.push(["Card Brand", "Hub Report", "Sales Report", "Difference", "", "", "", ""]);
    
    // Calculate card brand totals
    const cardBrandTotals = {};
    const cardBrandCounts = {};
    
    for (let i = 1; i < resultData.length - 3; i++) {
        const row = resultData[i];
        if (row.length >= 8) {
            const cardBrand = row[4]; // Card Brand column
            const amount = parseFloat(row[5]) || 0; // Total (-) Fee column
            const finalCount = parseInt(row[7]) || 0; // Final Count column
            
            if (cardBrand && !cardBrand.toLowerCase().includes("cash") && finalCount > 0) {
                cardBrandTotals[cardBrand] = (cardBrandTotals[cardBrand] || 0) + amount;
                cardBrandCounts[cardBrand] = (cardBrandCounts[cardBrand] || 0) + 1;
            }
        }
    }
    
    // Add card brand summary rows
    const commonBrands = ["Visa", "Mastercard", "American Express", "Discover"];
    commonBrands.forEach(brand => {
        const hubAmount = cardBrandTotals[brand] || 0;
        const salesAmount = 0; // Default to 0 for sales report
        const difference = hubAmount - salesAmount;
        
        resultData.push([
            brand, 
            parseFloat(hubAmount.toFixed(2)), 
            salesAmount, 
            parseFloat(difference.toFixed(2)), 
            "", "", "", ""
        ]);
    });
    
    // Add totals row
    const totalHub = Object.values(cardBrandTotals).reduce((sum, val) => sum + val, 0);
    const totalSales = 0;
    const totalDifference = totalHub - totalSales;
    
    resultData.push([
        "Total", 
        parseFloat(totalHub.toFixed(2)), 
        totalSales, 
        parseFloat(totalDifference.toFixed(2)), 
        "", "", "", ""
    ]);
    
    console.log('✅ Card brand summary and totals added');
    
    return resultData;

  } catch (error) {
    console.error('❌ Reconciliation error:', error.message);
    console.error('❌ Stack trace:', error.stack);
    throw error;
  }
}