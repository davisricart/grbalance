import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../config/supabase';

interface UserStatus {
  isAuthenticated: boolean;
  isApproved: boolean;
  isPending: boolean;
  isLoading: boolean;
  user: any;
  userStatus: string | null;
}

interface AuthContextType extends UserStatus {
  signOut: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  
  const mounted = useRef(true);
  const initializationStarted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    
    // Prevent multiple initialization attempts
    if (initializationStarted.current) {
      return;
    }
    initializationStarted.current = true;
    
    console.log('🔐 AuthProvider: Initializing auth state...');
    
    // Get initial session with enhanced error handling
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Handle 406 and other auth errors gracefully
          if (error.message?.includes('406') || error.message?.includes('Not Acceptable')) {
            console.warn('🔐 AuthProvider: Supabase auth service temporarily unavailable, defaulting to unauthenticated state');
          } else {
            console.warn('🔐 AuthProvider: Auth session error:', error.message);
          }
          
          if (mounted.current) {
            handleAuthChange(null);
          }
          return;
        }
        
        if (mounted.current) {
          console.log('🔐 AuthProvider: Initial session loaded successfully');
          handleAuthChange(session);
        }
      } catch (error: any) {
        console.warn('🔐 AuthProvider: Failed to get initial session:', error.message);
        if (mounted.current) {
          handleAuthChange(null);
        }
      }
    };

    // Add a small delay to let the page stabilize before auth init
    const timeoutId = setTimeout(() => {
      if (mounted.current) {
        initAuth();
      }
    }, 100);

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 AuthProvider: Auth state change event:', event);
      if (mounted.current) {
        handleAuthChange(session);
      }
    });

    return () => {
      mounted.current = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      console.log('🔐 AuthProvider: Cleanup completed');
    };
  }, []);

  const handleAuthChange = async (session: any) => {
    if (!mounted.current) return;
    
    try {
      if (session?.user) {
        console.log('🔐 AuthProvider: User authenticated:', session.user.email);
        setIsAuthenticated(true);
        setUser(session.user);
        
        // Admin access for owner email
        if (session.user.email === 'davisricart@gmail.com') {
          console.log('✅ AuthProvider: Admin access granted');
          if (mounted.current) {
            setUserStatus('approved');
            setIsApproved(true);
            setIsPending(false);
            setIsLoading(false);
          }
          return;
        }

        // Check user approval status for other users
        try {
          const { data: userProfile, error } = await supabase
            .from('usage')
            .select('status')
            .eq('id', session.user.id)
            .single();

          if (!mounted.current) return;

          if (error && error.code !== 'PGRST116') {
            console.warn('🔐 AuthProvider: User profile fetch error:', error.message);
            // Default to pending for safety
            setUserStatus('pending');
            setIsApproved(false);
            setIsPending(true);
            setIsLoading(false); // Set loading false after status is determined
          } else if (userProfile?.status === 'approved' || userProfile?.status === 'trial') {
            console.log('🔐 AuthProvider: User approved/trial active');
            setUserStatus(userProfile.status);
            setIsApproved(true);
            setIsPending(false);
            setIsLoading(false); // Set loading false after status is determined
          } else {
            console.log('🔐 AuthProvider: User pending approval');
            setUserStatus('pending');
            setIsApproved(false);
            setIsPending(true);
            setIsLoading(false); // Set loading false after status is determined
          }
        } catch (profileError: any) {
          console.warn('🔐 AuthProvider: Error checking user status:', profileError.message);
          if (mounted.current) {
            // Default to pending for security
            setUserStatus('pending');
            setIsApproved(false);
            setIsPending(true);
            setIsLoading(false); // Set loading false after status is determined
          }
        }
      } else {
        // User not authenticated
        console.log('🔐 AuthProvider: User not authenticated');
        if (mounted.current) {
          setIsAuthenticated(false);
          setIsApproved(false);
          setIsPending(false);
          setUser(null);
          setUserStatus(null);
        }
      }
    } catch (error: any) {
      console.warn('🔐 AuthProvider: Error in handleAuthChange:', error.message);
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  const signOut = async () => {
    try {
      console.log('🔐 AuthProvider: Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('🔐 AuthProvider: Sign out error:', error.message);
      } else {
        // Ensure state is cleared immediately on successful sign out
        setUser(null);
        setIsAuthenticated(false);
        console.log('🔐 AuthProvider: Sign out successful, state cleared');
      }
    } catch (error: any) {
      console.warn('🔐 AuthProvider: Failed to sign out:', error.message);
    }
  };

  const refreshAuthState = async () => {
    if (!mounted.current) return;
    
    try {
      console.log('🔐 AuthProvider: Refreshing auth state...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('🔐 AuthProvider: Refresh error:', error.message);
        return;
      }
      
      if (mounted.current) {
        handleAuthChange(session);
      }
    } catch (error: any) {
      console.warn('🔐 AuthProvider: Failed to refresh auth state:', error.message);
    }
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    isApproved,
    isPending,
    isLoading,
    user,
    userStatus,
    signOut,
    refreshAuthState
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}