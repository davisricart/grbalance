const fetch = require('node-fetch');
const FormData = require('form-data');

exports.handler = async function(event, context) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  try {
    // Debug logging
    console.log('Deploy Script Event:', JSON.stringify(event, null, 2));
    console.log('Body:', event.body);

    const { siteId, scriptContent, scriptName, clientId } = JSON.parse(event.body);
    
    if (!siteId || !scriptContent || !scriptName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields: siteId, scriptContent, scriptName" })
      };
    }

    const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;
    if (!NETLIFY_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Missing Netlify token" })
      };
    }

    // Step 1: Create a new site files upload
    const formData = new FormData();
    
    // Create the script file content
    const scriptFileContent = `// Auto-deployed script for client: ${clientId || 'unknown'}
// Deployed: ${new Date().toISOString()}
// Script: ${scriptName}

${scriptContent}`;

    // Add files to form data - create a basic site structure with the script
    const indexHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Client Portal - ${clientId || 'Client'}</title>
</head>
<body>
    <h1>Welcome to your Client Portal</h1>
    <p>Your custom reconciliation script has been deployed.</p>
    <script src="./script.js"></script>
</body>
</html>`;

    // Add files to the form
    formData.append('index.html', indexHtml);
    formData.append('script.js', scriptFileContent);

    // Step 2: Deploy the files to the site
    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    let deployResult;
    try {
      const deployText = await deployRes.text();
      deployResult = JSON.parse(deployText);
    } catch (e) {
      deployResult = await deployRes.text();
    }

    if (!deployRes.ok) {
      console.error('Netlify deploy error:', deployResult);
      return {
        statusCode: deployRes.status,
        headers,
        body: JSON.stringify({ 
          error: typeof deployResult === 'string' ? deployResult : deployResult.message, 
          details: deployResult 
        })
      };
    }

    // Step 3: Set CLIENT_ID environment variable if provided
    if (clientId) {
      try {
        await setEnvVarWithRetry(siteId, clientId, NETLIFY_TOKEN, 2);
        console.log('✅ CLIENT_ID environment variable set successfully');
      } catch (e) {
        console.warn('⚠️ Failed to set CLIENT_ID environment variable:', e.result);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Script deployed successfully",
        deployUrl: deployResult.deploy_ssl_url || deployResult.ssl_url,
        deployId: deployResult.id,
        siteUrl: deployResult.ssl_url,
        scriptName: scriptName,
        deployResult: deployResult
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message, stack: error.stack })
    };
  }
};

// Reuse the retry function from provision-client
async function setEnvVarWithRetry(siteId, clientId, NETLIFY_TOKEN, retries = 2) {
  const url = `https://api.netlify.com/api/v1/sites/${siteId}/env/vars`;
  const body = JSON.stringify({
    key: 'CLIENT_ID',
    values: [{ context: 'all', value: clientId }]
  });
  
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    
    let text = await res.text();
    let result;
    try { 
      result = JSON.parse(text); 
    } catch { 
      result = text; 
    }
    
    if (res.ok) return result;
    
    if (res.status !== 404 || i === retries - 1) {
      throw { status: res.status, result };
    }
    
    console.log(`Env var attempt ${i + 1} failed with 404, retrying in 2 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
} 