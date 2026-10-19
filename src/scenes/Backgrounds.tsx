import React from "react";
import { useSvgId } from "../characters/parts";
import { C } from "../config/palette";
import type { BackgroundKey } from "../lib/types";

/* Backgrounds are drawn on a 1920×1080 stage. Ground line is around y = 900. */

export const MOON = { x: 1300, y: 300, r: 190 };

const Sky: React.FC<{ stops: string[] }> = ({ stops }) => {
  const id = useSvgId("sky");
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {stops.map((c, i) => (
            <stop key={i} offset={`${(i / (stops.length - 1)) * 100}%`} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <rect y={-200} width={1920} height={1500} fill={`url(#${id})`} />
    </>
  );
};

const Cloud: React.FC<{ x: number; y: number; s?: number; color?: string }> = ({ x, y, s = 1, color = C.white }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
    <ellipse cx={0} cy={0} rx={90} ry={40} />
    <circle cx={-40} cy={-22} r={42} />
    <circle cx={22} cy={-34} r={52} />
    <circle cx={70} cy={-8} r={34} />
  </g>
);

const Palm: React.FC<{ x: number; y: number; s?: number; trunk?: string; leaf?: string; sway: number }> = ({
  x,
  y,
  s = 1,
  trunk = "#A7703F",
  leaf = C.leafDeep,
  sway,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 0 Q 30 -180 -10 -380" stroke={trunk} strokeWidth={26} fill="none" strokeLinecap="round" />
    <g transform={`translate(-10 -380) rotate(${sway})`} fill={leaf}>
      {[-150, -110, -60, -20, 20, 70, 160].map((a, i) => (
        <path key={i} d="M 0 0 Q 70 -40 150 10 Q 70 -10 0 0 Z" transform={`rotate(${a})`} />
      ))}
      <circle cx={0} cy={6} r={14} fill="#7A4E2D" />
      <circle cx={16} cy={10} r={12} fill="#7A4E2D" />
    </g>
  </g>
);

/** A small Thai stilt house with a curved gable roof. */
const ThaiHut: React.FC<{ x: number; y: number; s?: number; tone?: number }> = ({ x, y, s = 1, tone = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={tone}>
    <rect x={-70} y={-40} width={10} height={40} fill="#7A4E2D" />
    <rect x={60} y={-40} width={10} height={40} fill="#7A4E2D" />
    <rect x={-80} y={-130} width={160} height={92} fill="#C98B4E" />
    <rect x={-22} y={-104} width={44} height={66} fill="#8A5A2B" />
    <path d="M -110 -126 L 0 -230 L 110 -126 Z" fill={C.brick} />
    {/* gable horns (ngao) */}
    <path d="M -110 -126 q -14 -6 -18 -22" stroke={C.gold} strokeWidth={7} fill="none" strokeLinecap="round" />
    <path d="M 110 -126 q 14 -6 18 -22" stroke={C.gold} strokeWidth={7} fill="none" strokeLinecap="round" />
    <path d="M 0 -230 q 6 -18 -4 -30" stroke={C.gold} strokeWidth={7} fill="none" strokeLinecap="round" />
  </g>
);

const Hills: React.FC<{ far: string; near: string }> = ({ far, near }) => (
  <>
    <path d="M 0 720 Q 300 560 620 690 Q 900 600 1220 700 Q 1560 580 1920 690 L 1920 1300 L 0 1300 Z" fill={far} />
    <path d="M 0 800 Q 420 700 860 790 Q 1300 720 1920 800 L 1920 1300 L 0 1300 Z" fill={near} />
  </>
);

const Ground: React.FC<{ color: string; edge: string }> = ({ color, edge }) => (
  <>
    <rect x={0} y={880} width={1920} height={420} fill={color} />
    <path d="M 0 880 Q 480 860 960 880 Q 1440 900 1920 880" stroke={edge} strokeWidth={8} fill="none" />
  </>
);

const Flowers: React.FC<{ t: number; dim?: number }> = ({ t, dim = 1 }) => (
  <g opacity={dim}>
    {[120, 300, 1620, 1800, 1500, 220].map((x, i) => (
      <g key={i} transform={`translate(${x} ${960 + (i % 3) * 30}) rotate(${Math.sin(t * 2 + i) * 5})`}>
        <line x1={0} y1={0} x2={0} y2={-40} stroke={C.leafDeep} strokeWidth={5} />
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={0} cy={-52} rx={9} ry={16} fill={i % 2 ? C.pink : C.gold} transform={`rotate(${a} 0 -40)`} />
        ))}
        <circle cx={0} cy={-40} r={7} fill={C.white} />
      </g>
    ))}
  </g>
);

const River: React.FC<{ t: number; color: string; deep: string }> = ({ t, color, deep }) => (
  <g>
    <path d="M 0 840 Q 600 800 1100 830 Q 1500 855 1920 820 L 1920 885 Q 1400 905 960 885 Q 480 865 0 885 Z" fill={color} />
    {Array.from({ length: 6 }).map((_, i) => {
      const x = ((i * 340 + t * 40) % 2100) - 100;
      return <path key={i} d={`M ${x} 856 q 20 -10 40 0`} stroke={deep} strokeWidth={5} fill="none" strokeLinecap="round" />;
    })}
  </g>
);

const Stars: React.FC<{ t: number; count?: number }> = ({ t, count = 60 }) => (
  <g>
    {Array.from({ length: count }).map((_, i) => {
      const x = (i * 397) % 1920;
      const y = (i * 151) % 620;
      const tw = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7);
      const r = 2 + (i % 3);
      return <circle key={i} cx={x} cy={y} r={r} fill={C.moon} opacity={0.35 + tw * 0.65} />;
    })}
  </g>
);

