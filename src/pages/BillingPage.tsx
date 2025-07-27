// Billing Page - Integrates with Consultation Workflow
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../config/supabase';
import { getUserUsage, UsageData } from '../services/usageService';
import { createCheckoutSession, redirectToCheckout } from '../services/stripeService';
import { stripeConfig, formatPrice } from '../config/stripe';
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
  comparisons: number;
  features: string[];
  popular?: boolean;
}

const PLANS: Record<string, PlanDetails> = {
  starter: {
    name: 'Starter',
    price: 19,
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

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Get usage data
        const usageData = await getUserUsage(user.id);
        setUsage(usageData);

        // Calculate trial days left
        if (usageData?.status === 'trial') {
          const trialStart = new Date(user.created_at);
          const trialEnd = new Date(trialStart.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days
          const now = new Date();
          const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          setTrialDaysLeft(Math.max(0, daysLeft));
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

    setUpgrading(true);
    try {
      const session = await createCheckoutSession({
        userId: user.id,
        email: user.email!,
        tier: planTier as 'starter' | 'professional' | 'business',
        cycle: 'monthly',
        businessName: user.user_metadata?.business_name,
        successUrl: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/billing`
      });

      await redirectToCheckout(session.id);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setUpgrading(false);
    }
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
                    {usage?.comparisonsUsed || 0}/{currentPlan?.comparisons || 50}
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

            {/* Upgrade Options */}
            {usage?.status === 'trial' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Upgrade Your Plan</h2>
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
                          ${plan.price}
                          <span className="text-sm font-normal text-gray-500">/mo</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {plan.comparisons} comparisons
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <button
                    onClick={() => handleUpgrade(selectedPlan)}
                    disabled={upgrading}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {upgrading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Upgrade to {PLANS[selectedPlan].name}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Secure payment processing by Stripe
                  </p>
                </div>
              </div>
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
  );
} 