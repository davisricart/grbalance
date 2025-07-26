const { Resend } = require('resend');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const { clientEmail, businessName, tier } = JSON.parse(event.body);

    // Validate required fields
    if (!clientEmail || !businessName || !tier) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: clientEmail, businessName, tier' })
      };
    }

    // Initialize Resend with API key from environment variables
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Create the HTML email content
    const htmlContent = `
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
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 40px 20px; 
            }
            .header { 
              border-left: 4px solid #10b981; 
              padding-left: 15px;
              margin-bottom: 30px;
            }
            .header h2 {
              margin: 0;
              color: #10b981;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              background: #ffffff;
              padding: 0 15px;
            }
            .welcome-text {
              margin: 20px 0;
              font-size: 16px;
            }
            .features {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .features ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .features li {
              margin: 10px 0;
              padding-left: 24px;
              position: relative;
            }
            .features li:before {
              content: "✓";
              color: #10b981;
              position: absolute;
              left: 0;
            }
            .button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Welcome to GR Balance</h2>
            </div>
            
            <div class="content">
                <div class="welcome-text">
                    Hi ${businessName},<br>
                    Your GR Balance account is now active and ready to use.
                </div>
                
                <div class="features">
                    <ul>
                        <li>Plan: ${tier} Plan</li>
                        <li>1-hour free trial included (for testing)</li>
                        <li>Full access to all features</li>
                        <li>Login at: <strong>grbalance.com</strong></li>
                        <li>Use the same email/password you registered with</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="https://grbalance.com" class="button">Login Now</a>
                </div>
                
                <p>Need help? Email us at davis@grbalance.com</p>
            </div>
            
            <div class="footer">
                GR Balance - Automated Reconciliation Made Simple
            </div>
        </div>
    </body>
    </html>
    `;

    // Send email using Resend API
    const response = await resend.emails.send({
      from: 'GR Balance Team <davis@grbalance.com>',
      to: clientEmail,
      subject: 'Welcome to GR Balance - Account Activated',
      html: htmlContent,
    });

    console.log('✅ Welcome email sent successfully:', response);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        emailId: response.data?.id
      })
    };

  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to send welcome email',
        details: error.message
      })
    };
  }
};