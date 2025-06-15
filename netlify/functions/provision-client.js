const fetch = require('node-fetch');

async function setEnvVarWithRetry(siteId, clientId, NETLIFY_TOKEN, retries = 3) {
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
    
    console.log(`Env var attempt ${i + 1} failed with 404, retrying in 3 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

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
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Body:', event.body);

    const { clientId, clientName, siteName, checkAvailability } = JSON.parse(event.body);
    
    if (!clientId || !clientName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }

    const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;
    
    // Check if we're in development mode without a token
    const isDevelopment = !NETLIFY_TOKEN;
    
    if (isDevelopment) {
      // Return mock response for development with standardized naming
      console.log('🧪 Development mode - returning mock provisioning response');
      const mockSiteName = siteName || `${clientId}-grbalance`;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "Mock site created for development!",
          siteUrl: `https://${mockSiteName}.netlify.app`,
          siteId: `mock-site-${Date.now()}`,
          siteName: mockSiteName,
          envVarSet: "Mock environment variable set",
          warning: "This is a development mock. Set NETLIFY_TOKEN for real provisioning."
        })
      };
    }
    
    if (!NETLIFY_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Missing Netlify token" })
      };
    }

    // Step 1: Determine site name with standardized format
    let finalSiteName;
    if (siteName) {
      // Use provided site name (already formatted)
      finalSiteName = siteName;
    } else {
      // Generate standardized name: businessname-grbalance
      const cleanName = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/[-]+/g, '-').replace(/^-|-$/g, '');
      finalSiteName = `${cleanName}-grbalance`;
    }

    // Step 2: Check name availability if requested
    if (checkAvailability) {
      const checkRes = await fetch(`https://api.netlify.com/api/v1/sites/${finalSiteName}.netlify.app`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        }
      });
      
      if (checkRes.ok) {
        // Site already exists, add unique suffix
        const uniqueSuffix = Math.random().toString(36).substring(2, 6);
        finalSiteName = `${clientId}-${uniqueSuffix}-grbalance`;
      }
    }

    // Step 3: Create the site with standardized name
    const siteRes = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: finalSiteName,
        repo: {
          provider: 'github',
          repo: process.env.GITHUB_REPO || 'your-username/grbalance',
          branch: 'main',
          dir: '/',
          cmd: 'npm run build',
          allowed_branches: ['main']
        },
        build_settings: {
          cmd: 'npm run build',
          dir: 'dist',
          env: {
            VITE_CLIENT_ID: clientId,
            VITE_CLIENT_NAME: clientName,
            VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
            VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
            VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
            VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
            VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID
          }
        }
      }),
    });

    const site = await siteRes.json();
    if (!siteRes.ok) {
      console.error('Netlify site creation error:', site);
      return {
        statusCode: siteRes.status,
        headers,
        body: JSON.stringify({ error: site.message, details: site })
      };
    }

    // Step 4: Wait a moment for site to be fully created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Set environment variable CLIENT_ID for the site with retry logic (optional)
    let envResult = null;
    let envWarning = null;
    try {
      envResult = await setEnvVarWithRetry(site.id, clientId, NETLIFY_TOKEN, 2);
      console.log('✅ Environment variable set successfully');
    } catch (e) {
      console.warn('⚠️ Failed to set environment variable, but site was created successfully:', e);
      envWarning = `Environment variable not set: ${e.result || e.message}`;
      // Don't fail the entire provisioning - the site is created and functional
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Site created successfully!",
        siteUrl: site.ssl_url,
        siteId: site.id,
        siteName: site.name,
        envVarSet: envResult ? "Environment variable set successfully" : false,
        warning: envWarning || (envResult ? null : "Environment variable CLIENT_ID was not set automatically. Please set it manually in the Netlify dashboard.")
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message, stack: error.stack, full: error })
    };
  }
}; 