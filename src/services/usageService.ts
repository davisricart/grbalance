// Usage tracking service for GR Balance
import { supabase } from '../config/supabase';

export interface UsageData {
  comparisonsUsed: number;
  comparisonsLimit: number;
  subscriptionTier: 'starter' | 'professional' | 'business';
  status: string;
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
      .select('comparisonsUsed, comparisonsLimit, subscriptionTier, status')
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
      status: data.status || 'pending'
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