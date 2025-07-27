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

// Debug function to validate Stripe configuration
async function validateStripeConfig() {
  try {
    console.log('🔍 Validating Stripe configuration...');
    
    // Check account status
    const account = await stripe.accounts.retrieve();
    console.log('✅ Account status:', {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      country: account.country
    });
    
    // Check account capabilities
    const capabilities = await stripe.accounts.listCapabilities();
    console.log('✅ Account capabilities:', capabilities.data.map(cap => ({
      object: cap.object,
      requested: cap.requested,
      status: cap.status
    })));
    
    return true;
  } catch (error) {
    console.error('❌ Stripe config validation failed:', error.message);
    return false;
  }
}

// Debug function to validate price
async function validatePrice(priceId) {
  try {
    console.log('🔍 Validating price:', priceId);
    const price = await stripe.prices.retrieve(priceId);
    console.log('✅ Price validation:', {
      id: price.id,
      active: price.active,
      currency: price.currency,
      product: price.product,
      type: price.type,
      unit_amount: price.unit_amount
    });
    
    // Check if product is active
    const product = await stripe.products.retrieve(price.product);
    console.log('✅ Product validation:', {
      id: product.id,
      active: product.active,
      name: product.name
    });
    
    return true;
  } catch (error) {
    console.error('❌ Price validation failed:', error.message);
    return false;
  }
}

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
      priceId: priceId?.substring(0, 20) + '...',
      successUrl,
      cancelUrl,
      businessName
    });

    // Debug: Log all incoming data
    console.log('📋 Full request data:', {
      priceId,
      userId,
      email,
      tier,
      cycle,
      businessName,
      successUrl,
      cancelUrl,
      metadata
    });

    // Validate Stripe configuration and price
    await validateStripeConfig();
    await validatePrice(priceId);

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

    // Debug: Log session configuration
    const sessionConfig = {
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
    };

    console.log('🔧 Session configuration:', JSON.stringify(sessionConfig, null, 2));

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Checkout session created:', session.id);
    console.log('🔗 Session URL:', session.url);
    console.log('👤 Customer ID:', customer.id);
    
    // Debug: Log full session response
    console.log('📄 Full session response:', JSON.stringify({
      id: session.id,
      url: session.url,
      customer: session.customer,
      payment_status: session.payment_status,
      status: session.status,
      created: session.created
    }, null, 2));
    
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