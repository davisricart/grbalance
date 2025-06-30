import React, { useState } from 'react';
import BookingCalendar from '../components/BookingCalendar';
import { Clock, Calendar, VideoIcon, CheckCircle, Mail, Phone } from 'lucide-react';
import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY || (() => {
  throw new Error('VITE_RESEND_API_KEY environment variable is required');
})());

export default function BookingPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation - require proper domain with TLD
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(contactForm.email)) {
      setSubmitStatus('error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create professional HTML email for booking inquiries
      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .section { margin: 20px 0; }
              .section h3 { color: #10b981; margin-bottom: 10px; }
              .message-box { background: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h2>📅 New Booking Inquiry</h2>
              </div>
              
              <div class="content">
                  <div class="section">
                      <h3>📋 Contact Details</h3>
                      <p><strong>Name:</strong> ${contactForm.name}</p>
                      <p><strong>Email:</strong> ${contactForm.email}</p>
                  </div>
                  
                  <div class="section">
                      <h3>💬 Message</h3>
                      <div class="message-box">
                          <p>${contactForm.message.replace(/\n/g, '<br>')}</p>
                      </div>
                  </div>
                  
                  <div class="footer">
                      <p>Sent from GR Balance Booking Page</p>
                  </div>
              </div>
          </div>
      </body>
      </html>
      `;

      // Send email using Resend API
      const response = await resend.emails.send({
        from: 'GR Balance Booking <davis@grbalance.com>',
        to: 'davis@grbalance.com',
        subject: `[Booking Inquiry] ${contactForm.name}`,
        html: htmlContent,
        replyTo: contactForm.email,
      });

      console.log('✅ Booking inquiry email sent successfully:', response);
      setSubmitStatus('success');
      setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
      console.error('Resend Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Schedule Your Free Consultation
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Book a 30-minute session with our experts to discuss how our reconciliation tool can help your business save time and money.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column - Booking */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Booking Calendar */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Book Your Consultation</h2>
                <p className="text-gray-600">Choose a time that works for you</p>
              </div>
              <BookingCalendar />
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Prefer to write to us?</h2>
                <p className="text-gray-600">Send us your questions and we'll get back to you within 24 hours.</p>
              </div>
              
              {submitStatus === 'success' ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Message sent successfully</h3>
                  <p className="text-gray-600">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input 
                        type="text" 
                        name="name"
                        value={contactForm.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                        placeholder="Your name" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        type="email" 
                        name="email"
                        value={contactForm.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                        placeholder="you@business.com" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea 
                      rows={4} 
                      name="message"
                      value={contactForm.message}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none" 
                      placeholder="Tell us about your reconciliation challenges..." 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-2 px-4 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </button>
                  {submitStatus === 'error' && (
                    <p className="text-red-600 text-sm text-center">Please enter a valid email address (e.g., name@domain.com)</p>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Right Column - Information */}
          <div className="space-y-6">
            
            {/* What to Expect */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What to Expect</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">30 Minutes</h3>
                    <p className="text-sm text-gray-600">Focused discussion on your needs</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <VideoIcon className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">Video Call</h3>
                    <p className="text-sm text-gray-600">Via Google Meet or Zoom</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">Flexible Scheduling</h3>
                    <p className="text-sm text-gray-600">Pick a time that works for you</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Consultation Includes */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Consultation Includes</h2>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Personalized demo</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>ROI calculation</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Implementation strategy</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Q&A session</span>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Not ready to book?</h3>
              <div className="space-y-2">
                <a 
                  href="/interactive-demo" 
                  className="block text-emerald-600 hover:text-emerald-700 text-sm"
                >
                  Try Interactive Demo →
                </a>
                <a 
                  href="/pricing" 
                  className="block text-emerald-600 hover:text-emerald-700 text-sm"
                >
                  View Pricing →
                </a>
                <a 
                  href="/contact" 
                  className="block text-emerald-600 hover:text-emerald-700 text-sm"
                >
                  Contact Support →
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}