export const MAX_LIVE_VIDEO_BYTES = 5 * 1024 * 1024 * 1024;

export const LIVE_VIDEO_CONTENT_TYPES = {
  mp4: "video/mp4",
  webm: "video/webm",
} as const;

export type LiveVideoExtension = keyof typeof LIVE_VIDEO_CONTENT_TYPES;

export function isLiveVideoExtension(
  value: string | undefined
): value is LiveVideoExtension {
  return value !== undefined && Object.hasOwn(LIVE_VIDEO_CONTENT_TYPES, value);
}
