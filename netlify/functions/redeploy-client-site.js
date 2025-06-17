const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

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
    console.log('Redeploy Client Site Event:', JSON.stringify(event, null, 2));

    const { siteId, clientId, clientName } = JSON.parse(event.body);
    
    if (!siteId || !clientId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields: siteId, clientId" })
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

    console.log(`🚀 Redeploying client site for ${clientName} (${clientId})`);

    // Create form data with the updated client template
    const formData = new FormData();
    
    // Use the current main site's build (dist folder from the main site)
    const distPath = path.join(process.cwd(), 'dist');
    
    try {
      // Check if dist folder exists
      if (!fs.existsSync(distPath)) {
        throw new Error('Main site dist folder not found. Please build the main site first.');
      }

      console.log(`📁 Reading files from main site build: ${distPath}`);

      // Read the main HTML file
      const indexPath = path.join(distPath, 'index.html');
      let indexHtml = fs.readFileSync(indexPath, 'utf8');
      
      // Update the title with client name
      indexHtml = indexHtml.replace(
        /<title>.*?<\/title>/,
        `<title>${clientName || clientId} - Payment Reconciliation Portal</title>`
      );
      
      // Add client configuration
      const clientConfig = `
        <script>
          window.CLIENT_CONFIG = {
            clientId: '${clientId}',
            clientName: '${clientName || clientId}',
            deployedAt: '${new Date().toISOString()}'
          };
        </script>
      `;
      
      // Insert client config before closing head tag
      indexHtml = indexHtml.replace('</head>', `${clientConfig}</head>`);
      
      formData.append('index.html', indexHtml);
      
      // Read and add all assets from dist folder
      const addFilesRecursively = (dirPath, basePath = '') => {
        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const relativePath = basePath ? `${basePath}/${file}` : file;
          
          if (fs.statSync(filePath).isDirectory()) {
            addFilesRecursively(filePath, relativePath);
          } else if (file !== 'index.html') { // Skip index.html as we already added it
            const fileContent = fs.readFileSync(filePath);
            formData.append(relativePath, fileContent);
            console.log(`📄 Added file: ${relativePath} (${fileContent.length} bytes)`);
          }
        });
      };
      
      addFilesRecursively(distPath);
      
      console.log('✅ Client template files loaded successfully');
      
    } catch (error) {
      console.error('❌ Error reading client template files:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to read client template files',
          details: error.message
        })
      };
    }

    // Deploy the files to the site
    console.log('🚀 Deploying to Netlify...');
    console.log(`🔗 Netlify API URL: https://api.netlify.com/api/v1/sites/${siteId}/deploys`);
    
    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log(`📡 Netlify response status: ${deployRes.status} ${deployRes.statusText}`);
    
    const deployText = await deployRes.text();
    console.log(`📄 Netlify response body (first 500 chars): ${deployText.substring(0, 500)}`);

    let deployResult;
    try {
      deployResult = JSON.parse(deployText);
      console.log('✅ Successfully parsed JSON response');
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError.message);
      console.error('📄 Full response text:', deployText);
      
      return {
        statusCode: deployRes.status || 500,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON response from Netlify',
          status: deployRes.status,
          statusText: deployRes.statusText,
          responseBody: deployText.substring(0, 1000), // First 1000 chars for debugging
          parseError: parseError.message
        })
      };
    }

    if (!deployRes.ok) {
      console.error('❌ Netlify deploy error:', deployResult);
      return {
        statusCode: deployRes.status,
        headers,
        body: JSON.stringify({ 
          error: typeof deployResult === 'string' ? deployResult : deployResult.message, 
          details: deployResult 
        })
      };
    }

    // Set all environment variables (Firebase config + client ID)
    try {
      await setClientEnvVar(siteId, clientId, NETLIFY_TOKEN);
      console.log('✅ All environment variables set successfully');
    } catch (e) {
      console.warn('⚠️ Failed to set some environment variables:', e.result || e.message);
    }

    console.log('🎉 Client site redeployed successfully!');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Client site redeployed successfully with updated template",
        deployUrl: deployResult.deploy_ssl_url || deployResult.ssl_url,
        deployId: deployResult.id,
        siteUrl: deployResult.ssl_url,
        clientId: clientId,
        clientName: clientName,
        deployResult: deployResult
      })
    };

  } catch (error) {
    console.error('❌ Error in redeploy-client-site:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message, 
        stack: error.stack,
        details: 'Check Netlify function logs for more information'
      })
    };
  }
};

// Utility function to set all required environment variables (copying main site config)
async function setClientEnvVar(siteId, clientId, NETLIFY_TOKEN) {
  const url = `https://api.netlify.com/api/v1/sites/${siteId}/env/vars`;
  
  // All environment variables that need to be copied from main site
  const envVars = [
    { key: 'VITE_CLIENT_ID', value: clientId },
    { key: 'VITE_FIREBASE_API_KEY', value: process.env.VITE_FIREBASE_API_KEY },
    { key: 'VITE_FIREBASE_AUTH_DOMAIN', value: process.env.VITE_FIREBASE_AUTH_DOMAIN },
    { key: 'VITE_FIREBASE_PROJECT_ID', value: process.env.VITE_FIREBASE_PROJECT_ID },
    { key: 'VITE_FIREBASE_STORAGE_BUCKET', value: process.env.VITE_FIREBASE_STORAGE_BUCKET },
    { key: 'VITE_FIREBASE_MESSAGING_SENDER_ID', value: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID },
    { key: 'VITE_FIREBASE_APP_ID', value: process.env.VITE_FIREBASE_APP_ID },
    { key: 'VITE_STRIPE_PUBLISHABLE_KEY', value: process.env.VITE_STRIPE_PUBLISHABLE_KEY }
  ];

  const results = [];
  
  for (const envVar of envVars) {
    if (!envVar.value && envVar.key !== 'VITE_CLIENT_ID') {
      console.warn(`⚠️ Skipping ${envVar.key} - not found in main site environment`);
      continue;
    }

    try {
      const body = JSON.stringify({
        key: envVar.key,
        values: [{ context: 'all', value: envVar.value }]
      });

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

      if (res.ok) {
        console.log(`✅ Set ${envVar.key} successfully`);
        results.push({ key: envVar.key, success: true });
      } else {
        console.error(`❌ Failed to set ${envVar.key}:`, result);
        results.push({ key: envVar.key, success: false, error: result });
      }
    } catch (error) {
      console.error(`❌ Error setting ${envVar.key}:`, error.message);
      results.push({ key: envVar.key, success: false, error: error.message });
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`📊 Environment variables result: ${results.filter(r => r.success).length}/${results.length} successful`);
  return results;
}

// Legacy function for backward compatibility
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