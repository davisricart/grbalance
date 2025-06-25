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
    console.log('🚀 GR Balance Execute-Script Function Started');
    
    const body = JSON.parse(event.body);
    const { script, file1Data, file2Data } = body;
    
    console.log('📄 Received data - File1:', file1Data?.length || 0, 'rows, File2:', file2Data?.length || 0, 'rows');
    console.log('📜 Script length:', script?.length || 0, 'characters');

    if (!script) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Script is required' })
      };
    }

    if (!file1Data || !Array.isArray(file1Data) || file1Data.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'file1Data must be an array with headers and data rows' })
      };
    }

    console.log('✅ Basic validation passed, setting up GR Balance environment...');

    // RESULT STORAGE
    let scriptResults = null;
    let scriptError = null;
    let scriptCompleted = false;

    // CREATE COMPLETE GR BALANCE ENVIRONMENT
    const grBalanceWindow = {
      // Core GR Balance API: parseFiles() - converts raw Excel data to objects
      parseFiles: async () => {
        console.log('📊 parseFiles() called - converting Excel data to GR Balance format');
        
        try {
          // Convert file1Data (array of arrays from Excel) to array of objects
          const headers1 = file1Data[0] || [];
          const data1 = [];
          
          for (let i = 1; i < file1Data.length && i < 1000; i++) { // Limit for safety
            const row = file1Data[i];
            if (!row || row.length === 0) continue;
            
            const obj = {};
            headers1.forEach((header, index) => {
              if (header && header.toString().trim()) {
                obj[header] = index < row.length ? row[index] : '';
              }
            });
            data1.push(obj);
          }

          // Convert file2Data if present
          let data2 = null;
          if (file2Data && Array.isArray(file2Data) && file2Data.length > 1) {
            const headers2 = file2Data[0] || [];
            data2 = [];
            
            for (let i = 1; i < file2Data.length && i < 1000; i++) { // Limit for safety
              const row = file2Data[i];
              if (!row || row.length === 0) continue;
              
              const obj = {};
              headers2.forEach((header, index) => {
                if (header && header.toString().trim()) {
                  obj[header] = index < row.length ? row[index] : '';
                }
              });
              data2.push(obj);
            }
          }

          console.log('✅ parseFiles() completed:', { 
            data1Rows: data1.length, 
            data2Rows: data2?.length || 0,
            data1Columns: Object.keys(data1[0] || {}).length,
            data2Columns: Object.keys(data2?.[0] || {}).length
          });
          
          return { data1, data2 };
        } catch (error) {
          console.error('❌ parseFiles() error:', error);
          throw new Error(`Failed to parse files: ${error.message}`);
        }
      },

      // Core GR Balance API: showResults() - captures script results
      showResults: (results, options = {}) => {
        console.log('📊 showResults() called with', results?.length || 0, 'rows');
        console.log('📊 Options:', options);
        
        if (!results || !Array.isArray(results)) {
          console.warn('⚠️ showResults() called with invalid data:', typeof results);
          scriptResults = [];
        } else {
          scriptResults = results;
        }
        
        scriptCompleted = true;
        console.log('✅ Results captured successfully');
      },

      // Core GR Balance API: showError() - captures script errors  
      showError: (message) => {
        console.log('❌ showError() called:', message);
        scriptError = message;
        scriptCompleted = true;
      },

      // Helper API: findColumn() - smart column name matching
      findColumn: (row, possibleNames) => {
        if (!row || !Array.isArray(possibleNames)) return null;
        
        const columns = Object.keys(row);
        console.log('🔍 findColumn() searching in:', columns);
        console.log('🔍 Looking for one of:', possibleNames);
        
        for (const targetName of possibleNames) {
          const found = columns.find(col => {
            const colLower = col.toLowerCase().trim();
            const targetLower = targetName.toLowerCase().trim();
            return colLower === targetLower || 
                   colLower.includes(targetLower) || 
                   targetLower.includes(colLower);
          });
          
          if (found) {
            console.log('✅ findColumn() found:', found);
            return found;
          }
        }
        
        console.log('❌ findColumn() not found');
        return null;
      },

      // Additional API: addAdditionalTable() - for extra tables
      addAdditionalTable: (htmlString, uniqueId) => {
        console.log('📊 addAdditionalTable() called:', uniqueId);
        // In the client portal context, we just log this
      }
    };

    // EXECUTE SCRIPT IN SAFE ENVIRONMENT
    console.log('🔄 Executing script in GR Balance environment...');
    
    try {
      // Create function with GR Balance APIs in scope
      const scriptFunction = new Function(
        'window',
        'console', 
        `
        "use strict";
        
        // Set up GR Balance window APIs
        window.parseFiles = arguments[0].parseFiles;
        window.showResults = arguments[0].showResults;
        window.showError = arguments[0].showError;
        window.findColumn = arguments[0].findColumn;
        window.addAdditionalTable = arguments[0].addAdditionalTable;
        
        // Execute the script
        try {
          ${script}
        } catch (scriptErr) {
          console.error('Script execution error:', scriptErr);
          window.showError('Script error: ' + scriptErr.message);
        }
        `
      );

      // Execute the script
      await scriptFunction(grBalanceWindow, console);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (executionError) {
      console.error('❌ Script execution failed:', executionError);
      scriptError = `Script execution failed: ${executionError.message}`;
      scriptCompleted = true;
    }

    console.log('📋 Script execution summary:', {
      completed: scriptCompleted,
      hasResults: !!scriptResults,
      hasError: !!scriptError,
      resultCount: scriptResults?.length || 0
    });

    // RETURN RESULTS
    if (scriptError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: scriptError,
          message: 'Script reported an error'
        })
      };
    }

    if (!scriptCompleted || !scriptResults) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Script did not complete successfully or did not call window.showResults()',
          message: 'No results returned from script execution'
        })
      };
    }

    console.log('✅ Returning successful results:', scriptResults.length, 'rows');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        result: scriptResults,
        message: 'Script executed successfully in GR Balance environment'
      })
    };

  } catch (error) {
    console.error('❌ Function error:', error.message);
    console.error('❌ Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};