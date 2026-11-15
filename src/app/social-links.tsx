import { socials } from "@/lib/site-config";

export default function SocialLinks({ className = "" }: { className?: string }) {
  const links = socials.filter((social) => social.href);
  if (links.length === 0) return null;

  return (
    <ul className={`flex flex-wrap gap-3 ${className}`}>
      {links.map(({ label, href, icon: Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`DJ Murphy on ${label}`}
            className="inline-flex items-center gap-2 border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest transition hover:border-purple-400 hover:text-purple-300"
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}