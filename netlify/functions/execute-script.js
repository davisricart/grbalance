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
    console.log('🔍 Execute-script function called');
    
    let body;
    try {
      body = JSON.parse(event.body);
      console.log('✅ Request body parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        })
      };
    }

    const { script, file1Data, file2Data } = body;
    
    console.log('📜 Script:', script);
    console.log('📄 File1 length:', file1Data?.length || 0);
    console.log('📄 File2 length:', file2Data?.length || 0);

    // Validate required parameters
    if (!script) {
      console.error('❌ Missing script parameter');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Script parameter is required'
        })
      };
    }

    if (!file1Data || !Array.isArray(file1Data)) {
      console.error('❌ Invalid file1Data');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'file1Data must be a non-empty array'
        })
      };
    }

    if (file1Data.length < 2) {
      console.error('❌ Insufficient data in file1Data');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'file1Data must have headers and at least one data row'
        })
      };
    }

    console.log('🔄 Starting reconciliation process...');

    // Execute the exact same logic as admin Script Testing
    const result = standardReconciliation(file1Data, file2Data);

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

// EXACT COPY of standardReconciliation logic - matches admin Script Testing exactly
function standardReconciliation(file1Data, file2Data) {
  console.log('🔄 Starting standardReconciliation with exact admin logic...');
  
  // Helper function to format date for comparison
  function formatDateForComparison(date) {
    if (!(date instanceof Date) || isNaN(date)) {
      return '';
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  
  // Validate input data
  if (!Array.isArray(file1Data)) {
    throw new Error('file1Data must be an array');
  }
  
  if (file1Data.length < 2) {
    throw new Error('file1Data must have headers and at least one data row');
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

  // Calculate Final Count for First File Rows (EXACT same logic as admin)
  if (file2Data && Array.isArray(file2Data) && file2Headers.length > 0) {
    const secondFileWithCount2 = [];
    
    jsonData2.forEach(row => {
      const processedRow = [...row];
      let secondFileDate = null;
      let secondFileName = "";
      let secondFileAmount = 0;
      
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
      
      const secondFileDateStr = formatDateForComparison(secondFileDate);
      
      let countMatches = 0;
      
      firstFileData.forEach(firstFileRow => {
        let firstFileDate = null;
        if (firstFileRow[0]) {
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
      
      processedRow.push(countMatches.toString());
      secondFileWithCount2.push(processedRow);
    });
    
    // Calculate Final Count
    firstFileData.forEach((firstFileRow, index) => {
      const date = firstFileRow[0]; 
      const cardBrand = String(firstFileRow[4] || "").trim().toLowerCase();
      const kr = parseFloat(firstFileRow[5] || 0);
      const count = parseInt(firstFileRow[6] || 0);
      
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
      let finalCount = 0;
      
      secondFileWithCount2.forEach(secondFileRow => {
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
      
      resultData[index + 1][7] = finalCount.toString();
    });
  }

  // Create filtered results - EXACT same as admin
  const displayColumns = ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand", "Total (-) Fee"];
  const filteredResults = [displayColumns];
  
  // Only add rows with Final Count = 0 (EXACT same filtering as admin)
  for (let i = 1; i < resultData.length; i++) {
    const row = resultData[i];
    
    if (row.every(cell => cell === "")) {
      break;
    }
    
    const finalCount = parseInt(row[7] || 0);
    if (finalCount === 0) {
      const displayRow = row.slice(0, 6);
      
      // Convert numeric columns
      if (displayRow[2] && !isNaN(parseFloat(displayRow[2]))) {
        displayRow[2] = parseFloat(displayRow[2]);
      }
      
      if (displayRow[3] && !isNaN(parseFloat(displayRow[3]))) {
        displayRow[3] = parseFloat(displayRow[3]);
      }
      
      if (displayRow[5] && !isNaN(parseFloat(displayRow[5]))) {
        displayRow[5] = parseFloat(displayRow[5]);
      }
      
      filteredResults.push(displayRow);
    }
  }

  // Add separators and card brand comparison (EXACT same as admin)
  filteredResults.push(["", "", "", "", "", ""]);
  filteredResults.push(["", "", "", "", "", ""]);
  filteredResults.push(["Card Brand", "Hub Report", "Sales Report", "Difference", "", ""]);

  // Card brand totals calculation (EXACT same logic as admin)
  const cardBrandTotals = {};
  
  for (let i = 1; i < resultData.length; i++) {
    const row = resultData[i];
    
    if (row.every(cell => cell === "")) {
      break;
    }
    
    const cardBrand = row[4];
    if (cardBrand && !cardBrand.toLowerCase().includes("cash")) {
      const netAmount = parseFloat(row[5] || 0);
      
      if (!cardBrandTotals[cardBrand]) {
        cardBrandTotals[cardBrand] = 0;
      }
      
      cardBrandTotals[cardBrand] += netAmount;
    }
  }

  // Process second file for name totals (EXACT same logic as admin)
  const nameTotals = {};
  
  if (file2Data && Array.isArray(file2Data) && file2Headers.length > 0 && nameIndex !== -1 && amountIndex !== -1) {
    const commonNames = {
      "visa": "Visa",
      "mastercard": "Mastercard",
      "master": "Mastercard",
      "american express": "American Express",
      "amex": "American Express",
      "discover": "Discover"
    };
    
    jsonData2.forEach(row => {
      if (row.length > Math.max(nameIndex, amountIndex)) {
        const name = String(row[nameIndex] || "").trim();
        if (name.toLowerCase().includes("cash")) {
          return;
        }
        
        const amount = parseFloat(row[amountIndex]) || 0;
        
        if (name) {
          let displayName = name;
          
          const lowerName = name.toLowerCase();
          for (const [key, value] of Object.entries(commonNames)) {
            if (lowerName.includes(key) || key.includes(lowerName)) {
              displayName = value;
              break;
            }
          }
          
          if (!nameTotals[displayName]) {
            nameTotals[displayName] = 0;
          }
          
          nameTotals[displayName] += amount;
        }
      }
    });
  }

  // Add card brand comparison rows (EXACT same order and logic as admin)
  const commonCardBrands = ["Visa", "Mastercard", "American Express", "Discover"];
  
  commonCardBrands.forEach(brand => {
    const leftValue = cardBrandTotals[brand] ? 
      parseFloat(cardBrandTotals[brand].toFixed(2)) : 0;
      
    const rightValue = nameTotals[brand] ? 
      parseFloat(nameTotals[brand].toFixed(2)) : 0;
      
    const difference = parseFloat((leftValue - rightValue).toFixed(2));
      
    filteredResults.push([
      brand,
      leftValue,
      rightValue,
      difference,
      "",
      ""
    ]);
    
    delete cardBrandTotals[brand];
    delete nameTotals[brand];
  });

  // Add other brands (EXACT same logic as admin)
  const otherBrands = new Set([
    ...Object.keys(cardBrandTotals).filter(b => !b.toLowerCase().includes("cash") && !commonCardBrands.includes(b)),
    ...Object.keys(nameTotals).filter(n => !n.toLowerCase().includes("cash") && !commonCardBrands.includes(n))
  ]);

  [...otherBrands].sort().forEach(brand => {
    const leftValue = cardBrandTotals[brand] ? 
      parseFloat(cardBrandTotals[brand].toFixed(2)) : 0;
      
    const rightValue = nameTotals[brand] ? 
      parseFloat(nameTotals[brand].toFixed(2)) : 0;
    
    const difference = parseFloat((leftValue - rightValue).toFixed(2));
      
    filteredResults.push([
      brand,
      leftValue || 0,
      rightValue || 0,
      difference,
      "",
      ""
    ]);
  });

  console.log('✅ Reconciliation completed with admin-matching logic, rows:', filteredResults.length);
  return filteredResults;
}