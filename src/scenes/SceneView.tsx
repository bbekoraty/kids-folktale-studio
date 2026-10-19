import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Actor, isBlinking } from "../characters";
import { Fufu } from "../characters/Fufu";
import type { LangCode } from "../config/languages";
import { C } from "../config/palette";
import { SPEAKER_COLOR, SPEAKER_STAND_IN, UI } from "../config/ui";
import { t as tr } from "../lib/text";
import type { Format, LineTiming, Scene, Story } from "../lib/types";
import { Background } from "./Backgrounds";
import { fadeInOut, FONT, Subtitle, TitleCard } from "./Overlays";
import { Prop } from "./Props";
import { Talk } from "./Talk";

/** Lift the stage so subtitles sit on the ground, not over the characters. */
const STAGE_LIFT = -95;

type Props = {
  story: Story;
  scene: Scene;
  lang: LangCode;
  format: Format;
  /** Line timings relative to this scene's start. */
  lines: LineTiming[];
  duration: number;
};

export const SceneView: React.FC<Props> = ({ story, scene, lang, format, lines, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  const lineStart = (id?: string) => (id ? (lines.find((l) => l.id === id)?.start ?? 0) : 0);

  // The active line stays active until the next one starts, so the subtitle never flickers.
  const activeIndex = lines.reduce((acc, l, i) => (frame >= l.start ? i : acc), -1);
  const active = activeIndex >= 0 ? lines[activeIndex] : null;
  const activeLine = active ? scene.lines.find((l) => l.id === active.id) ?? null : null;

  const castKeys = scene.cast.map((c) => c.character);
  const speaker = activeLine?.speaker;
  const mouthOwner =
    speaker && !castKeys.includes(speaker) && SPEAKER_STAND_IN[speaker] && castKeys.includes(SPEAKER_STAND_IN[speaker]!)
      ? SPEAKER_STAND_IN[speaker]
      : speaker;

  const zoom = interpolate(frame, [0, duration], [1, scene.zoomTo ?? 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const vertical = format === "vertical";
  const opacity = fadeInOut(frame, duration);

  const stage = (talk: number) => (
    <g transform={`translate(0 ${STAGE_LIFT}) translate(960 700) scale(${zoom}) translate(-960 -700)`}>
      <Background kind={scene.background} t={sec} />
      {(scene.props ?? []).map((p, i) => {
        const from = lineStart(p.fromLine);
        const until = p.untilLine ? lineStart(p.untilLine) : Infinity;
        if (frame < from || frame >= until + 8) return null;
        const appear = interpolate(frame - from, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const vanish = interpolate(frame - until, [0, 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const s = (p.scale ?? 1) * (frame >= until ? vanish : appear);
        return (
          <g key={i} transform={`translate(${p.x} ${p.y}) scale(${s})`} opacity={frame >= until ? vanish : 1}>
            <Prop prop={p.prop} t={(frame - from) / fps} />
          </g>
        );
      })}
      {scene.cast.map((m, i) => (
        <Actor
          key={`${m.character}-${i}`}
          member={m}
          frame={frame}
          fps={fps}
          talk={m.character === mouthOwner ? talk : 0}
          appearFrame={lineStart(m.fromLine)}
          actionFrame={lineStart(m.actionAt)}
        />
      ))}
    </g>
  );

  const narrator = (talk: number) =>
    scene.narratorCorner ? (
      <g transform={`translate(${vertical ? 170 : 175} ${vertical ? 1990 : 1150}) scale(${vertical ? 0.85 : 0.68})`}>
        <Fufu
          pose={{
            talk: speaker === "fufu" ? talk : 0,
            blink: isBlinking(frame, "fufu"),
            t: sec,
            waving: false,
          }}
        />
      </g>
    ) : null;

  const subtitle = active && activeLine ? (
    <Subtitle
      text={tr(activeLine.text, lang)}
      local={frame - active.start}
      duration={(lines[activeIndex + 1]?.start ?? duration) - active.start - 2}
      speakerColor={SPEAKER_COLOR[activeLine.speaker]}
      size={vertical ? 54 : 50}
      maxWidth={vertical ? 900 : 1300}
      bottom={vertical ? 330 : 40}
    />
  ) : null;

  const titleText = scene.showMoral ? tr(story.moral, lang) : scene.title ? tr(scene.title, lang) : null;
  const titleLabel = scene.showMoral ? tr(UI.lesson, lang) : scene.title ? tr(UI.folktale, lang) : undefined;
  const titleCard = titleText ? (
    <TitleCard
      text={titleText}
      label={titleLabel}
      local={frame}
      top={vertical ? 470 : 110}
      size={scene.showMoral ? (vertical ? 52 : 54) : vertical ? 76 : 84}
      maxWidth={vertical ? 940 : 1400}
    />
  ) : null;

  return (
    <Talk src={active?.audio ?? null} frame={frame} start={active?.start ?? 0} duration={active?.duration ?? 0}>
      {(talk) =>
        vertical ? (
          <AbsoluteFill style={{ opacity, backgroundColor: C.indigoDeep }}>
            {/* blurred backdrop fills the 9:16 frame */}
            <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: "blur(28px) brightness(0.85)" }}>
              <Background kind={scene.background} t={sec} />
            </svg>
            {/* the stage, cropped to the centre */}
            <svg viewBox="360 0 1200 1080" style={{ position: "absolute", left: 0, top: 420, width: 1080, height: 972, borderRadius: 0 }}>
              {stage(talk)}
            </svg>
            <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", fontFamily: FONT, color: C.white }}>
              <div style={{ fontSize: 46, fontWeight: 700, opacity: 0.9 }}>{tr(UI.channel, lang)}</div>
              <div style={{ fontSize: 70, fontWeight: 700, textShadow: "0 4px 16px rgba(0,0,0,0.35)" }}>{tr(story.title, lang)}</div>
            </div>
            {titleCard}
            <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
              {narrator(talk)}
            </svg>
            {subtitle}
          </AbsoluteFill>
        ) : (
          <AbsoluteFill style={{ opacity }}>
            <svg viewBox="0 0 1920 1080" style={{ width: "100%", height: "100%" }}>
              {stage(talk)}
              {narrator(talk)}
            </svg>
            {titleCard}
            {subtitle}
          </AbsoluteFill>
        )
      }
    </Talk>
  );
};
