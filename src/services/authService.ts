// Unified Authentication Service
// Centralizes all authentication logic and eliminates duplication

import { supabase } from '../config/supabase';
import { getUserById, UnifiedUser } from './userDataService';
import { isAdminEmail } from './adminService';

export interface AuthUser {
  id: string;
  email: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  isPending: boolean;
  userStatus: 'pending' | 'trial' | 'approved' | 'admin';
  userData?: UnifiedUser;
}

/**
 * Get comprehensive auth status for a user
 */
export async function getAuthStatus(userId?: string): Promise<AuthUser | null> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return null;
    }

    const user = session.user;
    const email = user.email || '';

    // Check if admin
    const isAdmin = isAdminEmail(email);
    
    if (isAdmin) {
      return {
        id: user.id,
        email,
        isAuthenticated: true,
        isAdmin: true,
        isApproved: true,
        isPending: false,
        userStatus: 'admin'
      };
    }

    // Get user data via unified service
    const userData = await getUserById(user.id);
    
    if (!userData) {
      // User exists in auth but not in database - pending state
      return {
        id: user.id,
        email,
        isAuthenticated: true,
        isAdmin: false,
        isApproved: false,
        isPending: true,
        userStatus: 'pending'
      };
    }

    // Map workflow_stage to auth status
    const isApproved = userData.workflow_stage === 'approved';
    const isPending = userData.workflow_stage === 'pending' || userData.workflow_stage === 'qa_testing';
    
    // Determine user status
    let userStatus: 'pending' | 'trial' | 'approved' = 'pending';
    if (isApproved) {
      userStatus = userData.status === 'active' ? 'trial' : 'approved';
    }

    return {
      id: user.id,
      email,
      isAuthenticated: true,
      isAdmin: false,
      isApproved,
      isPending,
      userStatus,
      userData
    };

  } catch (error) {
    console.error('authService: Error getting auth status:', error);
    return null;
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('authService: Sign out error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('authService: Error signing out:', error);
    return false;
  }
}

/**
 * Refresh current session
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('authService: Refresh session error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('authService: Error refreshing session:', error);
    return false;
  }
}

/**
 * Check if user can access admin features
 */
export async function canAccessAdmin(): Promise<boolean> {
  const authStatus = await getAuthStatus();
  return authStatus?.isAdmin || false;
}

/**
 * Check if user can access main app features
 */
export async function canAccessMainApp(): Promise<boolean> {
  const authStatus = await getAuthStatus();
  return authStatus?.isApproved || false;
}

/**
 * Get user's trial status (if applicable) - uses trialService for consistency
 */
export async function getTrialStatus(userId: string): Promise<{
  isTrial: boolean;
  daysLeft?: number;
  expiresAt?: Date;
}> {
  try {
    // Use trialService for consistent trial calculations
    const { getTrialInfo } = await import('./trialService');
    const trialInfo = await getTrialInfo(userId);

    if (trialInfo.status === 'not-trial') {
      return { isTrial: false };
    }

    // Calculate expiration date if on trial
    let expiresAt: Date | undefined;
    if (trialInfo.status === 'active') {
      const userData = await getUserById(userId);
      if (userData) {
        const createdAt = new Date(userData.created_at);
        expiresAt = new Date(createdAt.getTime() + (14 * 24 * 60 * 60 * 1000));
      }
    }

    return {
      isTrial: trialInfo.status === 'active',
      daysLeft: trialInfo.daysLeft,
      expiresAt
    };

  } catch (error) {
    console.error('authService: Error getting trial status:', error);
    return { isTrial: false };
  }
}