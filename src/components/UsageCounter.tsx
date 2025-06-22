import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

interface UsageData {
  comparisonsUsed: number;
  comparisonsLimit: number;
  subscriptionTier: 'starter' | 'professional' | 'business';
  email?: string;
}

const TIER_LIMITS = {
  starter: 50,
  professional: 75,
  business: 150
};

export default function UsageCounter() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    // Only show default values without API call to improve performance
    // During development/migration phase, use default values
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      // For localhost testing, show default values immediately
      const defaultUsage: UsageData = {
        comparisonsUsed: 0,
        comparisonsLimit: TIER_LIMITS.starter,
        subscriptionTier: 'starter',
        email: 'demo@example.com'
      };
      setUsage(defaultUsage);
      return;
    }

    // For production, only fetch if needed (lazy load this API call)
    const fetchUsageData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // For now, set default values during Supabase migration
        // TODO: Implement proper usage tracking in Supabase
        const defaultUsage: UsageData = {
          comparisonsUsed: 0,
          comparisonsLimit: TIER_LIMITS.starter,
          subscriptionTier: 'starter',
          email: user.email || ''
        };

        setUsage(defaultUsage);
      } catch (error) {
        console.error('Error fetching usage:', error);
      }
    };

    // Delay the API call to not block initial page load
    const timeoutId = setTimeout(fetchUsageData, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  if (!usage) {
    return null;
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