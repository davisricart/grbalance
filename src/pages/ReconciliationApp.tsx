import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

import { auth } from '../main';
import LoginPage from './LoginPage';
import { MainPage } from './MainPage';

const ReconciliationApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Auth error:', error);
        setError('Authentication service is unavailable. Please try again later.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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