const { Resend } = require('resend');

const resend = new Resend(process.env.VITE_RESEND_API_KEY);

exports.handler = async (event, context) => {
  console.log('Function triggered with API key:', process.env.VITE_RESEND_API_KEY ? 'Present' : 'Missing');

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { name, email, subject, message } = JSON.parse(event.body);
    console.log('Attempting to send email with data:', { name, email, subject });

    // Create minimalistic HTML email
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
            .field {
              margin: 20px 0;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 15px;
            }
            .field:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 500;
              color: #6b7280;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .value {
              margin-top: 5px;
              color: #111827;
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
                <h2>New Contact Message</h2>
            </div>
            
            <div class="content">
                <div class="field">
                    <div class="label">From</div>
                    <div class="value">${name} (${email})</div>
                </div>
                
                <div class="field">
                    <div class="label">Subject</div>
                    <div class="value">${subject}</div>
                </div>
                
                <div class="field">
                    <div class="label">Message</div>
                    <div class="value">${message.replace(/\n/g, '<br>')}</div>
                </div>
            </div>
            
            <div class="footer">
                Sent via GR Balance Contact Form
            </div>
        </div>
    </body>
    </html>
    `;

    const response = await resend.emails.send({
      from: 'GR Balance Contact <davis@grbalance.com>',
      to: 'davis@grbalance.com',
      subject: `[Contact Form] ${subject} - ${name}`,
      html: htmlContent,
      reply_to: email
    });

    console.log('Resend API Response:', response);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Email sent successfully',
        id: response.id
      })
    };
  } catch (error) {
    console.error('Resend Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to send email',
        details: error.message
      })
    };
  }
}; 