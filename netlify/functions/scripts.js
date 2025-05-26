const fs = require('fs');
const path = require('path');

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

  if (event.httpMethod === 'GET') {
    try {
      // In Netlify Functions, we need to look for scripts in the build directory
      const scriptsDir = path.join(process.cwd(), 'scripts');
      
      // Filter out utility scripts that aren't meant for reconciliation
      const utilityScripts = [
        'adminCleanup',
        'dev-helper', 
        'setup',
        'download',
        'cleanup',
        'create-instance',
        'setup-github',
        'test-run5'
      ];
      
      const files = fs.readdirSync(scriptsDir)
        .filter(f => f.endsWith('.js') && !f.startsWith('.'))
        .map(f => f.replace('.js', ''))
        .filter(f => !utilityScripts.includes(f) && !f.includes('.backup'));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(files),
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to list scripts' }),
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
}; 