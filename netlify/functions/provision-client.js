const fetch = require('node-fetch');
const FormData = require('form-data');

// Set all required environment variables (copying main site config)
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

    // Step 3: Create the site with standardized name (MANUAL DEPLOY - NO GIT)
    const siteRes = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: finalSiteName,
        // Remove repo configuration to create manual deploy site
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

    // Step 5: Deploy the full main site template to the new client site
    try {
      console.log('🚀 Deploying full site template to new client...');
      
      // Create form data with the main site build
      const formData = new FormData();
      const fs = require('fs');
      const path = require('path');
      
      // Use the current main site's build (dist folder from the main site)
      const distPath = path.join(process.cwd(), 'dist');
      
      // Check if dist folder exists
      if (!fs.existsSync(distPath)) {
        throw new Error('Main site dist folder not found. Please build the main site first.');
      }

      console.log(`📁 Reading files from main site build: ${distPath}`);

      // Read the main HTML file and customize for client
      const indexPath = path.join(distPath, 'index.html');
      let indexHtml = fs.readFileSync(indexPath, 'utf8');
      
      // Update the title with client name
      indexHtml = indexHtml.replace(
        /<title>.*?<\/title>/,
        `<title>${clientName || clientId} - Payment Reconciliation Portal</title>`
      );
      
      // Add client configuration script
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
      
      // Read and add all assets from dist folder (same as redeploy function)
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
      
      console.log('✅ Full site template files loaded successfully');
      
      // Deploy all files to the site
      const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NETLIFY_TOKEN}`,
          ...formData.getHeaders()
        },
        body: formData
      });
      
      const deployResult = await deployRes.json();
      if (!deployRes.ok) {
        console.warn('⚠️ Failed to deploy full site template, but site was created:', deployResult);
      } else {
        console.log('✅ Full site template deployed successfully');
      }
      
    } catch (deployError) {
      console.warn('⚠️ Failed to deploy full site template, but site was created:', deployError.message);
      // Don't fail the entire provisioning - the site is created
    }

    // Step 6: Set all environment variables (Firebase config + client ID)
    let envResult = null;
    let envWarning = null;
    try {
      envResult = await setClientEnvVar(site.id, clientId, NETLIFY_TOKEN);
      console.log('✅ All environment variables set successfully');
    } catch (e) {
      console.warn('⚠️ Failed to set environment variables, but site was created successfully:', e);
      envWarning = `Environment variables not set: ${e.result || e.message}`;
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