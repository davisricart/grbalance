import React, { useEffect } from 'react';

export default function BookingCalendar() {
  useEffect(() => {
    // Load Cal.com embed script
    const script = document.createElement('script');
    script.src = 'https://app.cal.com/embed/embed.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      // Initialize Cal.com embed
      if (window.Cal) {
        window.Cal("init", "30min", { origin: "https://cal.com" });
        window.Cal.ns["30min"]("inline", {
          elementOrSelector: "#cal-booking-inline",
          config: { layout: "month_view" },
          calLink: "davis-r-rmz6au/30min",
        });
        window.Cal.ns["30min"]("ui", {
          styles: { branding: { brandColor: "#059669" } },
          hideEventTypeDetails: false,
          layout: "month_view"
        });
      }
    };

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

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