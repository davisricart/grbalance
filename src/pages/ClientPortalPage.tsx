import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { supabase } from '../config/supabase';
import clientConfig from '../config/client';
import ReconciliationApp from './ReconciliationApp';

interface ClientData {
  id: string;
  client_path: string;
  business_name: string;
  email: string;
  status: string;
  subscription_tier?: string;
  usage: {
    comparisons_used: number;
    comparisons_limit: number;
  };
}

export default function ClientPortalPage() {
  const { clientname } = useParams<{ clientname: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  // Check authentication status on component load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.log('🔒 No authenticated user found');
          setIsAuthenticated(false);
          return;
        }
        
        // Strict authentication check - user email must exactly match client email
        if (clientData && user.email === clientData.email) {
          console.log('✅ User authenticated and authorized for this client portal');
          setIsAuthenticated(true);
        } else {
          console.log('❌ User not authorized for this client portal');
          setIsAuthenticated(false);
          // Sign out unauthorized user immediately
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
        setIsAuthenticated(false);
      }
    };
    
    if (clientData) {
      checkAuthStatus();
    }
  }, [clientData]);

  // Check if client exists in Supabase
  useEffect(() => {
    const checkClientExists = async () => {
      if (!clientname) {
        console.log('❌ No clientname provided in URL');
        setError('No client name provided');
        setLoading(false);
        return;
      }
      
      try {
        console.log('🔍 Loading client portal for:', clientname);
        console.log('🔍 Current URL:', window.location.href);
        console.log('🔍 Current pathname:', window.location.pathname);
        
        const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM';
        
        console.log('🔍 Searching for client_path:', clientname);
        const response = await fetch(`${supabaseUrl}/rest/v1/clients?client_path=eq.${clientname}`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response ok:', response.ok);
        
        if (response.ok) {
          const clients = await response.json();
          console.log('🔍 Found clients:', clients);
          
          if (clients && clients.length > 0) {
            setClientData(clients[0]);
            console.log('✅ Client portal loaded:', clients[0]);
            
            // Check if user is already authenticated with Supabase
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
              console.log('🔐 User already authenticated:', user.email);
              
              // Check if this user has access to this client portal
              const { data: userProfile, error: profileError } = await supabase
                .from('usage')
                .select('status')
                .eq('id', user.id)
                .single();
                
              if (!profileError && (userProfile?.status === 'approved' || userProfile?.status === 'trial')) {
                console.log('✅ User has approved/trial status - auto-authenticating');
                setIsAuthenticated(true);
              } else {
                console.log('❌ User not approved for portal access');
              }
            } else {
              // Require authentication for all clients, including testing clients
              console.log('🔒 Client requires authentication - no auto-auth allowed');
              setIsAuthenticated(false);
            }
          } else {
            console.log('❌ No clients found with client_path:', clientname);
            // Try to fetch all clients to see what's available
            const allClientsResponse = await fetch(`${supabaseUrl}/rest/v1/clients?select=*`, {
              method: 'GET',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (allClientsResponse.ok) {
              const allClients = await allClientsResponse.json();
              console.log('🔍 All available clients:', allClients);
            }
            
            setError(`Client portal "${clientname}" not found`);
          }
        } else {
          const errorData = await response.text();
          console.log('❌ Response error:', errorData);
          setError(`Failed to load client portal: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Error loading client:', error);
        setError(`Error loading client portal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    checkClientExists();
  }, [clientname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!clientData) return;
    
    try {
      // Use proper Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      });
      
      if (error) {
        setError('Invalid email or password');
        return;
      }
      
      if (data.user) {
        // Verify user is authorized for this client portal
        if (data.user.email === clientData.email) {
          setIsAuthenticated(true);
          console.log('✅ Client authenticated with proper Supabase auth');
        } else {
          setError('You are not authorized to access this client portal');
          await supabase.auth.signOut(); // Sign out unauthorized user
        }
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setError('Authentication failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    console.log('🔓 User logged out');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        console.log('📁 File uploaded:', file.name);
        // Handle file upload logic here
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading client portal...</p>
        </div>
      </div>
    );
  }

  if (error || !clientData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This client portal does not exist'}</p>
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // Show authentication form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a 
                href="/"
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </a>
              <a 
                href="/"
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </a>
            </div>
          </div>
        </nav>

        <main className="flex items-center justify-center px-4 py-12">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
            <div className="flex flex-col items-center space-y-3 mb-6">
              <img 
                src={clientConfig.logo}
                alt={`${clientConfig.title} Logo`}
                className="h-28 sm:h-32 w-auto object-contain"
              />
              <p className="text-emerald-700 text-center text-base sm:text-lg font-medium">
                Client Portal Access
              </p>
              <p className="text-gray-600 text-center text-sm">
                Please authenticate to access {clientData.business_name}
              </p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-emerald-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition duration-200"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-emerald-600 mb-1.5">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition duration-200"
                  required
                />
              </div>
              
              {error && (
                <div className="text-red-600 text-sm bg-red-50/50 p-3 rounded-md border border-red-100 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // For client portals, show the same ReconciliationApp interface
  // that admin sees at /app - this ensures identical user experience
  // Create a mock user object from client data for ReconciliationApp
  const mockUser = {
    id: clientData.id,
    email: clientData.email,
    user_metadata: {
      business_name: clientData.business_name,
      subscription_tier: clientData.subscription_tier || 'starter'
    },
    // Add client portal specific data
    isClientPortal: true,
    clientStatus: clientData.status
  };
  
  return <ReconciliationApp clientPortalUser={mockUser} />;
} 