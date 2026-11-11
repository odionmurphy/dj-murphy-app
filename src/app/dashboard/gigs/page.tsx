"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  isLiveVideoExtension,
  MAX_LIVE_VIDEO_BYTES,
} from "@/lib/video-upload";

type VideoUpload = {
  uploadUrl: string;
  filePath: string;
  contentType: string;
  kind: "video";
};

type Gig = {
  id: string;
  date: string;
  title: string;
  venue: string;
  city: string;
  ticket_url: string | null;
  image_path: string | null;
  video_path: string | null;
};

type GigDraft = {
  date: string;
  title: string;
  venue: string;
  city: string;
  ticket_url: string;
};

type Access = "checking" | "signed-out" | "denied" | "ready";

const emptyDraft: GigDraft = {
  date: "",
  title: "",
  venue: "",
  city: "",
  ticket_url: "",
};

const IMAGE_BUCKET = "gig-images";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_GIG_VIDEO_BYTES = MAX_LIVE_VIDEO_BYTES;

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    const details =
      "details" in error && typeof error.details === "string"
        ? error.details
        : "";
    return details ? `${error.message} (${details})` : error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

export default function ManageGigsPage() {
  const videoFileInput = useRef<HTMLInputElement | null>(null);
  const uploadController = useRef<AbortController | null>(null);
  const uploadRequest = useRef<XMLHttpRequest | null>(null);
  const [access, setAccess] = useState<Access>("checking");
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [draft, setDraft] = useState<GigDraft>(emptyDraft);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [checkingVideo, setCheckingVideo] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStage, setUploadStage] = useState("");
  const [canCancelUpload, setCanCancelUpload] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadGigs = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("gigs")
      .select("id, date, title, venue, city, ticket_url, image_path, video_path")
      .order("date", { ascending: true });

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setGigs((data ?? []) as Gig[]);
  }, []);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!active) return;

        if (!data.session) {
          setAccess("signed-out");
          return;
        }

        const { data: membership, error: membershipError } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", data.session.user.id)
          .maybeSingle();

        if (membershipError) throw membershipError;
        if (!active) return;

        if (!membership) {
          setAccess("denied");
          return;
        }

        await loadGigs();
        if (active) setAccess("ready");
      } catch (accessError) {
        if (active) {
          setError(getErrorMessage(accessError, "Could not verify administrator access."));
          setAccess("denied");
        }
      }
    }

    void checkAccess();
    return () => {
      active = false;
    };
  }, [loadGigs]);

  function startNewGig() {
    setDraft(emptyDraft);
    setImageFile(null);
    setVideoFile(null);
    setCheckingVideo(false);
    if (videoFileInput.current) videoFileInput.current.value = "";
    setEditingId(null);
    setFormOpen(true);
    setError("");
    setNotice("");
  }

  function startEditing(gig: Gig) {
    setDraft({
      date: gig.date,
      title: gig.title,
      venue: gig.venue,
      city: gig.city,
      ticket_url: gig.ticket_url ?? "",
    });
    setImageFile(null);
    setVideoFile(null);
    setCheckingVideo(false);
    if (videoFileInput.current) videoFileInput.current.value = "";
    setEditingId(gig.id);
    setFormOpen(true);
    setError("");
    setNotice("");
  }

  async function handleGigVideoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const input = event.currentTarget;
    const chosen = input.files?.[0] ?? null;
    setError("");
    setNotice("");
    setVideoFile(null);
    if (!chosen) return;

    const extension = chosen.name.split(".").pop()?.toLowerCase();
    if (
      !isLiveVideoExtension(extension) ||
      (chosen.type &&
        chosen.type !==
          (extension === "mp4" ? "video/mp4" : "video/webm")) ||
      chosen.size > MAX_GIG_VIDEO_BYTES
    ) {
      setError("Choose an MP4 or WebM video up to 5 GB.");
      input.value = "";
      return;
    }

    setCheckingVideo(true);
    try {
      await verifyVideoHasPicture(chosen);
      setVideoFile(chosen);
    } catch (videoError) {
      setError(getErrorMessage(videoError, "Could not read the selected video."));
      input.value = "";
    } finally {
      setCheckingVideo(false);
    }
  }

  async function saveGig(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checkingVideo) return;
    setSaving(true);
    setUploadProgress(null);
    setUploadStage("");
    setError("");
    setNotice("");

    let uploadedImagePath: string | null = null;
    let uploadedVideoPath: string | null = null;
    const currentGig = editingId
      ? gigs.find((gig) => gig.id === editingId)
      : undefined;
    const oldImagePath = editingId
      ? currentGig?.image_path ?? null
      : null;
    const oldVideoPath = editingId
      ? currentGig?.video_path ?? null
      : null;
    const values = {
      date: draft.date,
      title: draft.title.trim(),
      venue: draft.venue.trim(),
      city: draft.city.trim(),
      ticket_url: draft.ticket_url.trim() || null,
    };

    try {
      if (videoFile) {
        const extension = videoFile.name.split(".").pop()?.toLowerCase();
        if (
          !isLiveVideoExtension(extension) ||
          (videoFile.type &&
            videoFile.type !==
              (extension === "mp4" ? "video/mp4" : "video/webm")) ||
          videoFile.size > MAX_GIG_VIDEO_BYTES
        ) {
          throw new Error("Choose an MP4 or WebM video up to 5 GB.");
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error("Please sign in again to upload a gig video.");

        const controller = new AbortController();
        uploadController.current = controller;
        setCanCancelUpload(true);
        setUploadStage("Preparing video upload...");
        const uploadedVideo = await uploadVideoToR2(
          videoFile,
          session.access_token,
          controller.signal,
          setUploadProgress,
          (request) => {
            uploadRequest.current = request;
            setCanCancelUpload(request !== null);
            if (request) setUploadStage("Uploading event video...");
          }
        );
        uploadedVideoPath = uploadedVideo.filePath;
        uploadRequest.current = null;
        setCanCancelUpload(false);
        setUploadStage("Saving gig details...");
      }

      if (imageFile) {
        const extension = imageFile.name.split(".").pop()?.toLowerCase();
        const validExtension = ["jpg", "jpeg", "png", "webp"].includes(
          extension ?? ""
        );
        if (
          !validExtension ||
          !IMAGE_TYPES.includes(imageFile.type) ||
          imageFile.size > MAX_IMAGE_BYTES
        ) {
          throw new Error("Choose a JPG, PNG, or WebP image up to 10 MB.");
        }

        const newImagePath = `${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(newImagePath, imageFile, {
            contentType: imageFile.type,
            cacheControl: "31536000",
            upsert: false,
          });
        if (uploadError) throw uploadError;
        uploadedImagePath = newImagePath;
      }

      const gigValues = {
        ...values,
        ...(uploadedImagePath ? { image_path: uploadedImagePath } : {}),
        ...(uploadedVideoPath ? { video_path: uploadedVideoPath } : {}),
      };
      const result = editingId
        ? await supabase
            .from("gigs")
            .update(gigValues)
            .eq("id", editingId)
            .select("id")
            .maybeSingle()
        : await supabase.from("gigs").insert(gigValues).select("id").single();

      if (result.error) throw result.error;
      if (!result.data) {
        throw new Error(
          "Gig was not saved. Check the gigs table's admin write policies."
        );
      }

      if (uploadedImagePath) setImageFile(null);
      if (uploadedVideoPath) {
        setVideoFile(null);
        if (videoFileInput.current) videoFileInput.current.value = "";
      }
      setFormOpen(false);
      setEditingId(null);
      setDraft(emptyDraft);
      setNotice(editingId ? "Gig updated." : "Gig added.");
      await loadGigs();

      if (uploadedImagePath && oldImagePath) {
        const { error: cleanupError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .remove([oldImagePath]);
        if (cleanupError) {
          setError(
            `Gig saved, but the previous image could not be removed: ${cleanupError.message}`
          );
        }
      }
      if (uploadedVideoPath && oldVideoPath) {
        try {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!session) throw new Error("Please sign in again to remove the old video.");
          await deleteGigVideo(oldVideoPath, session.access_token);
        } catch (cleanupError) {
          setError(
            `Gig saved, but its previous video could not be deleted: ${getErrorMessage(cleanupError, "Unknown error.")}`
          );
        }
      }
    } catch (saveError) {
      if (uploadedImagePath) {
        const { error: cleanupError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .remove([uploadedImagePath]);
        if (cleanupError) {
          console.error("Could not remove unused gig image:", cleanupError.message);
        }
      }
      if (uploadedVideoPath) {
        try {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!session) throw new Error("Session expired before video cleanup.");
          await deleteGigVideo(uploadedVideoPath, session.access_token);
        } catch (cleanupError) {
          console.error("Could not remove unused gig video:", cleanupError);
        }
      }
      setError(getErrorMessage(saveError, "Could not save gig."));
    } finally {
      setSaving(false);
      setCanCancelUpload(false);
      setUploadProgress(null);
      setUploadStage("");
      uploadController.current = null;
      uploadRequest.current = null;
    }
  }

  function cancelVideoUpload() {
    setCanCancelUpload(false);
    setUploadStage("Canceling video upload...");
    uploadController.current?.abort();
    uploadRequest.current?.abort();
  }

  async function removeGig(gig: Gig) {
    if (
      !window.confirm(
        `Remove "${gig.title}" from the gigs list? This permanently deletes it.`
      )
    ) {
      return;
    }

    setRemovingId(gig.id);
    setError("");
    setNotice("");

    try {
      const { data, error: removeError } = await supabase
        .from("gigs")
        .delete()
        .eq("id", gig.id)
        .select("id")
        .maybeSingle();

      if (removeError) throw removeError;
      if (!data) {
        throw new Error(
          "Gig was not removed. Check the gigs table's admin delete policy."
        );
      }

      setGigs((current) => current.filter((item) => item.id !== gig.id));
      setNotice("Gig removed.");
      if (gig.image_path) {
        const { error: imageError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .remove([gig.image_path]);
        if (imageError) {
          setError(
            `Gig removed, but its image could not be deleted: ${imageError.message}`
          );
        }
      }
      if (gig.video_path) {
        try {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!session) throw new Error("Please sign in again to delete the video.");
          await deleteGigVideo(gig.video_path, session.access_token);
        } catch (videoError) {
          setError(
            `Gig removed, but its video could not be deleted: ${getErrorMessage(videoError, "Unknown error.")}`
          );
        }
      }
    } catch (removeError) {
      setError(getErrorMessage(removeError, "Could not remove gig."));
    } finally {
      setRemovingId(null);
    }
  }

  if (access === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08070b] text-white">
        Checking admin access...
      </main>
    );
  }

  if (access !== "ready") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08070b] px-6 text-white">
        <section className="max-w-md border border-white/10 bg-white/[0.03] p-8">
          <h1 className="text-2xl font-black">
            {access === "denied" ? "Not authorized" : "Please sign in first"}
          </h1>
          <p className="mt-3 text-sm text-white/55">
            {access === "denied"
              ? error || "This account isn't an administrator."
              : "Sign in with your authorized administrator account to manage gigs."}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block bg-purple-600 px-5 py-3 text-sm font-bold hover:bg-purple-500"
          >
            Go to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08070b] px-6 py-10 text-white sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-purple-300 hover:text-purple-200"
          >
            ← Back to dashboard
          </Link>
          <button
            onClick={startNewGig}
            className="bg-purple-600 px-5 py-3 text-sm font-bold hover:bg-purple-500"
          >
            Add a gig
          </button>
        </div>

        <p className="mt-10 text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
          DJ Murphy · Management
        </p>
        <h1 className="mt-3 text-4xl font-black">Upcoming gigs</h1>
        <p className="mt-3 text-white/50">
          Add confirmed shows here. Future gigs appear automatically on the
          public Gigs page.
        </p>

        {error && (
          <p role="alert" className="mt-6 border border-red-400/30 p-4 text-sm text-red-300">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-6 border border-green-400/30 p-4 text-sm text-green-300">
            {notice}
          </p>
        )}

        {formOpen && (
          <form
            onSubmit={saveGig}
            className="mt-8 space-y-5 border border-white/10 bg-white/[0.03] p-6"
          >
            <h2 className="text-xl font-bold">
              {editingId ? "Edit gig" : "Add a gig"}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm text-white/70">
                Date *
                <input
                  type="date"
                  required
                  value={draft.date}
                  onChange={(event) =>
                    setDraft({ ...draft, date: event.target.value })
                  }
                  className="mt-2 w-full border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-400"
                />
              </label>
              {checkingVideo && (
                <p className="text-sm text-purple-200" role="status">
                  Checking that this file contains playable video...
                </p>
              )}
              <label className="block text-sm text-white/70">
                Event name *
                <input
                  required
                  maxLength={120}
                  value={draft.title}
                  onChange={(event) =>
                    setDraft({ ...draft, title: event.target.value })
                  }
                  placeholder="Summer festival"
                  className="mt-2 w-full border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-400"
                />
              </label>
              <label className="block text-sm text-white/70">
                Venue *
                <input
                  required
                  maxLength={120}
                  value={draft.venue}
                  onChange={(event) =>
                    setDraft({ ...draft, venue: event.target.value })
                  }
                  placeholder="The Grand Hall"
                  className="mt-2 w-full border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-400"
                />
              </label>
              <label className="block text-sm text-white/70">
                City *
                <input
                  required
                  maxLength={120}
                  value={draft.city}
                  onChange={(event) =>
                    setDraft({ ...draft, city: event.target.value })
                  }
                  placeholder="Berlin"
                  className="mt-2 w-full border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-400"
                />
              </label>
            </div>
            <label className="block text-sm text-white/70">
              Ticket link
              <input
                type="url"
                maxLength={2048}
                value={draft.ticket_url}
                onChange={(event) =>
                  setDraft({ ...draft, ticket_url: event.target.value })
                }
                placeholder="https://..."
                className="mt-2 w-full border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-400"
              />
            </label>
            <label className="block text-sm text-white/70">
              Event image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  setError("");
                  setImageFile(event.target.files?.[0] ?? null);
                }}
                className="mt-2 block w-full text-sm text-white/70 file:mr-4 file:border-0 file:bg-purple-600 file:px-4 file:py-3 file:font-bold file:text-white hover:file:bg-purple-500"
              />
              <span className="mt-2 block text-xs text-white/40">
                JPG, PNG, or WebP, up to 10 MB.
                {editingId &&
                  gigs.find((gig) => gig.id === editingId)?.image_path &&
                  !imageFile &&
                  " Choose a new image to replace the current one."}
              </span>
            </label>
            <label className="block text-sm text-white/70">
              Event video (optional)
              <input
                ref={videoFileInput}
                type="file"
                accept="video/mp4,video/webm,.mp4,.webm"
                onChange={(event) => void handleGigVideoChange(event)}
                className="mt-2 block w-full text-sm text-white/70 file:mr-4 file:border-0 file:bg-purple-600 file:px-4 file:py-3 file:font-bold file:text-white hover:file:bg-purple-500"
              />
              <span className="mt-2 block text-xs text-white/40">
                MP4 or WebM with a visible video track, up to 5 GB. H.264/AAC
                MP4 is recommended.
                {editingId &&
                  gigs.find((gig) => gig.id === editingId)?.video_path &&
                  !videoFile &&
                  " Choose another video to replace the current one."}
              </span>
            </label>
            {videoFile && (
              <p className="text-xs text-white/50">
                {videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
            {saving && uploadStage && (
              <div className="space-y-2" role="status" aria-live="polite">
                <div className="flex items-center justify-between gap-3 text-xs text-white/60">
                  <span>{uploadStage}</span>
                  {uploadProgress !== null && <span>{uploadProgress}%</span>}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  {uploadProgress === null ? (
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-purple-400" />
                  ) : (
                    <div
                      className="h-full rounded-full bg-purple-500 transition-[width] duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving && !canCancelUpload}
                className="bg-purple-600 px-5 py-3 text-sm font-bold hover:bg-purple-500 disabled:opacity-50"
              >
                {saving
                  ? uploadStage || "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add gig"}
              </button>
              <button
                type="button"
                onClick={saving && canCancelUpload
                  ? cancelVideoUpload
                  : () => setFormOpen(false)}
                disabled={saving || checkingVideo}
                className="border border-white/15 px-5 py-3 text-sm hover:border-white/40"
              >
                {saving && canCancelUpload ? "Cancel upload" : "Cancel"}
              </button>
            </div>
          </form>
        )}

        {gigs.length === 0 ? (
          <p className="mt-8 border border-white/10 bg-white/[0.03] p-6 text-white/60">
            No gigs yet. Add your first confirmed event above.
          </p>
        ) : (
          <ul className="mt-8 space-y-4">
            {gigs.map((gig) => (
              <li
                key={gig.id}
                className="flex flex-wrap items-center justify-between gap-5 border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-5">
                  {gig.image_path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        supabase.storage
                          .from(IMAGE_BUCKET)
                          .getPublicUrl(gig.image_path).data.publicUrl
                      }
                      alt={`${gig.title} event`}
                      className="h-20 w-28 rounded-lg object-cover"
                    />
                  )}
                  <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-purple-300">
                    {new Date(`${gig.date}T00:00:00`).toLocaleDateString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                  <h2 className="mt-2 text-lg font-bold">{gig.title}</h2>
                  <p className="mt-1 text-sm text-white/50">
                    {gig.venue} · {gig.city}
                  </p>
                  {gig.video_path && (
                    <p className="mt-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                      Event video added
                    </p>
                  )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => startEditing(gig)}
                    className="border border-white/15 px-4 py-2 text-sm hover:border-purple-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void removeGig(gig)}
                    disabled={removingId === gig.id}
                    className="border border-red-400/30 px-4 py-2 text-sm text-red-300 hover:border-red-300 disabled:opacity-50"
                  >
                    {removingId === gig.id ? "Removing..." : "Cancel gig"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function verifyVideoHasPicture(file: File) {
  const video = document.createElement("video");
  const objectUrl = URL.createObjectURL(file);
  video.preload = "metadata";

  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      finish(
        () =>
          reject(
            new Error(
              "The browser could not inspect this video. Export it as MP4 (H.264 video with AAC audio) and try again."
            )
          )
      );
    }, 15000);

    const finish = (callback: () => void) => {
      window.clearTimeout(timeout);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(objectUrl);
      callback();
    };

    video.addEventListener(
      "loadedmetadata",
      () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          finish(resolve);
        } else {
          finish(() =>
            reject(
              new Error(
                "This file has audio but no visible video track. Choose a video recording, or export as MP4 (H.264/AAC)."
              )
            )
          );
        }
      },
      { once: true }
    );
    video.addEventListener(
      "error",
      () => {
        finish(() =>
          reject(
            new Error(
              "This browser cannot decode the selected video. Re-export it as MP4 using H.264 video and AAC audio."
            )
          )
        );
      },
      { once: true }
    );

    video.src = objectUrl;
  });
}

async function uploadVideoToR2(
  file: File,
  accessToken: string,
  signal: AbortSignal,
  onProgress: (progress: number) => void,
  onRequest: (request: XMLHttpRequest | null) => void
): Promise<VideoUpload> {
  const response = await fetch("/api/mixes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      kind: "video",
      fileName: file.name,
      sizeBytes: file.size,
    }),
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      body &&
        typeof body === "object" &&
        "error" in body &&
        typeof body.error === "string"
        ? body.error
        : "Could not prepare the gig video upload."
    );
  }
  if (!isVideoUpload(body)) {
    throw new Error("The server returned an invalid video upload response.");
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        onRequest(null);
        callback();
      };

      request.open("PUT", body.uploadUrl);
      request.setRequestHeader("Content-Type", body.contentType);
      onRequest(request);
      request.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      request.addEventListener("load", () => {
        if (request.status >= 200 && request.status < 300) {
          onProgress(100);
          finish(resolve);
        } else {
          finish(() =>
            reject(
              new Error(
                `R2 video upload failed (${request.status}). Check the R2 bucket CORS settings.`
              )
            )
          );
        }
      });
      request.addEventListener("error", () =>
        finish(
          () =>
            reject(
              new Error(
                "Network or CORS error uploading the event video to R2."
              )
            )
        )
      );
      request.addEventListener("abort", () =>
        finish(() => reject(new Error("Gig video upload canceled.")))
      );
      if (signal.aborted) {
        request.abort();
        return;
      }
      signal.addEventListener("abort", () => request.abort(), { once: true });
      request.send(file);
    });
  } catch (uploadError) {
    try {
      await deleteGigVideo(body.filePath, accessToken);
    } catch (cleanupError) {
      throw new Error(
        `${getErrorMessage(uploadError, "Video upload failed.")} The partial video could not be removed from R2: ${getErrorMessage(cleanupError, "Unknown cleanup error.")}`
      );
    }
    throw uploadError;
  }

  return body;
}

function isVideoUpload(value: unknown): value is VideoUpload {
  return (
    !!value &&
    typeof value === "object" &&
    "uploadUrl" in value &&
    typeof value.uploadUrl === "string" &&
    "filePath" in value &&
    typeof value.filePath === "string" &&
    value.filePath.startsWith("r2/videos/") &&
    "contentType" in value &&
    typeof value.contentType === "string" &&
    "kind" in value &&
    value.kind === "video"
  );
}

async function deleteGigVideo(filePath: string, accessToken: string) {
  const response = await fetch("/api/mixes", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filePath }),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new Error(
      body &&
        typeof body === "object" &&
        "error" in body &&
        typeof body.error === "string"
        ? body.error
        : "Could not delete the gig video from R2."
    );
  }
}
