// Single Source of Truth User Data Service
// This service provides a clean, consistent interface for all user data operations

import { supabase } from '../config/supabase';

// Standardized User Data Interface
export interface UnifiedUser {
  id: string;
  email: string;
  business_name: string;
  business_type: string;
  subscription_tier: string;
  billing_cycle: string;
  client_path: string;
  workflow_stage: 'pending' | 'qa_testing' | 'approved' | 'deactivated' | 'deleted';
  comparisons_used: number;
  comparisons_limit: number;
  created_at: string;
  updated_at: string;
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
  
  // Create in clients table (primary storage)
  const clientData = {
    id: userData.id,
    email: userData.email,
    business_name: userData.business_name,
    business_type: userData.business_type,
    subscription_tier: userData.subscription_tier,
    billing_cycle: userData.billing_cycle,
    client_path: client_path,
    workflow_stage: 'pending' as const,
    created_at: now,
    updated_at: now
  };

  const { error: clientError } = await supabase
    .from('clients')
    .upsert(clientData);

  if (clientError) throw clientError;

  // Create usage tracking record
  const { error: usageError } = await supabase
    .from('usage')
    .upsert({
      id: userData.id,
      email: userData.email,
      subscriptionTier: userData.subscription_tier, // Keep existing field name for compatibility
      comparisonsUsed: 0,
      comparisonsLimit: comparison_limit,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    });

  if (usageError) throw usageError;

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
    ...clientData,
    comparisons_used: 0,
    comparisons_limit: comparison_limit
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

  // Get usage data
  const { data: usageData } = await supabase
    .from('usage')
    .select('comparisonsUsed, comparisonsLimit')
    .eq('id', userId)
    .single();

  return {
    id: clientData.id,
    email: clientData.email,
    business_name: clientData.business_name,
    business_type: clientData.business_type,
    subscription_tier: clientData.subscription_tier,
    billing_cycle: clientData.billing_cycle,
    client_path: clientData.client_path,
    workflow_stage: clientData.workflow_stage,
    comparisons_used: usageData?.comparisonsUsed || 0,
    comparisons_limit: usageData?.comparisonsLimit || TIER_LIMITS[clientData.subscription_tier as keyof typeof TIER_LIMITS],
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

  // Update clients table (primary)
  const { error: clientError } = await supabase
    .from('clients')
    .update({
      workflow_stage: newStage,
      updated_at: now
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
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('workflow_stage', stage)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!clients) return [];

  // Get usage data for all users
  const userIds = clients.map(c => c.id);
  const { data: usageData } = await supabase
    .from('usage')
    .select('id, comparisonsUsed, comparisonsLimit')
    .in('id', userIds);

  const usageMap = new Map(usageData?.map(u => [u.id, u]) || []);

  return clients.map(client => {
    const usage = usageMap.get(client.id);
    return {
      id: client.id,
      email: client.email,
      business_name: client.business_name,
      business_type: client.business_type,
      subscription_tier: client.subscription_tier,
      billing_cycle: client.billing_cycle,
      client_path: client.client_path,
      workflow_stage: client.workflow_stage,
      comparisons_used: usage?.comparisonsUsed || 0,
      comparisons_limit: usage?.comparisonsLimit || TIER_LIMITS[client.subscription_tier as keyof typeof TIER_LIMITS],
      created_at: client.created_at,
      updated_at: client.updated_at
    };
  });
};

/**
 * Update user business information
 */
export const updateUserBusinessInfo = async (
  userId: string,
  updates: Partial<Pick<UnifiedUser, 'business_name' | 'business_type' | 'subscription_tier' | 'billing_cycle'>>
): Promise<void> => {
  const now = new Date().toISOString();
  
  // Update client_path if business_name changed
  const updateData: any = {
    ...updates,
    updated_at: now
  };
  
  if (updates.business_name) {
    const user = await getUserById(userId);
    if (user) {
      updateData.client_path = generateClientPath(updates.business_name, user.email);
    }
  }

  // Update clients table (primary)
  const { error: clientError } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', userId);

  if (clientError) throw clientError;

  // Update usage table for compatibility if subscription changed
  if (updates.subscription_tier) {
    const { error: usageError } = await supabase
      .from('usage')
      .update({
        subscriptionTier: updates.subscription_tier,
        comparisonsLimit: TIER_LIMITS[updates.subscription_tier as keyof typeof TIER_LIMITS],
        updatedAt: now
      })
      .eq('id', userId);

    if (usageError) console.warn('Usage table update failed:', usageError);
  }
};