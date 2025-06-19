// Netlify Function: Stripe Webhook Handler
const Stripe = require('stripe');
const admin = require('firebase-admin');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` }),
    };
  }

  try {
    // Handle the event
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
        await handleSubscriptionDeleted(stripeEvent.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Webhook handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Webhook handler failed' }),
    };
  }
};

// Handle successful checkout completion
async function handleCheckoutCompleted(session) {
  console.log('Checkout completed:', session.id);
  
  const { userId, tier, cycle, businessName } = session.metadata;
  
  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  try {
    // Update user record with subscription info
    await db.collection('users').doc(userId).update({
      stripeCustomerId: session.customer,
      subscriptionStatus: 'active',
      subscriptionTier: tier,
      billingCycle: cycle,
      subscriptionStartDate: new Date().toISOString(),
      trialStartDate: new Date().toISOString(),
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      updatedAt: new Date().toISOString(),
    });

    // Move from pending to approved users if needed
    const pendingUserRef = db.collection('pendingUsers').doc(userId);
    const pendingUser = await pendingUserRef.get();
    
    if (pendingUser.exists) {
      const userData = pendingUser.data();
      
      // Create approved user record
      await db.collection('users').doc(userId).set({
        ...userData,
        stripeCustomerId: session.customer,
        subscriptionStatus: 'active',
        subscriptionTier: tier,
        billingCycle: cycle,
        status: 'active',
        approvedAt: new Date().toISOString(),
        subscriptionStartDate: new Date().toISOString(),
        trialStartDate: new Date().toISOString(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        comparisonsUsed: 0,
        comparisonsLimit: getTierLimit(tier),
      }, { merge: true });

      // Remove from pending users
      await pendingUserRef.delete();
    }

    console.log(`User ${userId} subscription activated successfully`);
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  
  const userId = subscription.metadata.userId;
  if (!userId) return;

  try {
    await db.collection('users').doc(userId).update({
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const userId = subscription.metadata.userId;
  if (!userId) return;

  try {
    await db.collection('users').doc(userId).update({
      subscriptionStatus: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const userId = subscription.metadata.userId;
  if (!userId) return;

  try {
    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice) {
  console.log('Payment succeeded:', invoice.id);
  
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.userId;
    
    if (userId) {
      try {
        await db.collection('users').doc(userId).update({
          lastPaymentDate: new Date().toISOString(),
          subscriptionStatus: 'active',
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error handling payment success:', error);
      }
    }
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  console.log('Payment failed:', invoice.id);
  
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.userId;
    
    if (userId) {
      try {
        await db.collection('users').doc(userId).update({
          subscriptionStatus: 'past_due',
          lastPaymentFailure: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error handling payment failure:', error);
      }
    }
  }
}

// Helper function to get tier limits
function getTierLimit(tier) {
  const limits = {
    starter: 50,
    professional: 75,
    business: 150,
  };
  return limits[tier] || 50;
} 