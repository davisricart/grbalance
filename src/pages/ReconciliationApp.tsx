import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import LoginPage from './LoginPage';
import { MainPage } from './MainPage';

interface ReconciliationAppProps {
  clientPortalUser?: any;
}

const ReconciliationApp: React.FC<ReconciliationAppProps> = ({ clientPortalUser }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have a client portal user, use that instead of Supabase auth
    if (clientPortalUser) {
      console.log('🏪 Client Portal Mode: Using client data instead of Supabase auth');
      console.log('🏪 Client Portal User:', clientPortalUser);
      console.log('🏪 Client Portal User isClientPortal:', clientPortalUser.isClientPortal);
      console.log('🏪 Client Portal User clientStatus:', clientPortalUser.clientStatus);
      console.log('🏪 FORCING client portal user - ignoring any existing Supabase session');
      setUser(clientPortalUser);
      setIsLoading(false);
      return;
    }

    // Otherwise, use normal Supabase authentication
    console.log('🔐 Normal Mode: Using Supabase authentication');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Supabase session:', session?.user?.email);
      setUser(session?.user || null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state change:', event, session?.user?.email);
      setUser(session?.user || null);
        setIsLoading(false);
        setError(null);
    });

    return () => subscription.unsubscribe();
  }, [clientPortalUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return user ? <MainPage user={user} /> : <LoginPage />;
};

export default ReconciliationApp;