const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { clientPath } = JSON.parse(event.body);
    
    if (!clientPath) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Client path is required' })
      };
    }

    // Initialize Supabase with service role key for admin operations
    const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🗑️ Cleaning up client_path:', clientPath);

    // Delete from clients table by client_path
    const { data, error } = await supabase
      .from('clients')
      .delete()
      .eq('client_path', clientPath)
      .select();

    if (error) {
      console.error('❌ Client path cleanup failed:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to cleanup client path', details: error.message })
      };
    }

    console.log('✅ Cleaned up client_path records:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: `Client path '${clientPath}' cleaned up successfully`,
        deletedRecords: data?.length || 0
      })
    };

  } catch (error) {
    console.error('🚨 Cleanup client path function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};