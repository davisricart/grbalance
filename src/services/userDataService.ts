// Single Source of Truth User Data Service
// This service provides a clean, consistent interface for all user data operations

import { supabase } from '../config/supabase';
import { withErrorHandling, validateRequired, ServiceResult } from '../utils/errorHandler';

// Standardized User Data Interface
// Note: This combines data from clients table, usage table, and pendingUsers table
export interface UnifiedUser {
  // From clients table:
  id: string;
  email: string;
  business_name: string;
  client_path: string;
  subscription_tier: string; // Actually stored in clients table
  status: string; // 'testing', 'active', etc.
  created_at: string;
  updated_at: string;
  
  // From usage table:
  billing_cycle: string;
  comparisons_used: number;
  comparisons_limit: number;
  
  // From pendingUsers table (for compatibility):
  business_type: string;
  workflow_stage: 'pending' | 'qa_testing' | 'approved' | 'deactivated' | 'deleted';
}

// Generate consistent client path
export const generateClientPath = (business_name: string, email: string): string => {
  const cleanName = business_name?.toLowerCase().replace(/[^a-z0-9]/g, '');
  const emailPrefix = email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleanName || emailPrefix || 'client';
};

// Subscription tier limits
export const TIER_LIMITS = {
  starter: 50,
  professional: 75,
  business: 150
} as const;

/**
 * Create a new user with unified data structure
 */
export const createUser = async (userData: {
  id: string;
  email: string;
  business_name: string;
  business_type: string;
  subscription_tier: keyof typeof TIER_LIMITS;
  billing_cycle: 'monthly' | 'annual';
}): Promise<UnifiedUser> => {
  
  const client_path = generateClientPath(userData.business_name, userData.email);
  const comparison_limit = TIER_LIMITS[userData.subscription_tier];
  const now = new Date().toISOString();
  
  // Create in clients table (primary storage) - match actual schema
  const clientData = {
    id: userData.id,
    email: userData.email,
    business_name: userData.business_name,
    client_path: client_path,
    subscription_tier: userData.subscription_tier,
    status: 'testing' // Default status for new users
    // Note: business_type is stored in pendingUsers table
    // billing_cycle is stored in usage table
  };

  console.log('🔍 CLIENTS TABLE INSERT - Data being sent:', JSON.stringify(clientData, null, 2));

  const { error: clientError } = await supabase
    .from('clients')
    .upsert(clientData);

  if (clientError) {
    console.error('❌ CLIENTS TABLE INSERT FAILED:', JSON.stringify(clientError, null, 2));
    console.error('❌ Error code:', clientError.code);
    console.error('❌ Error message:', clientError.message);
    console.error('❌ Error details:', clientError.details);
    console.error('❌ Error hint:', clientError.hint);
    throw clientError;
  }

  console.log('✅ CLIENTS TABLE INSERT SUCCESS');

  // Create usage tracking record (includes subscription and billing info)
  const usageData = {
    id: userData.id,
    email: userData.email,
    subscriptionTier: userData.subscription_tier, // camelCase for usage table (confirmed by AdminPage)
    // billingcycle: userData.billing_cycle, // REMOVED - column doesn't exist in usage table
    comparisonsUsed: 0,
    comparisonsLimit: comparison_limit,
    status: 'pending',
    // createdat: now, // REMOVED - column doesn't exist in usage table
    updatedAt: now
  };

  console.log('🔍 USAGE TABLE INSERT - Data being sent:', JSON.stringify(usageData, null, 2));
  
  const { error: usageError } = await supabase
    .from('usage')
    .upsert(usageData);

  if (usageError) {
    console.error('❌ USAGE TABLE INSERT FAILED:', JSON.stringify(usageError, null, 2));
    console.error('❌ Error code:', usageError.code);
    console.error('❌ Error message:', usageError.message);
    console.error('❌ Error details:', usageError.details);
    console.error('❌ Error hint:', usageError.hint);
    throw usageError;
  }

  console.log('✅ USAGE TABLE INSERT SUCCESS');

  // Also maintain backward compatibility with pendingUsers table
  const { error: pendingError } = await supabase
    .from('pendingUsers')
    .upsert({
      id: userData.id,
      email: userData.email,
      businessname: userData.business_name,
      businesstype: userData.business_type,
      subscriptiontier: userData.subscription_tier,
      billingcycle: userData.billing_cycle,
      createdat: now,
      status: 'pending'
    });

  if (pendingError) console.warn('Warning: pendingUsers update failed:', pendingError);

  return {
    id: userData.id,
    email: userData.email,
    business_name: userData.business_name,
    business_type: userData.business_type,
    client_path: client_path,
    subscription_tier: userData.subscription_tier,
    billing_cycle: userData.billing_cycle,
    status: 'testing',
    workflow_stage: 'pending' as const,
    comparisons_used: 0,
    comparisons_limit: comparison_limit,
    created_at: now,
    updated_at: now
  };
};

