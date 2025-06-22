// PAGE MARKER: Contact Page Component
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, AlertCircle, MessageSquare, Clock, Home, CheckSquare } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { Helmet } from 'react-helmet-async';

export default function ContactPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHuman, setIsHuman] = useState(false);

  useEffect(() => {
    emailjs.init("e-n1Rxb8CRaf_RfPm");
  }, []);

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
    
    if (!isHuman) {
      setError('Please verify that you are human');
      return;
    }

    setIsSubmitting(true);

    try {
      const templateParams = {
        from_name: name,
        from_email: email,
        subject: subjectOptions.find(opt => opt.value === subject)?.label || subject,
        message: message
      };

      await emailjs.send(
        'service_grbalance',
        'template_rm62n5a',
        templateParams
      );

      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setIsHuman(false);
    } catch (err) {
      setError('Failed to send message. Please try again later.');
      console.error('EmailJS Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="h-6 w-6 text-emerald-600" />
                <h3 className="text-lg font-medium text-gray-900">General Inquiries</h3>
              </div>
              <p className="text-gray-600">
                Have questions about our service? We're here to help with any general questions or concerns.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-6 w-6 text-emerald-600" />
                <h3 className="text-lg font-medium text-gray-900">Response Time</h3>
              </div>
              <p className="text-gray-600">
                We typically respond within 24 hours during business days. For urgent matters, please indicate in your message.
              </p>
            </div>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Mail className="h-6 w-6 text-emerald-600" />
              Send us a Message
            </h2>
            
            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                <h3 className="text-lg font-medium text-emerald-800 mb-2">Thank you for your message!</h3>
                <p className="text-emerald-600">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    >
                      {subjectOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-center">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div 
                        className={`w-6 h-6 rounded border transition-colors duration-200 flex items-center justify-center ${
                          isHuman ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300 group-hover:border-emerald-400'
                        }`}
                        onClick={() => setIsHuman(!isHuman)}
                      >
                        {isHuman && <CheckSquare className="w-5 h-5 text-white" />}
                      </div>
                      <span className="text-sm text-gray-600">I am human</span>
                    </label>
                  </div>

                  {error && (
                    <div className="bg-red-50 p-4 rounded-md flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-md flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      Our team typically responds within 24 hours during business days. 
                      For immediate assistance, please check our Support Center.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center justify-center gap-2 ${
                      isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}