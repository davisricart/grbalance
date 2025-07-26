// PAGE MARKER: Support Page Component
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Home } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function SupportPage() {
  const navigate = useNavigate();
  
  const faqs = [
    {
      question: "How do I start comparing files?",
      answer: "First, we'll learn about your business in a free consultation. Then we build your custom reconciliation script. You simply upload your reports and get results—no technical skills required."
    },
    {
      question: "How does the setup process work?",
      answer: "We start with a 30-minute strategy call to understand your needs. Our team builds your solution, tests it, and delivers a ready-to-use portal. Most solutions are live within 1-2 weeks."
    },
    {
      question: "What file formats are supported?",
      answer: "We support Excel files (.xlsx, .xls) and CSV files (.csv). If your files are unique, we'll adapt your solution to fit—no reformatting required."
    },
    {
      question: "What if my needs change?",
      answer: "We adapt your solution as your business evolves. Unlimited revisions during the first 30 days, and ongoing support included."
    },
    {
      question: "How long does setup take?",
      answer: "Most solutions are live within 1-2 weeks after your consultation."
    },
    {
      question: "What if you're unavailable?",
      answer: "Your solution runs independently. We provide backup support and ensure your reconciliation keeps working."
    },
    {
      question: "Is my data secure?",
      answer: "Your uploaded files are processed securely and never stored permanently. We only access your data during setup to build your custom scripts."
    },
    {
      question: "How many businesses have you helped?",
      answer: "Over 50 businesses have trusted us to automate their reconciliation—ranging from single-location salons to multi-site franchises."
    },
    {
      question: "What makes your service different?",
      answer: "We deliver custom, done-for-you solutions—no generic software, no learning curve. You get results tailored to your exact workflow, with expert support every step of the way."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Helmet>
        <title>Salon Reconciliation Help & FAQ | DaySmart Square Support | GR Balance</title>
        <meta name="description" content="Get help with salon payment reconciliation. FAQ for DaySmart, Square, Stripe integration. Setup guides, troubleshooting, and billing support for beauty salon owners." />
        <meta name="keywords" content="salon reconciliation FAQ, DaySmart setup help, Square reconciliation guide, salon payment help, beauty salon software support, reconciliation troubleshooting, payment processing FAQ" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Salon Reconciliation Help & FAQ | Expert Support Available" />
        <meta property="og:description" content="Complete help center for salon payment reconciliation. Setup guides, FAQ, and troubleshooting for DaySmart, Square, Stripe users." />
        <meta property="og:url" content="https://grbalance.com/support" />
        <meta property="og:image" content="https://grbalance.com/images/support-faq.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Salon Reconciliation Help & FAQ" />
        <meta name="twitter:description" content="Complete help center for salon payment reconciliation. Setup guides and troubleshooting for salon owners." />
        <meta name="twitter:image" content="https://grbalance.com/images/support-twitter.png" />
        
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://grbalance.com/support" />
        
        {/* FAQ Schema */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How does salon reconciliation work?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our salon reconciliation software automatically compares your salon software reports (like DaySmart) with your payment processor reports (like Square or Stripe) to identify discrepancies and ensure accurate financial records."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What file formats are supported?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We support CSV and Excel files from major salon software platforms including DaySmart, Square, Stripe, and other popular payment processors used by beauty salons."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How long does setup take?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Initial setup typically takes 1-2 business days. We analyze your specific salon software and payment processor formats to create custom reconciliation scripts tailored to your data structure."
                  }
                }
              ]
            }
          `}
        </script>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Support Center</h1>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-emerald-600" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}