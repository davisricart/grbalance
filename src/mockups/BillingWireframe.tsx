import React, { useState } from 'react';
import { CreditCard, Download, ChevronRight, CheckCircle2, AlertCircle, Shield, X } from 'lucide-react';

// Define plan types and their features
type PlanTier = 'starter' | 'pro' | 'business';

interface PlanFeatures {
  comparisons: number;
  support: string;
  analytics: string;
  api: boolean;
  price: number;
  features: string[];
}

const PLAN_DETAILS: Record<PlanTier, PlanFeatures> = {
  starter: {
    comparisons: 50,
    support: 'Email support',
    analytics: 'Basic analytics',
    api: false,
    price: 20,
    features: [
      '50 comparisons per month',
      'Email support',
      'Basic analytics',
      'CSV export'
    ]
  },
  pro: {
    comparisons: 100,
    support: 'Priority support',
    analytics: 'Advanced analytics',
    api: true,
    price: 40,
    features: [
      '100 comparisons per month',
      'Priority support',
      'Advanced analytics',
      'API access',
      'Custom integrations'
    ]
  },
  business: {
    comparisons: 250,
    support: '24/7 dedicated support',
    analytics: 'Enterprise analytics',
    api: true,
    price: 80,
    features: [
      '250 comparisons per month',
      '24/7 dedicated support',
      'Enterprise analytics',
      'API access',
      'Custom integrations',
      'Dedicated account manager'
    ]
  }
};

export default function BillingWireframe() {
  // In a real app, this would come from your auth/plan state
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('pro');
  const [usage, setUsage] = useState(45); // This would come from your backend
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [show3DSecure, setShow3DSecure] = useState(false);
  
  const planDetails = PLAN_DETAILS[currentPlan];
  const usagePercentage = (usage / planDetails.comparisons) * 100;

  const handleUpdatePayment = () => {
    setShowPaymentModal(true);
  };

  const handlePayment = () => {
    // In real implementation, this would trigger Stripe's payment flow
    // If 3D Secure is required, Stripe would show their modal
    setShow3DSecure(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and payment methods</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                  <p className="text-emerald-600 font-medium mt-1">
                    {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan - ${planDetails.price}/mo
                  </p>
                </div>
                <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1">
                  View Plans <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              {/* Usage Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Comparisons Used</div>
                  <div className="text-2xl font-semibold">{usage}/{planDetails.comparisons}</div>
                  <div className="text-xs text-gray-500 mt-1">Resets on July 1, 2024</div>
                  {/* Usage Progress Bar */}
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        usagePercentage > 90 ? 'bg-red-500' : 
                        usagePercentage > 75 ? 'bg-yellow-500' : 
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Next Payment</div>
                  <div className="text-2xl font-semibold">${planDetails.price}.00</div>
                  <div className="text-xs text-gray-500 mt-1">Due July 1, 2024</div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Payment Method</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">•••• 4242</div>
                      <div className="text-sm text-gray-500">Expires 12/2024</div>
                    </div>
                  </div>
                  <button 
                    onClick={handleUpdatePayment}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    Update
                  </button>
                </div>
                {/* Simple Security Notice */}
                <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
                  <Shield className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p>
                    Secure payment processing powered by Stripe
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice History */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Invoice History</h2>
              </div>
              <div className="divide-y">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="p-6 flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan - Monthly
                      </div>
                      <div className="text-sm text-gray-500">June {i + 1}, 2024</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium">${planDetails.price}.00</div>
                        <div className="text-sm text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Paid
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plan Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Plan Includes</h3>
              <ul className="space-y-3">
                {planDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Need Help */}
            <div className="bg-emerald-50 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-emerald-900">Need Help?</h3>
                  <p className="text-emerald-700 text-sm mt-1">
                    Contact our {planDetails.support.toLowerCase()} team for any billing questions or issues.
                  </p>
                  <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-2">
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Payment Method</h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Enter your card details below. Your payment will be processed securely.
              </p>
              
              {/* In real implementation, this would be Stripe's card input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handlePayment}
              className="w-full py-2 px-4 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700"
            >
              Save Payment Method
            </button>
          </div>
        </div>
      )}

      {/* Stripe's 3D Secure Modal (This would be handled by Stripe) */}
      {show3DSecure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full overflow-hidden">
            {/* Stripe-style header */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Verify your payment</h3>
                    <p className="text-xs text-gray-500">Stripe • Secure Payment</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShow3DSecure(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Verification content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm text-gray-600">
                  We've sent a verification code to your phone ending in 4242
                </p>
              </div>

              {/* Code input */}
              <div className="mb-6">
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5, 6].map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      className="w-10 h-12 text-center text-xl font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button className="w-full py-2.5 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 transition-colors">
                  Verify Payment
                </button>
                <button className="w-full py-2.5 text-sm text-gray-600 hover:text-gray-900">
                  Didn't receive the code?
                </button>
              </div>
            </div>

            {/* Security notice */}
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield className="h-3 w-3" />
                <span>This payment is secured by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 