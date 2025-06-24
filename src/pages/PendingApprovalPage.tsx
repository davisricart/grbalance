import React, { useState } from 'react';
import { Clock, CheckCircle, Settings, User, Calendar, Mail, Phone, ExternalLink, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';

export default function PendingApprovalPage() {
  const { user } = useAuth();
  const [showEmailOptions, setShowEmailOptions] = useState(false);

  const emailOptions = [
    {
      name: 'Gmail',
      url: 'https://mail.google.com/mail/?view=cm&to=davis@grbalance.com&su=Consultation%20Request&body=Hi%2C%20I%27d%20like%20to%20schedule%20a%20consultation%20to%20discuss%20how%20GR%20Balance%20can%20help%20with%20our%20reconciliation%20process.'
    },
    {
      name: 'Outlook',
      url: 'https://outlook.live.com/mail/0/deeplink/compose?to=davis@grbalance.com&subject=Consultation%20Request&body=Hi%2C%20I%27d%20like%20to%20schedule%20a%20consultation%20to%20discuss%20how%20GR%20Balance%20can%20help%20with%20our%20reconciliation%20process.'
    },
    {
      name: 'Default Email App',
      url: 'mailto:davis@grbalance.com?subject=Consultation%20Request&body=Hi%2C%20I%27d%20like%20to%20schedule%20a%20consultation%20to%20discuss%20how%20GR%20Balance%20can%20help%20with%20our%20reconciliation%20process.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-8 py-12 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-emerald-600" />
            </div>
            
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome! Let's Get Started
              </h1>
              
              <p className="text-lg text-gray-600 mb-8">
                Thank you for registering! Your next step is to schedule a consultation call with our team.
              </p>

              <div className="bg-emerald-600 text-white rounded-xl p-6 mb-8">
                <h2 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Schedule Your Free Consultation
                </h2>
                <p className="mb-4 text-emerald-100">
                  Book a convenient 30-minute call to discuss your specific business needs and see if we're a good fit.
                </p>
                
                <div className="flex flex-col gap-3 items-center">
                  <a 
                    href="https://cal.com/davis-r-rmz6au/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 w-full max-w-xs"
                  >
                    <Calendar className="h-5 w-5" />
                    Book Appointment
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
                    <div className="relative">
                      <button 
                        onClick={() => setShowEmailOptions(!showEmailOptions)}
                        className="bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 text-sm min-w-[120px]"
                      >
                        <Mail className="h-4 w-4" />
                        Email Us
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      
                      {showEmailOptions && (
                        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[160px]">
                          {emailOptions.map((option, index) => (
                            <a
                              key={index}
                              href={option.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              onClick={() => setShowEmailOptions(false)}
                            >
                              {option.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <a 
                      href="/contact"
                      className="bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 text-sm min-w-[120px]"
                    >
                      <Phone className="h-4 w-4" />
                      Contact Us
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-semibold text-emerald-900 mb-4 flex items-center justify-center gap-2">
                  <Settings className="h-5 w-5" />
                  What Happens Next
                </h2>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                    <div>
                      <h3 className="font-medium text-emerald-900">1. Consultation Call</h3>
                      <p className="text-sm text-emerald-700">We'll discuss your business needs and determine if our solution is the right fit</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2"></div>
                    <div>
                      <h3 className="font-medium text-emerald-900">2. Custom Script Development</h3>
                      <p className="text-sm text-emerald-700">Our team will build a custom reconciliation script tailored to your business</p>
            </div>
          </div>
          
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
            <div>
                      <h3 className="font-medium text-gray-600">3. Testing & Website Setup</h3>
                      <p className="text-sm text-gray-500">Your personalized dashboard will be created and thoroughly tested</p>
                    </div>
            </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
            <div>
                      <h3 className="font-medium text-gray-600">4. Go Live!</h3>
                      <p className="text-sm text-gray-500">After final approval, you'll receive full access to your dashboard</p>
                    </div>
              </div>
            </div>
          </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center justify-center gap-2">
                  <User className="h-5 w-5" />
                  Your Registration Details
                </h2>
                
                <div className="text-left space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-900">Email: {user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-900">Registered: {new Date().toLocaleDateString()}</span>
                  </div>
            </div>
          </div>

              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  <strong>Typical Timeline:</strong> 2-3 business days after consultation
                </p>
                
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Schedule at your convenience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>We're here to help</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 