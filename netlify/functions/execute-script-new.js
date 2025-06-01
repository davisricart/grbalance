// Simplified execute-script function without problematic dependencies
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'OK' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No request body' })
      };
    }

    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON' })
      };
    }

    if (!requestData.file1Data || !requestData.file2Data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing file data' })
      };
    }

    const file1Data = requestData.file1Data;
    const file2Data = requestData.file2Data;
    
    const results = [['Card Brand', 'Count in File 1', 'Count in File 2']];
    
    // Find card brand column in file 1
    let cardBrandKey1 = null;
    if (file1Data.length > 0) {
      for (const key of Object.keys(file1Data[0])) {
        if (String(key).toLowerCase().includes('card brand')) {
          cardBrandKey1 = key;
          break;
        }
      }
    }
    
    // Find card brand column in file 2
    let cardBrandKey2 = null;
    if (file2Data.length > 0) {
      for (const key of Object.keys(file2Data[0])) {
        if (String(key).toLowerCase().includes('card brand')) {
          cardBrandKey2 = key;
          break;
        }
      }
    }

    // Count brands in file 1
    const counts1 = {};
    if (cardBrandKey1) {
      file1Data.forEach(row => {
        if (row && row[cardBrandKey1]) {
          const brand = String(row[cardBrandKey1]).trim();
          if (brand) {
            counts1[brand] = (counts1[brand] || 0) + 1;
          }
        }
      });
    }

    // Count brands in file 2
    const counts2 = {};
    if (cardBrandKey2) {
      file2Data.forEach(row => {
        if (row && row[cardBrandKey2]) {
          const brand = String(row[cardBrandKey2]).trim();
          if (brand) {
            counts2[brand] = (counts2[brand] || 0) + 1;
          }
        }
      });
    }

    // Combine results
    const allBrands = new Set([...Object.keys(counts1), ...Object.keys(counts2)]);
    allBrands.forEach(brand => {
      results.push([brand, counts1[brand] || 0, counts2[brand] || 0]);
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        result: results,
        message: 'Processing completed successfully',
        rowCount: results.length,
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
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Processing failed', 
        message: error.message 
      })
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