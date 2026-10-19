import type { Localized } from "../lib/types";
import type { CharacterKey } from "../lib/types";
import { C } from "./palette";

/** Fixed on-screen words, per language. */
export const UI: Record<string, Localized> = {
  channel: { en: "Fufu Tales", th: "นิทานฟูฟู" },
  lesson: { en: "Today's lesson", th: "ข้อคิดวันนี้" },
  folktale: { en: "A folktale from Thailand", th: "นิทานพื้นบ้านไทย" },
};

/** Colour of the subtitle underline, so kids can tell who is talking. */
export const SPEAKER_COLOR: Record<CharacterKey, string> = {
  fufu: C.gold,
  rabbit: C.pink,
  monkey: "#A8693A",
  otter: C.riverDeep,
  jackal: C.orange,
  oldman: "#3B4F9A",
  "phra-in": C.leafDeep,
};

/** If a speaker has no body on stage, let this character mouth the words instead. */
export const SPEAKER_STAND_IN: Partial<Record<CharacterKey, CharacterKey>> = {
  oldman: "phra-in",
};
