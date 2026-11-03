export type AnimIn =
  | "none" | "fadeIn" | "fadeUp" | "fadeDown"
  | "slideLeft" | "slideRight" | "scaleIn" | "pop";

export type Anim = {
  in?: AnimIn;
  /** seconds after scene start */
  delay?: number;
  /** seconds */
  duration?: number;
  out?: "none" | "fadeOut";
};

type Base = {
  id: string;
  /** Figma layer name (for traceability) */
  figma?: string;
  x: number; y: number; w: number; h: number;
  rotation?: number;
  opacity?: number;
  anim?: Anim;
};

export type TextLayer = Base & {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number;
  color: string;
  align?: "left" | "center" | "right";
  lineHeight?: number; // multiplier
  letterSpacing?: number; // px
};

export type ImageLayer = Base & {
  type: "image";
  /** path relative to public/ (or http url) */
  src: string;
  fit?: "cover" | "contain";
  radius?: number;
  kenBurns?: { from: number; to: number };
};

export type RectLayer = Base & {
  type: "rect";
  /** any CSS background: color, gradient */
  fill: string;
  radius?: number;
  stroke?: string;
  strokeWidth?: number;
};

export type Layer = TextLayer | ImageLayer | RectLayer;

export type Scene = {
  id: string;
  /** Figma frame name, e.g. S01_hook */
  figma?: string;
  /** seconds */
  duration: number;
  /** CSS background for the scene */
  background: string;
  layers: Layer[];
  transition?: "fade" | "slideUp" | "none";
};

export type Caption = { text: string; start: number; end: number };

export type Episode = {
  meta: {
    title: string;
    slug: string;
    width: 1080;
    height: 1920;
    fps: number;
    figma?: { fileKey: string; nodeIds: string[] };
  };
  fonts?: { family: string; src: string; weight?: number }[];
  audio?: { narration?: string; music?: string; musicVolume?: number };
  transitionSeconds?: number;
  scenes: Scene[];
  captions?: Caption[];
  /** studio-only: overlay the Instagram/TikTok safe area */
  debug?: boolean;
};
