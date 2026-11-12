"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) return null;

  return (
    <footer className="border-t border-white/10 bg-black px-6 py-10 text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-6 text-center md:grid-cols-3 md:text-left">
        <Link
          href="/"
          aria-label="DJ Murphy home"
          className="relative isolate mx-auto block size-16 md:mx-0"
        >
          <span
            aria-hidden="true"
            className="absolute -inset-3 z-0 rounded-full bg-amber-300/40 opacity-75 blur-xl animate-pulse motion-reduce:animate-none"
          />
          <Image
            src="/dj-murphy-logo.png"
            alt=""
            width={768}
            height={768}
            sizes="64px"
            className="relative z-10 size-full object-contain"
          />
        </Link>

        <div className="flex flex-wrap justify-center gap-6 text-xs uppercase tracking-widest text-white/50">
          <Link href="/services" className="transition hover:text-purple-400">
            Services
          </Link>
          <Link href="/gigs" className="transition hover:text-purple-400">
            Gigs
          </Link>
          <Link href="/booking" className="transition hover:text-purple-400">
            Booking
          </Link>
        </div>

        <p className="text-xs uppercase tracking-widest text-white/35 md:text-right">
          © 2026 DJ MURPHY · MUSIC WITHOUT BORDERS
        </p>
      </div>
    </footer>
  );
}