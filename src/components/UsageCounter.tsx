import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { getUserUsage, UsageData as ServiceUsageData, TIER_LIMITS } from '../services/usageService';

interface UsageData {
  comparisonsUsed: number;
  comparisonsLimit: number;
  subscriptionTier: 'starter' | 'professional' | 'business';
  email?: string;
}

// TIER_LIMITS imported from usageService

interface UsageCounterProps {
  refreshTrigger?: number; // When this changes, refresh the data
}

export default function UsageCounter({ refreshTrigger }: UsageCounterProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('UsageCounter: No authenticated user');
          return;
        }

        console.log('UsageCounter: Fetching usage data for user:', user.id);

        // Use the usage service
        const usageData = await getUserUsage(user.id);

        if (usageData) {
          console.log('UsageCounter: Retrieved usage data:', usageData);
          const usage: UsageData = {
            comparisonsUsed: usageData.comparisonsUsed,
            comparisonsLimit: usageData.comparisonsLimit,
            subscriptionTier: usageData.subscriptionTier,
            email: user.email || ''
          };
          setUsage(usage);
        } else {
          console.log('UsageCounter: No usage data found, using defaults');
          // User not found in usage table, use defaults
          const defaultUsage: UsageData = {
            comparisonsUsed: 0,
            comparisonsLimit: TIER_LIMITS.starter,
            subscriptionTier: 'starter',
            email: user.email || ''
          };
          setUsage(defaultUsage);
        }
      } catch (error) {
        console.error('UsageCounter: Error in fetchUsageData:', error);
        // Fallback to defaults on any error
        const { data: { user } } = await supabase.auth.getUser();
        const defaultUsage: UsageData = {
          comparisonsUsed: 0,
          comparisonsLimit: TIER_LIMITS.starter,
          subscriptionTier: 'starter',
          email: user?.email || ''
        };
        setUsage(defaultUsage);
      }
    };

    fetchUsageData();
  }, [refreshTrigger]);

  if (!usage) {
    return (
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium text-gray-700">
          Monthly Usage: Loading...
        </div>
        <div className="text-xs text-gray-500">
          Fetching plan details...
        </div>
      </div>
    );
  }

  const usagePercentage = (usage.comparisonsUsed / usage.comparisonsLimit) * 100;
  const isNearLimit = usagePercentage >= 80;

  return (
    <div className="flex flex-col gap-1">
      <div className={`text-sm font-medium ${
        isNearLimit ? 'text-yellow-700' : 'text-gray-700'
      }`}>
        Monthly Usage: {usage.comparisonsUsed}/{usage.comparisonsLimit}
      </div>
      <div className="text-xs text-gray-500">
        {usage.subscriptionTier.charAt(0).toUpperCase() + usage.subscriptionTier.slice(1)} Plan
      </div>
    </div>
  );
} 