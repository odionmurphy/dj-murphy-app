"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  isMixArtworkExtension,
  isMixAudioExtension,
  MAX_MIX_ARTWORK_BYTES,
  MAX_MIX_AUDIO_BYTES,
} from "@/lib/mix-upload";
import {
  isLiveVideoExtension,
  MAX_LIVE_VIDEO_BYTES,
} from "@/lib/video-upload";

const BUCKET = "mixes";
const VIDEO_TABLE = "mix_videos";

type R2Upload = {
  uploadUrl: string;
  filePath: string;
  contentType: string;
  kind: "audio" | "artwork" | "video";
};

type Mix = {
  id: string;
  title: string;
  genre: string | null;
  description: string | null;
  file_path: string;
  artwork_path: string | null;
  size_bytes: number | null;
  created_at: string;
};

type Access = "checking" | "signed-out" | "denied" | "ready";

type LiveVideo = {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  size_bytes: number;
  created_at: string;
};

export default function ManageMixesPage() {
  const videoFileInput = useRef<HTMLInputElement | null>(null);
  const activeUploadRequest = useRef<XMLHttpRequest | null>(null);
  const uploadAbortController = useRef<AbortController | null>(null);
  const activeVideoUploadRequest = useRef<XMLHttpRequest | null>(null);
  const videoUploadAbortController = useRef<AbortController | null>(null);
  const [access, setAccess] = useState<Access>("checking");
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [videos, setVideos] = useState<LiveVideo[]>([]);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [artwork, setArtwork] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [canCancelUpload, setCanCancelUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStage, setUploadStage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(
    null
  );
  const [videoUploadStage, setVideoUploadStage] = useState("");
  const [canCancelVideoUpload, setCanCancelVideoUpload] = useState(false);
  const [removingVideoId, setRemovingVideoId] = useState<string | null>(null);

  const loadMixes = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("mixes")
      .select("*")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
      return;
    }
    setMixes((data ?? []) as Mix[]);
  }, []);

  const loadVideos = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from(VIDEO_TABLE)
      .select("id, title, description, file_path, size_bytes, created_at")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(
        `${loadError.message}. If this is the first video upload, run the mix video setup migration in Supabase.`
      );
      return;
    }

    setVideos((data ?? []) as LiveVideo[]);
  }, []);

  useEffect(() => {
    let active = true;

    async function check() {
      const { data } = await supabase.auth.getSession();

      if (!active) return;
      if (!data.session) {
        setAccess("signed-out");
        return;
      }

      const { data: membership } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      if (!active) return;
      if (!membership) {
        setAccess("denied");
        return;
      }

      await Promise.all([loadMixes(), loadVideos()]);
      if (active) setAccess("ready");
    }

    void check();
    return () => {
      active = false;
    };
  }, [loadMixes, loadVideos]);

  function handleVideoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setNotice("");
    const chosen = event.target.files?.[0] ?? null;
    if (!chosen) {
      setVideoFile(null);
      return;
    }

    const extension = chosen.name.split(".").pop()?.toLowerCase();
    if (!isLiveVideoExtension(extension)) {
      setError("Please choose an MP4 or WebM video file.");
      event.target.value = "";
      setVideoFile(null);
      return;
    }
    if (
      chosen.type &&
      chosen.type !== (extension === "mp4" ? "video/mp4" : "video/webm")
    ) {
      setError("The selected video type does not match its file extension.");
      event.target.value = "";
      setVideoFile(null);
      return;
    }
    if (chosen.size > MAX_LIVE_VIDEO_BYTES) {
      setError("Live-set videos must be 5 GB or smaller.");
      event.target.value = "";
      setVideoFile(null);
      return;
    }

    setVideoFile(chosen);
  }

  async function handleVideoUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!videoFile || videoUploading || uploading) return;

    const controller = new AbortController();
    videoUploadAbortController.current = controller;
    setVideoUploading(true);
    setCanCancelVideoUpload(true);
    setVideoUploadProgress(0);
    setVideoUploadStage("Preparing video upload...");
    setError("");
    setNotice("");

    let uploadedVideo: R2Upload | null = null;
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Please sign in again to upload a live set.");

      setVideoUploadStage("Uploading live-set video...");
      uploadedVideo = await uploadToR2(
        videoFile,
        "video",
        session.access_token,
        setVideoUploadProgress,
        (request) => {
          activeVideoUploadRequest.current = request;
          setCanCancelVideoUpload(request !== null);
        },
        controller.signal
      );

      setVideoUploadStage("Saving live-set details...");
      setVideoUploadProgress(null);
      const { data, error: insertError } = await supabase
        .from(VIDEO_TABLE)
        .insert({
          title: videoTitle.trim(),
          description: videoDescription.trim() || null,
          file_path: uploadedVideo.filePath,
          size_bytes: videoFile.size,
        })
        .select("id, title, description, file_path, size_bytes, created_at")
        .single();

      if (insertError) throw insertError;
      if (!data) throw new Error("The video uploaded but its details were not saved.");

      setVideos((current) => [data as LiveVideo, ...current]);
      setVideoTitle("");
      setVideoDescription("");
      setVideoFile(null);
      if (videoFileInput.current) videoFileInput.current.value = "";
      setNotice("Live-set video is now featured on the Mixes page.");
    } catch (uploadError) {
      if (uploadedVideo) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            await deleteR2File(uploadedVideo.filePath, session.access_token);
          }
        } catch (cleanupError) {
          console.error("Could not clean up an unlisted live-set video:", cleanupError);
        }
      }
      setError(
        controller.signal.aborted
          ? "Live-set video upload canceled."
          : uploadError instanceof Error
            ? uploadError.message
            : "Could not upload the live-set video."
      );
    } finally {
      setVideoUploading(false);
      setCanCancelVideoUpload(false);
      setVideoUploadProgress(null);
      setVideoUploadStage("");
      activeVideoUploadRequest.current = null;
      videoUploadAbortController.current = null;
    }
  }

  function cancelVideoUpload() {
    setCanCancelVideoUpload(false);
    setVideoUploadStage("Canceling video upload...");
    videoUploadAbortController.current?.abort();
    activeVideoUploadRequest.current?.abort();
  }

  async function handleDeleteVideo(video: LiveVideo) {
    if (!window.confirm(`Delete "${video.title}"? This can't be undone.`)) return;

    setError("");
    setNotice("");
    setRemovingVideoId(video.id);

    const { data, error: rowError } = await supabase
      .from(VIDEO_TABLE)
      .delete()
      .eq("id", video.id)
      .select("id")
      .maybeSingle();

    if (rowError) {
      setError(rowError.message);
      setRemovingVideoId(null);
      return;
    }
    if (!data) {
      setError("The live-set entry was not deleted. Check admin permissions.");
      setRemovingVideoId(null);
      return;
    }

    setVideos((current) => current.filter((item) => item.id !== video.id));
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Please sign in again to delete the video file.");
      await deleteR2File(video.file_path, session.access_token);
      setNotice("Live-set video deleted.");
    } catch (deleteError) {
      setError(
        `The live-set was removed from the page, but its video file could not be deleted: ${
          deleteError instanceof Error ? deleteError.message : "Unknown error"
        }`
      );
    } finally {
      setRemovingVideoId(null);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setNotice("");
    const chosen = event.target.files?.[0] ?? null;

    const extension = chosen?.name.split(".").pop()?.toLowerCase();
    if (chosen && !isMixAudioExtension(extension)) {
      setError("Please choose an MP3, M4A, or AAC audio file.");
      event.target.value = "";
      setFile(null);
      return;
    }

    if (chosen?.type && !chosen.type.startsWith("audio/")) {
      setError("Please choose an audio file.");
      event.target.value = "";
      setFile(null);
      return;
    }

    if (chosen && chosen.size > MAX_MIX_AUDIO_BYTES) {
      setError(
        `That file is ${(chosen.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 GB.`
      );
      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(chosen);
  }

  function handleArtworkChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setNotice("");
    const chosen = event.target.files?.[0] ?? null;
    const extension = chosen?.name.split(".").pop()?.toLowerCase();

    if (chosen && !isMixArtworkExtension(extension)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      setArtwork(null);
      return;
    }

    if (chosen?.type && !chosen.type.startsWith("image/")) {
      setError("Please choose an image file.");
      event.target.value = "";
      setArtwork(null);
      return;
    }

    if (chosen && chosen.size > MAX_MIX_ARTWORK_BYTES) {
      setError("Cover image must be 10 MB or smaller.");
      event.target.value = "";
      setArtwork(null);
      return;
    }

    setArtwork(chosen);
  }

  async function handleExistingArtworkChange(
    event: React.ChangeEvent<HTMLInputElement>,
    mix: Mix
  ) {
    setError("");
    setNotice("");
    const image = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!image) return;

    const extension = image.name.split(".").pop()?.toLowerCase();
    if (!isMixArtworkExtension(extension) || !image.type.startsWith("image/")) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (image.size > MAX_MIX_ARTWORK_BYTES) {
      setError("Cover image must be 10 MB or smaller.");
      return;
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Please sign in again to upload a cover.");

      const upload = await uploadToR2(image, "artwork", session.access_token);
      const { data, error: updateError } = await supabase
        .from("mixes")
        .update({ artwork_path: upload.filePath })
        .eq("id", mix.id)
        .select("id")
        .maybeSingle();

      if (updateError || !data) {
        try {
          await deleteR2File(upload.filePath, session.access_token);
        } catch (cleanupError) {
          console.error("Could not clean up an unassigned cover image:", cleanupError);
        }
        throw updateError ?? new Error("The cover image was not saved.");
      }

      setMixes((current) =>
        current.map((item) =>
          item.id === mix.id
            ? { ...item, artwork_path: upload.filePath }
            : item
        )
      );

      if (mix.artwork_path?.startsWith("r2/")) {
        try {
          await deleteR2File(mix.artwork_path, session.access_token);
        } catch (cleanupError) {
          setNotice(
            `Cover updated, but the previous image could not be deleted: ${
              cleanupError instanceof Error
                ? cleanupError.message
                : "Unknown error"
            }`
          );
          return;
        }
      }

      setNotice(`Cover image updated for "${mix.title}".`);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not update the cover image."
      );
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || uploading || videoUploading) return;

    const abortController = new AbortController();
    uploadAbortController.current = abortController;
    setUploading(true);
    setCanCancelUpload(true);
    setUploadProgress(0);
    setUploadStage("Preparing audio upload...");
    setError("");
    setNotice("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Please sign in again to upload a mix.");
      if (abortController.signal.aborted) {
        throw new Error("Upload canceled.");
      }

      const signResponse = await fetch("/api/mixes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        signal: abortController.signal,
        body: JSON.stringify({
          kind: "audio",
          fileName: file.name,
          sizeBytes: file.size,
        }),
      });
      const signBody: unknown = await signResponse.json();
      if (!signResponse.ok) {
        throw new Error(getErrorMessage(signBody, "Could not prepare the upload."));
      }
      if (abortController.signal.aborted) {
        throw new Error("Upload canceled.");
      }
      if (!isR2Upload(signBody) || signBody.kind !== "audio") {
        throw new Error("The server returned an invalid upload response.");
      }

      const { uploadUrl, filePath, contentType } = signBody;
      setUploadStage("Uploading audio...");
      try {
        await uploadFileWithProgress(
          uploadUrl,
          contentType,
          file,
          setUploadProgress,
          "audio",
          (request) => {
            activeUploadRequest.current = request;
            setCanCancelUpload(request !== null);
          }
        );
      } catch (uploadError) {
        try {
          await deleteR2File(filePath, session.access_token);
        } catch (cleanupError) {
          console.error(
            "Could not clean up an interrupted R2 mix upload:",
            cleanupError
          );
        }
        throw uploadError;
      }

      let artworkUpload: R2Upload | null = null;
      try {
        if (artwork) {
          setUploadStage("Uploading cover image...");
          setUploadProgress(0);
          setCanCancelUpload(true);
          artworkUpload = await uploadToR2(
            artwork,
            "artwork",
            session.access_token,
            setUploadProgress,
            (request) => {
              activeUploadRequest.current = request;
              setCanCancelUpload(request !== null);
            },
            abortController.signal
          );
        }
      } catch (artworkError) {
        try {
          await deleteR2File(filePath, session.access_token);
        } catch (cleanupError) {
          console.error("Could not clean up audio after cover upload failed:", cleanupError);
        }
        throw artworkError;
      }

      setUploadStage("Saving mix details...");
      setUploadProgress(null);
      const { error: insertError } = await supabase.from("mixes").insert({
        title: title.trim(),
        genre: genre.trim() || null,
        description: description.trim() || null,
        file_path: filePath,
        artwork_path: artworkUpload?.filePath ?? null,
        size_bytes: file.size,
      });

      if (insertError) {
        try {
          await deleteR2File(filePath, session.access_token);
          if (artworkUpload) {
            await deleteR2File(artworkUpload.filePath, session.access_token);
          }
        } catch (cleanupError) {
          console.error("Could not clean up unlisted R2 mix files:", cleanupError);
          throw new Error(
            `${insertError.message} Some uploaded files could not be removed from R2.`
          );
        }
        throw insertError;
      }

      setTitle("");
      setGenre("");
      setDescription("");
      setFile(null);
      setArtwork(null);
      (event.target as HTMLFormElement).reset();
      setNotice("Mix uploaded. It is now live on the Mixes page.");
      await loadMixes();
    } catch (err) {
      setError(
        abortController.signal.aborted
          ? "Upload canceled."
          : err instanceof Error
            ? err.message
            : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
      setUploadProgress(null);
      setUploadStage("");
      setCanCancelUpload(false);
      activeUploadRequest.current = null;
      uploadAbortController.current = null;
    }
  }

  function cancelUpload() {
    setCanCancelUpload(false);
    setUploadStage("Canceling upload...");
    uploadAbortController.current?.abort();
    activeUploadRequest.current?.abort();
  }

  async function handleDelete(mix: Mix) {
    if (!window.confirm(`Delete "${mix.title}"? This can't be undone.`)) return;

    setError("");
    setNotice("");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      setError(sessionError.message);
      return;
    }

    // Row first: if the file removal fails later, you only have a harmless leftover file
    const { error: rowError } = await supabase
      .from("mixes")
      .delete()
      .eq("id", mix.id);

    if (rowError) {
      setError(rowError.message);
      return;
    }

    setMixes((current) => current.filter((m) => m.id !== mix.id));

    try {
      if (mix.file_path.startsWith("r2/")) {
        if (!session) throw new Error("Your session expired before the file was removed.");
        await deleteR2File(mix.file_path, session.access_token);
      } else {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove([mix.file_path]);
        if (removeError) throw removeError;
      }
      if (mix.artwork_path?.startsWith("r2/")) {
        if (!session) {
          throw new Error("Your session expired before the cover image was removed.");
        }
        await deleteR2File(mix.artwork_path, session.access_token);
      }
      setNotice("Mix deleted.");
    } catch (removeError) {
      setError(
        `The mix was removed from the list, but its audio file could not be deleted: ${
          removeError instanceof Error
            ? removeError.message
            : "Unknown error"
        }`
      );
    }
  }

  if (access === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08070b] text-white">
        Checking admin access...
      </div>
    );
  }

  if (access !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08070b] px-6 text-white">
        <div className="max-w-md border border-white/10 bg-white/[0.03] p-8">
          <h1 className="text-2xl font-black">
            {access === "denied" ? "Not authorized" : "Please sign in first"}
          </h1>
          <p className="mt-3 text-sm text-white/55">
            {access === "denied"
              ? "This account isn't an administrator."
              : "Sign in on the dashboard, then come back to this page."}
          </p>
          <a
            href="/dashboard"
            className="mt-6 inline-block bg-purple-600 px-5 py-3 text-sm font-bold hover:bg-purple-500"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08070b] px-6 py-10 text-white sm:px-10">
      <div className="mx-auto max-w-4xl">
        <a href="/dashboard" className="text-sm text-purple-300 hover:text-purple-200">
          ← Back to dashboard
        </a>

        <p className="mt-10 text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
          DJ Murphy · Management
        </p>
        <h1 className="mt-3 text-4xl font-black">Mixes</h1>
        <p className="mt-3 text-white/50">
          Upload audio mixes and live-set videos directly to Cloudflare R2.
          They appear on the Mixes page after upload.
        </p>

        {error && (
          <p role="alert" className="mt-6 border border-red-400/30 p-4 text-sm text-red-300">
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-6 border border-green-400/30 p-4 text-sm text-green-300">
            {notice}
          </p>
        )}

        <form
          onSubmit={handleUpload}
          className="mt-8 space-y-5 border border-white/10 bg-white/[0.03] p-6"
        >
          <label className="block text-sm text-white/70">
            Title *
            <input
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Afro Sunset Mix Vol. 1"
              className="mt-2 w-full border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-400"
            />
          </label>

          <label className="block text-sm text-white/70">
            Genre
            <input
              maxLength={80}
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Afrobeat · Amapiano"
              className="mt-2 w-full border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-400"
            />
          </label>

          <label className="block text-sm text-white/70">
            Description
            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Recorded live at..."
              className="mt-2 w-full resize-y border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-400"
            />
          </label>

          <label className="block text-sm text-white/70">
            Cover image (optional)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={handleArtworkChange}
              className="mt-2 block w-full text-sm text-white/70 file:mr-4 file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-purple-500"
            />
          </label>

          {artwork && (
            <p className="text-xs text-white/50">
              {artwork.name} · {(artwork.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}

          <label className="block text-sm text-white/70">
            Audio file *
            <input
              type="file"
              required
              accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a,.aac"
              onChange={handleFileChange}
              className="mt-2 block w-full text-sm text-white/70 file:mr-4 file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-purple-500"
            />
          </label>

          {file && (
            <p className="text-xs text-white/50">
              {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}

          {uploading && (
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

          <button
            type="submit"
            disabled={uploading || videoUploading || !file}
            className="w-full bg-purple-600 px-5 py-3 font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading
              ? uploadProgress === null
                ? uploadStage
                : `Uploading... ${uploadProgress}%`
              : "Upload mix"}
          </button>
          {uploading && canCancelUpload && (
            <button
              type="button"
              onClick={cancelUpload}
              className="w-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-red-400/50 hover:text-red-300"
            >
              Cancel upload
            </button>
          )}
        </form>

        <section className="mt-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
            Promote a performance
          </p>
          <h2 className="mt-3 text-2xl font-black">Add a live-set video</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Upload an MP4 or WebM recording. For widest desktop and phone
            compatibility, use MP4 with H.264 video and AAC audio. Maximum file
            size: 5 GB.
          </p>

          <form
            onSubmit={handleVideoUpload}
            className="mt-5 space-y-5 border border-white/10 bg-white/[0.03] p-6"
          >
            <label className="block text-sm text-white/70">
              Video title *
              <input
                required
                maxLength={120}
                value={videoTitle}
                onChange={(event) => setVideoTitle(event.target.value)}
                placeholder="Live at Summer Festival"
                className="mt-2 w-full border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-400"
              />
            </label>

            <label className="block text-sm text-white/70">
              Description (optional)
              <textarea
                rows={3}
                maxLength={500}
                value={videoDescription}
                onChange={(event) => setVideoDescription(event.target.value)}
                placeholder="A highlight from my live set..."
                className="mt-2 w-full resize-y border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-400"
              />
            </label>

            <label className="block text-sm text-white/70">
              Live-set video *
              <input
                ref={videoFileInput}
                type="file"
                required
                accept="video/mp4,video/webm,.mp4,.webm"
                onChange={handleVideoFileChange}
                className="mt-2 block w-full text-sm text-white/70 file:mr-4 file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-purple-500"
              />
            </label>

            {videoFile && (
              <p className="text-xs text-white/50">
                {videoFile.name} ·{" "}
                {(videoFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
            )}

            {videoUploading && (
              <div className="space-y-2" role="status" aria-live="polite">
                <div className="flex items-center justify-between gap-3 text-xs text-white/60">
                  <span>{videoUploadStage}</span>
                  {videoUploadProgress !== null && (
                    <span>{videoUploadProgress}%</span>
                  )}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  {videoUploadProgress === null ? (
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-purple-400" />
                  ) : (
                    <div
                      className="h-full rounded-full bg-purple-500 transition-[width] duration-200"
                      style={{ width: `${videoUploadProgress}%` }}
                    />
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || videoUploading || !videoFile}
              className="w-full bg-purple-600 px-5 py-3 font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {videoUploading
                ? videoUploadProgress === null
                  ? videoUploadStage
                  : `Uploading video... ${videoUploadProgress}%`
                : "Publish live set"}
            </button>
            {videoUploading && canCancelVideoUpload && (
              <button
                type="button"
                onClick={cancelVideoUpload}
                className="w-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-red-400/50 hover:text-red-300"
              >
                Cancel video upload
              </button>
            )}
          </form>
        </section>

        <h2 className="mt-12 text-xl font-bold">
          Live-set videos ({videos.length})
        </h2>
        {videos.length === 0 ? (
          <p className="mt-4 text-sm text-white/50">
            No live-set videos published yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {videos.map((video) => (
              <li
                key={video.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-white/10 p-4"
              >
                <div>
                  <p className="font-bold">{video.title}</p>
                  <p className="text-xs text-white/45">
                    {(video.size_bytes / 1024 / 1024).toFixed(1)} MB · Live set
                  </p>
                </div>
                <button
                  onClick={() => void handleDeleteVideo(video)}
                  disabled={removingVideoId === video.id || videoUploading}
                  className="border border-red-400/40 px-4 py-2 text-sm text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                >
                  {removingVideoId === video.id ? "Deleting..." : "Delete video"}
                </button>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-12 text-xl font-bold">Uploaded mixes ({mixes.length})</h2>

        {mixes.length === 0 ? (
          <p className="mt-4 text-sm text-white/50">Nothing uploaded yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {mixes.map((mix) => (
              <li
                key={mix.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-white/10 p-4"
              >
                <div>
                  <p className="font-bold">{mix.title}</p>
                  <p className="text-xs text-white/45">
                    {mix.genre ? `${mix.genre} · ` : ""}
                    {mix.size_bytes
                      ? `${(mix.size_bytes / 1024 / 1024).toFixed(1)} MB`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer border border-white/15 px-4 py-2 text-sm text-white/75 hover:bg-white/5">
                      {mix.artwork_path ? "Change cover" : "Add cover"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        onChange={(event) =>
                          void handleExistingArtworkChange(event, mix)
                        }
                        className="sr-only"
                      />
                  </label>
                  <button
                      onClick={() => void handleDelete(mix)}
                      className="border border-red-400/40 px-4 py-2 text-sm text-red-300 hover:bg-red-400/10"
                  >
                      Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function isR2Upload(value: unknown): value is R2Upload {
  return (
    !!value &&
    typeof value === "object" &&
    "uploadUrl" in value &&
    typeof value.uploadUrl === "string" &&
    "filePath" in value &&
    typeof value.filePath === "string" &&
    "contentType" in value &&
    typeof value.contentType === "string" &&
    "kind" in value &&
    (value.kind === "audio" ||
      value.kind === "artwork" ||
      value.kind === "video")
  );
}

async function uploadToR2(
  file: File,
  kind: R2Upload["kind"],
  accessToken: string,
  onProgress?: (progress: number) => void,
  onRequest?: (request: XMLHttpRequest | null) => void,
  signal?: AbortSignal
): Promise<R2Upload> {
  const signResponse = await fetch("/api/mixes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      kind,
      fileName: file.name,
      sizeBytes: file.size,
    }),
  });
  const signBody: unknown = await signResponse.json();
  if (!signResponse.ok) {
    throw new Error(
      getErrorMessage(signBody, `Could not prepare ${kind} upload.`)
    );
  }
  if (!isR2Upload(signBody) || signBody.kind !== kind) {
    throw new Error("The server returned an invalid upload response.");
  }

  try {
    await uploadFileWithProgress(
      signBody.uploadUrl,
      signBody.contentType,
      file,
      onProgress,
      kind,
      onRequest
    );
  } catch (uploadError) {
    try {
      await deleteR2File(signBody.filePath, accessToken);
    } catch (cleanupError) {
      const uploadMessage =
        uploadError instanceof Error ? uploadError.message : "Upload failed.";
      throw new Error(
        `${uploadMessage} The uploaded ${kind} file could not be cleaned up: ${
          cleanupError instanceof Error
            ? cleanupError.message
            : "Unknown cleanup error."
        }`
      );
    }
    throw uploadError;
  }
  return signBody;
}

function uploadFileWithProgress(
  url: string,
  contentType: string,
  file: File,
  onProgress: ((progress: number) => void) | undefined,
  kind: R2Upload["kind"],
  onRequest?: (request: XMLHttpRequest | null) => void
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      onRequest?.(null);
      callback();
    };

    request.open("PUT", url);
    request.setRequestHeader("Content-Type", contentType);
    onRequest?.(request);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        finish(resolve);
      } else {
        finish(() => reject(
          new Error(
            `R2 ${kind} upload failed (${request.status}). Check the bucket CORS settings and try again.`
          )
        ));
      }
    });
    request.addEventListener("error", () =>
      finish(() => reject(
        new Error(
          `Network or CORS error while uploading ${kind} to R2. Check the bucket CORS allowed origin and retry.`
        )
      ))
    );
    request.addEventListener("abort", () =>
      finish(() => reject(new Error(`The ${kind} upload was canceled.`)))
    );
    request.send(file);
  });
}

function getErrorMessage(value: unknown, fallback: string): string {
  if (
    value &&
    typeof value === "object" &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }
  return fallback;
}

async function deleteR2File(filePath: string, accessToken: string) {
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
    throw new Error(getErrorMessage(body, "Could not delete the audio file from R2."));
  }
}