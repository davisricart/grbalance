const multipart = require('lambda-multipart-parser');
const XLSX = require('xlsx');

exports.handler = async function(event, context) {
  console.log('🚀 Execute-script function called');
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('📋 Parsing multipart form data...');
    const result = await multipart.parse(event);
    console.log('📁 Files received:', Object.keys(result.files || {}));

    if (!result.files || !result.files.file1 || !result.files.file2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Both file1 and file2 are required' }),
      };
    }

    const file1Buffer = result.files.file1.content;
    const file2Buffer = result.files.file2.content;
    
    console.log('✅ Files parsed successfully');
    console.log('📊 File 1 size:', file1Buffer.length, 'bytes');
    console.log('📊 File 2 size:', file2Buffer.length, 'bytes');

    // Get the CLIENT_ID from environment variables to identify which scripts to use
    const clientId = process.env.CLIENT_ID;
    console.log('🔍 Client ID from environment:', clientId);

    // For now, use the embedded standardReconciliation function
    // In the future, this could be enhanced to load custom deployed scripts
    console.log('🔧 Using embedded reconciliation logic...');
    
    const processedData = standardReconciliation(XLSX, file1Buffer, file2Buffer);
    
    console.log('✅ Processing complete, rows generated:', processedData.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        data: processedData,
        message: 'Processing completed successfully',
        rowCount: processedData.length
      }),
    };

  } catch (error) {
    console.error('❌ Error in execute-script:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Processing failed', 
        message: error.message,
        stack: error.stack 
      }),
    };
  }
};

// Embedded standardReconciliation function
function standardReconciliation(XLSX, file1, file2) {
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
    const workbook1 = XLSX.read(file1, {
        cellDates: true,
        dateNF: 'yyyy-mm-dd'
    });
    
    const sheetName1 = workbook1.SheetNames[0];
    const worksheet1 = workbook1.Sheets[sheetName1];
    const rawData = XLSX.utils.sheet_to_json(worksheet1, { header: 1 });
    
    // Filter columns and process data
    const headers = rawData[0] || [];
    const columnsToKeepIndices = [];
    
    headers.forEach((header, index) => {
        if (allowedColumns.includes(header)) {
            columnsToKeepIndices.push(index);
        }
    });
    
    const filteredData = [];
    const filteredHeaders = columnsToKeepIndices.map(index => headers[index]);
    filteredData.push(filteredHeaders);
    
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        const filteredRow = columnsToKeepIndices.map(index => 
            index < row.length ? row[index] : "");
        filteredData.push(filteredRow);
    }
    
    // Convert to JSON format
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
        const workbook2 = XLSX.read(file2, {
            cellDates: true,
            dateNF: 'yyyy-mm-dd'
        });
        
        const sheetName2 = workbook2.SheetNames[0];
        const worksheet2 = workbook2.Sheets[sheetName2];
        const data = XLSX.utils.sheet_to_json(worksheet2, { header: 1 });
        
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
        
        jsonData2 = data.slice(1);
        
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
    
    // Step 3: Create results with simplified logic for now
    const columnsToKeep = ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand"];
    const newColumns = ["Total (-) Fee"];
    
    const resultData = [columnsToKeep.concat(newColumns)];
    
    jsonData1.forEach(row => {
        const filteredRow = [];
        
        columnsToKeep.forEach(column => {
            if (column === "Date") {
                if (row[column] instanceof Date) {
                    const date = row[column];
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    filteredRow.push(`${month}/${day}/${year}`);
                } else {
                    filteredRow.push(row[column] !== undefined ? row[column] : "");
                }
            } else {
                filteredRow.push(row[column] !== undefined ? row[column] : "");
            }
        });
        
        // Calculate K-R value (Total - Discount)
        const totalAmount = parseFloat(row["Total Transaction Amount"]) || 0;
        const discountAmount = parseFloat(row["Cash Discounting Amount"]) || 0;
        const krValue = totalAmount - discountAmount;
        
        filteredRow.push(krValue.toFixed(2));
        resultData.push(filteredRow);
    });
    
    return resultData;
} 