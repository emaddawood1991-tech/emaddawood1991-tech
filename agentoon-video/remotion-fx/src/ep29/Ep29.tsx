import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Robot2, pose2, Gest2 } from "../fx/RobotRig2";
import { clamp } from "../fx/math";
import TL from "../../public/data/ep29-timeline.json";
import CODE from "../../public/data/ep29-code.json";
import CC from "../../public/data/ep29-cc.json";

/** Episode 29: "My boss knows I used Claude Code". PREVIEW.
 *  Engines: Blender 5.3 (office plates + 3D Claude Code mascot sprites, Cycles), Remotion (timeline, 2D robot rig, captions, all graphics).
 *  HONESTY: dashboard / calendar / analytics / research graphics are ILLUSTRATIVE demo graphics (labelled on screen), not real accounts or results. Connector naming is generic (the reference's connector could not be verified).
 *  The Claude mascot is an Agentoon.ai animated interpretation of the Claude Code mascot, not an official Anthropic production. */
export const EP29_FRAMES = TL.frames as number;
type Ln = { id: string; who: "A" | "C"; scene: string; sf: number; ef: number };
const LINES = TL.lines as Ln[]; const WORDS = TL.words as { w: string; who: "A" | "C"; line: string; s: number; e: number }[];
const LN = (id: string) => LINES.find((l) => l.id === id)!;
const cue = (id: string, word: string, nth = 0) => { const ws = WORDS.filter((w) => w.line === id); const m = ws.filter((w) => w.w.toLowerCase().replace(/[^a-z0-9@-]/g, "").includes(word.toLowerCase())); return (m[nth] ?? m[0] ?? { s: LN(id).sf }).s; };
const SCENES = ["hook", "suspicious", "style", "bug", "idea", "manager", "joke", "closing"] as const; type Sc = (typeof SCENES)[number];
const S0 = (s: Sc) => (s === "hook" ? 0 : LINES.find((l) => l.scene === s)!.sf - 5);
const S1 = (s: Sc) => { const i = SCENES.indexOf(s); return i === SCENES.length - 1 ? EP29_FRAMES : S0(SCENES[i + 1]); };
const sceneAt = (f: number): Sc => { let r: Sc = "hook"; for (const s of SCENES) if (f >= S0(s)) r = s; return r; };
const K = { bg: "#05080E", panel: "rgba(13,20,33,.92)", line: "rgba(255,255,255,.16)", green: "#3DDC97", cyan: "#38D6F5", orange: "#D97757", amber: "#FFB454", white: "#F4F7FB", dim: "#9AA7BD", red: "#FF5D6C" };
const sans = '"Inter","DejaVu Sans",Arial,sans-serif'; const mono = '"DejaVu Sans Mono",ui-monospace,Menlo,monospace';
const POP = { damping: 13, stiffness: 150, mass: 0.8 }; const SOFT = { damping: 22, stiffness: 100, mass: 1 };
const E = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
const pr = (f: number, a: number, b: number) => E((f - a) / (b - a));
const useSp = (a: number, cfg = POP) => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return spring({ frame: f - a, fps, config: cfg }); };
const lipAt = (lip: { fps: number; a: number[] }, f: number) => { const t = (f / 30) * lip.fps; const i = Math.floor(t); const a = lip.a[i] ?? 0, b = lip.a[i + 1] ?? a; return a + (b - a) * (t - i); };
const LA = TL.lipA as { fps: number; a: number[] }, LC = TL.lipC as { fps: number; a: number[] };

