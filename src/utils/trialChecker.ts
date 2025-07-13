// Trial Expiration Checker and Billing Prompt
import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { createCheckoutSession } from '../services/stripeService';

const supabase = createClient(
  'https://qkrptazfydtaoyhhczyr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM'
);

interface TrialStatus {
  isTrialActive: boolean;
  isTrialExpired: boolean;
  isPaid: boolean;
  trialEndsAt?: string;
  daysRemaining?: number;
  subscriptionTier?: string;
  billingCycle?: string;
}

export async function checkTrialStatus(userId: string): Promise<TrialStatus> {
  try {
    const { data, error } = await supabase
      .from('usage')
      .select('status, trialStartedAt, trialEndsAt, subscriptionTier, billingCycle')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!data) {
      return {
        isTrialActive: false,
        isTrialExpired: false,
        isPaid: false
      };
    }

    const now = new Date();
    const trialEndDate = data.trialEndsAt ? new Date(data.trialEndsAt) : null;
    
    // Calculate days remaining
    let daysRemaining = 0;
    if (trialEndDate) {
      const timeDiff = trialEndDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    const isTrialActive = data.status === 'trial' && trialEndDate && now < trialEndDate;
    const isTrialExpired = data.status === 'trial' && trialEndDate && now >= trialEndDate;
    const isPaid = data.status === 'paid' || data.status === 'active';

    return {
      isTrialActive,
      isTrialExpired,
      isPaid,
      trialEndsAt: data.trialEndsAt,
      daysRemaining: Math.max(0, daysRemaining),
      subscriptionTier: data.subscriptionTier,
      billingCycle: data.billingCycle
    };

  } catch (error) {
    console.error('Error checking trial status:', error);
    return {
      isTrialActive: false,
      isTrialExpired: false,
      isPaid: false
    };
  }
}

export async function promptForPayment(userId: string, userEmail: string, subscriptionTier: string = 'professional', billingCycle: string = 'monthly') {
  try {
    console.log('🔔 Trial expired - prompting for payment');
    
    // Create checkout session
    const session = await createCheckoutSession({
      userId: userId,
      email: userEmail,
      tier: subscriptionTier as 'starter' | 'professional' | 'business',
      cycle: billingCycle as 'monthly' | 'annual',
      successUrl: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/billing/cancelled`
    });

    // Redirect to Stripe Checkout
    window.location.href = session.url;

  } catch (error) {
    console.error('Error creating payment prompt:', error);
    throw error;
  }
}

export function formatTrialStatus(trialStatus: TrialStatus): string {
  if (trialStatus.isPaid) {
    return 'Subscription Active';
  } else if (trialStatus.isTrialExpired) {
    return 'Trial Expired - Payment Required';
  } else if (trialStatus.isTrialActive) {
    return `Trial Active - ${trialStatus.daysRemaining} days remaining`;
  } else {
    return 'No active trial or subscription';
  }
}

// Hook to use in React components
export function useTrialStatus(userId: string) {
  const [trialStatus, setTrialStatus] = React.useState<TrialStatus>({
    isTrialActive: false,
    isTrialExpired: false,
    isPaid: false
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (userId) {
      checkTrialStatus(userId).then(status => {
        setTrialStatus(status);
        setIsLoading(false);
      });
    }
  }, [userId]);

  return { trialStatus, isLoading, refreshTrialStatus: () => checkTrialStatus(userId).then(setTrialStatus) };
}

export default {
  checkTrialStatus,
  promptForPayment,
  formatTrialStatus,
  useTrialStatus
};