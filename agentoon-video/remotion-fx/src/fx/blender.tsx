import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";

/** Plays a Blender-rendered transparent PNG sequence (public/<dir>/f0000.png ...): see blender/render_logo_turntable.py. Loops or holds the last frame. */
export const BlenderSequence: React.FC<{ dir: string; frames: number; start?: number; size?: number; loop?: boolean }> = ({ dir, frames, start = 0, size = 720, loop = true }) => {
  const f = Math.max(0, useCurrentFrame() - start); const i = loop ? f % frames : Math.min(frames - 1, f);
  return <Img src={staticFile(`${dir}/f${String(i).padStart(4, "0")}.png`)} style={{ width: size, height: size }} />;
};
