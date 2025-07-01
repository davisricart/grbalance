// PAGE MARKER: Contact Page Component
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, AlertCircle, MessageSquare, Clock, Home, CheckSquare } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHuman, setIsHuman] = useState(false);

  const subjectOptions = [
    { value: '', label: 'Select a subject...' },
    { value: 'billing', label: 'Billing & Subscription' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'account', label: 'Account Management' },
    { value: 'data', label: 'Data & Security' },
    { value: 'general', label: 'General Inquiry' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Email validation - require proper domain with TLD
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address (e.g., name@domain.com)');
      return;
    }
    
    if (!isHuman) {
      setError('Please verify that you are human');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedSubject = subjectOptions.find(opt => opt.value === subject)?.label || subject;
      
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          subject: selectedSubject,
          message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      console.log('✅ Contact form email sent successfully:', data);
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setIsHuman(false);
    } catch (err) {
      setError('Failed to send message. Please try again later.');
      console.error('Email Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <CheckSquare className="w-16 h-16 text-emerald-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Thank you for your message!</h2>
          <p className="text-gray-600 mb-6">We'll get back to you within 24 hours.</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Helmet>
        <title>Contact Salon Reconciliation Support | Get Help with DaySmart & Square Issues | GR Balance</title>
        <meta name="description" content="Get expert support for salon payment reconciliation issues. Contact GR Balance for DaySmart, Square, Stripe reconciliation help. Technical support, billing, and account assistance available." />
        <meta name="keywords" content="salon reconciliation support, DaySmart help, Square payment support, salon software support, payment processing help, reconciliation technical support, salon accounting support" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Contact Salon Reconciliation Support | Expert Help Available" />
        <meta property="og:description" content="Get expert support for salon payment reconciliation. Contact us for DaySmart, Square, Stripe help. Fast response times." />
        <meta property="og:url" content="https://grbalance.netlify.app/contact" />
        <meta property="og:image" content="https://grbalance.netlify.app/images/contact-support.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Salon Reconciliation Support" />
        <meta name="twitter:description" content="Expert support for salon payment reconciliation issues. Fast response times for DaySmart, Square, Stripe problems." />
        <meta name="twitter:image" content="https://grbalance.netlify.app/images/contact-twitter.png" />
        
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://grbalance.netlify.app/contact" />
        
        {/* Organization Schema */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "GR Balance",
              "description": "Automated payment reconciliation software for beauty salons",
              "url": "https://grbalance.netlify.app",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "availableLanguage": "English",
                "areaServed": "US"
              },
              "sameAs": []
            }
          `}
        </script>
      </Helmet>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mb-8">Contact Us</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start mb-4">
              <MessageSquare className="w-6 h-6 text-emerald-500 mr-3 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">General Inquiries</h2>
                <p className="text-gray-600 mt-2">
                  Have questions about our service? We're here to help with any general questions or
                  concerns.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start mb-4">
              <Clock className="w-6 h-6 text-emerald-500 mr-3 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Response Time</h2>
                <p className="text-gray-600 mt-2">
                  We typically respond within 24 hours during business days. For urgent matters, please
                  indicate in your message.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <Mail className="w-6 h-6 text-emerald-500 mr-3" />
              Send us a Message
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {subjectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Your message..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="human"
                  checked={isHuman}
                  onChange={(e) => setIsHuman(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="human" className="ml-2 block text-sm text-gray-700">
                  I am a human
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                <Send className="w-5 h-5 mr-2" />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}