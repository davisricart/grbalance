import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export default function BillingCancelledPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Payment Cancelled | GR Balance</title>
        <meta name="description" content="Your payment was cancelled. You can try again anytime." />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Your payment was cancelled. No charges were made to your account. You can try upgrading again anytime.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">What Happened?</h3>
            </div>
            <ul className="text-left space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-gray-400" />
                Your payment was not completed
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-gray-400" />
                No charges were made to your account
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-gray-400" />
                Your trial status remains unchanged
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-gray-400" />
                You can try upgrading again anytime
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <Link
              to="/billing"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
            >
              Try Again
              <ArrowLeft className="h-4 w-4" />
            </Link>
            
            <div className="pt-4">
              <Link
                to="/app"
                className="text-emerald-600 hover:text-emerald-700 text-sm"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 