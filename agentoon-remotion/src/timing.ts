import type { Episode } from "./types";

export const sceneFrames = (e: Episode, i: number) =>
  Math.max(1, Math.round(e.scenes[i].duration * e.meta.fps));

export const transitionFrames = (e: Episode) =>
  Math.round((e.transitionSeconds ?? 0.4) * e.meta.fps);

export const hasTransitionAfter = (e: Episode, i: number) =>
  i < e.scenes.length - 1 && (e.scenes[i].transition ?? "fade") !== "none";

export const totalFrames = (e: Episode) => {
  let total = 0;
  e.scenes.forEach((_, i) => {
    total += sceneFrames(e, i);
    if (hasTransitionAfter(e, i)) total -= transitionFrames(e);
  });
  return Math.max(1, total);
};
