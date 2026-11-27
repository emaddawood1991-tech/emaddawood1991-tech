import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Robot2, pose2, Gest2, Walk, walkDistance } from "../fx/RobotRig2";
import { clamp } from "../fx/math";
import TL from "../../public/data/ep28-timeline.json";
import CODE from "../../public/data/ep28-code.json";
import CC from "../../public/data/ep28-cc.json";
import REELS from "../../data/reels.json";

/** Episode 28: "Claude prepared 50 Instagram Reels". PREVIEW.
 *  Engines: Blender 5.3 (office plates + 3D Claude Code mascot sprites, Cycles), Remotion (timeline, 2D robot rig, captions, all graphics).
 *  HONESTY: dashboard / calendar / analytics / research graphics are ILLUSTRATIVE demo graphics (labelled on screen), not real accounts or results. Connector naming is generic (the reference's connector could not be verified).
 *  The Claude mascot is an Agentoon.ai animated interpretation of the Claude Code mascot, not an official Anthropic production. */
export const EP28_FRAMES = TL.frames as number;
type Ln = { id: string; who: "A" | "C"; scene: string; sf: number; ef: number };
const LINES = TL.lines as Ln[]; const WORDS = TL.words as { w: string; who: "A" | "C"; line: string; s: number; e: number }[];
const LN = (id: string) => LINES.find((l) => l.id === id)!;
const cue = (id: string, word: string, nth = 0) => { const ws = WORDS.filter((w) => w.line === id); const m = ws.filter((w) => w.w.toLowerCase().replace(/[^a-z0-9@-]/g, "").includes(word.toLowerCase())); return (m[nth] ?? m[0] ?? { s: LN(id).sf }).s; };
const SCENES = ["hook", "surprise", "audience", "content", "code", "batch", "approval", "closing"] as const; type Sc = (typeof SCENES)[number];
const S0 = (s: Sc) => (s === "hook" ? 0 : LINES.find((l) => l.scene === s)!.sf - 5);
const S1 = (s: Sc) => { const i = SCENES.indexOf(s); return i === SCENES.length - 1 ? EP28_FRAMES : S0(SCENES[i + 1]); };
const sceneAt = (f: number): Sc => { let r: Sc = "hook"; for (const s of SCENES) if (f >= S0(s)) r = s; return r; };
const K = { bg: "#05080E", panel: "rgba(13,20,33,.92)", line: "rgba(255,255,255,.16)", green: "#3DDC97", cyan: "#38D6F5", orange: "#D97757", amber: "#FFB454", white: "#F4F7FB", dim: "#9AA7BD", red: "#FF5D6C" };
const sans = '"Inter","DejaVu Sans",Arial,sans-serif'; const mono = '"DejaVu Sans Mono",ui-monospace,Menlo,monospace';
const POP = { damping: 13, stiffness: 150, mass: 0.8 }; const SOFT = { damping: 22, stiffness: 100, mass: 1 };
const E = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
const pr = (f: number, a: number, b: number) => E((f - a) / (b - a));
const useSp = (a: number, cfg = POP) => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return spring({ frame: f - a, fps, config: cfg }); };
const lipAt = (lip: { fps: number; a: number[] }, f: number) => { const t = (f / 30) * lip.fps; const i = Math.floor(t); const a = lip.a[i] ?? 0, b = lip.a[i + 1] ?? a; return a + (b - a) * (t - i); };
const LA = TL.lipA as { fps: number; a: number[] }, LC = TL.lipC as { fps: number; a: number[] };

