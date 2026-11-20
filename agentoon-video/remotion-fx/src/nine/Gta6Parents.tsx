import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Robot2, pose2, walkDistance, Walk, Gest2 } from "../fx/RobotRig2";
import { AnimatedSubtitles } from "../fx/kinetic";
import { clamp } from "../fx/math";
import TL from "../../public/data/gta-timeline.json";

/** GTA 6: Parents need to know. Footage = official Rockstar press-kit clips (rockstargames.com/VI/media), non-explicit shots only, credited on screen.
 *  Facts: rockstargames.com newswire (Nov 19 2026), playstation.com GTA VI page. Engines: Remotion (composition, robot, motion graphics) + Blender 5.3/Cycles (3D end title). */
type Scene = { id: string; start: number; len: number };
const SC = TL.scenes as Scene[]; const S = (id: string) => SC.find((s) => s.id === id)!;
const LIP = TL.lip as { fps: number; a: number[] }; export const GTA_FRAMES = TL.frames;
const C = { ink: "#070B18", navy: "#0E1730", navy2: "#16254A", amber: "#FFB224", hot: "#FF7A1A", mint: "#27E3C2", white: "#F6F8FF", red: "#FF5560", soft: "#B8C3E0" };
const sans = '"Inter", "DejaVu Sans", Arial, sans-serif';
const rs = (n: string) => staticFile(`ep23/rs/${n}.mp4`);
const POP = { damping: 13, stiffness: 140, mass: 0.8 }; const SLAM = { damping: 11, stiffness: 220, mass: 0.7 }; const SOFT = { damping: 22, stiffness: 100, mass: 1 };

/** frame (scene-relative) of the n-th word of the scene's captions that contains `word` */
const cue = (id: string, word: string, nth = 0) => {
  const sc = S(id); const ws = TL.words.filter((w) => w.s >= sc.start - 1 && w.s < sc.start + sc.len);
  const m = ws.filter((w) => w.w.toLowerCase().replace(/[^a-z0-9+]/g, "").includes(word.toLowerCase())); const w = m[nth] ?? m[0]; return w ? w.s - sc.start : 0;
};

