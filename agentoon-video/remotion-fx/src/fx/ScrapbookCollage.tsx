import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { SPRING, theme } from "./theme";

/** /scrapbook-collage: layered editorial collage. Paper background + torn-edge cards, sticker cutouts, tape, animated screenshots,
 *  staggered spring entrances and parallax camera depth. Every item is data: add items, set delay/depth, done. */
export type CollageItem = {
  id: string;
  kind: "shot" | "logo" | "cutout" | "note";
  src?: string; // path under public/ (staticFile)
  text?: string; // for kind "note"
  x: number; y: number; w: number; h?: number; // top-left in 1080x1920 canvas px
  rot: number; // resting rotation in degrees
  depth: number; // 0 = far/background, 1 = near/foreground (drives parallax + scale)
  delay: number; // entrance frame
  from?: "left" | "right" | "top" | "bottom";
  tape?: boolean;
  zoom?: { to: number; ox: number; oy: number }; // slow push-in inside a screenshot window
  accent?: string;
};
export type CollageProps = { items: CollageItem[]; kicker?: string; titleWords?: string[]; highlightWord?: number; titleDelay?: number; titleY?: number };

const PaperDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id="paperEdge" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={4} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={9} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
);

const PaperBackground: React.FC<{ driftX: number; driftY: number }> = ({ driftX, driftY }) => (
  <AbsoluteFill style={{ background: theme.paper }}>
    <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, transform: `translate(${driftX * 0.2}px, ${driftY * 0.2}px) scale(1.08)` }}>
      <defs>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={2} /><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.18  0 0 0 0.55 -0.12" /></filter>
        <filter id="fibers"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.18" numOctaves={4} seed={9} /><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.4  0 0 0 0 0.25  0 0 0 0.5 -0.15" /></filter>
        <radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset="55%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#3b2a12" stopOpacity="0.32" /></radialGradient>
      </defs>
      <rect width="1080" height="1920" filter="url(#fibers)" opacity="0.55" />
      <rect width="1080" height="1920" filter="url(#grain)" opacity="0.7" />
      <rect width="1080" height="1920" fill="url(#vig)" />
    </svg>
  </AbsoluteFill>
);

const entranceOffset = (from: CollageItem["from"], k: number) => {
  const d = 900 * k;
  return from === "left" ? { x: -d, y: 0, r: -22 * k } : from === "right" ? { x: d, y: 0, r: 22 * k } : from === "top" ? { x: 0, y: -d, r: 14 * k } : { x: 0, y: d, r: -14 * k };
};

