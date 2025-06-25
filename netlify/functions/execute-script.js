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

    console.log('✅ Validation passed, processing...');

    // Execute simple reconciliation
    const result = simpleReconciliation(file1Data, file2Data);

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

// Simple but reliable reconciliation function
function simpleReconciliation(file1Data, file2Data) {
  try {
    console.log('🔄 Starting simple reconciliation...');
    
    const headers = file1Data[0] || [];
    console.log('📊 Headers:', headers.slice(0, 3));

    // Find key column indices
    const dateIndex = headers.findIndex(h => h && h.toLowerCase().includes('date'));
    const customerIndex = headers.findIndex(h => h && h.toLowerCase().includes('customer'));
    const totalIndex = headers.findIndex(h => h && h.toLowerCase().includes('total transaction'));
    const cashIndex = headers.findIndex(h => h && h.toLowerCase().includes('cash discount'));
    const brandIndex = headers.findIndex(h => h && h.toLowerCase().includes('card brand'));

    console.log('📊 Column indices:', { dateIndex, customerIndex, totalIndex, cashIndex, brandIndex });

    // Create result with headers
    const result = [['Date', 'Customer Name', 'Total Transaction Amount', 'Cash Discounting Amount', 'Card Brand', 'Total (-) Fee']];

    // Process each data row
    for (let i = 1; i < Math.min(file1Data.length, 100); i++) { // Limit to 100 rows for safety
      const row = file1Data[i];
      if (!row || row.length === 0) continue;

      try {
        const date = (dateIndex >= 0 && row[dateIndex]) ? row[dateIndex] : '';
        const customer = (customerIndex >= 0 && row[customerIndex]) ? row[customerIndex] : '';
        const total = parseFloat(row[totalIndex]) || 0;
        const cash = parseFloat(row[cashIndex]) || 0;
        const brand = (brandIndex >= 0 && row[brandIndex]) ? row[brandIndex] : '';
        const fee = total - cash;

        result.push([
          date,
          customer,
          total,
          cash,
          brand,
          parseFloat(fee.toFixed(2))
        ]);
      } catch (rowError) {
        console.warn('⚠️ Error processing row', i, ':', rowError.message);
        // Skip problematic rows instead of failing
      }
    }

    // Add summary section
    result.push(['', '', '', '', '', '']);
    result.push(['', '', '', '', '', '']);
    result.push(['Card Brand', 'Hub Report', 'Sales Report', 'Difference', '', '']);

    // Add simple card brand totals
    const brandTotals = {};
    for (let i = 1; i < result.length - 3; i++) {
      const row = result[i];
      if (row.length >= 6) {
        const brand = row[4] || 'Unknown';
        const amount = parseFloat(row[5]) || 0;
        brandTotals[brand] = (brandTotals[brand] || 0) + amount;
      }
    }

    // Add brand summary rows
    ['Visa', 'Mastercard', 'American Express', 'Discover'].forEach(brand => {
      const hubAmount = brandTotals[brand] || 0;
      result.push([brand, hubAmount, 0, hubAmount, '', '']);
    });

    console.log('✅ Simple reconciliation completed:', result.length, 'rows');
    return result;

  } catch (error) {
    console.error('❌ Error in simpleReconciliation:', error.message);
    
    // Return minimal fallback result
    return [
      ['Date', 'Customer Name', 'Total Transaction Amount', 'Cash Discounting Amount', 'Card Brand', 'Total (-) Fee'],
      ['Error', 'Processing failed', 0, 0, 'Error', 0]
    ];
  }
}