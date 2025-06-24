import { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';

interface UserStatus {
  isAuthenticated: boolean;
  isApproved: boolean;
  isPending: boolean;
  isLoading: boolean;
  user: any;
  userStatus: string | null;
}

// Simple cache to prevent duplicate requests across components
let authCache: UserStatus | null = null;
let authCacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export function useAuthState(): UserStatus {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    
    // Check cache first
    const now = Date.now();
    if (authCache && (now - authCacheTime) < CACHE_TTL) {
      if (mounted.current) {
        setIsAuthenticated(authCache.isAuthenticated);
        setIsApproved(authCache.isApproved);
        setIsPending(authCache.isPending);
        setIsLoading(false);
        setUser(authCache.user);
        setUserStatus(authCache.userStatus);
      }
      return;
    }
    
    // Get initial session with error handling
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Auth session error:', error.message);
          // Don't throw error, just set unauthenticated state
          handleAuthChange(null);
          return;
        }
        if (mounted.current) {
          handleAuthChange(session);
        }
      } catch (error) {
        console.warn('Failed to get initial session:', error);
        if (mounted.current) {
          handleAuthChange(null);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted.current) {
        handleAuthChange(session);
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const updateCache = (newState: Partial<UserStatus>) => {
    authCache = {
      isAuthenticated,
      isApproved,
      isPending,
      isLoading: false,
      user,
      userStatus,
      ...newState
    };
    authCacheTime = Date.now();
  };

  const handleAuthChange = async (session: any) => {
    if (!mounted.current) return;
    
    if (session?.user) {
      const newState: Partial<UserStatus> = { isAuthenticated: true, user: session.user };
      setIsAuthenticated(true);
      setUser(session.user);
      
      try {
        // Admin bypass for owner email
        if (session.user.email === 'davisricart@gmail.com') {
          console.log('Admin email detected - granting admin access');
          if (mounted.current) {
            const adminState = {
              ...newState,
              userStatus: 'approved',
              isApproved: true,
              isPending: false,
              isLoading: false
            };
            setUserStatus('approved');
            setIsApproved(true);
            setIsPending(false);
            setIsLoading(false);
            updateCache(adminState);
          }
          return;
        }

        // Check user approval status in Supabase for other users
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select('status, approved_at')
          .eq('user_id', session.user.id)
          .single();

        if (!mounted.current) return;

        let finalState = { ...newState };
        
        if (error && error.code !== 'PGRST116') {
          console.warn('User profile fetch error:', error.message);
          finalState = {
            ...finalState,
            userStatus: 'pending',
            isApproved: false,
            isPending: true
          };
          setUserStatus('pending');
          setIsApproved(false);
          setIsPending(true);
        } else if (userProfile?.status === 'approved') {
          finalState = {
            ...finalState,
            userStatus: 'approved',
            isApproved: true,
            isPending: false
          };
          setUserStatus('approved');
          setIsApproved(true);
          setIsPending(false);
        } else {
          // User not approved or doesn't exist in profiles table
          finalState = {
            ...finalState,
            userStatus: 'pending',
            isApproved: false,
            isPending: true
          };
          setUserStatus('pending');
          setIsApproved(false);
          setIsPending(true);
        }
        
        updateCache(finalState);
        
      } catch (error) {
        console.warn('Error checking user status:', error);
        if (mounted.current) {
          // Default to pending for security
          const pendingState = {
            ...newState,
            userStatus: 'pending',
            isApproved: false,
            isPending: true
          };
          setUserStatus('pending');
          setIsApproved(false);
          setIsPending(true);
          updateCache(pendingState);
        }
      }
    } else {
      // User not authenticated
      if (mounted.current) {
        const unauthState = {
          isAuthenticated: false,
          isApproved: false,
          isPending: false,
          user: null,
          userStatus: null,
          isLoading: false
        };
        setIsAuthenticated(false);
        setIsApproved(false);
        setIsPending(false);
        setUser(null);
        setUserStatus(null);
        updateCache(unauthState);
      }
    }
    
    if (mounted.current) {
      setIsLoading(false);
    }
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