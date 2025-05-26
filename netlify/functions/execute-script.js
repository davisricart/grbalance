const multipart = require('lambda-multipart-parser');
const path = require('path');
const fs = require('fs');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      // Parse multipart form data
      const result = await multipart.parse(event);
      const { scriptName } = event.queryStringParameters || {};
      
      if (!scriptName) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Script name is required' }),
        };
      }

      const file1 = result.files.find(f => f.fieldname === 'file1');
      const file2 = result.files.find(f => f.fieldname === 'file2');

      if (!file1 || !file2) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Both files are required' }),
        };
      }

      // Load and execute the script
      const scriptPath = path.join(__dirname, '../../scripts', `${scriptName}.js`);
      
      if (!fs.existsSync(scriptPath)) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Script not found' }),
        };
      }

      // Import the script dynamically
      delete require.cache[require.resolve(scriptPath)];
      const scriptModule = require(scriptPath);
      
      // Execute the script with the uploaded files
      const result_data = await scriptModule.execute(file1.content, file2.content);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ result: result_data }),
      };
    } catch (error) {
      console.error('Script execution error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message || 'Script execution failed' }),
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
}; 