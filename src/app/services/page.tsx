import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "DJ services for clubs, weddings, private events, corporate functions and festivals.",
};

const serviceImages = [
  {
    src: "/images/services/club-nightlife.jpg",
    alt: "A nighttime festival crowd dancing under stage lights",
  },
  {
    src: "/images/services/wedding-reception.jpg",
    alt: "A wedding reception hall ready for the celebration",
  },
  {
    src: "/images/services/festival-crowd.jpg",
    alt: "A lively festival crowd enjoying a live performance",
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-full bg-[#f8f8ff] text-[#111827]">
      <section className="hero-grid-background relative overflow-hidden border-b border-indigo-100">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 md:grid-cols-[0.9fr_1.1fr] md:gap-16 md:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-700">
              DJ Murphy · Every occasion
            </p>
            <h1 className="mt-4 font-display text-6xl uppercase leading-none sm:text-8xl">
              Services
            </h1>
            <p className="mt-5 max-w-xl leading-7 text-slate-600">
              A tailored soundtrack, professional mixing, and the right energy
              for every room and celebration.
            </p>
            <Link
              href="/mixes"
              className="mt-7 inline-flex bg-purple-600 px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-purple-500"
            >
              Listen to my mixes
            </Link>
          </div>
          <div className="relative mx-auto aspect-[16/9] w-full max-w-[680px] overflow-hidden rounded-3xl border border-white/70 bg-slate-200 shadow-2xl shadow-indigo-950/20">
            <Image
              src="/images/services/djmurphy-mix-poster.jpg"
              alt="DJ Murphy Mix poster with the DJMURPHY MIX title over an icy scene"
              fill
              priority
              sizes="(min-width: 768px) 680px, 90vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f0f1ff] px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {services.map((service, index) => (
            <article
              key={service.number}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/10"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={serviceImages[index].src}
                  alt={serviceImages[index].alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition duration-500 hover:scale-105"
                />
              </div>
              <div className="p-6 sm:p-7">
                <span className="text-xs font-bold tracking-widest text-purple-600">
                  {service.number}
                </span>
                <h2 className="mt-3 text-2xl font-bold">{service.title}</h2>
                <p className="mt-3 leading-7 text-slate-600">
                  {service.description}
                </p>
                <Link
                  href="/booking"
                  className="mt-6 inline-flex border border-purple-200 px-5 py-3 text-xs font-bold uppercase tracking-widest text-purple-700 transition hover:border-purple-500 hover:bg-purple-600 hover:text-white"
                >
                  Enquire
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}