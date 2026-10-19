import React from "react";
import { C } from "../config/palette";
import { Cheeks, Eyes, Mouth, Shadow, useSvgId, type Pose } from "./parts";

/* All animals: feet at (0, 0), facing right, about 230–270 units tall. */

export const Rabbit: React.FC<{ pose: Pose }> = ({ pose }) => {
  const { t, talk, blink } = pose;
  const earL = Math.sin(t * 3) * 5;
  const earR = Math.sin(t * 3 + 1) * 6;
  const head = { x: 6, y: -158 };
  return (
    <g>
      <Shadow rx={70} />
      {/* tail */}
      <circle cx={-56} cy={-52} r={22} fill={C.white} stroke={C.creamDeep} strokeWidth={3} />
      {/* feet */}
      <ellipse cx={-22} cy={-10} rx={30} ry={13} fill={C.white} stroke={C.creamDeep} strokeWidth={3} />
      <ellipse cx={30} cy={-10} rx={30} ry={13} fill={C.white} stroke={C.creamDeep} strokeWidth={3} />
      {/* body */}
      <ellipse cx={0} cy={-62} rx={52} ry={56} fill={C.white} stroke={C.creamDeep} strokeWidth={3} />
      <ellipse cx={6} cy={-56} rx={30} ry={34} fill={C.cream} />
      {/* paws */}
      <ellipse cx={34} cy={-74} rx={13} ry={18} fill={C.white} stroke={C.creamDeep} strokeWidth={3} />
      {/* ears */}
      <g transform={`rotate(${-12 + earL} ${head.x - 26} ${head.y - 50})`}>
        <ellipse cx={head.x - 26} cy={head.y - 112} rx={22} ry={62} fill={C.white} stroke={C.creamDeep} strokeWidth={3} />
        <ellipse cx={head.x - 26} cy={head.y - 108} rx={11} ry={46} fill={C.pinkSoft} />
      </g>
      <g transform={`rotate(${14 + earR} ${head.x + 26} ${head.y - 50})`}>
        <ellipse cx={head.x + 26} cy={head.y - 112} rx={22} ry={62} fill={C.white} stroke={C.creamDeep} strokeWidth={3} />
        <ellipse cx={head.x + 26} cy={head.y - 108} rx={11} ry={46} fill={C.pinkSoft} />
      </g>
      {/* head */}
      <ellipse cx={head.x} cy={head.y} rx={72} ry={64} fill={C.white} stroke={C.creamDeep} strokeWidth={3} />
      <Eyes cx={head.x + 6} cy={head.y - 6} gap={28} rx={10} ry={14} blink={blink} />
      <Cheeks cx={head.x + 6} cy={head.y + 20} gap={46} r={11} />
      <ellipse cx={head.x + 6} cy={head.y + 12} rx={8} ry={6} fill={C.pink} />
      <Mouth cx={head.x + 6} cy={head.y + 24} talk={talk} size={0.75} />
    </g>
  );
};

export const Monkey: React.FC<{ pose: Pose }> = ({ pose }) => {
  const { t, talk, blink } = pose;
  const tail = Math.sin(t * 2) * 8;
  const fur = "#A8693A";
  const furDark = "#8A522B";
  const skin = "#F4D2A8";
  const head = { x: 4, y: -170 };
  return (
    <g>
      <Shadow rx={70} />
      <g transform={`rotate(${tail} -40 -60)`}>
        <path d="M -40 -60 C -110 -50 -120 -150 -80 -170 C -50 -185 -40 -150 -62 -140" stroke={furDark} strokeWidth={13} fill="none" strokeLinecap="round" />
      </g>
      <rect x={-40} y={-70} width={30} height={70} rx={15} fill={furDark} />
      <rect x={10} y={-70} width={30} height={70} rx={15} fill={furDark} />
      <ellipse cx={0} cy={-80} rx={54} ry={56} fill={fur} />
      <ellipse cx={4} cy={-72} rx={32} ry={34} fill={skin} />
      <rect x={30} y={-120} width={26} height={70} rx={13} fill={furDark} transform="rotate(-18 43 -120)" />
      {/* ears */}
      <circle cx={head.x - 70} cy={head.y + 2} r={24} fill={fur} />
      <circle cx={head.x - 70} cy={head.y + 2} r={13} fill={skin} />
      <circle cx={head.x + 74} cy={head.y + 2} r={24} fill={fur} />
      <circle cx={head.x + 74} cy={head.y + 2} r={13} fill={skin} />
      <circle cx={head.x} cy={head.y} r={68} fill={fur} />
      {/* heart-shaped face */}
      <path
        d={`M ${head.x + 4} ${head.y + 52} C ${head.x - 62} ${head.y + 30} ${head.x - 62} ${head.y - 44} ${head.x - 20} ${head.y - 40} C ${head.x - 6} ${head.y - 40} ${head.x + 2} ${head.y - 28} ${head.x + 4} ${head.y - 22} C ${head.x + 6} ${head.y - 28} ${head.x + 14} ${head.y - 40} ${head.x + 28} ${head.y - 40} C ${head.x + 70} ${head.y - 44} ${head.x + 70} ${head.y + 30} ${head.x + 4} ${head.y + 52} Z`}
        fill={skin}
      />
      <Eyes cx={head.x + 4} cy={head.y - 10} gap={22} rx={9} ry={13} blink={blink} />
      <Cheeks cx={head.x + 4} cy={head.y + 14} gap={38} r={9} />
      <ellipse cx={head.x - 2} cy={head.y + 10} rx={3} ry={2.5} fill={furDark} />
      <ellipse cx={head.x + 10} cy={head.y + 10} rx={3} ry={2.5} fill={furDark} />
      <Mouth cx={head.x + 4} cy={head.y + 24} talk={talk} size={0.8} />
    </g>
  );
};

