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
      priceId,
      userId,
      email,
      tier,
      cycle,
      businessName,
      successUrl,
      cancelUrl,
      metadata = {}
    } = JSON.parse(event.body);

    console.log('🔥 Creating checkout session for:', {
      userId,
      email,
      tier,
      cycle,
      priceId: priceId?.substring(0, 20) + '...'
    });

    // Validate required fields
    if (!priceId || !userId || !email || !successUrl || !cancelUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: priceId, userId, email, successUrl, cancelUrl' 
        })
      };
    }

    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('📧 Found existing customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: email,
        name: businessName,
        metadata: {
          userId: userId,
          tier: tier,
          source: 'grbalance_trial_conversion'
        }
      });
      console.log('✨ Created new customer:', customer.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        tier: tier,
        cycle: cycle,
        customerId: customer.id,
        source: 'trial_conversion',
        ...metadata
      },
      subscription_data: {
        metadata: {
          userId: userId,
          tier: tier,
          cycle: cycle,
          source: 'trial_conversion'
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        name: 'auto',
        address: 'auto'
      }
    });

    console.log('✅ Checkout session created:', session.id);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: session.id,
        url: session.url,
        customerId: customer.id
      })
    };

  } catch (error) {
    console.error('❌ Stripe checkout error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create checkout session',
        details: error.message 
      })
    };
  }
};