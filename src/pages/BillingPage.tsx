// Billing Page - Integrates with Consultation Workflow
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../config/supabase';
import { getUserUsage, UsageData } from '../services/usageService';
import { calculateTrialFromCreatedAt } from '../services/trialService';
import StripePaymentForm from '../components/StripePaymentForm';
import { stripeConfig, formatPrice } from '../config/stripe';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { 
  CreditCard, 
  Download, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  Clock,
  Zap,
  Star,
  Users,
  ArrowRight,
  Calendar
} from 'lucide-react';

interface PlanDetails {
  name: string;
  price: number;
  annualPrice: number;
  comparisons: number;
  features: string[];
  popular?: boolean;
}

const stripePromise = loadStripe(stripeConfig.publishableKey);

const PLANS: Record<string, PlanDetails> = {
  starter: {
    name: 'Starter',
    price: 19,
    annualPrice: 15,
    comparisons: 50,
    features: [
      '50 comparisons per month',
      'Email support',
      'Basic analytics',
      'CSV export',
      'Standard reconciliation'
    ]
  },
  professional: {
    name: 'Professional',
    price: 34,
    annualPrice: 27,
    comparisons: 75,
    features: [
      '75 comparisons per month',
      'Priority support',
      'Advanced analytics',
      'API access',
      'Custom integrations',
      'Priority processing'
    ],
    popular: true
  },
  business: {
    name: 'Business',
    price: 59,
    annualPrice: 47,
    comparisons: 150,
    features: [
      '150 comparisons per month',
      '24/7 dedicated support',
      'Enterprise analytics',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options'
    ]
  }
};

