/**
 * Supported languages. To add one:
 *  1. add an entry here,
 *  2. add its text to each line in src/stories/*.json,
 *  3. add its voices in config/voices.json,
 *  4. run `npm run tts -- --story <id> --lang <code>`.
 */
export const LANGUAGES = {
  en: { name: "English", locale: "en-US", charsPerSecond: 14 },
  th: { name: "ไทย", locale: "th-TH", charsPerSecond: 11 },
} as const;

export type LangCode = keyof typeof LANGUAGES;

export const LANG_CODES = Object.keys(LANGUAGES) as LangCode[];

export const FPS = 30;
/** Silence after each line, seconds (storytelling pace for young kids). */
export const LINE_GAP = 0.7;
/** Extra silence when the next line is a different speaker, seconds. */
export const SPEAKER_CHANGE_GAP = 0.35;
/** Breathing room at the start and end of each scene, seconds. */
export const SCENE_PAD = 0.9;
/** Scene-to-scene transition length, seconds (scenes overlap by this much). */
export const TRANSITION = 0.9;