/* ============ plates, placements, camera (EVENING variants of the established office) ============ */
type PK = "A" | "B" | "C";
const PL: Record<PK, { img: string; fg: string; robot: { cx: number; top: number; w: number }; claude: { x: number; feet: number; size: number } }> = {
  A: { img: "ep29/plates/E_A_wide.png", fg: "ep29/plates/E_A_wide_fg.png", robot: { cx: 540, top: 994, w: 270 }, claude: { x: 745, feet: 1272, size: 147 } },
  B: { img: "ep29/plates/E_B_medium.png", fg: "ep29/plates/E_B_medium_fg.png", robot: { cx: 480, top: 916, w: 486 }, claude: { x: 756, feet: 1404, size: 265 } },
  C: { img: "ep29/plates/E_C_door.png", fg: "ep29/plates/E_C_door_fg.png", robot: { cx: 480, top: 916, w: 486 }, claude: { x: 735, feet: 1062, size: 118 } },
};
const PLATE: Record<Sc, PK> = { hook: "B", suspicious: "B", style: "B", bug: "A", idea: "B", manager: "B", joke: "A", closing: "C" };
type Cam = { f: number; s: number; ox: number; oy: number };
const camKeys = (sc: Sc): Cam[] => {
  const a = S0(sc), b = S1(sc);
  switch (sc) {
    case "hook": return [{ f: a, s: 1.3, ox: 700, oy: 1350 }, { f: LN("l01").sf - 6, s: 1.1, ox: 520, oy: 1200 }, { f: LN("l01").sf + 10, s: 2.1, ox: 480, oy: 1130 }, { f: LN("l02").sf, s: 2.1, ox: 520, oy: 1170 }, { f: LN("l02").sf + 20, s: 1.9, ox: 756, oy: 1300 }, { f: b, s: 1.9, ox: 756, oy: 1300 }];
    case "suspicious": return [{ f: a, s: 1.1, ox: 480, oy: 1200 }, { f: LN("l04").sf, s: 1.8, ox: 756, oy: 1300 }, { f: b, s: 1.5, ox: 700, oy: 1300 }];
    case "style": return [{ f: a, s: 1.3, ox: 480, oy: 1150 }, { f: LN("l06").sf, s: 1.9, ox: 756, oy: 1300 }, { f: LN("l08").sf, s: 1.7, ox: 600, oy: 1200 }, { f: LN("l08").ef, s: 1.7, ox: 600, oy: 1200 }, { f: LN("l08").ef + 14, s: 4.6, ox: 756, oy: 1324 }, { f: b - 6, s: 4.6, ox: 756, oy: 1324 }, { f: b, s: 1.3, ox: 700, oy: 1250 }];
    case "bug": return [{ f: a, s: 1.3, ox: 700, oy: 1230 }, { f: b, s: 1.1, ox: 620, oy: 1230 }];
    case "idea": return [{ f: a, s: 1.15, ox: 480, oy: 1200 }, { f: LN("l13").sf, s: 1.7, ox: 756, oy: 1300 }, { f: b, s: 1.4, ox: 700, oy: 1300 }];
    case "manager": return [{ f: a, s: 1.3, ox: 480, oy: 1150 }, { f: LN("l15").sf, s: 1.7, ox: 756, oy: 1300 }, { f: b, s: 1.3, ox: 700, oy: 1300 }];
    case "joke": return [{ f: a, s: 1.4, ox: 700, oy: 1230 }, { f: LN("l17").sf, s: 1.15, ox: 600, oy: 1200 }, { f: b, s: 1.0, ox: 540, oy: 1200 }];
    default: return [{ f: a, s: 1.0, ox: 540, oy: 1100 }, { f: b, s: 1.06, ox: 540, oy: 1100 }];
  }
};
const camAt0 = (keys: Cam[], f: number) => { let c = keys[0]; for (let i = 0; i < keys.length - 1; i++) { const A = keys[i], B = keys[i + 1]; if (f >= A.f && f <= B.f) { const t = B.f === A.f ? 1 : E((f - A.f) / (B.f - A.f)); c = { f, s: A.s + (B.s - A.s) * t, ox: A.ox + (B.ox - A.ox) * t, oy: A.oy + (B.oy - A.oy) * t }; } else if (f > B.f) c = B; } return c; };
const camAt = (sc: Sc, f: number) => { const c0 = camAt0(camKeys(sc), f); return c0.s < 1.6 ? { ...c0, s: c0.s * 1.12, oy: c0.oy * 0.75 } : c0; };

/* ============ robot (2D rig): seated acting + standing full-body finale ============ */
const A_LINES = LINES.filter((l) => l.who === "A");
const win = (id: string, a = 0, b = 0) => [LN(id).sf + a, LN(id).ef + b] as [number, number];
const RGEST: Gest2[] = (() => {
  const g: Gest2[] = []; let alt = 0;
  A_LINES.forEach((l) => { let t = l.sf + 3; while (t < l.ef - 6) { const len = Math.min(l.ef - t, 36 + (alt % 3) * 10); const type = alt % 3 === 0 ? "explain" : alt % 3 === 1 ? "both" : "present"; g.push({ type, from: t, to: t + len, hand: alt % 2 ? "R" : "L" }); t += len + 3; alt++; } });
  g.push({ type: "point", from: LN("l12").sf + 6, to: LN("l12").ef, hand: "R", angle: -55 });
  return g;
})();
const rp = (f: number, pk: PK, standing = false) => { const speaking: [number, number][] = A_LINES.map((l) => [l.sf, l.ef + 4]); const p = pose2(f, { lip: LA, speaking, gestures: standing ? [{ type: "present", from: LN("l18").sf, to: LN("l18").ef, hand: "R" }, { type: "explain", from: LN("l19").sf, to: LN("l19").ef }] : RGEST, walks: [], seed: 13 }); void pk;
  const inW = (a: number, b: number) => f >= a && f <= b; const wob = Math.sin(f / 3);
  if (!standing) {
    if (f < LN("l01").sf - 8) { const t = f / 30; p.armL = 28 + 7 * Math.sin(t * 14); p.armR = -(28 + 7 * Math.sin(t * 14 + 2)); p.lookX = 0; p.lookY = 3; p.mouth = "flat"; }               // typing
    if (inW(LN("l01").sf - 8, LN("l01").sf + 6)) { p.mouth = "open"; p.blink = 1.2; }                                                                  // shock
    if (inW(LN("l10").sf, LN("l10").ef)) { p.armL = 125 + 6 * wob; p.armR = -(125 + 6 * wob); p.extL = p.extR = 1.1; }                                   // "Wait. It already did that!"
    if (inW(LN("l14").sf - 75, LN("l14").sf + 12)) { p.armL = 150; p.armR = -150; p.extL = p.extR = 0.8; p.mouth = "worry"; p.head = 6 * wob * 0.3; }       // holding head
    if (inW(LN("l17").sf - 2, LN("l17").ef + 4)) { p.armL = 120 + 10 * wob; p.armR = -(120 + 10 * wob); p.extL = p.extR = 1.15; p.mouth = "open"; }        // "Don't touch it!"
    if (inW(LN("l17").ef + 6, LN("l17").ef + 70)) { p.happy = true; p.mouth = "big" as any; p.head = 7 * Math.sin(f / 2.5); p.armL = 35; p.armR = -35; }  // laughing
  }
  return p; };
