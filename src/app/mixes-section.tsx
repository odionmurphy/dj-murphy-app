import { connection } from "next/server";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import MixPlayer from "./mix-player";
import MixBanner from "./mix-banner";
import VideoPlayer from "./video-player";

const mixColors = [
  { accent: "#c084fc", glow: "rgba(192,132,252,0.28)" },
  { accent: "#fb7185", glow: "rgba(251,113,133,0.25)" },
  { accent: "#22d3ee", glow: "rgba(34,211,238,0.23)" },
  { accent: "#facc15", glow: "rgba(250,204,21,0.23)" },
  { accent: "#fb923c", glow: "rgba(251,146,60,0.25)" },
];

type LiveVideo = {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
};

export default async function MixesSection() {
  // Request-time data, same pattern as the gigs section
  await connection();

  const { data: mixes, error } = await supabase
    .from("mixes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load mixes:", error.message);
  }

  const { data: videos, error: videosError } = await supabase
    .from("mix_videos")
    .select("id, title, description, file_path")
    .order("created_at", { ascending: false });

  if (videosError) {
    console.error("Failed to load live-set videos:", videosError.message);
  }

  return (
    <section
      id="mixes"
      className="hero-grid-background min-h-[70vh] px-6 py-16 text-[#111827] sm:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-700">
          Listen
        </p>
        <h1 className="mt-4 text-4xl font-black sm:text-6xl">
          HEAR THE SOUND.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Listen to mixes and live sets, wherever you are.
        </p>
        <MixBanner />

        {!!videos?.length && (
          <section aria-labelledby="live-sets-heading" className="mt-12">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-700">
              Watch
            </p>
            <h2
              id="live-sets-heading"
              className="mt-3 text-3xl font-black sm:text-4xl"
            >
              LIVE SETS
            </h2>
            <p className="mt-2 max-w-2xl leading-7 text-slate-600">
              Watch DJ Murphy bring the music to life.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {(videos as LiveVideo[]).map((video) => (
                <article
                  key={video.id}
                  className="overflow-hidden rounded-2xl border border-purple-200 bg-[#f1eaff] shadow-sm"
                >
                  <VideoPlayer
                    src={getR2PublicUrl(video.file_path)}
                    title={video.title}
                    type={
                      video.file_path.toLowerCase().endsWith(".webm")
                        ? "video/webm"
                        : "video/mp4"
                    }
                  />
                  <div className="p-5 sm:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-purple-700">
                      Live set · DJ Murphy
                    </p>
                    <h3 className="mt-2 break-words font-display text-3xl uppercase leading-none">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {video.description}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {!mixes?.length ? (
          <p className="mt-12 rounded-2xl border border-indigo-100 bg-white/80 p-6 text-slate-600 shadow-sm">
            {videos?.length
              ? "Audio mixes are on the way. Check back soon."
              : "New mixes are on the way. Check back soon."}
          </p>
        ) : (
          <div className={`${videos?.length ? "mt-10" : "mt-12"} grid gap-6 md:grid-cols-2`}>
            {mixes.map((mix, index) => {
              const src = mix.file_path.startsWith("r2/")
                ? getR2PublicUrl(mix.file_path)
                : supabase.storage
                    .from("mixes")
                    .getPublicUrl(mix.file_path).data.publicUrl;
              const color = mixColors[index % mixColors.length];

              return (
                <article
                  key={mix.id}
                  className="group relative overflow-hidden rounded-2xl border border-purple-200 bg-[#f1eaff] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-950/10 sm:p-7"
                >
                  <div
                    className="pointer-events-none absolute -right-12 -top-20 size-48 rounded-full opacity-[0.08] blur-3xl transition-opacity group-hover:opacity-20"
                    style={{ backgroundColor: color.accent }}
                    aria-hidden="true"
                  />
                  <div className="relative flex items-center gap-5">
                    <div
                      className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 sm:size-32"
                      style={{
                        background: `radial-gradient(circle at 30% 20%, ${color.accent}88, transparent 48%), linear-gradient(145deg, #24202c, #100e14 72%)`,
                      }}
                      aria-hidden="true"
                    >
                      {mix.artwork_path ? (
                        <Image
                          src={getR2PublicUrl(mix.artwork_path)}
                          alt={`${mix.title} cover`}
                          fill
                          sizes="(max-width: 640px) 96px, 128px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <>
                          <div className="relative grid size-16 place-items-center rounded-full border border-white/15 bg-black/35 shadow-2xl sm:size-20">
                            <div
                              className="size-7 rounded-full border-[5px] border-white/10 sm:size-9"
                              style={{ backgroundColor: color.accent }}
                            />
                          </div>
                          <span className="absolute bottom-2 right-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/70">
                            DJM
                          </span>
                        </>
                      )}
                    </div>

                    <div className="min-w-0">
                      {mix.genre && (
                        <p
                          className="text-[10px] font-bold uppercase tracking-[0.24em]"
                          style={{ color: color.accent }}
                        >
                          {mix.genre}
                        </p>
                      )}
                      <h2 className="mt-2 break-words font-display text-3xl uppercase leading-none sm:text-4xl">
                        {mix.title}
                      </h2>
                      {mix.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                          {mix.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <MixPlayer
                    src={src}
                    title={mix.title}
                    accent={color.accent}
                    glow={color.glow}
                  />
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function getR2PublicUrl(filePath: string) {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error("R2_PUBLIC_URL must be configured to play R2-hosted mixes.");
  }

  const baseUrl = new URL(publicUrl);
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  return new URL(encodedPath, `${baseUrl.toString().replace(/\/+$/, "")}/`).toString();
}