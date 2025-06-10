import React from 'react';

export default function BillingWireframe() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Billing & Subscription</h1>
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span>Current Plan:</span>
            <span className="font-semibold">Pro Plan - $40/mo</span>
          </div>
          <div className="flex justify-between">
            <span>Next Payment:</span>
            <span>July 1, 2025</span>
          </div>
        </div>
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">Card Details</label>
          <div className="h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
            [ Stripe Card Input Placeholder ]
          </div>
        </div>
        <button className="w-full py-3 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700 transition">Subscribe / Update Payment</button>
        {/* Optional: Invoice history table */}
        <div className="mt-8">
          <div className="text-sm text-gray-500 mb-2">Invoice History (sample)</div>
          <div className="bg-gray-50 rounded p-2 text-xs">
            <div className="flex justify-between mb-1">
              <span>2024-06-01</span><span>$40.00</span><span>Paid</span><span>[PDF]</span>
            </div>
            <div className="flex justify-between">
              <span>2024-05-01</span><span>$40.00</span><span>Paid</span><span>[PDF]</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 