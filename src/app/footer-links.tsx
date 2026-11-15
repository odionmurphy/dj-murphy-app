import Link from "next/link";
import SocialLinks from "./social-links";

export default function FooterLinks() {
  return (
    <div className="mx-auto mt-8 flex max-w-7xl flex-col items-center justify-between gap-5 border-t border-white/10 pt-6 md:flex-row">
      <SocialLinks className="justify-center" />
      <nav
        aria-label="Press and legal"
        className="flex flex-wrap justify-center gap-6 text-xs uppercase tracking-widest text-white/50"
      >
        <Link href="/press-kit" className="transition hover:text-purple-400">
          Press kit
        </Link>
        <Link href="/impressum" className="transition hover:text-purple-400">
          Impressum
        </Link>
        <Link href="/datenschutz" className="transition hover:text-purple-400">
          Privacy
        </Link>
      </nav>
    </div>
  );
}