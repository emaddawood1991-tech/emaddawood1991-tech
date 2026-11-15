import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../fx/theme";
import { AnimatedCounter, BarChart, CircularProgress, Countdown, LineChart, ProgressBar, RollingDigits } from "../fx/data";
import { AnimatedSubtitles, KineticWords, LetterReveal, TextMorph, Title3D, WordHighlight } from "../fx/kinetic";
import { ComparisonMorph, McpDiagram, NodeNetwork, ProcessSteps, Timeline, AnimatedArrow } from "../fx/infographics";
import { LogoReveal, LogoTransition, ParticleLogo, ProductPresentation, ShapeMorph } from "../fx/logo";
import { CameraRig, LightSweep, MotionBlur, DepthLayers } from "../fx/cinematic";
import { FlyThrough, Logo3D, Title3DMesh } from "../fx/three";
import { BlenderSequence } from "../fx/blender";
import { NeonOutline } from "../fx/NeonOutline";
import { ScrapbookCollage, CollageItem } from "../fx/ScrapbookCollage";
import { ExplainerPanel, PanelProps } from "../fx/ExplainerPanel";
import { clamp, easeInOutCubic, lerp, speedRamp } from "../fx/math";

/** Frame: shared scene chrome (dark field, header chip naming the effect, footer naming the technique). */
const Frame: React.FC<{ n: string; title: string; tech: string; children: React.ReactNode; bg?: string }> = ({ n, title, tech, children, bg }) => {
  const f = useCurrentFrame(); const a = interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: bg ?? "radial-gradient(120% 70% at 50% 25%, #1B2130 0%, #0B0D12 72%)", fontFamily: theme.body }}>
      <div style={{ position: "absolute", left: 50, top: 100, opacity: a, display: "flex", alignItems: "center", gap: 18, zIndex: 40 }}>
        <div style={{ background: theme.lime, color: "#0F1115", fontFamily: theme.mono, fontWeight: 800, fontSize: 34, padding: "8px 20px", borderRadius: 999 }}>{n}</div>
        <div style={{ fontWeight: 900, fontSize: 52, color: "#fff", textTransform: "uppercase", letterSpacing: "-.01em" }}>{title}</div>
      </div>
      {children}
      <div style={{ position: "absolute", left: 50, bottom: 70, opacity: a, fontFamily: theme.mono, fontWeight: 800, fontSize: 28, color: "#9AA1AE", zIndex: 40 }}>{tech}</div>
    </AbsoluteFill>
  );
};
const Center: React.FC<{ top: number; children: React.ReactNode; gap?: number }> = ({ top, children }) => <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>{children}</div>;

