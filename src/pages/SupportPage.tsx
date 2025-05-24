import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Home } from 'lucide-react';

export default function SupportPage() {
  const navigate = useNavigate();
  
  const faqs = [
    {
      question: "How do I start comparing files?",
      answer: "Upload two Excel or CSV files using the file upload buttons on the main application page. Select a comparison script that matches your needs, then click 'Run Comparison'."
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
      answer: "Contact our support team to discuss upgrading to our Premium plan with increased comparison limits and priority support."
    },
    {
      question: "Is my data secure?",
      answer: "Yes! All file processing happens in your browser - files are never uploaded to our servers. We use secure authentication and don't store any of your comparison data."
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