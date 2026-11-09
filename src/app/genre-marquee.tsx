import {
  Flame,
  Waves,
  Speaker,
  Drum,
  Zap,
  Leaf,
  Heart,
  Radio,
  Star,
  Mic,
  Sun,
  type LucideIcon,
} from "lucide-react";

type Genre = {
  name: string;
  icon: LucideIcon;
  tagline: string;
  tempo: string;
  bestFor: string;
};

// Edit this list: add, remove or reword genres here
const genres: Genre[] = [
  {
    name: "Afrobeat",
    icon: Flame,
    tagline: "Infectious, bouncing rhythms that fill the floor from the first beat.",
    tempo: "100–115 BPM",
    bestFor: "Weddings · Parties",
  },
  {
    name: "Amapiano",
    icon: Waves,
    tagline: "Log-drum basslines and smooth, soulful piano that never rushes.",
    tempo: "110–115 BPM",
    bestFor: "Lounges · Late nights",
  },
  {
    name: "Dancehall",
    icon: Speaker,
    tagline: "Heavy bass and island swagger that gets everyone moving.",
    tempo: "90–105 BPM",
    bestFor: "Clubs · Birthdays",
  },
  {
    name: "Latin",
    icon: Drum,
    tagline: "Salsa, bachata and Latin pop with fire in the percussion.",
    tempo: "90–130 BPM",
    bestFor: "Parties · Private events",
  },
  {
    name: "Reggaeton",
    icon: Zap,
    tagline: "The dembow beat that turns any room into a dance floor.",
    tempo: "90–100 BPM",
    bestFor: "Clubs · Parties",
  },
  {
    name: "Reggae",
    icon: Leaf,
    tagline: "Laid-back, sun-soaked grooves and roots classics.",
    tempo: "70–90 BPM",
    bestFor: "Lounges · Outdoor events",
  },
  {
    name: "R&B",
    icon: Heart,
    tagline: "Smooth vocals and slow-burn vibes for the right mood.",
    tempo: "70–100 BPM",
    bestFor: "Weddings · Dinners",
  },
  {
    name: "Old School",
    icon: Radio,
    tagline: "Timeless throwbacks that every generation sings along to.",
    tempo: "Throwbacks",
    bestFor: "Weddings · Reunions",
  },
  {
    name: "Pop",
    icon: Star,
    tagline: "Chart-topping hits and crowd-pleasers, all night long.",
    tempo: "100–128 BPM",
    bestFor: "Weddings · Corporate",
  },
  {
    name: "Hip-Hop",
    icon: Mic,
    tagline: "Heavy beats and quotable lines, from classics to today.",
    tempo: "80–100 BPM",
    bestFor: "Clubs · Private parties",
  },
  {
    name: "Afro House",
    icon: Sun,
    tagline: "Deep percussion and hypnotic grooves with a warm, sunset glow.",
    tempo: "118–124 BPM",
    bestFor: "Sunset sets · Clubs",
  },
];

function GenreCard({ genre }: { genre: Genre }) {
  const Icon = genre.icon;

  return (
    <article className="group relative w-72 shrink-0 overflow-hidden rounded-3xl bg-white p-7 shadow-xl shadow-purple-950/40 ring-1 ring-black/5 transition duration-300 ease-out hover:-translate-y-3 hover:shadow-2xl hover:shadow-purple-500/40">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-300/40 blur-3xl transition group-hover:bg-purple-400/60" />

      <div className="relative flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 transition group-hover:bg-purple-600 group-hover:text-white">
          <Icon size={22} strokeWidth={1.75} />
        </span>
        <span className="rounded-full border border-neutral-200 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          {genre.tempo}
        </span>
      </div>

      <h3 className="relative mt-8 font-display text-4xl uppercase leading-none text-neutral-900">
        {genre.name}
      </h3>
      <p className="relative mt-3 text-sm leading-6 text-neutral-600">
        {genre.tagline}
      </p>

      <p className="relative mt-5 border-t border-neutral-200 pt-4 text-[11px] font-bold uppercase tracking-widest text-purple-600">
        Best for · {genre.bestFor}
      </p>
    </article>
  );
}

export default function GenreMarquee() {
  return (
    <section className="border-t border-white/10 bg-white/[0.02] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
          What I play
        </p>
        <h2 className="mt-4 text-4xl font-black sm:text-6xl">
          EVERY GENRE. ONE ENERGY.
        </h2>
        <p className="mt-6 max-w-xl text-white/55">
          From Afrobeat and Amapiano to Hip-Hop, Latin and Reggae, the set is
          built around your crowd and your night.
        </p>
      </div>

      <div className="marquee mt-2">
        <div className="marquee-track flex w-max py-12">
          <div className="flex shrink-0 gap-5 pr-5">
            {genres.map((genre) => (
              <GenreCard key={genre.name} genre={genre} />
            ))}
          </div>

          {/* Second copy makes the loop seamless; hidden from screen readers */}
          <div
            className="marquee-duplicate flex shrink-0 gap-5 pr-5"
            aria-hidden="true"
          >
            {genres.map((genre) => (
              <GenreCard key={genre.name} genre={genre} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}