/* ============ plates, placements, camera ============ */
type PK = "A" | "B";
const PL: Record<PK, { img: string; fg: string; robot: { cx: number; top: number; w: number }; claude: { x: number; feet: number; size: number } }> = {
  A: { img: "ep27/plates/A_wide.png", fg: "ep27/plates/A_wide_fg.png", robot: { cx: 540, top: 994, w: 270 }, claude: { x: 745, feet: 1272, size: 147 } },
  B: { img: "ep27/plates/B_medium.png", fg: "ep27/plates/B_medium_fg.png", robot: { cx: 480, top: 916, w: 486 }, claude: { x: 756, feet: 1404, size: 265 } },
};
const F_DOOR = 50, F_ARRIVE = Math.round(LN("l01").ef + 2), F_LAST_CLOSE = LN("l03").sf - 6;   // door opens / robot arrives / cut to seated
type Cam = { f: number; s: number; ox: number; oy: number };
const pkAt = (f: number): "A" | "B" | "C" => (f < F_DOOR - 6 ? "A" : f < LN("l02").sf - 4 ? "C" : f < LN("l03").sf - 6 ? "B" : (["audience", "content"].includes(sceneAt(f)) ? "A" : sceneAt(f) === "closing" ? "A" : "B"));
const camKeys = (sc: Sc, f: number): Cam[] => {
  const a = S0(sc), b = S1(sc), n = b - a;
  if (sc === "hook") {
    if (f < LN("l02").sf - 4) return [{ f: 0, s: 1.5, ox: 700, oy: 1200 }, { f: F_DOOR - 6, s: 1.3, ox: 700, oy: 1220 }, { f: F_DOOR - 4, s: 1.0, ox: 540, oy: 1000 }, { f: LN("l02").sf - 5, s: 1.14, ox: 600, oy: 1150 }];
    return [{ f: LN("l02").sf - 5, s: 2.0, ox: 756, oy: 1300 }, { f: b, s: 1.8, ox: 756, oy: 1300 }];
  }
  switch (sc) {
    case "surprise": return [{ f: a, s: 1.12, ox: 480, oy: 1180 }, { f: LN("l04").sf, s: 1.9, ox: 756, oy: 1300 }, { f: b, s: 1.5, ox: 700, oy: 1300 }];
    case "audience": return [{ f: a, s: 1.2, ox: 560, oy: 1200 }, { f: a + n * 0.35, s: 2.0, ox: 745, oy: 1230 }, { f: b, s: 1.7, ox: 745, oy: 1230 }];
    case "content": return [{ f: a, s: 1.15, ox: 600, oy: 1200 }, { f: LN("l08").sf, s: 1.85, ox: 745, oy: 1230 }, { f: b, s: 1.6, ox: 745, oy: 1230 }];
    case "code": return [{ f: a, s: 1.1, ox: 540, oy: 1300 }, { f: b, s: 1.3, ox: 700, oy: 1300 }];
    case "batch": return [{ f: a, s: 1.25, ox: 700, oy: 1300 }, { f: b, s: 1.1, ox: 600, oy: 1300 }];
    case "approval": return [{ f: a, s: 1.1, ox: 480, oy: 1200 }, { f: LN("l14").sf, s: 1.7, ox: 756, oy: 1300 }, { f: b, s: 1.4, ox: 700, oy: 1300 }];
    default: return [{ f: a, s: 1.3, ox: 620, oy: 1200 }, { f: b, s: 1.02, ox: 540, oy: 1200 }];
  }
};
const camAt0 = (keys: Cam[], f: number) => { let c = keys[0]; for (let i = 0; i < keys.length - 1; i++) { const A = keys[i], B = keys[i + 1]; if (f >= A.f && f <= B.f) { const t = B.f === A.f ? 1 : E((f - A.f) / (B.f - A.f)); c = { f, s: A.s + (B.s - A.s) * t, ox: A.ox + (B.ox - A.ox) * t, oy: A.oy + (B.oy - A.oy) * t }; } else if (f > B.f) c = B; } return c; };
const camAt = (sc: Sc, f: number) => { const c0 = camAt0(camKeys(sc, f), f); return c0.s < 1.6 ? { ...c0, s: c0.s * 1.15, oy: c0.oy * 0.7 } : c0; };

/* ============ robot: entrance in plate C (full body), then seated (2D rig) ============ */
const ENTER: Walk = { from: F_DOOR + 6, to: F_ARRIVE, ramp: 10, amp: 28, stepsPerSec: 2.4 };
const P0 = { x: 335, y: 1125 }, PM = { x: 235, y: 1330 }, P1 = { x: 380, y: 1560 }; const rwAt = (y: number) => 125 * (y - 900) / 225;
const RGEST: Gest2[] = (() => {
  const g: Gest2[] = []; let alt = 0;
  LINES.filter((l) => l.who === "A").forEach((l) => { let t = Math.max(l.sf + 3, F_LAST_CLOSE); while (t < l.ef - 6) { const len = Math.min(l.ef - t, 38 + (alt % 3) * 10); const type = alt % 3 === 0 ? "explain" : alt % 3 === 1 ? "both" : "present"; g.push({ type, from: t, to: t + len, hand: alt % 2 ? "R" : "L" }); t += len + 3; alt++; } });
  g.push({ type: "explain", from: LN("l01").sf + 4, to: F_ARRIVE, hand: "R" });
  g.push({ type: "point", from: LN("l09").sf + 40, to: LN("l09").ef, hand: "R", angle: -50 }, { type: "point", from: LN("l14").sf - 20, to: LN("l14").sf + 30, hand: "R", angle: -40 }, { type: "both", from: LN("l15").sf + 8, to: LN("l15").ef }, { type: "present", from: LN("l17").sf + 10, to: LN("l17").ef, hand: "L" });
  return g;
})();
const RobotEnter: React.FC = () => {
  const f = useCurrentFrame(); if (f < F_DOOR + 2 || f >= LN("l02").sf - 4) return null;
  const speaking: [number, number][] = LINES.filter((l) => l.who === "A").map((l) => [l.sf, l.ef + 4]);
  const p = pose2(f, { lip: LA, speaking, gestures: RGEST, walks: [ENTER], seed: 11 }); const t = clamp((f - ENTER.from) / (ENTER.to - ENTER.from)); const d = clamp(walkDistance(Math.min(f, ENTER.to), ENTER) / walkDistance(ENTER.to, ENTER));
  const q = d < 0.5 ? d * 2 : (d - 0.5) * 2; const A0 = d < 0.5 ? P0 : PM, A1 = d < 0.5 ? PM : P1; const x = A0.x + (A1.x - A0.x) * q, y = A0.y + (A1.y - A0.y) * q; const rw = rwAt(y); const appear = pr(f, F_DOOR + 2, F_DOOR + 12); const drop = pr(f, F_ARRIVE - 30, F_ARRIVE - 6);
  const rk = rw / 200; void t;
  return (<>
    <div style={{ position: "absolute", left: x - rw * 0.6, top: y - 14 * rk, width: rw * 1.2, height: 26 * rk, borderRadius: "50%", background: "rgba(0,0,0,.4)", filter: "blur(5px)", opacity: appear }} />
    <div style={{ position: "absolute", left: x - rw / 2, top: y - rw * 1.4 * (272 / 280), opacity: appear }}><Robot2 pose={p} width={rw} shadow={false} rim />
      <div style={{ position: "absolute", left: 40 * rk, top: 136 * rk, width: 60 * rk, height: 22 * rk, borderRadius: 6 * rk, background: "#F4F7FB", transform: "rotate(-14deg)", boxShadow: "0 2px 4px rgba(0,0,0,.4)", opacity: 1 - drop }} /></div>
    <div style={{ position: "absolute", left: x - rw * 1.1 - 40 * drop * rk, top: y - rw * (0.55 - 0.45 * drop), width: rw * 0.55, height: rw * 0.4, borderRadius: rw * 0.08, background: "linear-gradient(180deg,#FF9A3C,#C4631A)", border: "3px solid #2a1405", opacity: appear, transform: `rotate(${(1 - drop) * -20}deg)` }}><div style={{ position: "absolute", left: "20%", right: "20%", top: -rw * 0.12, height: rw * 0.14, border: "4px solid #2a1405", borderBottom: "none", borderRadius: "40% 40% 0 0" }} /></div>
  </>);
};
const RobotSeated: React.FC<{ pk: PK; lean?: number }> = ({ pk, lean = 0 }) => {
  const f = useCurrentFrame(); const P = PL[pk].robot; const speaking: [number, number][] = LINES.filter((l) => l.who === "A").map((l) => [l.sf, l.ef + 4]);
  const p = pose2(f, { lip: LA, speaking, gestures: RGEST, walks: [], seed: 11 }); const frozen = f > LN("l03").sf - 6 && f < LN("l03").sf + 14; if (frozen) { p.mouth = "open"; p.blink = 1; }
  const sit = pr(f, F_LAST_CLOSE, F_LAST_CLOSE + 10); const bob = Math.sin(f / 40) * 0.6; const rK = P.w / 200;
  return (<div style={{ position: "absolute", left: P.cx - P.w / 2, top: P.top + (1 - sit) * 30, opacity: sit, transform: `rotate(${bob + lean}deg)`, transformOrigin: "50% 90%" }}><Robot2 pose={{ ...p, legL: 0, legR: 0 }} width={P.w} shadow={false} />
    <div style={{ position: "absolute", left: 60 * rK, top: 220 * rK, width: 80 * rK, height: 10 * rK, borderRadius: "50%", background: "rgba(0,0,0,.25)", filter: "blur(4px)" }} /></div>);
};

