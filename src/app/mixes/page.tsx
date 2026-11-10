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
      fallback={
        <p className="bg-[#f8f8ff] px-6 py-24 text-center text-slate-500">
          Loading mixes...
        </p>
      }
    >
      <MixesSection />
    </Suspense>
  );
}