const RobotSeated: React.FC<{ pk: PK }> = ({ pk }) => {
  const f = useCurrentFrame(); const P = PL[pk].robot; const p = rp(f, pk); const rK = P.w / 200;
  const leanF = (f >= LN("l05").sf && f <= LN("l05").ef + 20) || (f >= LN("l12").sf - 4 && f <= LN("l12").ef) ? 1 : 0; const lean = (leanF ? 4 : 0) + (f > LN("l17").ef + 8 ? -6 : 0) + Math.sin(f / 40) * 0.6;
  return (<div style={{ position: "absolute", left: P.cx - P.w / 2 + (leanF ? 16 : 0), top: P.top, transform: `rotate(${lean}deg)`, transformOrigin: "50% 90%", transition: "none" }}><Robot2 pose={{ ...p, legL: 0, legR: 0 }} width={P.w} shadow={false} />
    <div style={{ position: "absolute", left: 60 * rK, top: 220 * rK, width: 80 * rK, height: 10 * rK, borderRadius: "50%", background: "rgba(0,0,0,.25)", filter: "blur(4px)" }} /></div>);
};
const RobotStanding: React.FC = () => { const f = useCurrentFrame(); const p = rp(f, "C", true); const rw = 344; const x = 400, y = 1560;
  return (<div style={{ position: "absolute", inset: 0, zIndex: 25 }}><div style={{ position: "absolute", left: x - rw * 0.6, top: y - 14 * rw / 200, width: rw * 1.2, height: 26 * rw / 200, borderRadius: "50%", background: "rgba(0,0,0,.4)", filter: "blur(6px)" }} />
    <div style={{ position: "absolute", left: x - rw / 2, top: y - rw * 1.4 * (272 / 280) }}><Robot2 pose={p} width={rw} shadow={false} rim /></div></div>); };

