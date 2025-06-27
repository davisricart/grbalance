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

    // Step 1: Delete from usage table
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

    // Step 2: Delete from auth.users
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