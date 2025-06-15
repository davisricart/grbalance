import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../main';

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
    // Get current user's ID token
    const user = auth.currentUser;
    if (!user) {
      return {
        isAdmin: false,
        error: 'User not authenticated'
      };
    }

    // Get fresh ID token
    const idToken = await user.getIdToken(true);

    // Call secure server-side verification
    const response = await fetch('/.netlify/functions/verify-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
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
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (user) {
        checkAdminStatus();
      } else {
        setIsAdmin(false);
        setIsLoading(false);
        setError(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return { isAdmin, isLoading, error };
};

 