import React, { useState, useEffect } from 'react';
import { Calendar, ExternalLink } from 'lucide-react';

export default function BookingCalendar() {
  const [showFallback, setShowFallback] = useState(false); // Start with embed attempt

  useEffect(() => {
    // Set fallback timer - show fallback after 3 seconds if embed doesn't work
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true);
    }, 3000);

    // Try to load Cal.com embed
    const script = document.createElement('script');
    script.src = 'https://app.cal.com/embed/embed.js';
    script.async = true;
    
    script.onload = () => {
      // Wait a moment for Cal to be available after script loads
      setTimeout(() => {
        try {
          if (window.Cal) {
            window.Cal("init", { origin: "https://cal.com" });
            window.Cal("inline", {
              elementOrSelector: "#cal-booking-inline",
              calLink: "davis-r-rmz6au/30min",
              layout: "month_view"
            });
            window.Cal("ui", {
        styles: { branding: { brandColor: "#059669" } },
        hideEventTypeDetails: false,
              layout: "month_view"
            });
            
            // Check if embed actually loaded content
            setTimeout(() => {
              const container = document.getElementById('cal-booking-inline');
              if (container && container.children.length > 0) {
                // Embed worked! Clear the fallback timer
                clearTimeout(fallbackTimer);
              } else {
                // Embed didn't load content, show fallback
                setShowFallback(true);
              }
            }, 2000);
          } else {
            setShowFallback(true);
          }
        } catch (error) {
          console.error('Cal.com embed error:', error);
          setShowFallback(true);
        }
      }, 100); // Wait 100ms for Cal to be available
    };

    script.onerror = () => {
      clearTimeout(fallbackTimer);
      setShowFallback(true);
    };

    document.head.appendChild(script);

    return () => {
      clearTimeout(fallbackTimer);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  if (showFallback) {
    return (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center">
        <div className="text-center p-8 bg-emerald-50 rounded-xl border border-emerald-200">
          <Calendar className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Schedule Your Consultation
          </h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Click the button below to open our booking calendar in a new window and schedule your free 30-minute consultation.
          </p>
          <a
            href="https://cal.com/davis-r-rmz6au/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-medium"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Book Your Free Consultation
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[600px]">
      <div 
        id="cal-booking-inline" 
        style={{ 
          width: "100%", 
          height: "100%", 
          minHeight: "600px",
          overflow: "auto"
        }}
      />
    </div>
  );
}