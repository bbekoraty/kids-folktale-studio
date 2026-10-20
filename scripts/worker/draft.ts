/**
 * Draft a new story with Claude, in the exact JSON format the renderer uses.
 * The draft is validated; if Claude's JSON breaks a rule it gets one chance to fix it.
 */
import { existsSync, readFileSync } from "node:fs";
import { LANG_CODES, LANGUAGES } from "../../src/config/languages";
import type { Story } from "../../src/lib/types";
import { ACTIONS, BACKGROUNDS, CHARACTER_KEYS, PROPS, TRANSITIONS } from "../../src/lib/types";
import { validateStory } from "../../src/lib/validate";
import { HttpError, storyPath, writeStory } from "./stories";

export interface DraftRequest {
  /** Folktale name, e.g. "แม่โพสพ" or "The Rice Mother". */
  title: string;
  /** The plot in your own words (any language). */
  synopsis?: string;
  /** The lesson you want at the end. */
  moral?: string;
  /** Anything else: tone, scenes to skip, length. */
  notes?: string;
  /** Optional id; generated from the English title otherwise. */
  id?: string;
}

const ASSETS = `
Characters (key: look):
- fufu: the channel host, a fluffy orange lion cub with a Thai checked scarf. Only on the "stage" background (intro/outro). Narrates every other scene from the corner automatically.
- rabbit: small white rabbit with pink ears.
- monkey: brown monkey with a curly tail.
- otter: brown river otter.
- jackal: orange jackal / fox with a bushy tail.
- oldman: kind Thai grandpa traveler with a white beard, blue shirt and walking stick.
- phra-in: Phra In (Indra), king of the sky: green skin, golden chada crown, glowing.

Backgrounds:
- stage: cream host stage with Thai-style border (intro and outro only).
- forest-day: sunny forest by a river, palm trees, a Thai stilt house.
- forest-evening: pink-purple sunset over the same forest.
- campfire: night, stars, warm glow on the ground.
- night-moon: night with a big full moon (moon centre at x=1300, y=300).

Props: ${PROPS.join(", ")} (fish, mango and corn are food; fire is a campfire; petals is a soft pile of flower petals; moon-rabbit draws a rabbit picture on the night-moon moon; grass is a tuft of grass).
Actions: ${ACTIONS.join(", ")} (hop = small hops, walk-in = walks in from the side at scene start or at actionAt, jump = arc jump to toX starting at actionAt, glow = magical float, wave = Fufu waves).
Transitions (optional per scene): ${TRANSITIONS.join(", ")} (picked automatically when omitted).`;

const RULES = `
Write a short retelling of a Thai folktale for children aged 3–8, in the JSON format of the example.

Story rules
- 7 to 10 scenes. First scene "intro" on "stage" with Fufu (x 960, y 1000, scale 1.55, action "wave") and a "title" card. Last scene "outro" on "stage" with "showMoral": true, Fufu with fromLine "outro-1", and the moral line with "noSubtitle": true.
- Story scenes: "narratorCorner": true. Two or three lines each. Most lines are spoken by "fufu" as narrator; characters may say short lines themselves.
- Summarised storytelling: keep only the key events. Sentences are short and simple. Use "..." where a storyteller would pause.
- Soften anything violent or scary. No death shown or described in detail ("went away", "was never seen again"), no hurting, no weapons, no blood. Villains are grumpy or jealous, not frightening, and may say sorry at the end.
- Keep the original lesson of the tale. One clear moral sentence.
- Do not copy wording from any existing book, cartoon or film; write it fresh.
- Every line has text in ${LANG_CODES.map((l) => `${l} (${LANGUAGES[l].name})`).join(" and ")}. Thai should sound like a warm Thai storyteller talking to small children (จ้ะ, นะ, เลย), not a translation.
- Lines are at most ~150 characters.

Staging rules (stage is 1920×1080)
- Animals stand at y 905, people at y 920, between x 450 and 1500, spaced at least 220 apart. Use "flip": true for characters facing left (towards others on their left).
- Use only the characters, backgrounds, props and actions listed. If the tale needs someone or something that does not exist, keep it off stage (the narrator mentions it) and describe what is missing in "assetRequests" (e.g. "Nang Ai: a young Isan princess in a pha sin").
- Use "fromLine" to make a character or prop appear when a line starts, "untilLine" to remove a prop.

Other fields
- "id": lowercase-with-dashes from the English title. "status": "draft".
- "summary": one or two sentences for the YouTube description, in every language.
- "thumbnailScene": the most charming story scene. "thumbnailTitle": the title with "\\n" where the line should break (two short lines).
- "shortScenes": 2 or 3 consecutive key scenes for a ~45 second YouTube Short.

Reply with the JSON only, no explanation.`;