export const Otter: React.FC<{ pose: Pose }> = ({ pose }) => {
  const { t, talk, blink } = pose;
  const fur = "#8C6448";
  const furDark = "#6E4A33";
  const light = "#E9CDAF";
  const tail = Math.sin(t * 2.4) * 6;
  const head = { x: 18, y: -176 };
  return (
    <g>
      <Shadow rx={72} />
      <g transform={`rotate(${tail} -40 -30)`}>
        <path d="M -40 -30 Q -110 -10 -140 -40 Q -100 -48 -40 -60 Z" fill={furDark} />
      </g>
      <ellipse cx={-22} cy={-10} rx={26} ry={12} fill={furDark} />
      <ellipse cx={30} cy={-10} rx={26} ry={12} fill={furDark} />
      <ellipse cx={4} cy={-86} rx={50} ry={82} fill={fur} />
      <ellipse cx={14} cy={-78} rx={28} ry={58} fill={light} />
      <ellipse cx={46} cy={-104} rx={12} ry={22} fill={furDark} transform="rotate(-25 46 -104)" />
      <circle cx={head.x - 46} cy={head.y - 40} r={14} fill={furDark} />
      <circle cx={head.x + 46} cy={head.y - 40} r={14} fill={furDark} />
      <ellipse cx={head.x} cy={head.y} rx={62} ry={56} fill={fur} />
      <ellipse cx={head.x + 4} cy={head.y + 22} rx={40} ry={26} fill={light} />
      <Eyes cx={head.x + 4} cy={head.y - 12} gap={26} rx={9} ry={12} blink={blink} />
      <Cheeks cx={head.x + 4} cy={head.y + 14} gap={44} r={9} />
      <ellipse cx={head.x + 4} cy={head.y + 10} rx={10} ry={7} fill={C.ink} />
      {/* whiskers */}
      <g stroke={furDark} strokeWidth={2.5} strokeLinecap="round">
        <line x1={head.x - 18} y1={head.y + 18} x2={head.x - 48} y2={head.y + 12} />
        <line x1={head.x - 18} y1={head.y + 24} x2={head.x - 48} y2={head.y + 28} />
        <line x1={head.x + 26} y1={head.y + 18} x2={head.x + 56} y2={head.y + 12} />
        <line x1={head.x + 26} y1={head.y + 24} x2={head.x + 56} y2={head.y + 28} />
      </g>
      <Mouth cx={head.x + 4} cy={head.y + 26} talk={talk} size={0.7} />
    </g>
  );
};

export const Jackal: React.FC<{ pose: Pose }> = ({ pose }) => {
  const { t, talk, blink } = pose;
  const fur = "#E0A050";
  const furDark = "#C27F35";
  const light = "#FFF1DC";
  const tail = Math.sin(t * 3) * 10;
  const head = { x: 10, y: -168 };
  const tailId = useSvgId("jtail");
  return (
    <g>
      <defs>
        <linearGradient id={tailId} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={fur} />
          <stop offset="75%" stopColor={fur} />
          <stop offset="76%" stopColor={light} />
        </linearGradient>
      </defs>
      <Shadow rx={74} />
      <g transform={`rotate(${tail} -40 -70)`}>
        <ellipse cx={-92} cy={-96} rx={58} ry={24} fill={`url(#${tailId})`} transform="rotate(-30 -92 -96)" />
      </g>
      <rect x={-40} y={-72} width={28} height={72} rx={14} fill={furDark} />
      <rect x={12} y={-72} width={28} height={72} rx={14} fill={furDark} />
      <ellipse cx={0} cy={-84} rx={54} ry={58} fill={fur} />
      <ellipse cx={10} cy={-78} rx={28} ry={38} fill={light} />
      {/* pointy ears */}
      <path d={`M ${head.x - 52} ${head.y - 26} L ${head.x - 50} ${head.y - 110} L ${head.x - 6} ${head.y - 54} Z`} fill={fur} />
      <path d={`M ${head.x - 44} ${head.y - 40} L ${head.x - 44} ${head.y - 90} L ${head.x - 18} ${head.y - 56} Z`} fill={C.pinkSoft} />
      <path d={`M ${head.x + 56} ${head.y - 26} L ${head.x + 58} ${head.y - 110} L ${head.x + 12} ${head.y - 54} Z`} fill={fur} />
      <path d={`M ${head.x + 48} ${head.y - 40} L ${head.x + 50} ${head.y - 90} L ${head.x + 24} ${head.y - 56} Z`} fill={C.pinkSoft} />
      <ellipse cx={head.x} cy={head.y} rx={66} ry={58} fill={fur} />
      {/* muzzle */}
      <ellipse cx={head.x + 14} cy={head.y + 24} rx={42} ry={28} fill={light} />
      <Eyes cx={head.x + 6} cy={head.y - 10} gap={26} rx={9} ry={13} blink={blink} />
      <Cheeks cx={head.x + 6} cy={head.y + 12} gap={46} r={9} />
      <ellipse cx={head.x + 16} cy={head.y + 12} rx={10} ry={7} fill={C.ink} />
      <Mouth cx={head.x + 16} cy={head.y + 26} talk={talk} size={0.75} />
    </g>
  );
};
