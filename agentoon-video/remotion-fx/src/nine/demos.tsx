import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../fx/theme";
import { UiDepthReel } from "../fx/UiDepthReel";
import { ScrapbookCollage, CollageItem } from "../fx/ScrapbookCollage";
import { NewsBroadcast } from "../fx/NewsBroadcast";
import { NeonOutline } from "../fx/NeonOutline";
import { AnimatedCounter, BarChart, CircularProgress, RollingDigits, SpringNumber } from "../fx/data";
import { Showcase3D } from "../fx/three";
import { AnimatedSubtitles, KineticWords, LetterReveal, TextMorph } from "../fx/kinetic";
import { DataFlow } from "../fx/infographics";
import { CinematicCuts, HardCut } from "../fx/CinematicCuts";
import { ROBOT_SEQ } from "../fx/subject";
import { clamp } from "../fx/math";
import kwords from "../../public/audio/kinetic.json";

export const DEMO_FRAMES = 180;
/** chip shown on every demo: INPUT while the original is on screen, OUTPUT <command> after the transformation. */
const Tag: React.FC<{ cmd: string; flip: number; input: string }> = ({ cmd, flip, input }) => {
  const f = useCurrentFrame(); const out = f >= flip;
  return <div style={{ position: "absolute", left: 40, top: 16, zIndex: 90, display: "flex", gap: 14, alignItems: "center" }}><div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 32, padding: "8px 20px", borderRadius: 999, background: out ? theme.lime : "#fff", color: "#0F1115" }}>{out ? "OUTPUT" : "INPUT"}</div><div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 32, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,.8)" }}>{out ? cmd : input}</div></div>;
};
/** reveal `after` over `before` with a diagonal sweep between frames w0..w1. */
const Reveal: React.FC<{ before: React.ReactNode; after: React.ReactNode; w0?: number; w1?: number }> = ({ before, after, w0 = 36, w1 = 56 }) => {
  const f = useCurrentFrame(); const p = clamp((f - w0) / (w1 - w0)); const x = p * 140;
  return <AbsoluteFill><AbsoluteFill>{before}</AbsoluteFill>{p > 0 && <AbsoluteFill style={{ clipPath: p >= 1 ? undefined : `polygon(0 0, ${x}% 0, ${x - 30}% 100%, 0 100%)` }}>{after}</AbsoluteFill>}</AbsoluteFill>;
};
const Plain: React.FC<{ children: React.ReactNode }> = ({ children }) => <AbsoluteFill style={{ background: "linear-gradient(180deg,#8d949e 0%,#6f7782 100%)" }}>{children}</AbsoluteFill>;

