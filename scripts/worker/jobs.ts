import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LANG_CODES, type LangCode } from "../../src/config/languages";
import type { Format } from "../../src/lib/types";
import { draftStory, storyPreview, type DraftRequest } from "./draft";
import { prepare, renderStills, renderThumbnail, renderVideo, requireVoice, type Output } from "./remotion";
import { HttpError, readStory } from "./stories";

export const JOB_TYPES = ["draft", "tts", "stills", "render", "thumbnail"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export interface JobParams {
  story?: string;
  langs?: LangCode[];
  lang?: LangCode;
  /** "long" (16:9) and/or "short" (9:16). */
  formats?: ("long" | "short")[];
  draft?: DraftRequest;
}

export interface Job {
  id: string;
  type: JobType;
  params: JobParams;
  status: "queued" | "running" | "done" | "failed";
  progress: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  log: string[];
  outputs: Output[];
  /** Extra result data (e.g. the drafted story preview). */
  result?: Record<string, unknown>;
  error?: string;
  callbackUrl?: string;
  callback?: { ok: boolean; status?: number; error?: string; at: string };
}

const JOBS_FILE = path.join("out", "jobs.json");
const jobs: Job[] = existsSync(JOBS_FILE) ? (JSON.parse(readFileSync(JOBS_FILE, "utf8")) as Job[]) : [];
// jobs that were running when the worker stopped will never finish
for (const j of jobs) if (j.status === "running" || j.status === "queued") Object.assign(j, { status: "failed", error: "worker restarted" });

const save = () => {
  mkdirSync("out", { recursive: true });
  writeFileSync(JOBS_FILE, JSON.stringify(jobs.slice(-200), null, 2));
};

export const listJobs = (limit = 20) => jobs.slice(-limit).reverse().map(summary);
export const getJob = (id: string) => {
  const job = jobs.find((j) => j.id === id);
  if (!job) throw new HttpError(404, `job ${id} not found`);
  return job;
};
const summary = (j: Job) => ({ id: j.id, type: j.type, status: j.status, progress: j.progress, story: j.params.story, createdAt: j.createdAt, finishedAt: j.finishedAt, error: j.error });

export const health = () => {
  const running = jobs.find((j) => j.status === "running");
  const queued = jobs.filter((j) => j.status === "queued").length;
  const runningMinutes = running?.startedAt ? (Date.now() - Date.parse(running.startedAt)) / 60000 : 0;
  return { ok: true, running: running ? summary(running) : null, runningMinutes: Math.round(runningMinutes), queued };
};

/** Validate and enqueue. Heavy jobs run one at a time; drafts run straight away. */
export const createJob = (type: string, params: JobParams, callbackUrl?: string): Job => {
  if (!JOB_TYPES.includes(type as JobType)) throw new HttpError(400, `type must be one of ${JOB_TYPES.join(", ")}`);
  if (type !== "draft") readStory(params.story ?? ""); // 404 early if the story doesn't exist
  if (type === "draft" && !params.draft?.title) throw new HttpError(400, "draft.title is required");
  for (const l of [...(params.langs ?? []), ...(params.lang ? [params.lang] : [])]) {
    if (!LANG_CODES.includes(l)) throw new HttpError(400, `unknown language "${l}" (have ${LANG_CODES.join(", ")})`);
  }
  if (callbackUrl && !/^https?:\/\//.test(callbackUrl)) throw new HttpError(400, "callbackUrl must be http(s)");

  const job: Job = {
    id: randomUUID(),
    type: type as JobType,
    params,
    status: "queued",
    progress: 0,
    createdAt: new Date().toISOString(),
    log: [],
    outputs: [],
    callbackUrl,
  };
  jobs.push(job);
  save();
  if (job.type === "draft") void run(job);
  else void pump();
  return job;
};

let busy = false;
const pump = async () => {
  if (busy) return;
  const next = jobs.find((j) => j.status === "queued" && j.type !== "draft");
  if (!next) return;
  busy = true;
  try {
    await run(next);
  } finally {
    busy = false;
    void pump();
  }
};

const run = async (job: Job) => {
  job.status = "running";
  job.startedAt = new Date().toISOString();
  save();
  const log = (line: string) => {
    job.log.push(`${new Date().toISOString().slice(11, 19)} ${line}`);
    if (job.log.length > 300) job.log.splice(0, job.log.length - 300);
    console.log(`[${job.type} ${job.id.slice(0, 8)}] ${line}`);
  };
  let lastSave = 0;
  const progress = (x: number) => {
    job.progress = Math.max(0, Math.min(1, x));
    if (Date.now() - lastSave > 3000) {
      lastSave = Date.now();
      save();
    }
  };

  try {
    await execute(job, log, progress);
    job.status = "done";
    job.progress = 1;
  } catch (e) {
    job.status = "failed";
    job.error = e instanceof Error ? e.message : String(e);
    log(`✗ ${job.error}`);
  }
  job.finishedAt = new Date().toISOString();
  save();
  await notify(job, log);
  save();
};

const langsOf = (p: JobParams) => (p.langs?.length ? p.langs : p.lang ? [p.lang] : LANG_CODES);

const execute = async (job: Job, log: (l: string) => void, progress: (x: number) => void) => {
  const p = job.params;

  if (job.type === "draft") {
    const { story, warnings } = await draftStory(p.draft!, log);
    job.result = {
      storyId: story.id,
      title: story.title,
      warnings,
      assetRequests: story.assetRequests ?? [],
      preview: storyPreview(story, "th"),
      previewEn: storyPreview(story, "en"),
    };
    return;
  }

  const story = readStory(p.story!);
  const langs = langsOf(p);

  if (job.type === "tts") {
    await runTts(story.id, langs, log);
    return;
  }

  if (job.type === "render") for (const lang of langs) requireVoice(story.id, lang);
  const prepared = await prepare(log);
  try {
    if (job.type === "stills") {
      const lang = p.lang ?? langs[0];
      job.outputs = await renderStills(prepared, story, lang, log, progress);
    }

    if (job.type === "thumbnail") {
      for (const lang of langs) job.outputs.push(await renderThumbnail(prepared, story, lang, log));
    }

    if (job.type === "render") {
      const formats: Format[] = (p.formats?.length ? p.formats : ["long", "short"]).map((f) => (f === "short" ? "vertical" : "landscape"));
      const total = langs.length * formats.length;
      let done = 0;
      for (const lang of langs) {
        const thumb = await renderThumbnail(prepared, story, lang, log);
        job.outputs.push(thumb);
        for (const format of formats) {
          if (format === "vertical" && !story.shortScenes?.length) continue;
          const out: Output = await renderVideo(prepared, story, lang, format, log, (x) => progress((done + x) / total));
          out.bytes = statSync(out.path).size;
          if (format === "landscape") out.thumbnailUrl = thumb.url;
          job.outputs.push(out);
          done++;
          progress(done / total);
        }
      }
    }
  } finally {
    await prepared.browser.close({ silent: true }).catch(() => undefined);
  }
};

const runTts = (storyId: string, langs: LangCode[], log: (l: string) => void) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [path.join("node_modules", "tsx", "dist", "cli.mjs"), "scripts/tts.ts", "--story", storyId, "--lang", langs.join(",")], {
      env: process.env,
    });
    const onData = (b: Buffer) => b.toString().split("\n").filter((l) => l.trim()).forEach((l) => log(l.trim()));
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`tts exited with code ${code}`))));
  });

/**
 * POST the finished job to n8n. The Wait node's resume URL uses n8n's public address (behind Cloudflare
 * Access), so swap its origin for N8N_INTERNAL_URL and stay on the local machine.
 */
const notify = async (job: Job, log: (l: string) => void) => {
  if (!job.callbackUrl) return;
  let url = job.callbackUrl;
  const internal = process.env.N8N_INTERNAL_URL;
  if (internal) {
    const u = new URL(url);
    const base = new URL(internal);
    u.protocol = base.protocol;
    u.host = base.host;
    url = u.toString();
  }
  const body = JSON.stringify(publicJob(job));
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body });
      job.callback = { ok: res.ok, status: res.status, at: new Date().toISOString() };
      if (res.ok) {
        log(`callback sent (${res.status})`);
        return;
      }
      log(`callback ${res.status}, retrying`);
    } catch (e) {
      job.callback = { ok: false, error: e instanceof Error ? e.message : String(e), at: new Date().toISOString() };
      log(`callback failed: ${job.callback.error}`);
    }
    await new Promise((r) => setTimeout(r, attempt * 3000));
  }
};

/** What n8n sees: everything except the long log. */
export const publicJob = (job: Job) => ({ ...job, log: job.log.slice(-15) });
