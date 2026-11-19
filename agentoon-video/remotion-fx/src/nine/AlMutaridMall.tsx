import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING } from "../fx/theme";
import { Robot2, pose2, walkDistance, Walk, Gest2 } from "../fx/RobotRig2";
import { AnimatedSubtitles } from "../fx/kinetic";
import { clamp } from "../fx/math";
import TL from "../../public/data/mall-timeline.json";

/** Al Mutarid Mall (مول المطرد) — Reel. All mall footage is the REAL supplied HTML project (al-mutarid-mall1.html, unmodified) captured frame-by-frame with a virtual
 *  clock. The project is an unofficial interactive 3D concept built on Three.js r170; Claude Code / Vercel claims are the creator's statements (no prompt, repo or deployment was supplied). */
type Scene = { id: string; start: number; len: number };
const SC = TL.scenes as Scene[]; const S = (id: string) => SC.find((s) => s.id === id)!;
const LIP = TL.lip as { fps: number; a: number[] }; export const MALL_FRAMES = TL.frames;
const AR_NAME = "مول المطرد"; const EN_NAME = "AL MUTARID MALL"; const LOC = "AL AIN · UAE";
const G = { gold: "#E0A84A", gold2: "#F5D58A", ink: "#0B0705", cream: "#FFF3DC", lime: "#C8F031", cyan: "#35F2FF", amber: "#FFB23E" };
const mono = '"DejaVu Sans Mono", ui-monospace, Menlo, monospace'; const sans = '"DejaVu Sans", Inter, "Helvetica Neue", Arial, sans-serif';
const foot = (n: string) => staticFile(`ep22/mall/${n}.mp4`);

/* ---------- robot choreography (absolute frames) ---------- */
const W = 380, K = W / 200, FLOORY = 1640;
const WALKS: Walk[] = [
  { from: 4, to: 52, ramp: 10, stepsPerSec: 2.1 },                                 // hook: walks in
  { from: S("walk").start + 6, to: S("walk").start + 250, ramp: 16, amp: 22, stepsPerSec: 1.7 }, // walks alongside the walkthrough
  { from: S("tour").start + 20, to: S("tour").start + 120, ramp: 14, amp: 22, stepsPerSec: 1.8 },
  { from: S("cta").start + 4, to: S("cta").start + 70, ramp: 12, stepsPerSec: 1.9 },
];
const GESTS: Gest2[] = [
  { type: "point", from: 58, to: 105 },
  { type: "present", from: S("reveal").start + 30, to: S("reveal").start + 120, hand: "R" }, { type: "explain", from: S("reveal").start + 130, to: S("reveal").start + 290 },
  { type: "point", from: S("walk").start + 262, to: S("walk").start + 330, hand: "R" }, { type: "explain", from: S("walk").start + 336, to: S("walk").start + 470 }, { type: "present", from: S("walk").start + 472, to: S("walk").start + 540, hand: "R" },
  { type: "explain", from: S("prompt").start + 20, to: S("prompt").start + 180 }, { type: "point", from: S("prompt").start + 190, to: S("prompt").start + 290, hand: "R" }, { type: "present", from: S("prompt").start + 296, to: S("prompt").start + 440, hand: "R" },
  { type: "explain", from: S("tools").start + 10, to: S("tools").start + 130 }, { type: "point", from: S("tools").start + 136, to: S("tools").start + 250, hand: "L" }, { type: "present", from: S("tools").start + 256, to: S("tools").start + 355, hand: "R" },
  { type: "explain", from: S("vercel").start + 10, to: S("vercel").start + 120 }, { type: "point", from: S("vercel").start + 126, to: S("vercel").start + 230, hand: "R" }, { type: "both", from: S("vercel").start + 236, to: S("vercel").start + 355 },
  { type: "both", from: S("tour").start + 124, to: S("tour").start + 250 }, { type: "present", from: S("tour").start + 252, to: S("tour").start + 330, hand: "L" },
  { type: "explain", from: S("cta").start + 74, to: S("cta").start + 190 }, { type: "invite", from: S("cta").start + 196, to: S("cta").start + 289 },
];
/** robot x (px) and facing for the global frame g */
function robotX(g: number): { x: number; flip: boolean } {
  const h = S("hook"), w = S("walk"), t = S("tour"), c = S("cta"), r = S("reveal"), p = S("prompt"), tl = S("tools"), v = S("vercel");
  if (g < r.start) return { x: -330 + walkDistance(g, WALKS[0]) * K, flip: false };
  if (g < w.start) return { x: 70, flip: false };
  if (g < p.start) return { x: 40 + walkDistance(g, WALKS[1]) * K * 0.55, flip: false };
  if (g < tl.start) return { x: 600, flip: false };
  if (g < v.start) return { x: 70, flip: false };
  if (g < t.start) return { x: 600, flip: false };
  if (g < c.start) return { x: 60 + walkDistance(g, WALKS[2]) * K * 0.6, flip: false };
  return { x: 80 + walkDistance(g, WALKS[3]) * K * 0.8, flip: false };
}
const RobotLayer: React.FC<{ start: number; hide?: boolean }> = ({ start, hide }) => {
  const f = useCurrentFrame(); const g = f + start; const { x, flip } = robotX(g); const pose = pose2(g, { lip: LIP, speaking: [[0, MALL_FRAMES]], walks: WALKS, gestures: GESTS, seed: 4 });
  if (hide) return null;
  return <div style={{ position: "absolute", left: x, top: FLOORY - W * 1.4 * (272 / 280), zIndex: 60, filter: "drop-shadow(0 18px 18px rgba(0,0,0,.55))" }}><Robot2 pose={pose} width={W} flip={flip} shadow /></div>;
};

