import type { Metadata } from "next";
import { Suspense } from "react";
import MixesSection from "../mixes-section";

export const metadata: Metadata = {
  title: "Mixes",
  description: "Listen to DJ Murphy mixes and live sets.",
};

export default function MixesPage() {
  return (
    <Suspense
      fallback={<p className="px-6 py-24 text-center text-white/50">Loading mixes...</p>}
    >
      <MixesSection />
    </Suspense>
  );
}