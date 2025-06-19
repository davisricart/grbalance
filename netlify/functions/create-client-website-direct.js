exports.handler = async function(event, context) {
  console.log('🚀 Create-client-website-direct function called');
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { clientId, clientPath, businessName, email, subscriptionTier } = JSON.parse(event.body || '{}');
    
    if (!clientId || !clientPath) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    console.log('🏗️ Creating client website:', { clientId, clientPath, businessName });

    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not configured');
    }

    // Create client data
    const clientData = {
      id: clientId,
      client_path: clientPath,
      business_name: businessName,
      email: email,
      subscription_tier: subscriptionTier,
      website_created: true,
      website_created_at: new Date().toISOString(),
      status: 'testing',
      site_url: `https://grbalance.netlify.app/${clientPath}`,
      deployed_scripts: [],
      usage: {
        comparisons_used: 0,
        comparisons_limit: subscriptionTier === 'business' ? 500 : 
                          subscriptionTier === 'professional' ? 200 : 100
      }
    };

    // Use fetch to call Supabase REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/clients`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(clientData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Supabase API error:', response.status, errorText);
      throw new Error(`Supabase API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Client website created in Supabase:', result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Client website created successfully',
        clientData: result[0] || result,
        siteUrl: clientData.site_url,
        clientId: clientId
      }),
    };

  } catch (error) {
    console.error('❌ Error in create-client-website-direct:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create client website',
        message: error.message,
        details: error.stack
      }),
    };
  }
};