/* ---------- shared pieces ---------- */
const Cover: React.FC<{ name: string; rate?: number; from?: number; zoom?: number; ox?: number; oy?: number; dim?: number; end?: number }> = ({ name, rate = 1, from = 0, zoom = 1, ox = 50, oy = 50, dim = 0 }) => (
  <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: `${ox}% ${oy}%` }}><OffthreadVideo src={foot(name)} muted startFrom={from} playbackRate={rate} style={{ width: 1080, height: 1920, objectFit: "cover" }} /></div>
    {dim > 0 ? <AbsoluteFill style={{ background: `rgba(6,3,1,${dim})` }} /> : null}
  </AbsoluteFill>
);
const Caps: React.FC<{ id: string; size?: number }> = ({ id, size = 58 }) => {
  const sc = S(id); const words = TL.words.filter((w) => w.s >= sc.start - 2 && w.s < sc.start + sc.len).map((w) => ({ ...w, s: w.s - sc.start, e: w.e - sc.start }));
  return <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 150 + size * 2.5, padding: "70px 40px 0", background: "linear-gradient(180deg, rgba(6,3,1,.85) 0%, rgba(6,3,1,.55) 65%, rgba(6,3,1,0) 100%)", zIndex: 90 }}><AnimatedSubtitles words={words} size={size} perChunk={4} /></div>;
};
const Chip: React.FC<{ text: string; x: number; y: number; at: number; bg?: string; fg?: string; size?: number; maxW?: number }> = ({ text, x, y, at, bg = G.gold, fg = G.ink, size = 32, maxW }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: f - at, fps, config: SPRING.pop });
  return <div style={{ position: "absolute", left: x, top: y, maxWidth: maxW, transform: `scale(${s})`, transformOrigin: "left center", opacity: clamp(s * 2), background: bg, color: fg, fontFamily: sans, fontWeight: 800, fontSize: size, padding: "9px 18px", borderRadius: 10, boxShadow: "0 10px 26px rgba(0,0,0,.55)", border: "2px solid rgba(0,0,0,.5)", zIndex: 70, lineHeight: 1.15 }}>{text}</div>;
};
const Vignette: React.FC<{ a?: number }> = ({ a = 0.55 }) => <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,${a}) 100%)`, zIndex: 30 }} />;
const Disclaimer: React.FC<{ at?: number }> = ({ at = 20 }) => <Chip text="Unofficial interactive 3D concept · not the real mall" x={40} y={1688} at={at} bg="rgba(11,7,5,.85)" fg={G.cream} size={24} />;

/* ---------- 1 HOOK ---------- */
const Hook: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const words = ["I BUILT THIS", "WITH ONE", "PROMPT!"];
  return (
    <AbsoluteFill>
      <Cover name="hook" zoom={1 + 0.06 * (f / 105)} /><Vignette />
      <div style={{ position: "absolute", left: 40, right: 40, top: 230, textAlign: "center", zIndex: 80 }}>
        {words.map((w, i) => { const s = spring({ frame: f - 4 - i * 12, fps, config: SPRING.slam }); return <div key={w} style={{ fontFamily: sans, fontWeight: 900, fontSize: i === 2 ? 150 : 104, lineHeight: 1.04, color: i === 2 ? G.gold2 : "#fff", transform: `scale(${0.6 + 0.4 * s}) translateY(${(1 - s) * 60}px)`, opacity: clamp(s * 2), textShadow: "0 6px 0 #000, 0 0 30px rgba(0,0,0,.8)", WebkitTextStroke: "3px #000" }}>{w}</div>; })}
      </div>
      <RobotLayer start={0} />
    </AbsoluteFill>
  );
};

/* ---------- 2 REVEAL: 3D title ---------- */
const Reveal: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: f - 6, fps, config: { damping: 18, stiffness: 70, mass: 1 } }); const rx = 68 * (1 - s) + 6, op = clamp(s * 1.6);
  const ext = Array.from({ length: 14 }).map((_, i) => `0 ${i + 1}px 0 #8a5a1f`).join(",");
  return (
    <AbsoluteFill>
      <Cover name="reveal" rate={0.9} zoom={1 + 0.05 * (f / 300)} /><Vignette /><Caps id="reveal" size={52} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", perspective: 1100, zIndex: 80 }}>
        <div style={{ transform: `rotateX(${rx}deg) translateZ(${(1 - s) * -160}px)`, opacity: op, transformStyle: "preserve-3d" }}>
          <div dir="rtl" style={{ fontFamily: sans, fontWeight: 900, fontSize: 170, color: G.gold2, textShadow: `${ext}, 0 24px 40px rgba(0,0,0,.8)`, lineHeight: 1.1 }}>{AR_NAME}</div>
        </div>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 54, letterSpacing: `${0.34 * (1 - clamp((f - 30) / 40)) + 0.2}em`, color: "#fff", opacity: clamp((f - 24) / 14), textShadow: "0 4px 0 #000", marginTop: 8 }}>{EN_NAME}</div>
        <div style={{ display: "inline-block", marginTop: 16, background: G.gold, color: G.ink, fontFamily: sans, fontWeight: 900, fontSize: 38, padding: "6px 24px", borderRadius: 10, opacity: clamp((f - 46) / 12) }}>{LOC}</div>
      </div>
      <Disclaimer at={90} /><RobotLayer start={S("reveal").start} />
    </AbsoluteFill>
  );
};

