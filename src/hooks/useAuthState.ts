import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface UserStatus {
  isAuthenticated: boolean;
  isApproved: boolean;
  isPending: boolean;
  isLoading: boolean;
  user: any;
  userStatus: string | null;
}

export function useAuthState(): UserStatus {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = async (session: any) => {
    if (session?.user) {
      setIsAuthenticated(true);
      setUser(session.user);
      
      try {
        // ADMIN BYPASS: Auto-approve admin email
        if (session.user.email === 'davisricart@gmail.com') {
          console.log('🚨 ADMIN APPROVAL BYPASS: Auto-approving admin email');
          setUserStatus('approved');
          setIsApproved(true);
          setIsPending(false);
          setIsLoading(false);
          return;
        }
        
        // For other users, auto-approve for now (since we migrated from Firebase)
        // TODO: Implement proper user approval system in Supabase
        console.log('✅ Auto-approving user during migration period');
        setUserStatus('approved');
        setIsApproved(true);
        setIsPending(false);
        
      } catch (error) {
        console.error('Error checking user status:', error);
        // Default to approved during migration
        setUserStatus('approved');
        setIsApproved(true);
        setIsPending(false);
      }
    } else {
      // User not authenticated
      setIsAuthenticated(false);
      setIsApproved(false);
      setIsPending(false);
      setUser(null);
      setUserStatus(null);
    }
    
    setIsLoading(false);
  };

  return { 
    isAuthenticated, 
    isApproved, 
    isPending, 
    isLoading, 
    user, 
    userStatus 
  };
}