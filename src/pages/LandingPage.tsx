// PAGE MARKER: Landing Page Component
import React from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, CheckCircle, Shield, Zap, Calendar, DollarSign, Clock, MessageCircle } from 'lucide-react';
import ROICalculator from '../components/ROICalculator';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Custom Payment Reconciliation for Salons: Save $8,400+ Annually & Reclaim 12 Hours Every Month
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Stop payment discrepancies between your salon software and processors. Our custom-built solutions ensure you never overpay fees again.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/app"
              className="inline-flex items-center px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-lg font-medium"
            >
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              Start Free Trial
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center px-8 py-3 bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors duration-200 text-lg font-medium"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Schedule Demo
            </Link>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <Clock className="h-12 w-12 text-emerald-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Save 12+ Hours Monthly</h3>
            <p className="text-gray-600">
              Reduce manual reconciliation work by 85% with our custom-built matching logic designed specifically for your salon. Process thousands of transactions in minutes.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <DollarSign className="h-12 w-12 text-emerald-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Catch $8,400+ Yearly</h3>
            <p className="text-gray-600">
              Our clients identify an average of $700 monthly in processing fee discrepancies and accounting errors.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <Shield className="h-12 w-12 text-emerald-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">99.9% Accuracy</h3>
            <p className="text-gray-600">
              Reduce reconciliation errors by 99.9% with our custom matching logic built for your specific data formats and automated verification.
            </p>
          </div>
        </div>

        {/* ROI Calculator Section (replaces old demo/CTA) */}
        <ROICalculator />

        {/* Contact Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Have Questions? We're Here to Help
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Our team is ready to answer any questions you have about our custom reconciliation solutions for salons and how they can benefit your business. We'd love to hear from you!
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-8 py-3 bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors duration-200 text-lg font-medium"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Contact Us
          </Link>
        </div>
      </main>
    </div>
  );
}