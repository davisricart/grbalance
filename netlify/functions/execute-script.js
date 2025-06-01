// Simplified execute-script function without problematic dependencies
exports.handler = async function(event, context) {
  console.log('🚀 Execute-script function called');
  console.log('🌐 Request origin:', event.headers.origin || event.headers.Origin || 'none');
  console.log('🔧 Request method:', event.httpMethod);
  console.log('📦 Event body preview:', event.body ? event.body.substring(0, 100) + '...' : 'empty');
  
  // PERMISSIVE CORS: Allow all Netlify apps and localhost
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Max-Age': '86400',
  };

  console.log('✅ CORS headers set for all origins');

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('🔄 Handling CORS preflight request');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    console.log('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('📋 Parsing JSON request data...');
    let requestData;
    
    if (!event.body) {
      console.log('❌ No request body provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No request body provided' }),
      };
    }
    
    try {
      requestData = JSON.parse(event.body);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    console.log('📝 Request data keys:', Object.keys(requestData || {}));

    if (!requestData.file1Data || !requestData.file2Data) {
      console.log('❌ Missing required data fields');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Both file1Data and file2Data are required' }),
      };
    }

    const file1Data = requestData.file1Data;
    const file2Data = requestData.file2Data;
    const scriptName = requestData.script;
    
    console.log('✅ JSON data parsed successfully');
    console.log('📊 File 1 rows:', file1Data.length);
    console.log('📊 File 2 rows:', file2Data.length);
    console.log('📜 Script name:', scriptName);

    // Simple comparison without external dependencies
    console.log('🔄 Starting simple comparison...');
    const processedData = simpleComparisonFromData(file1Data, file2Data);
    
    console.log('✅ Processing complete, rows generated:', processedData.length);

    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        result: processedData,
        message: 'Processing completed successfully',
        rowCount: processedData.length,
        usedDynamicScript: false,
        softwareProfile: 'Simple Comparison',
        insightsConfig: {
          showInsights: false,
          showPaymentTrends: false,
          showCustomerBehavior: false,
          showOperationalMetrics: false,
          showRiskFactors: false,
          showBusinessIntelligence: false
        }
      }),
    };

    console.log('✅ Sending successful response');
    return response;

  } catch (error) {
    console.error('❌ Error in execute-script:', error);
    console.error('❌ Stack trace:', error.stack);
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

// Simplified comparison function with basic card brand detection
function simpleComparisonFromData(file1Data, file2Data) {
    try {
        console.log('🔄 Using simple comparison logic');
        
        console.log('📊 File 1 sample:', file1Data[0]);
        console.log('📊 File 2 sample:', file2Data[0]);

        // Smart column detection - look for common card brand column names
        const findCardBrandKey = (obj) => {
            const cardBrandPatterns = ['card brand', 'payment type', 'card type', 'payment method'];
            for (const key of Object.keys(obj)) {
                const keyLower = String(key).toLowerCase();
                for (const pattern of cardBrandPatterns) {
                    if (keyLower.includes(pattern)) {
                        return key;
                    }
                }
            }
            return null;
        };

        // Find card brand columns
        const cardBrandKey1 = file1Data.length > 0 ? findCardBrandKey(file1Data[0]) : null;
        const cardBrandKey2 = file2Data.length > 0 ? findCardBrandKey(file2Data[0]) : null;
        
        console.log('🎯 Card brand column keys - File1:', cardBrandKey1, 'File2:', cardBrandKey2);

        // Count occurrences in both files
        const cardBrandCounts1 = {};
        const cardBrandCounts2 = {};

        // Process file 1
        if (cardBrandKey1) {
            file1Data.forEach(row => {
                if (row && row[cardBrandKey1]) {
                    const brand = String(row[cardBrandKey1]).trim();
                    if (brand && !brand.toLowerCase().includes('cash')) {
                        cardBrandCounts1[brand] = (cardBrandCounts1[brand] || 0) + 1;
                    }
                }
            });
        }

        // Process file 2
        if (cardBrandKey2) {
            file2Data.forEach(row => {
                if (row && row[cardBrandKey2]) {
                    const brand = String(row[cardBrandKey2]).trim();
                    if (brand && !brand.toLowerCase().includes('cash')) {
                        cardBrandCounts2[brand] = (cardBrandCounts2[brand] || 0) + 1;
                    }
                }
            });
        }

        // Get all unique card brands
        const allBrands = new Set([...Object.keys(cardBrandCounts1), ...Object.keys(cardBrandCounts2)]);
        
        // Create simple result table: [['Card Brand', 'Count in File 1', 'Count in File 2']]
        const results = [['Card Brand', 'Count in File 1', 'Count in File 2']];
        
        allBrands.forEach(brand => {
            const count1 = cardBrandCounts1[brand] || 0;
            const count2 = cardBrandCounts2[brand] || 0;
            results.push([brand, count1, count2]);
        });

        console.log('✅ Simple comparison completed successfully');
        console.log('📊 Results preview:', results.slice(0, 3));
        
        return results;
    } catch (error) {
        console.error('❌ Error in simple comparison:', error);
        // Return a basic error result
        return [
            ['Card Brand', 'Count in File 1', 'Count in File 2'],
            ['Error', 'Could not process files', 'Please check file format']
        ];
    }
} 