const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('🔄 Running pending users migration...');
  
  try {
    // Initialize Supabase with service role key for full access
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get all pending users that don't exist in clients table
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('pendingUsers')
      .select('*');

    if (pendingError) {
      console.error('❌ Error fetching pending users:', pendingError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch pending users' })
      };
    }

    if (!pendingUsers || pendingUsers.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No pending users to migrate',
          migrated: 0
        })
      };
    }

    console.log(`📊 Found ${pendingUsers.length} pending users to check`);

    let migrated = 0;
    let errors = [];

    for (const user of pendingUsers) {
      try {
        // Check if user already exists in clients table
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('id', user.id)
          .single();

        if (existingClient) {
          console.log(`⏭️ User ${user.email} already exists in clients table, skipping`);
          continue;
        }

        // Generate client_path from business name or email
        const generateClientPath = (businessName, email) => {
          const cleanName = businessName?.toLowerCase().replace(/[^a-z0-9]/g, '');
          const emailPrefix = email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanName || emailPrefix || 'client';
        };

        const client_path = generateClientPath(user.businessname, user.email);

        // Create client record
        const clientData = {
          id: user.id,
          email: user.email,
          business_name: user.businessname || 'Business Name Not Set',  // Fixed: lowercase from pendingUsers
          client_path: client_path,
          subscription_tier: user.subscriptiontier || 'starter',      // Fixed: lowercase from pendingUsers
          status: 'testing', // Maps to pending workflow stage
          created_at: user.createdat,                                 // Fixed: lowercase from pendingUsers
          updated_at: new Date().toISOString()
        };

        console.log(`🔄 Migrating user: ${user.email} -> clients table`);

        const { error: clientError } = await supabase
          .from('clients')
          .upsert(clientData);

        if (clientError) {
          console.error(`❌ Failed to migrate ${user.email}:`, clientError);
          errors.push({ email: user.email, error: clientError.message });
          continue;
        }

        migrated++;
        console.log(`✅ Successfully migrated ${user.email}`);

      } catch (userError) {
        console.error(`❌ Error processing user ${user.email}:`, userError);
        errors.push({ email: user.email, error: userError.message });
      }
    }

    console.log(`🎉 Migration complete: ${migrated} users migrated, ${errors.length} errors`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Migration completed',
        migrated,
        errors: errors.length,
        errorDetails: errors
      })
    };

  } catch (error) {
    console.error('❌ Migration function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Migration failed', details: error.message })
    };
  }
};