const Moon: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => {
  const id = useSvgId("halo");
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="55%" stopColor={C.moon} stopOpacity={0.5} />
          <stop offset="100%" stopColor={C.moon} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r * 1.7} fill={`url(#${id})`} />
      <circle cx={x} cy={y} r={r} fill={C.moon} />
      <circle cx={x - r * 0.45} cy={y + r * 0.4} r={r * 0.12} fill={C.moonShade} opacity={0.6} />
      <circle cx={x + r * 0.5} cy={y - r * 0.35} r={r * 0.08} fill={C.moonShade} opacity={0.6} />
    </g>
  );
};

/** Host stage: cream backdrop, a simple Thai-style scalloped border, lotus sparkles. */
const Stage: React.FC<{ t: number }> = ({ t }) => {
  const glow = useSvgId("stage");
  return (
    <g>
      <defs>
        <radialGradient id={glow} cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor={C.white} />
          <stop offset="100%" stopColor={C.cream} />
        </radialGradient>
      </defs>
      <rect y={-200} width={1920} height={1500} fill={`url(#${glow})`} />
      {/* sun rays */}
      <g transform={`translate(960 640) rotate(${t * 4})`} opacity={0.18}>
        {Array.from({ length: 16 }).map((_, i) => (
          <path key={i} d="M 0 0 L -60 -1200 L 60 -1200 Z" fill={i % 2 ? C.gold : C.pinkSoft} transform={`rotate(${i * 22.5})`} />
        ))}
      </g>
      {/* scalloped top border, like a temple eave */}
      <rect x={0} y={0} width={1920} height={56} fill={C.brick} />
      {Array.from({ length: 25 }).map((_, i) => (
        <path key={i} d={`M ${i * 80} 56 q 40 70 80 0 Z`} fill={C.gold} />
      ))}
      {Array.from({ length: 25 }).map((_, i) => (
        <circle key={`d${i}`} cx={i * 80 + 40} cy={80} r={8} fill={C.pink} />
      ))}
      {/* floor */}
      <path d="M 0 930 Q 960 880 1920 930 L 1920 1300 L 0 1300 Z" fill={C.pinkSoft} />
      <path d="M 0 960 Q 960 910 1920 960" stroke={C.pink} strokeWidth={6} fill="none" opacity={0.5} />
      {/* floating lotus sparkles */}
      {[260, 520, 1400, 1660].map((x, i) => (
        <g key={i} transform={`translate(${x} ${360 + Math.sin(t * 1.4 + i) * 18 + (i % 2) * 120})`}>
          {[-50, -25, 0, 25, 50].map((a) => (
            <ellipse key={a} cx={0} cy={-26} rx={12} ry={28} fill={i % 2 ? C.pink : C.pinkSoft} transform={`rotate(${a} 0 0)`} />
          ))}
          <ellipse cx={0} cy={2} rx={36} ry={10} fill={C.leaf} />
        </g>
      ))}
    </g>
  );
};

