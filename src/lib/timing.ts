import { staticFile } from "remotion";
import { FPS, LANGUAGES, LINE_GAP, SCENE_PAD, type LangCode } from "../config/languages";
import { t } from "./text";
import type { LineTiming, SceneTiming, Story } from "./types";

/** Written by `npm run tts` next to the audio files. */
export interface AudioManifest {
  story: string;
  lang: LangCode;
  provider: string;
  lines: Record<string, { file: string; duration: number; hash: string }>;
}

export const manifestPath = (storyId: string, lang: LangCode) =>
  `audio/${storyId}/${lang}/manifest.json`;

export const loadManifest = async (
  storyId: string,
  lang: LangCode,
): Promise<AudioManifest | null> => {
  try {
    const res = await fetch(staticFile(manifestPath(storyId, lang)));
    if (!res.ok) return null;
    return (await res.json()) as AudioManifest;
  } catch {
    return null;
  }
};

/** Reading-time guess used before TTS audio exists, so previews still work. */
export const estimateSeconds = (text: string, lang: LangCode) =>
  Math.max(1.5, text.length / LANGUAGES[lang].charsPerSecond + 0.3);

export const buildTiming = (
  story: Story,
  lang: LangCode,
  manifest: AudioManifest | null,
  sceneIds?: string[],
) => {
  const scenes: SceneTiming[] = [];
  const lines: LineTiming[] = [];
  const pad = Math.round(SCENE_PAD * FPS);
  const gap = Math.round(LINE_GAP * FPS);
  let cursor = 0;

  const chosen = sceneIds
    ? story.scenes.filter((s) => sceneIds.includes(s.id))
    : story.scenes;

  for (const scene of chosen) {
    const sceneStart = cursor;
    cursor += pad;
    for (const line of scene.lines) {
      const entry = manifest?.lines[line.id];
      const seconds = entry ? entry.duration : estimateSeconds(t(line.text, lang), lang);
      const duration = Math.ceil(seconds * FPS);
      lines.push({
        id: line.id,
        sceneId: scene.id,
        start: cursor,
        duration,
        audio: entry ? `audio/${story.id}/${lang}/${entry.file}` : null,
      });
      cursor += duration + gap;
    }
    cursor += pad;
    scenes.push({ id: scene.id, start: sceneStart, duration: cursor - sceneStart });
  }

  return { scenes, lines, total: cursor };
};
