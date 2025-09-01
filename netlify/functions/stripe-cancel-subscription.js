// Stripe subscription cancellation function
// Cancels Stripe subscription while allowing access until period end

// Check if Stripe secret key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const { subscriptionId } = JSON.parse(event.body);

    if (!subscriptionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing subscriptionId' })
      };
    }

    console.log('🚫 Cancelling subscription:', subscriptionId);

    // Get subscription details first to find the customer
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = subscription.customer;

    // Cancel subscription at period end (not immediately)
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        cancelled_by_user: 'true',
        cancelled_at: new Date().toISOString()
      }
    });

    // Update user status in database to track cancellation
    // Find user by subscription ID and update status
    const { error: updateError } = await supabase
      .from('usage')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('stripeSubscriptionId', subscriptionId);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      // Don't fail the cancellation if DB update fails
    }

    console.log('✅ Subscription cancelled successfully:', {
      subscriptionId,
      customerId,
      current_period_end: updatedSubscription.current_period_end,
      cancel_at_period_end: updatedSubscription.cancel_at_period_end
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        subscription: {
          id: updatedSubscription.id,
          cancel_at_period_end: updatedSubscription.cancel_at_period_end,
          current_period_end: updatedSubscription.current_period_end,
          cancelled_at: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('❌ Stripe cancellation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to cancel subscription',
        details: error.message 
      })
    };
  }
};