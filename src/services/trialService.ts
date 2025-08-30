// Trial time calculation service - Single source of truth
import { supabase } from '../config/supabase';

// Constants - TESTING: 10 minutes instead of 14 days
export const TRIAL_DURATION_DAYS = 14; // Keep original for reference
export const TRIAL_DURATION_MS = 10 * 60 * 1000; // 10 minutes for testing

export interface TrialInfo {
  daysLeft: number;
  hoursLeft: number;
  isExpired: boolean;
  status: 'active' | 'expired' | 'not-trial';
  displayText: string;
}

/**
 * Get trial information for a user - uses auth created_at as single source of truth
 */
export async function getTrialInfo(userId: string): Promise<TrialInfo> {
  try {
    // Get user creation time from Supabase Auth (single source of truth)
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !user) {
      console.warn('trialService: Could not get user auth data:', authError);
      return {
        daysLeft: 0,
        hoursLeft: 0,
        isExpired: true,
        status: 'not-trial',
        displayText: 'Unknown'
      };
    }

    // Check if user is actually on trial
    const { data: usageData, error: usageError } = await supabase
      .from('usage')
      .select('status')
      .eq('id', userId)
      .single();

    if (usageError || usageData?.status !== 'trial') {
      return {
        daysLeft: 0,
        hoursLeft: 0,
        isExpired: false,
        status: 'not-trial',
        displayText: 'Not on trial'
      };
    }

    // Calculate trial time remaining using auth created_at
    const trialStart = new Date(user.created_at);
    const trialEnd = new Date(trialStart.getTime() + TRIAL_DURATION_MS);
    const now = new Date();
    const timeRemaining = trialEnd.getTime() - now.getTime();
    
    const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000));
    const daysLeft = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));
    
    if (timeRemaining <= 0) {
      return {
        daysLeft: 0,
        hoursLeft: 0,
        isExpired: true,
        status: 'expired',
        displayText: 'Expired'
      };
    }

    // Generate display text
    let displayText: string;
    if (daysLeft > 1) {
      displayText = `${daysLeft} days left`;
    } else if (hoursLeft > 1) {
      displayText = `${hoursLeft} hours left`;
    } else if (hoursLeft > 0) {
      displayText = 'Expires today';
    } else {
      displayText = 'Expiring soon';
    }

    return {
      daysLeft: Math.max(0, daysLeft),
      hoursLeft: Math.max(0, hoursLeft),
      isExpired: false,
      status: 'active',
      displayText
    };

  } catch (error) {
    console.error('trialService: Error calculating trial info:', error);
    return {
      daysLeft: 0,
      hoursLeft: 0,
      isExpired: true,
      status: 'not-trial',
      displayText: 'Error'
    };
  }
}

/**
 * Simplified version for client-side use (when you already have user.created_at)
 */
export function calculateTrialFromCreatedAt(createdAt: string, isTrialStatus: boolean): TrialInfo {
  if (!isTrialStatus) {
    return {
      daysLeft: 0,
      hoursLeft: 0,
      isExpired: false,
      status: 'not-trial',
      displayText: 'Not on trial'
    };
  }

  const trialStart = new Date(createdAt);
  const trialEnd = new Date(trialStart.getTime() + TRIAL_DURATION_MS);
  const now = new Date();
  const timeRemaining = trialEnd.getTime() - now.getTime();
  
  const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000));
  const daysLeft = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));
  
  if (timeRemaining <= 0) {
    return {
      daysLeft: 0,
      hoursLeft: 0,
      isExpired: true,
      status: 'expired',
      displayText: 'Expired'
    };
  }

  // Generate display text
  let displayText: string;
  if (daysLeft > 1) {
    displayText = `${daysLeft} days left`;
  } else if (hoursLeft > 1) {
    displayText = `${hoursLeft} hours left`;
  } else if (hoursLeft > 0) {
    displayText = 'Expires today';
  } else {
    displayText = 'Expiring soon';
  }

  return {
    daysLeft: Math.max(0, daysLeft),
    hoursLeft: Math.max(0, hoursLeft),
    isExpired: false,
    status: 'active',
    displayText
  };
}

/**
 * Calculate trial end date from start date
 */
export function calculateTrialEndDate(startDate: Date): Date {
  return new Date(startDate.getTime() + TRIAL_DURATION_MS);
}

/**
 * Set user to trial status (admin function)
 */
export async function setTrialStatus(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('usage')
      .update({ 
        status: 'trial',
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('trialService: Error setting trial status:', error);
      return false;
    }

    console.log('trialService: Set trial status for user:', userId);
    return true;
  } catch (error) {
    console.error('trialService: Error in setTrialStatus:', error);
    return false;
  }
}

/**
 * Get trial info for server-side use (Netlify functions) - no Supabase client required
 */
export function calculateTrialInfoServer(createdAt: string): {
  daysLeft: number;
  hoursLeft: number;
  expiresAt: Date;
  isExpired: boolean;
} {
  const trialStart = new Date(createdAt);
  const trialEnd = new Date(trialStart.getTime() + TRIAL_DURATION_MS);
  const now = new Date();
  const timeRemaining = trialEnd.getTime() - now.getTime();
  
  const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000));
  const daysLeft = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));
  
  return {
    daysLeft: Math.max(0, daysLeft),
    hoursLeft: Math.max(0, hoursLeft),
    expiresAt: trialEnd,
    isExpired: timeRemaining <= 0
  };
}

/**
 * Check if trial is expiring soon (for reminders)
 */
export function isTrialExpiringSoon(createdAt: string, daysThreshold: number = 3): boolean {
  const trialInfo = calculateTrialInfoServer(createdAt);
  return trialInfo.daysLeft <= daysThreshold && !trialInfo.isExpired;
}

/**
 * Get days until trial expiry (for server-side use)
 */
export function getDaysUntilTrialExpiry(createdAt: string): number {
  const trialInfo = calculateTrialInfoServer(createdAt);
  return trialInfo.daysLeft;
}