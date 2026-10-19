import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import React from "react";
import { staticFile, useVideoConfig } from "remotion";

/**
 * Turns the active line into a mouth-open value 0..1.
 * With TTS audio: follows the real loudness (lip sync).
 * Without audio yet: a soft "talking" rhythm so previews still look alive.
 * `frame` and `start` are relative to the current scene.
 */
type Props = {
  frame: number;
  start: number;
  duration: number;
  children: (talk: number) => React.ReactNode;
};

const AudioTalk: React.FC<Props & { src: string }> = ({ src, frame, start, duration, children }) => {
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(src));
  const local = frame - start;
  if (!audioData || local < 0 || local >= duration) return <>{children(0)}</>;
  const bins = visualizeAudio({ fps, frame: local, audioData, numberOfSamples: 32 });
  const voice = bins.slice(1, 12);
  const level = voice.reduce((a, b) => a + b, 0) / voice.length;
  return <>{children(Math.min(1, level * 9))}</>;
};

const FakeTalk: React.FC<Props> = ({ frame, start, duration, children }) => {
  const local = frame - start;
  if (local < 0 || local >= duration - 3) return <>{children(0)}</>;
  const v = Math.abs(Math.sin(local * 0.55)) * (0.55 + 0.45 * Math.abs(Math.sin(local * 0.13)));
  return <>{children(v)}</>;
};

export const Talk: React.FC<Props & { src: string | null }> = ({ src, ...rest }) =>
  src ? <AudioTalk src={src} {...rest} /> : <FakeTalk {...rest} />;
