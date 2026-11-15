import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING, theme } from "./theme";
import { clamp, easeOutCubic, rng } from "./math";

/** /agentoon-kinetic-type: animated words, letters, morphs, highlights, 3D titles and word-synced subtitles. Frame-based (start = narrated cue frame). */
type T = { text: string; start?: number; size?: number; color?: string; stagger?: number; weight?: number; align?: "left" | "center" };

export const KineticWords: React.FC<T & { highlight?: number[]; hlColor?: string }> = ({ text, start = 0, size = 120, color = "#fff", stagger = 5, highlight = [], hlColor = theme.lime, align = "center" }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const words = text.split(" ");
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", gap: `0 ${size * 0.22}px`, fontFamily: theme.body, fontWeight: 900, fontSize: size, lineHeight: 1.04, textTransform: "uppercase", letterSpacing: "-.03em" }}>
      {words.map((w, i) => {
        const p = spring({ frame: frame - start - i * stagger, fps, config: SPRING.slam }); const hl = highlight.includes(i); const mark = spring({ frame: frame - start - i * stagger - 5, fps, config: SPRING.settle });
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", transform: `translateY(${(1 - p) * size * 0.9}px) rotate(${(1 - p) * 6}deg) scale(${0.75 + 0.25 * p})`, opacity: clamp(p * 2.2), filter: `blur(${(1 - clamp(p)) * 10}px)`, color: hl ? "#0F1115" : color }}>
            {hl && <span style={{ position: "absolute", left: -10, right: -10, top: size * 0.12, bottom: size * 0.02, background: hlColor, transform: `scaleX(${mark}) skewX(-6deg)`, transformOrigin: "0 50%", zIndex: -1 }} />}
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** character-by-character reveal with 3D flip-up + blur. */
export const LetterReveal: React.FC<T> = ({ text, start = 0, size = 120, color = "#fff", stagger = 1.6, weight = 900 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <div style={{ perspective: 900, fontFamily: theme.body, fontWeight: weight, fontSize: size, color, letterSpacing: "-.02em", textAlign: "center", lineHeight: 1.05 }}>
      {text.split("").map((ch, i) => {
        const p = spring({ frame: frame - start - i * stagger, fps, config: { damping: 15, stiffness: 150, mass: 0.7 } });
        return <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: clamp(p * 2), transform: `translateY(${(1 - p) * size * 0.5}px) rotateX(${(1 - p) * -90}deg)`, transformOrigin: "50% 100%", filter: `blur(${(1 - clamp(p)) * 8}px)` }}>{ch}</span>;
      })}
    </div>
  );
};

/** morph from text A to text B: each character scrambles through random glyphs and rolls into place (monospace keeps layout stable). */
export const TextMorph: React.FC<{ a: string; b: string; start?: number; dur?: number; size?: number; color?: string; colorB?: string }> = ({ a, b, start = 0, dur = 36, size = 96, color = "#9AA1AE", colorB = theme.lime }) => {
  const frame = useCurrentFrame(); const n = Math.max(a.length, b.length); const A = a.padEnd(n), B = b.padEnd(n); const prog = clamp((frame - start) / dur); const glyphs = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*";
  return (
    <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: size, letterSpacing: ".02em", whiteSpace: "pre", textAlign: "center" }}>
      {A.split("").map((ca, i) => {
        const p = clamp(prog * (n + 6) / 6 - i / 6); const done = p >= 1, started = p > 0; const r = rng(i * 977 + Math.floor(frame / 2) * 31); const ch = !started ? ca : done ? B[i] : glyphs[Math.floor(r() * glyphs.length)];
        return <span key={i} style={{ display: "inline-block", color: done ? colorB : started ? "#fff" : color, transform: `translateY(${started && !done ? Math.sin(p * Math.PI) * -size * 0.18 : 0}px)`, filter: started && !done ? "blur(1.5px)" : "none" }}>{ch}</span>;
      })}
    </div>
  );
};

/** marker highlight sweeping under chosen words at cue frames. */
export const WordHighlight: React.FC<{ words: { w: string; hl?: boolean; at?: number }[]; size?: number }> = ({ words, size = 88 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: `0 ${size * 0.24}px`, justifyContent: "center", fontFamily: theme.body, fontWeight: 900, fontSize: size, color: "#fff", textTransform: "uppercase", lineHeight: 1.1 }}>
      {words.map((w, i) => { const p = w.hl ? spring({ frame: frame - (w.at ?? 0), fps, config: SPRING.settle }) : 0; return <span key={i} style={{ position: "relative", color: w.hl && p > 0.4 ? "#0F1115" : "#fff" }}>{w.hl && <span style={{ position: "absolute", left: -8, right: -8, top: size * 0.14, bottom: size * 0.04, background: theme.lime, transform: `scaleX(${p})`, transformOrigin: "0 50%", zIndex: -1 }} />}{w.w}</span>; })}
    </div>
  );
};

/** 3D title: stacked text-shadow extrusion + spring rotation in perspective + light glint on the face. */
export const Title3D: React.FC<T & { depth?: number; rotate?: number }> = ({ text, start = 0, size = 150, color = "#fff", depth = 22, rotate = 28 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const p = spring({ frame: frame - start, fps, config: SPRING.settle }); const sw = interpolate(frame - start, [0, 90], [-30, 30], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ext = Array.from({ length: depth }, (_, i) => `${(i + 1) * 0.9}px ${(i + 1) * 1.3}px 0 hsl(${70 - i * 1.5}, 70%, ${42 - i}%)`).join(",");
  return (
    <div style={{ perspective: 1100, textAlign: "center" }}>
      <div style={{ display: "inline-block", fontFamily: theme.body, fontWeight: 900, fontSize: size, color, textTransform: "uppercase", letterSpacing: "-.03em", textShadow: `${ext}, 0 ${depth * 1.8}px 40px rgba(0,0,0,.55)`, transform: `rotateY(${(1 - p) * -90 + Math.sin(frame / 26) * 6 + rotate * (1 - p)}deg) rotateX(${(1 - p) * 40 + 8}deg) translateZ(${p * 40}px)`, opacity: clamp(p * 2.5), backgroundImage: `linear-gradient(100deg, #fff ${40 + sw}%, #E6FF7A ${50 + sw}%, #fff ${60 + sw}%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 0 transparent)" }}>{text}</div>
    </div>
  );
};

export type SubWord = { w: string; s: number; e: number };
/** word-timed subtitles: 4-word chunks, active word in a lime block with spring pop. */
export const AnimatedSubtitles: React.FC<{ words: SubWord[]; size?: number; perChunk?: number }> = ({ words, size = 64, perChunk = 4 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const cur = words.findIndex((w) => frame < w.e); const idx = cur < 0 ? words.length - 1 : Math.max(0, cur); const chunk = Math.floor(idx / perChunk) * perChunk; const shown = words.slice(chunk, chunk + perChunk);
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", fontFamily: theme.body, fontWeight: 900, fontSize: size, textTransform: "uppercase" }}>
      {shown.map((w, i) => { const active = chunk + i === idx; const p = active ? spring({ frame: frame - w.s, fps, config: SPRING.slam }) : 1; return <span key={chunk + i} style={{ padding: "4px 14px", borderRadius: 12, background: active ? theme.lime : "transparent", color: active ? "#0F1115" : "#fff", transform: `scale(${active ? 0.9 + 0.1 * p : 1})` }}>{w.w}</span>; })}
    </div>
  );
};