/* ============ Claude (Blender sprites) ============ */
const CLIP_N: Record<string, number> = { IDLE_none: 60, LISTEN_none: 60, TALK_none: 30, TALK_headphones: 30, "TALK_headphones+laptop": 30, "IDLE_headphones+laptop": 60, "CODE_headphones+laptop": 60, BOUNCE_none: 24, WAVE_none: 48, POINT_none: 36, LOOK_none: 60, LAUGH_none: 36, CONFUSED_none: 60, THINK_none: 60 };
const tHead = () => LN("l09").sf - 66;      // headphones go on
const codeOn = (f: number) => f >= tHead() && f < LN("l11").ef + 40;
const claudeFrame = (f: number): { tag: string; idx: number; acc: boolean } => {
  const cl = LINES.find((l) => l.who === "C" && f >= l.sf - 3 && f <= l.ef + 6); const speaking = !!cl && f >= cl.sf - 2 && f <= cl.ef + 2; const env = lipAt(LC, f); const talk = speaking && env > 0.1;
  const loop = (tag: string, k: number, acc = false) => ({ tag, idx: ((k % CLIP_N[tag]) + CLIP_N[tag]) % CLIP_N[tag], acc }); const once = (tag: string, k: number) => ({ tag, idx: Math.max(0, Math.min(CLIP_N[tag] - 1, k)), acc: false });
  if (codeOn(f)) { const t = "headphones+laptop"; if (talk) return loop(`TALK_${t}`, f, true); const typing = f < LN("l09").sf - 4 || (f > LN("l09").ef + 8 && f < LN("l11").sf - 4); return typing ? loop(`CODE_${t}`, f, true) : loop(`IDLE_${t}`, f, true); }
  if (f >= LN("l02").sf - 2 && f < LN("l02").ef + 20) return talk ? loop("CONFUSED_none", f - LN("l02").sf) : loop("CONFUSED_none", f - LN("l02").sf);
  if (f >= LN("l06").sf - 2 && f < LN("l06").ef + 6) return loop("THINK_none", f - LN("l06").sf);
  if (f >= LN("l13").ef + 20 && f < LN("l13").ef + 56) return once("POINT_none", f - (LN("l13").ef + 20));
  if (f >= LN("l17").ef + 4 && f < LN("l17").ef + 28) return once("BOUNCE_none", f - (LN("l17").ef + 4));
  if (f >= LN("l17").ef + 28 && f < LN("l18").sf) return loop("LAUGH_none", f - LN("l17").ef);
  if (f >= LN("l18").sf + 40) return once("WAVE_none", f - (LN("l18").sf + 40));
  if (f >= LN("l15").ef + 10 && f < LN("l16").sf - 4) return loop("LOOK_none", f);
  if (talk) return loop("TALK_none", f); if (f < LN("l02").sf) return loop("LOOK_none", f);
  const rob = A_LINES.some((l) => f >= l.sf - 2 && f <= l.ef); return rob ? loop("LISTEN_none", f) : loop("IDLE_none", f);
};
const ClaudeLayer: React.FC<{ pk: PK }> = ({ pk }) => {
  const f = useCurrentFrame(); const P = PL[pk].claude; const c = claudeFrame(f);
  const chg = Math.min(Math.abs(f - tHead()), Math.abs(f - (LN("l11").ef + 40))); const pop = 1 + 0.12 * Math.sin(clamp(1 - chg / 12) * Math.PI); const bob = Math.sin(f / 18) * 0.012;
  return (<div style={{ position: "absolute", left: P.x - P.size / 2, top: P.feet - 0.81 * P.size, width: P.size, height: P.size, transform: `scale(${pop + bob})`, transformOrigin: "50% 81%", zIndex: 30 }}>
    <div style={{ position: "absolute", left: "12%", right: "12%", top: "76%", height: "9%", borderRadius: "50%", background: "rgba(0,0,0,.4)", filter: "blur(6px)", zIndex: -1 }} />
    <Img src={staticFile(`ep27/claude/${c.tag}/${String(c.idx).padStart(3, "0")}.png`)} style={{ width: P.size, height: P.size, display: "block" }} /></div>);
};

/* ============ screen-space UI helpers ============ */
const Panel: React.FC<{ x: number; y: number; w: number; h: number; a?: number; acc?: string; children?: React.ReactNode; pad?: number; z?: number }> = ({ x, y, w, h, a = 0, acc = K.line, children, pad = 14, z = 60 }) => { const f = useCurrentFrame(); const s = useSp(a, SOFT); return (<div style={{ position: "absolute", left: x, top: y + Math.sin((f + x) / 40) * 3, width: w, height: h, opacity: clamp(s * 1.6), transform: `perspective(1200px) translateZ(${(1 - s) * -200}px) rotateX(${(1 - s) * 14}deg) translateY(${(1 - s) * 30}px)`, borderRadius: 20, background: K.panel, border: `2px solid ${acc}`, boxShadow: "0 18px 40px rgba(0,0,0,.5)", padding: pad, fontFamily: sans, color: K.white, overflow: "hidden", zIndex: z }}>{children}</div>); };
const Label: React.FC<{ text: string; y?: number; a?: number }> = ({ text, y: _y, a = 20 }) => { const s = useSp(a); return <div style={{ position: "absolute", left: 40, right: 40, top: 399, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 20, color: K.amber, letterSpacing: 1.5, opacity: clamp(s * 2), zIndex: 70, textShadow: "0 2px 6px #000" }}>{text}</div>; };
const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; a: number; c?: string; dots?: boolean }> = ({ x1, y1, x2, y2, a, c = K.cyan, dots = true }) => { const f = useCurrentFrame(); const p = pr(f, a, a + 14); return (<svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, zIndex: 58, pointerEvents: "none" }}><line x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={c} strokeWidth={4} strokeLinecap="round" />{dots && f > a + 14 && [0, 1, 2].map((i) => { const t = (((f - a) * 0.014 + i / 3) % 1 + 1) % 1; return <circle key={i} cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r={6} fill={c} opacity={Math.sin(Math.PI * t)} style={{ filter: `drop-shadow(0 0 6px ${c})` }} />; })}</svg>); };
const Node: React.FC<{ x: number; y: number; w: number; h?: number; a: number; label: string; sub?: string; c: string; glyph?: string }> = ({ x, y, w, h = 110, a, label, sub, c, glyph }) => { const s = useSp(a); const f = useCurrentFrame(); const hot = f > a && f < a + 26; return (<div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 20, background: K.panel, border: `${hot ? 4 : 2.5}px solid ${c}`, boxShadow: hot ? `0 0 34px ${c}99` : `0 0 14px ${c}22`, opacity: clamp(s * 1.6), transform: `scale(${0.8 + 0.2 * s})`, fontFamily: sans, color: K.white, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", zIndex: 62 }}>{glyph ? <div style={{ fontSize: 32 }}>{glyph}</div> : null}<div style={{ fontWeight: 900, fontSize: w > 260 ? 32 : 26, letterSpacing: 1 }}>{label}</div>{sub ? <div style={{ fontWeight: 600, fontSize: 18, color: K.dim, marginTop: 2 }}>{sub}</div> : null}</div>); };
const Kin: React.FC<{ text: string; a: number; y: number; size?: number; c?: string; out?: number }> = ({ text, a, y, size = 96, c = K.white, out }) => { const f = useCurrentFrame(); const o = out ? 1 - pr(f, out, out + 8) : 1; return (<div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: size, color: c, letterSpacing: 2, zIndex: 66, opacity: o, textShadow: `0 0 40px ${K.orange}88, 0 5px 0 rgba(0,0,0,.5)` }}>{text.split("").map((ch, i) => { const s = spring({ frame: f - a - i * 1.4, fps: 30, config: { damping: 10, stiffness: 190, mass: 0.6 } }); return <span key={i} style={{ display: "inline-block", whiteSpace: "pre", transform: `perspective(700px) rotateX(${(1 - s) * -70}deg) translateY(${(1 - s) * 40}px)`, opacity: clamp(s * 2) }}>{ch}</span>; })}</div>); };

