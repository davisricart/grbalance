const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  console.log('🚀 Create-client-website function called');
  
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

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Create comprehensive client data
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
      },
      settings: {
        theme: 'default',
        customization: {},
        features: {
          advanced_reports: subscriptionTier === 'business',
          bulk_export: subscriptionTier !== 'starter',
          api_access: subscriptionTier === 'business'
        }
      },
      analytics: {
        last_login: null,
        total_comparisons: 0,
        created_reports: 0
      }
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from('clients')
      .upsert(clientData)
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ Client website created in Supabase:', data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Client website created successfully',
        clientData: data[0],
        siteUrl: clientData.site_url,
        clientId: clientId
      }),
    };

  } catch (error) {
    console.error('❌ Error in create-client-website:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create client website',
        message: error.message
      }),
    };
  }
};