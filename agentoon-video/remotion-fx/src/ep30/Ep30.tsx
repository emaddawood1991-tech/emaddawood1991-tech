import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Robot2, pose2, Gest2 } from "../fx/RobotRig2";
import { clamp } from "../fx/math";
import TL from "../../public/data/ep30-timeline.json";
import D from "../../public/data/ep30-data.json";

/** Episode 30 (Original Office Series, Ep 04): STOP VIBE CODING WITHOUT THESE 4 SKILLS. PREVIEW.
 *  Engines: Blender 5.3 (office plates + 3D Claude Code mascot sprites), Remotion (timeline, 2D robot rig, all graphics).
 *  HONESTY: Karpathy / Superpowers / ADHD figures are measured from real `claude -p` runs in isolated demo projects (data/cc/).
 *  The Octopus network is a labelled ILLUSTRATION (no multi-model accounts were available). Community tools, not official Anthropic or Karpathy releases. */
export const EP30_FRAMES = TL.frames as number;
type Ln = { id: string; who: "A" | "C"; scene: string; sf: number; ef: number };
const LINES = TL.lines as Ln[]; const WORDS = TL.words as { w: string; who: "A" | "C"; line: string; s: number; e: number }[];
const LN = (id: string) => LINES.find((l) => l.id === id)!;
const cue = (id: string, word: string, nth = 0) => { const ws = WORDS.filter((w) => w.line === id); const m = ws.filter((w) => w.w.toLowerCase().replace(/[^a-z0-9@-]/g, "").includes(word.toLowerCase())); return (m[nth] ?? m[0] ?? { s: LN(id).sf }).s; };
const SCENES = ["hook", "karpathy", "octopus", "superpowers", "adhd", "recap", "closing"] as const; type Sc = (typeof SCENES)[number];
const S0 = (s: Sc) => (s === "hook" ? 0 : LINES.find((l) => l.scene === s)!.sf - 5);
const S1 = (s: Sc) => { const i = SCENES.indexOf(s); return i === SCENES.length - 1 ? EP30_FRAMES : S0(SCENES[i + 1]); };
const sceneAt = (f: number): Sc => { let r: Sc = "hook"; for (const s of SCENES) if (f >= S0(s)) r = s; return r; };
const K = { bg: "#07040F", panel: "rgba(18,10,36,.93)", line: "rgba(190,160,255,.28)", lime: "#C6FF3D", violet: "#8B5CF6", cyan: "#38D6F5", orange: "#D97757", amber: "#FFB454", white: "#F6F3FF", dim: "#A99CC8", red: "#FF5D6C", green: "#3DDC97" };
const sans = '"Inter","DejaVu Sans",Arial,sans-serif'; const mono = '"DejaVu Sans Mono",ui-monospace,Menlo,monospace';
const POP = { damping: 13, stiffness: 150, mass: 0.8 }; const SOFT = { damping: 22, stiffness: 100, mass: 1 };
const E = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
const pr = (f: number, a: number, b: number) => E((f - a) / (b - a));
const useSp = (a: number, cfg = POP) => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return spring({ frame: f - a, fps, config: cfg }); };
const lipAt = (lip: { fps: number; a: number[] }, f: number) => { const t = (f / 30) * lip.fps; const i = Math.floor(t); const a = lip.a[i] ?? 0, b = lip.a[i + 1] ?? a; return a + (b - a) * (t - i); };
const LA = TL.lipA as { fps: number; a: number[] }, LC = TL.lipC as { fps: number; a: number[] };

/* ============ plates, placements, camera ============ */
type PK = "A" | "B" | "C";
const PL: Record<PK, { img: string; fg: string; robot: { cx: number; top: number; w: number }; claude: { x: number; feet: number; size: number } }> = {
  A: { img: "ep29/plates/E_A_wide.png", fg: "ep29/plates/E_A_wide_fg.png", robot: { cx: 540, top: 994, w: 270 }, claude: { x: 745, feet: 1272, size: 147 } },
  B: { img: "ep29/plates/E_B_medium.png", fg: "ep29/plates/E_B_medium_fg.png", robot: { cx: 480, top: 916, w: 486 }, claude: { x: 756, feet: 1404, size: 265 } },
  C: { img: "ep29/plates/E_C_door.png", fg: "ep29/plates/E_C_door_fg.png", robot: { cx: 480, top: 916, w: 486 }, claude: { x: 735, feet: 1062, size: 118 } },
};
const PLATE: Record<Sc, PK> = { hook: "B", karpathy: "B", octopus: "A", superpowers: "B", adhd: "B", recap: "A", closing: "C" };
type Cam = { f: number; s: number; ox: number; oy: number };
const camKeys = (sc: Sc): Cam[] => {
  const a = S0(sc), b = S1(sc);
  switch (sc) {
    case "hook": return [{ f: a, s: 1.3, ox: 700, oy: 1350 }, { f: LN("l01").sf - 6, s: 1.1, ox: 520, oy: 1200 }, { f: LN("l01").sf + 10, s: 2.1, ox: 480, oy: 1130 }, { f: LN("l02").sf, s: 2.0, ox: 560, oy: 1180 }, { f: LN("l02").sf + 24, s: 1.8, ox: 756, oy: 1300 }, { f: b, s: 1.8, ox: 756, oy: 1300 }];
    case "karpathy": return [{ f: a, s: 1.8, ox: 756, oy: 1300 }, { f: LN("l04").sf, s: 1.3, ox: 560, oy: 1200 }, { f: LN("l05").sf, s: 1.7, ox: 756, oy: 1300 }, { f: b, s: 1.2, ox: 560, oy: 1200 }];
    case "octopus": return [{ f: a, s: 1.15, ox: 540, oy: 1200 }, { f: LN("l07").sf, s: 1.35, ox: 700, oy: 1230 }, { f: b, s: 1.1, ox: 620, oy: 1230 }];
    case "superpowers": return [{ f: a, s: 1.3, ox: 480, oy: 1150 }, { f: LN("l09").sf, s: 1.8, ox: 756, oy: 1300 }, { f: LN("l10").sf, s: 1.4, ox: 600, oy: 1200 }, { f: b, s: 1.5, ox: 756, oy: 1300 }];
    case "adhd": return [{ f: a, s: 1.25, ox: 480, oy: 1150 }, { f: LN("l12").sf, s: 1.7, ox: 756, oy: 1300 }, { f: LN("l13").sf, s: 1.3, ox: 560, oy: 1200 }, { f: b, s: 1.5, ox: 700, oy: 1300 }];
    case "recap": return [{ f: a, s: 1.3, ox: 700, oy: 1230 }, { f: LN("l15").sf, s: 1.15, ox: 600, oy: 1200 }, { f: b, s: 1.05, ox: 560, oy: 1200 }];
    default: return [{ f: a, s: 1.0, ox: 540, oy: 1100 }, { f: b, s: 1.06, ox: 540, oy: 1100 }];
  }
};
const camAt0 = (keys: Cam[], f: number) => { let c = keys[0]; for (let i = 0; i < keys.length - 1; i++) { const A = keys[i], B = keys[i + 1]; if (f >= A.f && f <= B.f) { const t = B.f === A.f ? 1 : E((f - A.f) / (B.f - A.f)); c = { f, s: A.s + (B.s - A.s) * t, ox: A.ox + (B.ox - A.ox) * t, oy: A.oy + (B.oy - A.oy) * t }; } else if (f > B.f) c = B; } return c; };
const camAt = (sc: Sc, f: number) => { const c0 = camAt0(camKeys(sc), f); return c0.s < 1.6 ? { ...c0, s: c0.s * 1.12, oy: c0.oy * 0.75 } : c0; };

