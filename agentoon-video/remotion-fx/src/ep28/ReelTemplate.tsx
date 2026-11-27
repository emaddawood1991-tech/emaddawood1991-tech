import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from "remotion";

/** Reusable Reel template (Episode 28). One composition, many videos: topic, hook, three points and an accent colour come in as props. */
export type ReelProps = { topic: string; hook: string; points: string[]; accent: string; caption: string };
export const REEL_FRAMES = 120;
export const reelDefaults: ReelProps = { topic: "WHAT IS AN API?", hook: "Apps talk through APIs", points: ["Request", "Service", "Response"], accent: "#38D6F5", caption: "An API lets software ask for something and get an answer" };

const Pop: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 12, stiffness: 160 } });
  return <div style={{ transform: `scale(${0.6 + 0.4 * s}) translateY(${(1 - s) * 40}px)`, opacity: Math.min(1, s * 1.6) }}>{children}</div>;
};

export const ReelTemplate: React.FC<ReelProps> = ({ topic, hook, points, accent, caption }) => {
  const f = useCurrentFrame();
  const wipe = interpolate(f, [0, 14], [100, 0], { extrapolateRight: "clamp" });
  const words = caption.split(" "); const active = Math.floor(interpolate(f, [30, 110], [0, words.length], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(900px 900px at 50% 30%, #12213a, #05080e)", fontFamily: "Inter, DejaVu Sans, Arial, sans-serif", color: "#F4F7FB" }}>
      <AbsoluteFill style={{ clipPath: `inset(0 ${wipe}% 0 0)` }}>
        <div style={{ position: "absolute", top: 260, width: "100%", textAlign: "center", fontSize: 92, fontWeight: 900, letterSpacing: 2, color: accent }}><Pop delay={4}>{topic}</Pop></div>
        <div style={{ position: "absolute", top: 480, width: "100%", textAlign: "center", fontSize: 54, fontWeight: 800 }}><Pop delay={12}>{hook}</Pop></div>
        <Sequence from={30}><div style={{ position: "absolute", top: 760, left: 60, right: 60, display: "flex", gap: 20 }}>
          {points.map((p, i) => <div key={p} style={{ flex: 1 }}><Pop delay={i * 8}><div style={{ border: `3px solid ${accent}`, borderRadius: 24, padding: "36px 10px", textAlign: "center", fontSize: 40, fontWeight: 900, background: "rgba(13,20,33,.9)" }}>{p}</div></Pop></div>)}
        </div></Sequence>
        <div style={{ position: "absolute", top: 1240, left: 70, right: 70, display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 54, fontWeight: 900, justifyContent: "center" }}>
          {words.map((w, i) => <span key={i} style={{ padding: "0 8px", borderRadius: 10, background: i === active ? accent : "transparent", color: i === active ? "#05080e" : "#fff" }}>{w}</span>)}
        </div>
        <div style={{ position: "absolute", bottom: 140, width: "100%", textAlign: "center", fontSize: 30, fontWeight: 800, letterSpacing: 4, color: "#8A97AD" }}>AGENTOON.AI</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
