"use client";

import { useState } from "react";

type GigVideoPlayerProps = {
  src: string;
  title: string;
  type: "video/mp4" | "video/webm";
  poster?: string;
};

export default function GigVideoPlayer({
  src,
  title,
  type,
  poster,
}: GigVideoPlayerProps) {
  const [message, setMessage] = useState("");

  return (
    <div className="relative bg-black">
      <video
        controls
        playsInline
        preload="metadata"
        poster={poster}
        className="aspect-video w-full bg-black"
        aria-label={`Watch the ${title} event video`}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          setMessage(
            video.videoWidth === 0 || video.videoHeight === 0
              ? "This file has sound but no visible video. Please re-upload a video with picture."
              : ""
          );
        }}
        onError={() =>
          setMessage(
            "This video could not be played. Re-export it as MP4 with H.264 video and AAC audio, then upload it again."
          )
        }
      >
        <source src={src} type={type} />
        Your browser does not support HTML video.
      </video>
      {message && (
        <p
          role="alert"
          className="border-t border-amber-300/30 bg-amber-950/90 px-4 py-3 text-sm text-amber-100"
        >
          {message}
        </p>
      )}
    </div>
  );
}