/* ============ robot (2D rig) ============ */
const A_LINES = LINES.filter((l) => l.who === "A");
const RGEST: Gest2[] = (() => {
  const g: Gest2[] = []; let alt = 0;
  A_LINES.forEach((l) => { let t = l.sf + 3; while (t < l.ef - 6) { const len = Math.min(l.ef - t, 36 + (alt % 3) * 10); const type = alt % 3 === 0 ? "explain" : alt % 3 === 1 ? "both" : "present"; g.push({ type, from: t, to: t + len, hand: alt % 2 ? "R" : "L" }); t += len + 3; alt++; } });
  g.push({ type: "point", from: LN("l08").sf + 30, to: LN("l08").ef, hand: "R", angle: -55 });
  return g;
})();
const rp = (f: number, standing = false) => {
  const speaking: [number, number][] = A_LINES.map((l) => [l.sf, l.ef + 4]);
  const p = pose2(f, { lip: LA, speaking, gestures: standing ? [{ type: "present", from: LN("l16").sf, to: LN("l16").ef, hand: "R" }] : RGEST, walks: [], seed: 31 });
  const inW = (a: number, b: number) => f >= a && f <= b; const wob = Math.sin(f / 3);
  if (!standing) {
    if (f < LN("l01").sf - 8) { const t = f / 30; p.armL = 28 + 7 * Math.sin(t * 14); p.armR = -(28 + 7 * Math.sin(t * 14 + 2)); p.lookX = 0; p.lookY = 3; p.mouth = "flat"; }            // typing
    if (inW(LN("l01").sf - 8, LN("l01").ef)) { p.armL = 128 + 8 * wob; p.armR = -(128 + 8 * wob); p.extL = p.extR = 1.1; p.mouth = "open"; }               // frustration, both hands
    if (inW(LN("l04").sf, LN("l04").ef)) { p.lookX = 8; p.mouth = "worry"; }                                                                                // turning to Claude, confusion
    if (inW(LN("l06").sf, LN("l06").ef)) { p.head = 6 * Math.sin(f / 5); p.mouth = "worry"; }                                                               // not sure
    if (inW(LN("l10").sf - 6, LN("l10").ef + 20)) { p.happy = true; p.armL = 40; p.armR = -40; }                                                              // finally
    if (inW(LN("l13").sf, LN("l13").ef + 30)) { p.happy = true; p.head = 5 * Math.sin(f / 4); }                                                              // smiling
  }
  return p;
};
const RobotSeated: React.FC<{ pk: PK }> = ({ pk }) => {
  const f = useCurrentFrame(); const P = PL[pk].robot; const p = rp(f); const rK = P.w / 200;
  const lean = ((f >= LN("l04").sf && f <= LN("l04").ef) || (f >= LN("l08").sf + 40 && f <= LN("l08").ef) ? 4 : 0) + Math.sin(f / 40) * 0.6;
  return (<div style={{ position: "absolute", left: P.cx - P.w / 2, top: P.top, transform: `rotate(${lean}deg)`, transformOrigin: "50% 90%" }}><Robot2 pose={{ ...p, legL: 0, legR: 0 }} width={P.w} shadow={false} />
    <div style={{ position: "absolute", left: 60 * rK, top: 220 * rK, width: 80 * rK, height: 10 * rK, borderRadius: "50%", background: "rgba(0,0,0,.25)", filter: "blur(4px)" }} /></div>);
};
const RobotStanding: React.FC = () => { const f = useCurrentFrame(); const p = rp(f, true); const rw = 344; const x = 400, y = 1560;
  return (<div style={{ position: "absolute", inset: 0, zIndex: 25 }}><div style={{ position: "absolute", left: x - rw * 0.6, top: y - 14 * rw / 200, width: rw * 1.2, height: 26 * rw / 200, borderRadius: "50%", background: "rgba(0,0,0,.4)", filter: "blur(6px)" }} />
    <div style={{ position: "absolute", left: x - rw / 2, top: y - rw * 1.4 * (272 / 280) }}><Robot2 pose={p} width={rw} shadow={false} rim /></div></div>); };

