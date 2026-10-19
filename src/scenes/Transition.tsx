import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../config/palette";

export type TransitionKind = "cloud" | "iris" | "sparkle" | "fade";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Puffy cloud band that rides on the wipe edge, so the cut is hidden by clouds. */
const CloudBand: React.FC<{ x: number; height: number }> = ({ x, height }) => {
  const puffs = Math.ceil(height / 150) + 1;
  return (
    <svg
      style={{ position: "absolute", top: 0, left: x - 260, width: 520, height, overflow: "visible" }}
      viewBox={`0 0 520 ${height}`}
    >
      {Array.from({ length: puffs }).map((_, i) => {
        const y = i * 150;
        const off = (i % 2) * 60;
        return (
          <g key={i} fill={C.white}>
            <circle cx={260 + off - 70} cy={y} r={120} />
            <circle cx={260 + off + 40} cy={y + 40} r={140} />
            <circle cx={260 + off - 10} cy={y + 90} r={110} />
          </g>
        );
      })}
      {Array.from({ length: puffs }).map((_, i) => (
        <circle key={`s${i}`} cx={170 + (i % 3) * 70} cy={i * 150 + 60} r={60} fill={C.skyLight} opacity={0.7} />
      ))}
    </svg>
  );
};

/** Little golden stars around the iris edge for the magic moments. */
const SparkleRing: React.FC<{ r: number; cx: number; cy: number; spin: number; opacity: number }> = ({
  r,
  cx,
  cy,
  spin,
  opacity,
}) => (
  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
    {Array.from({ length: 18 }).map((_, i) => {
      const a = (i / 18) * Math.PI * 2 + spin;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const s = 14 + (i % 3) * 8;
      return (
        <path
          key={i}
          d={`M ${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z`}
          fill={i % 2 ? C.gold : "#FFF3B0"}
          opacity={opacity}
        />
      );
    })}
  </svg>
);

/**
 * Wraps a scene: plays its entrance transition over the previous scene (scenes overlap),
 * fades in the very first scene and fades out the very last one.
 */
export const SceneTransition: React.FC<{
  kind: TransitionKind | null;
  length: number;
  sceneDuration: number;
  isFirst: boolean;
  isLast: boolean;
  children: React.ReactNode;
}> = ({ kind, length, sceneDuration, isFirst, isLast, children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = interpolate(frame, [0, length], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  let opacity = 1;
  if (isFirst) opacity *= interpolate(frame, [0, 12], [0, 1], clamp);
  if (isLast) opacity *= interpolate(frame, [sceneDuration - 24, sceneDuration], [1, 0], clamp);

  if (!kind || p >= 1) {
    return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
  }

  if (kind === "fade") {
    return <AbsoluteFill style={{ opacity: opacity * p }}>{children}</AbsoluteFill>;
  }

  if (kind === "cloud") {
    // edge travels left → right; new scene is revealed behind it
    const edge = interpolate(p, [0, 1], [-0.25, 1.25]) * width;
    return (
      <AbsoluteFill style={{ opacity }}>
        <AbsoluteFill style={{ clipPath: `inset(0 ${Math.max(0, width - edge)}px 0 0)` }}>{children}</AbsoluteFill>
        <CloudBand x={edge} height={height} />
      </AbsoluteFill>
    );
  }

  // iris / sparkle: a growing circle from the centre
  const maxR = Math.hypot(width, height) / 2 + 40;
  const r = p * maxR;
  const cx = width / 2;
  const cy = height * 0.52;
  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill style={{ clipPath: `circle(${r}px at ${cx}px ${cy}px)` }}>{children}</AbsoluteFill>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={kind === "sparkle" ? C.gold : C.white} strokeWidth={14} opacity={1 - p * 0.6} />
      </svg>
      {kind === "sparkle" ? <SparkleRing r={r} cx={cx} cy={cy} spin={p * 2} opacity={1 - p * 0.5} /> : null}
    </AbsoluteFill>
  );
};

/** Pick a transition when the story JSON doesn't name one. */
export const autoTransition = (prevBg: string | undefined, bg: string, sceneId: string): TransitionKind => {
  if (bg === "stage") return "iris";
  if (sceneId === "magic" || bg === "night-moon") return "sparkle";
  // same or different place: clouds drift across (a plain crossfade would double-expose the cast)
  void prevBg;
  return "cloud";
};