/* ---------- 3 WALK: the real project UI, labelled ---------- */
const Walk3: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cover name="walk" /><Caps id="walk" size={50} />
      <Chip text="REAL DIRECTORY · 32 VENUES" x={40} y={300} at={20} size={30} />
      <Chip text="tap a venue → the camera walks you there" x={40} y={376} at={44} bg="rgba(11,7,5,.88)" fg={G.cream} size={26} maxW={520} />
      {f >= 250 ? <Chip text="CLICK A SIGN → SHOP CARD" x={40} y={300} at={262} bg={G.cyan} size={30} /> : null}
      {f >= 360 ? <Chip text="“Keep walking” → on to the next venue" x={40} y={376} at={372} bg="rgba(11,7,5,.88)" fg={G.cream} size={26} maxW={520} /> : null}
      <RobotLayer start={S("walk").start} />
    </AbsoluteFill>
  );
};

/* ---------- 4 PROMPT → CODE → RUNNING SITE ---------- */
const CODE = ['<!doctype html>', '<html lang="en">', '<head>', '  <meta charset="utf-8" />', '  <title>Al Mutarid Mall · مول المطرد</title>', '  <style>', '    :root { --gold:#e0a84a; --ink:#120b07; --cream:#fff3dc; }', '    canvas { display:block; width:100vw; height:100vh; }', '  </style>', '</head>', '<body>', '  <canvas id="c"></canvas>', '  <div class="brand"><b>AL MUTARID MALL</b>', '    <span>مول المطرد · العين</span></div>', '  <div class="dir" id="dir"></div>', '  <div class="help">W A S D / arrows to walk · drag to look', '    · click a shop to open it</div>', '<script type="module">…Three.js r170 + app…</script>'];
const Prompt: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const open = clamp((f - 262) / 40); const r = open * 1500;
  const n = Math.floor(clamp((f - 24) / 200) * CODE.length);
  return (
    <AbsoluteFill>
      <Cover name="reveal" from={20} rate={0.5} dim={0.72} /><Caps id="prompt" size={50} />
      <div style={{ position: "absolute", left: 40, top: 330, width: 1000, zIndex: 40, opacity: 1 - clamp((f - 250) / 30) }}>
        <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 40, color: G.gold2, marginBottom: 12 }}>ONE IDEA  →  CLAUDE CODE  →  HTML</div>
        <div style={{ background: "#0E0A07", border: `3px solid ${G.gold}`, borderRadius: 14, padding: "14px 18px", fontFamily: mono, fontSize: 25, lineHeight: "34px", color: "#F0E6D2", minHeight: 18 * 34 + 28, boxShadow: "0 20px 50px rgba(0,0,0,.6)" }}>
          <div style={{ fontSize: 20, color: G.gold, marginBottom: 6 }}>al-mutarid-mall1.html · real file · 3,885 lines · 486 KB</div>
          {CODE.slice(0, n).map((l, i) => <div key={i} style={{ whiteSpace: "pre", color: /^\s*</.test(l) ? "#9FE7FF" : "#F0E6D2" }}>{l}</div>)}
        </div>
        <div style={{ marginTop: 14, fontFamily: sans, fontWeight: 800, fontSize: 26, color: G.cream, opacity: clamp((f - 120) / 12) }}>Original prompt text: not included in the supplied file (not shown, not invented).</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, zIndex: 50, clipPath: `circle(${r}px at 540px 760px)`, background: "#000" }}>
        <Cover name="hook" from={0} rate={0.7} zoom={1.05} /><Vignette />
        <div style={{ position: "absolute", left: 40, top: 330, fontFamily: sans, fontWeight: 900, fontSize: 46, color: G.gold2, textShadow: "0 4px 0 #000" }}>…and it runs in the browser.</div>
      </div>
      <RobotLayer start={S("prompt").start} />
    </AbsoluteFill>
  );
};