/* ============ Claude (Blender sprites) ============ */
const CLIP_N: Record<string, number> = { IDLE_none: 60, LISTEN_none: 60, TALK_none: 30, TALK_lightbulb: 30, TALK_detective: 30, TALK_calendar: 30, TALK_documents: 30, TALK_headphones: 30, TALK_clipboard: 30, IDLE_headphones: 60, LISTEN_detective: 60, BOUNCE_none: 24, WAVE_none: 48, CELEBRATE_none: 36, POINT_none: 36, LOOK_none: 60 };
const accOn = (sc: Sc, f: number): string => { if (f < LN("l04").sf - 2) return "headphones"; if (sc === "audience") return "detective"; if (sc === "content") return "lightbulb"; if (sc === "code") return "headphones"; if (sc === "batch") return "clipboard"; return "none"; };
const claudeFrame = (f: number): { tag: string; idx: number; acc: string } => {
  const sc = sceneAt(f); const acc = accOn(sc, f); const cl = LINES.find((l) => l.who === "C" && f >= l.sf - 3 && f <= l.ef + 8); const speaking = !!cl && f >= cl.sf - 2 && f <= cl.ef + 2; const env = lipAt(LC, f);
  const loop = (tag: string, k: number) => ({ tag, idx: ((k % CLIP_N[tag]) + CLIP_N[tag]) % CLIP_N[tag], acc });
  const once = (tag: string, k: number) => ({ tag, idx: Math.max(0, Math.min(CLIP_N[tag] - 1, k)), acc });
  if (f >= LN("l04").sf - 2 && f < LN("l04").sf + 24) return once("BOUNCE_none", f - (LN("l04").sf - 2));
  if (f >= LN("l08").sf + 150 && f < LN("l08").sf + 186 && sc === "content") return once("POINT_none", f - (LN("l08").sf + 150));
  if (f >= LN("l16").sf - 2 && f < LN("l16").ef + 60) return loop("CELEBRATE_none", f - LN("l16").sf);
  if (acc === "headphones") { if (speaking && env > 0.1) return loop("TALK_headphones", f); return f < LN("l01").ef + 40 ? loop("IDLE_headphones", f) : { tag: "TALK_headphones", idx: 0, acc }; }
  if (acc !== "none") { const tag = `TALK_${acc}`; return speaking && env > 0.1 ? loop(tag, f) : { tag, idx: 0, acc }; }
  if (speaking) return env > 0.1 ? loop("TALK_none", f) : { tag: "TALK_none", idx: 0, acc };
  const rob = LINES.some((l) => l.who === "A" && f >= l.sf - 2 && f <= l.ef); return rob ? loop("LISTEN_none", f) : loop("IDLE_none", f);
};
const ClaudeLayer: React.FC<{ pk: PK }> = ({ pk }) => {
  const f = useCurrentFrame(); const P = PL[pk].claude; const c = claudeFrame(f); const sc = sceneAt(f);
  const chg = Math.min(...[S0(sc), LN("l04").sf, LN("l06").sf - 80].map((t) => Math.abs(f - t))); const pop = 1 + 0.12 * Math.sin(clamp(1 - chg / 12) * Math.PI); const bob = Math.sin(f / 18) * 0.012;
  return (<div style={{ position: "absolute", left: P.x - P.size / 2, top: P.feet - 0.81 * P.size, width: P.size, height: P.size, transform: `scale(${pop + bob})`, transformOrigin: "50% 81%", zIndex: 30 }}>
    <div style={{ position: "absolute", left: "12%", right: "12%", top: "76%", height: "9%", borderRadius: "50%", background: "rgba(0,0,0,.35)", filter: "blur(6px)", zIndex: -1 }} />
    <Img src={staticFile(`ep27/claude/${c.tag}/${String(c.idx).padStart(3, "0")}.png`)} style={{ width: P.size, height: P.size, display: "block" }} /></div>);
};

