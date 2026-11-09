import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment received",
  robots: { index: false, follow: false },
};

export default function PaymentSuccessPage() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-2xl border border-purple-400/30 bg-purple-500/[0.06] p-10 text-center sm:p-16">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
          Payment received
        </p>
        <h1 className="mt-4 text-4xl font-black sm:text-5xl">THANK YOU.</h1>
        <p className="mt-6 leading-7 text-white/60">
          Your deposit payment went through and is being confirmed. DJ Murphy
          will be in touch about the next steps for your event.
        </p>
        <Link
          href="/"
          className="mt-10 inline-block bg-purple-500 px-8 py-4 text-sm font-bold uppercase tracking-widest transition hover:bg-purple-400"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}