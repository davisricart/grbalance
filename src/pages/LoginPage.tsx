import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { Helmet } from 'react-helmet';
import { LogIn, AlertCircle, ArrowLeft, Home, CheckSquare } from 'lucide-react';

import { auth, db } from '../main';
import clientConfig from '../config/client';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHuman, setIsHuman] = useState(false);

  // Preserve URL parameters for registration link
  const registerUrl = `/register${location.search}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isHuman) {
      setError('Please verify that you are human');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check user's approval status
      const userStatusDoc = await getDoc(doc(db, 'usage', user.uid));
      
      if (userStatusDoc.exists() && userStatusDoc.data().status === 'pending') {
        // User is pending approval - redirect to pending page
        navigate('/pending-approval');
        return;
      }
      
      // Check if user is associated with a specific client
      const clientId = detectClientFromEmail(email);
      
      if (clientId) {
        // Redirect to client-specific portal
        navigate(`/app?client=${clientId}`);
      } else {
        // Check if there's already a client parameter in the URL
        const urlParams = new URLSearchParams(location.search);
        const existingClient = urlParams.get('client');
        
        if (existingClient) {
          // Preserve the client parameter from the URL
          navigate(`/app?client=${existingClient}`);
        } else {
          // Default redirect to main app
      navigate('/app');
        }
      }
    } catch (error: any) {
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/invalid-login-credentials':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          setError('Incorrect email or password');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Try again later');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Check your connection');
          break;
        default:
          setError('Incorrect email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to detect client association from email
  const detectClientFromEmail = (email: string): string | null => {
    // Mock client associations - in production, this would come from your database
    const clientAssociations: { [key: string]: string } = {
      'test@test.com': 'demo',  // Added for testing
      'tony@pizzashop.com': 'tonys-pizza',
      'manager@salonspa.com': 'salon-pro',
      'admin@retailstore.com': 'retail-store',
      'demo@example.com': 'demo',
      // Add more client associations as needed
    };

    return clientAssociations[email.toLowerCase()] || null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Helmet>
        <title>Login to Salon Reconciliation Account | Access Your Dashboard | GR Balance</title>
        <meta name="description" content="Login to your GR Balance salon reconciliation account. Access your dashboard, view reconciliation reports, and manage your salon's payment processing data securely." />
        <meta name="keywords" content="salon account login, reconciliation dashboard, GR Balance login, salon software access, payment reconciliation account, secure salon login" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://grbalance.netlify.app/login" />
      </Helmet>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
            <Link 
              to="/"
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
            >
              <Home className="h-5 w-5" />
              Home
            </Link>
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
              Sign In
            </p>
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to={registerUrl} className="text-emerald-600 hover:text-emerald-700 font-medium">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}