// Stripe Test Page - For testing Stripe integration
import React, { useState } from 'react';
import { stripeConfig, getPlanConfig, formatPrice } from '../config/stripe';
import { createCheckoutSession } from '../services/stripeService';

export default function StripeTestPage() {
  const [selectedTier, setSelectedTier] = useState<'starter' | 'professional' | 'business'>('professional');
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testStripeConfig = () => {
    addTestResult('Testing Stripe configuration...');
    addTestResult('✅ Stripe test page loaded successfully');
  };

  const testCheckoutSession = async () => {
    setIsLoading(true);
    addTestResult('Testing checkout session creation...');
    
    try {
      const session = await createCheckoutSession({
        userId: 'test-user-123',
        email: 'test@example.com',
        tier: selectedTier,
        cycle: selectedCycle,
        businessName: 'Test Salon',
        successUrl: `${window.location.origin}/billing/success`,
        cancelUrl: `${window.location.origin}/billing/cancelled`,
      });
      
      addTestResult(`✅ Checkout session created: ${session.id}`);
      addTestResult(`Session URL: ${session.url}`);
    } catch (error) {
      addTestResult(`❌ Checkout error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Stripe Integration Test Page
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Test Controls */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
              
              {/* Plan Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Tier
                </label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="business">Business</option>
                </select>
              </div>

              {/* Billing Cycle */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Cycle
                </label>
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              {/* Test Buttons */}
              <div className="space-y-3">
                <button
                  onClick={testStripeConfig}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Test Configuration
                </button>
                
                <button
                  onClick={testCheckoutSession}
                  disabled={isLoading}
                  className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creating Session...' : 'Test Checkout Session'}
                </button>
                
                <button
                  onClick={clearResults}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  Clear Results
                </button>
              </div>

              {/* Environment Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Environment Info</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Mode: {stripeConfig.isTestMode ? 'Test' : 'Live'}</div>
                  <div>Publishable Key: {stripeConfig.publishableKey.substring(0, 20)}...</div>
                  <div>Setup Fee Waived: {stripeConfig.setupFee.isWaived ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              <div className="bg-gray-900 text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
                {testResults.length === 0 ? (
                  <div className="text-gray-500">No tests run yet...</div>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index} className="mb-1">
                      {result}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Test Cards Info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-medium text-blue-900 mb-2">Stripe Test Cards</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>Success:</strong> 4242 4242 4242 4242</div>
              <div><strong>Declined:</strong> 4000 0000 0000 0002</div>
              <div><strong>3D Secure:</strong> 4000 0025 0000 3155</div>
              <div><strong>Expiry:</strong> Any future date (e.g., 12/25)</div>
              <div><strong>CVC:</strong> Any 3 digits (e.g., 123)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 