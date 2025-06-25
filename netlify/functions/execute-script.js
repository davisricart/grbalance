const fs = require('fs');
const path = require('path');

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
    const { script, file1Data, file2Data } = JSON.parse(event.body);
    
    console.log('📜 Executing script:', script);
    console.log('📄 File1 data length:', file1Data?.length || 0);
    console.log('📄 File2 data length:', file2Data?.length || 0);

    if (!script) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Script name is required' })
      };
    }

    if (!file1Data || !file2Data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Both file1Data and file2Data are required' })
      };
    }

    // Execute standard reconciliation logic
    const result = executeStandardReconciliation(file1Data, file2Data);

    console.log('✅ Script execution completed, result length:', result?.length || 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        result: result,
        message: 'Script executed successfully'
      })
    };

  } catch (error) {
    console.error('❌ Script execution error:', error);
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

// Standard reconciliation function
function executeStandardReconciliation(file1Data, file2Data) {
  try {
    console.log('🔄 Starting standard reconciliation...');
    
    // Ensure we have data arrays
    if (!Array.isArray(file1Data) || !Array.isArray(file2Data)) {
      throw new Error('File data must be arrays');
    }

    if (file1Data.length === 0 || file2Data.length === 0) {
      throw new Error('File data cannot be empty');
    }

    // Get headers from first row
    const file1Headers = file1Data[0] || [];
    const file2Headers = file2Data[0] || [];
    
    console.log('📊 File1 headers:', file1Headers.slice(0, 5));
    console.log('📊 File2 headers:', file2Headers.slice(0, 5));

    // Process file1 data (skip header row)
    const file1Rows = file1Data.slice(1);
    const file2Rows = file2Data.slice(1);

    console.log('📊 Processing', file1Rows.length, 'rows from file1');
    console.log('📊 Processing', file2Rows.length, 'rows from file2');

    // Create result structure
    const resultHeaders = ['Date', 'Customer Name', 'Total Transaction Amount', 'Cash Discounting Amount', 'Card Brand', 'Total (-) Fee', 'Count', 'Final Count'];
    const result = [resultHeaders];

    // Process each row from file1
    file1Rows.forEach((row, index) => {
      if (!row || row.length === 0) return;
      
      try {
        // Extract data based on typical column positions
        const date = row[0] || '';
        const customerName = row[9] || ''; // Customer Name column
        const totalAmount = parseFloat(row[10]) || 0; // Total Transaction Amount
        const cashDiscount = parseFloat(row[17]) || 0; // Cash Discounting Amount
        const cardBrand = row[23] || ''; // Card Brand
        
        // Calculate total minus fee
        const totalMinusFee = totalAmount - cashDiscount;
        
        // Add processed row to result
        result.push([
          date,
          customerName,
          totalAmount,
          cashDiscount,
          cardBrand,
          totalMinusFee,
          1, // Count
          1  // Final Count
        ]);
      } catch (rowError) {
        console.warn('⚠️ Error processing row', index, ':', rowError.message);
      }
    });

    // Add summary section
    result.push(['']); // Empty row
    result.push(['Card Brand', 'Count']);
    
    // Count card brands
    const cardBrandCounts = {};
    result.slice(1, -2).forEach(row => {
      const cardBrand = row[4] || 'Unknown';
      cardBrandCounts[cardBrand] = (cardBrandCounts[cardBrand] || 0) + 1;
    });

    // Add card brand summary
    Object.entries(cardBrandCounts).forEach(([brand, count]) => {
      result.push([brand, count]);
    });

    console.log('✅ Reconciliation completed, result rows:', result.length);
    return result;

  } catch (error) {
    console.error('❌ Reconciliation error:', error);
    throw error;
  }
} 