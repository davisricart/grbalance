// PAGE MARKER: Register Page Component
import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../main';
import { UserPlus, AlertCircle, ArrowLeft, Home, CheckSquare, Check, Star, Building } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import clientConfig from '../config/client';
import { Helmet } from 'react-helmet';

const TIER_LIMITS = {
  starter: 50,
  professional: 75,
  business: 150
};

const SUBSCRIPTION_TIERS = [
  {
    name: 'Starter',
    monthlyPrice: 19,
    annualPrice: 15, // 21% off
    comparisons: TIER_LIMITS.starter,
    features: [
      '50 file comparisons per month',
      '1 custom-built reconciliation script',
      'Basic CSV & Excel file support',
      'Standard report downloads',
      'Email support',
      'Processing fee validation'
    ]
  },
  {
    name: 'Professional',
    monthlyPrice: 34,
    annualPrice: 27, // 21% off
    comparisons: TIER_LIMITS.professional,
    popular: true,
    features: [
      '75 file comparisons per month',
      '2 custom-built reconciliation scripts',
      'DaySmart & major processor file support',
      'Enhanced Excel report downloads',
      'Priority email support',
      'Processing fee validation',
      'Tailored matching rules for your business'
    ]
  },
  {
    name: 'Business',
    monthlyPrice: 59,
    annualPrice: 47, // 20% off
    comparisons: TIER_LIMITS.business,
    features: [
      '150 file comparisons per month',
      '3 custom-built reconciliation scripts',
      'Full DaySmart & all processor integrations',
      'Advanced reporting & analytics',
      'Priority email support',
      'Processing fee validation',
      'Tailored matching rules for your business',
      'Phone support',
      'Personal consultation and setup'
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
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [selectedTier, setSelectedTier] = useState('professional');
  const [isAnnual, setIsAnnual] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email: string;
    password: string;
    businessName: string;
    businessType: string;
    isHuman: string;
  }>({
    email: '',
    password: '',
    businessName: '',
    businessType: '',
    isHuman: ''
  });

  // Check URL parameters for pricing preferences
  useEffect(() => {
    const billingParam = searchParams.get('billing');
    const planParam = searchParams.get('plan');
    
    if (billingParam === 'annual') {
      setIsAnnual(true);
    }
    
    if (planParam && ['starter', 'professional', 'business'].includes(planParam.toLowerCase())) {
      setSelectedTier(planParam.toLowerCase());
    }
  }, [searchParams]);

  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
      businessName: '',
      businessType: '',
      isHuman: ''
    };

    // Email validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error || 'Invalid email address';
    }

    // Password validation
    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    // Business name validation
    if (!businessName.trim()) {
      errors.businessName = 'Business name is required';
    }

    // Business type validation
    if (!businessType.trim()) {
      errors.businessType = 'Please select your business type';
    }

    // Human verification
    if (!isHuman) {
      errors.isHuman = 'Please verify that you are human';
    }

    setFieldErrors(errors);
    
    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    
    if (hasErrors) {
      // Scroll to first error field
      const firstErrorField = Object.keys(errors).find(key => errors[key as keyof typeof errors] !== '') as keyof typeof errors;
      if (firstErrorField) {
        const element = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
    
    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Create pending approval record
      await setDoc(doc(db, 'pendingUsers', user.uid), {
        email: user.email,
        businessName: businessName.trim(),
        businessType: businessType.trim(),
        subscriptionTier: selectedTier,
        billingCycle: isAnnual ? 'annual' : 'monthly',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Create initial usage record with pending status
      await setDoc(doc(db, 'usage', user.uid), {
        email: user.email,
        comparisonsUsed: 0,
        comparisonsLimit: 0, // No access until approved
        subscriptionTier: selectedTier,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Redirect to pending approval page instead of main app
      navigate('/pending-approval');
    } catch (error: any) {
      console.error('Registration error:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered. If you recently deleted this account, please try a different email or contact support.');
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
      <Helmet>
        <title>Start Free Trial | Salon Reconciliation Software Signup | GR Balance</title>
        <meta name="description" content="Start your 14-day free trial of GR Balance salon reconciliation software. Sign up for automated DaySmart, Square, Stripe payment reconciliation. No setup fees until July 2025." />
        <meta name="keywords" content="salon software free trial, reconciliation software signup, DaySmart free trial, salon payment reconciliation trial, beauty salon software registration, free salon accounting trial" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Start Free Trial | Salon Reconciliation Software" />
        <meta property="og:description" content="14-day free trial of automated salon payment reconciliation. No setup fees until July 2025. Sign up risk-free." />
        <meta property="og:url" content="https://grbalance.netlify.app/register" />
        <meta property="og:image" content="https://grbalance.netlify.app/images/free-trial-signup.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Start Free Trial | Salon Reconciliation Software" />
        <meta name="twitter:description" content="14-day free trial of automated salon payment reconciliation. Sign up risk-free today." />
        <meta name="twitter:image" content="https://grbalance.netlify.app/images/trial-twitter.png" />
        
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://grbalance.netlify.app/register" />
        
        {/* Offer Schema */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Offer",
              "name": "GR Balance Free Trial",
              "description": "14-day free trial of salon reconciliation software with setup fee waived",
              "price": "0",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "validThrough": "2025-07-01",
              "seller": {
                "@type": "Organization",
                "name": "GR Balance"
              }
            }
          `}
        </script>
      </Helmet>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
            <Link 
              to="/"
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
            >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </Link>
          <Link 
            to="/login"
            className="text-sm text-gray-600 hover:text-emerald-600 transition-colors duration-200"
          >
            Already have an account? Sign in
            </Link>
        </div>
      </nav>

      <main className="flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 bg-emerald-50 border-b border-emerald-100">
            <div className="text-center">
              <img 
                src={clientConfig.logo}
                alt={`${clientConfig.title} Logo`}
                className="h-16 w-auto object-contain mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
              <p className="text-gray-600 mt-2">Join thousands of businesses streamlining their reconciliation process</p>
        </div>
          </div>

          {/* Form Content */}
          <div className="px-8 py-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 ${
                      fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="your@company.com"
                    required
                    data-field="email"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.email}
                    </p>
                  )}
        </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 ${
                      fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="At least 6 characters"
                    required
                    data-field="password"
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
              </div>

              {/* Business Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 ${
                      fieldErrors.businessName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Your Business Name"
                    required
                    data-field="businessName"
                  />
                  {fieldErrors.businessName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.businessName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 ${
                      fieldErrors.businessType ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                    data-field="businessType"
                  >
                    <option value="">Select business type</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="retail">Retail Store</option>
                    <option value="franchise">Franchise</option>
                    <option value="grocery">Grocery Store</option>
                    <option value="salon">Salon/Spa</option>
                    <option value="automotive">Automotive</option>
                    <option value="healthcare">Healthcare/Medical</option>
                    <option value="fitness">Fitness/Gym</option>
                    <option value="service">Service Business</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="hospitality">Hotel/Hospitality</option>
                    <option value="entertainment">Entertainment/Events</option>
                    <option value="professional">Professional Services</option>
                    <option value="nonprofit">Non-Profit</option>
                    <option value="other">Other</option>
                  </select>
                  {fieldErrors.businessType && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.businessType}
                    </p>
                  )}
                </div>
              </div>

              {/* Subscription Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Your Plan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SUBSCRIPTION_TIERS.map((tier) => (
                    <label key={tier.name.toLowerCase()} className="cursor-pointer">
                      <input
                        type="radio"
                        name="subscription"
                        value={tier.name.toLowerCase()}
                        checked={selectedTier === tier.name.toLowerCase()}
                        onChange={(e) => setSelectedTier(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedTier === tier.name.toLowerCase()
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                          {tier.popular && (
                            <span className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {isAnnual ? (
                            <>
                              ${tier.annualPrice}
                              <span className="text-sm font-normal text-gray-500">/month</span>
                              <div className="text-xs font-normal text-gray-500 mt-1">
                                Billed as ${(tier.annualPrice * 12).toFixed(0)}/year
                              </div>
                              <div className="text-sm font-medium text-emerald-600 mt-1">
                                Save ${((tier.monthlyPrice - tier.annualPrice) * 12).toFixed(0)}/year
                              </div>
                            </>
                          ) : (
                            <>
                              ${tier.monthlyPrice}
                              <span className="text-sm font-normal text-gray-500">/month</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {tier.comparisons} comparisons/month
                        </p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {tier.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <Check className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                              {feature}
                  </li>
                ))}
              </ul>
            </div>
                    </label>
          ))}
        </div>
          </div>
          
              {/* Billing Cycle */}
            <div>
                <label className="flex items-center gap-3 cursor-pointer">
              <input
                    type="checkbox"
                    checked={isAnnual}
                    onChange={(e) => setIsAnnual(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">
                    Bill annually (Save 20%)
                  </span>
                </label>
            </div>
            
              {/* Human Verification */}
            <div>
                <label className="flex items-center gap-3 cursor-pointer" data-field="isHuman">
              <input
                    type="checkbox"
                    checked={isHuman}
                    onChange={(e) => setIsHuman(e.target.checked)}
                    className={`w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 ${
                      fieldErrors.isHuman ? 'border-red-500' : ''
                    }`}
                  />
                  <span className="text-sm text-gray-700">
                    I'm not a robot
                  </span>
              </label>
                {fieldErrors.isHuman && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                    {fieldErrors.isHuman}
                  </p>
                )}
              </div>

              {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
            >
              {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
              )}
            </button>
          </form>
          </div>
        </div>
      </main>
    </div>
  );
}