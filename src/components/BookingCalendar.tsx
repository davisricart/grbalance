import React, { useState, useEffect } from 'react';
import { Calendar, ExternalLink, Clock, VideoIcon } from 'lucide-react';

export default function BookingCalendar() {
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, let's skip the complex embed and go straight to a beautiful fallback
    // This ensures users always see something functional
    const timer = setTimeout(() => {
      setShowFallback(true);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[600px]">
      {/* Enhanced Booking Interface */}
      <div className="text-center p-8 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
        <Calendar className="h-16 w-16 text-emerald-600 mx-auto mb-6" />
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to Schedule Your Free Consultation?
        </h3>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Book your 30-minute consultation to discover how we can save your business 12 hours monthly with automated reconciliation.
        </p>

        {/* Quick Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg p-4 border border-emerald-100">
            <Clock className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">30 Minutes</div>
            <div className="text-xs text-gray-600">Focused session</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-emerald-100">
            <VideoIcon className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">Video Call</div>
            <div className="text-xs text-gray-600">Google Meet/Zoom</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-emerald-100">
            <Calendar className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">Free</div>
            <div className="text-xs text-gray-600">No commitment</div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="space-y-4">
          <a
            href="https://cal.com/davis-r-rmz6au/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 bg-emerald-600 text-white text-lg font-semibold rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Calendar className="mr-3 h-6 w-6" />
            Book Your Free Consultation
            <ExternalLink className="ml-3 h-5 w-5" />
          </a>
          
          <p className="text-sm text-gray-500">
            Opens in a new window • Secure booking via Cal.com
          </p>
        </div>

        {/* Alternative Options */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">Can't find a good time?</p>
          <a 
            href="mailto:davis@grbalance.com?subject=Consultation Request&body=Hi, I'd like to schedule a consultation to discuss how GR Balance can help with our reconciliation process."
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            📧 Email us directly
          </a>
        </div>

      </div>
    </div>
  );
}