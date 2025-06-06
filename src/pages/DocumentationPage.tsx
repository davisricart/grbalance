import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Shield, ArrowLeft, Home } from 'lucide-react';

export default function DocumentationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Documentation</h1>

          <div className="space-y-12">
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>Schedule your consultation call</li>
                <li>We analyze your salon software and payment processor formats</li>
                <li>We build your custom reconciliation script</li>
                <li>Start uploading files and getting results</li>
              </ol>
            </section>

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">File Requirements</h2>
              <p className="mb-2 text-gray-700">During our consultation, we'll review your specific file formats. We work with:</p>
              <ul className="list-disc list-inside text-gray-700 mb-2">
                <li>Excel files (.xlsx, .xls)</li>
                <li>CSV files (.csv)</li>
                <li>Files with clear column headers and consistent data formats</li>
              </ul>
              <p className="text-gray-600 italic">Don't worry if your files don't meet these requirements perfectly - we'll build your custom script to handle your specific data format.</p>
            </section>

            <section className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Custom Script Development</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>We analyze your unique data structure during setup</li>
                <li>Each script is built specifically for your salon software and payment processors</li>
                <li>No technical knowledge required on your end</li>
                <li>Free script updates if your data format changes</li>
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Security</h2>
              <p className="mb-2 text-gray-700">Your data is secure throughout our process:</p>
              <ul className="list-disc list-inside text-gray-700 mb-2">
                <li>Initial consultation data is handled confidentially</li>
                <li>File processing happens securely in your browser</li>
                <li>No permanent storage of your business data</li>
                <li>Secure authentication and regular security audits</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}