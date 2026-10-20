/**
 * Studio Worker — the HTTP API n8n calls to draft stories, make voices, render stills and videos.
 *
 *   npm run worker
 *
 * Every request needs:  Authorization: Bearer <WORKER_TOKEN>   (set in .env)
 * Endpoints are listed in README (section "n8n automation").
 */
import "dotenv/config";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";
import { STORY_STATUSES, type StoryStatus } from "../../src/lib/types";
import { validateStory } from "../../src/lib/validate";
import { createJob, getJob, health, listJobs, publicJob } from "./jobs";
import { HttpError, listStoryIds, readStory, regenerateIndex, setStatus, storySummary } from "./stories";
import { storyPreview } from "./draft";

const PORT = Number(process.env.WORKER_PORT ?? 4310);
const HOST = process.env.WORKER_HOST ?? "127.0.0.1";
const TOKEN = process.env.WORKER_TOKEN ?? "";

if (TOKEN.length < 16) {
  console.error("✗ Set WORKER_TOKEN in .env (at least 16 characters), e.g. `openssl rand -hex 24`");
  process.exit(1);
}

const MIME: Record<string, string> = { ".mp4": "video/mp4", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".mp3": "audio/mpeg" };

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
};

const authorized = (req: IncomingMessage) => {
  const header = req.headers.authorization ?? "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const want = Buffer.from(TOKEN);
  return given.length === want.length && timingSafeEqual(given, want);
};

const readBody = (req: IncomingMessage) =>
  new Promise<Record<string, unknown>>((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 2_000_000) reject(new HttpError(413, "body too large"));
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new HttpError(400, "body is not valid JSON"));
      }
    });
    req.on("error", reject);
  });

const serveFile = (res: ServerResponse, rel: string) => {
  const root = path.resolve("out");
  const full = path.resolve(root, decodeURIComponent(rel));
  if (!full.startsWith(root + path.sep) || !existsSync(full) || !statSync(full).isFile()) throw new HttpError(404, "file not found");
  res.writeHead(200, {
    "content-type": MIME[path.extname(full)] ?? "application/octet-stream",
    "content-length": statSync(full).size,
    "content-disposition": `inline; filename="${path.basename(full)}"`,
  });
  createReadStream(full).pipe(res);
};

const route = async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", "http://worker");
  const parts = url.pathname.split("/").filter(Boolean);
  const method = req.method ?? "GET";

  if (!authorized(req)) throw new HttpError(401, "missing or wrong Authorization: Bearer token");

  // GET /health
  if (method === "GET" && url.pathname === "/health") return send(res, 200, health());

  // GET /stories
  if (method === "GET" && url.pathname === "/stories") return send(res, 200, listStoryIds().map(storySummary));

  // GET /stories/:id   (?preview=th|en for a plain-text preview)
  if (method === "GET" && parts[0] === "stories" && parts.length === 2) {
    const story = readStory(parts[1]);
    const preview = url.searchParams.get("preview");
    if (preview === "th" || preview === "en") return send(res, 200, { id: story.id, preview: storyPreview(story, preview) });
    return send(res, 200, { story, ...validateStory(story) });
  }

  // POST /stories/:id/status  { status }
  if (method === "POST" && parts[0] === "stories" && parts[2] === "status") {
    const body = await readBody(req);
    const status = body.status as StoryStatus;
    if (!STORY_STATUSES.includes(status)) throw new HttpError(400, `status must be one of ${STORY_STATUSES.join(", ")}`);
    return send(res, 200, storySummary(setStatus(parts[1], status).id));
  }

  // POST /stories/draft  { title, synopsis, moral, notes, id, callbackUrl }   → job
  if (method === "POST" && url.pathname === "/stories/draft") {
    const body = await readBody(req);
    const { callbackUrl, ...draft } = body as Record<string, string>;
    const job = createJob("draft", { draft: draft as never }, callbackUrl);
    return send(res, 202, publicJob(job));
  }

  // POST /jobs  { type, story, langs, lang, formats, callbackUrl }
  if (method === "POST" && url.pathname === "/jobs") {
    const body = await readBody(req);
    const { type, callbackUrl, ...params } = body as Record<string, never>;
    const job = createJob(type, params, callbackUrl);
    return send(res, 202, publicJob(job));
  }

  // GET /jobs
  if (method === "GET" && url.pathname === "/jobs") return send(res, 200, listJobs(Number(url.searchParams.get("limit") ?? 20)));

  // GET /jobs/:id
  if (method === "GET" && parts[0] === "jobs" && parts.length === 2) {
    const job = getJob(parts[1]);
    return send(res, 200, url.searchParams.has("full") ? job : publicJob(job));
  }

  // GET /files/<path inside out/>
  if (method === "GET" && parts[0] === "files") return serveFile(res, parts.slice(1).join("/"));

  throw new HttpError(404, `no route for ${method} ${url.pathname}`);
};

regenerateIndex();
createServer((req, res) => {
  route(req, res).catch((e) => {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error(e);
    if (!res.headersSent) send(res, status, { error: e instanceof Error ? e.message : String(e) });
    else res.end();
  });
}).listen(PORT, HOST, () => {
  console.log(`Studio Worker on http://${HOST}:${PORT}`);
  console.log(`n8n should call it at ${process.env.WORKER_PUBLIC_BASE ?? `http://host.docker.internal:${PORT}`}`);
});
