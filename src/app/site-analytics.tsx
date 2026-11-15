"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

export default function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => {
        // Don't count the admin area
        if (new URL(event.url).pathname.startsWith("/dashboard")) return null;
        return event;
      }}
    />
  );
}