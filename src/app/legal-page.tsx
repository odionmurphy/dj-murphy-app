import type { ReactNode } from "react";

export function LegalPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-[#071b3a] px-6 py-16 text-white sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-black sm:text-6xl">{title}</h1>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-3 space-y-3 leading-7 text-white/70">{children}</div>
    </section>
  );
}
