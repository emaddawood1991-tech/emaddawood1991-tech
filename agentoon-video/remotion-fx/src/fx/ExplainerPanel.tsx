import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { SPRING, theme } from "./theme";

/** /explainer-panel-reel: split-screen explainer. Top = real website screenshot in a browser frame with a camera that glides between
 *  keyframes, animated cursor (+click ripple), highlight boxes and callouts. Bottom = step cards that activate in sync, joined to the callouts
 *  by animated connectors with arrowheads. Captions are word-timed. All coordinates are in SCREENSHOT pixels. */
export type Cam = { f: number; cx: number; cy: number; zoom: number };
export type CursorKey = { f: number; x: number; y: number; click?: boolean };
export type Callout = { f: number; to: number; x: number; y: number; label: string; step: number; side?: "left" | "right" | "above" };
export type Highlight = { f: number; to: number; x: number; y: number; w: number; h: number };
export type Step = { title: string; detail: string; from: number; to: number };
export type Word = { w: string; s: number; e: number };
export type PanelProps = { shot: string; shotW: number; shotH: number; url: string; cam: Cam[]; cursor: CursorKey[]; callouts: Callout[]; highlights: Highlight[]; steps: Step[]; words: Word[]; heading?: string };

const VX = 40, VY = 356, VW = 1000, BAR = 56, VH = 625; // browser viewport box on the canvas
const ease = Easing.inOut(Easing.cubic);

