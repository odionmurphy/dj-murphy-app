import type { Metadata } from "next";
import { Suspense } from "react";
import GigsSection from "../gigs-section";

export const metadata: Metadata = {
  title: "Gigs",
  description: "Upcoming DJ Murphy shows, festivals and events.",
};

export default function GigsPage() {
  return (
    <Suspense
      fallback={<p className="px-6 py-24 text-center text-white/50">Loading gigs...</p>}
    >
      <GigsSection />
    </Suspense>
  );
}