"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  isMixArtworkExtension,
  isMixAudioExtension,
  MAX_MIX_ARTWORK_BYTES,
  MAX_MIX_AUDIO_BYTES,
} from "@/lib/mix-upload";

const BUCKET = "mixes";

type R2Upload = {
  uploadUrl: string;
  filePath: string;
  contentType: string;
  kind: "audio" | "artwork";
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

export default function ManageMixesPage() {
  const [access, setAccess] = useState<Access>("checking");
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [artwork, setArtwork] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

      await loadMixes();
      if (active) setAccess("ready");
    }

    void check();
    return () => {
      active = false;
    };
  }, [loadMixes]);

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
    if (!file || uploading) return;

    setUploading(true);
    setError("");
    setNotice("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Please sign in again to upload a mix.");

      const signResponse = await fetch("/api/mixes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
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
      if (!isR2Upload(signBody) || signBody.kind !== "audio") {
        throw new Error("The server returned an invalid upload response.");
      }

      const { uploadUrl, filePath, contentType } = signBody;
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error(
          `R2 upload failed (${uploadResponse.status}). Check the bucket CORS settings and try again.`
        );
      }

      let artworkUpload: R2Upload | null = null;
      try {
        if (artwork) {
          artworkUpload = await uploadToR2(
            artwork,
            "artwork",
            session.access_token
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
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
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
          Upload an MP3, M4A, or AAC mix directly to Cloudflare R2 (up to 5 GB).
          Visitors can play it on the Mixes page.
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

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full bg-purple-600 px-5 py-3 font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Uploading... keep this tab open" : "Upload mix"}
          </button>
        </form>

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
    (value.kind === "audio" || value.kind === "artwork")
  );
}

async function uploadToR2(
  file: File,
  kind: R2Upload["kind"],
  accessToken: string
): Promise<R2Upload> {
  const signResponse = await fetch("/api/mixes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
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

  const uploadResponse = await fetch(signBody.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": signBody.contentType },
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error(
      `R2 ${kind} upload failed (${uploadResponse.status}). Check the bucket CORS settings and try again.`
    );
  }
  return signBody;
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