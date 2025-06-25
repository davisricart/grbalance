exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔍 Execute-script function started');
    
    // Parse request body
    const body = JSON.parse(event.body);
    const { script, file1Data, file2Data } = body;
    
    console.log('📄 File1 data length:', file1Data?.length || 0);
    console.log('📄 File2 data length:', file2Data?.length || 0);

    // Basic validation
    if (!file1Data || !Array.isArray(file1Data) || file1Data.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid file1Data - must be array with headers and data' })
      };
    }

    console.log('✅ Validation passed, processing with EXACT admin logic...');

    // Execute EXACT same logic as admin Script Testing
    const result = exactAdminReconciliation(file1Data, file2Data);

    console.log('✅ Processing completed, result length:', result.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        result: result,
        message: 'Script executed successfully'
      })
    };

  } catch (error) {
    console.error('❌ Error in execute-script:', error.message);
    console.error('❌ Stack:', error.stack);
    
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

// EXACT COPY of admin reconciliation logic - matches Script Testing exactly
function exactAdminReconciliation(file1Data, file2Data) {
  console.log('🔄 Starting EXACT admin reconciliation logic...');

  // Helper function to format date for comparison
  function formatDateForComparison(date) {
    if (!(date instanceof Date) || isNaN(date)) {
      return '';
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  // EXACT column mapping from admin standardReconciliation.js
  const allowedColumns = [
    "Date", "Transaction Source", "Transaction Type", "Account Number", "DBA",
    "Invoice", "Auth", "BRIC", "Sold By", "Customer Name", "Total Transaction Amount",
    "Payment Amount", "Authorized Amount", "Tip", "$ Discount", "% Discount",
    "$ Tax", "Cash Discounting Amount", "State Tax", "County Tax", "City Tax",
    "Custom Tax", "Payment Type", "Card Brand", "First 6", "Last 4", "Comment"
  ];

  // Process file1 with EXACT same logic as admin
  const headers = file1Data[0] || [];
  const rawData = file1Data;

  console.log('📊 Processing headers:', headers.slice(0, 5));

  // Filter columns to keep only allowed ones (EXACT same logic)
  const columnsToKeepIndices = [];
  headers.forEach((header, index) => {
    if (allowedColumns.includes(header)) {
      columnsToKeepIndices.push(index);
    }
  });

  // Create filtered data with only allowed columns
  const filteredData = [];
  const filteredHeaders = columnsToKeepIndices.map(index => headers[index]);
  filteredData.push(filteredHeaders);

  // Add filtered rows
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    const filteredRow = columnsToKeepIndices.map(index =>
      index < row.length ? row[index] : "");
    filteredData.push(filteredRow);
  }

  // Convert to JSON format (EXACT same as admin)
  const jsonData1 = [];
  for (let i = 1; i < filteredData.length; i++) {
    const obj = {};
    filteredData[0].forEach((header, index) => {
      obj[header] = filteredData[i][index];
    });
    jsonData1.push(obj);
  }

  // Process file2 (EXACT same logic as admin)
  let jsonData2 = [];
  let file2Headers = [];
  let dateClosedIndex = -1;
  let nameIndex = -1;
  let amountIndex = -1;

  if (file2Data && Array.isArray(file2Data) && file2Data.length > 0) {
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

    jsonData2 = file2Data.slice(1);
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

  // Create result with EXACT same structure as admin
  const columnsToKeep = ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand"];
  const newColumns = ["Total (-) Fee", "Count", "Final Count"];
  const resultData = [columnsToKeep.concat(newColumns)];

  // Store processed first file data for comparisons
  const firstFileData = [];

  // Process each row (EXACT same logic as admin)
  jsonData1.forEach(row => {
    const filteredRow = [];
    let firstFileDate = null;
    let cardBrand = "";
    let krValue = 0;

    columnsToKeep.forEach(column => {
      if (column === "Date") {
        if (row[column] instanceof Date) {
          const date = row[column];
          firstFileDate = new Date(date);
          firstFileDate.setHours(12, 0, 0, 0);

          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          filteredRow.push(`${month}/${day}/${year}`);
        } else {
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

    // Calculate K-R value (EXACT same formula as admin)
    const totalAmount = parseFloat(row["Total Transaction Amount"]) || 0;
    const discountAmount = parseFloat(row["Cash Discounting Amount"]) || 0;
    krValue = totalAmount - discountAmount;

    filteredRow.push(krValue.toFixed(2));

    // Calculate Count - matches in second file (EXACT same logic as admin)
    let countMatches = 0;

    if (dateClosedIndex !== -1 && nameIndex !== -1 && amountIndex !== -1 && firstFileDate) {
      jsonData2.forEach(secondRow => {
        if (secondRow.length > Math.max(dateClosedIndex, nameIndex, amountIndex)) {
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

          const secondFileName = String(secondRow[nameIndex] || "").trim().toLowerCase();
          const secondFileAmount = parseFloat(secondRow[amountIndex]) || 0;

          const firstFileDateStr = formatDateForComparison(firstFileDate);
          const secondFileDateStr = formatDateForComparison(secondFileDate);

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

    filteredRow.push(countMatches.toString());
    filteredRow.push("");

    resultData.push(filteredRow);
    firstFileData.push(filteredRow);
  });

  // Convert to object format for display (same as admin creates)
  const objectResults = [];
  const resultHeaders = resultData[0];
  
  for (let i = 1; i < Math.min(resultData.length, 6); i++) { // Limit to 5 rows like admin
    const obj = {};
    resultHeaders.forEach((header, index) => {
      obj[header] = resultData[i][index];
    });
    objectResults.push(obj);
  }

  console.log('✅ Admin-matching reconciliation completed, rows:', objectResults.length);
  return objectResults;
}