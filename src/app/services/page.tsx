import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "DJ services for clubs, weddings, private events, corporate functions and festivals.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute right-[-6rem] top-0 h-80 w-80 rounded-full bg-purple-700/25 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
            What I do
          </p>
          <h1 className="mt-4 font-display text-7xl uppercase leading-none sm:text-9xl">
            Services
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <ul className="border-t border-white/10">
          {services.map((service) => (
            <li
              key={service.number}
              className="grid items-center gap-6 border-b border-white/10 py-10 md:grid-cols-[6rem_1fr_auto]"
            >
              <span className="font-display text-4xl text-purple-400">
                {service.number}
              </span>
              <div>
                <h2 className="text-2xl font-bold">{service.title}</h2>
                <p className="mt-2 text-white/55">{service.description}</p>
              </div>
              <Link
                href="/booking"
                className="border border-white/20 px-6 py-4 text-center text-xs font-bold uppercase tracking-widest transition hover:border-purple-400 hover:text-purple-400"
              >
                Enquire
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}