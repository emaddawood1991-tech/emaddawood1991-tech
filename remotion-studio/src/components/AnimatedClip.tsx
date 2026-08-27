import { AbsoluteFill, OffthreadVideo, Img, useCurrentFrame } from "remotion";
import { useEntranceEffect, useTransitionEffect } from "../lib/effects";
import type { EntranceEffect, TransitionEffect } from "../lib/types";

type Props = {
  src: string;
  type?: "video" | "image";
  durationInFrames: number;
  entranceEffect?: EntranceEffect;
  exitEffect?: TransitionEffect;
  objectFit?: "cover" | "contain";
};

export const AnimatedClip: React.FC<Props> = ({
  src,
  type = "video",
  durationInFrames,
  entranceEffect = "fadeIn",
  exitEffect = "crossfade",
  objectFit = "cover",
}) => {
  const frame = useCurrentFrame();
  const entrance = useEntranceEffect(entranceEffect);
  const exit = useTransitionEffect(exitEffect, durationInFrames);

  // Blend entrance (first 20 frames) and exit (last 15 frames)
  const isExiting = frame > durationInFrames - 15;
  const combinedStyle = isExiting ? exit : entrance;

  const mediaStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit,
  };

  return (
    <AbsoluteFill style={{ ...combinedStyle, overflow: "hidden" }}>
      {type === "video" ? (
        <OffthreadVideo src={src} style={mediaStyle} />
      ) : (
        <Img src={src} style={mediaStyle} />
      )}
    </AbsoluteFill>
  );
};
