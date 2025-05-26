import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth } from '../main';

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
    if (!auth.currentUser) return;

    const userDoc = doc(db, 'usage', auth.currentUser.uid);
    
    const unsubscribe = onSnapshot(userDoc, 
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as any; // Use any to handle old tier names
          
          // Migration logic: Convert old tier names to new ones
          let migratedTier = data.subscriptionTier;
          let migratedLimit = data.comparisonsLimit;
          
          // Map old tier names to new ones
          if (data.subscriptionTier === 'basic') {
            migratedTier = 'starter';
            migratedLimit = TIER_LIMITS.starter;
          } else if (data.subscriptionTier === 'premium') {
            migratedTier = 'professional';
            migratedLimit = TIER_LIMITS.professional;
          } else if (data.subscriptionTier === 'enterprise') {
            migratedTier = 'business';
            migratedLimit = TIER_LIMITS.business;
          }
          
          // Update if migration is needed or limits don't match
          const needsUpdate = 
            data.subscriptionTier !== migratedTier || 
            data.comparisonsLimit !== migratedLimit ||
            !data.email;
            
          if (needsUpdate) {
            const updatedData = {
              ...data,
              subscriptionTier: migratedTier,
              comparisonsLimit: migratedLimit,
              email: auth.currentUser?.email || data.email
            };
            
            await setDoc(userDoc, updatedData, { merge: true });
            setUsage(updatedData as UsageData);
          } else {
            setUsage(data as UsageData);
          }
        } else {
          // Don't auto-create documents - let registration handle this
          // This prevents automatic recreation of deleted test accounts
          console.log('No usage document found for user:', auth.currentUser?.email);
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
        Monthly Usage: {usage.comparisonsUsed}/{usage.comparisonsLimit}
      </div>
      <div className="text-xs text-gray-500">
        {usage.subscriptionTier.charAt(0).toUpperCase() + usage.subscriptionTier.slice(1)} Plan
      </div>
    </div>
  );
} 