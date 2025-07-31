// Daily reminder orchestrator - calls both reminder functions automatically
exports.handler = async (event, context) => {
  console.log('🔔 Running daily automated reminder check...');
  
  const results = {
    consultationReminders: null,
    trialExpirationReminders: null,
    errors: []
  };

  try {
    // Import both reminder functions
    const consultationReminders = require('./scheduled-reminders');
    const trialExpirationReminders = require('./trial-expiration-reminders');

    // Run consultation reminders
    try {
      console.log('📧 Running consultation reminders...');
      const consultationResult = await consultationReminders.handler(event, context);
      results.consultationReminders = JSON.parse(consultationResult.body);
      console.log('✅ Consultation reminders completed');
    } catch (error) {
      console.error('❌ Consultation reminders failed:', error);
      results.errors.push({ type: 'consultation', error: error.message });
    }

    // Run trial expiration reminders
    try {
      console.log('📧 Running trial expiration reminders...');
      const trialResult = await trialExpirationReminders.handler(event, context);
      results.trialExpirationReminders = JSON.parse(trialResult.body);
      console.log('✅ Trial expiration reminders completed');
    } catch (error) {
      console.error('❌ Trial expiration reminders failed:', error);
      results.errors.push({ type: 'trial_expiration', error: error.message });
    }

    console.log('🎉 Daily reminder check completed');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Daily reminder check completed',
        timestamp: new Date().toISOString(),
        results: results
      })
    };

  } catch (error) {
    console.error('❌ Daily reminder orchestrator error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Daily reminder orchestrator failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};