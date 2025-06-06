import React from 'react';
import { Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import clientConfig from '../config/client';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4">
          <Link 
            to="/"
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="flex items-center justify-center px-4 py-12">
        <div className="bg-white p-12 rounded-xl shadow-lg w-full max-w-md text-center">
          <div className="flex flex-col items-center space-y-6 mb-8">
            <img 
              src={clientConfig.logo}
              alt={`${clientConfig.title} Logo`}
              className="h-20 w-auto object-contain"
            />
            
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Registration Successful!
              </h1>
              <p className="text-gray-600">
                Your account has been created and is now pending approval.
              </p>
            </div>
          </div>
          
          <div className="space-y-6 text-left">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our team will review your registration and set up your custom reconciliation portal. 
                You'll receive an email notification once your account is approved.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Timeline</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Business day applications: Approved within 24 hours</p>
                <p>• Weekend applications: Approved by end of next business day</p>
                <p>• Custom script development: 2-3 business days</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Questions about your registration?{' '}
              <Link 
                to="/contact" 
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 