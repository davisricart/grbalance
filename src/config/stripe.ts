// Stripe Configuration for GR Balance
// Supports both test and production environments

export const stripeConfig = {
  // Publishable key from environment variables only
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || (() => {
    throw new Error('VITE_STRIPE_PUBLISHABLE_KEY environment variable is required');
  })(),
  
  // Environment detection - automatically switches based on key prefix
  isTestMode: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') ?? true,
  
  // Subscription plans configuration - Price IDs from environment variables
  plans: {
    starter: {
      monthly: {
        priceId: import.meta.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID || (() => {
          throw new Error('VITE_STRIPE_STARTER_MONTHLY_PRICE_ID environment variable is required');
        })(),
        amount: 1900, // $19.00 in cents
      },
      annual: {
        priceId: import.meta.env.VITE_STRIPE_STARTER_ANNUAL_PRICE_ID || (() => {
          throw new Error('VITE_STRIPE_STARTER_ANNUAL_PRICE_ID environment variable is required');
        })(),
        amount: 18000, // $180.00 in cents (yearly)
      }
    },
    professional: {
      monthly: {
        priceId: import.meta.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || (() => {
          throw new Error('VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID environment variable is required');
        })(),
        amount: 3400, // $34.00 in cents
      },
      annual: {
        priceId: import.meta.env.VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID || (() => {
          throw new Error('VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID environment variable is required');
        })(),
        amount: 32400, // $324.00 in cents (yearly)
      }
    },
    business: {
      monthly: {
        priceId: import.meta.env.VITE_STRIPE_BUSINESS_MONTHLY_PRICE_ID || (() => {
          throw new Error('VITE_STRIPE_BUSINESS_MONTHLY_PRICE_ID environment variable is required');
        })(),
        amount: 5900, // $59.00 in cents
      },
      annual: {
        priceId: import.meta.env.VITE_STRIPE_BUSINESS_ANNUAL_PRICE_ID || (() => {
          throw new Error('VITE_STRIPE_BUSINESS_ANNUAL_PRICE_ID environment variable is required');
        })(),
        amount: 56400, // $564.00 in cents (yearly)
      }
    }
  },
  
  // Setup fee (waived until August 1st, 2025)
  setupFee: {
    priceId: import.meta.env.VITE_STRIPE_SETUP_FEE_PRICE_ID || 'setup_fee_placeholder',
    amount: 49700, // $497.00 in cents
    isWaived: true, // Currently waived for launch special
    waivedUntil: '2025-09-01'
  }
};

// Helper function to get plan details
export const getPlanConfig = (tier: string, cycle: 'monthly' | 'annual') => {
  const plan = stripeConfig.plans[tier as keyof typeof stripeConfig.plans];
  if (!plan) {
    throw new Error(`Invalid plan tier: ${tier}`);
  }
  
  const cycleConfig = plan[cycle];
  if (!cycleConfig) {
    throw new Error(`Invalid billing cycle: ${cycle}`);
  }
  
  return cycleConfig;
};

// Helper function to format price for display
export const formatPrice = (amountInCents: number): string => {
  return `$${(amountInCents / 100).toFixed(2)}`;
};

// Helper function to get environment info
export const getStripeEnvironment = () => {
  return {
    isTestMode: stripeConfig.isTestMode,
    environment: stripeConfig.isTestMode ? 'Test' : 'Production',
    keyPrefix: stripeConfig.publishableKey.substring(0, 7)
  };
};

export default stripeConfig; 