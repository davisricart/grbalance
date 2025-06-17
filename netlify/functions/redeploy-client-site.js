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

    console.log(`🚀 Deploying complete React app template to ${clientName} (${clientId})`);

    // Step 1: Fetch the main site's current build
    console.log('📥 Fetching main site build...');
    const mainSiteRes = await fetch('https://grbalance.netlify.app/', {
      headers: {
        'User-Agent': 'GR-Balance-Template-Copier'
      }
    });

    if (!mainSiteRes.ok) {
      throw new Error(`Failed to fetch main site: ${mainSiteRes.status}`);
    }

    let mainSiteHtml = await mainSiteRes.text();
    console.log('✅ Main site HTML fetched successfully');

    // Step 2: Customize for client
    console.log('🔧 Customizing template for client...');
    
    // Update title with client branding
    mainSiteHtml = mainSiteHtml.replace(
      /<title>.*?<\/title>/i,
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
      console.log('🚀 Client site loaded for:', window.CLIENT_CONFIG.clientName);
      console.log('📋 Client ID:', window.CLIENT_CONFIG.clientId);
    </script>`;

    // Insert client config right after <head> tag
    mainSiteHtml = mainSiteHtml.replace(
      /<head>/i,
      `<head>${clientConfig}`
    );

    console.log('✅ Template customized for client');

    // Step 3: Deploy to client site
    console.log('🚀 Deploying to client site...');
    const formData = new FormData();
    formData.append('index.html', mainSiteHtml);

    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log(`📡 Deploy response: ${deployRes.status} ${deployRes.statusText}`);

    if (!deployRes.ok) {
      const errorText = await deployRes.text();
      console.error('❌ Deploy failed:', errorText);
      return {
        statusCode: deployRes.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to deploy to client site',
          details: errorText
        })
      };
    }

    const deployResult = await deployRes.json();
    console.log('✅ Template deployed successfully');

    // Step 4: Set environment variables
    await setClientEnvVars(siteId, clientId, NETLIFY_TOKEN);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Complete React app template deployed successfully",
        siteId: siteId,
        clientId: clientId,
        deployUrl: deployResult.deploy_url || `https://${siteId}.netlify.app`,
        status: "Template deployed with full functionality"
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
        details: 'Template copying failed'
      })
    };
  }
};

// Set environment variables using Netlify Environment Variables API
async function setClientEnvVars(siteId, clientId, NETLIFY_TOKEN) {
  console.log('🔧 Setting environment variables...');
  
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
  
  console.log('✅ Environment variables configuration completed');
}