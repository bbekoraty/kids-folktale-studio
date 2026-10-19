/**
 * Render final videos to out/.
 *
 *   npm run render                                   (every story, language and format)
 *   npm run render -- --story rabbit-in-the-moon --lang th
 *   npm run render -- --story rabbit-in-the-moon --short      (9:16 Shorts only)
 *   npm run render -- --story rabbit-in-the-moon --long       (16:9 only)
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { LANG_CODES, type LangCode } from "../src/config/languages";
import { STORIES } from "../src/stories";

const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const storyIds = arg("story") ? [arg("story")!] : STORIES.map((s) => s.id);
const langs = (arg("lang") ? arg("lang")!.split(",") : LANG_CODES) as LangCode[];
const formats = args.includes("--short") ? ["short"] : args.includes("--long") ? ["long"] : ["long", "short"];
const browser = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];

mkdirSync("out", { recursive: true });
for (const story of storyIds) {
  for (const lang of langs) {
    for (const format of formats) {
      const id = format === "short" ? `${story}-${lang}-short` : `${story}-${lang}`;
      console.log(`\n▶ ${id}`);
      execFileSync("npx", ["remotion", "render", id, `out/${id}.mp4`, "--codec=h264", ...browser], {
        stdio: "inherit",
      });
    }
  }
}
