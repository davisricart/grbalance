import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Shield, AlertTriangle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../config/supabase';
import clientConfig from '../config/client';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if already authenticated as admin on component mount
  useEffect(() => {
    const checkAdminAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email === 'davisricart@gmail.com') {
        navigate('/admin/dashboard');
      }
    };
    checkAdminAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // First check if this is the admin email
      if (email !== 'davisricart@gmail.com') {
        setError('Unauthorized access. This is a secure admin portal.');
        setIsLoading(false);
        return;
      }

      // Attempt Supabase authentication
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        
        // If user doesn't exist, try to create admin account
        if (authError.message.includes('Invalid login credentials')) {
          try {
            console.log('Admin account not found, attempting to create...');
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
            });

            if (signUpError) {
              setError(`Failed to create admin account: ${signUpError.message}`);
              setIsLoading(false);
              return;
            }

            if (signUpData.user) {
              console.log('Admin account created successfully');
              // If email confirmation is required, show message
              if (!signUpData.session) {
                setError('Admin account created. Please check your email to confirm your account, then try logging in again.');
              } else {
                // Direct login success
                navigate('/admin/dashboard');
              }
            }
          } catch (createError) {
            console.error('Error creating admin account:', createError);
            setError('Unable to create admin account. Please contact support.');
          }
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Email not confirmed. Please check your email for confirmation link.');
        } else {
          setError(`Authentication failed: ${authError.message}`);
        }
        setIsLoading(false);
        return;
      }

      if (data.user && data.user.email === 'davisricart@gmail.com') {
        // Successfully authenticated as admin
        console.log('Admin authentication successful');
        navigate('/admin/dashboard');
      } else {
        setError('Unauthorized access. Admin privileges required.');
        // Sign out the user if they're not admin
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError('Authentication system error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Helmet>
        <title>Admin Login | GR Balance</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a 
              href="/"
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Home
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
            <h2 className="text-emerald-700 text-center text-base sm:text-lg font-medium">
              Admin Login
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-emerald-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition duration-200"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-emerald-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Access Admin Dashboard
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}