/* ---------------- robot ---------------- */
const W = 380, K = W / 200, FLOORY = 1640;
type Seg = { walk: Walk };
function trackX(g: number, segs: Seg[], start: number) {
  let cur = start;
  for (const s of segs) { const D = walkDistance(s.walk.to, s.walk) * K; if (g < s.walk.from) return cur; if (g <= s.walk.to) return cur + walkDistance(g, s.walk) * K; cur += D; }
  return cur;
}
const RobotLayer: React.FC<{ id: string; segs?: Seg[]; start: number; gests: Gest2[]; rim?: boolean; shadow?: boolean; glow?: boolean }> = ({ id, segs = [], start, gests, rim = true, shadow = false, glow = true }) => {
  const f = useCurrentFrame(); const g = f + S(id).start; const x = trackX(g, segs, start);
  const pose = pose2(g, { lip: LIP, speaking: [[0, GTA_FRAMES]], walks: segs.map((s) => s.walk), gestures: gests, seed: 7 });
  return (<>
    {glow ? <div style={{ position: "absolute", left: x - 60, top: FLOORY - 70, width: W + 120, height: 130, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(255,178,36,.45) 0%, rgba(255,122,26,.16) 48%, rgba(0,0,0,0) 72%)", zIndex: 58 }} /> : null}
    <div style={{ position: "absolute", left: x, top: FLOORY - W * 1.4 * (272 / 280), zIndex: 60, filter: "drop-shadow(0 18px 18px rgba(0,0,0,.45))" }}><Robot2 pose={pose} width={W} shadow={shadow} rim={rim} /></div></>);
};

/* ---------------- shared pieces ---------------- */
const Clip: React.FC<{ name: string; dur: number; from?: number; rate?: number; z0?: number; z1?: number; p0?: number; p1?: number; fadeIn?: number; fadeOut?: number; w?: number; h?: number }> = ({ name, dur, from = 0, rate = 1, z0 = 1, z1 = 1.2, p0 = 50, p1 = 50, fadeIn = 0, fadeOut = 0, w = 1080, h = 1920 }) => {
  const f = useCurrentFrame(); const t = clamp(f / Math.max(1, dur)); const e = 1 - Math.pow(1 - t, 2);
  const op = Math.min(fadeIn ? clamp(f / fadeIn) : 1, fadeOut ? clamp((dur - f) / fadeOut) : 1);
  return (<AbsoluteFill style={{ overflow: "hidden", opacity: op }}>
    <div style={{ position: "absolute", inset: 0, transform: `scale(${z0 + (z1 - z0) * e})` }}>
      <OffthreadVideo src={rs(name)} muted startFrom={from} playbackRate={rate} style={{ width: w, height: h, objectFit: "cover", objectPosition: `${p0 + (p1 - p0) * t}% 50%` }} />
    </div></AbsoluteFill>);
};
const Caps: React.FC<{ id: string; size?: number }> = ({ id, size = 56 }) => {
  const sc = S(id); const words = TL.words.filter((w) => w.s >= sc.start - 2 && w.s < sc.start + sc.len).map((w) => ({ ...w, s: w.s - sc.start, e: w.e - sc.start }));
  return <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 150 + size * 2.5, padding: "64px 36px 0", background: "linear-gradient(180deg, rgba(5,8,18,.88) 0%, rgba(5,8,18,.55) 65%, rgba(5,8,18,0) 100%)", zIndex: 90 }}><AnimatedSubtitles words={words} size={size} perChunk={4} /></div>;
};
const Tag: React.FC<{ text: string; x: number; y: number; at: number; bg?: string; fg?: string; size?: number; z?: number }> = ({ text, x, y, at, bg = C.amber, fg = C.ink, size = 30, z = 70 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: f - at, fps, config: POP });
  return <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s})`, transformOrigin: "left center", opacity: clamp(s * 2), background: bg, color: fg, fontFamily: sans, fontWeight: 800, fontSize: size, padding: "8px 18px", borderRadius: 10, boxShadow: "0 10px 26px rgba(0,0,0,.4)", zIndex: z, whiteSpace: "nowrap" }}>{text}</div>;
};
const Credit: React.FC<{ at?: number }> = ({ at = 14 }) => <Tag text="Footage: Rockstar Games official media kit · GTA VI © Rockstar Games" x={36} y={1688} at={at} bg="rgba(7,11,24,.85)" fg={C.soft} size={21} z={95} />;
/** slab that flies in from depth (parallax card) with a restrained neon outline */
const Slab: React.FC<{ x: number; y: number; w: number; h: number; at: number; children: React.ReactNode; accent?: string; fromX?: number; tilt?: number; z?: number; out?: number }> = ({ x, y, w, h, at, children, accent = C.amber, fromX = 160, tilt = -16, z = 50, out }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: f - at, fps, config: SOFT }); const o = out !== undefined ? clamp((out - f) / 10) : 1;
  const drift = Math.sin((f + x) / 30) * 6;
  return <div style={{ position: "absolute", left: x, top: y + drift, width: w, height: h, transform: `perspective(1400px) translateX(${(1 - s) * fromX}px) translateZ(${(1 - s) * -380}px) rotateY(${(1 - s) * tilt + Math.sin((f + x) / 40) * 2.4}deg) rotateX(${Math.cos((f + y) / 52) * 1.2}deg) scale(${0.96 + 0.04 * o})`, opacity: clamp(s * 1.6) * o, zIndex: z, borderRadius: 24, background: "linear-gradient(160deg, rgba(22,37,74,.96), rgba(10,17,36,.96))", boxShadow: `0 0 0 2px ${accent}, 0 0 26px ${accent}55, 0 24px 50px rgba(0,0,0,.5)`, padding: "18px 26px", fontFamily: sans, color: C.white, display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>{children}</div>;
};
const WarnIcon: React.FC<{ size?: number; color?: string }> = ({ size = 56, color = C.amber }) => (<svg width={size} height={size} viewBox="0 0 64 64"><path d="M32 6 L60 56 H4 Z" fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round" /><rect x="29" y="22" width="6" height="19" rx="3" fill={color} /><circle cx="32" cy="48" r="3.6" fill={color} /></svg>);
const Esrb: React.FC<{ h?: number }> = ({ h = 190 }) => <Img src={staticFile("ep23/esrb_m.svg")} style={{ height: h, display: "block" }} />;
const Pegi: React.FC<{ s?: number }> = ({ s = 150 }) => (<div style={{ width: s, height: s, borderRadius: s * 0.1, background: "#fff", border: `${s * 0.045}px solid #111`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 900, fontSize: s * 0.62, color: "#111", letterSpacing: -2 }}>18</div>);
const Push: React.FC<{ len: number; to?: number; children: React.ReactNode }> = ({ len, to = 0.05, children }) => { const f = useCurrentFrame(); return <AbsoluteFill style={{ transform: `scale(${1 + to * (f / len)}) translateY(${-14 * (f / len)}px)`, transformOrigin: "50% 35%" }}>{children}</AbsoluteFill>; };
const Vignette: React.FC<{ a?: number }> = ({ a = 0.55 }) => <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,${a}) 100%)`, zIndex: 30 }} />;
const Window: React.FC<{ x: number; y: number; w: number; h: number; at?: number; children: React.ReactNode }> = ({ x, y, w, h, at = 0, children }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: f - at, fps, config: SOFT });
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `scale(${0.82 + 0.18 * s})`, opacity: clamp(s * 1.8), borderRadius: 26, overflow: "hidden", boxShadow: `0 0 0 3px ${C.amber}, 0 0 30px ${C.amber}44, 0 30px 60px rgba(0,0,0,.55)`, zIndex: 40, background: "#000" }}>{children}</div>;
};
const BG: React.FC<{ light?: boolean }> = ({ light }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: light ? "linear-gradient(180deg,#F2F5FC 0%,#DCE4F5 62%,#C9D3EA 100%)" : `radial-gradient(90% 60% at 70% 20%, ${C.navy2} 0%, ${C.navy} 45%, ${C.ink} 100%)` }}>
    {!light ? [0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ position: "absolute", left: ((i * 197 + f * (0.9 + i * 0.22)) % 1300) - 120, top: 260 + i * 240, width: 150 + i * 30, height: 150 + i * 30, borderRadius: 30, border: `2px solid rgba(255,178,36,.12)`, transform: `rotate(${12 + i * 9 + f * 0.16}deg)`, opacity: 0.55 }} />) : null}
  </AbsoluteFill>;
};

/* ---------------- 1 HOOK (0-5.8 s) ---------------- */
const hookSeg: Seg[] = [{ walk: { from: 4, to: 56, ramp: 10, stepsPerSec: 2.1 } }];
const hookG: Gest2[] = [{ type: "point", from: 60, to: 175, hand: "R" }];
const Hook: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const a = spring({ frame: f - 4, fps, config: SLAM }); const b = spring({ frame: f - 14, fps, config: SLAM }); const c = spring({ frame: f - 70, fps, config: POP });
  return (<AbsoluteFill style={{ background: "#000" }}>
    <Sequence from={0} durationInFrames={106} layout="none"><Clip name="car" dur={98} z0={1.0} z1={1.38} p0={38} p1={56} fadeOut={8} /></Sequence>
    <Sequence from={98} durationInFrames={80} layout="none"><Clip name="title" dur={78} z0={1.0} z1={1.3} p0={35} p1={55} fadeIn={8} /></Sequence>
    <Vignette a={0.6} /><AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,8,18,.15) 20%, rgba(5,8,18,.55) 100%)", zIndex: 31 }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", zIndex: 70, fontFamily: sans }}>
      <div style={{ fontWeight: 900, fontSize: 220, lineHeight: 0.95, color: "#fff", transform: `scale(${0.5 + 0.5 * a})`, opacity: clamp(a * 2), textShadow: "0 8px 0 #000, 0 0 40px rgba(0,0,0,.7)", WebkitTextStroke: "4px #000" }}>GTA 6</div>
      <div style={{ fontWeight: 900, fontSize: 124, color: C.amber, transform: `scale(${0.5 + 0.5 * b})`, opacity: clamp(b * 2), textShadow: "0 6px 0 #000", WebkitTextStroke: "3px #000", marginTop: 6 }}>IS HERE!</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center", zIndex: 70, opacity: clamp(c * 2), transform: `scale(${0.7 + 0.3 * c}) rotate(-2deg)` }}>
      <div style={{ background: C.amber, color: C.ink, fontFamily: sans, fontWeight: 900, fontSize: 72, padding: "12px 34px", borderRadius: 14, boxShadow: "0 12px 30px rgba(0,0,0,.5)" }}>PARENTS, WATCH THIS.</div></div>
    <Caps id="hook" size={54} /><Credit /><RobotLayer id="hook" segs={hookSeg} start={-123} gests={hookG.map((g) => ({ ...g, from: g.from, to: g.to }))} />
  </AbsoluteFill>);
};

/* ---------------- 2 VISUAL QUALITY ---------------- */
const vS = S("visual").start;
const visSeg: Seg[] = [{ walk: { from: vS + 8, to: vS + 150, ramp: 16, amp: 22, stepsPerSec: 1.7 } }];
const visG: Gest2[] = [{ type: "present", from: vS + 160, to: vS + 260, hand: "R" }, { type: "explain", from: vS + 266, to: vS + 340 }, { type: "present", from: vS + 346, to: vS + 407, hand: "L" }];
const Visual: React.FC = () => {
  const ray = cue("visual", "ray-traced") - 6;
  return (<AbsoluteFill style={{ background: "#000" }}>
    <Sequence from={0} durationInFrames={140} layout="none"><Clip name="road" dur={132} z0={1.0} z1={1.3} p0={30} p1={62} fadeOut={9} /></Sequence>
    <Sequence from={131} durationInFrames={110} layout="none"><Clip name="boat" dur={104} from={14} z0={1.08} z1={1.32} p0={55} p1={35} fadeIn={9} fadeOut={9} /></Sequence>
    <Sequence from={232} durationInFrames={66} layout="none"><Clip name="yacht" dur={57} z0={1.04} z1={1.22} p0={50} p1={42} fadeIn={9} fadeOut={8} /></Sequence>
    <Sequence from={290} durationInFrames={68} layout="none"><Clip name="beach" dur={60} z0={1.0} z1={1.2} p0={45} p1={55} fadeIn={8} fadeOut={8} /></Sequence>
    <Sequence from={350} durationInFrames={57} layout="none"><Clip name="bike" dur={57} z0={1.08} z1={1.3} p0={45} p1={50} fadeIn={8} /></Sequence>
    <Vignette /><AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,8,18,.0) 40%, rgba(5,8,18,.5) 100%)", zIndex: 31 }} />
    <Tag text="REAL ROCKSTAR FOOTAGE" x={36} y={330} at={10} />
    <Tag text="DETAIL · ENVIRONMENTS · CINEMATIC LOOK" x={36} y={398} at={34} bg="rgba(7,11,24,.8)" fg={C.white} size={28} />
    <Slab x={430} y={720} w={612} h={250} at={ray} accent={C.mint} fromX={240}>
      <div style={{ fontSize: 26, fontWeight: 800, color: C.mint, letterSpacing: 2 }}>PLAYSTATION 5 PRO ENHANCED</div>
      <div style={{ fontSize: 44, fontWeight: 900, marginTop: 8 }}>Ray-traced shadows</div><div style={{ fontSize: 44, fontWeight: 900 }}>Sharper image quality</div>
      <div style={{ fontSize: 20, color: C.soft, marginTop: 6 }}>Source: playstation.com GTA VI page</div></Slab>
    <Caps id="visual" /><Credit /><RobotLayer id="visual" segs={visSeg} start={60} gests={visG} />
  </AbsoluteFill>);
};

/* ---------------- 3 CONTENT WARNING ---------------- */
const wS = S("warning").start;
const warnG: Gest2[] = [{ type: "explain", from: wS + 4, to: wS + 120, hand: "R" }, { type: "point", from: wS + 124, to: wS + 296, hand: "R", angle: 20 }];
const Warning: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const tr = spring({ frame: f, fps, config: SOFT }); // footage collapses into the window, background darkens
  const cards: [string, string, number][] = [["VIOLENCE", "Intense violence", cue("warning", "violence")], ["SEXUAL CONTENT", "Strong sexual content", cue("warning", "sexual") - 4], ["NUDITY", "Nudity", cue("warning", "nudity") - 4], ["STRONG LANGUAGE", "Strong language", cue("warning", "explicit") - 4]];
  return (<AbsoluteFill style={{ background: C.ink }}>
    <BG />
    <div style={{ position: "absolute", inset: 0, opacity: 1 - tr, transform: `scale(${1 + 0.25 * tr})`, filter: `brightness(${1 - 0.5 * tr})` }}><Clip name="street" dur={130} rate={0.5} z0={1.0} z1={1.1} /></div>
    <Window x={60} y={330} w={960} h={520} at={4}>
      <Sequence from={0} durationInFrames={122} layout="none"><Clip name="street" dur={114} rate={0.5} z0={1.0} z1={1.16} p0={45} p1={55} w={960} h={520} fadeOut={8} /></Sequence>
      <Sequence from={114} durationInFrames={128} layout="none"><Clip name="bike" dur={120} rate={0.6} z0={1.02} z1={1.2} p0={48} p1={50} w={960} h={520} fadeIn={8} fadeOut={8} /></Sequence>
      <Sequence from={234} durationInFrames={70} layout="none"><Clip name="nstreet" dur={62} rate={0.43} z0={1.02} z1={1.18} p0={50} p1={50} w={960} h={520} fadeIn={8} /></Sequence>
    </Window>
    <div style={{ position: "absolute", left: 436, top: 960, width: 604, zIndex: 60, fontFamily: sans, fontWeight: 900, fontSize: 52, lineHeight: 1.1, color: C.white, opacity: clamp((f - 14) / 10) * clamp((cards[1][2] - 4 - f) / 10), transform: `translateY(${(1 - clamp((f - 14) / 10)) * 24}px)` }}>IMPRESSIVE GRAPHICS<div style={{ color: C.amber }}>≠ SUITABLE FOR CHILDREN</div></div>
    <Tag text="NOT SUITABLE FOR CHILDREN" x={60} y={868} at={cue("warning", "suitable") - 4} bg={C.red} fg="#fff" size={34} />
    {cards.map(([t, s, at], i) => (
      <Slab key={t} x={436} y={940 + i * 156} w={604} h={136} at={Math.max(6, at)} accent={C.amber} fromX={300} tilt={-22}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}><WarnIcon size={62} /><div><div style={{ fontSize: 42, fontWeight: 900, letterSpacing: 1 }}>{t}</div><div style={{ fontSize: 22, color: C.soft }}>Official descriptor: {s}</div></div></div></Slab>))}
    <Caps id="warning" /><Credit /><RobotLayer id="warning" start={50} gests={warnG} />
  </AbsoluteFill>);
};

/* ---------------- 4 MORE ADULT THEMES + DESCRIPTORS + RATINGS ---------------- */
const tS = S("themes").start;
const themeG: Gest2[] = [{ type: "explain", from: tS + 4, to: tS + 150, hand: "R" }, { type: "point", from: tS + 154, to: tS + 280, hand: "R", angle: 20 }, { type: "present", from: tS + 284, to: tS + 420, hand: "R" }, { type: "explain", from: tS + 424, to: tS + 517 }];
const DESC = ["Blood and Gore", "Intense Violence", "Mature Humor", "Nudity", "Strong Language", "Strong Sexual Content", "Use of Drugs and Alcohol"];
const Themes: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const imp = cue("themes", "important") - 4, rated = cue("themes", "rated") - 4;
  const chips: [string, string, number][] = [["DRUGS & ALCOHOL", "Use of Drugs and Alcohol", cue("themes", "drug") - 4], ["MATURE HUMOR", "Mature Humor", cue("themes", "humor") - 4], ["CRIME THEMES", "Themes involving crime", cue("themes", "crime") - 4]];
  const rate = spring({ frame: f - rated, fps, config: SOFT });
  return (<AbsoluteFill style={{ background: C.ink }}>
    <Push len={517} to={0.04}><BG />
    <Window x={60} y={330} w={960} h={430} at={2}>
      <Sequence from={0} durationInFrames={103} layout="none"><Clip name="yacht" dur={95} rate={0.6} z0={1.0} z1={1.18} w={960} h={430} fadeOut={8} /></Sequence>
      <Sequence from={95} durationInFrames={83} layout="none"><Clip name="duo" dur={75} rate={0.4} z0={1.0} z1={1.15} w={960} h={430} fadeIn={8} fadeOut={8} /></Sequence>
      <Sequence from={170} durationInFrames={117} layout="none"><Clip name="beach" dur={109} rate={0.55} z0={1.0} z1={1.18} w={960} h={430} fadeIn={8} fadeOut={8} /></Sequence>
      <Sequence from={279} durationInFrames={230} layout="none"><Clip name="road" dur={220} rate={0.6} z0={1.0} z1={1.2} p0={35} p1={62} w={960} h={430} fadeIn={8} fadeOut={8} /></Sequence>
      <Sequence from={501} durationInFrames={30} layout="none"><Clip name="nstreet" dur={67} rate={0.4} z0={1.0} z1={1.1} w={960} h={430} fadeIn={8} /></Sequence>
    </Window>
    {chips.map(([t, s, at], i) => (<Slab key={t} x={60 + i * 322} y={800} w={308} h={150} at={Math.max(6, at)} fromX={120} tilt={-14} out={imp + 10}>
      <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.05 }}>{t}</div><div style={{ fontSize: 19, color: C.soft, marginTop: 6 }}>{s}</div></Slab>))}
    {/* official descriptors panel */}
    <Slab x={60} y={800} w={960} h={280} at={imp} accent={C.mint} fromX={0} tilt={-6} out={rated + 4}>
      <div style={{ display: "flex", gap: 26, alignItems: "center" }}><Esrb h={188} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 22, fontWeight: 800, color: C.mint, letterSpacing: 2 }}>OFFICIAL CONTENT DESCRIPTORS (VERBATIM)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8 }}>{DESC.map((d, i) => { const on = clamp((f - imp - 6 - i * 5) / 6); return <span key={d} style={{ opacity: on, transform: `translateY(${(1 - on) * 8}px)`, background: "rgba(255,178,36,.16)", border: "1.5px solid rgba(255,178,36,.5)", borderRadius: 8, padding: "3px 11px", fontSize: 25, fontWeight: 700 }}>{d}</span>; })}
            <span style={{ opacity: clamp((f - imp - 44) / 6), background: "rgba(39,227,194,.16)", border: "1.5px solid rgba(39,227,194,.5)", borderRadius: 8, padding: "3px 11px", fontSize: 25, fontWeight: 700 }}>In-Game Purchases</span></div>
          <div style={{ fontSize: 19, color: C.soft, marginTop: 8 }}>Source: rockstargames.com newswire · Nov 19, 2026</div></div></div></Slab>
    {/* ratings panel */}
    <Slab x={60} y={800} w={960} h={290} at={rated} accent={C.amber} fromX={0} tilt={-6}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
        <div style={{ textAlign: "center" }}><Esrb h={170} /><div style={{ fontSize: 26, fontWeight: 900, marginTop: 8 }}>NORTH AMERICA</div><div style={{ fontSize: 22, color: C.soft }}>ESRB M · Mature 17+</div></div>
        <div style={{ textAlign: "center" }}><Pegi s={150} /><div style={{ fontSize: 26, fontWeight: 900, marginTop: 8 }}>EUROPE</div><div style={{ fontSize: 22, color: C.soft }}>PEGI 18</div></div>
        <div style={{ width: 300, fontSize: 32, fontWeight: 900, lineHeight: 1.15, opacity: clamp(rate * 2) }}>RATINGS VARY BY COUNTRY.<div style={{ color: C.amber }}>CHECK YOURS.</div></div></div></Slab>
    </Push><Caps id="themes" /><Credit /><RobotLayer id="themes" start={50} gests={themeG} />
  </AbsoluteFill>);
};

/* ---------------- 5 WHY PARENTS SHOULD CARE (clean studio) ---------------- */
const yS = S("why").start;
const whySeg: Seg[] = [{ walk: { from: yS + 6, to: yS + 80, ramp: 12, stepsPerSec: 1.9 } }];
const whyG: Gest2[] = [{ type: "point", from: yS + 90, to: yS + 190, hand: "R" }, { type: "explain", from: yS + 194, to: yS + 270 }, { type: "present", from: yS + 274, to: yS + 358, hand: "R" }];
const Controller: React.FC<{ s?: number }> = ({ s = 1 }) => (<svg width={380 * s} height={250 * s} viewBox="0 0 380 250"><path d="M70 40 C20 40 6 120 4 175 C2 225 40 240 72 205 L118 160 H262 L308 205 C340 240 378 225 376 175 C374 120 360 40 310 40 Z" fill="#26324F" stroke="#0D1530" strokeWidth="6" /><rect x="96" y="76" width="22" height="64" rx="5" fill="#0D1530" /><rect x="75" y="97" width="64" height="22" rx="5" fill="#0D1530" /><circle cx="272" cy="86" r="14" fill="#27E3C2" /><circle cx="306" cy="112" r="14" fill="#FFB224" /><circle cx="238" cy="112" r="14" fill="#FF5560" /><circle cx="272" cy="138" r="14" fill="#7C9CFF" /><circle cx="150" cy="150" r="26" fill="#0D1530" /><circle cx="230" cy="150" r="26" fill="#0D1530" /></svg>);
const Why: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const pur = cue("why", "purchases") - 8; const pg = spring({ frame: f - 4, fps, config: SOFT }); const rp = spring({ frame: f - 30, fps, config: SOFT }); const pu = spring({ frame: f - pur, fps, config: POP });
  const glow = 0.5 + 0.5 * Math.sin(f / 9);
  return (<AbsoluteFill style={{ background: "#E8EDF8" }}>
    <Push len={358}><BG light />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1560, height: 360, background: "linear-gradient(180deg,#B7C3DE,#8E9CBD)" }} />
    {/* controller on pedestal */}
    <div style={{ position: "absolute", left: 80, top: 640, transform: `translateY(${(1 - pg) * 80}px)`, opacity: clamp(pg * 2), zIndex: 40 }}>
      <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 32, lineHeight: 1.05, color: C.navy, marginBottom: 6, width: 380 }}>GRAPHICS +<br />OPEN WORLD</div>
      <div style={{ filter: "drop-shadow(0 26px 22px rgba(10,20,50,.35))", transform: `rotate(${Math.sin(f / 22) * 5}deg) translateY(${Math.sin(f / 16) * 8}px)` }}><Controller s={0.95} /></div>
      <div style={{ width: 330, height: 26, borderRadius: "50%", background: "rgba(14,23,48,.28)", margin: "-8px 20px 0" }} /></div>
    {/* rating panel */}
    <Slab x={520} y={340} w={520} h={560} at={30} accent={C.amber} fromX={200} tilt={-12}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}><Esrb h={150} /><div><div style={{ fontSize: 30, fontWeight: 900 }}>AGE RATING</div><div style={{ fontSize: 24, color: C.soft }}>ESRB M · 17+</div><div style={{ fontSize: 24, color: C.soft }}>PEGI 18</div></div></div>
      <div style={{ fontSize: 21, color: C.mint, fontWeight: 800, marginTop: 16, letterSpacing: 1 }}>CONTENT DESCRIPTORS</div>
      <div style={{ fontSize: 24, lineHeight: 1.32, marginTop: 4 }}>Intense Violence · Nudity · Strong Sexual Content · Strong Language · Drugs and Alcohol · Mature Humor · Blood and Gore</div></Slab>
    <div style={{ position: "absolute", left: 520, top: 936, transform: `scale(${pu})`, transformOrigin: "left center", opacity: clamp(pu * 2), zIndex: 70, background: C.amber, color: C.ink, fontFamily: sans, fontWeight: 900, fontSize: 36, padding: "12px 24px", borderRadius: 12, boxShadow: `0 0 ${12 + glow * 22}px ${C.amber}aa` }}>IN-GAME PURCHASES (OPTIONAL)</div></Push>
    <Caps id="why" /><RobotLayer id="why" segs={whySeg} start={-60} gests={whyG} rim={false} shadow glow={false} />
  </AbsoluteFill>);
};

/* ---------------- 6 THREE THINGS ---------------- */
const sS = S("steps").start;
const stepG: Gest2[] = [{ type: "present", from: sS + 8, to: sS + 150, hand: "R" }, { type: "point", from: sS + 154, to: sS + 250, hand: "R", angle: 15 }, { type: "explain", from: sS + 254, to: sS + 340 }, { type: "point", from: sS + 344, to: sS + 434, hand: "R" }];
const Steps: React.FC = () => {
  const f = useCurrentFrame();
  const steps: [string, string, string, number][] = [["1", "CHECK THE AGE RATING", "ESRB M 17+ · PEGI 18 · check your country", cue("steps", "check") - 6], ["2", "REVIEW THE CONTENT", "Read the official content warnings", cue("steps", "review") - 6], ["3", "SET PARENTAL CONTROLS", "Manage access and purchases", cue("steps", "parental") - 6]];
  const fam = cue("steps", "playstation") - 6;
  return (<AbsoluteFill style={{ background: C.ink }}>
    <Push len={434}><BG />
    {steps.map(([n, t, sub, at], i) => (<Slab key={n} x={60} y={330 + i * 250} w={960} h={226} at={Math.max(6, at)} accent={i === 2 ? C.mint : C.amber} fromX={260} tilt={-20}>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ width: 120, height: 120, borderRadius: 60, background: i === 2 ? C.mint : C.amber, color: C.ink, fontWeight: 900, fontSize: 84, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 ${14 + 10 * Math.sin(f / 10)}px ${i === 2 ? C.mint : C.amber}88` }}>{n}</div>
        <div><div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.02 }}>{t}</div><div style={{ fontSize: 30, color: C.soft, marginTop: 8 }}>{sub}</div></div></div></Slab>))}
    <Slab x={430} y={1100} w={610} h={440} at={fam} accent={C.mint} fromX={200} tilt={-16} z={65}>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.mint, letterSpacing: 2 }}>PLAYSTATION FAMILY APP</div>
      {["Age limits", "Play time", "Spending limits"].map((t, i) => <div key={t} style={{ fontSize: 50, fontWeight: 900, marginTop: 8, opacity: clamp((f - fam - 8 - i * 10) / 8) }}>{"✓ "}{t}</div>)}
      <div style={{ fontSize: 21, color: C.soft, marginTop: 12 }}>Default monthly spending limit for a child: 0 · Source: playstation.com support</div></Slab></Push>
    <Caps id="steps" /><RobotLayer id="steps" start={20} gests={stepG} />
  </AbsoluteFill>);
};

