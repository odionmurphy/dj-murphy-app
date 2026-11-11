import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  isMixArtworkExtension,
  isMixAudioExtension,
  MAX_MIX_ARTWORK_BYTES,
  MAX_MIX_AUDIO_BYTES,
  MIX_ARTWORK_CONTENT_TYPES,
  MIX_AUDIO_CONTENT_TYPES,
} from "@/lib/mix-upload";
import {
  isLiveVideoExtension,
  LIVE_VIDEO_CONTENT_TYPES,
  MAX_LIVE_VIDEO_BYTES,
} from "@/lib/video-upload";

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Cloudflare R2 is not configured on the server.");
  }

  return {
    bucketName,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

async function authorizeAdmin(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { error: "Please sign in as an administrator." },
        { status: 401 }
      ),
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return {
      error: NextResponse.json(
        { error: "Supabase authentication is not configured." },
        { status: 500 }
      ),
    };
  }

  const accessToken = authorization.slice("Bearer ".length);
  const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return {
      error: NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      ),
    };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("Could not verify mix administrator:", adminError.message);
    return {
      error: NextResponse.json(
        { error: "Could not verify administrator access." },
        { status: 500 }
      ),
    };
  }

  if (!admin) {
    return {
      error: NextResponse.json(
        { error: "Administrator access is required." },
        { status: 403 }
      ),
    };
  }

  return { supabase };
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeAdmin(request);
  if ("error" in authorization) return authorization.error;

  const body = await readJson(request);
  if (
    !body ||
    typeof body !== "object" ||
    !("kind" in body) ||
    (body.kind !== "audio" &&
      body.kind !== "artwork" &&
      body.kind !== "video") ||
    !("fileName" in body) ||
    typeof body.fileName !== "string" ||
    body.fileName.length > 255 ||
    !("sizeBytes" in body) ||
    typeof body.sizeBytes !== "number" ||
    !Number.isSafeInteger(body.sizeBytes) ||
    body.sizeBytes <= 0 ||
    body.sizeBytes >
      (body.kind === "audio"
        ? MAX_MIX_AUDIO_BYTES
        : body.kind === "video"
          ? MAX_LIVE_VIDEO_BYTES
          : MAX_MIX_ARTWORK_BYTES)
  ) {
    return NextResponse.json(
      {
        error:
          body &&
          typeof body === "object" &&
          "kind" in body &&
          body.kind === "artwork"
            ? "Choose an image no larger than 10 MB."
            : body &&
                typeof body === "object" &&
                "kind" in body &&
                body.kind === "video"
              ? "Choose an MP4 or WebM video no larger than 5 GB."
              : "Choose an audio file no larger than 5 GB.",
      },
      { status: 400 }
    );
  }

  const extension = body.fileName.split(".").pop()?.toLowerCase();
  let contentType: string;
  if (body.kind === "audio") {
    if (!isMixAudioExtension(extension)) {
      return NextResponse.json(
        { error: "Please choose an MP3, M4A, or AAC audio file." },
        { status: 400 }
      );
    }
    contentType = MIX_AUDIO_CONTENT_TYPES[extension];
  } else if (body.kind === "artwork") {
    if (!isMixArtworkExtension(extension)) {
      return NextResponse.json(
        { error: "Please choose a JPG, PNG, or WebP image." },
        { status: 400 }
      );
    }
    contentType = MIX_ARTWORK_CONTENT_TYPES[extension];
  } else {
    if (!isLiveVideoExtension(extension)) {
      return NextResponse.json(
        { error: "Please choose an MP4 or WebM video." },
        { status: 400 }
      );
    }
    contentType = LIVE_VIDEO_CONTENT_TYPES[extension];
  }
  const filePath = `r2/${body.kind === "artwork" ? "artwork/" : body.kind === "video" ? "videos/" : ""}${crypto.randomUUID()}.${extension}`;

  try {
    if (!process.env.R2_PUBLIC_URL) {
      throw new Error("R2_PUBLIC_URL must be configured before uploading mixes.");
    }

    const { client, bucketName } = getR2Config();
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucketName,
        Key: filePath,
        ContentType: contentType,
      }),
      { expiresIn: 900 }
    );

    return NextResponse.json({ uploadUrl, filePath, contentType, kind: body.kind });
  } catch (error) {
    console.error(
      "Could not create R2 mix upload URL:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not prepare the mix upload.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const authorization = await authorizeAdmin(request);
  if ("error" in authorization) return authorization.error;

  const body = await readJson(request);
  if (
    !body ||
    typeof body !== "object" ||
    !("filePath" in body) ||
    typeof body.filePath !== "string" ||
    !/^r2\/(?:artwork\/|videos\/)?[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(mp3|m4a|aac|jpg|jpeg|png|webp|mp4|webm)$/i.test(
      body.filePath
    )
  ) {
    return NextResponse.json(
      { error: "A valid R2 mix, cover, or video file path is required." },
      { status: 400 }
    );
  }

  try {
    const { client, bucketName } = getR2Config();
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: body.filePath,
      })
    );

    return NextResponse.json({ message: "R2 file deleted." });
  } catch (error) {
    console.error(
      "Could not delete R2 mix audio:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Could not delete the mix audio from R2." },
      { status: 500 }
    );
  }
}
