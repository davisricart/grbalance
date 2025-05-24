import React from 'react';
import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export default function BookingCalendar() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        styles: { branding: { brandColor: "#059669" } },
        hideEventTypeDetails: false,
        layout: 'month_view'
      });
    })();
  }, []);

  return (
    <div className="w-full h-full min-h-[600px]">
      <Cal
        calLink="davis-r-rmz6au/30min"
        style={{ width: "100%", height: "100%", minHeight: "600px" }}
        config={{
          styles: { branding: { brandColor: "#059669" } },
          hideEventTypeDetails: false,
          layout: 'month_view'
        }}
      />
    </div>
  );
}