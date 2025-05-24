import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, DollarSign, Clock, Shield, Gift } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Basic',
      price: '19',
      description: 'Perfect for small salons wanting to validate processing fees',
      features: [
        '50 comparisons per month',
        '1 custom reconciliation script',
        'Optimized processing speed',
        'CSV & Excel file support',
        'Download results as Excel'
      ]
    },
    {
      name: 'Premium',
      price: '35',
      description: 'Enhanced features for salons with higher transaction volumes',
      features: [
        '100 comparisons per month',
        '2 custom reconciliation scripts',
        'Optimized processing speed',
        'CSV & Excel file support',
        'Download results as Excel',
        'Priority email support'
      ]
    },
    {
      name: 'Enterprise',
      price: '65',
      description: 'Maximum power for high-volume businesses',
      features: [
        '250 comparisons per month',
        '4 custom reconciliation scripts',
        'Optimized processing speed',
        'CSV & Excel file support',
        'Download results as Excel',
        'Priority email support',
        'Dedicated account manager',
        'Custom implementation support'
      ]
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Save Valuable Time',
      description: 'Save 6-12 hours monthly on reconciliation tasks'
    },
    {
      icon: DollarSign,
      title: 'Prevent Costly Mistakes',
      description: 'Catch discrepancies that could cost thousands yearly'
    },
    {
      icon: Shield,
      title: 'No Risk',
      description: 'Cancel anytime during your trial - no credit card required'
    }
  ];

  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Start Your 14-Day Free Trial
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Save thousands yearly on accounting costs and processing fee mistakes. Try all Premium features risk-free.
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

        {/* Pricing Cards */}
        <div className="isolate mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 ring-1 ring-gray-200 ${
                plan.name === 'Premium' ? 'bg-gray-900 text-white ring-gray-900' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">{plan.name}</h2>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                  14-day trial
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-400">{plan.description}</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight">
                  ${plan.price}
                </span>
                <span className="text-sm font-semibold leading-6">/month</span>
              </p>
              <Link
                to="/app"
                className={`mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  plan.name === 'Premium'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-400 focus-visible:outline-emerald-500'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:outline-emerald-600'
                }`}
              >
                Start free trial
              </Link>
              <ul
                role="list"
                className="mt-8 space-y-3 text-sm leading-6"
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check
                      className={`h-6 w-5 flex-none ${
                        plan.name === 'Premium' ? 'text-emerald-400' : 'text-emerald-600'
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

        {/* FAQs */}
        <div className="mx-auto mt-16 max-w-4xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <dl className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="text-left">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                What are custom reconciliation scripts?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Custom scripts allow you to define specific matching rules and criteria for your unique reconciliation needs. Basic plan includes 1 script, Premium includes 2, and Enterprise includes 4.
              </dd>
            </div>
            <div className="text-left">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                How does the free trial work?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Start with full Premium features for 14 days. No credit card required. Cancel anytime during the trial period.
              </dd>
            </div>
            <div className="text-left">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                How much time can I save?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Our customers save 6-12 hours monthly on reconciliation tasks, eliminating the need for expensive accounting services while catching costly processing fee mistakes.
              </dd>
            </div>
            <div className="text-left">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                Can I change plans later?
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}