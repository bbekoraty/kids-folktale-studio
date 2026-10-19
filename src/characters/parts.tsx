import React, { useId } from "react";
import { C } from "../config/palette";

/** Animation state every character receives. */
export interface Pose {
  /** Mouth openness 0..1 (driven by TTS audio). */
  talk: number;
  /** Eyes closed this frame. */
  blink: boolean;
  /** Seconds since the scene started (for idle sway). */
  t: number;
  /** Arm wave active. */
  waving: boolean;
}

export const useSvgId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

/** Two shiny cartoon eyes. */
export const Eyes: React.FC<{
  cx: number;
  cy: number;
  gap: number;
  rx?: number;
  ry?: number;
  blink: boolean;
}> = ({ cx, cy, gap, rx = 12, ry = 16, blink }) => (
  <g>
    {[-1, 1].map((side) =>
      blink ? (
        <path
          key={side}
          d={`M ${cx + side * gap - rx} ${cy} Q ${cx + side * gap} ${cy + ry * 0.6} ${cx + side * gap + rx} ${cy}`}
          stroke={C.ink}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <g key={side}>
          <ellipse cx={cx + side * gap} cy={cy} rx={rx} ry={ry} fill={C.ink} />
          <circle cx={cx + side * gap + rx * 0.3} cy={cy - ry * 0.4} r={rx * 0.38} fill={C.white} />
          <circle cx={cx + side * gap - rx * 0.35} cy={cy + ry * 0.35} r={rx * 0.16} fill={C.white} />
        </g>
      ),
    )}
  </g>
);

/** Cute cat-style mouth: a small "w" when closed, a round mouth when talking. */
export const Mouth: React.FC<{ cx: number; cy: number; size?: number; talk: number }> = ({
  cx,
  cy,
  size = 1,
  talk,
}) => {
  const open = Math.max(0, Math.min(1, talk));
  if (open < 0.08) {
    const w = 11 * size;
    return (
      <path
        d={`M ${cx - w * 1.6} ${cy - 2} Q ${cx - w * 0.8} ${cy + w} ${cx} ${cy} Q ${cx + w * 0.8} ${cy + w} ${cx + w * 1.6} ${cy - 2}`}
        stroke={C.ink}
        strokeWidth={4.5 * size}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    );
  }
  const w = (13 + open * 5) * size;
  const h = (6 + open * 20) * size;
  return (
    <g>
      <ellipse cx={cx} cy={cy + h * 0.45} rx={w} ry={h} fill={C.ink} />
      <ellipse cx={cx} cy={cy + h * 0.95} rx={w * 0.6} ry={h * 0.45} fill={C.blush} />
    </g>
  );
};

export const Cheeks: React.FC<{ cx: number; cy: number; gap: number; r?: number }> = ({
  cx,
  cy,
  gap,
  r = 14,
}) => (
  <g opacity={0.55}>
    <ellipse cx={cx - gap} cy={cy} rx={r * 1.2} ry={r * 0.8} fill={C.blush} />
    <ellipse cx={cx + gap} cy={cy} rx={r * 1.2} ry={r * 0.8} fill={C.blush} />
  </g>
);

/** Soft ground shadow under a character. */
export const Shadow: React.FC<{ rx: number }> = ({ rx }) => (
  <ellipse cx={0} cy={4} rx={rx} ry={rx * 0.18} fill={C.ink} opacity={0.18} />
);

/** Pha khao ma (ผ้าขาวม้า) checked cloth — a small Thai touch on characters. */
export const PhaKhaoMa: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  a: string;
  b: string;
  rx?: number;
}> = ({ x, y, w, h, a, b, rx = 10 }) => {
  const id = useSvgId("pkm");
  const cell = h / 2;
  return (
    <g>
      <defs>
        <pattern id={id} width={cell * 2} height={cell * 2} patternUnits="userSpaceOnUse" x={x} y={y}>
          <rect width={cell * 2} height={cell * 2} fill={a} />
          <rect width={cell} height={cell * 2} fill={b} opacity={0.55} />
          <rect width={cell * 2} height={cell} fill={b} opacity={0.55} />
        </pattern>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#${id})`} />
    </g>
  );
};
