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
        // Check user approval status in Supabase
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select('status, approved_at')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error);
          setUserStatus('pending');
          setIsApproved(false);
          setIsPending(true);
        } else if (userProfile?.status === 'approved') {
          setUserStatus('approved');
          setIsApproved(true);
          setIsPending(false);
        } else {
          // User not approved or doesn't exist in profiles table
          setUserStatus('pending');
          setIsApproved(false);
          setIsPending(true);
        }
        
              } catch (error) {
        console.error('Error checking user status:', error);
        // Default to pending for security
        setUserStatus('pending');
        setIsApproved(false);
        setIsPending(true);
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