/* ============ Claude (Blender sprites) with per-skill accessories ============ */
const CLIP_N: Record<string, number> = { IDLE_none: 60, LISTEN_none: 60, TALK_none: 30, BOUNCE_none: 24, WAVE_none: 48, POINT_none: 36, LOOK_none: 60, CONFUSED_none: 60, THINK_none: 60, IDLE_cape: 60, TALK_cape: 30, POINT_cape: 36, CELEBRATE_cape: 32, "TALK_headphones+documents": 30, TALK_clipboard: 30 };
const claudeFrame = (f: number): { tag: string; idx: number } => {
  const cl = LINES.find((l) => l.who === "C" && f >= l.sf - 3 && f <= l.ef + 6); const speaking = !!cl && f >= cl.sf - 2 && f <= cl.ef + 2; const talk = speaking && lipAt(LC, f) > 0.1;
  const loop = (tag: string, k: number) => ({ tag, idx: ((k % CLIP_N[tag]) + CLIP_N[tag]) % CLIP_N[tag] }); const once = (tag: string, k: number) => ({ tag, idx: Math.max(0, Math.min(CLIP_N[tag] - 1, k)) });
  const sc = sceneAt(f);
  if (sc === "hook") return f < LN("l02").sf - 2 ? loop("LOOK_none", f) : talk ? loop("TALK_none", f) : loop("CONFUSED_none", f);
  if (sc === "karpathy") { const t = "TALK_headphones+documents"; return talk ? loop(t, f) : { tag: t, idx: 0 }; }
  if (sc === "octopus") return talk ? loop("TALK_none", f) : loop("LISTEN_none", f);
  if (sc === "superpowers") { if (f >= LN("l10").sf - 4) return once("CELEBRATE_cape", f - (LN("l10").sf - 4)); if (f >= LN("l09").ef - 20 && !talk) return once("POINT_cape", f - (LN("l09").ef - 20)); return talk ? loop("TALK_cape", f) : loop("IDLE_cape", f); }
  if (sc === "adhd") { if (f >= LN("l13").sf + 8) return once("BOUNCE_none", f - (LN("l13").sf + 8)); return talk ? loop("TALK_clipboard", f) : { tag: "TALK_clipboard", idx: 0 }; }
  if (sc === "recap") return talk ? loop("TALK_none", f) : loop("IDLE_none", f);
  return once("WAVE_none", Math.max(0, f - LN("l16").sf));
};
const ClaudeLayer: React.FC<{ pk: PK }> = ({ pk }) => {
  const f = useCurrentFrame(); const P = PL[pk].claude; const c = claudeFrame(f); const bob = Math.sin(f / 18) * 0.012;
  const pop = 1 + 0.1 * Math.sin(clamp(1 - Math.min(...SCENES.map((s) => Math.abs(f - S0(s)))) / 10) * Math.PI);
  return (<div style={{ position: "absolute", left: P.x - P.size / 2, top: P.feet - 0.81 * P.size, width: P.size, height: P.size, transform: `scale(${pop + bob})`, transformOrigin: "50% 81%", zIndex: 30 }}>
    <div style={{ position: "absolute", left: "12%", right: "12%", top: "76%", height: "9%", borderRadius: "50%", background: "rgba(0,0,0,.4)", filter: "blur(6px)", zIndex: -1 }} />
    <Img src={staticFile(`ep27/claude/${c.tag}/${String(c.idx).padStart(3, "0")}.png`)} style={{ width: P.size, height: P.size, display: "block" }} /></div>);
};