export const S01Counter: React.FC = () => (
  <Frame n="01" title="Animated counter" tech="AnimatedCounter · RollingDigits (odometer) · frame-based 0 → 1,000">
    <Center top={420}><AnimatedCounter to={1000} start={8} dur={64} size={330} label="COUNTER 0 → 1,000" /><RollingDigits to={1000} digits={4} start={8} dur={64} size={150} /><ProgressBar to={100} start={8} dur={64} label="PROGRESS" width={900} /></Center>
  </Frame>
);
export const S02Percent: React.FC = () => (
  <Frame n="02" title="Rolling percentage" tech="RollingDigits 0 → 95% · CircularProgress · Countdown">
    <Center top={380}><RollingDigits to={95} digits={2} suffix="%" start={6} dur={70} size={300} /><CircularProgress to={95} start={6} dur={70} size={520} stroke={44} /><Countdown from={3} start={4} dur={84} size={260} /></Center>
  </Frame>
);
export const S03Bars: React.FC = () => (
  <Frame n="03" title="Animated bar chart" tech="BarChart (staggered, eased, value labels) · LineChart · DEMO DATA">
    <Center top={400}><BarChart bars={[{ label: "JAN", value: 32 }, { label: "FEB", value: 48 }, { label: "MAR", value: 41 }, { label: "APR", value: 67 }, { label: "MAY", value: 95 }]} start={6} height={560} unit="" /><LineChart points={[10, 22, 18, 40, 52, 47, 78, 95]} start={30} width={940} height={300} /></Center>
  </Frame>
);
export const S04Logo3D: React.FC = () => (
  <Frame n="04" title="3D rotating logo" tech="three.js ExtrudeGeometry from the real SVG · R3F via @remotion/three · key/rim/fill lights">
    <AbsoluteFill><Logo3D svg="logos/openwhispr.svg" /></AbsoluteFill>
    <div style={{ position: "absolute", right: 40, bottom: 150, zIndex: 30, textAlign: "center" }}><BlenderSequence dir="blender/cal" frames={36} size={380} /><div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 28, color: "#C8F031" }}>BLENDER (CYCLES) RENDER</div></div>
  </Frame>
);
const FLY = { panels: [{ src: "shots/cap-0.jpg", pos: [-1.5, 0, 0] as [number, number, number], rot: [0, 0.3, 0] as [number, number, number] }, { src: "shots/openseo-0.jpg", pos: [-1.5, 0.5, -7] as [number, number, number], rot: [0, 0.3, 0] as [number, number, number] }, { src: "shots/appflowy-0.jpg", pos: [1.6, -0.3, -14] as [number, number, number], rot: [0, -0.3, 0] as [number, number, number] }, { src: "shots/openwhispr-1.jpg", pos: [-1.4, 0.3, -21] as [number, number, number], rot: [0, 0.3, 0] as [number, number, number] }, { src: "shots/openai-0.jpg", pos: [0, 0, -28] as [number, number, number] }], path: [[0.4, 0.2, 6], [1.3, 0.3, 0], [1.2, 0.3, -7], [-1.2, 0.1, -14], [1.2, 0.2, -21], [0, 0.1, -27]] as [number, number, number][] };
export const S05Fly: React.FC = () => (
  <Frame n="05" title="Camera fly-through" tech="CatmullRom camera path through floating panels · fog depth · eased speed ramp" bg="#07080C">
    <AbsoluteFill><FlyThrough panels={FLY.panels} path={FLY.path} ramp={[{ f: 0, t: 0 }, { f: 30, t: 20 }, { f: 80, t: 78 }, { f: 110, t: 100 }]} /></AbsoluteFill>
  </Frame>
);
const SUBS = "Words spring in. Letters flip up. Text morphs.".split(" ").map((w, i) => ({ w, s: 8 + i * 11, e: 8 + (i + 1) * 11 }));
export const S06Kinetic: React.FC = () => (
  <Frame n="06" title="Kinetic text reveal" tech="KineticWords · LetterReveal · TextMorph · Title3D · AnimatedSubtitles">
    <Center top={330}><KineticWords text="REAL MOTION. REAL CODE." start={4} size={118} highlight={[3]} /><LetterReveal text="Letter by letter" start={34} size={92} color="#C5CAD3" /><TextMorph a="PAID TOOL" b="OPEN SOURCE" start={52} dur={34} size={86} /><Title3D text="3D TITLE" start={14} size={150} /><AnimatedSubtitles words={SUBS} /></Center>
  </Frame>
);
export const S07Mcp: React.FC = () => (
  <Frame n="07" title="MCP connection diagram" tech="FlowLine (bezier, flowing dots both ways) · NodeBox · CONCEPT DIAGRAM">
    <div style={{ position: "absolute", left: 20, top: 320 }}><McpDiagram start={6} /></div>
  </Frame>
);
export const S08Morph: React.FC = () => (
  <Frame n="08" title="Morphing comparison" tech="ComparisonMorph · TextMorph name swap · bars interpolate · colour crossfade">
    <Center top={340}><ComparisonMorph a={{ name: "PAID TOOL", color: "#FF5A4D" }} b={{ name: "OPEN SOURCE", color: "#C8F031" }} start={34} dur={46} rows={[{ label: "Source code open", a: 0, b: 100 }, { label: "Self-hostable", a: 5, b: 100 }, { label: "Vendor lock-in", a: 100, b: 20 }, { label: "Setup effort", a: 12, b: 70 }]} /></Center>
  </Frame>
);
export const S09Neon: React.FC = () => <NeonOutline src="robot/robot-neutral.png" imgW={1200} imgH={1680} x={160} y={380} width={760} ring={7} title="ROBOT · NEON OUTLINE" />;
const collage: CollageItem[] = [
  { id: "cap", kind: "shot", src: "shots/cap-0.jpg", x: 40, y: 430, w: 640, rot: -4, depth: 0.35, delay: 4, from: "left", tape: true, zoom: { to: 1.25, ox: 50, oy: 35 } },
  { id: "seo", kind: "shot", src: "shots/openseo-0.jpg", x: 400, y: 650, w: 640, rot: 3, depth: 0.55, delay: 10, from: "right", tape: true, zoom: { to: 1.3, ox: 50, oy: 80 } },
  { id: "flowy", kind: "shot", src: "shots/appflowy-0.jpg", x: 36, y: 980, w: 560, rot: 2.5, depth: 0.5, delay: 16, from: "left", zoom: { to: 1.3, ox: 40, oy: 85 } },
  { id: "whispr", kind: "shot", src: "shots/openwhispr-1.jpg", x: 470, y: 1170, w: 580, rot: -3, depth: 0.8, delay: 22, from: "right", tape: true, zoom: { to: 1.25, ox: 50, oy: 45 } },
  { id: "bot", kind: "cutout", src: "robot/robot-neutral.png", x: 20, y: 1190, w: 470, rot: -4, depth: 1.0, delay: 30, from: "bottom" },
  { id: "logo1", kind: "logo", src: "logos/cap.png", x: 880, y: 150, w: 150, rot: 9, depth: 0.9, delay: 36, from: "top" },
  { id: "note1", kind: "note", text: "REAL SCREENSHOTS", x: 560, y: 1610, w: 420, rot: -3, depth: 0.95, delay: 44, from: "right" },
];
export const S10Scrap: React.FC = () => <ScrapbookCollage items={collage} kicker="/SCRAPBOOK-COLLAGE" titleWords={["REAL", "TOOLS", "COLLAGE"]} highlightWord={1} titleDelay={4} titleY={120} />;
const panel: PanelProps = {
  shot: "shots/cap-0.jpg", shotW: 1920, shotH: 1200, url: "cap.so", heading: "/EXPLAINER-PANEL-REEL",
  cam: [{ f: 0, cx: 960, cy: 600, zoom: 1 }, { f: 30, cx: 800, cy: 400, zoom: 1.7 }, { f: 76, cx: 900, cy: 820, zoom: 1.6 }, { f: 108, cx: 960, cy: 600, zoom: 1.05 }],
  cursor: [{ f: 0, x: 1500, y: 160 }, { f: 28, x: 770, y: 340 }, { f: 34, x: 770, y: 340, click: true }, { f: 70, x: 905, y: 905 }, { f: 78, x: 905, y: 905, click: true }, { f: 110, x: 905, y: 905 }],
  highlights: [{ f: 26, to: 76, x: 690, y: 308, w: 190, h: 64 }, { f: 72, to: 110, x: 760, y: 870, w: 290, h: 72 }],
  callouts: [{ f: 32, to: 76, x: 770, y: 340, label: "INSTANT MODE", step: 1, side: "above" }, { f: 78, to: 110, x: 905, y: 905, label: "DOWNLOAD", step: 2, side: "above" }],
  steps: [{ title: "Open the site", detail: "cap.so", from: 0, to: 26 }, { title: "Pick Instant Mode", detail: "share link on stop", from: 26, to: 72 }, { title: "Download + record", detail: "free for Linux shown", from: 72, to: 112 }],
  words: "Open cap dot so. Pick Instant Mode. Hit download, then record.".split(" ").map((w, i) => ({ w, s: 3 + i * 12, e: 3 + (i + 1) * 12 })),
};
export const S11Explainer: React.FC = () => <ExplainerPanel {...panel} />;
export const S12Logo: React.FC = () => {
  const f = useCurrentFrame();
  const sq = "M18,18 L82,18 L82,82 L18,82 Z", ci = "M50,10 C72,10 90,28 90,50 C90,72 72,90 50,90 C28,90 10,72 10,50 C10,28 28,10 50,10 Z", rr = "M30,10 L70,10 C82,10 90,18 90,30 L90,70 C90,82 82,90 70,90 L30,90 C18,90 10,82 10,70 L10,30 C10,18 18,10 30,10 Z";
  return (
    <Frame n="12" title="Logo motion" tech="ShapeMorph → real logo · ParticleLogo (pixels sampled from the logo) · LogoReveal · ProductPresentation">
      <div style={{ position: "absolute", left: 60, top: 330 }}><ShapeMorph paths={[sq, ci, rr]} start={4} each={22} size={380} logo="logos/cap.png" /></div>
      <div style={{ position: "absolute", left: 540, top: 330 }}><ParticleLogo src="logos/openseo-icon.png" size={480} start={8} dur={60} step={8} /></div>
      <div style={{ position: "absolute", left: 80, top: 860 }}><LogoReveal src="logos/appflowy.svg" size={380} start={36} /></div>
      <div style={{ position: "absolute", left: 560, top: 840 }}><ProductPresentation src="logos/openwhispr-icon.png" size={380} start={26} /></div>
      <div style={{ position: "absolute", left: 340, top: 1400 }}><LogoTransition from="logos/cal.svg" to="logos/cap.png" start={56} size={340} /></div>
    </Frame>
  );
};
export const S13Camera: React.FC = () => {
  const f = useCurrentFrame(); const ramp = [{ f: 0, t: 0 }, { f: 40, t: 160 }, { f: 70, t: 190 }, { f: 110, t: 520 }]; const x = 200 + speedRamp(f, ramp) * 3; const y = 960 + Math.sin(f / 18) * 140;
  const tgt = (ff: number) => ({ x: 200 + speedRamp(Math.max(0, ff), ramp) * 3, y: 960 + Math.sin(Math.max(0, ff) / 18) * 140 });
  return (
    <Frame n="13" title="Tracking + speed ramp" tech="CameraRig (lagged follow) · speedRamp (fast → slow → fast) · MotionBlur · LightSweep">
      <MotionBlur samples={6}><CameraRig target={tgt} zoom={1.05} lag={8}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 2600, height: 1920 }}>
          {Array.from({ length: 13 }).map((_, i) => <div key={i} style={{ position: "absolute", left: 200 + i * 190, top: 700 + (i % 3) * 190, width: 150, height: 150, borderRadius: 30, background: i % 4 === 0 ? theme.lime : "#222733", border: "3px solid #3A4152" }} />)}
          <div style={{ position: "absolute", left: x - 90, top: y - 130, width: 260, filter: "drop-shadow(0 0 18px rgba(53,242,255,.8))" }}><Img src={staticFile("robot/robot-neutral.png")} style={{ width: 260 }} /></div>
        </div>
      </CameraRig></MotionBlur>
      <LightSweep start={78} dur={26} />
    </Frame>
  );
};

export const SCENES: { id: string; dur: number; C: React.FC; pres: "circle" | "diag" | "depth" | "whip" }[] = [
  { id: "S01", dur: 96, C: S01Counter, pres: "circle" }, { id: "S02", dur: 96, C: S02Percent, pres: "diag" }, { id: "S03", dur: 96, C: S03Bars, pres: "depth" },
  { id: "S04", dur: 100, C: S04Logo3D, pres: "whip" }, { id: "S05", dur: 112, C: S05Fly, pres: "circle" }, { id: "S06", dur: 110, C: S06Kinetic, pres: "diag" },
  { id: "S07", dur: 100, C: S07Mcp, pres: "depth" }, { id: "S08", dur: 100, C: S08Morph, pres: "whip" }, { id: "S09", dur: 100, C: S09Neon, pres: "circle" },
  { id: "S10", dur: 100, C: S10Scrap, pres: "diag" }, { id: "S11", dur: 112, C: S11Explainer, pres: "depth" }, { id: "S12", dur: 112, C: S12Logo, pres: "whip" }, { id: "S13", dur: 112, C: S13Camera, pres: "circle" },
];
