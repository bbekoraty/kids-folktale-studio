import "@fontsource/mali/500.css";
import "@fontsource/mali/600.css";
import "@fontsource/mali/700.css";
import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  continueRender,
  delayRender,
  Html5Audio,
  Sequence,
  staticFile,
} from "remotion";
import { FPS, LINE_GAP, TRANSITION } from "./config/languages";
import { Soundtrack } from "./audio/Soundtrack";
import { autoTransition, SceneTransition } from "./scenes/Transition";
import { C } from "./config/palette";
import { buildTiming, loadManifest } from "./lib/timing";
import type { StoryProps } from "./lib/types";
import { SceneView } from "./scenes/SceneView";
import { getStory } from "./stories";

/** Wait for the Mali font (Thai + Latin) before any frame is captured. */
const useFonts = () => {
  const [handle] = useState(() => delayRender("Loading fonts"));
  useEffect(() => {
    Promise.all([
      document.fonts.load("600 40px Mali", "กขabc"),
      document.fonts.load("700 40px Mali", "กขabc"),
    ])
      .catch(() => undefined)
      .then(() => continueRender(handle));
  }, [handle]);
};

export const StoryVideo: React.FC<StoryProps> = ({ storyId, lang, format, timing }) => {
  useFonts();
  const story = getStory(storyId);
  if (!timing) return null;
  const gap = Math.round(LINE_GAP * FPS);

  return (
    <AbsoluteFill style={{ backgroundColor: C.cream }}>
      {timing.scenes.map((st, i) => {
        const scene = story.scenes.find((s) => s.id === st.id)!;
        const prev = i > 0 ? story.scenes.find((s) => s.id === timing.scenes[i - 1].id) : undefined;
        const kind = i === 0 ? null : (scene.transition ?? autoTransition(prev?.background, scene.background, scene.id));
        const lines = timing.lines
          .filter((l) => l.sceneId === st.id)
          .map((l) => ({ ...l, start: l.start - st.start }));
        return (
          <Sequence key={st.id} from={st.start} durationInFrames={st.duration} name={st.id}>
            <SceneTransition
              kind={kind}
              length={Math.round(TRANSITION * FPS)}
              sceneDuration={st.duration}
              isFirst={i === 0}
              isLast={i === timing.scenes.length - 1}
            >
              <SceneView story={story} scene={scene} lang={lang} format={format} lines={lines} duration={st.duration} />
            </SceneTransition>
          </Sequence>
        );
      })}
      <Soundtrack story={story} timing={timing} />
      {timing.lines
        .filter((l) => l.audio)
        .map((l) => (
          <Sequence key={l.id} from={l.start} durationInFrames={l.duration + gap} name={`voice ${l.id}`}>
            <Html5Audio src={staticFile(l.audio!)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};

/** Reads the TTS manifest (if any) and sizes the video to the real voice length. */
export const calculateStoryMetadata: CalculateMetadataFunction<StoryProps> = async ({ props }) => {
  const story = getStory(props.storyId);
  const manifest = await loadManifest(props.storyId, props.lang);
  const sceneIds = props.format === "vertical" ? story.shortScenes : undefined;
  const { scenes, lines, total } = buildTiming(story, props.lang, manifest, sceneIds);
  return {
    durationInFrames: Math.max(1, total),
    props: { ...props, timing: { scenes, lines } },
  };
};
