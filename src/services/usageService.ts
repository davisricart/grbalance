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
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('usageService: Error fetching usage:', error.message);
      return null;
    }

    return {
      comparisonsUsed: data.comparisonsUsed || data.comparisons_used || 0,
      comparisonsLimit: data.comparisonsLimit || data.comparisons_limit || TIER_LIMITS.starter,
      subscriptionTier: data.subscriptionTier || data.subscription_tier || 'starter',
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
      console.log('usageService: User not found in usage table, checking if QA testing user...');
      
      // Check if this is a QA testing user
      try {
        const { data: qaUser, error: qaError } = await supabase
          .from('ready-for-testing')
          .select('id')
          .eq('id', userId)
          .single();
        
        if (!qaError && qaUser) {
          console.log('usageService: QA testing user - skipping usage increment');
          return true; // Return success but don't increment for QA users
        }
      } catch (qaCheckError) {
        console.log('usageService: Error checking QA testing status:', qaCheckError);
      }
      
      console.error('usageService: Could not fetch current usage');
      return false;
    }

    // Skip increment for testing status users
    if (currentUsage.status === 'testing') {
      console.log('usageService: Testing status user - skipping usage increment');
      return true;
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
      // If user not found in usage table, check if they're in QA testing
      console.log('usageService: User not found in usage table, checking QA testing status...');
      
      try {
        const { data: qaUser, error: qaError } = await supabase
          .from('readyForTestingUsers')
          .select('id, subscriptionTier')
          .eq('id', userId)
          .single();
        
        if (!qaError && qaUser) {
          console.log('usageService: Found user in QA testing, allowing reconciliation');
          // Return a temporary usage object for QA testing users
          const qaUsage: UsageData = {
            comparisonsUsed: 0,
            comparisonsLimit: 999, // High limit for QA testing
            subscriptionTier: qaUser.subscriptionTier || 'professional',
            status: 'testing'
          };
          
          return { 
            canProceed: true, 
            usage: qaUsage 
          };
        }
      } catch (qaCheckError) {
        console.log('usageService: Error checking QA testing status:', qaCheckError);
      }
      
      return { 
        canProceed: false, 
        reason: 'Could not fetch usage data' 
      };
    }

    // Check if user is in trial, testing, or paid status
    if (usage.status !== 'trial' && usage.status !== 'testing' && usage.status !== 'approved' && usage.status !== 'paid') {
      return { 
        canProceed: false, 
        reason: 'Account not activated. Please contact support.',
        usage 
      };
    }

    // Check usage limits (skip for testing status)
    if (usage.status !== 'testing' && usage.comparisonsUsed >= usage.comparisonsLimit) {
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