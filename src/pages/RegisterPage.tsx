import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../main';
import { UserPlus, AlertCircle, ArrowLeft, Home, CheckSquare, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import clientConfig from '../config/client';

const TIER_LIMITS = {
  basic: 50,
  premium: 100,
  enterprise: 250
};

const SUBSCRIPTION_TIERS = [
  {
    name: 'Basic',
    price: '19',
    comparisons: TIER_LIMITS.basic,
    features: [
      '50 comparisons per month',
      '1 custom reconciliation script',
      'CSV & Excel file support',
      'Download results as Excel',
      'Email support'
    ]
  },
  {
    name: 'Premium',
    price: '35',
    comparisons: TIER_LIMITS.premium,
    features: [
      '100 comparisons per month',
      '2 custom reconciliation scripts',
      'CSV & Excel file support',
      'Download results as Excel',
      'Priority email support',
      'Advanced data matching'
    ]
  },
  {
    name: 'Enterprise',
    price: '65',
    comparisons: TIER_LIMITS.enterprise,
    features: [
      '250 comparisons per month',
      '4 custom reconciliation scripts',
      'CSV & Excel file support',
      'Download results as Excel',
      'Priority email support',
      'Advanced data matching',
      'Dedicated account manager',
      'Custom implementation support'
    ]
  }
];

const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const atIndex = email.indexOf('@');
  if (atIndex === -1 || atIndex === 0 || atIndex === email.length - 1) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  const domain = email.slice(atIndex + 1);
  if (!domain.includes('.')) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTier, setSelectedTier] = useState('basic');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHuman, setIsHuman] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Invalid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!isHuman) {
      setError('Please verify that you are human');
      return;
    }

    setIsLoading(true);

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Create initial usage record with email and tier-based limit
      await setDoc(doc(db, 'usage', user.uid), {
        email: user.email,
        comparisonsUsed: 0,
        comparisonsLimit: TIER_LIMITS[selectedTier as keyof typeof TIER_LIMITS],
        subscriptionTier: selectedTier,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      navigate('/app');
    } catch (error: any) {
      console.error('Registration error:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/operation-not-allowed':
          setError('Email/password accounts are not enabled');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        default:
          setError('Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
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

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600">
            Start with a 14-day free trial. No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {SUBSCRIPTION_TIERS.map((tier) => (
            <div
              key={tier.name.toLowerCase()}
              className={`rounded-2xl p-8 ${
                selectedTier === tier.name.toLowerCase()
                  ? 'ring-2 ring-emerald-600 bg-emerald-50'
                  : 'bg-white'
              } border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-bold tracking-tight text-gray-900">${tier.price}</span>
                    <span className="text-sm text-gray-500">/month</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTier(tier.name.toLowerCase())}
                  className={`h-6 w-6 rounded-full border flex items-center justify-center ${
                    selectedTier === tier.name.toLowerCase()
                      ? 'bg-emerald-600 border-emerald-600'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedTier === tier.name.toLowerCase() && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
              <ul className="mt-6 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md mx-auto">
          <div className="flex flex-col items-center space-y-3 mb-6">
            <img 
              src={clientConfig.logo}
              alt={`${clientConfig.title} Logo`}
              className="h-28 sm:h-32 w-auto object-contain"
            />
            <p className="text-emerald-700 text-center text-base sm:text-lg font-medium">
              Create Your Account
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
                placeholder="your@email.com"
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
                minLength={6}
                placeholder="••••••"
              />
              <p className="text-sm text-gray-500 mt-1">Must be at least 6 characters long</p>
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
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Start Free Trial
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/app" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}