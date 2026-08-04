import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { EntranceEffect, TransitionEffect } from "./types";

// Returns CSS transform + opacity for entrance effects
export function useEntranceEffect(effect: EntranceEffect = "fadeIn", delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const opacity = interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const springVal = spring({ frame: f, fps, config: { damping: 12, stiffness: 150 } });

  switch (effect) {
    case "fadeIn":
      return { opacity, transform: "none" };
    case "slideIn":
      return {
        opacity,
        transform: `translateX(${interpolate(f, [0, 20], [-80, 0], { extrapolateRight: "clamp" })}px)`,
      };
    case "zoomIn":
      return {
        opacity,
        transform: `scale(${interpolate(f, [0, 20], [0.6, 1], { extrapolateRight: "clamp" })})`,
      };
    case "bounce":
      return {
        opacity: interpolate(f, [0, 5], [0, 1], { extrapolateRight: "clamp" }),
        transform: `scale(${springVal})`,
      };
    case "rotate":
      return {
        opacity,
        transform: `rotate(${interpolate(f, [0, 20], [-15, 0], { extrapolateRight: "clamp" })}deg) scale(${interpolate(f, [0, 20], [0.8, 1], { extrapolateRight: "clamp" })})`,
      };
    default:
      return { opacity: 1, transform: "none" };
  }
}

// Returns CSS transform + opacity for exit/transition effects
export function useTransitionEffect(effect: TransitionEffect = "crossfade", totalFrames: number) {
  const frame = useCurrentFrame();
  const fadeStart = totalFrames - 15;
  const progress = Math.max(0, frame - fadeStart) / 15;

  switch (effect) {
    case "crossfade":
      return { opacity: 1 - progress, transform: "none" };
    case "slideLeft":
      return {
        opacity: 1,
        transform: `translateX(${interpolate(progress, [0, 1], [0, -100])}%)`,
      };
    case "slideRight":
      return {
        opacity: 1,
        transform: `translateX(${interpolate(progress, [0, 1], [0, 100])}%)`,
      };
    case "wipeDown":
      return {
        opacity: 1,
        transform: `translateY(${interpolate(progress, [0, 1], [0, 100])}%)`,
      };
    case "zoomOut":
      return {
        opacity: 1 - progress,
        transform: `scale(${interpolate(progress, [0, 1], [1, 1.3])})`,
      };
    default:
      return { opacity: 1, transform: "none" };
  }
}