/* ============ screen-space UI helpers ============ */
const Panel: React.FC<{ x: number; y: number; w: number; h: number; a?: number; acc?: string; children?: React.ReactNode; pad?: number; z?: number }> = ({ x, y, w, h, a = 0, acc = K.line, children, pad = 14, z = 60 }) => { const f = useCurrentFrame(); const s = useSp(a, SOFT); return (<div style={{ position: "absolute", left: x, top: y + Math.sin((f + x) / 40) * 3, width: w, height: h, opacity: clamp(s * 1.6), transform: `perspective(1200px) translateZ(${(1 - s) * -200}px) rotateX(${(1 - s) * 14}deg) translateY(${(1 - s) * 30}px)`, borderRadius: 20, background: K.panel, border: `2px solid ${acc}`, boxShadow: "0 18px 40px rgba(0,0,0,.5)", padding: pad, fontFamily: sans, color: K.white, overflow: "hidden", zIndex: z }}>{children}</div>); };
const Label: React.FC<{ text: string; y?: number; a?: number }> = ({ text, y: _y, a = 20 }) => { const s = useSp(a); return <div style={{ position: "absolute", left: 40, right: 40, top: 399, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 20, color: K.amber, letterSpacing: 1.5, opacity: clamp(s * 2), zIndex: 70, textShadow: "0 2px 6px #000" }}>{text}</div>; };
const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; a: number; c?: string; dots?: boolean }> = ({ x1, y1, x2, y2, a, c = K.cyan, dots = true }) => { const f = useCurrentFrame(); const p = pr(f, a, a + 14); return (<svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, zIndex: 58, pointerEvents: "none" }}><line x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={c} strokeWidth={4} strokeLinecap="round" />{dots && f > a + 14 && [0, 1, 2].map((i) => { const t = (((f - a) * 0.014 + i / 3) % 1 + 1) % 1; return <circle key={i} cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r={6} fill={c} opacity={Math.sin(Math.PI * t)} style={{ filter: `drop-shadow(0 0 6px ${c})` }} />; })}</svg>); };
const Node: React.FC<{ x: number; y: number; w: number; h?: number; a: number; label: string; sub?: string; c: string; glyph?: string }> = ({ x, y, w, h = 110, a, label, sub, c, glyph }) => { const s = useSp(a); const f = useCurrentFrame(); const hot = f > a && f < a + 26; return (<div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 20, background: K.panel, border: `${hot ? 4 : 2.5}px solid ${c}`, boxShadow: hot ? `0 0 34px ${c}99` : `0 0 14px ${c}22`, opacity: clamp(s * 1.6), transform: `scale(${0.8 + 0.2 * s})`, fontFamily: sans, color: K.white, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", zIndex: 62 }}>{glyph ? <div style={{ fontSize: 32 }}>{glyph}</div> : null}<div style={{ fontWeight: 900, fontSize: w > 260 ? 32 : 26, letterSpacing: 1 }}>{label}</div>{sub ? <div style={{ fontWeight: 600, fontSize: 18, color: K.dim, marginTop: 2 }}>{sub}</div> : null}</div>); };
const Kin: React.FC<{ text: string; a: number; y: number; size?: number; c?: string; out?: number }> = ({ text, a, y, size = 96, c = K.white, out }) => { const f = useCurrentFrame(); const o = out ? 1 - pr(f, out, out + 8) : 1; return (<div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: size, color: c, letterSpacing: 2, zIndex: 66, opacity: o, textShadow: `0 0 40px ${K.orange}88, 0 5px 0 rgba(0,0,0,.5)` }}>{text.split("").map((ch, i) => { const s = spring({ frame: f - a - i * 1.4, fps: 30, config: { damping: 10, stiffness: 190, mass: 0.6 } }); return <span key={i} style={{ display: "inline-block", whiteSpace: "pre", transform: `perspective(700px) rotateX(${(1 - s) * -70}deg) translateY(${(1 - s) * 40}px)`, opacity: clamp(s * 2) }}>{ch}</span>; })}</div>); };