/* 01 ui-depth-reel */
export const D01: React.FC = () => (
  <AbsoluteFill><UiDepthReel video="footage/screen-cap.mp4" lift={34} liftDur={36} panels={[
    { src: "shots/cap-0.jpg", crop: [640, 270, 640, 120], srcW: 1920, srcH: 1200, x: 40, y: 330, z: 160, w: 520, label: "MODES", at: 8 },
    { src: "shots/cap-0.jpg", crop: [680, 850, 560, 130], srcW: 1920, srcH: 1200, x: 540, y: 1200, z: 200, w: 480, label: "DOWNLOAD", at: 18 },
    { src: "shots/cap-0.jpg", crop: [0, 0, 1920, 110], srcW: 1920, srcH: 1200, x: 90, y: 1300, z: 90, w: 760, label: "NAV", at: 28 },
    { src: "shots/openwhispr-1.jpg", crop: [560, 330, 800, 420], srcW: 1920, srcH: 1200, x: 640, y: 300, z: -120, w: 420, at: 14 },
  ]} /><Tag cmd="/ui-depth-reel" flip={34} input="ordinary screen recording" /></AbsoluteFill>
);
/* 02 scrapbook-collage */
const collage: CollageItem[] = [
  { id: "cap", kind: "shot", src: "shots/cap-0.jpg", x: 40, y: 430, w: 640, rot: -4, depth: 0.35, delay: 6, from: "left", tape: true, zoom: { to: 1.25, ox: 50, oy: 35 } },
  { id: "seo", kind: "shot", src: "shots/openseo-0.jpg", x: 400, y: 650, w: 640, rot: 3, depth: 0.55, delay: 12, from: "right", tape: true, zoom: { to: 1.3, ox: 50, oy: 80 } },
  { id: "flowy", kind: "shot", src: "shots/appflowy-0.jpg", x: 36, y: 980, w: 560, rot: 2.5, depth: 0.5, delay: 18, from: "left", zoom: { to: 1.3, ox: 40, oy: 85 } },
  { id: "bot", kind: "cutout", seq: ROBOT_SEQ, x: 330, y: 1060, w: 520, rot: -3, depth: 1.0, delay: 26, from: "bottom" },
  { id: "logo1", kind: "logo", src: "logos/cap.png", x: 880, y: 150, w: 150, rot: 9, depth: 0.9, delay: 34, from: "top" },
  { id: "note1", kind: "note", text: "REAL SCREENSHOTS", x: 560, y: 1700, w: 420, rot: -3, depth: 0.95, delay: 40, from: "right" },
];
export const D02: React.FC = () => <AbsoluteFill><Reveal before={<Plain><OffthreadVideo src={staticFile("footage/robot-take.mp4")} muted style={{ width: 1080, height: 1920 }} /></Plain>} after={<ScrapbookCollage items={collage} kicker="/SCRAPBOOK-COLLAGE" titleWords={["REAL", "COLLAGE"]} highlightWord={1} titleDelay={4} titleY={175} />} /><Tag cmd="/scrapbook-collage" flip={44} input="ordinary robot footage" /></AbsoluteFill>;
/* 03 news-broadcast */
export const D03: React.FC = () => <AbsoluteFill><Reveal before={<Plain><OffthreadVideo src={staticFile("footage/robot-take.mp4")} muted style={{ width: 1080, height: 1920 }} /></Plain>} after={<NewsBroadcast presenter={ROBOT_SEQ} headline="Nine video styles from one command" name="AGENTOON ROBOT" role="PRESENTER · STYLE DEMO" panels={[{ k: "STYLES", v: "9" }, { k: "ENGINE", v: "REMOTION" }, { k: "FRAMES", v: "30 FPS" }]} ticker="SLASH SKILLS  ·  REAL COMPONENTS  ·  FRAME-DRIVEN ANIMATION" />} /><Tag cmd="/news-broadcast" flip={44} input="ordinary presenter footage" /></AbsoluteFill>;
/* 04 neon-outline: smooth transition from the original take into the neon version (same position) */
export const D04: React.FC = () => {
  const f = useCurrentFrame(); const t = clamp((f - 30) / 34);
  return <AbsoluteFill style={{ background: "#05060A" }}><AbsoluteFill style={{ opacity: 1 - t }}><Plain><OffthreadVideo src={staticFile("footage/robot-take.mp4")} muted style={{ width: 1080, height: 1920 }} /></Plain></AbsoluteFill><AbsoluteFill style={{ opacity: t }}><NeonOutline seq={ROBOT_SEQ} src="" imgW={540} imgH={756} x={230} y={520} width={620} ring={7} /></AbsoluteFill><Tag cmd="/neon-outline" flip={44} input="original robot footage" /></AbsoluteFill>;
};
/* 05 agentoon-number-motion */
const StatLayout: React.FC<{ live: boolean }> = ({ live }) => (
  <AbsoluteFill style={{ background: "radial-gradient(120% 70% at 50% 25%, #1B2130 0%, #0B0D12 72%)", fontFamily: theme.body }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
      {live ? <AnimatedCounter to={1000} start={2} dur={60} size={250} label="COUNTER 0 → 1,000" /> : <div style={{ textAlign: "center" }}><div style={{ fontWeight: 900, fontSize: 250, color: "#9AA1AE" }}>1,000</div><div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 34, color: "#6B7280" }}>STATIC NUMBER</div></div>}
      {live ? <RollingDigits to={95} digits={2} suffix="%" start={6} dur={64} size={170} /> : <div style={{ fontWeight: 900, fontSize: 170, color: "#9AA1AE" }}>95%</div>}
      {live ? <CircularProgress to={95} start={6} dur={64} size={380} stroke={34} /> : <div style={{ width: 380, height: 380, borderRadius: "50%", border: "34px solid #3A4152", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 110, color: "#9AA1AE" }}>95%</div>}
      {live ? <div style={{ display: "flex", alignItems: "center", gap: 30 }}><div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 32, color: "#9AA1AE" }}>SPRING</div><SpringNumber from={49} to={120} start={20} size={120} /></div> : <div style={{ fontWeight: 900, fontSize: 120, color: "#9AA1AE" }}>120</div>}
      {live ? <BarChart bars={[{ label: "A", value: 32 }, { label: "B", value: 48 }, { label: "C", value: 66 }, { label: "D", value: 95 }]} start={8} width={760} height={230} /> : <div style={{ display: "flex", alignItems: "flex-end", gap: 40, height: 260 }}>{[32, 48, 66, 95].map((v, i) => <div key={i} style={{ width: 120, height: v * 2.4, background: "#3A4152", borderRadius: 12 }} />)}</div>}
    </div>
  </AbsoluteFill>
);
export const D05: React.FC = () => <AbsoluteFill><Reveal before={<StatLayout live={false} />} after={<StatLayout live />} /><Tag cmd="/agentoon-number-motion" flip={44} input="static statistics" /></AbsoluteFill>;
/* 06 agentoon-3d-showcase */
export const D06: React.FC = () => <AbsoluteFill><Reveal before={<AbsoluteFill style={{ background: "#F3F4F6", alignItems: "center", justifyContent: "center", display: "flex" }}><Img src={staticFile("logos/openwhispr-icon.png")} style={{ width: 520 }} /></AbsoluteFill>} after={<Showcase3D svg="logos/openwhispr-3d.svg" panels={["shots/cap-0.jpg", "shots/openseo-0.jpg", "shots/appflowy-0.jpg", "shots/openwhispr-1.jpg"]} />} /><Tag cmd="/agentoon-3d-showcase" flip={44} input="static logo" /></AbsoluteFill>;
/* 07 agentoon-kinetic-type: the words are timed to the real narration audio */
const words = kwords as { w: string; s: number; e: number }[];
export const D07: React.FC = () => {
  const f = useCurrentFrame();
  const plain = <AbsoluteFill style={{ background: "#0B0D12", justifyContent: "flex-end", alignItems: "center", display: "flex", paddingBottom: 360 }}><div style={{ fontFamily: "Arial", fontSize: 44, color: "#fff", textAlign: "center", padding: "0 80px", background: "rgba(0,0,0,.6)" }}>Words move. Key phrases pop. Letters reveal. Typography follows speech.</div></AbsoluteFill>;
  const kin = <AbsoluteFill style={{ background: "radial-gradient(120% 70% at 50% 25%, #1B2130 0%, #0B0D12 72%)" }}><div style={{ position: "absolute", left: 40, right: 40, top: 380 }}><KineticWords text="WORDS MOVE" start={50} size={150} highlight={[1]} /></div><div style={{ position: "absolute", left: 40, right: 40, top: 760 }}><KineticWords text="KEY PHRASES POP" start={72} size={110} highlight={[0, 1]} /></div><div style={{ position: "absolute", left: 40, right: 40, top: 1100 }}><LetterReveal text="Letters reveal" start={103} size={110} color="#C5CAD3" /></div><div style={{ position: "absolute", left: 40, right: 40, top: 1330 }}><TextMorph a="PLAIN CAPTIONS" b="SPOKEN TYPE" start={130} dur={30} size={80} /></div><div style={{ position: "absolute", left: 20, right: 20, top: 190 }}><AnimatedSubtitles words={words} size={62} /></div></AbsoluteFill>;
  return <AbsoluteFill><Audio src={staticFile("audio/kinetic.wav")} /><Reveal before={plain} after={kin} w0={30} w1={48} /><Tag cmd="/agentoon-kinetic-type" flip={36} input="ordinary captions" /></AbsoluteFill>;
};
/* 08 agentoon-data-flow */
const NODES = [{ id: "c", label: "CLAUDE", sub: "MCP CLIENT", x: 520, y: 260, color: theme.amber }, { id: "s", label: "MCP SERVER", sub: "JSON-RPC", x: 520, y: 660, color: theme.lime }, { id: "g", label: "GITHUB", sub: "API", x: 200, y: 1060, color: theme.cyan }, { id: "f", label: "FILES", sub: "TOOL", x: 840, y: 1060, color: theme.cyan }];
const EDGES = [{ from: "c", to: "s", packet: "call" }, { from: "s", to: "g", packet: "GET" }, { from: "s", to: "f", packet: "read" }];
export const D08: React.FC = () => <AbsoluteFill><Reveal before={<AbsoluteFill style={{ background: "#0B0D12" }}><div style={{ position: "absolute", left: 20, top: 300 }}><DataFlow nodes={NODES} edges={EDGES} static /></div></AbsoluteFill>} after={<AbsoluteFill style={{ background: "radial-gradient(120% 70% at 50% 25%, #1B2130 0%, #0B0D12 72%)" }}><div style={{ position: "absolute", left: 20, top: 300 }}><DataFlow start={0} nodes={NODES} edges={EDGES} highlight={["c>s", "s>g"]} /></div><div style={{ position: "absolute", left: 50, top: 1500, fontFamily: theme.mono, fontWeight: 800, fontSize: 30, color: theme.amber }}>HIGHLIGHTED API PATH: CLAUDE → MCP → GITHUB · CONCEPT DIAGRAM</div></AbsoluteFill>} w0={36} w1={56} /><Tag cmd="/agentoon-data-flow" flip={44} input="static workflow" /></AbsoluteFill>;
/* 09 agentoon-cinematic-cuts */
export const D09: React.FC = () => {
  const f = useCurrentFrame();
  const hard = f < 48; const label = hard ? "HARD CUT (ordinary)" : f < 100 ? "CAMERA-DRIVEN PUSH + MOTION BLUR" : f < 118 ? "MATCH CUT · MASK TRANSITION" : "MOTION-MATCHED ZOOM-OUT";
  return <AbsoluteFill style={{ background: "#0B0D12" }}>
    {hard ? <HardCut a="footage/cut-cap.mp4" b="footage/cut-openseo.mp4" cut={24} aFrom={40} bFrom={40} /> : <CinematicCuts a="footage/cut-cap.mp4" b="footage/cut-openseo.mp4" pa={[520, 604]} pb={[640, 512]} start={48} cut={108} end={170} aFrom={40} bFrom={40} blurSamples={6} />}
    <Tag cmd="/agentoon-cinematic-cuts" flip={48} input="two ordinary scenes" />
    <div style={{ position: "absolute", left: 40, bottom: 150, zIndex: 90, fontFamily: theme.mono, fontWeight: 800, fontSize: 32, color: "#fff", background: "rgba(0,0,0,.65)", padding: "8px 18px", borderRadius: 12 }}>{label}</div>
  </AbsoluteFill>;
};
export const DEMOS = [["D01", D01], ["D02", D02], ["D03", D03], ["D04", D04], ["D05", D05], ["D06", D06], ["D07", D07], ["D08", D08], ["D09", D09]] as const;
