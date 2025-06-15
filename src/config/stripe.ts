// Stripe Configuration for GR Balance
// Test environment setup for subscription billing

export const stripeConfig = {
  // Test publishable key (pk_test_51RZ1rzPOMRCrABIRn0xyE8IPwed9pVXSSjS1ZUQDG9oDEyiR8Sk4OgUj1oA57MuthO71DpK0WvN2v4wcDG6b9nPZ00UyZgWNOP)
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RZ1rzPOMRCrABIRn0xyE8IPwed9pVXSSjS1ZUQDG9oDEyiR8Sk4OgUj1oA57MuthO71DpK0WvN2v4wcDG6b9nPZ00UyZgWNOP',
  
  // Test mode flag
  isTestMode: true,
  
  // Subscription plans configuration
  plans: {
    starter: {
      monthly: {
        priceId: 'price_1RZ2JxPOMRCrABIRwACPdDf5', // $19.00 USD, recurring monthly
        amount: 1900, // $19.00 in cents
      },
      annual: {
        priceId: 'price_1RZ2Q2POMRCrABIRPFJn0u0O', // $180.00 USD, recurring yearly
        amount: 18000, // $180.00 in cents (yearly)
      }
    },
    professional: {
      monthly: {
        priceId: 'price_1RZ2RqPOMRCrABIRndC7RhCq', // $34.00 USD, recurring monthly
        amount: 3400, // $34.00 in cents
      },
      annual: {
        priceId: 'price_1RZ2TGPOMRCrABIR9PjWx0im', // $324.00 USD, recurring yearly
        amount: 32400, // $324.00 in cents (yearly)
      }
    },
    business: {
      monthly: {
        priceId: 'price_1RZ2VfPOMRCrABIRN0bGD0TK', // $59.00 USD, recurring monthly
        amount: 5900, // $59.00 in cents
      },
      annual: {
        priceId: 'price_1RZ2WnPOMRCrABIRpdI85wVY', // $564.00 USD, recurring yearly
        amount: 56400, // $564.00 in cents (yearly)
      }
    }
  },
  
  // Setup fee (waived until August 1st, 2025)
  setupFee: {
    priceId: 'price_test_setup_fee',
    amount: 49700, // $497.00 in cents
    isWaived: true, // Currently waived for launch special
    waivedUntil: '2025-08-01'
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

export default stripeConfig; 