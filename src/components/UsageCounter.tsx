import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth } from '../main';

interface UsageData {
  comparisonsUsed: number;
  comparisonsLimit: number;
  subscriptionTier: 'basic' | 'premium' | 'enterprise';
  email?: string;
}

const TIER_LIMITS = {
  basic: 50,
  premium: 100,
  enterprise: 250
};

export default function UsageCounter() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userDoc = doc(db, 'usage', auth.currentUser.uid);
    
    const unsubscribe = onSnapshot(userDoc, 
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as UsageData;
          // Ensure limit matches current tier
          const tierLimit = TIER_LIMITS[data.subscriptionTier];
          if (data.comparisonsLimit !== tierLimit) {
            await setDoc(userDoc, {
              ...data,
              comparisonsLimit: tierLimit,
              email: auth.currentUser?.email // Ensure email is set
            }, { merge: true });
          }
          setUsage(data);
        } else {
          const initialData: UsageData = {
            email: auth.currentUser?.email,
            comparisonsUsed: 0,
            comparisonsLimit: TIER_LIMITS.basic,
            subscriptionTier: 'basic'
          };
          
          await setDoc(userDoc, initialData);
          setUsage(initialData);
        }
      },
      (error) => {
        console.error('Error fetching usage:', error);
      }
    );

    return () => unsubscribe();
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
        ({usage.comparisonsUsed}/{usage.comparisonsLimit} uses)
      </div>
      <div className="text-xs text-gray-500">
        {usage.subscriptionTier.charAt(0).toUpperCase() + usage.subscriptionTier.slice(1)} Plan
      </div>
    </div>
  );
}