/**
 * Get user by ID with unified data structure
 */
export const getUserById = async (userId: string): Promise<UnifiedUser | null> => {
  // Get primary data from clients table
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', userId)
    .single();

  if (clientError || !clientData) {
    console.warn('User not found in clients table:', userId);
    return null;
  }

  // Get usage data (includes billing info)
  const { data: usageData } = await supabase
    .from('usage')
    .select('billingcycle, comparisonsUsed, comparisonsLimit')
    .eq('id', userId)
    .single();

  // Get business_type from pendingUsers table if available
  const { data: pendingData } = await supabase
    .from('pendingUsers')
    .select('businesstype')
    .eq('id', userId)
    .single();

  // Map status to workflow_stage
  const statusToWorkflowStage = {
    'testing': 'qa_testing',
    'active': 'approved',
    'inactive': 'deactivated'
  } as const;

  return {
    id: clientData.id,
    email: clientData.email,
    business_name: clientData.business_name || 'Business Name Not Set',
    business_type: pendingData?.businesstype || 'Other',
    client_path: clientData.client_path,
    subscription_tier: clientData.subscription_tier || 'starter',
    status: clientData.status || 'testing',
    workflow_stage: statusToWorkflowStage[clientData.status as keyof typeof statusToWorkflowStage] || 'pending',
    billing_cycle: usageData?.billingcycle || 'monthly',
    comparisons_used: usageData?.comparisonsUsed || 0,
    comparisons_limit: usageData?.comparisonsLimit || TIER_LIMITS[clientData.subscription_tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.starter,
    created_at: clientData.created_at,
    updated_at: clientData.updated_at
  };
};

/**
 * Update user workflow stage
 */
export const updateUserWorkflowStage = async (
  userId: string, 
  newStage: UnifiedUser['workflow_stage']
): Promise<void> => {
  const now = new Date().toISOString();

  // Map workflow_stage to status for clients table
  const workflowToStatusMap = {
    pending: 'testing',
    qa_testing: 'testing',
    approved: 'active',
    deactivated: 'inactive',
    deleted: 'inactive'
  } as const;

  // Update clients table (update status, not workflow_stage since that column doesn't exist)
  const { error: clientError } = await supabase
    .from('clients')
    .update({
      status: workflowToStatusMap[newStage]
    })
    .eq('id', userId);

  if (clientError) throw clientError;

  // Update usage table for compatibility
  const statusMap = {
    pending: 'pending',
    qa_testing: 'trial', 
    approved: 'approved',
    deactivated: 'deactivated',
    deleted: 'deleted'
  };

  const { error: usageError } = await supabase
    .from('usage')
    .update({
      status: statusMap[newStage],
      updatedAt: now
    })
    .eq('id', userId);

  if (usageError) console.warn('Usage table update failed:', usageError);
};

/**
 * Get users by workflow stage
 */
export const getUsersByWorkflowStage = async (
  stage: UnifiedUser['workflow_stage']
): Promise<UnifiedUser[]> => {
  console.log(`🔍 getUsersByWorkflowStage: Fetching users for stage "${stage}"`);
  
  // Use usage table status to differentiate workflow stages properly
  const stageToUsageStatusMap = {
    pending: 'pending',
    qa_testing: 'trial', 
    approved: 'approved',
    deactivated: 'deactivated',
    deleted: 'deleted'
  } as const;

  // Get users from usage table first (this has the proper status differentiation)
  const { data: usageUsers, error: usageError } = await supabase
    .from('usage')
    .select('id, status, subscriptionTier, comparisonsUsed, comparisonsLimit, billingcycle')
    .eq('status', stageToUsageStatusMap[stage])
    .order('id');

  if (usageError) {
    console.error(`❌ getUsersByWorkflowStage: Error fetching from usage table:`, usageError);
    throw usageError;
  }
  
  if (!usageUsers || usageUsers.length === 0) {
    console.log(`📊 getUsersByWorkflowStage: No users found for stage "${stage}"`);
    return [];
  }

  console.log(`📊 getUsersByWorkflowStage: Found ${usageUsers.length} users in usage table with status "${stageToUsageStatusMap[stage]}"`);

  // Get corresponding client data
  const userIds = usageUsers.map(u => u.id);
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .in('id', userIds);

  if (clientError) {
    console.error(`❌ getUsersByWorkflowStage: Error fetching clients:`, clientError);
    throw clientError;
  }

  if (!clients || clients.length === 0) {
    console.log(`📊 getUsersByWorkflowStage: No client data found for ${usageUsers.length} usage records`);
    return [];
  }

  console.log(`📊 getUsersByWorkflowStage: Found ${clients.length} clients for ${usageUsers.length} usage records`);

  // Get business_type data from pendingUsers table (reuse existing userIds)
  const { data: pendingData } = await supabase
    .from('pendingUsers')
    .select('id, businesstype')
    .in('id', userIds);

  // Create maps for efficient lookup
  const usageMap = new Map(usageUsers.map(u => [u.id, u]));
  const pendingMap = new Map(pendingData?.map(p => [p.id, p]) || []);
  const clientMap = new Map(clients.map(c => [c.id, c]));

  // Map status to workflow stage based on usage table status (single source of truth)
  const usageStatusToWorkflowStage = {
    'pending': 'pending',
    'trial': 'qa_testing',
    'approved': 'approved',
    'deactivated': 'deactivated',
    'deleted': 'deleted'
  } as const;

  const result = usageUsers.map(usageUser => {
    const client = clientMap.get(usageUser.id);
    const pending = pendingMap.get(usageUser.id);
    
    if (!client) {
      console.warn(`⚠️ Missing client data for user ${usageUser.id}`);
      return null;
    }
    
    return {
      id: usageUser.id,
      email: client.email,
      business_name: client.business_name || 'Business Name Not Set',
      business_type: pending?.businesstype || 'Other',
      client_path: client.client_path,
      subscription_tier: client.subscription_tier || 'starter',
      status: client.status || 'testing',
      workflow_stage: usageStatusToWorkflowStage[usageUser.status as keyof typeof usageStatusToWorkflowStage] || stage,
      billing_cycle: usageUser.billingcycle || 'monthly',
      comparisons_used: usageUser.comparisonsUsed || 0,
      comparisons_limit: usageUser.comparisonsLimit || TIER_LIMITS[client.subscription_tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.starter,
      created_at: client.created_at,
      updated_at: client.updated_at
    };
  }).filter(Boolean) as UnifiedUser[];

  console.log(`✅ getUsersByWorkflowStage: Returning ${result.length} users for stage "${stage}"`);
  return result;
};

/**
 * Update user business information
 */
export const updateUserBusinessInfo = async (
  userId: string,
  updates: Partial<Pick<UnifiedUser, 'business_name' | 'business_type' | 'subscription_tier' | 'billing_cycle'>>
): Promise<void> => {
  const now = new Date().toISOString();
  
  // Prepare updates for clients table (only fields that exist there)
  const clientUpdates: any = {};
  let needsClientUpdate = false;
  
  if (updates.business_name) {
    clientUpdates.business_name = updates.business_name;
    // Update client_path when business_name changes
    const user = await getUserById(userId);
    if (user) {
      clientUpdates.client_path = generateClientPath(updates.business_name, user.email);
    }
    needsClientUpdate = true;
  }
  
  if (updates.subscription_tier) {
    clientUpdates.subscription_tier = updates.subscription_tier;
    needsClientUpdate = true;
  }

  // Update clients table if needed
  if (needsClientUpdate) {
    const { error: clientError } = await supabase
      .from('clients')
      .update(clientUpdates)
      .eq('id', userId);

    if (clientError) throw clientError;
  }

  // Update usage table for subscription/billing changes (these fields are stored in usage table)
  const usageUpdates: any = {};
  let needsUsageUpdate = false;
  
  if (updates.subscription_tier) {
    usageUpdates.subscriptionTier = updates.subscription_tier;
    usageUpdates.comparisonsLimit = TIER_LIMITS[updates.subscription_tier as keyof typeof TIER_LIMITS];
    needsUsageUpdate = true;
  }
  
  if (updates.billing_cycle) {
    usageUpdates.billingcycle = updates.billing_cycle;
    needsUsageUpdate = true;
  }
  
  if (needsUsageUpdate) {
    usageUpdates.updatedAt = now;
    
    const { error: usageError } = await supabase
      .from('usage')
      .update(usageUpdates)
      .eq('id', userId);

    if (usageError) console.warn('Usage table update failed:', usageError);
  }
  
  // Update pendingUsers table for business_type (if it exists there)
  if (updates.business_type) {
    const { error: pendingError } = await supabase
      .from('pendingUsers')
      .update({
        businesstype: updates.business_type
      })
      .eq('id', userId);

    if (pendingError) console.warn('PendingUsers table update failed:', pendingError);
  }
};