/* ---------- 5 TOOLS: only verified/declared tools, animated connections ---------- */
const Tools: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const nodes = [
    { n: "CLAUDE CODE", note: "stated by the creator", x: 540, y: 360 },
    { n: "HTML · CSS · JS", note: "verified: one HTML file", x: 540, y: 600 },
    { n: "THREE.JS r170", note: "verified: license banner + version in file", x: 540, y: 840 },
    { n: "WEB BROWSER", note: "verified: runs from the file, no server calls", x: 540, y: 1080 },
  ];
  return (
    <AbsoluteFill>
      <Cover name="tour" from={120} rate={0.45} dim={0.74} /><Caps id="tools" size={50} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, zIndex: 40 }}>
        {nodes.slice(0, -1).map((a, i) => { const b = nodes[i + 1]; const at = 40 + i * 40; const g = clamp((f - at) / 24); const py = a.y + 70 + (b.y - a.y - 140) * ((((f - at - 24) % 50) + 50) % 50) / 50; return <g key={i}><line x1={a.x} y1={a.y + 70} x2={a.x} y2={a.y + 70 + (b.y - a.y - 140) * g} stroke={G.gold} strokeWidth={6} strokeLinecap="round" strokeDasharray="2 14" />{f > at + 24 ? <circle cx={a.x} cy={py} r={11} fill="#fff" /> : null}</g>; })}
      </svg>
      {nodes.map((nd, i) => { const s = spring({ frame: f - 12 - i * 40, fps, config: SPRING.pop }); return (
        <div key={nd.n} style={{ position: "absolute", left: nd.x - 360, top: nd.y - 70, width: 720, transform: `scale(${s})`, opacity: clamp(s * 2), background: "rgba(14,10,7,.92)", border: `3px solid ${G.gold}`, borderRadius: 16, padding: "14px 22px", boxShadow: "0 16px 40px rgba(0,0,0,.6)", zIndex: 45 }}>
          <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 52, color: "#fff" }}>{nd.n}</div><div style={{ fontFamily: sans, fontWeight: 700, fontSize: 26, color: G.gold2 }}>{nd.note}</div></div>); })}
      <div style={{ position: "absolute", left: 40, top: 1190, width: 1000, background: "#0E0A07", border: "2px solid rgba(224,168,74,.5)", borderRadius: 12, padding: "12px 16px", fontFamily: mono, fontSize: 22, lineHeight: "30px", color: "#F0E6D2", opacity: clamp((f - 150) / 14), zIndex: 45 }}>
        <div style={{ color: G.gold }}>real lines from the file:</div>{[" * Copyright 2010-2024 Three.js Authors", " * SPDX-License-Identifier: MIT", 'const sa="170"  // three.js revision'].map((l) => <div key={l} style={{ whiteSpace: "pre" }}>{l}</div>)}
      </div>
      <RobotLayer start={S("tools").start} />
    </AbsoluteFill>
  );
};

