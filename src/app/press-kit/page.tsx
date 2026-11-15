import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SocialLinks from "../social-links";
import { legal, pressKit } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Press kit",
  description:
    "DJ Murphy press kit: biography, experience, genres, photos and booking contact.",
};

export default function PressKitPage() {
  const bio = pressKit.bio.filter((paragraph) => !paragraph.startsWith("TODO"));
  const experience = pressKit.experience.filter(
    (item) => !item.detail.startsWith("TODO")
  );

  return (
    <section className="bg-[#071b3a] px-6 py-16 text-white sm:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
          Press kit
        </p>
        <h1 className="mt-4 text-5xl font-black sm:text-7xl">DJ MURPHY</h1>
        <p className="mt-4 text-lg text-white/70">{pressKit.tagline}</p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10">
            <Image
              src="/dj-murphy.jpg"
              alt="DJ Murphy performing behind the decks"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover object-[60%_15%]"
            />
          </div>

          <div>
            <h2 className="text-2xl font-black">Biography</h2>
            <p className="mt-4 text-lg leading-8 text-white/85">
              {pressKit.shortBio}
            </p>
            <div className="mt-4 space-y-4 leading-7 text-white/65">
              {bio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <h2 className="mt-10 text-2xl font-black">Genres</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {pressKit.genres.map((genre) => (
                <li
                  key={genre}
                  className="border border-purple-400/40 px-3 py-1 text-xs font-bold uppercase tracking-widest text-purple-200"
                >
                  {genre}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {experience.length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-black">Experience</h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {experience.map((item) => (
                <li
                  key={item.title}
                  className="border border-white/10 bg-white/[0.04] p-6"
                >
                  <p className="font-display text-3xl uppercase leading-none">
                    {item.title}
                  </p>
                  <p className="mt-3 leading-7 text-white/65">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black">Downloads</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="/dj-murphy.jpg" download className="underline">
                  Press photo (JPG)
                </a>
              </li>
              <li>
                <a href="/dj-murphy-logo.png" download className="underline">
                  Logo (PNG)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-black">Booking and media contact</h2>
            <p className="mt-4 text-white/65">
              <a href={`mailto:${legal.email}`} className="underline">
                {legal.email}
              </a>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/booking"
                className="bg-purple-500 px-6 py-3 text-xs font-bold uppercase tracking-widest transition hover:bg-purple-400"
              >
                Book DJ Murphy
              </Link>
            </div>
            <SocialLinks className="mt-6" />
          </div>
        </div>
      </div>
    </section>
  );
}