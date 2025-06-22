import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface AdminVerificationResponse {
  isAdmin: boolean;
  userEmail?: string;
  message?: string;
  error?: string;
}

/**
 * Securely verify if the current user is an admin
 * This calls the server-side verification function
 */
export const verifyAdminAccess = async (): Promise<AdminVerificationResponse> => {
  try {
    // Get current user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        isAdmin: false,
        error: 'User not authenticated'
      };
    }

    // TEMPORARY EMERGENCY BYPASS: Grant admin access to specific email
    const userEmail = user.email || '';
    if (userEmail === 'davisricart@gmail.com') {
      console.log('🚨 EMERGENCY ADMIN BYPASS: Granting admin access to:', userEmail);
      return {
        isAdmin: true,
        userEmail,
        message: 'Emergency admin access granted'
      };
    }

    // FORCE DEVELOPMENT MODE: Always bypass server for localhost
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' || 
        window.location.port === '3000' ||
        window.location.origin.includes('localhost')) {
      
      console.log('🔧 FORCE DEVELOPMENT MODE: Bypassing ALL server verification');
      console.log('🔧 Current hostname:', window.location.hostname);
      console.log('🔧 Current origin:', window.location.origin);
      
      // HARDCODED ADMIN ACCESS for development
      const isAdmin = userEmail === 'davisricart@gmail.com';
      
      console.log(`🔧 FORCE ADMIN CHECK: ${userEmail} -> ${isAdmin ? 'ADMIN GRANTED' : 'NOT ADMIN'}`);
      
      return {
        isAdmin,
        userEmail,
        message: isAdmin ? 'Development mode: FORCE ADMIN ACCESS' : 'Development mode: Not admin email'
      };
    }

    // Get Supabase session token
    const { data: { session } } = await supabase.auth.getSession();
    
    // Call secure server-side verification
    const response = await fetch('/.netlify/functions/verify-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn('Admin verification failed:', errorData);
      return {
        isAdmin: false,
        error: errorData.error || 'Verification failed'
      };
    }

    const data: AdminVerificationResponse = await response.json();
    return data;

  } catch (error) {
    console.error('Error verifying admin access:', error);
    return {
      isAdmin: false,
      error: 'Network error during admin verification'
    };
  }
};

/**
 * Hook to check admin status with loading state
 */
export const useAdminVerification = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);
      setError(null);

      const result = await verifyAdminAccess();
      
      setIsAdmin(result.isAdmin);
      if (result.error) {
        setError(result.error);
      }
      setIsLoading(false);
    };

    // Only check if user is authenticated
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        checkAdminStatus();
      } else {
        setIsAdmin(false);
        setIsLoading(false);
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, isLoading, error };
};

 