/* ============ dark-purple tech explainer UI ============ */
const Stage: React.FC<{ a?: number; out?: number; y?: number; h?: number; title?: string; badge?: string; acc?: string; children?: React.ReactNode }> = ({ a = 0, out, y = 425, h = 570, title, badge, acc = K.lime, children }) => {
  const f = useCurrentFrame(); const s = useSp(a, SOFT); const o = clamp(s * 1.5) * (out ? 1 - pr(f, out, out + 10) : 1);
  return (<div style={{ position: "absolute", left: 30, top: y, width: 1020, height: h, opacity: o, transform: `perspective(1400px) rotateX(${(1 - s) * 10}deg) translateY(${(1 - s) * 40}px)`, borderRadius: 26, overflow: "hidden", zIndex: 60,
    background: `radial-gradient(ellipse at 20% 0%, rgba(139,92,246,.35), rgba(18,10,36,.95) 60%), ${K.panel}`, border: `2.5px solid ${acc}`, boxShadow: `0 0 36px ${acc}44, 0 22px 50px rgba(0,0,0,.55)`, fontFamily: sans, color: K.white }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(190,160,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(190,160,255,.07) 1px, transparent 1px)", backgroundSize: "44px 44px", backgroundPosition: `${(f * 0.4) % 44}px ${(f * 0.25) % 44}px` }} />
    {title ? <div style={{ position: "absolute", left: 24, top: 14, fontWeight: 900, fontSize: 24, letterSpacing: 3, color: acc }}>{title}</div> : null}
    {badge ? <div style={{ position: "absolute", right: 22, top: 16, fontWeight: 800, fontSize: 17, letterSpacing: 1.5, color: K.amber, border: `1.5px solid ${K.amber}`, borderRadius: 8, padding: "2px 10px" }}>{badge}</div> : null}
    {children}</div>);
};
const Kin: React.FC<{ text: string; a: number; y: number; size?: number; c?: string; out?: number }> = ({ text, a, y, size = 96, c = K.white, out }) => { const f = useCurrentFrame(); const o = out ? 1 - pr(f, out, out + 8) : 1; return (<div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: size, color: c, letterSpacing: 2, zIndex: 66, opacity: o, textShadow: `0 0 40px ${K.violet}99, 0 5px 0 rgba(0,0,0,.5)` }}>{text.split("").map((ch, i) => { const s = spring({ frame: f - a - i * 1.4, fps: 30, config: { damping: 10, stiffness: 190, mass: 0.6 } }); return <span key={i} style={{ display: "inline-block", whiteSpace: "pre", transform: `perspective(700px) rotateX(${(1 - s) * -70}deg) translateY(${(1 - s) * 40}px)`, opacity: clamp(s * 2) }}>{ch}</span>; })}</div>); };
const Cnt: React.FC<{ to: number; a: number; dur?: number; pre?: string; c?: string; size?: number }> = ({ to, a, dur = 26, pre = "", c = K.white, size = 76 }) => { const f = useCurrentFrame(); const v = Math.round(to * pr(f, a, a + dur)); return <span style={{ fontFamily: sans, fontWeight: 900, fontSize: size, color: c }}>{pre}{v}</span>; };
const Note: React.FC<{ text: string; a?: number; y?: number; c?: string }> = ({ text, a = 10, y = 960, c = K.amber }) => { const s = useSp(a); return <div style={{ position: "absolute", left: 40, right: 40, top: y, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 19, color: c, letterSpacing: 1.2, opacity: clamp(s * 2), zIndex: 70, textShadow: "0 2px 6px #000" }}>{text}</div>; };
const Chip: React.FC<{ x: number; y: number; w: number; h: number; a: number; c: string; big: string; small?: string; num?: string; bright?: boolean }> = ({ x, y, w, h, a, c, big, small, num, bright }) => { const s = useSp(a); const f = useCurrentFrame(); const hot = f > a && f < a + 24;
  return (<div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: clamp(s * 1.6), transform: `scale(${0.8 + 0.2 * s})`, borderRadius: 18, background: bright ? c + "33" : "rgba(28,16,52,.95)", border: `${hot || bright ? 4 : 2.5}px solid ${c}`, boxShadow: hot ? `0 0 34px ${c}aa` : `0 0 12px ${c}33`, display: "flex", alignItems: "center", gap: 14, padding: "0 18px", zIndex: 62 }}>
    {num ? <div style={{ fontWeight: 900, fontSize: 40, color: c, minWidth: 54 }}>{num}</div> : null}
    <div><div style={{ fontWeight: 900, fontSize: 28, letterSpacing: 1 }}>{big}</div>{small ? <div style={{ fontWeight: 600, fontSize: 19, color: K.dim, marginTop: 2 }}>{small}</div> : null}</div></div>); };
