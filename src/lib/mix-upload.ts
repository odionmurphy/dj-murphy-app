export const MAX_MIX_AUDIO_BYTES = 5 * 1024 * 1024 * 1024;

export const MIX_AUDIO_CONTENT_TYPES = {
  aac: "audio/aac",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
} as const;

export type MixAudioExtension = keyof typeof MIX_AUDIO_CONTENT_TYPES;

export function isMixAudioExtension(
  value: string | undefined
): value is MixAudioExtension {
  return value !== undefined && Object.hasOwn(MIX_AUDIO_CONTENT_TYPES, value);
}

export const MAX_MIX_ARTWORK_BYTES = 10 * 1024 * 1024;

export const MIX_ARTWORK_CONTENT_TYPES = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export type MixArtworkExtension = keyof typeof MIX_ARTWORK_CONTENT_TYPES;

export function isMixArtworkExtension(
  value: string | undefined
): value is MixArtworkExtension {
  return value !== undefined && Object.hasOwn(MIX_ARTWORK_CONTENT_TYPES, value);
}
