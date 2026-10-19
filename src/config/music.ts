import type { BackgroundKey } from "../lib/types";

/** Background music per scene background (files in public/music, made by `npm run music`). */
export const MUSIC_FOR_BACKGROUND: Record<BackgroundKey, string> = {
  stage: "theme",
  "forest-day": "day",
  "forest-evening": "evening",
  campfire: "magic",
  "night-moon": "night",
};

export const MIX = {
  /** Music volume when nobody is talking. */
  music: 0.26,
  /** Music volume under the voice (ducking). */
  musicUnderVoice: 0.13,
  /** Frames to ramp the ducking in/out. */
  duckRamp: 10,
  /** Crossfade between music tracks, frames. */
  musicFade: 30,
  sfx: { whoosh: 0.35, sparkle: 0.45, pop: 0.35, chime: 0.4 },
} as const;
