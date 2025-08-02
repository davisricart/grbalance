const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const { calculateTrialInfoServer, isTrialExpiringSoon, getDaysUntilTrialExpiry } = require('./utils/trialUtils');

exports.handler = async (event, context) => {
  console.log('🔔 Running trial expiration reminder check...');
  
  try {
    // Initialize Supabase with service role key for full access
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Initialize Resend
    const resend = new Resend(process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY);

    // Calculate 3 days from now (when trial expires)
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    const elevenDaysAgo = new Date(now.getTime() - (11 * 24 * 60 * 60 * 1000)); // Trial started 11 days ago = expires in 3 days

    console.log('🔍 Looking for trials that expire in 3 days (started around):', elevenDaysAgo.toISOString());

    // Find trial users (we'll filter by date below)
    const { data: usersNeedingReminders, error } = await supabase
      .from('usage')
      .select(`
        id, 
        subscriptionTier, 
        status
      `)
      .eq('status', 'trial');

    if (error) {
      console.error('❌ Error fetching trial users from usage table:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database query failed' })
      };
    }

    if (!usersNeedingReminders || usersNeedingReminders.length === 0) {
      console.log('📊 No trial users found in usage table');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No trial users need expiration reminders',
          processed: 0
        })
      };
    }

    // Get user details from auth and clients tables
    const userIds = usersNeedingReminders.map(u => u.id);
    
    // Get user emails and business info from clients table
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, email, business_name, created_at')
      .in('id', userIds);

    if (clientsError) {
      console.error('❌ Error fetching client data:', clientsError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Client data fetch failed' })
      };
    }

    // Filter for users whose trial expires in ~3 days using centralized trial utilities
    const usersExpiringIn3Days = clientsData?.filter(client => {
      const daysUntilExpiry = getDaysUntilTrialExpiry(client.created_at);
      
      // Send reminder when 2-4 days left (gives some buffer for timing)
      return daysUntilExpiry >= 2 && daysUntilExpiry <= 4;
    }) || [];

    console.log(`📊 Found ${usersExpiringIn3Days.length} users with trials expiring in ~3 days`);

    if (usersExpiringIn3Days.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No users have trials expiring in 3 days',
          processed: 0
        })
      };
    }

    let emailsSent = 0;
    let errors = [];

    // Process each user
    for (const client of usersExpiringIn3Days) {
      try {
        // Calculate exact days left using centralized trial utilities
        const trialInfo = calculateTrialInfoServer(client.created_at);
        const daysLeft = trialInfo.daysLeft;
        const trialExpiresAt = trialInfo.expiresAt;

        console.log(`📧 Sending trial expiration reminder to: ${client.email} (${client.business_name}) - ${daysLeft} days left`);

        // Create gentle reminder email content
        const emailContent = createTrialExpirationEmail(client, daysLeft, trialExpiresAt);

        // Send email via Resend
        const emailResult = await resend.emails.send({
          from: 'Davis from GR Balance <davis@grbalance.com>',
          to: client.email,
          subject: 'Your GR Balance trial ends soon',
          html: emailContent
        });

        if (emailResult.error) {
          console.error(`❌ Email failed for ${client.email}:`, emailResult.error);
          errors.push({ email: client.email, error: emailResult.error });
          continue;
        }

        // For now, just count successful emails (we can add reminder tracking later if needed)
        emailsSent++;
        console.log(`✅ Trial expiration reminder sent successfully to ${client.email}`);

      } catch (userError) {
        console.error(`❌ Failed to process user ${client.email}:`, userError);
        errors.push({ email: client.email, error: userError.message });
      }
    }

    console.log(`🎉 Trial expiration reminder process complete: ${emailsSent} emails sent, ${errors.length} errors`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Trial expiration reminder process completed',
        emailsSent,
        errors: errors.length,
        processed: usersExpiringIn3Days.length
      })
    };

  } catch (error) {
    console.error('❌ Trial expiration reminder function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Function execution failed', details: error.message })
    };
  }
};

// Helper function to create gentle trial expiration reminder email
function createTrialExpirationEmail(client, daysLeft, expiresAt) {
  const businessName = client.business_name || 'there';
  const downloadDeadline = new Date(expiresAt.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days after expiry
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #374151; 
              margin: 0;
              padding: 0;
              background-color: #f9fafb;
            }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #059669; }
            .content { 
              background: white; 
              padding: 30px; 
              border-radius: 8px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              margin-bottom: 20px;
            }
            .gentle-button { 
              display: inline-block; 
              background: #059669; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: 500;
              margin: 15px 0;
            }
            .subtle-note {
              background: #f0f9f4;
              border-left: 4px solid #059669;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer { 
              text-align: center; 
              font-size: 14px; 
              color: #6b7280; 
              background: white;
              padding: 20px;
              border-radius: 8px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">GR Balance</div>
            </div>
            
            <div class="content">
                <p>Hi ${businessName},</p>
                
                <p>Just a heads up - your 14-day GR Balance trial expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} (on ${expiresAt.toLocaleDateString()}).</p>
                
                <p>If the system has been helpful for catching payment discrepancies and saving you time, you can continue with a paid plan. If not, no worries at all - your data will be available for download until ${downloadDeadline.toLocaleDateString()}.</p>
                
                <div class="subtle-note">
                    <strong>No pressure!</strong> We only want clients who find real value in automated reconciliation. If GR Balance isn't the right fit, that's perfectly fine.
                </div>
                
                <p>If you'd like to continue:</p>
                <div style="text-align: center;">
                    <a href="https://grbalance.com/${client.business_name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}/billing" class="gentle-button">View Subscription Options</a>
                </div>
                
                <p>Questions? Just reply to this email.</p>
                
                <p>Thanks,<br>
                Davis</p>
            </div>
            
            <div class="footer">
                <p>GR Balance - Automated Reconciliation Made Simple</p>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                    You're receiving this because your free trial is ending soon.<br>
                    This is the only reminder you'll receive about trial expiration.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}