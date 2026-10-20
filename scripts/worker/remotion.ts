import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { LangCode } from "../../src/config/languages";
import { buildTiming, type AudioManifest } from "../../src/lib/timing";
import type { Format, Story } from "../../src/lib/types";
import { youtubeMeta, type YouTubeMeta } from "../../src/lib/youtube";
import { audioManifestPath, HttpError } from "./stories";

export interface Output {
  kind: "video" | "image";
  /** Path inside the project, e.g. out/rabbit-in-the-moon-th.mp4 */
  path: string;
  /** Full URL n8n can download it from. */
  url: string;
  storyId: string;
  lang?: LangCode;
  format?: Format;
  scene?: string;
  bytes?: number;
  youtube?: YouTubeMeta;
  thumbnailUrl?: string;
}

const ROOT = process.cwd();
export const publicBase = () => (process.env.WORKER_PUBLIC_BASE ?? `http://host.docker.internal:${process.env.WORKER_PORT ?? 4310}`).replace(/\/$/, "");
export const fileUrl = (p: string) => `${publicBase()}/files/${p.replace(/^out\//, "")}`;

const chromeMode = () => (process.env.RENDER_CHROME_MODE as "chrome-for-testing" | "headless-shell" | undefined) ?? undefined;
const browserExecutable = () => process.env.REMOTION_BROWSER || null;

/** Bundle the Remotion project and open one browser for the whole job. */
export const prepare = async (log: (l: string) => void) => {
  log("bundling project…");
  const serveUrl = await bundle({
    entryPoint: path.join(ROOT, "src", "index.ts"),
    publicDir: path.join(ROOT, "public"),
  });
  const browser = await openBrowser("chrome", {
    browserExecutable: browserExecutable(),
    chromeMode: chromeMode(),
  });
  return { serveUrl, browser };
};

type Prepared = Awaited<ReturnType<typeof prepare>>;

const pick = async (p: Prepared, id: string) =>
  selectComposition({ serveUrl: p.serveUrl, id, inputProps: {}, puppeteerInstance: p.browser, browserExecutable: browserExecutable() });

const readManifest = (storyId: string, lang: LangCode): AudioManifest | null => {
  const f = audioManifestPath(storyId, lang);
  return existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as AudioManifest) : null;
};

export const requireVoice = (storyId: string, lang: LangCode) => {
  if (!readManifest(storyId, lang)) throw new HttpError(409, `no voice audio for ${storyId} · ${lang}; run a "tts" job first`);
};

/** One still per scene, taken while the first line of the scene is on screen (so the subtitle shows). */
export const renderStills = async (p: Prepared, story: Story, lang: LangCode, log: (l: string) => void, progress: (x: number) => void) => {
  const id = `${story.id}-${lang}`;
  const composition = await pick(p, id);
  const timing = buildTiming(story, lang, readManifest(story.id, lang));
  const dir = path.join("out", "review", story.id, lang);
  mkdirSync(dir, { recursive: true });
  const outputs: Output[] = [];
  for (const [i, sc] of timing.scenes.entries()) {
    const first = timing.lines.find((l) => l.sceneId === sc.id);
    const frame = Math.min(composition.durationInFrames - 1, first ? first.start + Math.round(first.duration * 0.4) : sc.start + Math.round(sc.duration / 2));
    const file = path.join(dir, `${String(i + 1).padStart(2, "0")}-${sc.id}.png`);
    await renderStill({ composition, serveUrl: p.serveUrl, output: path.join(ROOT, file), frame, puppeteerInstance: p.browser, imageFormat: "png" });
    log(`still ${sc.id} @ frame ${frame}`);
    outputs.push({ kind: "image", path: file, url: fileUrl(file), storyId: story.id, lang, scene: sc.id });
    progress((i + 1) / timing.scenes.length);
  }
  return outputs;
};

export const renderThumbnail = async (p: Prepared, story: Story, lang: LangCode, log: (l: string) => void) => {
  const composition = await pick(p, `${story.id}-${lang}-thumb`);
  const file = path.join("out", `${story.id}-${lang}-thumb.png`);
  await renderStill({ composition, serveUrl: p.serveUrl, output: path.join(ROOT, file), frame: 0, puppeteerInstance: p.browser, imageFormat: "png" });
  log(`thumbnail ${file}`);
  return { kind: "image", path: file, url: fileUrl(file), storyId: story.id, lang } satisfies Output;
};

export const renderVideo = async (
  p: Prepared,
  story: Story,
  lang: LangCode,
  format: Format,
  log: (l: string) => void,
  progress: (x: number) => void,
) => {
  const id = format === "vertical" ? `${story.id}-${lang}-short` : `${story.id}-${lang}`;
  const composition = await pick(p, id);
  const file = path.join("out", `${id}.mp4`);
  log(`rendering ${id} (${composition.durationInFrames} frames)…`);
  let lastLogged = 0;
  await renderMedia({
    composition,
    serveUrl: p.serveUrl,
    codec: "h264",
    outputLocation: path.join(ROOT, file),
    puppeteerInstance: p.browser,
    concurrency: process.env.RENDER_CONCURRENCY ? Number(process.env.RENDER_CONCURRENCY) : null,
    chromeMode: chromeMode(),
    onProgress: ({ progress: x }) => {
      progress(x);
      if (x - lastLogged >= 0.1) {
        lastLogged = x;
        log(`  ${id} ${Math.round(x * 100)}%`);
      }
    },
  });
  return {
    kind: "video",
    path: file,
    url: fileUrl(file),
    storyId: story.id,
    lang,
    format,
    youtube: youtubeMeta(story, lang, format),
  } satisfies Output;
};