const extractJson = (text: string) => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(raw) as Story;
};

const callClaude = async (messages: { role: "user" | "assistant"; content: string }[], system: string) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new HttpError(500, "ANTHROPIC_API_KEY is missing in .env");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
      max_tokens: 16000,
      system,
      messages,
    }),
  });
  if (!res.ok) throw new HttpError(502, `Claude API ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { content: { type: string; text?: string }[] };
  return json.content.map((c) => c.text ?? "").join("");
};

export const draftStory = async (req: DraftRequest, log: (line: string) => void) => {
  if (!req.title?.trim()) throw new HttpError(400, "title is required");
  const example = readFileSync(storyPath("rabbit-in-the-moon"), "utf8");
  const system = `You write scripts for "Fufu Tales", a YouTube channel of Thai folktales for small children.\n${ASSETS}\n${RULES}\n\nExample of a finished story:\n${example}`;
  const ask = [
    `Folktale: ${req.title}`,
    req.synopsis ? `Plot: ${req.synopsis}` : "",
    req.moral ? `Moral: ${req.moral}` : "",
    req.notes ? `Notes: ${req.notes}` : "",
    req.id ? `Use id: ${req.id}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const messages: { role: "user" | "assistant"; content: string }[] = [{ role: "user", content: ask }];
  log("asking Claude for a draft…");
  let reply = await callClaude(messages, system);
  let story = extractJson(reply);
  let check = validateStory(story);

  if (check.errors.length) {
    log(`draft has ${check.errors.length} problem(s), asking Claude to fix them`);
    messages.push({ role: "assistant", content: reply });
    messages.push({ role: "user", content: `Fix these problems and reply with the full corrected JSON only:\n- ${check.errors.join("\n- ")}` });
    reply = await callClaude(messages, system);
    story = extractJson(reply);
    check = validateStory(story);
  }
  if (check.errors.length) throw new HttpError(422, `draft still invalid: ${check.errors.join("; ")}`);

  if (req.id) story.id = req.id;
  story.status = "draft";
  if (existsSync(storyPath(story.id))) {
    const existing = JSON.parse(readFileSync(storyPath(story.id), "utf8")) as Story;
    if (existing.status && existing.status !== "draft") throw new HttpError(409, `story "${story.id}" already exists and is ${existing.status}`);
  }
  writeStory(story);
  log(`saved src/stories/${story.id}.json`);
  return { story, warnings: check.warnings };
};

/** Plain-text preview of a story for a Telegram message. */
export const storyPreview = (story: Story, lang: "th" | "en" = "th", max = 3500) => {
  const parts: string[] = [`📖 ${story.title[lang] ?? story.title.en}`, `ข้อคิด: ${story.moral[lang] ?? story.moral.en}`, ""];
  for (const sc of story.scenes) {
    parts.push(`— ${sc.id} (${sc.background})`);
    for (const l of sc.lines) parts.push(`${l.speaker === "fufu" ? "" : `${l.speaker}: `}${l.text[lang] ?? l.text.en}`);
  }
  if (story.assetRequests?.length) parts.push("", "ต้องวาดเพิ่ม:", ...story.assetRequests.map((a) => `• ${a}`));
  const text = parts.join("\n");
  return text.length > max ? `${text.slice(0, max)}…` : text;
};
