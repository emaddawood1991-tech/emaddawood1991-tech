export type EntranceEffect = "fadeIn" | "slideIn" | "zoomIn" | "bounce" | "rotate";
export type TransitionEffect = "crossfade" | "slideLeft" | "slideRight" | "wipeDown" | "zoomOut";

export type Clip = {
  src: string;
  durationInFrames: number;
  caption?: string;
  effect?: EntranceEffect;
  transition?: TransitionEffect;
};

export type TextLayer = {
  text: string;
  startFrame: number;
  durationInFrames: number;
  position?: "top" | "center" | "bottom";
  effect?: EntranceEffect;
  fontSize?: number;
  color?: string;
};

export type AudioTrack = {
  src: string;
  startFrame?: number;
  volume?: number;
};