/* ============ per-scene overlays (local frame = scene frame) ============ */
const Chat: React.FC<{ x: number; y: number; w: number; a: number; lines: string[]; z?: number; rot?: number }> = ({ x, y, w, a, lines, z = 64, rot = 0 }) => { const f = useCurrentFrame(); const s = useSp(a, SOFT); return (<div style={{ position: "absolute", left: x, top: y, width: w, opacity: clamp(s * 1.6), transform: `perspective(1100px) rotateY(${(1 - s) * 40 + rot}deg) translateZ(${(1 - s) * -160}px)`, borderRadius: 22, background: "#101a2b", border: `3px solid ${K.red}`, boxShadow: "0 22px 44px rgba(0,0,0,.55)", fontFamily: sans, color: K.white, zIndex: z, padding: 16 }}>
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: K.amber }} /><div style={{ fontWeight: 900, fontSize: 24 }}>Manager</div><div style={{ marginLeft: "auto", fontSize: 14, fontWeight: 800, color: K.amber, letterSpacing: 1 }}>FICTIONAL TEAM CHAT</div></div>
  {lines.map((l, i) => { const p = pr(f, a + 10 + i * 20, a + 22 + i * 20); return <div key={i} style={{ marginTop: 10, padding: "10px 16px", borderRadius: 16, background: "#1c2b45", fontSize: 30, fontWeight: 800, opacity: p, transform: `translateX(${(1 - p) * -30}px)` }}>{l}</div>; })}</div>); };
