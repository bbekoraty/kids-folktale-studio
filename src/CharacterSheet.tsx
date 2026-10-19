import "@fontsource/mali/700.css";
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CHARACTERS, isBlinking } from "./characters";
import { C } from "./config/palette";
import type { CharacterKey } from "./lib/types";
import { FONT } from "./scenes/Overlays";

const ROW: { key: CharacterKey; name: string; x: number; y: number; s: number }[] = [
  { key: "fufu", name: "Fufu ฟูฟู", x: 260, y: 470, s: 1.05 },
  { key: "rabbit", name: "Rabbit กระต่าย", x: 640, y: 470, s: 1.1 },
  { key: "monkey", name: "Monkey ลิง", x: 960, y: 470, s: 1.1 },
  { key: "otter", name: "Otter นาก", x: 1280, y: 470, s: 1.1 },
  { key: "jackal", name: "Jackal หมาจิ้งจอก", x: 1640, y: 470, s: 1.1 },
  { key: "oldman", name: "Old traveler คุณตา", x: 640, y: 1000, s: 0.95 },
  { key: "phra-in", name: "Phra In พระอินทร์", x: 1280, y: 1000, s: 0.85 },
];

/** All characters side by side — use it to check the designs stay consistent. */
export const CharacterSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ backgroundColor: C.cream }}>
      <svg viewBox="0 0 1920 1080" style={{ width: "100%", height: "100%" }}>
        {ROW.map(({ key, name, x, y, s }) => {
          const Character = CHARACTERS[key];
          const talk = key === "fufu" ? Math.abs(Math.sin(frame * 0.5)) : 0;
          return (
            <g key={key}>
              <g transform={`translate(${x} ${y}) scale(${s})`}>
                <Character pose={{ talk, blink: isBlinking(frame, key), t, waving: key === "fufu" }} />
              </g>
              <text x={x} y={y + 50} textAnchor="middle" fontFamily={FONT} fontSize={30} fontWeight={700} fill={C.ink}>
                {name}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
