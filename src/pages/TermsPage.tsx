import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, FileText } from 'lucide-react';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Helmet>
        <title>Terms of Service | Salon Reconciliation Software Legal Terms | GR Balance</title>
        <meta name="description" content="Terms of Service for GR Balance salon reconciliation software. Legal terms, user agreements, and service conditions for beauty salon payment processing software." />
        <meta name="keywords" content="terms of service, legal terms, user agreement, salon software terms, payment processing terms, service conditions, user rights, data usage" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://grbalance.netlify.app/terms" />
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <FileText className="h-8 w-8 text-emerald-600" />
            Terms of Service
          </h1>

          <div className="prose prose-emerald max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By accessing and using GR Balance's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-600">
                GR Balance provides a data reconciliation service that allows users to compare and analyze data from different sources. Our service includes file comparison, data matching, and reporting features.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-600">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Usage Limitations</h2>
              <p className="text-gray-600">
                Basic and Premium plans have different usage limits. Exceeding these limits may result in temporary service restrictions until the next billing cycle.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Privacy</h2>
              <p className="text-gray-600">
                We process all data locally in your browser. We do not store or transmit your uploaded files to our servers. For more information, please review our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Modifications to Service</h2>
              <p className="text-gray-600">
                We reserve the right to modify or discontinue our service at any time. We will provide reasonable notice of any significant changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Termination</h2>
              <p className="text-gray-600">
                We may terminate or suspend your account for violations of these terms. You may terminate your account at any time by contacting our support team.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}