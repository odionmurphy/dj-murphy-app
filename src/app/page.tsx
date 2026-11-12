import Image from "next/image";
import Link from "next/link";
import AssistantChat from "./assistant-chat";
import GenreMarquee from "./genre-marquee";
import { services } from "@/lib/services";

export default function Home() {
  return (
    <div className="overflow-hidden bg-[#071b3a]">
      <section className="hero-grid-background relative text-[#111827]">
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#eaf3ff] via-[#eaf3ff]/35 to-transparent" />
          {/* Fades the bottom edge into the page background */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#eaf3ff] to-transparent" />
        </div>

        {/* Text content sits above the photo */}
        <div className="relative z-10 mx-auto flex min-h-[76vh] max-w-7xl flex-col justify-center px-6 py-16 sm:px-6 sm:py-24">
          <p className="mb-6 max-w-sm text-xs font-bold leading-6 uppercase tracking-[0.24em] text-purple-700 sm:mb-8 sm:text-sm sm:leading-normal sm:tracking-[0.35em]">
            International DJ · Available Worldwide
          </p>
          <h1 className="relative max-w-5xl text-[clamp(2.4rem,10vw,6rem)] font-black leading-[0.95] tracking-tight lg:text-9xl">
            YOUR EVENT.
            <br />
            YOUR ENERGY.
            <br />
            <span className="text-purple-400">MY SOUND.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-700 sm:mt-8 sm:text-lg sm:leading-8">
            Premium DJ experiences for clubs, weddings, private celebrations and
            events around the world.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/gigs"
              className="w-full bg-purple-500 px-5 py-4 text-center text-xs font-bold uppercase tracking-widest transition hover:bg-purple-400 sm:w-auto sm:px-7 sm:text-sm"
            >
              Check availability ↗
            </Link>
            <Link
              href="/services"
              className="w-full border border-slate-300 bg-white/70 px-5 py-4 text-center text-xs font-bold uppercase tracking-widest transition hover:border-purple-500 sm:w-auto sm:px-7 sm:text-sm"
            >
              Explore services
            </Link>
          </div>
          <div className="mt-12 grid w-full max-w-2xl grid-cols-3 gap-3 border-t border-slate-300/70 pt-6 sm:mt-20 sm:gap-6 sm:pt-7">
            <div className="min-w-0">
              <p className="text-[clamp(0.9rem,3.8vw,1.5rem)] font-black sm:text-2xl">Worldwide</p>
              <p className="mt-1 text-[10px] leading-4 uppercase tracking-[0.1em] text-slate-500 sm:mt-2 sm:text-xs sm:tracking-widest">
                Booking region
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[clamp(0.9rem,3.8vw,1.5rem)] font-black sm:text-2xl">Tailored</p>
              <p className="mt-1 text-[10px] leading-4 uppercase tracking-[0.1em] text-slate-500 sm:mt-2 sm:text-xs sm:tracking-widest">
                Every performance
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[clamp(0.9rem,3.8vw,1.5rem)] font-black sm:text-2xl">Premium</p>
              <p className="mt-1 text-[10px] leading-4 uppercase tracking-[0.1em] text-slate-500 sm:mt-2 sm:text-xs sm:tracking-widest">
                Experience
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-blue-200 bg-[#dceaff] px-6 py-16 text-[#111827] sm:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-purple-700">
            DJ Murphy · Every occasion
          </p>
          <h2 className="mt-4 text-center text-3xl font-black leading-tight sm:text-6xl">
            SOUND THAT MOVES YOU.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center leading-7 text-slate-600">
            The right sound and energy for every celebration, crowd, and stage.
          </p>
          <div className="mt-8 grid gap-5 md:mt-12 md:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.number}
                className="overflow-hidden rounded-2xl border border-blue-200 bg-[#f3f8ff] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10"
              >
                <div className="relative aspect-[16/8] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.imageAlt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold tracking-widest text-purple-600">
                    {service.number}
                  </p>
                  <h3 className="mt-2 text-xl font-bold sm:text-2xl">
                    {service.title}
                  </h3>
                  <p className="mt-2 leading-6 text-slate-600">
                    {service.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <Link
            href="/services"
            className="mt-8 inline-block text-xs font-bold uppercase tracking-widest text-purple-700 transition hover:text-purple-900"
          >
            View all services →
          </Link>
        </div>
      </section>

      <AssistantChat />

      <GenreMarquee />

      <section className="border-t border-white/10 px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl border border-purple-400/30 bg-purple-500/[0.06] p-6 text-center sm:p-16">
          <h2 className="text-3xl font-black sm:text-6xl">READY TO BOOK?</h2>
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