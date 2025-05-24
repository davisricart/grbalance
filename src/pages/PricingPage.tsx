import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, DollarSign, Clock, Shield, Star } from 'lucide-react';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 19,
      annualPrice: 15.2, // 20% off
      description: 'Perfect for small salons getting started',
      savings: 'Save $500+ annually',
      comparisons: 50,
      scripts: 1,
      popular: false,
      features: [
        '50 file comparisons per month',
        '1 custom reconciliation script',
        'DaySmart & processor file support',
        'Excel report downloads',
        'Email support',
        'Processing fee validation'
      ]
    },
    {
      name: 'Professional',
      monthlyPrice: 29,
      annualPrice: 23.2, // 20% off
      originalPrice: 35, // Strikethrough price
      description: 'Most popular for growing salons',
      savings: 'Save $1,200+ annually',
      comparisons: 75,
      scripts: 2,
      popular: true,
      features: [
        '75 file comparisons per month',
        '2 custom reconciliation scripts',
        'DaySmart & processor file support',
        'Excel report downloads',
        'Priority email support',
        'Processing fee validation',
        'Custom matching rules',
        'Monthly reconciliation reports'
      ]
    },
    {
      name: 'Business',
      monthlyPrice: 49,
      annualPrice: 39.2, // 20% off
      description: 'For high-volume salon businesses',
      savings: 'Save $2,500+ annually',
      comparisons: 150,
      scripts: 3,
      popular: false,
      features: [
        '150 file comparisons per month',
        '3 custom reconciliation scripts',
        'DaySmart & processor file support',
        'Excel report downloads',
        'Priority email support',
        'Processing fee validation',
        'Custom matching rules',
        'Monthly reconciliation reports',
        'Phone support',
        'Custom implementation assistance'
      ]
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Save 8+ Hours Monthly',
      description: 'Eliminate manual reconciliation work that costs $200+ in staff time'
    },
    {
      icon: DollarSign,
      title: 'Catch Processing Errors',
      description: 'Identify fee discrepancies that could cost thousands yearly'
    },
    {
      icon: Shield,
      title: 'Risk-Free Trial',
      description: '14-day free trial - no credit card required'
    }
  ];

  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Reconcile DaySmart with Third-Party Processors
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Stop losing money on processing fee discrepancies. Our tool compares your DaySmart reports with third-party payment processors to catch every error.
          </p>
        </div>

        {/* Annual/Monthly Toggle */}
        <div className="mt-12 flex justify-center">
          <div className="relative flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                !isAnnual
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                isAnnual
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-1 text-xs text-emerald-600 font-semibold">Save 20%</span>
            </button>
          </div>
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
                  14-day trial
                </span>
              </div>
              
              <p className={`mt-4 text-sm leading-6 ${plan.popular ? 'text-gray-300' : 'text-gray-500'}`}>
                {plan.description}
              </p>
              
              <div className="mt-6">
                <div className="flex items-baseline gap-x-2">
                  <span className="text-4xl font-bold tracking-tight">
                    ${isAnnual ? plan.annualPrice.toFixed(0) : plan.monthlyPrice}
                  </span>
                  <span className="text-sm font-semibold leading-6">
                    /month
                  </span>
                  {plan.originalPrice && !isAnnual && (
                    <span className="text-lg text-gray-400 line-through">
                      ${plan.originalPrice}
                    </span>
                  )}
                </div>
                {isAnnual && (
                  <p className={`text-sm mt-1 ${plan.popular ? 'text-gray-300' : 'text-gray-500'}`}>
                    Billed annually (${(plan.annualPrice * 12).toFixed(0)}/year)
                  </p>
                )}
                <p className="mt-2 text-sm font-medium text-emerald-600">
                  {plan.savings}
                </p>
              </div>
              
              <Link
                to="/app"
                className={`mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  plan.popular
                    ? 'bg-emerald-500 text-white hover:bg-emerald-400 focus-visible:outline-emerald-500'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:outline-emerald-600'
                }`}
              >
                Start free trial
              </Link>
              
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6">
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

        {/* ROI Calculator Preview */}
        <div className="mx-auto mt-16 max-w-4xl bg-emerald-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            See Your Potential Savings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white rounded-lg p-6">
              <div className="text-2xl font-bold text-emerald-600">$500+</div>
              <div className="text-sm text-gray-600">Saved on processing errors</div>
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="text-2xl font-bold text-emerald-600">8+ hours</div>
              <div className="text-sm text-gray-600">Saved monthly on reconciliation</div>
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="text-2xl font-bold text-emerald-600">$200+</div>
              <div className="text-sm text-gray-600">Saved on accounting costs</div>
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
                One comparison = uploading your DaySmart report and processor report for a specific time period (usually daily or weekly). The system matches transactions and identifies discrepancies.
              </dd>
            </div>
            <div className="text-left">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                What are custom reconciliation scripts?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Custom scripts define how your specific DaySmart data matches with your processor's format. Each processor has different column names and data formats, so we create scripts tailored to your setup.
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
          </dl>
        </div>
      </div>
    </div>
  );
}