/* ---------- 6 VERCEL: code-to-website (deployment as stated by the creator) ---------- */
const Vercel: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const m = clamp((f - 120) / 40); const s0 = spring({ frame: f - 10, fps, config: SPRING.pop });
  return (
    <AbsoluteFill>
      <Cover name="end" from={30} rate={0.4} dim={0.78} /><Caps id="vercel" size={50} />
      <div style={{ position: "absolute", left: 80, top: 360, width: 360, transform: `scale(${s0 * (1 - m * 0.2)}) translateX(${-m * 30}px)`, opacity: 1 - m * 0.35, background: "#0E0A07", border: `3px solid ${G.gold}`, borderRadius: 14, padding: "16px 18px", zIndex: 40 }}>
        <div style={{ fontFamily: mono, fontWeight: 800, fontSize: 28, color: G.gold2 }}>index.html</div><div style={{ fontFamily: mono, fontSize: 21, color: "#F0E6D2" }}>single file · Three.js r170</div>
      </div>
      <svg width={1080} height={700} style={{ position: "absolute", left: 0, top: 360, zIndex: 41 }}><line x1={450} y1={80} x2={450 + 130 * clamp((f - 50) / 30)} y2={80} stroke={G.gold} strokeWidth={7} strokeDasharray="2 14" strokeLinecap="round" /></svg>
      <div style={{ position: "absolute", left: 610, top: 350, width: 400, transform: `scale(${spring({ frame: f - 50, fps, config: SPRING.pop })})`, background: "#000", border: "3px solid #fff", borderRadius: 14, padding: "16px 18px", zIndex: 40 }}>
        <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 46, color: "#fff" }}>▲ Vercel</div><div style={{ fontFamily: sans, fontWeight: 700, fontSize: 22, color: "#9AA1AE" }}>hosting · as stated by the creator</div>
      </div>
      <div style={{ position: "absolute", left: 90, top: 560 + 120 * (1 - clamp((f - 120) / 40)), width: 900, height: 900 * 0.78, border: "4px solid #fff", borderRadius: 18, overflow: "hidden", background: "#000", opacity: clamp((f - 110) / 24), transform: `scale(${0.85 + 0.15 * m})`, boxShadow: "0 30px 80px rgba(0,0,0,.7)", zIndex: 42 }}>
        <div style={{ height: 44, background: "#1B1B1F", display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}><i style={{ width: 12, height: 12, borderRadius: 9, background: "#FF5F57" }} /><i style={{ width: 12, height: 12, borderRadius: 9, background: "#FEBC2E" }} /><i style={{ width: 12, height: 12, borderRadius: 9, background: "#28C840" }} /><span style={{ marginLeft: 10, fontFamily: mono, fontSize: 18, color: "#9AA1AE" }}>web browser · live URL not shown</span></div>
        <div style={{ position: "relative", width: 900, height: 900 * 0.78 - 44, overflow: "hidden" }}><OffthreadVideo src={foot("tour")} muted startFrom={60} playbackRate={0.6} style={{ width: 900, height: 900 * 1.6, objectFit: "cover", marginTop: -140 }} /></div>
      </div>
      <Chip text="Deployment as stated by the creator · dashboard not accessible in this build" x={40} y={1590} at={150} bg={G.amber} size={22} maxW={900} />
      <RobotLayer start={S("vercel").start} />
    </AbsoluteFill>
  );
};

