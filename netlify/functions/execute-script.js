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
    console.log('🔍 GR Balance client portal script execution started');

    // Parse request body
    const body = JSON.parse(event.body);
    const { script, file1Data, file2Data } = body;

    console.log('📄 File1 data length:', file1Data?.length || 0);
    console.log('📄 File2 data length:', file2Data?.length || 0);

    // Basic validation
    if (!script) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Script parameter is required' })
      };
    }

    if (!file1Data || !Array.isArray(file1Data) || file1Data.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid file1Data - must be array with headers and data' })
      };
    }

    console.log('✅ Validation passed, setting up GR Balance environment...');

    // CREATE GR BALANCE SYSTEM ENVIRONMENT
    // This simulates the exact same environment as admin Script Testing
    let scriptResults = null;
    let scriptError = null;

    // Set up GR Balance system APIs
    const grBalanceEnvironment = {
      // Simulate window.parseFiles() - converts raw data to GR Balance format
      parseFiles: async () => {
        console.log('📊 parseFiles() called - converting raw data to GR Balance format');
        
        // Convert file1Data (array of arrays) to array of objects
        const headers1 = file1Data[0] || [];
        const data1 = [];
        for (let i = 1; i < file1Data.length; i++) {
          const obj = {};
          headers1.forEach((header, index) => {
            obj[header] = file1Data[i][index];
          });
          data1.push(obj);
        }

        // Convert file2Data if present
        let data2 = null;
        if (file2Data && Array.isArray(file2Data) && file2Data.length > 1) {
          const headers2 = file2Data[0] || [];
          data2 = [];
          for (let i = 1; i < file2Data.length; i++) {
            const obj = {};
            headers2.forEach((header, index) => {
              obj[header] = file2Data[i][index];
            });
            data2.push(obj);
          }
        }

        console.log('✅ Data converted:', { data1Length: data1.length, data2Length: data2?.length || 0 });
        return { data1, data2 };
      },

      // Simulate window.showResults() - stores results for return
      showResults: (results, options = {}) => {
        console.log('📊 showResults() called with', results.length, 'rows');
        console.log('📊 Options:', options);
        scriptResults = results;
      },

      // Simulate window.showError() - stores error for return
      showError: (message) => {
        console.log('❌ showError() called:', message);
        scriptError = message;
      },

      // Simulate window.findColumn() - smart column matching
      findColumn: (row, possibleNames) => {
        const columns = Object.keys(row || {});
        for (const name of possibleNames) {
          const found = columns.find(col => 
            col.toLowerCase().includes(name.toLowerCase()) || 
            name.toLowerCase().includes(col.toLowerCase())
          );
          if (found) return found;
        }
        return null;
      },

      // Simulate window.addAdditionalTable() - for additional tables
      addAdditionalTable: (htmlString, uniqueId) => {
        console.log('📊 addAdditionalTable() called:', uniqueId);
        // In client portal, we'll just log this - main results are handled by showResults
      }
    };

    // Execute script in GR Balance environment using Function constructor for safety
    const scriptFunction = new Function(
      'window', 
      'console', 
      `
      // Set up GR Balance APIs in global scope
      window.parseFiles = arguments[0].parseFiles;
      window.showResults = arguments[0].showResults;
      window.showError = arguments[0].showError;
      window.findColumn = arguments[0].findColumn;
      window.addAdditionalTable = arguments[0].addAdditionalTable;
      
      // Execute the script
      ${script}
      `
    );

    // Execute with our simulated environment
    await scriptFunction(grBalanceEnvironment, console);

    // Wait a moment for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('✅ Script execution completed');

    // Return results in GR Balance format
    if (scriptError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: scriptError,
          message: 'Script execution failed'
        })
      };
    }

    if (!scriptResults) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'No results returned - script may not have called window.showResults()',
          message: 'Script execution completed but no results'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        result: scriptResults,
        message: 'Script executed successfully using GR Balance environment'
      })
    };

  } catch (error) {
    console.error('❌ Error in GR Balance script execution:', error.message);
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