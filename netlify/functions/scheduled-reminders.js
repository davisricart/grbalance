const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

exports.handler = async (event, context) => {
  console.log('🔔 Running scheduled reminder check...');
  
  try {
    // Initialize Supabase with service role key for full access
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Initialize Resend
    const resend = new Resend(process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY);

    // Get current time and calculate 48 hours ago
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

    console.log('🔍 Checking for users who signed up before:', fortyEightHoursAgo.toISOString());

    // Find pending users who:
    // 1. Signed up more than 48 hours ago
    // 2. Haven't received a reminder yet (or reminder_sent_at is null)
    // 3. Are still in pending status
    const { data: usersNeedingReminders, error } = await supabase
      .from('pendingUsers')
      .select('id, email, businessName, businessType, createdAt, reminder_sent_at, reminder_count')
      .eq('status', 'pending')
      .lt('createdAt', fortyEightHoursAgo.toISOString())
      .or('reminder_sent_at.is.null,reminder_count.is.null,reminder_count.eq.0');

    if (error) {
      console.error('❌ Error fetching pending users:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database query failed' })
      };
    }

    console.log(`📊 Found ${usersNeedingReminders?.length || 0} users needing reminders`);

    if (!usersNeedingReminders || usersNeedingReminders.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'No users need reminders at this time',
          processed: 0
        })
      };
    }

    let emailsSent = 0;
    let errors = [];

    // Process each user
    for (const user of usersNeedingReminders) {
      try {
        console.log(`📧 Sending reminder to: ${user.email} (${user.businessName})`);

        // Create reminder email content
        const emailContent = createReminderEmail(user);

        // Send email via Resend
        const emailResult = await resend.emails.send({
          from: 'GR Balance <noreply@grbalance.com>',
          to: user.email,
          subject: 'Complete Your GR Balance Setup - Book Your Consultation',
          html: emailContent
        });

        if (emailResult.error) {
          console.error(`❌ Email failed for ${user.email}:`, emailResult.error);
          errors.push({ email: user.email, error: emailResult.error });
          continue;
        }

        // Update database to track reminder sent
        const { error: updateError } = await supabase
          .from('pendingUsers')
          .update({
            reminder_sent_at: now.toISOString(),
            reminder_count: (user.reminder_count || 0) + 1,
            last_reminder_type: 'consultation_reminder',
            updatedAt: now.toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Database update failed for ${user.email}:`, updateError);
          errors.push({ email: user.email, error: updateError });
        } else {
          emailsSent++;
          console.log(`✅ Reminder sent successfully to ${user.email}`);
        }

      } catch (userError) {
        console.error(`❌ Failed to process user ${user.email}:`, userError);
        errors.push({ email: user.email, error: userError.message });
      }
    }

    console.log(`🎉 Reminder process complete: ${emailsSent} emails sent, ${errors.length} errors`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Reminder process completed',
        emailsSent,
        errors: errors.length,
        processed: usersNeedingReminders.length
      })
    };

  } catch (error) {
    console.error('❌ Scheduled reminder function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Function execution failed', details: error.message })
    };
  }
};

// Helper function to create reminder email HTML
function createReminderEmail(user) {
  const daysSinceSignup = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));
  
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
            }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #059669; }
            .content { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #059669, #10b981); 
              color: white; 
              padding: 14px 28px; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: 600; 
              margin: 20px 0;
            }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
            .unsubscribe { font-size: 12px; color: #9ca3af; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">GR Balance</div>
            </div>
            
            <div class="content">
                <h2>Your Salon Reconciliation Solution is Ready</h2>
                
                <p>Hi ${user.businessName.split(' ')[0] || 'there'},</p>
                
                <p>You signed up for GR Balance ${daysSinceSignup} ${daysSinceSignup === 1 ? 'day' : 'days'} ago, but we noticed you haven't scheduled your consultation yet.</p>
                
                <p><strong>Don't let processing errors continue costing you money.</strong> Our salon clients typically save $8,400+ annually by catching hidden fees and discrepancies.</p>
                
                <p>Your account for <strong>${user.businessName}</strong> is ready - we just need 15 minutes to understand your payment setup and create your custom reconciliation solution.</p>
                
                <div style="text-align: center;">
                    <a href="https://grbalance.com/book" class="button">Schedule Your Consultation</a>
                </div>
                
                <p><strong>What happens next:</strong></p>
                <ul>
                    <li>15-minute consultation call</li>
                    <li>Custom script built for your business</li>
                    <li>1-hour free trial to test everything</li>
                    <li>Start catching errors immediately</li>
                </ul>
                
                <p>Questions? Just reply to this email.</p>
                
                <p>Best regards,<br>
                The GR Balance Team</p>
            </div>
            
            <div class="footer">
                <p>GR Balance - Automated Reconciliation Made Simple</p>
                <div class="unsubscribe">
                    <p>You're receiving this because you signed up for GR Balance.<br>
                    Don't want reminders? <a href="mailto:davis@grbalance.com?subject=Unsubscribe%20Reminders">Let us know</a></p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}