const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event, context) => {
  console.log('Function triggered with API key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');

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

    // Create professional HTML email
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .section { margin: 20px 0; }
            .section h3 { color: #10b981; margin-bottom: 10px; }
            .message-box { background: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>💬 New Contact Form Submission</h2>
            </div>
            
            <div class="content">
                <div class="section">
                    <h3>📋 Contact Details</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                </div>
                
                <div class="section">
                    <h3>💌 Message</h3>
                    <div class="message-box">
                        <p>${message.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Sent from GR Balance Contact Form</p>
                </div>
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