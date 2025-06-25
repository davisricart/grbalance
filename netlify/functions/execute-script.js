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

    if (!script || !file1Data || !file2Data) {
      console.error('❌ Missing parameters:', { script: !!script, file1Data: !!file1Data, file2Data: !!file2Data });
      throw new Error('Missing required parameters');
    }

    // Simple validation
    if (!Array.isArray(file1Data) || !Array.isArray(file2Data)) {
      console.error('❌ Invalid data format');
      throw new Error('File data must be arrays');
    }

    if (file1Data.length < 2 || file2Data.length < 2) {
      console.error('❌ Insufficient data');
      throw new Error('Files must have headers and at least one data row');
    }

    console.log('🔄 Starting reconciliation process...');

    // Execute reconciliation
    const result = await executeReconciliation(file1Data, file2Data);

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

async function executeReconciliation(file1Data, file2Data) {
  try {
    console.log('🔄 Processing files...');
    
    // Get headers
    const file1Headers = file1Data[0] || [];
    const file2Headers = file2Data[0] || [];
    
    console.log('📊 File1 headers sample:', file1Headers.slice(0, 3));
    console.log('📊 File2 headers sample:', file2Headers.slice(0, 3));

    // Define allowed columns for filtering
    const allowedColumns = [
      "Date", "Transaction Source", "Transaction Type", "Account Number", "DBA",
      "Invoice", "Auth", "BRIC", "Sold By", "Customer Name", "Total Transaction Amount",
      "Payment Amount", "Authorized Amount", "Tip", "$ Discount", "% Discount",
      "$ Tax", "Cash Discounting Amount", "State Tax", "County Tax", "City Tax",
      "Custom Tax", "Payment Type", "Card Brand", "First 6", "Last 4", "Comment"
    ];

    // Filter file1 columns
    const columnsToKeepIndices = [];
    file1Headers.forEach((header, index) => {
      if (allowedColumns.includes(header)) {
        columnsToKeepIndices.push(index);
      }
    });

    console.log('📊 Keeping', columnsToKeepIndices.length, 'columns from file1');

    // Create filtered data
    const filteredHeaders = columnsToKeepIndices.map(index => file1Headers[index]);
    const filteredData = [filteredHeaders];

    // Process data rows
    for (let i = 1; i < file1Data.length; i++) {
      const row = file1Data[i];
      const filteredRow = columnsToKeepIndices.map(index => 
        index < row.length ? row[index] : "");
      filteredData.push(filteredRow);
    }

    console.log('📊 Filtered data rows:', filteredData.length - 1);

    // Convert to object format
    const jsonData1 = [];
    for (let i = 1; i < filteredData.length; i++) {
      const obj = {};
      filteredData[0].forEach((header, index) => {
        obj[header] = filteredData[i][index];
      });
      jsonData1.push(obj);
    }

    console.log('📊 JSON data1 created:', jsonData1.length, 'rows');

    // Create basic result structure
    const resultHeaders = ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand", "Total (-) Fee"];
    const result = [resultHeaders];

    // Process each row
    jsonData1.forEach((row, index) => {
      try {
        const date = row["Date"] || '';
        const customerName = row["Customer Name"] || '';
        const totalAmount = parseFloat(row["Total Transaction Amount"]) || 0;
        const cashDiscount = parseFloat(row["Cash Discounting Amount"]) || 0;
        const cardBrand = row["Card Brand"] || '';
        const totalMinusFee = totalAmount - cashDiscount;

        result.push([
          date,
          customerName,
          totalAmount,
          cashDiscount,
          cardBrand,
          parseFloat(totalMinusFee.toFixed(2))
        ]);
      } catch (rowError) {
        console.warn('⚠️ Error processing row', index, ':', rowError.message);
      }
    });

    console.log('✅ Basic processing completed, result rows:', result.length - 1);

    // Add card brand summary
    result.push(["", "", "", "", "", ""]);
    result.push(["", "", "", "", "", ""]);
    result.push(["Card Brand", "Hub Report", "Sales Report", "Difference", "", ""]);

    // Calculate card brand totals
    const cardBrandTotals = {};
    for (let i = 1; i < result.length - 3; i++) {
      const row = result[i];
      const cardBrand = row[4];
      const amount = parseFloat(row[5]) || 0;
      
      if (cardBrand && !cardBrand.toLowerCase().includes("cash")) {
        cardBrandTotals[cardBrand] = (cardBrandTotals[cardBrand] || 0) + amount;
      }
    }

    // Add card brand rows
    const commonBrands = ["Visa", "Mastercard", "American Express", "Discover"];
    commonBrands.forEach(brand => {
      const hubAmount = cardBrandTotals[brand] || 0;
      result.push([brand, parseFloat(hubAmount.toFixed(2)), 0, parseFloat(hubAmount.toFixed(2)), "", ""]);
    });

    console.log('✅ Card brand summary added');
    
    return result;

  } catch (error) {
    console.error('❌ Reconciliation error:', error.message);
    throw error;
  }
}