export const Background: React.FC<{ kind: BackgroundKey; t: number }> = ({ kind, t }) => {
  const drift = (base: number, speed: number) => ((base + t * speed) % 2300) - 200;
  const sway = Math.sin(t * 1.2) * 4;

  switch (kind) {
    case "stage":
      return <Stage t={t} />;

    case "forest-day":
      return (
        <g>
          <Sky stops={["#7CC8FF", C.sky, C.skyLight]} />
          <circle cx={260} cy={190} r={90} fill="#FFE27A" />
          <circle cx={260} cy={190} r={130} fill="#FFE27A" opacity={0.25} />
          <Cloud x={drift(500, 12)} y={170} />
          <Cloud x={drift(1300, 8)} y={240} s={0.8} />
          <Cloud x={drift(1900, 10)} y={130} s={0.6} />
          <Hills far="#9BD98A" near="#7CCB5E" />
          <ThaiHut x={1640} y={760} s={0.7} />
          <Palm x={140} y={900} s={1.1} sway={sway} />
          <Palm x={1780} y={900} s={1.25} sway={-sway} />
          <Palm x={1520} y={830} s={0.7} sway={sway} />
          <River t={t} color={C.river} deep={C.riverDeep} />
          <Ground color={C.grass} edge={C.leaf} />
          <Flowers t={t} />
        </g>
      );

    case "forest-evening":
      return (
        <g>
          <Sky stops={[C.duskPurple, C.duskPink, C.dusk, "#FFD29A"]} />
          <Moon x={1500} y={300 - Math.min(t, 6) * 8} r={110} />
          <Cloud x={drift(300, 6)} y={200} s={0.8} color="#FFB8C9" />
          <Hills far="#C46A8E" near="#8E5A8C" />
          <ThaiHut x={1700} y={770} s={0.6} tone={0.85} />
          <Palm x={140} y={900} s={1.1} trunk="#6B3F4F" leaf="#4E3A6B" sway={sway} />
          <Palm x={1780} y={900} s={1.25} trunk="#6B3F4F" leaf="#4E3A6B" sway={-sway} />
          <River t={t} color="#E59AB5" deep="#B96A8E" />
          <Ground color="#6FA35A" edge="#4E7F45" />
          <Flowers t={t} dim={0.8} />
        </g>
      );

    case "campfire":
      return (
        <g>
          <Sky stops={[C.indigoDeep, C.indigo, C.duskPurple]} />
          <Stars t={t} count={45} />
          <Moon x={1650} y={180} r={70} />
          <Hills far="#3B3478" near="#2C285F" />
          <Palm x={140} y={900} s={1.1} trunk="#3A2C4E" leaf="#24203F" sway={sway} />
          <Palm x={1780} y={900} s={1.25} trunk="#3A2C4E" leaf="#24203F" sway={-sway} />
          <Ground color="#3E6B4A" edge="#2E5238" />
          {/* warm light pooled around the fire */}
          <ellipse cx={960} cy={900} rx={520} ry={120} fill={C.gold} opacity={0.18} />
        </g>
      );

    case "night-moon":
      return (
        <g>
          <Sky stops={[C.indigoDeep, C.indigo, "#5A4E9C"]} />
          <Stars t={t} />
          <Moon x={MOON.x} y={MOON.y} r={MOON.r} />
          <Hills far="#3B3478" near="#2C285F" />
          <ThaiHut x={300} y={780} s={0.6} tone={0.5} />
          <Palm x={1780} y={920} s={1.2} trunk="#3A2C4E" leaf="#24203F" sway={sway} />
          <Ground color="#33593F" edge="#264532" />
          {/* fireflies */}
          {Array.from({ length: 10 }).map((_, i) => (
            <circle
              key={i}
              cx={200 + ((i * 173 + t * 30) % 1500)}
              cy={760 + Math.sin(t * 2 + i) * 40}
              r={5}
              fill="#FFF59A"
              opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i))}
            />
          ))}
        </g>
      );
  }
};
