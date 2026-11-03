import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Caption } from "./types";

/** Captions sit above the bottom UI safe zone (Reels/TikTok/Shorts). */
export const Captions: React.FC<{ captions: Caption[]; family: string }> = ({ captions, family }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const c = captions.find((x) => t >= x.start && t < x.end);
  if (!c) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        bottom: 420,
        textAlign: "center",
        fontFamily: family,
        fontWeight: 800,
        fontSize: 64,
        lineHeight: 1.2,
        color: "#fff",
        textShadow: "0 4px 24px rgba(0,0,0,.65)",
      }}
    >
      {c.text}
    </div>
  );
};
