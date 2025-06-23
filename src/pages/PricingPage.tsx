// PAGE MARKER: Pricing Page Component
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Check, Zap, DollarSign, Clock, Shield, Star } from 'lucide-react';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 19,
      annualPrice: 15, // Simplified to $15 (21% off)
      description: 'Perfect for small salons getting started',
      savings: 'Save $800+ annually',
      comparisons: 50,
      scripts: 1,
      popular: false,
      features: [
        '50 file comparisons per month',
        '1 custom-built reconciliation script',
        'DaySmart & processor file support',
        'Excel report downloads',
        'Email support',
        'Processing fee validation'
      ]
    },
    {
      name: 'Professional',
      monthlyPrice: 34,
      annualPrice: 27, // Simplified to $27 (21% off)
      originalPrice: 35, // Strikethrough price
      description: 'Most chosen - saves $1,200+ yearly',
      savings: 'Save $1,200+ annually',
      comparisons: 75,
      scripts: 2,
      popular: true,
      features: [
        '75 file comparisons per month',
        '2 custom-built reconciliation scripts',
        'DaySmart & processor file support',
        'Excel report downloads',
        'Priority email support',
        'Processing fee validation',
        'Tailored matching rules for your business'
      ]
    },
    {
      name: 'Business',
      monthlyPrice: 59,
      annualPrice: 47, // Simplified to $47 (20% off)
      description: 'For high-volume salon businesses',
      savings: 'Save $2,500+ annually',
      comparisons: 150,
      scripts: 3,
      popular: false,
      features: [
        '150 file comparisons per month',
        '3 custom-built reconciliation scripts',
        'DaySmart & processor file support',
        'Excel report downloads',
        'Priority email support',
        'Processing fee validation',
        'Tailored matching rules for your business',
        'Phone support',
        'Personal consultation and setup'
      ]
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: '12 hours saved monthly',
      description: 'Save time every month with automation'
    },
    {
      icon: DollarSign,
      title: 'Custom matching logic',
      description: 'Built specifically for your data formats'
    },
    {
      icon: Shield,
      title: 'Expert consultation',
      description: 'We analyze your setup and build your solution'
    }
  ];

  return (
    <div className="py-16 sm:py-24">
      <Helmet>
        <title>Stop Losing Money on Payment Processing Errors | GR Balance</title>
        <meta name="description" content="Automated reconciliation for DaySmart, Square, Stripe & salon software. Catch hidden payment processing errors and save thousands annually." />
        <meta property="og:title" content="Stop Losing Money on Payment Processing Errors" />
        <meta property="og:description" content="Automated reconciliation for DaySmart, Square, Stripe & salon software. Catch hidden payment processing errors and save thousands annually." />
        <meta property="og:url" content="https://grbalance.netlify.app/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://grbalance.netlify.app/your-social-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Stop Losing Money on Payment Processing Errors" />
        <meta name="twitter:description" content="Automated reconciliation for DaySmart, Square, Stripe & salon software. Catch hidden payment processing errors and save thousands annually." />
        <meta name="twitter:image" content="https://grbalance.netlify.app/your-social-image.png" />
      </Helmet>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Launch Special Banner */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-center text-white shadow-lg max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🚀</span>
              <h2 className="text-xl font-bold">Launch Special - Setup Fee Waived</h2>
            </div>
            <p className="text-lg font-medium mb-2">
              Sign up before August 1st, 2025 and get setup fee waived + 14-day free trial
            </p>
            <p className="text-emerald-100 text-sm">
              Save $497 + risk-free trial • After August 1st, standard pricing applies
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Stop Losing Money on Payment Processing Errors
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Custom reconciliation solutions built for your salon's specific setup
          </p>
        </div>

        {/* Benefits Section */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="absolute top-6 left-6">
                <benefit.icon className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="pt-12">
                <h3 className="text-lg font-semibold text-gray-900">{benefit.title}</h3>
                <p className="mt-2 text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof Text Section */}
        <div className="text-center mt-10 mb-8">
          <span className="text-gray-700 font-medium text-lg">Works with salon software you already use:</span>
          <div className="mt-2 text-emerald-700 font-semibold text-base">DaySmart &bull; Square &bull; Stripe &bull; PaymentCloud &bull; BookedBy</div>
        </div>

        {/* Annual/Monthly Toggle - Positioned right above pricing */}
        <div className="flex justify-center mb-8">
          <div className="relative flex items-center bg-gray-50 rounded-xl p-1.5 shadow-md border border-gray-200">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-7 py-3 text-base font-semibold rounded-lg transition-all ${
                !isAnnual
                  ? 'bg-white text-gray-900 shadow-lg border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-7 py-3 text-base font-semibold rounded-lg transition-all ${
                isAnnual
                  ? 'bg-white text-gray-900 shadow-lg border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Annual
              <span className="ml-2 px-2 py-0.5 text-xs text-white bg-emerald-600 rounded-full font-bold">Best Value</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="isolate mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 ring-1 ${
                plan.popular 
                  ? 'bg-gray-900 text-white ring-gray-900 relative' 
                  : 'bg-white ring-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-4 py-1 text-xs font-medium text-white">
                    <Star className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">{plan.name}</h2>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                  14-day free trial
                </span>
              </div>
              
              <p className={`mt-4 text-sm leading-6 ${plan.popular ? 'text-gray-300' : 'text-gray-500'}`}>
                {plan.description}
              </p>
              
              <div className="flex items-baseline gap-x-2 mt-4">
                <span className="text-4xl font-bold tracking-tight">
                  ${isAnnual ? plan.annualPrice.toFixed(0) : plan.monthlyPrice}
                </span>
                <span className="text-sm font-semibold leading-6">/month</span>
                {plan.originalPrice && !isAnnual && (
                  <span className="text-lg text-gray-400 line-through">${plan.originalPrice}</span>
                )}
              </div>
              <div className="text-sm mt-1">
                <span className="text-gray-400 line-through">+ $497 one-time custom setup</span>
                <span className="text-emerald-700 font-semibold ml-2">FREE until August 1st</span>
              </div>
              {isAnnual && (
                <p className={`text-sm mt-1 ${plan.popular ? 'text-gray-300' : 'text-gray-500'}`}>
                  Year 1: ${(plan.annualPrice * 12).toFixed(0)} (setup fee waived)
                </p>
              )}
              {!isAnnual && (
                <p className={`text-sm mt-1 ${plan.popular ? 'text-gray-300' : 'text-gray-500'}`}>
                  Year 1: ${(plan.monthlyPrice * 12).toFixed(0)} (setup fee waived)
                </p>
              )}
              <p className="mt-2 text-sm font-medium text-emerald-600">
                {plan.savings}
              </p>
              
              <div className="mt-6 space-y-3">
                <Link
                  to={`/register?plan=${plan.name.toLowerCase()}`}
                  className={`block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    plan.popular
                      ? 'bg-emerald-500 text-white hover:bg-emerald-400 focus-visible:outline-emerald-500'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:outline-emerald-600'
                  }`}
                >
                  Choose {plan.name}
                </Link>
                <Link
                  to="/interactive-demo"
                  className={`block rounded-md px-3 py-2 text-center text-xs font-medium border transition-colors ${
                    plan.popular
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                      : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  Try Demo First
                </Link>
              </div>
              
              <ul className="mt-8 space-y-3 text-sm leading-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check
                      className={`h-6 w-5 flex-none ${
                        plan.popular ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* After software compatibility line */}
        <div className="mt-8 max-w-2xl mx-auto text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">How It Works:</h3>
          <ul className="text-gray-700 text-base space-y-1">
            <li>✓ Try our system with realistic sample data (free)</li>
            <li>✓ See exactly how reconciliation works for salons</li>
            <li>✓ Ready to use your data? <span className="text-emerald-600 font-semibold">Custom setup FREE + 14-day trial until August 1st</span></li>
            <li>✓ Start catching real discrepancies risk-free</li>
          </ul>
        </div>

        {/* ROI Calculator Preview */}
        <div className="mx-auto mt-16 max-w-4xl bg-emerald-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            See Your Potential Savings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white rounded-lg p-6">
              <div className="text-2xl font-bold text-emerald-600">$900</div>
              <div className="text-sm text-gray-600">Minimum annual error savings</div>
              <div className="text-xs text-gray-500">Even conservative salons save $75+ monthly</div>
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="text-2xl font-bold text-emerald-600">12 hours</div>
              <div className="text-sm text-gray-600">Saved monthly on reconciliation</div>
              <div className="text-xs text-gray-500">Worth $3,600+ annually in staff time</div>
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="text-2xl font-bold text-emerald-600">$400</div>
              <div className="text-sm text-gray-600">Reduced accounting costs</div>
              <div className="text-xs text-gray-500">Less manual work = lower professional fees</div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mx-auto mt-16 max-w-4xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <dl className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="text-left">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                What is a "file comparison"?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                One comparison = uploading your salon software report (DaySmart, Square, etc.) and your processor report for a specific time period. The system matches transactions and identifies discrepancies.
              </dd>
            </div>
            <div className="text-left">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                What are custom reconciliation scripts?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                We analyze your specific salon software and payment processor formats, then build custom matching logic tailored to your exact data structure. Each script is built from scratch for your unique setup - not a one-size-fits-all solution.
              </dd>
            </div>
            <div className="text-left">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                Which payment processors do you support?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                We support most major processors including Square, Stripe, PaymentCloud, and others. During setup, we create custom scripts for your specific processor's report format.
              </dd>
            </div>
            <div className="text-left">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                How much can I really save?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Most salon owners save 8-12 hours monthly on reconciliation plus catch processing errors worth hundreds to thousands annually. Even at our highest plan, you'll save money vs. hiring help.
              </dd>
            </div>
            <div className="text-left">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                What if my payment processor isn't supported yet?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                We build custom scripts for each client's specific setup. If your processor is new to us, we'll create a tailored solution during your trial period.
              </dd>
            </div>
            <div className="text-left">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                Do I need to understand the technical details?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Not at all. We handle all the technical complexity. You simply upload your reports, and our custom-built scripts do the matching work we designed specifically for your business.
              </dd>
            </div>
            <div className="text-left">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                What does the setup fee include?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                The one-time $497 setup fee covers our expert analysis of your salon software and payment processor formats, custom script development tailored to your specific data structure, testing and validation, and implementation support. This ensures your reconciliation works perfectly from day one.
              </dd>
            </div>
            <div className="text-left">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                How does the free trial work?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Start by trying our system with realistic sample salon data - no setup required. You'll see exactly how reconciliation works and what results to expect. When you're ready to process your actual data, we'll build your custom solution for a one-time setup fee.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}