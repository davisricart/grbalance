const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { mapToUsageDb } = require('./dbMapper');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://qkrptazfydtaoyhhczyr.supabase.co',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook secret not configured' })
    };
  }

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  console.log('🔔 Received Stripe webhook:', stripeEvent.type);

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(stripeEvent.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(stripeEvent.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object);
        break;
      
      default:
        console.log(`ℹ️ Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
};

async function handleCheckoutCompleted(session) {
  console.log('💳 Processing checkout completion:', session.id);
  
  const { userId, tier, cycle } = session.metadata;
  
  if (!userId) {
    console.error('❌ No userId in session metadata');
    return;
  }

  try {
    // Update user status to 'paid' and store subscription info
    const updateData = mapToUsageDb({
      status: 'paid',
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      subscription_tier: tier,
      billing_cycle: cycle,
      trialEnded: true,
      paidAt: new Date().toISOString()
    });

    const { error } = await supabase
      .from('usage')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;

    console.log('✅ User upgraded to paid subscription:', userId);
    
  } catch (error) {
    console.error('❌ Error updating user after checkout:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log('📅 Subscription created:', subscription.id);
  
  const { userId } = subscription.metadata;
  
  if (!userId) {
    console.error('❌ No userId in subscription metadata');
    return;
  }

  try {
    const updateData = mapToUsageDb({
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
    });

    const { error } = await supabase
      .from('usage')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;

    console.log('✅ Subscription data updated for user:', userId);
    
  } catch (error) {
    console.error('❌ Error updating subscription data:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);
  
  const { userId } = subscription.metadata;
  
  if (!userId) {
    console.error('❌ No userId in subscription metadata');
    return;
  }

  try {
    const { error } = await supabase
      .from('usage')
      .update({
        subscriptionStatus: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('stripeSubscriptionId', subscription.id);

    if (error) throw error;

    console.log('✅ Subscription status updated');
    
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
  }
}

async function handleSubscriptionCancelled(subscription) {
  console.log('❌ Subscription cancelled:', subscription.id);
  
  try {
    const { error } = await supabase
      .from('usage')
      .update({
        subscriptionStatus: 'cancelled',
        status: 'trial_expired'
      })
      .eq('stripeSubscriptionId', subscription.id);

    if (error) throw error;

    console.log('✅ User marked as trial expired due to cancellation');
    
  } catch (error) {
    console.error('❌ Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSucceeded(invoice) {
  console.log('💰 Payment succeeded for invoice:', invoice.id);
  
  if (invoice.subscription) {
    try {
      const { error } = await supabase
        .from('usage')
        .update({
          lastPaymentDate: new Date().toISOString(),
          subscriptionStatus: 'active'
        })
        .eq('stripeSubscriptionId', invoice.subscription);

      if (error) throw error;

      console.log('✅ Payment recorded for subscription');
      
    } catch (error) {
      console.error('❌ Error recording payment:', error);
    }
  }
}

async function handlePaymentFailed(invoice) {
  console.log('💸 Payment failed for invoice:', invoice.id);
  
  if (invoice.subscription) {
    try {
      const { error } = await supabase
        .from('usage')
        .update({
          subscriptionStatus: 'past_due'
        })
        .eq('stripeSubscriptionId', invoice.subscription);

      if (error) throw error;

      console.log('✅ Subscription marked as past due');
      
    } catch (error) {
      console.error('❌ Error handling payment failure:', error);
    }
  }
}