function camAt(frame: number, keys: Cam[]) {
  const fs = keys.map((k) => k.f);
  const f = (sel: (k: Cam) => number) => interpolate(frame, fs, keys.map(sel), { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { cx: f((k) => k.cx), cy: f((k) => k.cy), zoom: f((k) => k.zoom) };
}
const mapPt = (x: number, y: number, c: { cx: number; cy: number; zoom: number }, shotW: number) => {
  const s = (VW / shotW) * c.zoom; return { x: VX + VW / 2 + (x - c.cx) * s, y: VY + BAR + VH / 2 + (y - c.cy) * s, s };
};

const Cursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg width={60} height={72} viewBox="0 0 30 36" style={{ position: "absolute", left: x - 4, top: y - 3, zIndex: 30, transform: `scale(${1 - press * 0.14})`, transformOrigin: "4px 3px", filter: "drop-shadow(0 5px 6px rgba(0,0,0,.45))" }}>
    <path d="M4 3 L4 27 L10 21.5 L14.5 31 L19 29 L14.6 19.8 L22.5 19.5 Z" fill="#fff" stroke="#111" strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

export const ExplainerPanel: React.FC<PanelProps> = ({ shot, shotW, shotH, url, cam, cursor, callouts, highlights, steps, words, heading }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = camAt(frame, cam);
  const sc = (VW / shotW) * c.zoom;
  const imgTf = `translate(${VW / 2 - c.cx * sc}px, ${VH / 2 - c.cy * sc}px) scale(${sc})`;

  // cursor position along keyframes (eased per segment) + click ripple
  const cf = cursor.map((k) => k.f);
  const cx = interpolate(frame, cf, cursor.map((k) => k.x), { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cy = interpolate(frame, cf, cursor.map((k) => k.y), { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cp = mapPt(cx, cy, c, shotW);
  const clicks = cursor.filter((k) => k.click);
  const press = clicks.reduce((a, k) => Math.max(a, interpolate(frame, [k.f - 3, k.f, k.f + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })), 0);

  // captions: chunk of 4 words containing the current word, active word in a lime block
  const cur = Math.max(0, words.findIndex((w) => frame < w.e));
  const idx = frame >= (words[words.length - 1]?.e ?? 0) ? words.length - 1 : cur;
  const chunk = Math.floor(idx / 4) * 4;
  const shown = words.slice(chunk, chunk + 4);

  const stepY = (i: number) => 1060 + i * 190;
  const inView = (x: number, y: number) => { const p = mapPt(x, y, c, shotW); return p.x > VX + 10 && p.x < VX + VW - 10 && p.y > VY + BAR + 10 && p.y < VY + BAR + VH - 10; };

  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 70% at 50% 20%, #1A2030 0%, #0F1115 70%)", fontFamily: theme.body, overflow: "hidden" }}>
      {/* captions (top, clear of the browser) */}
      <div style={{ position: "absolute", top: 130, left: 40, right: 40, display: "flex", justifyContent: "center", gap: 14, zIndex: 40 }}>
        {shown.map((w, i) => { const active = chunk + i === idx; return <span key={chunk + i} style={{ fontWeight: 900, fontSize: 64, textTransform: "uppercase", padding: "4px 14px", borderRadius: 12, background: active ? theme.lime : "transparent", color: active ? theme.ink : "#fff" }}>{w.w}</span>; })}
      </div>
      {heading && <div style={{ position: "absolute", left: 40, top: 262, fontFamily: theme.mono, fontWeight: 800, fontSize: 30, color: theme.lime, letterSpacing: ".06em" }}>{heading}</div>}

      {/* browser frame */}
      <div style={{ position: "absolute", left: VX, top: VY, width: VW, height: BAR + VH, borderRadius: 20, overflow: "hidden", border: `3px solid ${theme.lime}`, background: "#fff", boxShadow: "0 30px 70px rgba(0,0,0,.6)", opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" }), transform: `translateY(${interpolate(spring({ frame, fps, config: SPRING.settle }), [0, 1], [60, 0])}px)` }}>
        <div style={{ height: BAR, background: "#E9EBEF", position: "relative" }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((col, i) => <div key={i} style={{ position: "absolute", left: 20 + i * 30, top: 18, width: 20, height: 20, borderRadius: 10, background: col }} />)}
          <div style={{ position: "absolute", left: 150, top: 8, width: 790, height: 40, borderRadius: 20, background: "#fff", fontFamily: theme.mono, fontWeight: 700, fontSize: 28, lineHeight: "40px", paddingLeft: 18, color: "#333" }}>{url}</div>
        </div>
        <div style={{ position: "relative", width: VW, height: VH, overflow: "hidden", background: "#fff" }}>
          <Img src={staticFile(shot)} style={{ position: "absolute", left: 0, top: 0, width: shotW, height: shotH, transformOrigin: "0 0", transform: imgTf }} />
        </div>
      </div>

      {/* highlight boxes (draw-on border + pulse) */}
      {highlights.map((h, i) => {
        if (frame < h.f || frame > h.to) return null;
        const a = mapPt(h.x, h.y, c, shotW), b = mapPt(h.x + h.w, h.y + h.h, c, shotW);
        const w = b.x - a.x, hh = b.y - a.y, per = 2 * (w + hh);
        const draw = interpolate(frame, [h.f, h.f + 10], [per, 0], { extrapolateRight: "clamp" });
        const pulse = 0.55 + 0.45 * Math.sin((frame - h.f) / 4);
        return <svg key={i} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, zIndex: 20, pointerEvents: "none" }}><rect x={a.x} y={a.y} width={w} height={hh} rx={10} fill={`rgba(255,178,62,${0.12 * pulse})`} stroke={theme.amber} strokeWidth={6} strokeDasharray={per} strokeDashoffset={draw} style={{ filter: `drop-shadow(0 0 ${8 + pulse * 10}px rgba(255,178,62,.9))` }} /></svg>;
      })}

      {/* step cards */}
      {steps.map((s, i) => {
        const p = spring({ frame: frame - (s.from - 6), fps, config: SPRING.pop });
        const active = frame >= s.from && frame < s.to, done = frame >= s.to;
        return (
          <div key={i} style={{ position: "absolute", left: 40, top: stepY(i), width: 1000, height: 160, borderRadius: 24, background: active ? "#1F2937" : "#161A22", border: `3px solid ${active ? theme.lime : "#2D3340"}`, transform: `translateX(${(1 - p) * 140}px) scale(${active ? 1.02 : 1})`, opacity: Math.min(1, p * 2) * (done ? 0.78 : 1), display: "flex", alignItems: "center", boxShadow: active ? "0 0 34px rgba(200,240,49,.25)" : "none" }}>
            <div style={{ width: 84, height: 84, borderRadius: 42, margin: "0 26px", background: done ? theme.lime : active ? theme.lime : "#2D3340", color: theme.ink, fontWeight: 900, fontSize: 46, display: "flex", alignItems: "center", justifyContent: "center" }}>{done ? "✓" : i + 1}</div>
            <div><div style={{ fontWeight: 900, fontSize: 44, color: "#fff", textTransform: "uppercase" }}>{s.title}</div><div style={{ fontFamily: theme.mono, fontWeight: 700, fontSize: 28, color: "#9AA1AE", marginTop: 6 }}>{s.detail}</div></div>
          </div>
        );
      })}

      {/* callouts + connectors */}
      <svg style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, zIndex: 25, pointerEvents: "none" }}>
        {callouts.map((co, i) => {
          if (frame < co.f || frame > co.to || !inView(co.x, co.y)) return null;
          const p = mapPt(co.x, co.y, c, shotW), draw = interpolate(frame, [co.f, co.f + 14], [1, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          const sx = 40 + 1000, sy = stepY(co.step) + 80; // connector ends at the right edge of its step card
          const mx = (p.x + sx) / 2 + 120;
          const d = `M ${p.x} ${p.y} C ${mx} ${p.y}, ${mx} ${sy}, ${sx - 6} ${sy}`;
          const ang = Math.atan2(0, 1);
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={theme.amber} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} style={{ filter: "drop-shadow(0 0 8px rgba(255,178,62,.8))" }} />
              <polygon points={`${sx - 6},${sy} ${sx - 26},${sy - 12} ${sx - 26},${sy + 12}`} fill={theme.amber} opacity={draw < 0.05 ? 1 : 0} transform={`rotate(${ang})`} />
              <circle cx={p.x} cy={p.y} r={14 + 4 * Math.sin((frame - co.f) / 3)} fill="none" stroke={theme.amber} strokeWidth={5} />
              <circle cx={p.x} cy={p.y} r={6} fill={theme.amber} />
            </g>
          );
        })}
      </svg>
      {callouts.map((co, i) => {
        if (frame < co.f || frame > co.to || !inView(co.x, co.y)) return null;
        const p = mapPt(co.x, co.y, c, shotW), s = spring({ frame: frame - co.f, fps, config: SPRING.pop });
        const left = co.side === "left", above = co.side === "above";
        return <div key={i} style={{ position: "absolute", left: above ? p.x - 165 : left ? p.x - 28 - 330 : p.x + 28, top: above ? p.y - 120 : p.y - 34, width: 330, zIndex: 26, transform: `scale(${s})`, transformOrigin: above ? "50% 100%" : left ? "100% 50%" : "0 50%", background: theme.amber, color: theme.ink, fontWeight: 900, fontSize: 34, padding: "10px 18px", borderRadius: 14, textAlign: above ? "center" : left ? "right" : "left", boxShadow: "0 10px 24px rgba(0,0,0,.45)" }}>{co.label}</div>;
      })}

      {/* cursor + click ripple */}
      {clicks.map((k, i) => { const t = frame - k.f; if (t < 0 || t > 16) return null; const p = mapPt(k.x, k.y, c, shotW); return <div key={i} style={{ position: "absolute", left: p.x - 50, top: p.y - 50, width: 100, height: 100, borderRadius: 50, border: `5px solid #fff`, opacity: 1 - t / 16, transform: `scale(${0.3 + t / 16 * 1.1})`, zIndex: 29 }} />; })}
      <Cursor x={cp.x} y={cp.y} press={press} />
    </AbsoluteFill>
  );
};
