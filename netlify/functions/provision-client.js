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

    const { clientId, clientName } = JSON.parse(event.body);
    
    if (!clientId || !clientName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" })
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

    // Step 1: Create the site
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    const siteName = `${clientName.toLowerCase().replace(/\s+/g, '-')}-${uniqueSuffix}`;
    const siteRes = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: siteName,
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

    // Step 2: Wait a moment for site to be fully created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Set environment variable CLIENT_ID for the site with retry logic (optional)
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