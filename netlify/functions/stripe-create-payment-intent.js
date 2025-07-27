// Check if Stripe secret key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is not set');
  return {
    statusCode: 500,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify({ 
      error: 'Stripe configuration error. Please contact support.' 
    })
  };
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
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
    const {
      amount,
      currency,
      planTier,
      userId,
      userEmail,
      businessName
    } = JSON.parse(event.body);

    console.log('🔥 Creating payment intent for:', {
      amount,
      currency,
      planTier,
      userId,
      userEmail
    });

    // Validate required fields
    if (!amount || !currency || !planTier || !userId || !userEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: amount, currency, planTier, userId, userEmail' 
        })
      };
    }

    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('📧 Found existing customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        name: businessName,
        metadata: {
          userId: userId,
          tier: planTier,
          source: 'grbalance_trial_conversion'
        }
      });
      console.log('✨ Created new customer:', customer.id);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      customer: customer.id,
      metadata: {
        userId: userId,
        tier: planTier,
        customerId: customer.id,
        source: 'trial_conversion'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('✅ Payment intent created:', paymentIntent.id);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customerId: customer.id
      })
    };

  } catch (error) {
    console.error('❌ Stripe payment intent error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create payment intent',
        details: error.message 
      })
    };
  }
}; 