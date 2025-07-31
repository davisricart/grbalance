// Trial time calculation service - Single source of truth
import { supabase } from '../config/supabase';

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
    const trialEnd = new Date(trialStart.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days
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
  const trialEnd = new Date(trialStart.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days
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