"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type MixPlayerProps = {
  src: string;
  title: string;
  accent: string;
  glow: string;
};

export default function MixPlayer({
  src,
  title,
  accent,
  glow,
}: MixPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const progress = duration > 0 ? currentTime / duration : 0;
  const bars = Array.from({ length: 76 }, (_, index) => {
    const seed = title.charCodeAt(index % Math.max(title.length, 1)) || 1;
    return 12 + ((seed * (index + 7) * 13) % 34);
  });

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    setError("");
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setError("This mix could not be played. Please try again.");
      }
    } else {
      audio.pause();
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  function changeVolume(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value;
    setVolume(value);
    setMuted(value === 0);
    audio.muted = value === 0;
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }

  return (
    <div className="mt-7 rounded-2xl border border-purple-200 bg-[#e9ddff] p-4 sm:p-5">
      <audio
        ref={audioRef}
        preload="metadata"
        src={src}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0);
          setError("");
        }}
        onDurationChange={(event) =>
          setDuration(event.currentTarget.duration || 0)
        }
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
        onPlay={(event) => {
          document.querySelectorAll("audio").forEach((other) => {
            if (other !== event.currentTarget) other.pause();
          });
          setPlaying(true);
          setError("");
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setPlaying(false);
          setError("Audio could not be loaded. Please try again later.");
        }}
      />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => void togglePlayback()}
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
          className="flex size-12 shrink-0 items-center justify-center rounded-full text-black transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          style={{ backgroundColor: accent, boxShadow: `0 0 28px ${glow}` }}
        >
          {playing ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play className="ml-0.5" size={20} fill="currentColor" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            className="flex h-12 items-center gap-[3px]"
            aria-hidden="true"
          >
            {bars.map((height, index) => (
              <span
                key={index}
                className="min-w-[2px] flex-1 rounded-full transition-colors duration-150"
                style={{
                  height: `${height}px`,
                  backgroundColor:
                    index / bars.length <= progress
                      ? accent
                      : "rgba(15,23,42,0.18)",
                }}
              />
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label={`Seek ${title}`}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            className="mix-seek mt-1 block h-2 w-full cursor-pointer"
            style={{ accentColor: accent }}
            disabled={!duration}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 pl-1 text-xs tabular-nums text-slate-600">
        <div className="flex items-center gap-2">
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-300">/</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute audio" : "Mute audio"}
            className="rounded p-1 text-slate-500 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-purple-600"
          >
            {muted || volume === 0 ? (
              <VolumeX size={16} />
            ) : (
              <Volume2 size={16} />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(event) => changeVolume(Number(event.target.value))}
            aria-label={`Volume for ${title}`}
            className="mix-volume h-1 w-16 cursor-pointer"
            style={{ accentColor: accent }}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}
