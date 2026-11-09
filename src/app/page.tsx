import Image from "next/image";
import Link from "next/link";
import AssistantChat from "./assistant-chat";
import GenreMarquee from "./genre-marquee";
import { services } from "@/lib/services";

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="relative">
        {/* Photo: pinned to the right side of the hero */}
        <div className="pointer-events-none absolute inset-0 lg:left-auto lg:w-[48%]">
          <Image
            src="/dj-murphy.jpg"
            alt="DJ Murphy performing behind the decks"
            fill
            priority
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="object-cover object-[60%_15%] opacity-30 lg:opacity-100"
          />
          {/* Fades the left edge into the page background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08070b] via-[#08070b]/30 to-transparent" />
          {/* Fades the bottom edge into the page background */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#08070b] to-transparent" />
        </div>

        {/* Text content sits above the photo */}
        <div className="relative z-10 mx-auto flex min-h-[76vh] max-w-7xl flex-col justify-center px-6 py-24">
          <p className="mb-8 text-sm font-bold uppercase tracking-[0.35em] text-purple-300">
            International DJ · Available Worldwide
          </p>
          <h1 className="relative max-w-5xl text-6xl font-black leading-[0.95] tracking-tight sm:text-8xl lg:text-9xl">
            YOUR EVENT.
            <br />
            YOUR ENERGY.
            <br />
            <span className="text-purple-400">MY SOUND.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-white/60">
            Premium DJ experiences for clubs, weddings, private celebrations and
            events around the world.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/booking"
              className="bg-purple-500 px-7 py-4 text-sm font-bold uppercase tracking-widest transition hover:bg-purple-400"
            >
              Check availability ↗
            </Link>
            <Link
              href="/services"
              className="border border-white/20 bg-black/30 px-7 py-4 text-sm font-bold uppercase tracking-widest transition hover:border-purple-400"
            >
              Explore services
            </Link>
          </div>
          <div className="mt-20 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-7">
            <div>
              <p className="text-2xl font-black">Worldwide</p>
              <p className="mt-2 text-xs uppercase tracking-widest text-white/40">
                Booking region
              </p>
            </div>
            <div>
              <p className="text-2xl font-black">Tailored</p>
              <p className="mt-2 text-xs uppercase tracking-widest text-white/40">
                Every performance
              </p>
            </div>
            <div>
              <p className="text-2xl font-black">Premium</p>
              <p className="mt-2 text-xs uppercase tracking-widest text-white/40">
                Experience
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.02] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
            What I do
          </p>
          <h2 className="mt-4 text-4xl font-black sm:text-6xl">
            SOUND THAT MOVES YOU.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.number}
                className="border border-white/10 bg-black/30 p-8 transition hover:border-purple-400/60"
              >
                <p className="text-sm text-purple-400">{service.number}</p>
                <h3 className="mt-10 text-2xl font-bold">{service.title}</h3>
                <p className="mt-4 leading-7 text-white/55">
                  {service.description}
                </p>
              </article>
            ))}
          </div>
          <Link
            href="/services"
            className="mt-10 inline-block text-xs font-bold uppercase tracking-widest text-purple-300 transition hover:text-purple-400"
          >
            View all services →
          </Link>
        </div>
      </section>

      <AssistantChat />

      <GenreMarquee />

      <section className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-3xl border border-purple-400/30 bg-purple-500/[0.06] p-10 text-center sm:p-16">
          <h2 className="text-4xl font-black sm:text-6xl">READY TO BOOK?</h2>
          <p className="mt-6 text-white/60">
            Tell me about your event and I&apos;ll get back to you within 24
            hours.
          </p>
          <Link
            href="/booking"
            className="mt-10 inline-block bg-purple-500 px-8 py-4 text-sm font-bold uppercase tracking-widest transition hover:bg-purple-400"
          >
            Request a booking
          </Link>
        </div>
      </section>
    </div>
  );
}