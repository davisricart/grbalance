const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  console.log('🚀 Approve-client-live function called');
  
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
    const { clientId, userData } = JSON.parse(event.body || '{}');
    
    if (!clientId || !userData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    console.log('🎯 Going LIVE with client:', clientId);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Update client status to APPROVED/LIVE
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    if (updateError) {
      console.error('❌ Error updating client status:', updateError);
      throw new Error(`Failed to update client: ${updateError.message}`);
    }

    // Also save to approved users table (your existing flow)
    const approvedUserData = {
      ...userData,
      status: 'approved',
      approved_at: new Date().toISOString(),
      go_live_at: new Date().toISOString()
    };

    const { error: approveError } = await supabase
      .from('approved_users')
      .upsert(approvedUserData);

    if (approveError) {
      console.error('❌ Error saving approved user:', approveError);
      throw new Error(`Failed to approve user: ${approveError.message}`);
    }

    console.log('✅ Client successfully went LIVE:', clientId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Client approved and is now LIVE',
        clientId: clientId,
        status: 'approved',
        approvedAt: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('❌ Error in approve-client-live:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to approve client',
        message: error.message
      }),
    };
  }
};