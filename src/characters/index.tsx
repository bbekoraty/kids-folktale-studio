import React from "react";
import { Easing, interpolate } from "remotion";
import type { CastMember, CharacterKey } from "../lib/types";
import { Jackal, Monkey, Otter, Rabbit } from "./Animals";
import { Fufu } from "./Fufu";
import type { Pose } from "./parts";
import { OldMan, PhraIn } from "./People";

export const CHARACTERS: Record<CharacterKey, React.FC<{ pose: Pose }>> = {
  fufu: Fufu,
  rabbit: Rabbit,
  monkey: Monkey,
  otter: Otter,
  jackal: Jackal,
  oldman: OldMan,
  "phra-in": PhraIn,
};

const SEEDS: Record<CharacterKey, number> = {
  fufu: 0,
  rabbit: 23,
  monkey: 51,
  otter: 9,
  jackal: 67,
  oldman: 38,
  "phra-in": 80,
};

/** Natural blinking: short blink every ~3 s, offset per character. */
export const isBlinking = (frame: number, character: CharacterKey) => {
  const f = (frame + SEEDS[character]) % 97;
  return f < 4 || (SEEDS[character] % 2 === 0 && f > 10 && f < 13);
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Places a character on the stage and runs its action
 * (idle sway, hop, walk-in, jump, glow, wave).
 */
export const Actor: React.FC<{
  member: CastMember;
  frame: number;
  fps: number;
  talk: number;
  appearFrame: number;
  actionFrame: number;
}> = ({ member, frame, fps, talk, appearFrame, actionFrame }) => {
  if (frame < appearFrame) return null;
  const Character = CHARACTERS[member.character];
  const t = frame / fps;
  const at = Math.max(0, (frame - actionFrame) / fps);
  const action = frame >= actionFrame ? (member.action ?? "idle") : "idle";

  let x = member.x;
  let y = member.y;
  let squash = 1;
  let rotate = 0;

  // idle breathing for everyone
  y += Math.sin(t * 2 + SEEDS[member.character]) * 3;

  if (action === "hop") {
    const p = (at % 1.5) / 1.5;
    if (p < 0.3) {
      y -= Math.sin((p / 0.3) * Math.PI) * 38;
      squash = 1.04;
    }
  }
  if (action === "walk-in") {
    const p = interpolate(at, [0, 2.4], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    x += (1 - p) * 650 * (member.flip ? 1 : -1);
    if (p < 1) y -= Math.abs(Math.sin(at * 7)) * 10;
  }
  if (action === "jump" && member.toX !== undefined) {
    const p = interpolate(at, [0, 0.9], [0, 1], clamp);
    x = interpolate(p, [0, 1], [member.x, member.toX]);
    y -= Math.sin(p * Math.PI) * 220;
    rotate = p < 1 ? Math.sin(p * Math.PI) * -10 : 0;
  }
  if (action === "glow") {
    y += Math.sin(t * 1.5) * 8 - 12;
  }

  const appear = interpolate(frame - appearFrame, [0, 10], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.6)),
  });
  const glowIn =
    action === "glow" ? interpolate(at, [0, 0.7], [0.6, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) }) : 1;
  const scale = (member.scale ?? 1) * appear * glowIn;

  const pose: Pose = {
    talk,
    blink: isBlinking(frame, member.character),
    t,
    waving: action === "wave",
  };

  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale * (member.flip ? -1 : 1)} ${scale * squash})`}
    >
      <Character pose={pose} />
    </g>
  );
};
