"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const bannerImages = [
  {
    src: "/dj-murphy.jpg",
    alt: "DJ Murphy performing at the decks",
    position: "center 38%",
  },
  {
    src: "/anthony-delanoix-hzgs56Ze49s-unsplash.jpg",
    alt: "A crowd enjoying a live music performance",
    position: "center 55%",
  },
  {
    src: "/kofi-nuamah-barden-2Rtc0Cdhmc4-unsplash.jpg",
    alt: "DJ equipment and lights at a nightclub",
    position: "center",
  },
  {
    src: "/michael-benz-_NIaM1gEsfU-unsplash.jpg",
    alt: "A DJ mixing music for a crowd",
    position: "center 60%",
  },
  {
    src: "/pablo-heimplatz-ZODcBkEohk8-unsplash.jpg",
    alt: "A festival crowd celebrating under lights",
    position: "center",
  },
  {
    src: "/yomex-owo-g763DLmVJO8-unsplash.jpg",
    alt: "A DJ performing at an outdoor music event",
    position: "center 58%",
  },
];

const ROTATION_INTERVAL_MS = 3 * 60 * 1000;

export default function MixBanner() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % bannerImages.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeImage = bannerImages[activeIndex];

  return (
    <div
      className="relative mt-8 h-[250px] w-full overflow-hidden rounded-3xl border border-white/70 bg-slate-900 shadow-2xl shadow-indigo-950/20 sm:mt-10 sm:h-[360px] lg:h-[420px]"
      aria-label="DJ Murphy Mix photo banner"
    >
      <Image
        key={activeImage.src}
        src={activeImage.src}
        alt={activeImage.alt}
        fill
        priority={activeIndex === 0}
        sizes="(min-width: 1280px) 1280px, calc(100vw - 3rem)"
        className="animate-banner-image object-cover"
        style={{ objectPosition: activeImage.position }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#08070b]/75 via-[#08070b]/30 to-transparent" />
      <p className="absolute inset-y-0 left-0 flex flex-col justify-center px-6 font-display text-5xl leading-[0.85] tracking-wide text-white drop-shadow-2xl sm:px-12 sm:text-7xl lg:px-16 lg:text-8xl">
        DJMURPHY
        <span className="mt-2 text-purple-300 sm:mt-4">MIX</span>
      </p>
      <div
        className="absolute bottom-5 right-5 flex items-center gap-2 sm:bottom-7 sm:right-7"
        aria-label="Choose banner image"
      >
        {bannerImages.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Show banner image ${index + 1} of ${bannerImages.length}`}
            aria-current={index === activeIndex ? "true" : undefined}
            className={`h-2.5 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              index === activeIndex
                ? "w-7 bg-white"
                : "w-2.5 bg-white/55 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
