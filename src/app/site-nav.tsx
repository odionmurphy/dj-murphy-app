"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
  { href: "/gigs", label: "Gigs" },
  { href: "/mixes", label: "Mixes" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname.startsWith("/dashboard")) return null;

  const linkClass = (href: string) => {
    // Hash links like /#services never count as "current page"
    const active = !href.includes("#") && pathname === href;
    return `text-xs font-bold uppercase tracking-widest transition hover:text-purple-400 ${
      active ? "text-purple-400" : "text-white/70"
    }`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08070b]/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="text-xl font-black tracking-[0.2em]"
        >
          DJ <span className="text-purple-400">MURPHY</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
          <Link
            href="/booking"
            className="bg-purple-500 px-6 py-4 text-xs font-bold uppercase tracking-widest transition hover:bg-purple-400"
          >
            Book Now
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest md:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </nav>

      {/* Mobile links */}
      {open && (
        <div className="flex flex-col gap-5 border-t border-white/10 px-6 py-6 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={linkClass(link.href)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/booking"
            onClick={() => setOpen(false)}
            className="bg-purple-500 px-6 py-4 text-center text-xs font-bold uppercase tracking-widest"
          >
            Book Now
          </Link>
        </div>
      )}
    </header>
  );
}