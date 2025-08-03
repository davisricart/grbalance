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
    const { userId } = JSON.parse(event.body);
    
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' })
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

    console.log('🗑️ Deleting user:', userId);

    // Step 1: Get client_path before deletion to clean up any related records
    const { data: clientData } = await supabase
      .from('clients')
      .select('client_path, email')
      .eq('id', userId)
      .single();
    
    console.log('🔍 Found client data for deletion:', clientData);

    // Step 2: Delete from clients table (contains client_path constraint)
    const { error: clientsError } = await supabase
      .from('clients')
      .delete()
      .eq('id', userId);

    if (clientsError) {
      console.log('⚠️ Clients table deletion warning:', clientsError.message);
      // Don't fail if clients record doesn't exist, just log it
    } else {
      console.log('✅ Deleted from clients table');
    }

    // Step 2a: Clean up any duplicate client records with same client_path (collision prevention)
    if (clientData?.client_path) {
      console.log('🧹 Cleaning up duplicate client records with path:', clientData.client_path);
      const { error: duplicateError } = await supabase
        .from('clients')
        .delete()
        .eq('client_path', clientData.client_path);
      
      if (duplicateError) {
        console.log('⚠️ Duplicate client cleanup warning:', duplicateError.message);
      } else {
        console.log('✅ Cleaned up duplicate client records');
      }
    }

    // Step 3: Delete from usage table
    const { error: usageError } = await supabase
      .from('usage')
      .delete()
      .eq('id', userId);

    if (usageError) {
      console.error('❌ Usage table deletion failed:', usageError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to delete user data', details: usageError.message })
      };
    }

    console.log('✅ Deleted from usage table');

    // Step 4: Delete from auth.users
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('❌ Auth user deletion failed:', authError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to delete auth user', details: authError.message })
      };
    }

    console.log('✅ Deleted from auth.users');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'User completely deleted from both database and authentication' 
      })
    };

  } catch (error) {
    console.error('🚨 Delete user function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};