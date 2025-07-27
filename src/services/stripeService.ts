// Stripe Service for GR Balance Subscription Management
import { loadStripe } from '@stripe/stripe-js';
import { stripeConfig, getPlanConfig } from '../config/stripe';

let stripePromise: Promise<any>;

// Initialize Stripe
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripeConfig.publishableKey);
  }
  return stripePromise;
};

// Types for subscription management
export interface SubscriptionData {
  userId: string;
  email: string;
  tier: 'starter' | 'professional' | 'business';
  cycle: 'monthly' | 'annual';
  businessName?: string;
}

export interface CheckoutSessionData extends SubscriptionData {
  successUrl: string;
  cancelUrl: string;
}

// Create checkout session for subscription
export const createCheckoutSession = async (data: CheckoutSessionData) => {
  try {
    const planConfig = getPlanConfig(data.tier, data.cycle);
    
    const response = await fetch('/.netlify/functions/stripe-create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: planConfig.priceId,
        userId: data.userId,
        email: data.email,
        tier: data.tier,
        cycle: data.cycle,
        businessName: data.businessName,
        successUrl: data.successUrl,
        cancelUrl: data.cancelUrl,
        mode: 'subscription',
        metadata: {
          userId: data.userId,
          tier: data.tier,
          cycle: data.cycle,
          setupFeeWaived: stripeConfig.setupFee.isWaived.toString(),
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Redirect to Stripe Checkout
export const redirectToCheckout = async (sessionId: string) => {
  console.log('🔄 Starting checkout redirect for session:', sessionId);
  
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error('Stripe failed to load');
  }

  console.log('✅ Stripe loaded successfully, redirecting to checkout...');
  
  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });

  if (error) {
    console.error('❌ Stripe checkout error:', error);
    throw error;
  }
  
  console.log('✅ Checkout redirect initiated successfully');
};

// Create subscription after consultation is completed
export const createSubscriptionAfterConsultation = async (data: SubscriptionData) => {
  try {
    const checkoutData: CheckoutSessionData = {
      ...data,
      successUrl: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/billing/cancelled`,
    };

    const session = await createCheckoutSession(checkoutData);
    await redirectToCheckout(session.id);
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

// Get subscription status
export const getSubscriptionStatus = async (userId: string) => {
  try {
    const response = await fetch(`/.netlify/functions/stripe-subscription-status/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to get subscription status');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
};

// Cancel subscription
export const cancelSubscription = async (subscriptionId: string) => {
  try {
    const response = await fetch('/.netlify/functions/stripe-cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

// Update subscription (change plan or billing cycle)
export const updateSubscription = async (subscriptionId: string, newTier: string, newCycle: 'monthly' | 'annual') => {
  try {
    const planConfig = getPlanConfig(newTier, newCycle);
    
    const response = await fetch('/.netlify/functions/stripe-update-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
        newPriceId: planConfig.priceId,
        tier: newTier,
        cycle: newCycle,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

export default {
  getStripe,
  createCheckoutSession,
  redirectToCheckout,
  createSubscriptionAfterConsultation,
  getSubscriptionStatus,
  cancelSubscription,
  updateSubscription,
}; 