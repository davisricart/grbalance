// Enhanced debug function for Stripe checkout sessions
// Temporary endpoint to diagnose production issues

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { sessionId } = JSON.parse(event.body);
    
    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'sessionId required' })
      };
    }

    console.log('🔍 Debugging session:', sessionId);

    // Retrieve the session details
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    });

    // Get account info to verify setup
    const account = await stripe.accounts.retrieve();

    const debugInfo = {
      // Session details
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        mode: session.mode,
        url: session.url,
        created: new Date(session.created * 1000).toISOString(),
        expires_at: new Date(session.expires_at * 1000).toISOString(),
        customer: session.customer,
        subscription: session.subscription
      },
      
      // Account verification
      account: {
        id: account.id,
        business_profile: account.business_profile,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        country: account.country,
        default_currency: account.default_currency
      },
      
      // Environment info
      environment: {
        stripe_key_prefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
        webhook_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
        timestamp: new Date().toISOString()
      }
    };

    // Check for common issues
    const issues = [];
    
    if (!account.charges_enabled) {
      issues.push('⚠️ Charges not enabled on Stripe account');
    }
    
    if (!account.details_submitted) {
      issues.push('⚠️ Account details not fully submitted');
    }
    
    if (session.status === 'expired') {
      issues.push('⚠️ Checkout session has expired');
    }
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      issues.push('⚠️ Webhook secret not configured');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        debug: debugInfo,
        issues: issues,
        recommendation: issues.length > 0 
          ? 'Address the issues listed above'
          : 'Configuration appears correct - check Stripe Dashboard for more details'
      })
    };

  } catch (error) {
    console.error('❌ Debug error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Debug failed',
        details: error.message,
        type: error.type,
        code: error.code
      })
    };
  }
};