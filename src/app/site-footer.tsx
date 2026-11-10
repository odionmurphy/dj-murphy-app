"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) return null;

  return (
    <footer className="border-t border-white/10 bg-[#08070b] px-6 py-10 text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-6 text-center md:grid-cols-3 md:text-left">
        <Link href="/" className="text-xl font-black tracking-[0.2em]">
          DJ <span className="text-purple-400">MURPHY</span>
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