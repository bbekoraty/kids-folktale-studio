import "@fontsource/mali/700.css";
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { Actor } from "./characters";
import { Fufu } from "./characters/Fufu";
import type { LangCode } from "./config/languages";
import { C } from "./config/palette";
import { UI } from "./config/ui";
import { t } from "./lib/text";
import { Background } from "./scenes/Backgrounds";
import { FONT } from "./scenes/Overlays";
import { Prop } from "./scenes/Props";
import { getStory } from "./stories";

export type ThumbnailProps = { storyId: string; lang: LangCode };

/**
 * YouTube thumbnail (1280×720): the story's key scene, a big title and Fufu.
 * Pick the scene with "thumbnailScene" in the story JSON.
 */
export const Thumbnail: React.FC<ThumbnailProps> = ({ storyId, lang }) => {
  const [handle] = useState(() => delayRender("Loading fonts"));
  useEffect(() => {
    document.fonts
      .load("700 80px Mali", "กขabc")
      .catch(() => undefined)
      .then(() => continueRender(handle));
  }, [handle]);

  const story = getStory(storyId);
  const scene =
    story.scenes.find((s) => s.id === story.thumbnailScene) ??
    [...story.scenes].filter((s) => s.background !== "stage").sort((a, b) => b.cast.length - a.cast.length)[0] ??
    story.scenes[0];
  const title = t(story.thumbnailTitle ?? story.title, lang);
  // a frame where everyone is on stage and actions have settled
  const frame = 150;

  return (
    <AbsoluteFill style={{ backgroundColor: C.indigoDeep }}>
      <svg viewBox="0 0 1920 1080" style={{ width: "100%", height: "100%" }}>
        <g transform="translate(-120 -40) scale(1.08)">
          <Background kind={scene.background} t={3} />
          {(scene.props ?? [])
            .filter((p) => p.prop !== "fire" || !(scene.props ?? []).some((q) => q.prop === "petals"))
            .map((p, i) => (
              <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.scale ?? 1})`}>
                <Prop prop={p.prop} t={4} />
              </g>
            ))}
          {scene.cast.map((m, i) => (
            <Actor
              key={i}
              member={{ ...m, action: m.action === "walk-in" || m.action === "jump" ? "idle" : m.action }}
              frame={frame}
              fps={30}
              talk={0}
              appearFrame={0}
              actionFrame={0}
            />
          ))}
        </g>
        {/* soft vignette so the title reads */}
        <defs>
          <linearGradient id="thumb-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.indigoDeep} stopOpacity={0.55} />
            <stop offset="45%" stopColor={C.indigoDeep} stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#thumb-fade)" />
        <g transform="translate(1640 1130) scale(1.75)">
          <Fufu pose={{ talk: 0.7, blink: false, t: 0.4, waving: true }} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          top: 44,
          left: 56,
          right: 380,
          fontFamily: FONT,
          color: C.white,
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: C.pink,
            color: C.white,
            fontSize: 30,
            fontWeight: 700,
            padding: "6px 22px",
            borderRadius: 999,
            marginBottom: 14,
          }}
        >
          {t(UI.folktale, lang)}
        </div>
        <div
          style={{
            fontSize: Math.max(...title.split("\n").map((l) => l.length)) > 16 ? 84 : 104,
            whiteSpace: "pre-line",
            fontWeight: 700,
            lineHeight: 1.12,
            WebkitTextStroke: `14px ${C.ink}`,
            paintOrder: "stroke fill",
            textShadow: "0 8px 0 rgba(43,35,64,0.35)",
          }}
        >
          {title}
        </div>
      </div>
    </AbsoluteFill>
  );
};