const Ind: React.FC<{ t: string; x: number; y: number; a: number }> = ({ t, x, y, a }) => { const f = useCurrentFrame(); const s = useSp(a); return <div style={{ position: "absolute", left: x, top: y + Math.sin((f + x) / 14) * 6, padding: "8px 18px", borderRadius: 30, background: K.green + "22", border: `2.5px solid ${K.green}`, fontFamily: sans, fontWeight: 900, fontSize: 24, color: K.green, opacity: clamp(s * 2), transform: `scale(${0.6 + 0.4 * s})`, zIndex: 66 }}>{t} ✓</div>; };
const Ov: Record<Sc, React.FC<{ a: number }>> = {
  hook: ({ a }) => { void a; const f = useCurrentFrame(); const t2 = LN("l02").sf - S0("hook"); const o = 1 - pr(f, LN("l01").sf - S0("hook") + 14, LN("l01").sf - S0("hook") + 24);
    return (<>
      <div style={{ opacity: o }}><Kin text="MY BOSS KNOWS" a={2} y={450} size={88} c={K.white} /><Kin text="I USED AI!" a={9} y={550} size={110} c={K.red} />
        <Chat x={110} y={720} w={860} a={0} lines={["DID YOU WRITE THIS?"]} rot={-4} /></div>
      <Kin text="MY BOSS KNOWS?!" a={t2 + 6} y={470} size={78} c={K.amber} out={S1("hook") - 4} /></>); },
  suspicious: ({ a }) => { void a; const t3 = 0; return (<>
    <Chat x={40} y={470} w={1000} a={t3 + 4} lines={["Clean code.", "Readable functions.", "Everything works.", "Did you write this?"]} />
    <Ind t="CLEAN CODE" x={60} y={900} a={LN("l04").sf - S0("suspicious") + 4} /><Ind t="READABLE" x={400} y={940} a={LN("l04").sf - S0("suspicious") + 18} /><Ind t="NO KNOWN BUGS" x={700} y={900} a={LN("l04").sf - S0("suspicious") + 32} />
    <Label text="FICTIONAL SCENARIO · the manager and the chat are not real" a={30} /></>); },
  style: ({ a }) => { void a; const f = useCurrentFrame(); const t7 = LN("l07").sf - S0("style"); const t8 = LN("l08").ef - S0("style"); return (<>
    <Kin text="MY USUAL CODE?" a={LN("l05").sf - S0("style") + 6} y={440} size={74} c={K.white} out={LN("l07").ef - S0("style")} />
    <Panel x={60} y={600} w={960} h={240} a={t7} acc={K.amber} pad={16}><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 24, color: K.dim, letterSpacing: 2 }}>"my personal coding style"</div><div style={{ fontFamily: mono, fontSize: 26, color: "#ff8d8d", marginTop: 8, whiteSpace: "pre" }}>{"var x=1;var y=2;   // magic numbers\nfunction f(a,b){return a+b}  // no names"}</div><div style={{ fontFamily: sans, fontSize: 20, color: K.dim, marginTop: 6 }}>ILLUSTRATIVE joke code, not from any real project</div></Panel>
    {f > t8 ? null : null}</>); },
  bug: ({ a }) => { void a; const f = useCurrentFrame(); const T0 = LN("l09").sf - S0("bug") - 70; const T1 = LN("l09").ef - S0("bug") + 6; const T2 = LN("l11").sf - S0("bug"); const cc = CC as [string, string][]; const code = CODE as any;
    const type = (s: string, st: number, cps = 3) => s.slice(0, Math.max(0, Math.floor((f - st) * cps)));
    return (<><Kin text="CLAUDE CODE" a={Math.max(2, T0 + 20)} y={430} size={46} c={K.orange} />
      <Panel x={30} y={500} w={1020} h={450} a={Math.max(0, T0 + 10)} acc={K.orange} pad={0} z={62}>
        {f < T1 ? (<div style={{ padding: 16, fontFamily: mono, fontSize: 21, color: "#E8EAF0", lineHeight: 1.45 }}><div style={{ color: K.orange, fontWeight: 800, fontFamily: sans, letterSpacing: 2 }}>REAL CLAUDE CODE RUN · claude -p · isolated demo</div>
          {cc.slice(0, 3).map(([k, t], i) => { const st = T0 + 24 + i * 40; if (f < st) return null; return <div key={i} style={{ color: k === "bash" ? K.green : "#E8EAF0", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{k === "bash" ? "$ " : k === "read" ? "◆ Read " : "● "}{type(t, st, 3)}</div>; })}</div>)
          : (<div style={{ padding: 14, fontFamily: mono, fontSize: 24, lineHeight: 1.5 }}><div style={{ color: K.cyan, fontFamily: sans, fontWeight: 800, letterSpacing: 2, fontSize: 20 }}>REAL FILE · episodes/…/demo/{code.file} · LoginButtonBuggy → LoginButton</div>
            {(code.diff as string[]).map((l, i) => { const c = l.startsWith("- ") ? "#ff7b7b" : l.startsWith("+ ") ? "#7ee787" : "#c9d1d9"; const bg = l.startsWith("- ") ? "rgba(255,93,108,.16)" : l.startsWith("+ ") ? "rgba(61,220,151,.16)" : "transparent"; return <div key={i} style={{ whiteSpace: "pre", color: c, background: bg, opacity: pr(f, T1 + i * 4, T1 + 10 + i * 4), fontSize: 22 }}>{l}</div>; })}</div>)}</Panel>
      {f >= T2 ? (<><div style={{ position: "absolute", left: 40, top: 980, padding: "8px 22px", borderRadius: 12, background: K.red + "33", border: `3px solid ${K.red}`, fontFamily: sans, fontWeight: 900, fontSize: 30, color: K.red, zIndex: 70, opacity: pr(f, T2, T2 + 10) }}>BEFORE · TWO CLICKS</div><div style={{ position: "absolute", left: 560, top: 980, padding: "8px 22px", borderRadius: 12, background: K.green + "33", border: `3px solid ${K.green}`, fontFamily: sans, fontWeight: 900, fontSize: 30, color: K.green, zIndex: 70, opacity: pr(f, T2 + 24, T2 + 34) }}>AFTER · ONE CLICK</div></>) : null}
      <Label text="LOCAL TEACHING DEMO · simulated login · intentionally buggy example is isolated" a={T0 + 30} /></>); },
  idea: ({ a }) => { void a; const f = useCurrentFrame(); const T = LN("l13").ef - S0("idea") + 10; const tt = (CODE as any);
    return (<><Kin text="BRING BACK THE BUG?" a={LN("l12").sf - S0("idea") + 4} y={430} size={60} c={K.white} out={T + 4} />
      <Panel x={40} y={520} w={470} h={430} a={T} acc={K.cyan} pad={0} z={62}><div style={{ position: "relative", width: "100%", height: "100%" }}><OffthreadVideo src={staticFile("ep29/demo.mp4")} startFrom={Math.max(0, Math.round((f - T) * 1))} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} /><div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.78)", fontFamily: sans, fontWeight: 900, fontSize: 15, color: K.green, textAlign: "center", padding: "3px 0" }}>REAL BROWSER RECORDING · real mouse clicks</div></div></Panel>
      <Panel x={530} y={520} w={510} h={205} a={T + 10} acc={K.green} pad={14} z={62}><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 24, color: K.green, letterSpacing: 2 }}>WORKING LOGIN</div><div style={{ fontFamily: sans, fontWeight: 800, fontSize: 36, marginTop: 6 }}>Click → Success</div><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 60, color: K.green }}>1 CLICK</div></Panel>
      <Panel x={530} y={745} w={510} h={205} a={T + 36} acc={K.red} pad={14} z={62}><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 24, color: K.red, letterSpacing: 2 }}>BUGGY LOGIN</div><div style={{ fontFamily: sans, fontWeight: 800, fontSize: 30, marginTop: 6 }}>Click → Nothing · Click again → Success</div><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 60, color: K.red }}>2 CLICKS</div></Panel>
      <Label text="Real tests: 3 of 3 passed (vitest) · simulated login only" a={T + 20} /></>); },
  manager: ({ a }) => { void a; const f = useCurrentFrame(); const t14 = LN("l14").sf - S0("manager"); const t15e = LN("l15").ef - S0("manager"); const code = CODE as any;
    return (<><div style={{ opacity: 1 - pr(f, t15e - 20, t15e - 8) }}><Chat x={40} y={470} w={1000} a={4} lines={["Great improvement. Can you explain how the login works during our next code review?"]} /></div>
      {f > t15e - 14 ? null : null}
      <Panel x={40} y={780} w={1000} h={200} a={LN("l15").sf - S0("manager") - 4} acc={K.cyan} pad={14} z={64}><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 22, color: K.cyan, letterSpacing: 2 }}>CODE EXPLANATION · LoginButton (real code)</div><div style={{ fontFamily: mono, fontSize: 20, color: "#c9d1d9", whiteSpace: "pre", marginTop: 6 }}>{(code.fixed as string[]).slice(0, 5).join("\n")}</div></Panel>
      {["USER CLICK", "VALIDATION", "LOGIN RESULT"].map((s, i) => <Node key={s} x={40 + i * 350} y={560} w={300} h={100} a={LN("l15").sf - S0("manager") + 20 + i * 24} label={s} c={[K.amber, K.cyan, K.green][i]} />)}
      <Arrow x1={340} y1={610} x2={390} y2={610} a={LN("l15").sf - S0("manager") + 40} c={K.amber} /><Arrow x1={690} y1={610} x2={740} y2={610} a={LN("l15").sf - S0("manager") + 64} c={K.cyan} />
      <Label text="the fictional manager message is part of the story · explanation uses the real demo code" a={LN("l15").sf - S0("manager")} /></>); },
  joke: ({ a }) => { void a; const f = useCurrentFrame(); const t17 = LN("l17").sf - S0("joke"); return (<><Kin text="DON'T TOUCH IT!" a={t17 + 2} y={470} size={100} c={K.red} out={t17 + 90} /></>); },
  closing: ({ a }) => { void a; const f = useCurrentFrame(); const t18 = LN("l18").sf - S0("closing"); const t19 = LN("l19").sf - S0("closing"); return (<>
    <Kin text="WRITE BETTER CODE." a={t18 + 10} y={450} size={78} c={K.white} /><Kin text="UNDERSTAND YOUR CODE." a={t18 + 40} y={545} size={62} c={K.amber} />
    <div style={{ position: "absolute", left: 60, right: 60, top: 680, height: 100, borderRadius: 50, background: `linear-gradient(90deg, ${K.orange}, ${K.amber})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 900, fontSize: 42, color: "#1a0d05", zIndex: 66, opacity: pr(f, t19 - 6, t19 + 10), transform: `scale(${0.9 + 0.1 * pr(f, t19 - 6, t19 + 12)})` }}>FOLLOW @AGENTOON.AI</div>
    <div style={{ position: "absolute", left: 40, right: 40, top: 798, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 24, color: K.dim, letterSpacing: 2, opacity: pr(f, t19 + 30, t19 + 44), zIndex: 66 }}>Real AI Tools • Skills • Automation</div></>); },
};

/* ============ captions ============ */
const Caps: React.FC = () => {
  const f = useCurrentFrame(); const idx = WORDS.findIndex((w) => f < w.e); const i = idx < 0 ? WORDS.length - 1 : Math.max(0, idx); const w0 = WORDS[i]; if (f < 3 || f > LN("l19").ef + 10) return null;
  const line = WORDS.filter((w) => w.line === w0.line); const lw = line.indexOf(w0); const chunk = Math.floor(lw / 5) * 5; const shown = line.slice(chunk, chunk + 5); const col = w0.who === "C" ? K.orange : K.cyan;
  return (<div style={{ position: "absolute", left: 30, right: 30, top: 205, height: 190, borderRadius: 28, background: "rgba(5,8,14,.86)", border: `1.5px solid ${K.line}`, zIndex: 95, padding: "16px 26px", boxShadow: "0 16px 40px rgba(0,0,0,.45)" }}>
    <div style={{ display: "inline-block", background: col, color: w0.who === "C" ? "#fff" : "#04202a", fontFamily: sans, fontWeight: 900, fontSize: 24, padding: "2px 16px", borderRadius: 10, letterSpacing: 2 }}>{w0.who === "C" ? "CLAUDE" : "AGENTOON"}</div>
    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: "2px 12px", fontFamily: sans, fontWeight: 900, fontSize: 52, color: "#fff", lineHeight: 1.1 }}>
      {shown.map((w, q) => { const act = chunk + q === lw; const p = act ? spring({ frame: f - w.s, fps: 30, config: { damping: 11, stiffness: 220, mass: 0.7 } }) : 1; return <span key={w.s + "_" + q} style={{ padding: "0 8px", borderRadius: 10, background: act ? col : "transparent", color: act ? (w0.who === "C" ? "#fff" : "#04202a") : "#fff", transform: `scale(${act ? 0.92 + 0.08 * p : 1})`, display: "inline-block" }}>{w.w}</span>; })}</div></div>);
};

/* ============ world ============ */
const World: React.FC = () => {
  const f = useCurrentFrame(); const sc = sceneAt(f); const pk = PLATE[sc]; const cam = camAt(sc, f); const lf = f - S0(sc);
  const IN = 10; const tin = E(lf / IN);
  return (<div style={{ position: "absolute", inset: 0, opacity: 0.6 + 0.4 * tin, transform: `scale(${cam.s})`, transformOrigin: `${cam.ox}px ${cam.oy}px`, filter: lf < IN && sc !== "hook" ? `blur(${(1 - tin) * 7}px)` : undefined }}>
    <Img src={staticFile(PL[pk].img)} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
    {pk !== "C" ? <RobotSeated pk={pk} /> : null}
    <Img src={staticFile(PL[pk].fg)} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, zIndex: 20 }} />
    {pk === "C" ? <RobotStanding /> : null}
    <ClaudeLayer pk={pk} />
  </div>);
};
export const Ep29: React.FC = () => (
  <AbsoluteFill style={{ background: K.bg }}>
    <Audio src={staticFile("audio/ep29-mix.wav")} />
    <World />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 40%, rgba(0,0,0,.5) 100%)", zIndex: 50, pointerEvents: "none" }} />
    {SCENES.map((s) => { const O = Ov[s]; return <Sequence key={s} from={S0(s)} durationInFrames={S1(s) - S0(s) + 8} layout="none"><O a={S0(s)} /></Sequence>; })}
    <div style={{ position: "absolute", left: 40, top: 92, zIndex: 96, fontFamily: sans, fontWeight: 900, fontSize: 30, color: K.white, letterSpacing: 3 }}>AGENTOON<span style={{ color: K.cyan }}>.AI</span></div>
    <div style={{ position: "absolute", right: 40, top: 98, zIndex: 96, fontFamily: sans, fontWeight: 800, fontSize: 22, color: K.amber, letterSpacing: 2 }}>EP 03</div>
    <Caps />
    <div style={{ position: "absolute", left: 30, right: 30, top: 1830, textAlign: "center", fontFamily: sans, fontWeight: 600, fontSize: 16, color: "rgba(244,247,251,.6)", zIndex: 96 }}>Agentoon.ai animated interpretation of the Claude Code mascot · not an official Anthropic production · fictional scenario · local demo project</div>
  </AbsoluteFill>
);
