import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { supabase } from '../config/supabase';
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
        
        if (clientData && user.email === clientData.email) {
          console.log('✅ User authenticated and authorized for this client portal');
          setIsAuthenticated(true);
        } else {
          console.log('❌ User not authorized for this client portal');
          setIsAuthenticated(false);
          // Sign out unauthorized user
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
              // For testing clients without authentication, still allow auto-auth
              if (clients[0].status === 'testing') {
                console.log('🧪 Testing client detected - auto-authenticating');
                setIsAuthenticated(true);
              }
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