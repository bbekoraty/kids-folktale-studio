/**
 * Render preview stills, e.g.
 *   npm run still -- rabbit-in-the-moon-th 30 200 600
 * Writes out/stills/<composition>-<frame>.png
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const [comp, ...frames] = process.argv.slice(2);
if (!comp || frames.length === 0) {
  console.log("Usage: npm run still -- <composition-id> <frame> [frame...]");
  process.exit(1);
}
mkdirSync("out/stills", { recursive: true });
const browser = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];
for (const f of frames) {
  execFileSync("npx", ["remotion", "still", comp, `out/stills/${comp}-${f}.png`, `--frame=${f}`, ...browser], {
    stdio: "inherit",
  });
}
