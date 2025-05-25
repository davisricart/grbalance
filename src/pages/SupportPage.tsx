// PAGE MARKER: Support Page Component
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Home } from 'lucide-react';

export default function SupportPage() {
  const navigate = useNavigate();
  
  const faqs = [
    {
      question: "How do I start comparing files?",
      answer: "First, we'll analyze your salon software and payment processor formats during setup. Once we've built your custom reconciliation script, you simply upload your reports and run your personalized comparison."
    },
    {
      question: "How does the setup process work?",
      answer: "We start with a consultation to understand your salon software, payment processors, and reconciliation needs. Then we build custom matching logic specifically for your data formats. Once your script is ready, you can upload files and get results instantly."
    },
    {
      question: "What file formats are supported?",
      answer: "We support Excel files (.xlsx, .xls) and CSV files (.csv). Files should have clear column headers and consistent data formats."
    },
    {
      question: "How are my monthly comparisons counted?",
      answer: "Each successful comparison counts toward your monthly limit. Failed comparisons or errors don't count. Your limit resets on the first day of each month."
    },
    {
      question: "How can I upgrade my plan?",
      answer: "Contact our support team to discuss adding more custom scripts or increasing your monthly comparison limits."
    },
    {
      question: "What if my data format changes?",
      answer: "No problem! If your salon software or payment processor changes their report format, we'll update your custom script at no additional charge. Your reconciliation will continue working seamlessly."
    },
    {
      question: "Is my data secure?",
      answer: "Your uploaded files are processed securely and never stored permanently. We only access your data during the initial setup consultation to build your custom scripts."
    }
  ];

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