export default function BillingPage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Get usage data
        const usageData = await getUserUsage(user.id);
        setUsage(usageData);

        // Debug billing data
        console.log('🔍 BillingPage: User data:', {
          userId: user.id,
          userCreatedAt: user.created_at,
          usageStatus: usageData?.status,
          subscriptionTier: usageData?.subscriptionTier
        });

        // Calculate trial days left using shared service
        if (usageData?.status === 'trial') {
          const trialInfo = calculateTrialFromCreatedAt(user.created_at, true);
          setTrialDaysLeft(trialInfo.daysLeft);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching billing data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleUpgrade = async (planTier: string) => {
    if (!user || !usage) return;

    console.log('🚀 Starting upgrade process for plan:', planTier);
    setSelectedPlan(planTier);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = async (subscriptionId: string) => {
    console.log('✅ Payment successful, subscription ID:', subscriptionId);
    // Refresh usage data to show updated subscription status
    if (user) {
      const updatedUsage = await getUserUsage(user.id);
      setUsage(updatedUsage);
    }
    setShowPaymentForm(false);
    // Optionally redirect to success page or show success message
  };

  const handlePaymentCancel = () => {
    console.log('❌ Payment cancelled');
    setShowPaymentForm(false);
  };

  const getCurrentPlan = () => {
    if (!usage) return null;
    return PLANS[usage.subscriptionTier] || PLANS.starter;
  };

  const currentPlan = getCurrentPlan();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>Billing & Subscription | GR Balance</title>
          <meta name="description" content="Manage your GR Balance subscription, view usage, and upgrade your plan." />
        </Helmet>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and payment methods</p>
        </div>

        {/* Trial Banner */}
        {usage?.status === 'trial' && trialDaysLeft !== null && (
          <div className="mb-8 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                  {trialDaysLeft === 0 ? 'Trial Expired' : `${trialDaysLeft} Days Left in Trial`}
                </h3>
                <p className="text-emerald-700 mb-4">
                  {trialDaysLeft === 0 
                    ? 'Your trial has ended. Upgrade to continue using GR Balance.'
                    : `You're currently on a 14-day free trial. Upgrade anytime to continue using all features.`
                  }
                </p>
                {trialDaysLeft === 0 && (
                  <button
                    onClick={() => handleUpgrade('professional')}
                    disabled={upgrading}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {upgrading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Upgrade Now
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Plan & Usage */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
                  <p className="text-emerald-600 font-medium mt-1">
                    {currentPlan?.name} Plan
                    {usage?.status === 'trial' ? ' (Trial)' : ''}
                  </p>
                </div>
                {usage?.status === 'trial' && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Trial
                  </span>
                )}
              </div>

              {/* Usage Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Comparisons Used</div>
                  <div className="text-2xl font-semibold">
                    {usage?.comparisonsUsed || 0}/{usage?.comparisonsLimit || currentPlan?.comparisons || 50}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Resets monthly</div>
                  {/* Usage Progress Bar */}
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        usage && (usage.comparisonsUsed / usage.comparisonsLimit) > 0.9 ? 'bg-red-500' : 
                        usage && (usage.comparisonsUsed / usage.comparisonsLimit) > 0.75 ? 'bg-yellow-500' : 
                        'bg-emerald-500'
                      }`}
                      style={{ 
                        width: `${usage ? Math.min((usage.comparisonsUsed / usage.comparisonsLimit) * 100, 100) : 0}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Plan Price</div>
                  <div className="text-2xl font-semibold">
                    {usage?.status === 'trial' ? 'Free' : `$${currentPlan?.price}/mo`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {usage?.status === 'trial' ? 'During trial period' : 'Billed monthly'}
                  </div>
                </div>
              </div>

              {/* Plan Features */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Your Plan Includes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentPlan?.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Plan Change Options - Available to all users */}
            {usage && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {usage.subscriptionTier === 'business' ? 'Your Plan Options' : 'Change Your Plan'}
                </h2>
                
                {/* Annual/Monthly Toggle */}
                <div className="flex justify-center mb-6">
                  <div className="relative flex items-center bg-gray-50 rounded-xl p-1.5 shadow-md border border-gray-200">
                    <button
                      onClick={() => setIsAnnual(false)}
                      className={`px-7 py-3 text-base font-semibold rounded-lg transition-all ${
                        !isAnnual
                          ? 'bg-white text-gray-900 shadow-lg border border-gray-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setIsAnnual(true)}
                      className={`px-7 py-3 text-base font-semibold rounded-lg transition-all ${
                        isAnnual
                          ? 'bg-white text-gray-900 shadow-lg border border-gray-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      Annual
                      <span className="ml-2 px-2 py-0.5 text-xs text-white bg-emerald-600 rounded-full font-bold">Best Value</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(PLANS).map(([key, plan]) => (
                    <div 
                      key={key}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        selectedPlan === key 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPlan(key)}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <span className="bg-emerald-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                            Most Popular
                          </span>
                        </div>
                      )}
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        <div className="text-2xl font-bold text-emerald-600 mt-2">
                          ${isAnnual ? plan.annualPrice : plan.price}
                          <span className="text-sm font-normal text-gray-500">/mo</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {plan.comparisons} comparisons
                        </div>
                        {isAnnual && (
                          <div className="text-xs text-emerald-600 font-medium mt-1">
                            Save ${((plan.price - plan.annualPrice) * 12).toFixed(0)}/year
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Show change plan button for trial users or if different plan selected or not business */}
                {(usage.status === 'trial' || usage.subscriptionTier !== 'business' || selectedPlan !== usage.subscriptionTier) && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => handleUpgrade(selectedPlan)}
                      disabled={upgrading || (selectedPlan === usage.subscriptionTier && usage.status !== 'trial')}
                      className={`px-8 py-3 rounded-lg disabled:opacity-50 flex items-center gap-2 mx-auto ${
                        (selectedPlan === usage.subscriptionTier && usage.status !== 'trial')
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {upgrading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Processing...
                        </>
                      ) : (selectedPlan === usage.subscriptionTier && usage.status !== 'trial') ? (
                        <>Current Plan</>
                      ) : (
                        <>
                          {usage.status === 'trial' && selectedPlan === usage.subscriptionTier ? 'Start Paid Plan' : 
                           selectedPlan > usage.subscriptionTier || usage.status === 'trial' ? 'Upgrade' : 'Change'} 
                          {usage.status === 'trial' && selectedPlan === usage.subscriptionTier ? '' : ` to ${PLANS[selectedPlan]?.name || 'Selected Plan'}`}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    
                    {usage.subscriptionTier === 'business' && selectedPlan !== 'business' && (
                      <p className="text-xs text-amber-600 mt-2">
                        Note: Changing from Business plan may result in feature limitations
                      </p>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-6 text-center">
                  Secure payment processing by Stripe
                </p>
              </div>
            )}

            {/* Payment Form */}
            {showPaymentForm && user && (
              <StripePaymentForm
                planTier={selectedPlan}
                planPrice={isAnnual ? PLANS[selectedPlan]?.annualPrice || 0 : PLANS[selectedPlan]?.price || 0}
                planName={PLANS[selectedPlan]?.name || ''}
                isAnnual={isAnnual}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                userEmail={user.email || ''}
                userId={user.id}
                businessName={user.user_metadata?.business_name}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Need Help */}
            <div className="bg-emerald-50 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-emerald-900">Need Help?</h3>
                  <p className="text-emerald-700 text-sm mt-1">
                    Contact our support team for any billing questions or issues.
                  </p>
                  <a 
                    href="/contact" 
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-2 inline-block"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Secure Payments</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    All payments are processed securely by Stripe. We never store your payment information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Elements>
  );
} 