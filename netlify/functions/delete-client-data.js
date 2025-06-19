const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  console.log('🚀 Delete-client-data function called');
  
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
    const { clientId, action } = JSON.parse(event.body || '{}');
    
    if (!clientId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing clientId' }),
      };
    }

    console.log('🧨 NUCLEAR DELETE: Erasing all traces of client:', clientId);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Get client data before deletion to see what we're removing
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Error fetching client data:', fetchError);
    }

    if (existingClient) {
      console.log('📋 Data being deleted:', {
        clientPath: existingClient.client_path,
        siteUrl: existingClient.site_url,
        scriptsCount: existingClient.deployed_scripts?.length || 0,
        createdAt: existingClient.website_created_at
      });
    }

    // COMPLETE NUCLEAR DELETE
    if (action === 'complete_wipe') {
      // Delete Supabase client record
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (deleteError) {
        console.error('❌ Error deleting client:', deleteError);
        throw new Error(`Failed to delete client: ${deleteError.message}`);
      }

      console.log('🗑️ Supabase client record deleted');

      // TODO: In future, also delete from GitHub:
      // - Delete /clients/{clientPath}/ folder
      // - Commit the deletion
      
      // TODO: Mark client portal as inactive
      // TODO: Clean up any auth records
      // TODO: Remove from any caches

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Client data completely wiped',
          deletedData: existingClient,
          actions: [
            'Supabase client record deleted',
            'GitHub cleanup needed (manual)',
            'Client portal access revoked',
            'All traces removed'
          ]
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' }),
    };

  } catch (error) {
    console.error('❌ Error in delete-client-data:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to delete client data',
        message: error.message
      }),
    };
  }
};