import React from "react";
import { C } from "../config/palette";
import { Cheeks, Eyes, Mouth, PhaKhaoMa, Shadow, useSvgId, type Pose } from "./parts";

/* People: feet at (0, 0), facing right, about 400 units tall. */

/** The hungry old traveler — a Thai grandpa in a mor hom shirt. */
export const OldMan: React.FC<{ pose: Pose }> = ({ pose }) => {
  const { t, talk, blink } = pose;
  const skin = "#EDBE8F";
  const shirt = "#3B4F9A";
  const pants = "#7A4E2D";
  const sway = Math.sin(t * 1.6) * 2;
  const head = { x: 8, y: -300 };
  return (
    <g>
      <Shadow rx={90} />
      {/* walking stick */}
      <line x1={92} y1={0} x2={78} y2={-210} stroke="#8A5A2B" strokeWidth={10} strokeLinecap="round" />
      {/* legs */}
      <rect x={-40} y={-120} width={34} height={120} rx={14} fill={pants} />
      <rect x={8} y={-120} width={34} height={120} rx={14} fill={pants} />
      <ellipse cx={-22} cy={-6} rx={26} ry={10} fill={skin} />
      <ellipse cx={26} cy={-6} rx={26} ry={10} fill={skin} />
      {/* shirt */}
      <path d="M -66 -118 Q -72 -220 -40 -236 L 50 -236 Q 82 -220 76 -118 Z" fill={shirt} />
      <PhaKhaoMa x={-70} y={-138} w={150} h={26} a={C.pink} b="#F6D24A" rx={8} />
      {/* arm holding the stick */}
      <path d="M 44 -224 Q 86 -196 82 -170" stroke={shirt} strokeWidth={30} strokeLinecap="round" fill="none" />
      <circle cx={80} cy={-164} r={16} fill={skin} />
      {/* head */}
      <g transform={`rotate(${sway} ${head.x} ${head.y + 60})`}>
        <circle cx={head.x} cy={head.y} r={62} fill={skin} />
        {/* white hair tufts */}
        <ellipse cx={head.x - 58} cy={head.y - 8} rx={14} ry={22} fill={C.white} />
        <ellipse cx={head.x + 58} cy={head.y - 8} rx={14} ry={22} fill={C.white} />
        {/* eyebrows */}
        <path d={`M ${head.x - 30} ${head.y - 24} q 12 -10 24 0`} stroke={C.white} strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d={`M ${head.x + 10} ${head.y - 24} q 12 -10 24 0`} stroke={C.white} strokeWidth={7} fill="none" strokeLinecap="round" />
        <Eyes cx={head.x + 4} cy={head.y - 6} gap={20} rx={7} ry={9} blink={blink} />
        <Cheeks cx={head.x + 4} cy={head.y + 14} gap={38} r={9} />
        {/* beard */}
        <path
          d={`M ${head.x - 44} ${head.y + 16} Q ${head.x - 40} ${head.y + 96} ${head.x + 4} ${head.y + 112} Q ${head.x + 48} ${head.y + 96} ${head.x + 52} ${head.y + 16} Q ${head.x + 4} ${head.y + 44} ${head.x - 44} ${head.y + 16} Z`}
          fill={C.white}
        />
        <ellipse cx={head.x + 4} cy={head.y + 8} rx={9} ry={7} fill="#D9966A" />
        <g transform={`translate(0 ${4})`}>
          <Mouth cx={head.x + 4} cy={head.y + 26} talk={talk} size={0.7} />
        </g>
      </g>
    </g>
  );
};

/** Phra In (พระอินทร์), king of the sky — green skin, golden chada crown, soft glow. */
export const PhraIn: React.FC<{ pose: Pose }> = ({ pose }) => {
  const { t, talk, blink } = pose;
  const skin = "#5DB980";
  const skinDark = "#3F9963";
  const robe = "#FFF3D6";
  const glow = useSvgId("glow");
  const gold = useSvgId("gold");
  const pulse = 0.85 + Math.sin(t * 2.4) * 0.15;
  const head = { x: 6, y: -300 };
  return (
    <g>
      <defs>
        <radialGradient id={glow}>
          <stop offset="0%" stopColor="#FFF6C8" stopOpacity={0.95} />
          <stop offset="60%" stopColor={C.gold} stopOpacity={0.35} />
          <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE07A" />
          <stop offset="100%" stopColor={C.goldDeep} />
        </linearGradient>
      </defs>
      <ellipse cx={0} cy={-230} rx={260 * pulse} ry={300 * pulse} fill={`url(#${glow})`} />
      <Shadow rx={90} />
      {/* robe */}
      <path d="M -80 0 Q -90 -200 -46 -240 L 58 -240 Q 102 -200 92 0 Z" fill={robe} />
      <path d="M -80 0 L 92 0 L 88 -28 L -76 -28 Z" fill={`url(#${gold})`} />
      <rect x={-60} y={-150} width={136} height={22} rx={8} fill={`url(#${gold})`} />
      {/* necklace collar */}
      <path d="M -50 -240 Q 6 -180 62 -240" fill={`url(#${gold})`} />
      {/* arms */}
      <path d="M 52 -226 Q 100 -190 96 -140" stroke={skin} strokeWidth={28} strokeLinecap="round" fill="none" />
      <path d="M -42 -226 Q -88 -190 -84 -140" stroke={skinDark} strokeWidth={28} strokeLinecap="round" fill="none" />
      {/* head */}
      <circle cx={head.x} cy={head.y} r={60} fill={skin} />
      {/* chada crown: tiers rising to a spire */}
      <g fill={`url(#${gold})`}>
        <path d={`M ${head.x - 62} ${head.y - 22} Q ${head.x} ${head.y - 64} ${head.x + 62} ${head.y - 22} L ${head.x + 58} ${head.y - 44} Q ${head.x} ${head.y - 84} ${head.x - 58} ${head.y - 44} Z`} />
        <path d={`M ${head.x - 44} ${head.y - 52} L ${head.x + 44} ${head.y - 52} L ${head.x + 30} ${head.y - 100} L ${head.x - 30} ${head.y - 100} Z`} />
        <path d={`M ${head.x - 30} ${head.y - 98} L ${head.x + 30} ${head.y - 98} L ${head.x + 18} ${head.y - 140} L ${head.x - 18} ${head.y - 140} Z`} />
        <path d={`M ${head.x - 18} ${head.y - 138} L ${head.x + 18} ${head.y - 138} L ${head.x} ${head.y - 210} Z`} />
      </g>
      <g fill={C.pink}>
        <circle cx={head.x} cy={head.y - 76} r={7} />
        <circle cx={head.x} cy={head.y - 120} r={5} />
      </g>
      {/* ear ornaments */}
      <path d={`M ${head.x - 60} ${head.y - 6} q -20 30 0 50`} stroke={C.gold} strokeWidth={8} fill="none" />
      <path d={`M ${head.x + 60} ${head.y - 6} q 20 30 0 50`} stroke={C.gold} strokeWidth={8} fill="none" />
      <Eyes cx={head.x + 4} cy={head.y - 4} gap={20} rx={8} ry={11} blink={blink} />
      <Cheeks cx={head.x + 4} cy={head.y + 18} gap={36} r={8} />
      <Mouth cx={head.x + 4} cy={head.y + 26} talk={talk} size={0.75} />
    </g>
  );
};