const Item: React.FC<{ it: CollageItem; cam: { x: number; y: number; s: number } }> = ({ it, cam }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = spring({ frame: frame - it.delay, fps, config: SPRING.pop });
  const off = entranceOffset(it.from ?? "bottom", 1 - s);
  const par = 0.4 + it.depth * 1.6; // near items move more with the camera
  const scale = 0.82 + 0.18 * s + it.depth * 0.04;
  const h = it.h ?? it.w * 0.625;
  const float = Math.sin((frame + it.delay * 3) / 26) * (3 + it.depth * 3); // idle float keeps holds alive
  const tf = `translate(${it.x + off.x + cam.x * par}px, ${it.y + off.y + cam.y * par + float}px) rotate(${it.rot + off.r}deg) scale(${scale})`;
  const opacity = interpolate(s, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });
  const common: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: it.w, transform: tf, transformOrigin: "50% 50%", opacity, zIndex: Math.round(it.depth * 10) };

  if (it.kind === "cutout") {
    const st = ["4px 0 0", "-4px 0 0", "0 4px 0", "0 -4px 0", "3px 3px 0", "-3px -3px 0", "3px -3px 0", "-3px 3px 0"].map((o) => `drop-shadow(${o} #fff)`).join(" ");
    return <div style={{ ...common, filter: `${st} drop-shadow(0 22px 22px rgba(40,25,5,.38))` }}><Img src={staticFile(it.src!)} style={{ width: it.w, display: "block" }} /></div>;
  }
  if (it.kind === "note") {
    return (
      <div style={{ ...common, filter: "drop-shadow(0 12px 14px rgba(40,25,5,.3))" }}>
        <div style={{ background: it.accent ?? theme.lime, color: theme.ink, fontFamily: theme.mono, fontWeight: 800, fontSize: 40, padding: "18px 26px", filter: "url(#paperEdge)", whiteSpace: "nowrap" }}>{it.text}</div>
      </div>
    );
  }
  if (it.kind === "logo") {
    return (
      <div style={{ ...common, height: it.w, filter: "drop-shadow(0 14px 16px rgba(40,25,5,.32))" }}>
        <div style={{ position: "absolute", inset: 0, background: "#fff", borderRadius: 26, filter: "url(#paperEdge)" }} />
        <Img src={staticFile(it.src!)} style={{ position: "absolute", left: 18, top: 18, width: it.w - 36, height: it.w - 36, objectFit: "contain" }} />
      </div>
    );
  }
  // screenshot card: ONLY the white paper backing is roughened (torn edge); the screenshot stays crisp and readable. Tape + slow push-in inside the window.
  const z = it.zoom ? interpolate(frame, [it.delay, durationInFrames], [1, it.zoom.to], { extrapolateLeft: "clamp", easing: Easing.inOut(Easing.quad) }) : 1;
  return (
    <div style={{ ...common, height: h, filter: "drop-shadow(0 20px 24px rgba(40,25,5,.4))" }}>
      <div style={{ position: "absolute", inset: 0, background: "#fff", filter: "url(#paperEdge)" }} />
      <div style={{ position: "absolute", left: 16, top: 16, width: it.w - 32, height: h - 32, overflow: "hidden", background: "#ddd" }}>
        <Img src={staticFile(it.src!)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})`, transformOrigin: it.zoom ? `${it.zoom.ox}% ${it.zoom.oy}%` : "50% 50%" }} />
      </div>
      {it.tape && <div style={{ position: "absolute", left: it.w / 2 - 70, top: -22, width: 140, height: 44, background: "rgba(255,232,150,.78)", transform: "rotate(-4deg)", boxShadow: "0 2px 4px rgba(0,0,0,.18)" }} />}
    </div>
  );
};

export const ScrapbookCollage: React.FC<CollageProps> = ({ items, kicker, titleWords = [], highlightWord = -1, titleDelay = 8, titleY = 120 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  // camera depth: slow drift + push; near items move more than far ones (see `par` in Item)
  const cam = { x: interpolate(frame, [0, durationInFrames], [-34, 34]), y: interpolate(frame, [0, durationInFrames], [20, -26]), s: 1 };
  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: theme.body }}>
      <PaperDefs />
      <PaperBackground driftX={cam.x} driftY={cam.y} />
      {items.map((it) => <Item key={it.id} it={it} cam={cam} />)}
      <div style={{ position: "absolute", left: 50, top: titleY, zIndex: 50 }}>
        {kicker && <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 30, letterSpacing: ".08em", color: theme.ink, marginBottom: 10, opacity: interpolate(frame, [titleDelay - 4, titleDelay + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{kicker}</div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0 22px" }}>
          {titleWords.map((w, i) => {
            const p = spring({ frame: frame - titleDelay - i * 5, fps, config: SPRING.slam });
            const mark = spring({ frame: frame - titleDelay - i * 5 - 6, fps, config: SPRING.settle });
            return (
              <div key={i} style={{ position: "relative", transform: `translateY(${(1 - p) * -90}px) scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 2) }}>
                {i === highlightWord && <div style={{ position: "absolute", left: -8, right: -8, top: 34, bottom: 4, background: theme.lime, transform: `scaleX(${mark}) skewX(-6deg)`, transformOrigin: "0 50%" }} />}
                <span style={{ position: "relative", fontWeight: 900, fontSize: 118, lineHeight: 1.02, color: theme.ink, letterSpacing: "-.03em", textTransform: "uppercase" }}>{w}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
