import { LANG_CODES } from "../config/languages";
import {
  ACTIONS,
  BACKGROUNDS,
  CHARACTER_KEYS,
  PROPS,
  STORY_STATUSES,
  TRANSITIONS,
  type Story,
} from "./types";

export interface ValidationResult {
  /** Problems that would break rendering. */
  errors: string[];
  /** Problems worth a look (missing translations, very long lines). */
  warnings: string[];
}

const has = (list: readonly string[], v: unknown) => typeof v === "string" && list.includes(v);

/** Checks a story JSON against what the renderer can actually draw. */
export const validateStory = (input: unknown): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const s = input as Story;

  if (!s || typeof s !== "object") return { errors: ["story is not an object"], warnings };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id ?? "")) errors.push(`id "${s.id}" must be lowercase-with-dashes`);
  if (!s.title?.en) errors.push("title.en is missing");
  if (!s.moral?.en) errors.push("moral.en is missing");
  if (s.status !== undefined && !has(STORY_STATUSES, s.status)) errors.push(`status "${s.status}" is not one of ${STORY_STATUSES.join(", ")}`);
  if (!Array.isArray(s.scenes) || s.scenes.length === 0) {
    errors.push("scenes is empty");
    return { errors, warnings };
  }

  const sceneIds = new Set<string>();
  const lineIds = new Set<string>();

  for (const sc of s.scenes) {
    const where = `scene "${sc.id}"`;
    if (!sc.id) errors.push("a scene has no id");
    if (sceneIds.has(sc.id)) errors.push(`${where}: duplicate scene id`);
    sceneIds.add(sc.id);
    if (!has(BACKGROUNDS, sc.background)) errors.push(`${where}: background "${sc.background}" does not exist (use ${BACKGROUNDS.join(", ")})`);
    if (sc.transition !== undefined && !has(TRANSITIONS, sc.transition)) errors.push(`${where}: transition "${sc.transition}" does not exist`);
    if (!Array.isArray(sc.lines) || sc.lines.length === 0) errors.push(`${where}: has no lines`);

    const localLines = new Set((sc.lines ?? []).map((l) => l.id));
    const ref = (id: string | undefined, what: string) => {
      if (id !== undefined && !localLines.has(id)) errors.push(`${where}: ${what} "${id}" is not a line in this scene`);
    };

    for (const m of sc.cast ?? []) {
      if (!has(CHARACTER_KEYS, m.character)) errors.push(`${where}: character "${m.character}" does not exist (use ${CHARACTER_KEYS.join(", ")})`);
      if (m.action !== undefined && !has(ACTIONS, m.action)) errors.push(`${where}: action "${m.action}" does not exist`);
      if (typeof m.x !== "number" || typeof m.y !== "number") errors.push(`${where}: ${m.character} needs numeric x and y`);
      ref(m.fromLine, "fromLine");
      ref(m.actionAt, "actionAt");
      if (m.action === "jump" && typeof m.toX !== "number") errors.push(`${where}: jump needs toX`);
    }
    for (const p of sc.props ?? []) {
      if (!has(PROPS, p.prop)) errors.push(`${where}: prop "${p.prop}" does not exist (use ${PROPS.join(", ")})`);
      ref(p.fromLine, "fromLine");
      ref(p.untilLine, "untilLine");
    }
    for (const l of sc.lines ?? []) {
      if (!l.id) errors.push(`${where}: a line has no id`);
      if (lineIds.has(l.id)) errors.push(`${where}: duplicate line id "${l.id}"`);
      lineIds.add(l.id);
      if (!has(CHARACTER_KEYS, l.speaker)) errors.push(`line "${l.id}": speaker "${l.speaker}" does not exist`);
      if (!l.text?.en) errors.push(`line "${l.id}": text.en is missing`);
      for (const lang of LANG_CODES) {
        const text = l.text?.[lang];
        if (!text) warnings.push(`line "${l.id}": no ${lang} text (English will be used)`);
        else if (text.length > 170) warnings.push(`line "${l.id}" (${lang}) is long (${text.length} chars); split it for small viewers`);
      }
    }
  }

  for (const id of s.shortScenes ?? []) if (!sceneIds.has(id)) errors.push(`shortScenes: "${id}" is not a scene`);
  if (!s.shortScenes?.length) warnings.push("shortScenes is empty; no Short will be made");
  if (s.thumbnailScene !== undefined && !sceneIds.has(s.thumbnailScene)) errors.push(`thumbnailScene "${s.thumbnailScene}" is not a scene`);

  return { errors, warnings };
};
