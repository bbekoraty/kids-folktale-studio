import React from "react";
import { interpolate } from "remotion";
import { useSvgId } from "../characters/parts";
import { C } from "../config/palette";
import type { PropKey } from "../lib/types";

/* Props: (0, 0) is the bottom-centre resting point. `t` = seconds since the prop appeared. */

const Fish: React.FC<{ t: number }> = ({ t }) => (
  <g transform={`rotate(${Math.sin(t * 5) * 4})`}>
    <ellipse cx={0} cy={-26} rx={44} ry={24} fill="#5BA8E8" />
    <path d="M 38 -26 L 70 -48 L 70 -4 Z" fill="#3F86C9" />
    <ellipse cx={-6} cy={-18} rx={26} ry={9} fill="#BFE3FF" />
    <circle cx={-24} cy={-32} r={6} fill={C.ink} />
    <circle cx={-22} cy={-34} r={2} fill={C.white} />
  </g>
);

const Mango: React.FC = () => (
  <g>
    <ellipse cx={0} cy={-30} rx={28} ry={32} fill={C.gold} transform="rotate(-20 0 -30)" />
    <ellipse cx={-8} cy={-40} rx={9} ry={14} fill="#FFE38A" transform="rotate(-20 -8 -40)" />
    <path d="M 10 -60 Q 30 -80 44 -66 Q 28 -58 10 -60 Z" fill={C.leaf} />
  </g>
);

const Corn: React.FC = () => (
  <g>
    <ellipse cx={0} cy={-40} rx={20} ry={40} fill="#FFD84D" />
    {Array.from({ length: 5 }).map((_, i) => (
      <line key={i} x1={-14} x2={14} y1={-66 + i * 12} y2={-66 + i * 12} stroke={C.goldDeep} strokeWidth={2} />
    ))}
    <path d="M -4 0 Q -40 -30 -26 -70 Q -16 -30 0 -10 Z" fill={C.leaf} />
    <path d="M 4 0 Q 40 -30 26 -70 Q 16 -30 0 -10 Z" fill={C.leafDeep} />
  </g>
);

const Grass: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {[-24, -8, 8, 24].map((dx, i) => (
      <path
        key={i}
        d={`M ${dx} 0 Q ${dx + Math.sin(t * 3 + i) * 6} -30 ${dx + (i % 2 ? 10 : -10)} -54`}
        stroke={C.leaf}
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
      />
    ))}
  </g>
);

const Fire: React.FC<{ t: number }> = ({ t }) => {
  const f = (k: number) => 1 + Math.sin(t * 11 + k) * 0.08;
  return (
    <g>
      {/* logs */}
      <rect x={-80} y={-22} width={160} height={22} rx={11} fill="#8A5A2B" transform="rotate(8)" />
      <rect x={-80} y={-22} width={160} height={22} rx={11} fill="#6E4520" transform="rotate(-8)" />
      <g transform={`scale(${f(0)} ${f(1)})`}>
        <path d="M 0 -20 C -70 -40 -50 -130 0 -200 C 50 -130 70 -40 0 -20 Z" fill={C.orange} />
      </g>
      <g transform={`scale(${f(2)} ${f(3)})`}>
        <path d="M 0 -20 C -44 -40 -34 -100 0 -150 C 34 -100 44 -40 0 -20 Z" fill={C.gold} />
      </g>
      <g transform={`scale(${f(4)} ${f(5)})`}>
        <path d="M 0 -20 C -20 -36 -16 -66 0 -96 C 16 -66 20 -36 0 -20 Z" fill="#FFF3B0" />
      </g>
    </g>
  );
};

const PETAL_COLORS = [C.pink, C.pinkSoft, C.gold, C.white, "#FF9EC2"];

const Petals: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {/* soft pile of petals where the fire was */}
    {Array.from({ length: 22 }).map((_, i) => {
      const a = (i * 137.5 * Math.PI) / 180;
      const r = 20 + (i % 6) * 14;
      return (
        <ellipse
          key={`p${i}`}
          cx={Math.cos(a) * r * 1.6}
          cy={-10 - Math.abs(Math.sin(a)) * r * 0.5}
          rx={16}
          ry={9}
          fill={PETAL_COLORS[i % PETAL_COLORS.length]}
          transform={`rotate(${i * 33} ${Math.cos(a) * r * 1.6} ${-10 - Math.abs(Math.sin(a)) * r * 0.5})`}
        />
      );
    })}
    {/* petals floating up */}
    {Array.from({ length: 14 }).map((_, i) => {
      const life = (t * 0.5 + i * 0.13) % 1;
      const x = Math.sin(i * 2.1 + t * 1.3) * 90 + (i - 7) * 14;
      const y = -life * 340;
      return (
        <ellipse
          key={`f${i}`}
          cx={x}
          cy={y}
          rx={12}
          ry={7}
          fill={PETAL_COLORS[i % PETAL_COLORS.length]}
          opacity={1 - life}
          transform={`rotate(${t * 90 + i * 40} ${x} ${y})`}
        />
      );
    })}
  </g>
);

/** The rabbit picture appearing on the moon. Placed at the moon centre. */
const MoonRabbit: React.FC<{ t: number }> = ({ t }) => {
  const glow = useSvgId("mglow");
  const show = interpolate(t, [0.3, 2.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <g>
      <defs>
        <radialGradient id={glow}>
          <stop offset="60%" stopColor={C.moon} stopOpacity={0.7} />
          <stop offset="100%" stopColor={C.moon} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle r={260 + show * 30} fill={`url(#${glow})`} opacity={show} />
      <g opacity={show * 0.75} fill={C.moonShade}>
        {/* a sitting rabbit, drawn in moon shadow */}
        <ellipse cx={-10} cy={40} rx={70} ry={58} />
        <ellipse cx={40} cy={-20} rx={46} ry={40} />
        <ellipse cx={30} cy={-92} rx={14} ry={46} transform="rotate(-14 30 -92)" />
        <ellipse cx={58} cy={-88} rx={14} ry={44} transform="rotate(12 58 -88)" />
        <circle cx={-78} cy={56} r={18} />
      </g>
    </g>
  );
};

export const Prop: React.FC<{ prop: PropKey; t: number }> = ({ prop, t }) => {
  switch (prop) {
    case "fish":
      return <Fish t={t} />;
    case "mango":
      return <Mango />;
    case "corn":
      return <Corn />;
    case "grass":
      return <Grass t={t} />;
    case "fire":
      return <Fire t={t} />;
    case "petals":
      return <Petals t={t} />;
    case "moon-rabbit":
      return <MoonRabbit t={t} />;
  }
};
