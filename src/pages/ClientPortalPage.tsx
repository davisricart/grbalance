import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, CheckSquare } from 'lucide-react';
import { supabase } from '../config/supabase';
import clientConfig from '../config/client';
import ReconciliationApp from './ReconciliationApp';
import { verifyAdminAccess } from '../services/adminService';

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
  const [error, setError] = useState(''); // Form validation errors
  const [fatalError, setFatalError] = useState(''); // Client not found, etc.
  const [isAdminBypass, setIsAdminBypass] = useState(false);
  const [isHuman, setIsHuman] = useState(false);

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
        
        // Check if user is admin first (admin bypass for QA testing)
        try {
          const adminResult = await verifyAdminAccess();
          if (adminResult.isAdmin) {
            console.log('🔧 Admin bypass: Granting access for QA testing');
            setIsAdminBypass(true);
            setIsAuthenticated(true);
            return;
          }
        } catch (adminError) {
          console.warn('⚠️ Admin verification failed, continuing with normal auth:', adminError);
        }
        
        // Normal authentication check - user email must exactly match client email
        if (clientData && user.email === clientData.email) {
          console.log('✅ User authenticated and authorized for this client portal');
          setIsAuthenticated(true);
        } else {
          console.log('❌ User not authorized for this client portal - signing out unauthorized user');
          setIsAuthenticated(false);
          // Only sign out if not admin (preserve admin session)
          const adminResult = await verifyAdminAccess();
          if (!adminResult.isAdmin) {
            await supabase.auth.signOut();
          }
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
        setFatalError('No client name provided');
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
              
              // Check admin bypass first
              try {
                const adminResult = await verifyAdminAccess();
                if (adminResult.isAdmin) {
                  console.log('🔧 Admin bypass: Granting access for QA testing');
                  setIsAdminBypass(true);
                  setIsAuthenticated(true);
                  return;
                }
              } catch (adminError) {
                console.warn('⚠️ Admin verification failed, continuing with normal auth:', adminError);
              }
              
              // For active clients, automatically grant access
              if (clients[0].status === 'active') {
                console.log('🟢 Active client - granting access');
                setIsAuthenticated(true);
                return;
              }
              
              // Verify user is authorized for this specific client portal
              if (user.email === clients[0].email) {
                console.log('✅ User authenticated and authorized for this client portal');
                setIsAuthenticated(true);
              } else {
                console.log('❌ User not authorized for this client portal - checking admin status');
                // Check admin status before signing out
                try {
                  const adminResult = await verifyAdminAccess();
                  if (!adminResult.isAdmin) {
                    setIsAuthenticated(false);
                    await supabase.auth.signOut();
                  } else {
                    console.log('🔧 Preserving admin session');
                    setIsAdminBypass(true);
                    setIsAuthenticated(true);
                  }
                } catch (adminError) {
                  setIsAuthenticated(false);
                  await supabase.auth.signOut();
                }
              }
            } else {
              // Require authentication for all clients
              console.log('🔒 Client requires authentication');
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
            
            setFatalError(`Client portal "${clientname}" not found`);
          }
        } else {
          const errorData = await response.text();
          console.log('❌ Response error:', errorData);
          setFatalError(`Failed to load client portal: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Error loading client:', error);
        setFatalError(`Error loading client portal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    checkClientExists();
  }, [clientname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isHuman) {
      setError('Please verify that you are human');
      return;
    }
    
    if (!clientData) {
      setError('Client portal data not available. Please refresh the page.');
      return;
    }
    
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
        // Check admin bypass first
        try {
          const adminResult = await verifyAdminAccess();
          if (adminResult.isAdmin) {
            console.log('🔧 Admin login: Granting access for QA testing');
            setIsAdminBypass(true);
            setIsAuthenticated(true);
            return;
          }
        } catch (adminError) {
          console.warn('⚠️ Admin verification failed during login, continuing with normal auth:', adminError);
        }
        
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
    if (isAdminBypass) {
      // For admin bypass, just redirect back to admin without signing out
      console.log('🔧 Admin bypass: Redirecting to admin dashboard without logout');
      window.location.href = '/admin/dashboard';
      return;
    }
    
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

  if (fatalError || !clientData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal Not Found</h1>
          <p className="text-gray-600 mb-4">{fatalError || 'This client portal does not exist'}</p>
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

              <div className="flex items-center justify-center">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div 
                    className={`w-6 h-6 rounded border transition-colors duration-200 flex items-center justify-center ${
                      isHuman ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300 group-hover:border-emerald-400'
                    }`}
                    onClick={() => setIsHuman(!isHuman)}
                  >
                    {isHuman && <CheckSquare className="w-5 h-5 text-white" />}
                  </div>
                  <span className="text-sm text-gray-600">I am human</span>
                </label>
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
    clientStatus: clientData.status,
    isAdminBypass: isAdminBypass
  };
  
  // Add admin bypass indicator if in admin mode
  if (isAdminBypass) {
    return (
      <div>
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <strong>Admin QA Mode:</strong> You are viewing this client portal as an admin for testing purposes.
                <button 
                  onClick={handleLogout}
                  className="ml-2 text-amber-800 underline hover:text-amber-900"
                >
                  Return to Admin Dashboard
                </button>
              </p>
            </div>
          </div>
        </div>
        <ReconciliationApp clientPortalUser={mockUser} />
      </div>
    );
  }
  
  return <ReconciliationApp clientPortalUser={mockUser} />;
} 