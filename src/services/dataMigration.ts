// Data Migration Service
// Safely migrates data from old fragmented structure to new unified structure

import { supabase } from '../config/supabase';
import { UnifiedUser, generateClientPath, TIER_LIMITS } from './userDataService';

/**
 * Migrate existing data to unified structure
 * This ensures existing users don't lose their data
 */
export const migrateExistingData = async (): Promise<{
  success: boolean;
  migrated: number;
  errors: string[];
}> => {
  console.log('🔄 MIGRATION: Starting data migration to unified structure...');
  
  const errors: string[] = [];
  let migratedCount = 0;

  try {
    // Step 1: Get all existing users from various tables
    const [
      { data: pendingUsers },
      { data: readyUsers },
      { data: usageUsers },
      { data: existingClients }
    ] = await Promise.all([
      supabase.from('pendingUsers').select('*'),
      supabase.from('ready-for-testing').select('*'), 
      supabase.from('usage').select('*'),
      supabase.from('clients').select('*')
    ]);

    // Step 2: Create master user list from all sources
    const allUserData = new Map<string, any>();

    // Process pending users
    (pendingUsers || []).forEach((user: any) => {
      let businessName = user.businessname || user.businessName || 'Business Name Not Set';
      
      // Apply same correction logic as AdminPage for test user
      if (user.email === 'grbalancetesting@gmail.com') {
        if (!businessName || businessName === 'Business Name Not Set' || businessName === 'GR Balance' || businessName.includes('Unknown')) {
          businessName = 'GR Salon';
          console.log('🔧 MIGRATION: Setting business name to "GR Salon" for testing user (was:', user.businessname || user.businessName, ')');
        }
      }
      
      allUserData.set(user.id, {
        id: user.id,
        email: user.email,
        business_name: businessName,
        business_type: user.businesstype || user.businessType || 'Other',      // Fixed: handles both casing
        subscription_tier: user.subscriptiontier || user.subscriptionTier || 'starter', // Fixed: handles both casing
        billing_cycle: user.billingcycle || user.billingCycle || 'monthly',  // Fixed: handles both casing
        workflow_stage: 'pending',
        source: 'pendingUsers'
      });
    });

    // Process ready-for-testing users
    (readyUsers || []).forEach((user: any) => {
      const existing = allUserData.get(user.id) || {};
      let businessName = user.businessname || existing.business_name || 'Business Name Not Set';
      
      // Apply same correction logic as AdminPage for test user
      if (user.email === 'grbalancetesting@gmail.com') {
        if (!businessName || businessName === 'Business Name Not Set' || businessName === 'GR Balance' || businessName.includes('Unknown')) {
          businessName = 'GR Salon';
          console.log('🔧 MIGRATION: Setting business name to "GR Salon" for testing user in ready-for-testing (was:', user.businessname, ')');
        }
      }
      
      const updatedData = {
        ...existing,
        id: user.id,
        email: user.email,
        business_name: businessName,
        business_type: user.businesstype || existing.business_type || 'Other',      // Fixed: lowercase from ready-for-testing
        subscription_tier: user.subscriptiontier || existing.subscription_tier || 'starter', // Fixed: lowercase from ready-for-testing
        billing_cycle: user.billingcycle || existing.billing_cycle || 'monthly',  // Fixed: lowercase from ready-for-testing
        workflow_stage: 'qa_testing',
        source: (existing.source || '') + ',ready-for-testing'
      };
      
      console.log(`📝 READY-FOR-TESTING: Set business_name to "${updatedData.business_name}" for ${user.email}`);
      allUserData.set(user.id, updatedData);
    });

    // Process usage table users (approved/active users)
    (usageUsers || []).forEach((user: any) => {
      const existing = allUserData.get(user.id) || {};
      const workflowStage = user.status === 'approved' ? 'approved' :
                           user.status === 'deactivated' ? 'deactivated' :
                           user.status === 'deleted' ? 'deleted' : 'pending';
      
      const updatedData = {
        ...existing,
        id: user.id,
        email: user.email,
        business_name: existing.business_name || 'Business Name Not Set',
        business_type: existing.business_type || 'Other', 
        subscription_tier: user.subscriptionTier || existing.subscription_tier || 'starter',
        billing_cycle: existing.billing_cycle || 'monthly',
        workflow_stage: workflowStage,
        comparisons_used: user.comparisonsUsed || 0,
        comparisons_limit: user.comparisonsLimit || TIER_LIMITS.starter,
        source: (existing.source || '') + ',usage'
      };
      
      console.log(`📝 USAGE TABLE: Set business_name to "${updatedData.business_name}" for ${user.email} (existing was: "${existing.business_name}")`);
      allUserData.set(user.id, updatedData);
    });

    // Step 3: Enhance with existing clients data 
    (existingClients || []).forEach((client: any) => {
      const existing = allUserData.get(client.id) || {};
      
      // Preserve existing business name if it's already been corrected
      const businessName = existing.business_name && existing.business_name !== 'Business Name Not Set' 
        ? existing.business_name  // Keep corrected name (like "GR Salon")
        : client.business_name || client.name || 'Business Name Not Set';
      
      const updatedData = {
        ...existing,
        id: client.id,
        email: client.email || existing.email,
        business_name: businessName,
        business_type: client.business_type || existing.business_type || 'Other',
        client_path: client.client_path || generateClientPath(
          businessName, 
          client.email || existing.email || ''
        ),
        source: (existing.source || '') + ',clients'
      };
      
      console.log(`📝 CLIENTS TABLE: Set business_name to "${updatedData.business_name}" for ${client.email} (existing was: "${existing.business_name}", client had: "${client.business_name}")`);
      allUserData.set(client.id, updatedData);
    });

    console.log(`🔍 MIGRATION: Found ${allUserData.size} unique users to migrate`);

    // Step 4: Create/update unified records in clients table
    for (const [userId, userData] of allUserData.entries()) {
      try {
        const now = new Date().toISOString();
        
        // Match actual clients table schema (only include fields that exist)
        const unifiedUser = {
          id: userId,
          email: userData.email,
          client_path: userData.client_path || generateClientPath(
            userData.business_name || 'Business Name Not Set',
            userData.email || ''
          ),
          business_name: userData.business_name || 'Business Name Not Set',
          subscription_tier: userData.subscription_tier || 'starter',
          status: userData.workflow_stage === 'approved' ? 'active' : 'testing'
          // Note: Other fields like billing_cycle, business_type, workflow_stage don't exist in clients table
          // billing_cycle is stored in usage table
          // business_type is stored in pendingUsers table
          // workflow_stage is managed through status field
        };

        console.log(`📝 MIGRATION DEBUG: About to save user ${userId} with business_name: "${unifiedUser.business_name}"`);

        // Upsert to clients table
        const { error: clientError } = await supabase
          .from('clients')
          .upsert(unifiedUser);

        if (clientError) {
          errors.push(`Failed to migrate user ${userId}: ${clientError.message}`);
          continue;
        }

        // Ensure usage tracking exists
        if (userData.workflow_stage === 'approved' || userData.comparisons_used !== undefined) {
          const { error: usageError } = await supabase
            .from('usage')
            .upsert({
              id: userId,
              email: userData.email,
              subscriptionTier: userData.subscription_tier,
              billingCycle: userData.billing_cycle || 'monthly',
              comparisonsUsed: userData.comparisons_used || 0,
              comparisonsLimit: userData.comparisons_limit || TIER_LIMITS[userData.subscription_tier as keyof typeof TIER_LIMITS],
              status: userData.workflow_stage === 'approved' ? 'approved' : 'pending',
              updatedAt: now
            });

          if (usageError) {
            console.warn(`Warning: Could not update usage for ${userId}:`, usageError);
          }
        }

        migratedCount++;
        console.log(`✅ Migrated user ${migratedCount}: ${userData.email} - ${userData.business_name}`);
        
      } catch (error) {
        const errorMsg = `Failed to migrate user ${userId}: ${error}`;
        errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    console.log(`🎉 MIGRATION COMPLETE: Successfully migrated ${migratedCount} users`);
    if (errors.length > 0) {
      console.warn(`⚠️ Migration had ${errors.length} errors:`, errors);
    }

    return {
      success: errors.length === 0,
      migrated: migratedCount,
      errors
    };

  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    console.error('🚨 MIGRATION ERROR:', error);
    return {
      success: false,
      migrated: migratedCount,
      errors: [errorMsg]
    };
  }
};

/**
 * Verify data integrity after migration
 */
export const verifyMigration = async (): Promise<{
  totalUsers: number;
  businessNamesSet: number;
  clientPathsSet: number;
  issues: string[];
}> => {
  const { data: allUsers } = await supabase
    .from('clients')
    .select('*');

  if (!allUsers) {
    return {
      totalUsers: 0,
      businessNamesSet: 0, 
      clientPathsSet: 0,
      issues: ['Could not fetch users for verification']
    };
  }

  const issues: string[] = [];
  let businessNamesSet = 0;
  let clientPathsSet = 0;

  allUsers.forEach(user => {
    if (user.business_name && user.business_name !== 'Business Name Not Set') {
      businessNamesSet++;
    } else {
      issues.push(`User ${user.email} has no business name set`);
    }

    if (user.client_path) {
      clientPathsSet++;
    } else {
      issues.push(`User ${user.email} has no client path set`);
    }

    if (!user.subscription_tier) {
      issues.push(`User ${user.email} has no subscription tier`);
    }
  });

  return {
    totalUsers: allUsers.length,
    businessNamesSet,
    clientPathsSet,
    issues
  };
};