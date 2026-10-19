/**
 * Audition Google Chirp 3 HD voices: the same sample line in every voice,
 * so you can pick Fufu's voice and each character's voice by ear.
 *
 *   npm run voices -- --lang th
 *   npm run voices -- --lang en --text "Hello friends, I'm Fufu!"
 *   npm run voices -- --lang th --only Leda,Aoede,Sulafat --rate 0.9
 *
 * Output: out/voices/<lang>/<Voice>.mp3  +  out/voices/<lang>/index.html (play them all in a browser)
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { googleTts } from "./lib/google-tts";

const VOICES = {
  female: ["Achernar", "Aoede", "Autonoe", "Callirrhoe", "Despina", "Erinome", "Gacrux", "Kore", "Laomedeia", "Leda", "Pulcherrima", "Sulafat", "Vindemiatrix", "Zephyr"],
  male: ["Achird", "Algenib", "Algieba", "Alnilam", "Charon", "Enceladus", "Fenrir", "Iapetus", "Orus", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Umbriel", "Zubenelgenubi"],
};

const SAMPLE: Record<string, string> = {
  th: "สวัสดีจ้าเพื่อนๆ ฟูฟูเองนะ... วันนี้ฟูฟูมีนิทานสนุกๆ มาเล่าให้ฟังด้วยล่ะ",
  en: "Sawasdee, friends! I'm Fufu... and today I have a lovely story to tell you.",
};
const LOCALE: Record<string, string> = { th: "th-TH", en: "en-US" };

const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const lang = arg("lang") ?? "th";
const text = arg("text") ?? SAMPLE[lang] ?? SAMPLE.en;
const rate = Number(arg("rate") ?? 0.95);
const only = arg("only")?.split(",");

const run = async () => {
  const dir = path.join("out", "voices", lang);
  mkdirSync(dir, { recursive: true });
  const rows: string[] = [];
  for (const [gender, names] of Object.entries(VOICES)) {
    for (const v of names) {
      if (only && !only.includes(v)) continue;
      const name = `${LOCALE[lang] ?? lang}-Chirp3-HD-${v}`;
      try {
        const audio = await googleTts(text, { name, rate });
        writeFileSync(path.join(dir, `${v}.mp3`), audio);
        rows.push(`<tr><td>${v}</td><td>${gender}</td><td><audio controls src="${v}.mp3"></audio></td><td><code>${name}</code></td></tr>`);
        console.log(`  + ${v} (${gender})`);
      } catch (e) {
        console.log(`  ✗ ${v}: ${e instanceof Error ? e.message.slice(0, 120) : e}`);
      }
    }
  }
  writeFileSync(
    path.join(dir, "index.html"),
    `<!doctype html><meta charset="utf-8"><title>Voices ${lang}</title>
<style>body{font-family:system-ui;margin:24px}td{padding:6px 12px}code{color:#666}</style>
<p>${text}</p><table>${rows.join("")}</table>`,
  );
  console.log(`\nOpen ${path.join(dir, "index.html")} in your browser, then put the voice names you like in config/voices.json`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
