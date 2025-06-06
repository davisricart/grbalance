import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Shield } from 'lucide-react';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Helmet>
        <title>Privacy Policy | Salon Data Protection & Security | GR Balance</title>
        <meta name="description" content="Privacy Policy for GR Balance salon reconciliation software. Learn how we protect your salon's financial data, payment information, and maintain GDPR compliance." />
        <meta name="keywords" content="privacy policy, data protection, salon data security, financial data privacy, GDPR compliance, payment data protection, salon information security" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://grbalance.netlify.app/privacy" />
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
            <Shield className="h-8 w-8 text-emerald-600" />
            Privacy Policy
          </h1>

          <div className="prose prose-emerald max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Data Collection</h2>
              <p className="text-gray-600">
                We collect minimal personal information necessary for account creation and service provision. This includes:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-2">
                <li>Email address</li>
                <li>Usage statistics</li>
                <li>Authentication data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Data Processing</h2>
              <p className="text-gray-600">
                All file comparisons and data reconciliation processes occur locally in your browser. Your uploaded files are never transmitted to or stored on our servers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Storage</h2>
              <p className="text-gray-600">
                We use Firebase Authentication and Firestore to store account information and usage statistics. We do not store any of your uploaded files or comparison results.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-600">
                We implement industry-standard security measures to protect your personal information. This includes:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-2">
                <li>Secure authentication</li>
                <li>Data encryption</li>
                <li>Regular security audits</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Third-Party Services</h2>
              <p className="text-gray-600">
                We use Firebase for authentication and analytics. Please review Google's privacy policy for information about how they handle your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-600">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-2">
                <li>Access your personal data</li>
                <li>Request data deletion</li>
                <li>Export your data</li>
                <li>Opt-out of communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Us</h2>
              <p className="text-gray-600">
                If you have any questions about our privacy practices, please contact our support team through the Contact page.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}