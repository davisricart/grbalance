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

    // Step 1: Deploy basic functional client template
    console.log('🚀 Creating basic client template...');
    
    const clientTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clientName || clientId} - Payment Reconciliation Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      // Client configuration
      window.CLIENT_CONFIG = {
        clientId: '${clientId}',
        clientName: '${clientName || clientId}',
        deployedAt: '${new Date().toISOString()}'
      };
      
      console.log('🚀 Client site loaded for:', window.CLIENT_CONFIG.clientName);
      console.log('📋 Client ID:', window.CLIENT_CONFIG.clientId);
    </script>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">
                    ${clientName || clientId}
                </h1>
                <p class="text-lg text-gray-600">Payment Reconciliation Portal</p>
            </div>
            
            <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div class="flex items-center mb-2">
                    <svg class="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <h3 class="text-lg font-semibold text-green-800">Website Ready!</h3>
                </div>
                <p class="text-green-700">
                    Your payment reconciliation portal is now live and ready for custom script deployment.
                </p>
            </div>
            
            <div class="grid md:grid-cols-2 gap-6 mb-8">
                <div class="border border-gray-200 rounded-lg p-4">
                    <h4 class="font-semibold text-gray-900 mb-2">File Processing</h4>
                    <p class="text-sm text-gray-600">Upload and compare payment files with custom reconciliation scripts.</p>
                </div>
                <div class="border border-gray-200 rounded-lg p-4">
                    <h4 class="font-semibold text-gray-900 mb-2">Data Analysis</h4>
                    <p class="text-sm text-gray-600">Generate insights and reports from your payment data.</p>
                </div>
            </div>
            
            <div class="text-center">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p class="text-sm text-blue-800">
                        <strong>Next Steps:</strong> Custom scripts will be deployed here to enable full functionality for your specific business needs.
                    </p>
                </div>
            </div>
            
            <div class="mt-8 pt-6 border-t border-gray-200 text-center">
                <p class="text-xs text-gray-500">
                    Site ID: ${clientId}<br>
                    Deployed: ${new Date().toLocaleString()}<br>
                    Status: Ready for script deployment
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;

    // Deploy the template
    const formData = new FormData();
    formData.append('index.html', clientTemplate);
    
    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log(`📡 Template deploy response: ${deployRes.status} ${deployRes.statusText}`);

    if (!deployRes.ok) {
      const errorText = await deployRes.text();
      console.error('❌ Failed to deploy template:', errorText);
      return {
        statusCode: deployRes.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to deploy template',
          details: errorText
        })
      };
    }

    console.log('✅ Client template deployed successfully');

    // Step 2: Set all environment variables
    await setClientEnvVar(siteId, clientId, NETLIFY_TOKEN);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Client template deployed successfully",
        siteId: siteId,
        clientId: clientId,
        status: "Template deployed and ready"
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

// Set all required environment variables
async function setClientEnvVar(siteId, clientId, NETLIFY_TOKEN) {
  const url = `https://api.netlify.com/api/v1/sites/${siteId}/env/vars`;
  
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

      if (res.ok) {
        console.log(`✅ Set ${envVar.key} successfully`);
      } else {
        console.error(`❌ Failed to set ${envVar.key}`);
      }
    } catch (error) {
      console.error(`❌ Error setting ${envVar.key}:`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }
}