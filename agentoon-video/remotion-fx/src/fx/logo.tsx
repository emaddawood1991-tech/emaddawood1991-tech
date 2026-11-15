import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { interpolatePath } from "@remotion/paths";
import { SPRING, theme } from "./theme";
import { clamp, easeInOutCubic, easeOutCubic, lerp, rng } from "./math";

/** /agentoon-logo-motion: animate REAL logo assets (the project's own file, unaltered). */

/** scale-in + blur-in + circular mask wipe + expanding ring burst + soft glow. */
export const LogoReveal: React.FC<{ src: string; size?: number; start?: number; glow?: string; radius?: number }> = ({ src, size = 420, start = 0, glow = theme.lime, radius = 0.22 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const p = spring({ frame: frame - start, fps, config: SPRING.pop }); const wipe = easeOutCubic(clamp((frame - start) / 22)); const ring = clamp((frame - start - 4) / 26);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{ position: "absolute", inset: -60, borderRadius: "50%", border: `6px solid ${glow}`, opacity: (1 - ring) * 0.9, transform: `scale(${0.5 + ring * 1.4})` }} />
      <div style={{ position: "absolute", inset: -30, borderRadius: "50%", background: `radial-gradient(circle, ${glow}55, transparent 65%)`, opacity: p }} />
      <div style={{ width: size, height: size, borderRadius: size * radius, background: "#fff", overflow: "hidden", transform: `scale(${0.4 + 0.6 * p}) rotate(${(1 - p) * -14}deg)`, filter: `blur(${(1 - clamp(p)) * 16}px) drop-shadow(0 24px 30px rgba(0,0,0,.5))`, clipPath: `circle(${wipe * 75}% at 50% 50%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Img src={staticFile(src)} style={{ width: "86%", height: "86%", objectFit: "contain" }} />
      </div>
    </div>
  );
};

/** particles fly in from seeded random positions and settle into the logo's own pixels (sampled from its alpha); colours come from the logo. */
export const ParticleLogo: React.FC<{ src: string; size?: number; start?: number; dur?: number; step?: number; seed?: number }> = ({ src, size = 640, start = 0, dur = 60, step = 7, seed = 11 }) => {
  const frame = useCurrentFrame(); const cv = useRef<HTMLCanvasElement>(null); const [pts, setPts] = useState<{ x: number; y: number; c: string }[] | null>(null); const [h] = useState(() => delayRender("particle-logo"));
  useEffect(() => {
    const im = new window.Image(); im.crossOrigin = "anonymous";
    im.onload = () => { const s = 320, o = document.createElement("canvas"); o.width = o.height = s; const g = o.getContext("2d")!; const k = Math.min(s / im.width, s / im.height) || 1; const w = im.width * k || s, hh = im.height * k || s; g.drawImage(im, (s - w) / 2, (s - hh) / 2, w, hh); const d = g.getImageData(0, 0, s, s).data; const out: { x: number; y: number; c: string }[] = []; const st = Math.max(2, Math.round(step * s / size)); for (let y = 0; y < s; y += st) for (let x = 0; x < s; x += st) { const i = (y * s + x) * 4; if (d[i + 3] > 128) out.push({ x: (x / s) * size, y: (y / s) * size, c: `rgb(${d[i]},${d[i + 1]},${d[i + 2]})` }); } setPts(out); continueRender(h); };
    im.onerror = () => continueRender(h); im.src = staticFile(src);
  }, [src, size, step, h]);
  useLayoutEffect(() => {
    const c = cv.current; if (!c || !pts) return; const g = c.getContext("2d")!; g.clearRect(0, 0, size, size); const r = rng(seed); const rr = (step * 0.62) | 0;
    pts.forEach((p, i) => { const a = r() * Math.PI * 2, d = size * (0.6 + r() * 0.9), sx = size / 2 + Math.cos(a) * d, sy = size / 2 + Math.sin(a) * d, dl = r() * 0.45; const t = easeInOutCubic(clamp((frame - start) / dur / (1 - 0.45) - dl / (1 - 0.45))); const x = lerp(sx, p.x, t), y = lerp(sy, p.y, t); g.globalAlpha = clamp(t * 4 + 0.15); g.fillStyle = p.c; g.beginPath(); g.arc(x, y, rr + (1 - t) * 3, 0, 7); g.fill(); });
    g.globalAlpha = 1;
  });
  return <canvas ref={cv} width={size} height={size} style={{ width: size, height: size }} />;
};

/** shape morph between SVG paths (equal command structure) with colour crossfade, ending on the real logo. */
export const ShapeMorph: React.FC<{ paths: string[]; colors?: string[]; start?: number; each?: number; size?: number; logo?: string }> = ({ paths, colors = [theme.cyan, theme.lime, theme.amber, theme.magenta], start = 0, each = 26, size = 460, logo }) => {
  const frame = useCurrentFrame(); const seg = Math.min(paths.length - 1, Math.max(0, Math.floor((frame - start) / each))); const t = easeInOutCubic(clamp(((frame - start) - seg * each) / each)); const last = frame - start >= (paths.length - 1) * each;
  const d = seg >= paths.length - 1 ? paths[paths.length - 1] : interpolatePath(t, paths[seg], paths[seg + 1]); const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); const c0 = colors[seg % colors.length], c1 = colors[(seg + 1) % colors.length]; const col = `rgb(${hex(c0).map((v, i) => Math.round(lerp(v, hex(c1)[i], t))).join(",")})`;
  const logoIn = logo ? clamp((frame - start - (paths.length - 1) * each) / 14) : 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, opacity: 1 - logoIn, filter: `drop-shadow(0 0 22px ${col})` }}><path d={d} fill={col} /></svg>
      {logo && <div style={{ position: "absolute", inset: 0, opacity: logoIn, transform: `scale(${0.8 + 0.2 * logoIn})`, display: "flex", alignItems: "center", justifyContent: "center" }}><Img src={staticFile(logo)} style={{ width: "82%", height: "82%", objectFit: "contain" }} /></div>}
    </div>
  );
};

/** product-style presentation: logo card tilting in 3D, glossy highlight, floor reflection. */
export const ProductPresentation: React.FC<{ src: string; size?: number; start?: number; name?: string }> = ({ src, size = 480, start = 0, name }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const p = spring({ frame: frame - start, fps, config: SPRING.settle }); const ry = Math.sin((frame - start) / 34) * 24 + (1 - p) * 70; const rx = Math.cos((frame - start) / 42) * 8;
  const card = (ref: boolean) => <div style={{ width: size, height: size, borderRadius: size * 0.2, background: "linear-gradient(145deg,#ffffff,#dfe5ee)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", boxShadow: ref ? "none" : "0 40px 70px rgba(0,0,0,.55)" }}><Img src={staticFile(src)} style={{ width: "74%", height: "74%", objectFit: "contain" }} /><div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${30 + Math.sin(frame / 40) * 20}%, rgba(255,255,255,.55) ${42 + Math.sin(frame / 40) * 20}%, transparent ${54 + Math.sin(frame / 40) * 20}%)` }} /></div>;
  return (
    <div style={{ perspective: 1200, width: size, opacity: clamp(p * 2) }}>
      <div style={{ transform: `rotateY(${ry}deg) rotateX(${rx}deg) translateY(${(1 - p) * 60}px)`, transformStyle: "preserve-3d" }}>{card(false)}</div>
      <div style={{ transform: `scaleY(-1) rotateY(${ry}deg) rotateX(${-rx}deg)`, marginTop: 10, opacity: 0.22, maskImage: "linear-gradient(transparent 55%, #000)", WebkitMaskImage: "linear-gradient(transparent 55%, #000)", height: size * 0.5, overflow: "hidden" }}>{card(true)}</div>
      {name && <div style={{ textAlign: "center", marginTop: -size * 0.28, position: "relative", fontFamily: theme.body, fontWeight: 900, fontSize: 64, color: "#fff", textTransform: "uppercase", letterSpacing: ".04em" }}>{name}</div>}
    </div>
  );
};

/** crossfade/transform transition from one logo to another (scale + blur + rotate), for "tool A to tool B" beats. */
export const LogoTransition: React.FC<{ from: string; to: string; start?: number; dur?: number; size?: number }> = ({ from, to, start = 0, dur = 24, size = 360 }) => {
  const frame = useCurrentFrame(); const t = easeInOutCubic(clamp((frame - start) / dur)); const box: React.CSSProperties = { position: "absolute", inset: 0, background: "#fff", borderRadius: size * 0.22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 24px 40px rgba(0,0,0,.45)" };
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{ ...box, opacity: 1 - t, transform: `scale(${1 - t * 0.4}) rotate(${-t * 40}deg)`, filter: `blur(${t * 12}px)` }}><Img src={staticFile(from)} style={{ width: "80%", height: "80%", objectFit: "contain" }} /></div>
      <div style={{ ...box, opacity: t, transform: `scale(${0.6 + t * 0.4}) rotate(${(1 - t) * 40}deg)`, filter: `blur(${(1 - t) * 12}px)` }}><Img src={staticFile(to)} style={{ width: "80%", height: "80%", objectFit: "contain" }} /></div>
    </div>
  );
};