/* ============ per-scene overlays (local frame = scene frame) ============ */
const Phone: React.FC<{ x: number; y: number; w: number; a: number; src: string; startFrom?: number; tag: string; z?: number }> = ({ x, y, w, a, src, startFrom = 0, tag, z = 64 }) => { const s = useSp(a, SOFT); const h = w * 16 / 9; return (<div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 26, border: "4px solid #dfe6f2", overflow: "hidden", boxShadow: "0 22px 44px rgba(0,0,0,.55)", opacity: clamp(s * 1.6), transform: `perspective(1200px) rotateY(${(1 - s) * -30}deg) scale(${0.85 + 0.15 * s})`, background: "#000", zIndex: z }}><OffthreadVideo src={staticFile(src)} startFrom={startFrom} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.7)", color: K.green, fontFamily: sans, fontWeight: 900, fontSize: 15, textAlign: "center", padding: "3px 0" }}>{tag}</div></div>); };
const Ov: Record<Sc, React.FC<{ a: number }>> = {
  hook: ({ a }) => { void a; const f = useCurrentFrame(); const cnt = f < 14 ? 1 : f < 26 ? 10 : f < 38 ? 25 : 50; const shown = f < 8 ? 1 : f < 20 ? Math.round(1 + 9 * pr(f, 8, 20)) : f < 34 ? Math.round(10 + 15 * pr(f, 20, 34)) : Math.round(25 + 25 * pr(f, 34, 46)); void cnt; const tt = LN("l02").sf; const o = 1 - pr(f, F_DOOR - 8, F_DOOR - 2);
    return (<>
      <div style={{ opacity: o }}>
        <Panel x={40} y={430} w={1000} h={400} a={0} acc={K.orange} pad={16}><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 30, color: K.dim, letterSpacing: 2 }}>CONTENT DASHBOARD · PLANNED BATCH</div>
          <div style={{ display: "flex", gap: 24, alignItems: "center", marginTop: 6 }}><div style={{ fontWeight: 900, fontSize: 190, color: K.orange, lineHeight: 1, minWidth: 330, textAlign: "center" }}>{String(shown).padStart(2, "0")}</div><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 46, lineHeight: 1.1 }}>REELS<div style={{ fontSize: 28, color: K.dim, fontWeight: 700 }}>planned · not yet rendered</div></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: 6, marginTop: 8 }}>{Array.from({ length: 50 }, (_, i) => <div key={i} style={{ height: 22, borderRadius: 4, background: i < shown ? K.orange : "rgba(255,255,255,.08)" }} />)}</div></Panel>
        <Kin text="50 REELS WHILE I WAS" a={2} y={850} size={50} c={K.white} /><Kin text="AT THE GYM?!" a={10} y={915} size={66} c={K.amber} /></div>
      <Kin text="50 REELS?!" a={tt - S0("hook") + 6} y={470} size={120} c={K.white} out={S1("hook") - 4} /></>); },
  surprise: ({ a }) => { void a; const f = useCurrentFrame(); const t4 = LN("l04").sf - S0("surprise"); const th = ["reel-01", "reel-02", "reel-03"];
    return (<><Kin text="50" a={4} y={430} size={190} c={K.orange} />
      <div style={{ position: "absolute", left: 40, top: 630, width: 1000, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, perspective: 1400, zIndex: 60 }}>{Array.from({ length: 10 }, (_, i) => { const p = pr(f, 14 + i * 3, 30 + i * 3); const real = i < 3; return <div key={i} style={{ height: 150, borderRadius: 12, overflow: "hidden", border: `2px solid ${real ? K.green : K.line}`, background: "rgba(13,20,33,.9)", opacity: p, transform: `rotateX(${(1 - p) * 70}deg) translateY(${(1 - p) * 40}px)`, position: "relative" }}>{real ? <Img src={staticFile(`ep28/thumbs/${th[i]}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 14, color: K.dim, padding: "60px 4px", textAlign: "center" }}>PLANNED #{i + 1}</div>}</div>; })}</div>
      <Label text="3 REAL RENDERS (green) · the rest are planned placeholders" a={24} />
      {f > t4 ? <Kin text="BETTER WORKFLOW" a={t4 + 8} y={600} size={60} c={K.green} /> : null}</>); },
  audience: ({ a }) => { void a; const f = useCurrentFrame(); const t6 = LN("l06").sf - S0("audience"); const cards = [["LOOKS THAT WORK", K.cyan, "▦▦▦"], ["WHAT CUSTOMERS WANT", K.amber, "★"], ["DESIRED OUTCOMES", K.green, "✓"], ["AUDIENCE NEEDS", K.orange, "?"]] as const;
    return (<><Kin text="AUDIENCE RESEARCH" a={4} y={430} size={58} c={K.white} />
      {cards.map(([n, c, g], i) => { const p = pr(f, t6 + 10 + i * 36, t6 + 26 + i * 36); const x = 40 + (i % 2) * 505, y = 540 + Math.floor(i / 2) * 215; return (<div key={n} style={{ position: "absolute", left: x, top: y, width: 495, height: 195, borderRadius: 22, background: K.panel, border: `3px solid ${c}`, opacity: p, transform: `perspective(900px) rotateY(${(1 - p) * (i % 2 ? 40 : -40)}deg) scale(${0.85 + 0.15 * p})`, padding: 16, fontFamily: sans, zIndex: 62, boxShadow: `0 0 30px ${c}33` }}><div style={{ fontWeight: 900, fontSize: 26, color: c, letterSpacing: 2 }}>{n}</div>
        {i === 0 && <div style={{ display: "flex", gap: 8, marginTop: 16 }}>{[0, 1, 2, 3].map((k) => <div key={k} style={{ flex: 1, height: 90, borderRadius: 8, background: c + "33", border: `2px solid ${c}`, transform: `scaleY(${0.4 + 0.6 * pr(f, t6 + 20 + k * 5, t6 + 40 + k * 5)})`, transformOrigin: "bottom" }} />)}</div>}
        {i === 1 && <div style={{ fontSize: 80, textAlign: "center", color: c, marginTop: 4 }}>{"★".repeat(Math.min(3, 1 + Math.floor(pr(f, t6 + 50, t6 + 90) * 3)))}</div>}
        {i === 2 && <div style={{ marginTop: 14 }}>{["Goal", "Result"].map((k, q) => <div key={k} style={{ height: 38, margin: "8px 0", borderRadius: 8, background: c + "22", border: `2px solid ${c}`, width: `${100 * pr(f, t6 + 90 + q * 14, t6 + 120 + q * 14)}%`, fontWeight: 800, fontSize: 22, padding: "4px 12px" }}>{k}</div>)}</div>}
        {i === 3 && <div style={{ fontSize: 100, textAlign: "center", color: c, transform: `rotate(${Math.sin(f / 8) * 8}deg)` }}>?</div>}</div>); })}
      <Label text="ILLUSTRATIVE · no real audience data or Instagram algorithm claims" a={t6 + 20} /></>); },
  content: ({ a }) => { void a; const f = useCurrentFrame(); const t8 = LN("l08").sf - S0("content"); const st = ["RESEARCH", "IDEAS", "HOOKS", "SCRIPTS", "STORYBOARDS"]; const R0 = REELS[0] as any; const cs = [K.cyan, K.amber, K.orange, K.green, K.cyan]; const cur = Math.min(4, Math.floor(pr(f, t8 + 20, t8 + 200) * 5));
    return (<><Kin text="RESEARCH → STORYBOARD" a={4} y={430} size={52} c={K.white} />
      {st.map((s, i) => <Node key={s} x={20 + i * 205} y={520} w={190} h={80} a={t8 + 6 + i * 12} label={s} c={cs[i]} />)}
      <Panel x={40} y={640} w={1000} h={290} a={t8 + 20} acc={cs[cur]} pad={16}><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 22, color: cs[cur], letterSpacing: 3 }}>REAL EXAMPLE · data/reels.json #1 · stage: {st[cur]}</div>
        <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 52, marginTop: 8 }}>{R0.topic}</div>
        <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 34, color: K.white, opacity: cur >= 2 ? 1 : 0.15 }}>Hook: {R0.hook}</div>
        <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 26, color: K.green, opacity: cur >= 3 ? 1 : 0.15, marginTop: 6 }}>Script: {R0.points.join(" → ")}</div>
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 26, color: K.dim, opacity: cur >= 4 ? 1 : 0.15, marginTop: 6 }}>Caption: {R0.caption}</div></Panel>
      <Label text="REAL DRAFT TEXT from this episode's data/reels.json" a={t8 + 30} /></>); },
  code: ({ a }) => { void a; const f = useCurrentFrame(); const t10 = LN("l10").sf - S0("code"); const T1 = t10 + 10, T2 = t10 + 100, T3 = t10 + 185; const cc = CC as [string, string][]; const code = (CODE as any).lines as string[];
    const type = (s: string, st: number, cps = 2.2) => s.slice(0, Math.max(0, Math.floor((f - st) * cps)));
    return (<><Kin text="CODE → ANIMATION → VIDEO" a={4} y={430} size={46} c={K.white} />
      <Panel x={40} y={520} w={1000} h={410} a={T1 - 20} acc={K.orange} pad={0} z={62}>
        {f < T2 + 30 ? (<div style={{ padding: 16, fontFamily: mono, fontSize: 22, color: "#E8EAF0", lineHeight: 1.45 }}><div style={{ color: K.orange, fontWeight: 800, fontFamily: sans, letterSpacing: 2 }}>REAL CLAUDE CODE RUN (transcript, claude -p)</div>
          {cc.slice(0, 5).map(([k, t], i) => { const st = T1 + i * 14; if (f < st) return null; return <div key={i} style={{ color: k === "bash" ? K.green : k === "result" ? K.amber : "#E8EAF0", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{k === "bash" ? "$ " : k === "claude" ? "● " : "✓ "}{type(t, st, 3.2)}</div>; })}</div>)
          : (<div style={{ padding: 14, fontFamily: mono, fontSize: 20, color: "#E8EAF0", lineHeight: 1.42 }}><div style={{ color: K.cyan, fontFamily: sans, fontWeight: 800, letterSpacing: 2 }}>REAL FILE · {(CODE as any).file}</div>{code.map((l, i) => <div key={i} style={{ whiteSpace: "pre", background: /spring|useCurrentFrame|interpolate|clipPath/.test(l) && f > T2 + 40 ? K.cyan + "22" : "transparent", opacity: pr(f, T2 + i * 2, T2 + 10 + i * 2) }}>{l}</div>)}</div>)}</Panel>
      {f >= T3 ? <Phone x={760} y={440} w={250} a={T3} src="ep28/reels/reel-01.mp4" tag="REAL RENDER · reel-01.mp4" z={70} /> : null}
      <Label text="Real terminal transcript · real source file · real rendered video" a={T1} /></>); },
  batch: ({ a }) => { void a; const f = useCurrentFrame(); const t12 = LN("l12").sf - S0("batch"); const steps = [["Topic list", true], ["Script", false], ["Assets", false], ["Voiceover", false], ["Motion graphics", true], ["Render", true], ["QC", false]] as const;
    return (<><Kin text="ONE WORKFLOW. MULTIPLE VIDEOS." a={4} y={420} size={44} c={K.white} />
      <Panel x={40} y={500} w={560} h={430} a={t12 - 10} acc={K.green} pad={0} z={62}><div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}><OffthreadVideo src={staticFile("ep28/term/batch.mp4")} startFrom={0} playbackRate={5.2} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} /><div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.75)", fontFamily: sans, fontWeight: 900, fontSize: 16, color: K.green, textAlign: "center", padding: "3px 0" }}>REAL TERMINAL RUN · bash scripts/batch_reels.sh · sped up x5</div></div></Panel>
      {["reel-01", "reel-02", "reel-03"].map((n, i) => <Phone key={n} x={625 + i * 140} y={520} w={125} a={t12 + 30 + i * 22} src={`ep28/reels/${n}.mp4`} tag="REAL" />)}
      <div style={{ position: "absolute", left: 625, top: 740, width: 415, fontFamily: sans, fontWeight: 800, fontSize: 24, color: K.green, zIndex: 66 }}>3 of 50 rendered<div style={{ color: K.dim, fontWeight: 600, fontSize: 20 }}>47 planned, not produced</div></div>
      <div style={{ position: "absolute", left: 40, top: 945, width: 1000, display: "flex", gap: 6, zIndex: 66 }}>{steps.map(([n, real], i) => { const p = pr(f, t12 + 10 + i * 10, t12 + 22 + i * 10); return <div key={n} style={{ flex: 1, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 15, padding: "8px 2px", borderRadius: 10, border: `2px solid ${real ? K.green : K.line}`, background: real ? K.green + "22" : K.panel, color: real ? K.white : K.dim, opacity: p }}>{n}<div style={{ fontSize: 11, color: real ? K.green : K.dim }}>{real ? "REAL" : "planned"}</div></div>; })}</div></>); },
  approval: ({ a }) => { void a; const f = useCurrentFrame(); const t14 = LN("l14").sf - S0("approval"); const st = ["DRAFT", "REVIEW", "APPROVED", "READY TO SCHEDULE"]; const cs = [K.dim, K.amber, K.green, K.cyan]; const prog = clamp((f - (t14 + 50)) / 120) * 3;
    return (<><Kin text="HUMAN APPROVAL" a={LN("l13").sf - S0("approval") + 4} y={430} size={60} c={K.white} />
      {st.map((s, i) => <Node key={s} x={20 + i * 258} y={520} w={240} h={90} a={LN("l13").sf - S0("approval") + 30 + i * 10} label={s} c={cs[i]} />)}
      <Phone x={70} y={650} w={200} a={t14 - 20} src="ep28/reels/reel-02.mp4" tag="REAL RENDER · for review" />
      <Panel x={300} y={650} w={730} h={300} a={t14} acc={K.green} pad={16}><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 24, color: K.dim, letterSpacing: 2 }}>DEMO DASHBOARD · nothing is published</div><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 40, marginTop: 6 }}>{(REELS[1] as any).topic}</div>
        {["Facts checked", "Brand voice matches", "Captions readable"].map((c, i) => <div key={c} style={{ fontFamily: sans, fontSize: 26, fontWeight: 700, marginTop: 6, color: pr(f, t14 + 20 + i * 24, t14 + 34 + i * 24) > 0.5 ? K.green : K.dim }}>{pr(f, t14 + 20 + i * 24, t14 + 34 + i * 24) > 0.5 ? "☑" : "☐"} {c}</div>)}
        <div style={{ display: "flex", gap: 14, marginTop: 10 }}><div style={{ padding: "8px 22px", borderRadius: 12, background: prog > 1.5 ? K.green : "transparent", border: `3px solid ${K.green}`, fontFamily: sans, fontWeight: 900, fontSize: 26, color: prog > 1.5 ? "#04210f" : K.green, boxShadow: f > t14 + 90 && f < t14 + 110 ? `0 0 24px ${K.green}` : "none" }}>APPROVE</div><div style={{ padding: "8px 22px", borderRadius: 12, border: `3px solid ${K.line}`, fontFamily: sans, fontWeight: 900, fontSize: 26, color: K.dim }}>NEEDS CHANGES</div></div></Panel>
      <div style={{ position: "absolute", left: 20 + Math.min(3, prog) * 258 + 40, top: 626, fontSize: 30, zIndex: 70 }}>▼</div></>); },
  closing: ({ a }) => { void a; const f = useCurrentFrame(); const t16 = LN("l16").sf - S0("closing"); const t17 = LN("l17").sf - S0("closing"); const tE = LN("l17").ef - S0("closing");
    return (<><Kin text="SMARTER WORKFLOWS." a={t16 + 20} y={470} size={70} c={K.white} /><Kin text="BETTER CONTENT." a={t16 + 44} y={560} size={70} c={K.amber} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 690, height: 100, borderRadius: 50, background: `linear-gradient(90deg, ${K.orange}, ${K.amber})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 900, fontSize: 42, color: "#1a0d05", zIndex: 66, opacity: pr(f, t17, t17 + 14), transform: `scale(${0.9 + 0.1 * pr(f, t17, t17 + 14)})` }}>FOLLOW @AGENTOON.AI</div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 808, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 24, color: K.dim, letterSpacing: 2, opacity: pr(f, tE - 20, tE), zIndex: 66 }}>Real AI Tools • Skills • Automation</div></>); },
};

/* ============ captions ============ */
const Caps: React.FC = () => {
  const f = useCurrentFrame(); const idx = WORDS.findIndex((w) => f < w.e); const i = idx < 0 ? WORDS.length - 1 : Math.max(0, idx); const w0 = WORDS[i]; if (f < 3 || f > LN("l17").ef + 10) return null;
  const line = WORDS.filter((w) => w.line === w0.line); const lw = line.indexOf(w0); const chunk = Math.floor(lw / 5) * 5; const shown = line.slice(chunk, chunk + 5); const col = w0.who === "C" ? K.orange : K.cyan;
  return (<div style={{ position: "absolute", left: 30, right: 30, top: 205, height: 190, borderRadius: 28, background: "rgba(5,8,14,.86)", border: `1.5px solid ${K.line}`, zIndex: 95, padding: "16px 26px", boxShadow: "0 16px 40px rgba(0,0,0,.45)" }}>
    <div style={{ display: "inline-block", background: col, color: w0.who === "C" ? "#fff" : "#04202a", fontFamily: sans, fontWeight: 900, fontSize: 24, padding: "2px 16px", borderRadius: 10, letterSpacing: 2 }}>{w0.who === "C" ? "CLAUDE" : "AGENTOON"}</div>
    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: "2px 12px", fontFamily: sans, fontWeight: 900, fontSize: 52, color: "#fff", lineHeight: 1.1 }}>
      {shown.map((w, q) => { const act = chunk + q === lw; const p = act ? spring({ frame: f - w.s, fps: 30, config: { damping: 11, stiffness: 220, mass: 0.7 } }) : 1; return <span key={w.s + "_" + q} style={{ padding: "0 8px", borderRadius: 10, background: act ? col : "transparent", color: act ? (w0.who === "C" ? "#fff" : "#04202a") : "#fff", transform: `scale(${act ? 0.92 + 0.08 * p : 1})`, display: "inline-block" }}>{w.w}</span>; })}</div></div>);
};

