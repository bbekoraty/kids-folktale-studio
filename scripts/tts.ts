/**
 * Generate narration audio for a story, one MP3 per line, per language.
 *
 *   npm run tts -- --story rabbit-in-the-moon            (all languages)
 *   npm run tts -- --story rabbit-in-the-moon --lang th
 *   npm run tts -- --story rabbit-in-the-moon --provider elevenlabs --force
 *
 * Output: public/audio/<story>/<lang>/<line-id>.mp3 + manifest.json (durations).
 * Lines whose text and voice did not change are skipped, so re-runs are cheap.
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseFile } from "music-metadata";
import { LANG_CODES, type LangCode } from "../src/config/languages";
import { t } from "../src/lib/text";
import type { AudioManifest } from "../src/lib/timing";
import type { CharacterKey } from "../src/lib/types";
import { getStory, STORIES } from "../src/stories";
import { googleTts, type GoogleVoice } from "./lib/google-tts";

type Provider = "google" | "elevenlabs";
type ElevenVoice = { voiceId: string; stability?: number; style?: number };

const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const provider = (arg("provider") ?? process.env.TTS_PROVIDER ?? "google") as Provider;
const force = args.includes("--force");
const storyIds = arg("story") ? [arg("story")!] : STORIES.map((s) => s.id);
const langs = (arg("lang") ? arg("lang")!.split(",") : LANG_CODES) as LangCode[];

const voices = JSON.parse(readFileSync("config/voices.json", "utf8"));

const voiceFor = (lang: LangCode, speaker: CharacterKey) => {
  const table = voices[provider]?.[lang];
  if (!table) throw new Error(`No ${provider} voices for "${lang}" in config/voices.json`);
  return table[speaker] ?? table.default;
};

const elevenTts = async (text: string, _lang: LangCode, v: ElevenVoice): Promise<Buffer> => {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is missing in .env");
  if (!v.voiceId || v.voiceId.startsWith("PUT_")) throw new Error("Set ElevenLabs voice ids in config/voices.json");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": key },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
      voice_settings: { stability: v.stability ?? 0.5, similarity_boost: 0.75, style: v.style ?? 0.3 },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
};

const synth = (text: string, lang: LangCode, v: GoogleVoice & ElevenVoice) =>
  provider === "google" ? googleTts(text, v) : elevenTts(text, lang, v);

const run = async () => {
  for (const storyId of storyIds) {
    const story = getStory(storyId);
    for (const lang of langs) {
      const dir = path.join("public", "audio", storyId, lang);
      mkdirSync(dir, { recursive: true });
      const manifestFile = path.join(dir, "manifest.json");
      const old: AudioManifest | null = existsSync(manifestFile)
        ? JSON.parse(readFileSync(manifestFile, "utf8"))
        : null;
      const manifest: AudioManifest = { story: storyId, lang, provider, lines: {} };

      console.log(`\n${storyId} · ${lang} · ${provider}`);
      for (const scene of story.scenes) {
        for (const line of scene.lines) {
          const text = t(line.text, lang);
          const voice = voiceFor(lang, line.speaker);
          const hash = createHash("sha1").update(JSON.stringify([provider, voice, text])).digest("hex").slice(0, 12);
          const file = `${line.id}.mp3`;
          const full = path.join(dir, file);
          const cached = old?.lines[line.id];

          if (!force && cached?.hash === hash && existsSync(full)) {
            manifest.lines[line.id] = cached;
            console.log(`  = ${line.id}`);
            continue;
          }
          const audio = await synth(text, lang, voice);
          writeFileSync(full, audio);
          const meta = await parseFile(full);
          const duration = Number((meta.format.duration ?? 0).toFixed(3));
          manifest.lines[line.id] = { file, duration, hash };
          console.log(`  + ${line.id}  ${duration.toFixed(1)}s`);
          writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
        }
      }
      writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    }
  }
  console.log("\nDone. Open `npm run dev` to preview with voices.");
};

run().catch((e) => {
  console.error(`\n✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
