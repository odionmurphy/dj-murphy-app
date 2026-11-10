import { connection } from "next/server";
import Link from "next/link";
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
    <section
      id="gigs"
      className="hero-grid-background min-h-[70vh] px-6 py-16 text-[#111827] sm:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-700">
          On the road
        </p>
        <h1 className="mt-4 text-4xl font-black sm:text-6xl">UPCOMING GIGS.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Find DJ Murphy at upcoming shows and events. Join the dance floor and
          experience the sound live.
        </p>

        {!gigs?.length ? (
          <div className="mt-12 rounded-2xl border border-indigo-100 bg-white/80 p-6 text-slate-600 shadow-sm">
            <p>No gigs announced yet. Check back soon, or book me for yours.</p>
            <Link
              href="/booking"
              className="mt-4 inline-flex bg-purple-600 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-purple-500"
            >
              Book DJ Murphy
            </Link>
          </div>
        ) : (
          <ul className="mt-10 space-y-4">
            {gigs.map((gig) => (
              <li
                key={gig.id}
                className="overflow-hidden rounded-2xl border border-indigo-100 bg-white/90 shadow-sm transition hover:shadow-md"
              >
                {gig.image_path && (
                  <div className="relative aspect-[16/7] w-full bg-slate-200 sm:aspect-[16/5]">
                    {/* Supabase Storage URLs are configured per project at runtime. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={supabase.storage
                        .from("gig-images")
                        .getPublicUrl(gig.image_path).data.publicUrl}
                      alt={`${gig.title} event`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
                  <div className="flex min-w-0 flex-1 items-center gap-5 sm:gap-8">
                    <time
                      dateTime={gig.date}
                      className="w-24 shrink-0 text-xs font-bold uppercase tracking-widest text-purple-700 sm:w-28 sm:text-sm"
                    >
                      {new Date(gig.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </time>
                    <div>
                      <h2 className="text-lg font-bold sm:text-xl">{gig.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {gig.venue} · {gig.city}
                      </p>
                    </div>
                  </div>

                  {gig.ticket_url && (
                    <a
                      href={gig.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-purple-200 px-5 py-3 text-xs font-bold uppercase tracking-widest text-purple-700 transition hover:border-purple-600 hover:bg-purple-600 hover:text-white"
                    >
                      Tickets ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}