/* ---------------- 7 CLOSING ---------------- */
const cS = S("close").start;
const closeSeg: Seg[] = [{ walk: { from: cS + 6, to: cS + 76, ramp: 12, stepsPerSec: 1.9 } }];
const closeG: Gest2[] = [{ type: "both", from: cS + 80, to: cS + 180 }, { type: "invite", from: cS + 184, to: cS + 279 }];
const Close: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const bl = Math.min(75, Math.max(1, f - 8 + 1)); const fo = spring({ frame: f - cue("close", "another") + 6, fps, config: POP });
  return (<AbsoluteFill style={{ background: "#000" }}>
    <Clip name="skyline" dur={279} rate={0.47} z0={1.0} z1={1.16} p0={50} p1={50} />
    <Vignette a={0.65} /><AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,8,18,.55) 0%, rgba(5,8,18,.15) 45%, rgba(5,8,18,.7) 100%)", zIndex: 31 }} />
    <div style={{ position: "absolute", left: 0, top: 320, width: 1080, height: 760, zIndex: 70, opacity: clamp((f - 6) / 6) }}><Img src={staticFile(`ep23/bl/f_${String(bl).padStart(4, "0")}.png`)} style={{ width: 1080, height: 760 }} /></div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1062, textAlign: "center", zIndex: 70, opacity: clamp(fo * 2), transform: `scale(${0.8 + 0.2 * fo})`, fontFamily: sans }}>
      <span style={{ background: C.amber, color: C.ink, fontWeight: 900, fontSize: 56, padding: "10px 32px", borderRadius: 14, boxShadow: "0 12px 30px rgba(0,0,0,.5)" }}>FOLLOW @AGENTOON.AI</span></div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1700, textAlign: "center", zIndex: 70, fontFamily: sans, fontWeight: 700, fontSize: 26, color: C.soft, opacity: clamp(fo * 2) }}>Real AI Tools • Skills • Automation</div>
    <Caps id="close" /><Tag text="GTA VI © Rockstar Games · footage: official media kit" x={300} y={1770} at={14} bg="rgba(7,11,24,.8)" fg={C.soft} size={20} z={95} />
    <RobotLayer id="close" segs={closeSeg} start={140} gests={closeG} />
  </AbsoluteFill>);
};

export const Gta6Parents: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Audio src={staticFile("audio/gta-mix.wav")} />
    {([["hook", Hook], ["visual", Visual], ["warning", Warning], ["themes", Themes], ["why", Why], ["steps", Steps], ["close", Close]] as const).map(([id, Cmp]) => (
      <Sequence key={id} from={S(id).start} durationInFrames={S(id).len}><Cmp /></Sequence>))}
  </AbsoluteFill>
);

/** Robot full-body test: the studio scene alone (walk-in, point at controller, explain, present rating panel), same lip-sync. */
export const ROBOT_TEST_FRAMES = S("why").len;
export const Gta6RobotTest: React.FC = () => (<AbsoluteFill><Audio src={staticFile("audio/gta-mix.wav")} startFrom={S("why").start} /><Why /></AbsoluteFill>);
