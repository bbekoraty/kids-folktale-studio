import React from "react";
import { Html5Audio, interpolate, Sequence, staticFile } from "remotion";
import { MIX, MUSIC_FOR_BACKGROUND } from "../config/music";
import type { LineTiming, SceneTiming, Story } from "../lib/types";
import { autoTransition } from "../scenes/Transition";

type Timing = { scenes: SceneTiming[]; lines: LineTiming[] };

type Cue = { track: string; start: number; end: number };
type Sfx = { file: "whoosh" | "sparkle" | "pop" | "chime"; at: number };

/** Consecutive scenes with the same track share one continuous cue. */
const musicCues = (story: Story, timing: Timing): Cue[] => {
  const cues: Cue[] = [];
  for (const st of timing.scenes) {
    const scene = story.scenes.find((s) => s.id === st.id)!;
    const track = scene.music ?? MUSIC_FOR_BACKGROUND[scene.background];
    const last = cues[cues.length - 1];
    if (last && last.track === track) last.end = st.start + st.duration;
    else cues.push({ track, start: st.start, end: st.start + st.duration });
  }
  return cues;
};

/** Sound effects that follow what happens on screen. */
const soundEffects = (story: Story, timing: Timing): Sfx[] => {
  const out: Sfx[] = [];
  const lineAt = (id?: string) => (id ? timing.lines.find((l) => l.id === id)?.start : undefined);

  timing.scenes.forEach((st, i) => {
    const scene = story.scenes.find((s) => s.id === st.id)!;
    if (i > 0) {
      const prev = story.scenes.find((s) => s.id === timing.scenes[i - 1].id);
      const kind = scene.transition ?? autoTransition(prev?.background, scene.background, scene.id);
      out.push({ file: kind === "sparkle" ? "sparkle" : "whoosh", at: st.start });
    }
    for (const m of scene.cast) {
      const at = lineAt(m.fromLine);
      if (at !== undefined) out.push({ file: "pop", at });
      if (m.action === "glow") out.push({ file: "chime", at: st.start + 8 });
    }
    for (const p of scene.props ?? []) {
      const at = lineAt(p.fromLine);
      if (at === undefined) continue;
      out.push({ file: p.prop === "petals" || p.prop === "moon-rabbit" ? "sparkle" : "pop", at });
    }
  });
  return out;
};

/** Music volume at an absolute frame: full when quiet, ducked under speech, faded at cue edges. */
const musicVolume = (frame: number, cue: Cue, lines: LineTiming[]) => {
  let distance = Infinity;
  for (const l of lines) {
    const d = frame < l.start ? l.start - frame : frame > l.start + l.duration ? frame - (l.start + l.duration) : 0;
    if (d < distance) distance = d;
    if (distance === 0) break;
  }
  const duck = interpolate(distance, [0, MIX.duckRamp], [MIX.musicUnderVoice, MIX.music], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const edge = interpolate(
    frame,
    [cue.start, cue.start + MIX.musicFade, cue.end - MIX.musicFade, cue.end],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return duck * edge;
};

export const Soundtrack: React.FC<{ story: Story; timing: Timing }> = ({ story, timing }) => {
  const cues = musicCues(story, timing);
  const sfx = soundEffects(story, timing);
  return (
    <>
      {cues.map((cue, i) => (
        <Sequence key={`music-${i}`} from={cue.start} durationInFrames={cue.end - cue.start} name={`music ${cue.track}`}>
          <Html5Audio
            src={staticFile(`music/${cue.track}.mp3`)}
            loop
            volume={(f) => musicVolume(cue.start + f, cue, timing.lines)}
          />
        </Sequence>
      ))}
      {sfx.map((s, i) => (
        <Sequence key={`sfx-${i}`} from={Math.max(0, s.at)} durationInFrames={90} name={`sfx ${s.file}`}>
          <Html5Audio src={staticFile(`sfx/${s.file}.mp3`)} volume={MIX.sfx[s.file]} />
        </Sequence>
      ))}
    </>
  );
};
