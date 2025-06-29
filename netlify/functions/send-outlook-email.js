// Netlify Function: Microsoft Graph API Email Sender
// Handles server-side email sending through Outlook 365

// CORS headers for frontend access
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Handle CORS preflight requests
exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('📧 Microsoft Graph Email Function Called');
    
    // Parse request body
    const emailData = JSON.parse(event.body);
    const { to, subject, htmlContent, textContent } = emailData;
    
    if (!to || !subject || !htmlContent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: to, subject, htmlContent' })
      };
    }

    // Check if we have required environment variables
    const {
      MICROSOFT_CLIENT_ID,
      MICROSOFT_CLIENT_SECRET,
      MICROSOFT_TENANT_ID,
      MICROSOFT_USER_ID
    } = process.env;

    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !MICROSOFT_TENANT_ID || !MICROSOFT_USER_ID) {
      console.error('❌ Missing Microsoft Graph environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error - Missing Microsoft Graph credentials',
          details: 'Please configure Azure app registration environment variables'
        })
      };
    }

    console.log('🔐 Initializing Microsoft Graph authentication...');

    // Get access token using OAuth2 client credentials flow
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('❌ Failed to get access token:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Authentication failed',
          details: 'Could not obtain access token from Microsoft'
        })
      };
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('✅ Microsoft Graph access token obtained');

    // Prepare email message for Microsoft Graph API
    const message = {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: htmlContent
      },
      toRecipients: [
        {
          emailAddress: {
            address: to
          }
        }
      ]
    };

    // Add text content if provided
    if (textContent) {
      message.body.content = htmlContent + `\n\n<!-- Text Version:\n${textContent}\n-->`;
    }

    console.log('📤 Sending email via Microsoft Graph API...');

    // Send email using Microsoft Graph API
    const emailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${MICROSOFT_USER_ID}/sendMail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        saveToSentItems: true
      })
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('❌ Failed to send email:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to send email',
          details: error
        })
      };
    }

    console.log('✅ Email sent successfully via Microsoft Graph API!');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Email sent successfully via Microsoft Outlook',
        to: to,
        subject: subject
      })
    };

  } catch (error) {
    console.error('❌ Microsoft Graph Email Function Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
}; 