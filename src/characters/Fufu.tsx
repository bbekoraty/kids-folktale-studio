import React from "react";
import { C } from "../config/palette";
import { Cheeks, Eyes, Mouth, PhaKhaoMa, Shadow, useSvgId, type Pose } from "./parts";

/**
 * Fufu (ฟูฟู) — the channel's host, a fluffy lion cub with a pha khao ma scarf.
 * Local coordinates: feet at (0, 0), facing the viewer, about 350 units tall.
 * Every part is drawn here once, so Fufu looks the same in every episode.
 */
export const Fufu: React.FC<{ pose: Pose }> = ({ pose }) => {
  const mane = useSvgId("mane");
  const fur = useSvgId("fur");
  const { t, talk, blink, waving } = pose;

  const head = { x: 0, y: -272 };
  const maneR = 102;
  const bumps = 16;
  const sway = Math.sin(t * 2.2) * 2.5;
  const armAngle = waving ? -118 + Math.sin(t * 9) * 20 : -10;
  const tail = Math.sin(t * 2.6) * 10;

  return (
    <g>
      <defs>
        <linearGradient id={mane} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD54A" />
          <stop offset="55%" stopColor={C.goldDeep} />
          <stop offset="100%" stopColor={C.brick} />
        </linearGradient>
        <linearGradient id={fur} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFCB5C" />
          <stop offset="100%" stopColor={C.goldDeep} />
        </linearGradient>
      </defs>

      <Shadow rx={95} />

      {/* tail */}
      <g transform={`rotate(${tail} -55 -60)`}>
        <path d="M -55 -60 C -120 -60 -130 -120 -150 -150" stroke={C.goldDeep} strokeWidth={14} fill="none" strokeLinecap="round" />
        <circle cx={-152} cy={-160} r={22} fill={C.brick} />
        <circle cx={-142} cy={-170} r={14} fill={C.orange} />
      </g>

      {/* legs */}
      <rect x={-52} y={-78} width={40} height={78} rx={20} fill={`url(#${fur})`} />
      <rect x={12} y={-78} width={40} height={78} rx={20} fill={`url(#${fur})`} />
      <ellipse cx={-32} cy={-6} rx={30} ry={14} fill={C.cream} />
      <ellipse cx={32} cy={-6} rx={30} ry={14} fill={C.cream} />

      {/* back arm */}
      <g transform="rotate(14 -62 -136)">
        <rect x={-80} y={-146} width={34} height={84} rx={17} fill={C.goldDeep} stroke="#C9761A" strokeWidth={3} />
        <circle cx={-63} cy={-62} r={19} fill={C.cream} stroke="#E3BF8E" strokeWidth={3} />
      </g>

      {/* body */}
      <ellipse cx={0} cy={-112} rx={76} ry={80} fill={`url(#${fur})`} />
      <ellipse cx={0} cy={-96} rx={46} ry={50} fill={C.cream} />

      {/* head */}
      <g transform={`rotate(${sway} ${head.x} ${head.y + 80})`}>
        {/* ears */}
        <circle cx={-82} cy={head.y - 104} r={26} fill={C.orange} />
        <circle cx={-82} cy={head.y - 104} r={14} fill={C.pinkSoft} />
        <circle cx={82} cy={head.y - 104} r={26} fill={C.orange} />
        <circle cx={82} cy={head.y - 104} r={14} fill={C.pinkSoft} />

        {/* fluffy mane: a ring of bumps */}
        <g fill={`url(#${mane})`}>
          <circle cx={head.x} cy={head.y} r={maneR} />
          {Array.from({ length: bumps }).map((_, i) => {
            const a = (i / bumps) * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={head.x + Math.cos(a) * maneR}
                cy={head.y + Math.sin(a) * maneR * 0.95}
                r={31}
              />
            );
          })}
        </g>
        {/* little top curl */}
        <path d={`M -14 ${head.y - 126} q 14 -26 30 -6`} stroke="#FFD54A" strokeWidth={10} fill="none" strokeLinecap="round" />

        {/* face */}
        <ellipse cx={head.x} cy={head.y + 8} rx={82} ry={74} fill={C.cream} />
        <Eyes cx={0} cy={head.y - 4} gap={32} rx={11} ry={16} blink={blink} />
        <Cheeks cx={0} cy={head.y + 26} gap={54} r={12} />
        <path d={`M -11 ${head.y + 14} L 11 ${head.y + 14} L 0 ${head.y + 26} Z`} fill={C.orange} stroke={C.orange} strokeWidth={6} strokeLinejoin="round" />
        <Mouth cx={0} cy={head.y + 34} talk={talk} size={0.95} />
      </g>

      {/* pha khao ma scarf, tied in front of the mane */}
      <g transform={`rotate(${14 + sway} 34 -136)`}>
        <PhaKhaoMa x={22} y={-140} w={28} h={66} a="#3F7FD6" b={C.pink} rx={8} />
      </g>
      <PhaKhaoMa x={-66} y={-160} w={132} h={30} a="#3F7FD6" b={C.pink} rx={15} />
      <circle cx={36} cy={-145} r={13} fill="#3F7FD6" />

      {/* waving arm */}
      <g transform={`rotate(${armAngle} 62 -136)`}>
        <rect x={46} y={-146} width={34} height={84} rx={17} fill={C.goldDeep} stroke="#C9761A" strokeWidth={3} />
        <circle cx={63} cy={-62} r={19} fill={C.cream} stroke="#E3BF8E" strokeWidth={3} />
      </g>
    </g>
  );
};
