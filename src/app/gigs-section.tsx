import { connection } from "next/server";
import { supabase } from "@/lib/supabase";

export default async function GigsSection() {
  // Marks this component as request-time so "today" isn't frozen at build time
  await connection();

  const today = new Date().toISOString().slice(0, 10);

  const { data: gigs, error } = await supabase
    .from("gigs")
    .select("*")
    .gte("date", today)
    .order("date", { ascending: true });

  if (error) {
    console.error("Failed to load gigs:", error.message);
  }

  return (
    <section id="gigs" className="border-t border-white/10 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
          On the road
        </p>
        <h2 className="mt-4 text-4xl font-black sm:text-6xl">UPCOMING GIGS.</h2>

        {!gigs?.length ? (
          <p className="mt-12 text-white/50">
            No gigs announced yet. Check back soon, or book me for yours.
          </p>
        ) : (
          <ul className="mt-12 divide-y divide-white/10 border-y border-white/10">
            {gigs.map((gig) => (
              <li
                key={gig.id}
                className="flex flex-wrap items-center justify-between gap-4 py-6"
              >
                <div className="flex items-center gap-8">
                  <time
                    dateTime={gig.date}
                    className="w-28 text-sm font-bold uppercase tracking-widest text-purple-400"
                  >
                    {new Date(gig.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </time>
                  <div>
                    <h3 className="text-xl font-bold">{gig.title}</h3>
                    <p className="text-sm text-white/50">
                      {gig.venue} · {gig.city}
                    </p>
                  </div>
                </div>

                {gig.ticket_url && (
                  <a
                    href={gig.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-purple-400/50 px-5 py-3 text-xs font-bold uppercase tracking-widest transition hover:bg-purple-500"
                  >
                    Tickets ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}