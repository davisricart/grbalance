// Stripe debugging utilities for production troubleshooting

export interface StripeDebugInfo {
  sessionId: string;
  timestamp: string;
  userAgent: string;
  location: string;
  environment: string;
}

export const logCheckoutAttempt = (sessionId: string, tier: string, cycle: string) => {
  const debugInfo: StripeDebugInfo = {
    sessionId,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    location: window.location.href,
    environment: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_') ? 'production' : 'test'
  };
  
  console.log('🔍 Stripe checkout attempt:', {
    ...debugInfo,
    tier,
    cycle,
    publishableKeyPrefix: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.substring(0, 7)
  });
  
  // Store in localStorage for debugging
  localStorage.setItem('lastStripeAttempt', JSON.stringify({
    ...debugInfo,
    tier,
    cycle
  }));
};

export const debugSession = async (sessionId: string) => {
  try {
    const response = await fetch('/.netlify/functions/stripe-debug-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });
    
    const result = await response.json();
    console.log('🔬 Session debug result:', result);
    return result;
  } catch (error) {
    console.error('❌ Session debug failed:', error);
    throw error;
  }
};

export const getLastAttemptInfo = () => {
  const stored = localStorage.getItem('lastStripeAttempt');
  return stored ? JSON.parse(stored) : null;
};

export const clearDebugData = () => {
  localStorage.removeItem('lastStripeAttempt');
};