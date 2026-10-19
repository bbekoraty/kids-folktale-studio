import React from "react";
import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import { C } from "../config/palette";

export const FONT = "'Mali', 'Noto Sans Thai', sans-serif";

/** Subtitle bubble for the line being spoken. */
export const Subtitle: React.FC<{
  text: string;
  local: number;
  duration: number;
  speakerColor: string;
  size: number;
  maxWidth: number;
  bottom: number;
}> = ({ text, local, duration, speakerColor, size, maxWidth, bottom }) => {
  const { fps } = useVideoConfig();
  if (local < 0 || local > duration) return null;
  const pop = spring({ frame: local, fps, config: { damping: 14, stiffness: 160 } });
  const out = interpolate(local, [duration - 6, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        display: "flex",
        justifyContent: "center",
        opacity: out,
        transform: `translateY(${(1 - pop) * 30}px) scale(${0.9 + pop * 0.1})`,
      }}
    >
      <div
        style={{
          maxWidth,
          background: "rgba(255,255,255,0.94)",
          borderRadius: 32,
          padding: `${size * 0.35}px ${size * 0.7}px`,
          borderBottom: `8px solid ${speakerColor}`,
          boxShadow: "0 8px 24px rgba(43,35,64,0.18)",
          fontFamily: FONT,
          fontSize: size,
          lineHeight: 1.35,
          color: C.ink,
          textAlign: "center",
          fontWeight: 600,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Big title card (story title on the intro, the moral on the outro). */
export const TitleCard: React.FC<{
  text: string;
  label?: string;
  local: number;
  top: number;
  size: number;
  maxWidth: number;
}> = ({ text, label, local, top, size, maxWidth }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: local - 6, fps, config: { damping: 11, stiffness: 120 } });
  const float = Math.sin(local / 18) * 4;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${float}px) scale(${pop})`,
      }}
    >
      <div
        style={{
          maxWidth,
          background: C.white,
          border: `8px solid ${C.gold}`,
          outline: `6px solid ${C.brick}`,
          borderRadius: 40,
          padding: `${size * 0.3}px ${size * 0.7}px`,
          fontFamily: FONT,
          textAlign: "center",
          color: C.ink,
          boxShadow: "0 12px 32px rgba(43,35,64,0.2)",
        }}
      >
        {label ? (
          <div style={{ fontSize: size * 0.5, color: C.pink, fontWeight: 700, marginBottom: 4 }}>{label}</div>
        ) : null}
        <div style={{ fontSize: size, fontWeight: 700, lineHeight: 1.25 }}>{text}</div>
      </div>
    </div>
  );
};

export const fadeInOut = (frame: number, duration: number, len = 9) =>
  interpolate(frame, [0, len, duration - len, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
