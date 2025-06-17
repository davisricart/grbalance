const fetch = require('node-fetch');
const FormData = require('form-data');
const JSZip = require('jszip');

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

    console.log(`🚀 Deploying complete React app to ${clientName} (${clientId})`);

    // Step 1: Get the current deployment of main site
    console.log('📥 Fetching main site deployment info...');
    const mainSiteDeployRes = await fetch('https://api.netlify.com/api/v1/sites/grbalance.netlify.app/deploys', {
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`
      }
    });
    
    if (!mainSiteDeployRes.ok) {
      throw new Error(`Failed to fetch main site deploys: ${mainSiteDeployRes.status}`);
    }
    
    const deploys = await mainSiteDeployRes.json();
    const latestDeploy = deploys.find(d => d.state === 'ready') || deploys[0];
    
    if (!latestDeploy) {
      throw new Error('No ready deployment found for main site');
    }

    // Step 2: Download the complete site archive
    console.log('📦 Downloading complete site archive...');
    const archiveRes = await fetch(`https://api.netlify.com/api/v1/sites/grbalance.netlify.app/deploys/${latestDeploy.id}/files`, {
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Accept': 'application/zip'
      }
    });
    
    if (!archiveRes.ok) {
      throw new Error(`Failed to download site archive: ${archiveRes.status}`);
    }
    
    const archiveBuffer = await archiveRes.buffer();
    console.log('✅ Site archive downloaded successfully');

    // Step 3: Modify HTML for client branding
    console.log('🔧 Customizing for client...');
    const zip = await JSZip.loadAsync(archiveBuffer);
    
    // Get and modify index.html
    const indexFile = zip.file('index.html');
    if (!indexFile) {
      throw new Error('index.html not found in site archive');
    }
    
    let htmlContent = await indexFile.async('string');
    
    // Customize for client
    htmlContent = htmlContent.replace(
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
    </script>`;

    htmlContent = htmlContent.replace(/<head>/i, `<head>${clientConfig}`);
    
    // Update the HTML in the zip
    zip.file('index.html', htmlContent);

    // Step 4: Deploy the complete modified archive
    console.log('🚀 Deploying complete app to client site...');
    const modifiedArchive = await zip.generateAsync({ type: 'nodebuffer' });
    
    const formData = new FormData();
    formData.append('file', modifiedArchive, 'site.zip');

    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!deployRes.ok) {
      const errorText = await deployRes.text();
      console.error('❌ Deploy failed:', errorText);
      return {
        statusCode: deployRes.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to deploy complete app',
          details: errorText
        })
      };
    }

    const deployResult = await deployRes.json();
    console.log('✅ Complete React app deployed successfully');

    // Step 5: Set environment variables
    await setClientEnvVars(siteId, clientId, NETLIFY_TOKEN);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Complete React app deployed successfully",
        siteId: siteId,
        clientId: clientId,
        deployUrl: deployResult.deploy_url,
        status: "Full app with all assets deployed"
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
        details: 'Complete app deployment failed'
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