const fetch = require('node-fetch');

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

    console.log(`🚀 Connecting client site to main repository for ${clientName} (${clientId})`);

    // Step 1: Connect client site to main repository with correct API format
    const updateSiteRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        build_settings: {
          provider: 'github',
          repo_url: 'https://github.com/davisricart/grbalance',
          branch: 'main',
          cmd: 'npm run build',
          dir: 'dist'
        }
      })
    });

    console.log(`📡 Site connection response: ${updateSiteRes.status} ${updateSiteRes.statusText}`);

    if (!updateSiteRes.ok) {
      const errorText = await updateSiteRes.text();
      console.error('❌ Failed to connect site to repository:', errorText);
      return {
        statusCode: updateSiteRes.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to connect site to repository',
          details: errorText
        })
      };
    }

    console.log('✅ Client site connected to main repository');

    // Step 2: Set environment variables using new API
    await setClientEnvVars(siteId, clientId, NETLIFY_TOKEN);

    // Step 3: Trigger deployment
    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/builds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clear_cache: true
      })
    });

    console.log(`📡 Build trigger response: ${deployRes.status} ${deployRes.statusText}`);

    if (!deployRes.ok) {
      const errorText = await deployRes.text();
      console.error('❌ Failed to trigger build:', errorText);
      return {
        statusCode: deployRes.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to trigger build',
          details: errorText
        })
      };
    }

    console.log('✅ Build triggered successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Client site connected to repository and deployment triggered",
        siteId: siteId,
        clientId: clientId,
        status: "Building complete React app from main repository"
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

// Set environment variables using new Netlify API
async function setClientEnvVars(siteId, clientId, NETLIFY_TOKEN) {
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

  for (const envVar of envVars) {
    if (!envVar.value && envVar.key !== 'VITE_CLIENT_ID') {
      console.warn(`⚠️ Skipping ${envVar.key} - not found in main site environment`);
      continue;
    }

    try {
      const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/env/vars`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NETLIFY_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: envVar.key,
          values: [{ context: 'all', value: envVar.value }]
        })
      });

      if (res.ok) {
        console.log(`✅ Set ${envVar.key} successfully`);
      } else {
        console.error(`❌ Failed to set ${envVar.key}:`, await res.text());
      }
    } catch (error) {
      console.error(`❌ Error setting ${envVar.key}:`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }
}