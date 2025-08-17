// PAGE MARKER: Landing Page Component
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileSpreadsheet, CheckCircle, Shield, Zap, Calendar, DollarSign, Clock, MessageCircle, Mail, Users, Play, ArrowRight, Target, TrendingUp } from 'lucide-react';

import ROICalculator from '../components/ROICalculator';
import WhoIsThisFor from '../components/WhoIsThisFor';

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
        <meta property="og:url" content="https://grbalance.com/" />
        <meta property="og:image" content="https://grbalance.com/images/salon-reconciliation-og.png" />
        <meta property="og:site_name" content="GR Balance" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Salon Payment Reconciliation Software | Catch $8,400+ Yearly" />
        <meta name="twitter:description" content="Automated reconciliation for DaySmart, Square, Stripe salon payments. Save 12+ hours monthly, catch hidden fees." />
        <meta name="twitter:image" content="https://grbalance.com/images/salon-reconciliation-twitter.png" />
        
        {/* Additional SEO tags */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="author" content="GR Balance" />
        <meta name="copyright" content="GR Balance 2025" />
        <link rel="canonical" href="https://grbalance.com/" />
        
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
        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-4 sm:p-6 text-center text-white shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl sm:text-2xl">🚀</span>
              <h2 className="text-lg sm:text-xl font-bold">Launch Special - Limited Time</h2>
            </div>
            <p className="text-base sm:text-lg font-medium mb-2">
              Setup fee waived + 14-day free trial • No credit card required
            </p>
            <p className="text-emerald-100 text-xs sm:text-sm">
              Save $497 on custom script development • Just email signup • Offer expires September 1st, 2025
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight px-4">
            Custom Reconciliation Solutions Built for Your Business—Done For You
            <br className="hidden sm:block mb-2" />
            <span className="block mt-2 sm:mt-4 text-xl sm:text-2xl lg:text-3xl xl:text-4xl">Stop forcing your data into generic software. Get reconciliation that works exactly how your business works—no technical skills required.</span>
          </h1>
          <div className="mb-8 sm:mb-12 max-w-2xl mx-auto text-center px-4">
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
              Book a Strategy Call and let us build a custom solution for your business. We handle everything—consultation, development, and ongoing support. You just upload your files and get results.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/book"
                className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-colors duration-200 text-lg sm:text-xl"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book a Strategy Call
              </Link>
              
              <Link
                to="/contact"
                className="inline-flex items-center bg-white text-emerald-600 border-2 border-emerald-600 hover:bg-emerald-50 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-base sm:text-lg"
              >
                <Mail className="mr-2 h-5 w-5" />
                Contact Us
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Prefer to describe your needs in writing? Use the contact button to send us a message.
            </p>
          </div>
          {/* Insert WhoIsThisFor section here for maximum visibility */}
          <WhoIsThisFor />
          {/* Main CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              to="/register"
              className="inline-flex items-center justify-center min-w-[280px] min-h-[50px] px-6 sm:px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-base sm:text-lg font-semibold touch-manipulation shadow-lg"
            >
              <Zap className="mr-2 h-5 w-5 flex-shrink-0" />
              Start Free Trial (No Card)
            </Link>
            <Link
              to="/interactive-demo"
              className="inline-flex items-center justify-center min-w-[280px] min-h-[50px] px-6 sm:px-8 py-3 bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors duration-200 text-base sm:text-lg font-medium touch-manipulation"
            >
              <FileSpreadsheet className="mr-2 h-5 w-5 flex-shrink-0" />
              Try Interactive Demo
            </Link>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Simple process: Email signup → Custom consultation → Start 14-day trial
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <Link
                to="/book"
                className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Calendar className="mr-1 h-4 w-4" />
                Or book consultation first
              </Link>
              <span className="hidden sm:inline text-gray-400">•</span>
              <Link
                to="/login"
                className="inline-flex items-center text-gray-600 hover:text-emerald-600 font-medium"
              >
                Already have an account? Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Process Visualization Section */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
            How It Works: Custom Solution, Done For You
          </h2>
          <p className="text-lg text-gray-600 mb-8 sm:mb-12">
            We handle everything—from understanding your business to building and maintaining your custom reconciliation solution. You just upload files and get results.
          </p>
          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Book a Strategy Call</h3>
                  <p className="text-gray-600 text-sm">
                    We learn your business in a 30-minute consultation—no technical prep required.
                  </p>
                </div>
              </div>
              <div className="hidden md:block absolute top-8 -right-6 text-emerald-300">
                <ArrowRight className="h-6 w-6" />
              </div>
            </div>
            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2. We Build Your Solution</h3>
                  <p className="text-gray-600 text-sm">
                    Our team develops a custom reconciliation script tailored to your exact needs.
                  </p>
                </div>
              </div>
              <div className="hidden md:block absolute top-8 -right-6 text-emerald-300">
                <ArrowRight className="h-6 w-6" />
              </div>
            </div>
            {/* Step 3 */}
            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Play className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3. You Upload Files</h3>
                  <p className="text-gray-600 text-sm">
                    Just upload your files—no technical work required. Get instant, accurate results.
                  </p>
                </div>
              </div>
              <div className="hidden md:block absolute top-8 -right-6 text-emerald-300">
                <ArrowRight className="h-6 w-6" />
              </div>
            </div>
            {/* Step 4 */}
            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Ongoing Optimization</h3>
                  <p className="text-gray-600 text-sm">
                    We keep improving your solution as your business evolves—support included.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-8 sm:mt-12 bg-gray-50 rounded-lg p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold text-emerald-600">Day 1:</span> Sign up and consultation
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold text-emerald-600">Day 2:</span> Custom script ready for testing
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-emerald-600">Day 3-16:</span> 14-day trial period to catch real discrepancies
            </p>
          </div>
        </div>

        {/* Product Demonstration Section */}
        <div className="mt-16 sm:mt-20 lg:mt-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                See Salon Reconciliation in Action
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Watch how we automatically match your DaySmart transactions with 3rd party payment processors
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 max-w-3xl mx-auto">
                <p className="text-sm text-gray-700">
                  <strong>The Challenge:</strong> Many salons use external merchant services (separate from DaySmart's integrated processing) 
                  for better rates or fee-passing to independent contractors. This creates a reconciliation nightmare when transaction 
                  data doesn't automatically sync between your salon software and payment processor.
                </p>
              </div>
            </div>

            {/* Before/After Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
              
              {/* BEFORE - Manual Process */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Manual Process</h3>
                  <p className="text-gray-500 text-sm font-medium">3+ hours every week</p>
                </div>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-gray-300 pl-4 py-2">
                    <p className="font-semibold text-gray-900 mb-1">1. Export DaySmart Data</p>
                    <p className="text-gray-600 text-sm">Download transaction reports, clean up formatting</p>
                  </div>
                  <div className="border-l-4 border-gray-300 pl-4 py-2">
                    <p className="font-semibold text-gray-900 mb-1">2. Export Payment Processor Data</p>
                    <p className="text-gray-600 text-sm">Download reports from your 3rd party merchant services</p>
                  </div>
                  <div className="border-l-4 border-gray-300 pl-4 py-2">
                    <p className="font-semibold text-gray-900 mb-1">3. Manual Matching</p>
                    <p className="text-gray-600 text-sm">Cross-reference transactions, find discrepancies by hand</p>
                  </div>
                  <div className="border-l-4 border-gray-300 pl-4 py-2">
                    <p className="font-semibold text-gray-900 mb-1">4. Create Reports</p>
                    <p className="text-gray-600 text-sm">Build spreadsheets, calculate differences, investigate issues</p>
                  </div>
                </div>

                <div className="mt-6 text-center py-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 font-medium">Result: 3-4 hours of work, errors missed</p>
                </div>
              </div>

              {/* AFTER - Automated Process */}
              <div className="bg-white border-2 border-emerald-200 rounded-xl p-8 shadow-sm">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">GR Balance Automation</h3>
                  <p className="text-emerald-600 text-sm font-medium">5 minutes every week</p>
                </div>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-emerald-500 pl-4 py-2">
                    <p className="font-semibold text-gray-900 mb-1">1. Upload Files</p>
                    <p className="text-gray-600 text-sm">Drag & drop your DaySmart and payment processor exports</p>
                  </div>
                  <div className="border-l-4 border-emerald-500 pl-4 py-2">
                    <p className="font-semibold text-gray-900 mb-1">2. Automatic Processing</p>
                    <p className="text-gray-600 text-sm">AI matches transactions using salon-specific logic</p>
                  </div>
                  <div className="border-l-4 border-emerald-500 pl-4 py-2">
                    <p className="font-semibold text-gray-900 mb-1">3. Instant Results</p>
                    <p className="text-gray-600 text-sm">Discrepancies highlighted, ready-to-use reports generated</p>
                  </div>
                  <div className="border-l-4 border-emerald-500 pl-4 py-2">
                    <p className="font-semibold text-gray-900 mb-1">4. Download & Review</p>
                    <p className="text-gray-600 text-sm">Export detailed reconciliation reports for your records</p>
                  </div>
                </div>

                <div className="mt-6 text-center py-3 bg-emerald-50 rounded-lg">
                  <p className="text-emerald-700 font-medium">Result: 5 minutes of work, 99.9% accuracy</p>
                </div>
              </div>
            </div>

            {/* Sample Results */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Typical Monthly Findings for Salons
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="font-bold text-3xl text-gray-900 mb-2">$300-900</p>
                  <p className="text-gray-600 font-medium">Transaction mismatches identified</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="font-bold text-3xl text-gray-900 mb-2">15-30</p>
                  <p className="text-gray-600 font-medium">Missing transactions identified</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="font-bold text-3xl text-gray-900 mb-2">12+ hrs</p>
                  <p className="text-gray-600 font-medium">Time saved monthly</p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-8">
              <Link
                to="/interactive-demo"
                className="inline-flex items-center justify-center px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-lg font-medium shadow-lg"
              >
                <FileSpreadsheet className="mr-2 h-5 w-5" />
                Try Interactive Demo with Sample Salon Data
              </Link>
              <p className="text-sm text-gray-600 mt-2">
                See exactly how it works with realistic salon transaction data
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-16 sm:mt-20 lg:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 px-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-600 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Save 12+ Hours Monthly</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Reduce manual reconciliation work by 85% with our custom-built matching logic designed specifically for your salon. Process thousands of transactions in minutes.
            </p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-600 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Catch $8,400+ Yearly</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Our clients identify an average of $700 monthly in processing fee discrepancies and accounting errors.
            </p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-600 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">99.9% Accuracy</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Reduce reconciliation errors by 99.9% with our custom matching logic built for your specific data formats and automated verification.
            </p>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mt-12 max-w-4xl mx-auto text-center px-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">What Our Clients Say</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-lg text-gray-700 italic mb-4">“I used to spend hours every week in Excel. Now I just upload my files and get my reports in minutes—no tech skills needed.”</p>
              <div className="text-emerald-700 font-semibold">Sarah, Salon Owner</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-lg text-gray-700 italic mb-4">“He understood our business immediately and built exactly what we needed. Zero learning curve, perfect accuracy.”</p>
              <div className="text-emerald-700 font-semibold">Mike, Franchise Manager</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-lg text-gray-700 italic mb-4">“Works with our exact files—no reformatting required. I finally have peace of mind about our books.”</p>
              <div className="text-emerald-700 font-semibold">Lisa, Bookkeeper</div>
            </div>
          </div>
        </div>

        {/* Authority Section */}
        <div className="mt-10 max-w-4xl mx-auto text-center px-4">
          <h4 className="text-xl font-semibold text-emerald-700 mb-2">Trusted by Businesses Like Yours</h4>
          <p className="text-gray-700 text-base mb-1">Over 50 businesses helped—from single-location salons to multi-site franchises.</p>
          <p className="text-gray-700 text-base mb-1">100+ reconciliation challenges solved, from simple matching to complex multi-source workflows.</p>
          <p className="text-gray-700 text-base">Personal attention to every solution—direct access to your reconciliation specialist.</p>
        </div>

        {/* How It Works Section */}
        <div className="mt-8 sm:mt-12 max-w-2xl mx-auto text-center px-4">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">How It Works:</h3>
          <ul className="text-gray-700 text-sm sm:text-base space-y-2 sm:space-y-3">
            <li className="flex items-start justify-center gap-2">
              <span className="text-emerald-600 font-semibold flex-shrink-0">✓</span>
              <span>Try our system with realistic sample data (free)</span>
            </li>
            <li className="flex items-start justify-center gap-2">
              <span className="text-emerald-600 font-semibold flex-shrink-0">✓</span>
              <span>See exactly how reconciliation works for salons</span>
            </li>
            <li className="flex items-start justify-center gap-2">
              <span className="text-emerald-600 font-semibold flex-shrink-0">✓</span>
              <span>Ready to use your data? One-time $497 custom setup</span>
            </li>
            <li className="flex items-start justify-center gap-2">
              <span className="text-emerald-600 font-semibold flex-shrink-0">✓</span>
              <span>Start catching real discrepancies immediately</span>
            </li>
          </ul>
        </div>

        {/* ROI Calculator Section (replaces old demo/CTA) */}
        <ROICalculator />

        {/* Contact Section */}
        <div className="mt-16 sm:mt-20 lg:mt-24 text-center px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
            Have Questions? We're Here to Help
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            Our team is ready to answer any questions you have about our custom reconciliation solutions for salons and how they can benefit your business. We'd love to hear from you!
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center min-w-[200px] min-h-[44px] px-6 sm:px-8 py-3 bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors duration-200 text-base sm:text-lg font-medium touch-manipulation"
          >
            <MessageCircle className="mr-2 h-5 w-5 flex-shrink-0" />
            Contact Us
          </Link>
        </div>
      </main>
    </div>
  );
}