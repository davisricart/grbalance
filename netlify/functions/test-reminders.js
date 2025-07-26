const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('🧪 Manual reminder test triggered');
  
  try {
    // Initialize Supabase with service role key
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Import and execute the scheduled reminder function
    const scheduledReminders = require('./scheduled-reminders');
    
    // Execute the reminder function
    const result = await scheduledReminders.handler(event, context);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Manual reminder test completed',
        result: JSON.parse(result.body)
      })
    };

  } catch (error) {
    console.error('❌ Manual reminder test error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Manual test failed', 
        details: error.message 
      })
    };
  }
};