const Line: React.FC<{ x1: number; y1: number; x2: number; y2: number; a: number; c?: string }> = ({ x1, y1, x2, y2, a, c = K.cyan }) => { const f = useCurrentFrame(); const p = pr(f, a, a + 14); return (<svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, zIndex: 58, pointerEvents: "none" }}><line x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={c} strokeWidth={4} strokeLinecap="round" />{f > a + 14 && [0, 1, 2].map((i) => { const t = (((f - a) * 0.016 + i / 3) % 1 + 1) % 1; return <circle key={i} cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r={6} fill={c} opacity={Math.sin(Math.PI * t)} style={{ filter: `drop-shadow(0 0 6px ${c})` }} />; })}</svg>); };
const Term: React.FC<{ x: number; y: number; w: number; h: number; a: number; lines: { t: string; c?: string; at: number }[]; title: string; size?: number }> = ({ x, y, w, h, a, lines, title, size = 25 }) => { const f = useCurrentFrame(); const s = useSp(a, SOFT);
  return (<div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: clamp(s * 1.6), transform: `translateY(${(1 - s) * 30}px)`, borderRadius: 16, background: "#0c0818", border: `2px solid ${K.line}`, overflow: "hidden", zIndex: 62, fontFamily: mono, fontSize: size, lineHeight: 1.4 }}>
    <div style={{ background: "#1a1030", padding: "6px 14px", fontFamily: sans, fontWeight: 800, fontSize: 17, color: K.dim, letterSpacing: 1.5 }}>{title}</div>
    <div style={{ padding: "10px 16px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{lines.map((l, i) => { if (f < l.at) return null; const n = Math.floor((f - l.at) * 2.4); return <div key={i} style={{ color: l.c ?? "#E8E4F6" }}>{l.t.slice(0, n)}</div>; })}</div></div>); };

/* ============ per-scene overlays (local frame = scene frame) ============ */
const Ov: Record<Sc, React.FC> = {
  hook: () => { const f = useCurrentFrame(); const t2 = LN("l02").sf; const code = ["const state = merge(oldState, {…})", "export function rewrite(all) {", "  return all.map((f) => refactor(f))", "}", "// 14 files touched", "// 3 renamed · 9 reformatted", "import { everything } from './everywhere'"];
    const o1 = 1 - pr(f, t2 - 4, t2 + 6);
    return (<>
      <div style={{ opacity: o1 }}><Stage a={0} h={470} title="git diff --stat" badge="ILLUSTRATIVE DRAMATISATION" acc={K.red}>
        <div style={{ position: "absolute", left: 24, top: 60, right: 24, fontFamily: mono, fontSize: 27, color: "#ff9aa6", lineHeight: 1.45, overflow: "hidden", height: 300 }}>{Array.from({ length: 14 }).map((_, i) => <div key={i} style={{ transform: `translateY(${-((f * 9) % 400)}px)`, opacity: 0.55 + 0.45 * ((i + Math.floor(f / 3)) % 3 === 0 ? 1 : 0.5) }}>{`- ${code[i % code.length]}`}</div>)}</div>
        <div style={{ position: "absolute", left: 24, bottom: 20, fontWeight: 900, fontSize: 30, color: K.red, letterSpacing: 2 }}>HUNDREDS OF LINES · FOR ONE SIMPLE FEATURE</div></Stage></div>
      <Kin text="STOP VIBE CODING" a={t2 + 4} y={440} size={86} c={K.white} />
      <Kin text="WITHOUT THESE" a={t2 + 14} y={540} size={64} c={K.dim} />
      <Kin text="4 SKILLS" a={t2 + 24} y={620} size={120} c={K.lime} />
      {["01", "02", "03", "04"].map((n, i) => <Chip key={n} x={40 + i * 252} y={745} w={232} h={90} a={t2 + 40 + i * 8} c={[K.lime, K.cyan, K.violet, K.amber][i]} big="?" small={`SKILL ${n}`} />)}
    </>); },
  karpathy: () => { const f = useCurrentFrame(); const o0 = S0("karpathy"); const L = (x: number) => x - o0; const d = D.karp; const tA = L(LN("l05").ef) + 4; const o = 1 - pr(f, tA - 8, tA);
    const P = [["01", "THINK BEFORE CODING", "think"], ["02", "SIMPLICITY FIRST", "simple"], ["03", "SURGICAL CHANGES", "unnecessary"], ["04", "GOAL-DRIVEN EXECUTION", "verify"]];
    return (<>
      <div style={{ opacity: o }}><Stage a={0} h={500} title="KARPATHY SKILLS" badge="COMMUNITY PROJECT · NOT OFFICIAL" acc={K.lime}>
        {P.map(([n, t, w], i) => <Chip key={n} x={30} y={64 + i * 106} w={960} h={92} a={L(cue("l03", w)) - 4} c={[K.lime, K.cyan, K.violet, K.amber][i]} num={n} big={t} bright={f > L(cue("l03", w)) && f < L(cue("l03", w)) + 40} />)}
        <div style={{ position: "absolute", left: 30, bottom: 12, fontFamily: mono, fontSize: 19, color: K.dim }}>github.com/{d.repo} · MIT</div></Stage></div>
      <Stage a={tA} h={540} title="REAL RUN · SAME PROMPT · ISOLATED DEMO" badge="MEASURED · 1 RUN EACH" acc={K.cyan}>
        <div style={{ position: "absolute", left: 24, top: 62, width: 470 }}><div style={{ fontWeight: 900, fontSize: 24, color: K.red, letterSpacing: 2 }}>WITHOUT</div>
          <div><Cnt to={d.base.files} a={tA + 10} c={K.white} size={92} /><span style={{ fontWeight: 800, fontSize: 26, color: K.dim }}> files changed</span></div>
          <div style={{ fontFamily: mono, fontSize: 36, fontWeight: 800 }}><span style={{ color: K.green }}>+<Cnt to={d.base.add} a={tA + 14} c={K.green} size={42} /></span> <span style={{ color: K.red }}>−<Cnt to={d.base.del} a={tA + 14} c={K.red} size={42} /></span></div>
          <div style={{ fontWeight: 800, fontSize: 22, color: K.dim, marginTop: 6 }}>added its own test · tests {d.base.tests}</div></div>
        <div style={{ position: "absolute", right: 24, top: 62, width: 470 }}><div style={{ fontWeight: 900, fontSize: 24, color: K.lime, letterSpacing: 2 }}>WITH KARPATHY SKILLS</div>
          <div><Cnt to={d.with.files} a={tA + 24} c={K.lime} size={92} /><span style={{ fontWeight: 800, fontSize: 26, color: K.dim }}> file changed</span></div>
          <div style={{ fontFamily: mono, fontSize: 36, fontWeight: 800 }}><span style={{ color: K.green }}>+<Cnt to={d.with.add} a={tA + 28} c={K.green} size={42} /></span> <span style={{ color: K.red }}>−<Cnt to={d.with.del} a={tA + 28} c={K.red} size={42} /></span></div>
          <div style={{ fontWeight: 800, fontSize: 22, color: K.dim, marginTop: 6 }}>only the requested change · tests {d.with.tests}</div></div>
        <div style={{ position: "absolute", left: 24, right: 24, top: 300, height: 220, overflow: "hidden", borderRadius: 12, background: "#0c0818", padding: "8px 14px", fontFamily: mono, fontSize: 18, lineHeight: 1.35 }}>
          {(d.diff as string[]).slice(3, 14).map((l, i) => <div key={i} style={{ whiteSpace: "pre", color: l.startsWith("-") ? "#ff7b7b" : l.startsWith("+") ? "#7ee787" : "#b9b2d4", background: l.startsWith("-") ? "rgba(255,93,108,.14)" : l.startsWith("+") ? "rgba(61,220,151,.14)" : "none", opacity: pr(f, tA + 36 + i * 3, tA + 44 + i * 3) }}>{l.slice(0, 70)}</div>)}</div></Stage>
      <Note text="Small demo project · one run each · the effect was modest, not a guarantee" a={tA + 20} y={1000} />
    </>); },
  octopus: () => { const f = useCurrentFrame(); const o0 = S0("octopus"); const L = (x: number) => x - o0; const d = D.octo; const tM = L(cue("l07", "multiple")); const tC = L(cue("l07", "compare")); const tR = L(cue("l07", "review")); const tF = L(LN("l07").ef) + 6;
    const pos = [[130, 190], [700, 190], [130, 380], [700, 380]]; const names = d.providers.slice(0, 4); const cols = [K.cyan, K.lime, K.amber, K.violet];
    return (<>
      <div style={{ opacity: 1 - pr(f, tF - 6, tF) }}><Stage a={0} h={560} title="CLAUDE OCTOPUS" badge="ILLUSTRATION · NOT A LIVE RUN" acc={K.violet}>
        <div style={{ position: "absolute", left: 340, top: 270, width: 340, height: 90, borderRadius: 20, background: K.violet + "44", border: `3px solid ${K.violet}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 30, zIndex: 63, boxShadow: `0 0 ${20 + 14 * Math.sin(f / 6)}px ${K.violet}` }}>ONE PROBLEM</div>
        <svg width={1020} height={560} style={{ position: "absolute", left: 0, top: 0 }}>{pos.map(([x, y], i) => { const p = pr(f, tM + i * 8, tM + 20 + i * 8); const x2 = x + 100, y2 = y + 60 + 25; return <g key={i}><line x1={510} y1={315} x2={510 + (x2 - 510) * p} y2={315 + (y2 + (i < 2 ? 0 : -15) - 315) * p} stroke={cols[i]} strokeWidth={4} opacity={0.9} />{p > 0.98 && [0, 1].map((k) => { const t = (((f - tM) * 0.02 + k / 2 + i * 0.2) % 1 + 1) % 1; return <circle key={k} cx={510 + (x2 - 510) * t} cy={315 + (y2 - 315) * t} r={5} fill={cols[i]} />; })}</g>; })}</svg>
        {pos.map(([x, y], i) => <Chip key={i} x={x - 30} y={y + 30 + (i < 2 ? 0 : 40) - 20} w={250} h={80} a={tM + i * 8} c={cols[i]} big={names[i].toUpperCase()} small="optional provider" />)}
        <div style={{ position: "absolute", left: 40, right: 40, top: 470, height: 70, borderRadius: 16, background: "rgba(198,255,61,.12)", border: `2.5px solid ${K.lime}`, opacity: pr(f, tC, tC + 14), display: "flex", alignItems: "center", gap: 18, padding: "0 20px", zIndex: 64 }}>
          <div style={{ fontWeight: 900, fontSize: 24, color: K.lime, letterSpacing: 2 }}>COMPARED RESULTS</div>
          {[0.8, 0.55, 0.7, 0.62].map((v, i) => <div key={i} style={{ flex: 1, height: 18, borderRadius: 9, background: "rgba(255,255,255,.12)" }}><div style={{ width: `${v * 100 * pr(f, tC + 6 + i * 4, tC + 26 + i * 4)}%`, height: "100%", borderRadius: 9, background: cols[i] }} /></div>)}</div>
        <div style={{ position: "absolute", right: 24, top: 410, fontWeight: 900, fontSize: 21, color: K.amber, opacity: pr(f, tR, tR + 12), zIndex: 64 }}>YOU REVIEW THE FINDINGS</div></Stage></div>
      <Stage a={tF} h={520} title="VERIFIED FROM THE REPO README" badge="nyldn/claude-octopus · MIT" acc={K.cyan}>
        <div style={{ position: "absolute", left: 26, top: 64, right: 26 }}>
          {d.install.map((c: string, i: number) => <div key={i} style={{ fontFamily: mono, fontSize: 21, background: "#0c0818", borderRadius: 10, padding: "8px 12px", marginBottom: 10, color: K.lime, opacity: pr(f, tF + 8 + i * 8, tF + 16 + i * 8) }}>{c}</div>)}
          <div style={{ fontWeight: 800, fontSize: 25, lineHeight: 1.35, marginTop: 14, opacity: pr(f, tF + 40, tF + 52) }}>Works with Claude alone. External providers are <span style={{ color: K.amber }}>optional</span>, listed in the README (up to 12). Explicit-only activation.</div></div></Stage>
      <Note text="No live multi-model run was possible here: the network above is an illustration" a={4} y={1000} />
    </>); },
  superpowers: () => { const f = useCurrentFrame(); const o0 = S0("superpowers"); const L = (x: number) => x - o0; const d = D.sp; const tW = L(LN("l09").ef) + 6; const tK = L(LN("l10").sf);
    const steps = [["BRAINSTORM", "brainstorm"], ["PLAN", "plan"], ["TEST", "test"], ["IMPLEMENT", "implement"], ["REVIEW", "review"]]; const cols = [K.cyan, K.violet, K.red, K.lime, K.amber];
    return (<>
      <div style={{ opacity: 1 - pr(f, tW - 6, tW) }}><Stage a={0} h={560} title="SUPERPOWERS · ENGINEERING BLUEPRINT" badge="obra/superpowers · MIT" acc={K.cyan}>
        <div style={{ position: "absolute", left: 30, top: 70, right: 30, fontWeight: 900, fontSize: 40, color: K.red, opacity: 1 - pr(f, L(LN("l09").sf) - 6, L(LN("l09").sf) + 4) }}>{"CODE FIRST ✕  →  UNDERSTAND FIRST ✓"}</div>
        {steps.map(([t, w], i) => <Chip key={t} x={30} y={70 + i * 90} w={600} h={78} a={L(cue("l09", w)) - 4} c={cols[i]} num={`${i + 1}`} big={t} bright={f > L(cue("l09", w)) && f < L(cue("l09", w)) + 36} />)}
        <svg width={1020} height={560} style={{ position: "absolute", left: 0, top: 0 }}>{[0, 1, 2, 3].map((i) => <line key={i} x1={60} y1={148 + i * 90} x2={60} y2={160 + i * 90} stroke={cols[i]} strokeWidth={4} opacity={pr(f, L(cue("l09", steps[i + 1][1])) - 6, L(cue("l09", steps[i + 1][1])))} />)}</svg>
        <div style={{ position: "absolute", right: 30, top: 80, width: 330, height: 360, borderRadius: 16, border: `2px dashed ${K.line}`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontWeight: 800, fontSize: 24, color: K.dim, padding: 20, opacity: pr(f, L(LN("l09").sf) + 10, L(LN("l09").sf) + 24) }}>5 STAGES · each a real skill in the repo</div></Stage></div>
      <Stage a={tW} h={560} title="REAL RUN · ISOLATED DARK-MODE TOGGLE" badge={`MEASURED · ${d.turns} TURNS`} acc={K.lime}>
        <Term x={24} y={62} w={972} h={440} a={tW + 4} title="claude -p --plugin-dir superpowers (haiku)" size={23} lines={[
          { t: `◆ Skill  ${d.skill}`, c: K.cyan, at: tW + 8 }, { t: `● wrote ${d.plan}`, at: tW + 22 }, { t: "● wrote test/ThemeToggle.test.tsx", at: tW + 34 },
          { t: "$ npm test", c: K.lime, at: tW + 46 }, { t: `✕ FAIL  ${d.fail}`, c: "#ff7b7b", at: tW + 54 }, { t: "● implemented src/ThemeToggle.tsx", at: tW + 70 }, { t: "$ npm test", c: K.lime, at: tW + 82 }, { t: `✓ ${d.pass}`, c: "#7ee787", at: tW + 90 }]} /></Stage>
      <Kin text="PLAN BEFORE CODE" a={tK + 4} y={470} size={86} c={K.lime} out={tK + 70} />
    </>); },
  adhd: () => { const f = useCurrentFrame(); const o0 = S0("adhd"); const L = (x: number) => x - o0; const d = D.adhd; const t12 = L(LN("l12").sf); const tC = L(LN("l12").ef) + 6; const t13 = L(LN("l13").sf);
    return (<>
      <div style={{ opacity: 1 - pr(f, tC - 6, tC) }}><Stage a={0} h={560} title="I HAVE ADHD" badge="ayghri/i-have-adhd · MIT" acc={K.amber}>
        <div style={{ position: "absolute", left: 30, top: 70, right: 30, opacity: 1 - pr(f, t12 + 10, t12 + 40) }}>{Array.from({ length: 11 }).map((_, i) => <div key={i} style={{ height: 20, marginBottom: 14, borderRadius: 8, background: "rgba(255,255,255,.18)", width: `${88 - ((i * 37) % 30)}%` }} />)}<div style={{ fontWeight: 900, fontSize: 30, color: K.red, marginTop: 10 }}>AN ENTIRE BOOK …</div></div>
        {["ACTION FIRST", "SHORT STEPS", "EASY TO FOLLOW"].map((t, i) => { const w = ["direct", "structured", "easier"][i]; const at = L(cue("l12", w)); const chk = pr(f, at, at + 12); return <Chip key={t} x={30} y={70 + i * 120} w={960} h={100} a={t12 + 14 + i * 6} c={[K.lime, K.cyan, K.amber][i]} num={f > at ? "✓" : "☐"} big={t} small={i === 0 ? "the answer leads, then the details" : i === 1 ? "numbered, scannable" : "no wall of text"} bright={chk > 0.5} />; })}</Stage></div>
      <Stage a={tC} h={560} title="REAL RUN · WITH vs WITHOUT" badge="MEASURED · 1 QUESTION" acc={K.lime}>
        {[["WITHOUT", d.base, K.red], ["WITH SKILL", d.skill, K.lime]].map(([lab, v, c]: any, i) => <div key={i} style={{ position: "absolute", left: 24 + i * 500, top: 64, width: 480 }}><div style={{ fontWeight: 900, fontSize: 24, color: c, letterSpacing: 2 }}>{lab}</div>
          <div><Cnt to={v.words} a={tC + 10 + i * 8} c={c} size={88} /><span style={{ fontWeight: 800, fontSize: 24, color: K.dim }}> words</span></div>
          <div style={{ fontWeight: 800, fontSize: 24, color: K.dim }}>{v.lines} lines</div>
          <div style={{ fontFamily: mono, fontSize: 17, lineHeight: 1.35, marginTop: 10, background: "#0c0818", borderRadius: 10, padding: "8px 10px", height: 260, overflow: "hidden", color: "#d6d0ee" }}>{(v.head as string[]).slice(0, 4).map((l, k) => <div key={k} style={{ opacity: pr(f, tC + 20 + k * 6, tC + 28 + k * 6), marginBottom: 6 }}>{l.slice(0, 110)}</div>)}</div></div>)}</Stage>
      <Note text="One question · skill text loaded as system prompt · about 7% shorter · it changes style, it is not a medical tool" a={tC + 20} y={1000} />
      <Kin text="ANSWER I CAN USE" a={t13 + 2} y={450} size={66} c={K.lime} out={t13 + 62} />
    </>); },
  recap: () => { const f = useCurrentFrame(); const o0 = S0("recap"); const L = (x: number) => x - o0; const t15 = L(LN("l15").sf);
    const C = [["KARPATHY SKILLS", "Coding discipline", K.lime, "instructions"], ["CLAUDE OCTOPUS", "Multiple perspectives", K.violet, "perspectives"], ["SUPERPOWERS", "Structured development", K.cyan, "planning"], ["I HAVE ADHD", "Clearer communication", K.amber, "answers"]];
    return (<><Stage a={0} h={560} title="THE 4 SKILLS" acc={K.lime}>
      {C.map(([t, s, c, w], i) => { const at = L(cue("l14", w as string)); return <Chip key={t as string} x={24 + (i % 2) * 495} y={70 + Math.floor(i / 2) * 180} w={480} h={150} a={Math.max(0, at - 14)} c={c as string} big={t as string} small={s as string} num={`0${i + 1}`} bright={f > at && f < at + 40} />; })}
      <div style={{ position: "absolute", left: 24, right: 24, top: 440, textAlign: "center", fontWeight: 900, fontSize: 34, color: K.lime, opacity: pr(f, t15 + 8, t15 + 22) }}>BETTER WORKFLOWS → BETTER DEVELOPMENT</div></Stage>
      <Note text="Pick what fits your project: you do not need all four" a={t15 + 20} y={1000} /></>); },
  closing: () => { const f = useCurrentFrame(); const t = LN("l16").sf - S0("closing");
    return (<>
      <Kin text="SAVE THESE 4 TOOLS" a={t + 2} y={440} size={74} c={K.white} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 560, zIndex: 66, fontFamily: sans }}>{[["COMMENT", "“CLAUDE”", K.lime], ["SAVE", "FOR YOUR NEXT PROJECT", K.cyan]].map(([a, b, c], i) => <div key={i} style={{ marginBottom: 14, padding: "14px 22px", borderRadius: 18, background: K.panel, border: `3px solid ${c}`, display: "flex", gap: 14, alignItems: "baseline", opacity: pr(f, t + 20 + i * 14, t + 34 + i * 14), transform: `translateY(${(1 - pr(f, t + 20 + i * 14, t + 34 + i * 14)) * 30}px)` }}><span style={{ fontWeight: 900, fontSize: 34, color: c as string, letterSpacing: 2 }}>{a}</span><span style={{ fontWeight: 900, fontSize: 38, color: K.white }}>{b}</span></div>)}</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 760, height: 96, borderRadius: 48, background: `linear-gradient(90deg, ${K.lime}, ${K.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 900, fontSize: 40, color: "#10081f", zIndex: 66, opacity: pr(f, t + 60, t + 74), transform: `scale(${0.9 + 0.1 * pr(f, t + 60, t + 74)})` }}>FOLLOW @AGENTOON.AI</div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 876, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 24, color: K.dim, letterSpacing: 2, opacity: pr(f, t + 80, t + 94), zIndex: 66 }}>Real AI Tools • Skills • Automation</div>
    </>); },
};

/* ============ captions ============ */
const Caps: React.FC = () => {
  const f = useCurrentFrame(); const idx = WORDS.findIndex((w) => f < w.e); const i = idx < 0 ? WORDS.length - 1 : Math.max(0, idx); const w0 = WORDS[i]; if (f < 3 || f > LN("l16").ef + 12) return null;
  const line = WORDS.filter((w) => w.line === w0.line); const lw = line.indexOf(w0); const chunk = Math.floor(lw / 5) * 5; const shown = line.slice(chunk, chunk + 5); const col = w0.who === "C" ? K.orange : K.cyan;
  return (<div style={{ position: "absolute", left: 30, right: 30, top: 205, height: 190, borderRadius: 28, background: "rgba(10,5,22,.88)", border: `1.5px solid ${K.line}`, zIndex: 95, padding: "16px 26px", boxShadow: "0 16px 40px rgba(0,0,0,.45)" }}>
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
export const Ep30: React.FC = () => (
  <AbsoluteFill style={{ background: K.bg }}>
    <Audio src={staticFile("audio/ep30-mix.wav")} />
    <World />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(20,8,40,0) 40%, rgba(10,4,24,.6) 100%)", zIndex: 50, pointerEvents: "none" }} />
    {SCENES.map((s) => { const O = Ov[s]; return <Sequence key={s} from={S0(s)} durationInFrames={S1(s) - S0(s) + 8} layout="none"><O /></Sequence>; })}
    <div style={{ position: "absolute", left: 40, top: 92, zIndex: 96, fontFamily: sans, fontWeight: 900, fontSize: 30, color: K.white, letterSpacing: 3 }}>AGENTOON<span style={{ color: K.lime }}>.AI</span></div>
    <div style={{ position: "absolute", right: 40, top: 98, zIndex: 96, fontFamily: sans, fontWeight: 800, fontSize: 22, color: K.lime, letterSpacing: 2 }}>EP 04</div>
    <Caps />
    <div style={{ position: "absolute", left: 30, right: 30, top: 1830, textAlign: "center", fontFamily: sans, fontWeight: 600, fontSize: 16, color: "rgba(246,243,255,.6)", zIndex: 96 }}>Agentoon.ai animated interpretation of the Claude Code mascot · not an official Anthropic production · community tools, not official Anthropic or Karpathy projects</div>
  </AbsoluteFill>
);

/* ============ Instagram cover (still) ============ */
export const Ep30Cover: React.FC = () => (
  <AbsoluteFill style={{ background: K.bg }}>
    <Img src={staticFile(PL.B.img)} style={{ position: "absolute", left: 0, top: 120, width: 1080, height: 1920, opacity: 0.55, transform: "scale(1.15)" }} />
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 30%, rgba(139,92,246,.55), rgba(7,4,15,.92) 70%)` }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", fontFamily: sans, fontWeight: 900, color: K.white, letterSpacing: 2 }}>
      <div style={{ fontSize: 112, textShadow: `0 0 40px ${K.violet}` }}>STOP</div><div style={{ fontSize: 112 }}>VIBE CODING</div>
      <div style={{ fontSize: 46, color: K.dim, marginTop: 18 }}>WITHOUT THESE</div><div style={{ fontSize: 210, color: K.lime, lineHeight: 1 }}>4</div><div style={{ fontSize: 96, color: K.lime }}>SKILLS</div></div>
    <div style={{ position: "absolute", left: 60, right: 60, top: 1250, display: "flex", gap: 14 }}>{[["KARPATHY", K.lime], ["OCTOPUS", K.violet], ["SUPERPOWERS", K.cyan], ["ADHD", K.amber]].map(([t, c]) => <div key={t} style={{ flex: 1, padding: "14px 0", textAlign: "center", borderRadius: 16, border: `3px solid ${c}`, background: K.panel, fontFamily: sans, fontWeight: 900, fontSize: 24, color: c as string }}>{t}</div>)}</div>
    <div style={{ position: "absolute", left: 40, top: 92, fontFamily: sans, fontWeight: 900, fontSize: 34, color: K.white, letterSpacing: 3 }}>AGENTOON<span style={{ color: K.lime }}>.AI</span></div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1520, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 28, color: K.dim, letterSpacing: 2 }}>Real AI Tools • Skills • Automation</div>
    <div style={{ position: "absolute", left: 200, bottom: 60, width: 220 }}><ClaudeCover /></div>
  </AbsoluteFill>
);
const ClaudeCover: React.FC = () => <Img src={staticFile("ep27/claude/TALK_cape/000.png")} style={{ width: 300, marginLeft: 380, marginBottom: 0 }} />;