/* ---------- 7 TOUR ---------- */
const Tour: React.FC = () => {
  const f = useCurrentFrame(); const k = f / 330;
  const tag = (t: string, y: number, at: number) => <Chip key={t} text={t} x={40 + (y % 3) * 6} y={y} at={at} bg="rgba(11,7,5,.7)" fg={G.gold2} size={28} />;
  return (
    <AbsoluteFill>
      <Cover name="tour" zoom={1 + 0.07 * k} ox={50} oy={55} /><Vignette a={0.7} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(224,168,74,${0.08 + 0.05 * Math.sin(f / 30)}), rgba(0,0,0,0) 60%)`, mixBlendMode: "screen", zIndex: 31 }} />
      <Caps id="tour" size={52} />
      {tag("RING LIGHTS", 300, 20)}{tag("FOUNTAIN", 376, 70)}{tag("VENUE SIGNS", 452, 120)}
      <RobotLayer start={S("tour").start} />
    </AbsoluteFill>
  );
};

/* ---------- 8 CTA ---------- */
const Cta: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const e = spring({ frame: f - 150, fps, config: SPRING.pop }); const q = clamp(1 - (f - 140) / 12);
  return (
    <AbsoluteFill>
      <Cover name="end" from={0} rate={0.72} zoom={1 + 0.04 * (f / 289)} dim={f > 140 ? 0.55 : 0} /><Vignette />
      {f < 150 ? <Caps id="cta" size={52} /> : null}
      <div style={{ position: "absolute", left: 40, right: 40, top: 560, textAlign: "center", opacity: q, zIndex: 80 }}><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 84, color: "#fff", textShadow: "0 5px 0 #000", lineHeight: 1.05 }}>WHAT WOULD YOU BUILD NEXT?</div></div>
      {f >= 140 ? (
        <div style={{ position: "absolute", left: 40, right: 40, top: 300, textAlign: "center", transform: `scale(${0.9 + 0.1 * e})`, opacity: clamp(e * 2), zIndex: 80 }}>
          <div dir="rtl" style={{ fontFamily: sans, fontWeight: 900, fontSize: 150, color: G.gold2, textShadow: "0 8px 0 #6a4415" }}>{AR_NAME}</div>
          <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 60, letterSpacing: "0.22em", color: "#fff" }}>{EN_NAME}</div>
          <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 36, color: G.gold, marginTop: 18 }}>BUILT WITH CLAUDE CODE</div>
          <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 36, color: G.gold, marginTop: 6 }}>DEPLOYED WITH VERCEL</div>
          <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 54, color: G.lime, marginTop: 22 }}>@AGENTOON.AI</div>
        </div>
      ) : null}
      {f > 100 ? <Disclaimer at={104} /> : null}
      <RobotLayer start={S("cta").start} />
    </AbsoluteFill>
  );
};

export const AlMutaridMall: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Audio src={staticFile("audio/mall-mix.wav")} />
    {([["hook", Hook], ["reveal", Reveal], ["walk", Walk3], ["prompt", Prompt], ["tools", Tools], ["vercel", Vercel], ["tour", Tour], ["cta", Cta]] as const).map(([id, C]) => (
      <Sequence key={id} from={S(id).start} durationInFrames={S(id).len}><C /></Sequence>
    ))}
  </AbsoluteFill>
);
