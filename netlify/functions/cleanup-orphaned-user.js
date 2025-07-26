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
    const { email } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
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

    console.log('🧹 Cleaning up orphaned auth user:', email);

    // Step 1: Find the user in auth by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Failed to list users:', listError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to search for user', details: listError.message })
      };
    }

    // Find user by email
    const targetUser = users.users.find(user => user.email === email);
    
    if (!targetUser) {
      console.log('ℹ️ No auth user found with email:', email);
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: 'No orphaned auth user found with that email - already clean!' 
        })
      };
    }

    const userId = targetUser.id;
    console.log('🎯 Found orphaned auth user:', userId, 'with email:', email);

    // Step 2: Clean up any remaining database records (optional - might not exist)
    try {
      // Try to clean from usage table (might not exist)
      const { error: usageError } = await supabase
        .from('usage')
        .delete()
        .eq('id', userId);

      if (usageError && usageError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.warn('⚠️ Usage table cleanup warning (non-critical):', usageError.message);
      } else {
        console.log('✅ Cleaned usage table (if any records existed)');
      }

      // Try to clean from pendingUsers table (might not exist)
      const { error: pendingError } = await supabase
        .from('pendingUsers')
        .delete()
        .eq('id', userId);

      if (pendingError && pendingError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.warn('⚠️ Pending users cleanup warning (non-critical):', pendingError.message);
      } else {
        console.log('✅ Cleaned pendingUsers table (if any records existed)');
      }

      // Try to clean from ready-for-testing table (might not exist)
      const { error: readyError } = await supabase
        .from('ready-for-testing')
        .delete()
        .eq('id', userId);

      if (readyError && readyError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.warn('⚠️ Ready-for-testing cleanup warning (non-critical):', readyError.message);
      } else {
        console.log('✅ Cleaned ready-for-testing table (if any records existed)');
      }

    } catch (dbError) {
      console.warn('⚠️ Database cleanup had issues (continuing with auth cleanup):', dbError.message);
    }

    // Step 3: Delete from auth.users (the main goal)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('❌ Auth user deletion failed:', authError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to delete auth user', details: authError.message })
      };
    }

    console.log('✅ Successfully deleted orphaned auth user');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: `Orphaned auth user (${email}) completely cleaned up! You can now register again.` 
      })
    };

  } catch (error) {
    console.error('🚨 Cleanup function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};