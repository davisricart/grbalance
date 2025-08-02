// Usage tracking service for GR Balance
import { supabase } from '../config/supabase';

export interface UsageData {
  comparisonsUsed: number;
  comparisonsLimit: number;
  subscriptionTier: 'starter' | 'professional' | 'business';
  status: string;
  lastLimitReset?: string;
}

export const TIER_LIMITS = {
  starter: 50,
  professional: 75,
  business: 150
};

/**
 * Get current usage data for a user
 */
export async function getUserUsage(userId: string): Promise<UsageData | null> {
  try {
    const { data, error } = await supabase
      .from('usage')
      .select('comparisonsUsed, comparisonsLimit, subscriptionTier, status, lastLimitReset')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('usageService: Error fetching usage:', error.message);
      return null;
    }

    return {
      comparisonsUsed: data.comparisonsUsed || 0,
      comparisonsLimit: data.comparisonsLimit || TIER_LIMITS.starter,
      subscriptionTier: data.subscriptionTier || 'starter',
      status: data.status || 'pending',
      lastLimitReset: data.lastLimitReset
    };
  } catch (error) {
    console.error('usageService: Error in getUserUsage:', error);
    return null;
  }
}

/**
 * Increment usage count by 1 (when a reconciliation is performed)
 */
export async function incrementUsage(userId: string): Promise<boolean> {
  try {
    console.log('usageService: Incrementing usage for user:', userId);

    // First get current usage
    const currentUsage = await getUserUsage(userId);
    if (!currentUsage) {
      console.error('usageService: Could not fetch current usage');
      return false;
    }

    // Check if user has reached their limit
    if (currentUsage.comparisonsUsed >= currentUsage.comparisonsLimit) {
      console.warn('usageService: User has reached usage limit:', currentUsage);
      return false; // Don't increment if at limit
    }

    // Increment the count
    const newUsageCount = currentUsage.comparisonsUsed + 1;
    
    const { error } = await supabase
      .from('usage')
      .update({ 
        comparisonsUsed: newUsageCount,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('usageService: Error updating usage:', error.message);
      return false;
    }

    console.log(`usageService: Usage incremented to ${newUsageCount}/${currentUsage.comparisonsLimit}`);
    return true;
  } catch (error) {
    console.error('usageService: Error in incrementUsage:', error);
    return false;
  }
}

/**
 * Check if user can perform another reconciliation
 */
export async function canPerformReconciliation(userId: string): Promise<{ canProceed: boolean; reason?: string; usage?: UsageData }> {
  try {
    const usage = await getUserUsage(userId);
    
    if (!usage) {
      return { 
        canProceed: false, 
        reason: 'Could not fetch usage data' 
      };
    }

    // Check if user is in trial or paid status
    if (usage.status !== 'trial' && usage.status !== 'approved' && usage.status !== 'paid') {
      return { 
        canProceed: false, 
        reason: 'Account not activated. Please contact support.',
        usage 
      };
    }

    // Check usage limits
    if (usage.comparisonsUsed >= usage.comparisonsLimit) {
      return { 
        canProceed: false, 
        reason: `Monthly limit reached (${usage.comparisonsUsed}/${usage.comparisonsLimit}). Upgrade your plan for more reconciliations.`,
        usage 
      };
    }

    return { 
      canProceed: true, 
      usage 
    };
  } catch (error) {
    console.error('usageService: Error in canPerformReconciliation:', error);
    return { 
      canProceed: false, 
      reason: 'Error checking usage limits' 
    };
  }
}

/**
 * Reset usage count (admin function)
 */
export async function resetUsage(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('usage')
      .update({ 
        comparisonsUsed: 0,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('usageService: Error resetting usage:', error.message);
      return false;
    }

    console.log('usageService: Usage reset for user:', userId);
    return true;
  } catch (error) {
    console.error('usageService: Error in resetUsage:', error);
    return false;
  }
}

/**
 * Reset monthly usage for a specific user based on subscription tier
 */
export async function resetMonthlyUsage(userId: string, subscriptionTier: string): Promise<boolean> {
  try {
    const defaultLimit = TIER_LIMITS[subscriptionTier as keyof typeof TIER_LIMITS] || 50;
    const currentDate = new Date();

    const { error } = await supabase
      .from('usage')
      .update({
        comparisonsUsed: 0,
        comparisonsLimit: defaultLimit,
        lastLimitReset: currentDate.toISOString(),
        updatedAt: currentDate.toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('usageService: Error resetting monthly limits:', error.message);
      return false;
    }

    console.log(`usageService: Monthly reset: ${subscriptionTier} user to ${defaultLimit} comparisons`);
    return true;
  } catch (error) {
    console.error('usageService: Error in resetMonthlyUsage:', error);
    return false;
  }
}

/**
 * Check and automatically reset monthly limits if needed
 */
export async function checkAndResetMonthlyLimits(userId: string): Promise<UsageData | null> {
  try {
    const userData = await getUserUsage(userId);
    if (!userData) {
      console.warn('usageService: Could not fetch user data for monthly reset check');
      return null;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Check if we need to reset for new month
    const lastResetDate = userData.lastLimitReset ? new Date(userData.lastLimitReset) : null;
    const lastResetMonth = lastResetDate ? 
      lastResetDate.getFullYear() + '-' + String(lastResetDate.getMonth() + 1).padStart(2, '0') : null;

    if (lastResetMonth !== currentMonth) {
      console.log(`usageService: Auto-resetting monthly limits for ${userData.subscriptionTier} user`);
      const success = await resetMonthlyUsage(userId, userData.subscriptionTier);
      if (success) {
        // Return updated usage data after reset
        return await getUserUsage(userId);
      }
    }

    return userData;
  } catch (error) {
    console.error('usageService: Error in checkAndResetMonthlyLimits:', error);
    return null;
  }
}

/**
 * Add usage count (admin function)
 */
export async function addUsage(userId: string, amount: number): Promise<boolean> {
  try {
    const currentUsage = await getUserUsage(userId);
    if (!currentUsage) {
      console.error('usageService: Could not fetch current usage for addUsage');
      return false;
    }

    const newUsageCount = currentUsage.comparisonsUsed + amount;
    
    const { error } = await supabase
      .from('usage')
      .update({ 
        comparisonsUsed: newUsageCount,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('usageService: Error adding usage:', error.message);
      return false;
    }

    console.log(`usageService: Added ${amount} usage, new total: ${newUsageCount}/${currentUsage.comparisonsLimit}`);
    return true;
  } catch (error) {
    console.error('usageService: Error in addUsage:', error);
    return false;
  }
}

/**
 * Update usage limit (admin function)
 */
export async function updateLimit(userId: string, newLimit: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('usage')
      .update({ 
        comparisonsLimit: newLimit,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('usageService: Error updating limit:', error.message);
      return false;
    }

    console.log(`usageService: Updated limit to ${newLimit} for user:`, userId);
    return true;
  } catch (error) {
    console.error('usageService: Error in updateLimit:', error);
    return false;
  }
}