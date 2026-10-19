export type GoogleVoice = { name: string; pitch?: number; rate?: number };

/** Chirp 3 HD voices: natural, support pause tags, but no pitch control. */
export const isChirp = (name: string) => /chirp3-hd/i.test(name);

/**
 * Story text → TTS input.
 * "..." and "…" become a short pause so the narrator breathes like a storyteller.
 */
export const toMarkup = (text: string) =>
  text
    .replace(/\s*(\.\.\.|…)\s*/g, " [pause] ")
    .replace(/\s+/g, " ")
    .trim();

export const googleTts = async (text: string, v: GoogleVoice): Promise<Buffer> => {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) throw new Error("GOOGLE_TTS_API_KEY is missing in .env");
  const languageCode = v.name.split("-").slice(0, 2).join("-");
  const chirp = isChirp(v.name);

  const body = chirp
    ? {
        input: { markup: toMarkup(text) },
        voice: { languageCode, name: v.name },
        audioConfig: { audioEncoding: "MP3", speakingRate: v.rate ?? 1 },
      }
    : {
        input: { text },
        voice: { languageCode, name: v.name },
        audioConfig: { audioEncoding: "MP3", pitch: v.pitch ?? 0, speakingRate: v.rate ?? 1, sampleRateHertz: 44100 },
      };

  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Google TTS ${res.status} (${v.name}): ${await res.text()}`);
  const json = (await res.json()) as { audioContent: string };
  return Buffer.from(json.audioContent, "base64");
};
