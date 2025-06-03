// PAGE MARKER: Landing Page Component
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, CheckCircle, Shield, Zap, Calendar, DollarSign, Clock, MessageCircle } from 'lucide-react';
import ROICalculator from '../components/ROICalculator';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Helmet>
        <title>Salon Payment Reconciliation Software | DaySmart & Square Automation | GR Balance</title>
        <meta name="description" content="Automated salon payment reconciliation for DaySmart, Square, Stripe. Catch $8,400+ yearly in processing errors. Save 12+ hours monthly. 99.9% accuracy. 14-day free trial." />
        <meta name="keywords" content="salon reconciliation software, DaySmart reconciliation, Square payment reconciliation, salon payment processing, beauty salon software, payment discrepancy detection, salon accounting automation, salon fee reconciliation" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Salon Payment Reconciliation Software | Catch $8,400+ Yearly in Processing Errors" />
        <meta property="og:description" content="Automated reconciliation for DaySmart, Square, Stripe salon payments. Save 12+ hours monthly, catch hidden fees. 99.9% accuracy guaranteed." />
        <meta property="og:url" content="https://grbalance.netlify.app/" />
        <meta property="og:image" content="https://grbalance.netlify.app/images/salon-reconciliation-og.png" />
        <meta property="og:site_name" content="GR Balance" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Salon Payment Reconciliation Software | Catch $8,400+ Yearly" />
        <meta name="twitter:description" content="Automated reconciliation for DaySmart, Square, Stripe salon payments. Save 12+ hours monthly, catch hidden fees." />
        <meta name="twitter:image" content="https://grbalance.netlify.app/images/salon-reconciliation-twitter.png" />
        
        {/* Additional SEO tags */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="author" content="GR Balance" />
        <meta name="copyright" content="GR Balance 2025" />
        <link rel="canonical" href="https://grbalance.netlify.app/" />
        
        {/* Local Business Schema */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "GR Balance",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "description": "Automated payment reconciliation software for beauty salons using DaySmart, Square, and Stripe payment processors",
              "offers": {
                "@type": "Offer",
                "price": "19",
                "priceCurrency": "USD",
                "priceSpecification": {
                  "@type": "UnitPriceSpecification",
                  "price": "19.00",
                  "priceCurrency": "USD",
                  "unitText": "MONTH"
                }
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "47"
              },
              "publisher": {
                "@type": "Organization",
                "name": "GR Balance"
              }
            }
          `}
        </script>
      </Helmet>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Launch Special Banner */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-center text-white shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🚀</span>
              <h2 className="text-xl font-bold">Launch Special - Limited Time</h2>
            </div>
            <p className="text-lg font-medium mb-2">
              Setup fee waived + 14-day free trial for salon owners who sign up before July 1st, 2025
            </p>
            <p className="text-emerald-100 text-sm">
              Save $497 on custom script development • Risk-free trial • Offer expires July 1st
            </p>
          </div>
        </div>

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
              to="/interactive-demo"
              className="inline-flex items-center px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-lg font-medium"
            >
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              Try Interactive Demo
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center px-8 py-3 bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors duration-200 text-lg font-medium"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book Consultation
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

        {/* How It Works Section */}
        <div className="mt-12 max-w-2xl mx-auto text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">How It Works:</h3>
          <ul className="text-gray-700 text-base space-y-1">
            <li>✓ Try our system with realistic sample data (free)</li>
            <li>✓ See exactly how reconciliation works for salons</li>
            <li>✓ Ready to use your data? One-time $497 custom setup</li>
            <li>✓ Start catching real discrepancies immediately</li>
          </ul>
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