/* ============ world ============ */
const World: React.FC = () => {
  const f = useCurrentFrame(); const sc = sceneAt(f); const pk = pkAt(f); const cam = camAt(sc, f); const lf = f - S0(sc);
  const IN = 10; const tin = E(lf / IN); const lean = sc === "closing" ? -5 * pr(f, LN("l15").sf, LN("l15").sf + 20) : 0;
  const door = pr(f, F_DOOR - 4, F_DOOR + 4);
  const planA = (k: PK) => (<>
    <Img src={staticFile(PL[k].img)} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
    {k === pk && pk !== ("C" as any) && f >= F_LAST_CLOSE ? <RobotSeated pk={k} lean={lean} /> : null}
    <Img src={staticFile(PL[k].fg)} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, zIndex: 20 }} />
    <ClaudeLayer pk={k} /></>);
  return (<div style={{ position: "absolute", inset: 0, opacity: 0.6 + 0.4 * tin, transform: `scale(${cam.s})`, transformOrigin: `${cam.ox}px ${cam.oy}px`, filter: lf < IN && sc !== "hook" ? `blur(${(1 - tin) * 7}px)` : undefined }}>
    {pk === "C" ? (<>
      <Img src={staticFile("ep28/plates/C_door_closed.png")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
      <Img src={staticFile("ep28/plates/C_door_open.png")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: door }} />
      <Img src={staticFile("ep28/plates/C_door_open_fg.png")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, zIndex: 20 }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 25 }}><RobotEnter /></div>
    </>) : planA(pk as PK)}
  </div>);
};
export const Ep28: React.FC = () => (
  <AbsoluteFill style={{ background: K.bg }}>
    <Audio src={staticFile("audio/ep28-mix.wav")} />
    <World />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 45%, rgba(0,0,0,.45) 100%)", zIndex: 50, pointerEvents: "none" }} />
    {SCENES.map((s) => { const O = Ov[s]; return <Sequence key={s} from={S0(s)} durationInFrames={S1(s) - S0(s) + 8} layout="none"><O a={S0(s)} /></Sequence>; })}
    <div style={{ position: "absolute", left: 40, top: 92, zIndex: 96, fontFamily: sans, fontWeight: 900, fontSize: 30, color: K.white, letterSpacing: 3 }}>AGENTOON<span style={{ color: K.cyan }}>.AI</span></div>
    <div style={{ position: "absolute", right: 40, top: 98, zIndex: 96, fontFamily: sans, fontWeight: 800, fontSize: 22, color: K.amber, letterSpacing: 2 }}>EP 02</div>
    <Caps />
    <div style={{ position: "absolute", left: 30, right: 30, top: 1830, textAlign: "center", fontFamily: sans, fontWeight: 600, fontSize: 16, color: "rgba(244,247,251,.6)", zIndex: 96 }}>Agentoon.ai animated interpretation of the Claude Code mascot · not an official Anthropic production · dashboards are demo graphics</div>
  </AbsoluteFill>
);
