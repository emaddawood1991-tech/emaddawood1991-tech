import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Robot2, pose2, Gest2 } from "../fx/RobotRig2";
import { clamp } from "../fx/math";
import TL from "../../public/data/ca-timeline.json";

/** Episode 27: "Claude, my social media assistant". PREVIEW.
 *  Engines: Blender 5.3 (office plates + 3D Claude Code mascot sprites, Cycles), Remotion (timeline, 2D robot rig, captions, all graphics).
 *  HONESTY: dashboard / calendar / analytics / research graphics are ILLUSTRATIVE demo graphics (labelled on screen), not real accounts or results. Connector naming is generic (the reference's connector could not be verified).
 *  The Claude mascot is an Agentoon.ai animated interpretation of the Claude Code mascot, not an official Anthropic production. */
export const CA_FRAMES = TL.frames as number;
type Ln = { id: string; who: "A" | "C"; scene: string; sf: number; ef: number };
const LINES = TL.lines as Ln[]; const WORDS = TL.words as { w: string; who: "A" | "C"; line: string; s: number; e: number }[];
const LN = (id: string) => LINES.find((l) => l.id === id)!;
const cue = (id: string, word: string, nth = 0) => { const ws = WORDS.filter((w) => w.line === id); const m = ws.filter((w) => w.w.toLowerCase().replace(/[^a-z0-9@-]/g, "").includes(word.toLowerCase())); return (m[nth] ?? m[0] ?? { s: LN(id).sf }).s; };
const SCENES = ["hook", "problem", "research", "calendar", "connectors", "analytics", "approval", "closing"] as const; type Sc = (typeof SCENES)[number];
const S0 = (s: Sc) => (s === "hook" ? 0 : LINES.find((l) => l.scene === s)!.sf - 5);
const S1 = (s: Sc) => { const i = SCENES.indexOf(s); return i === SCENES.length - 1 ? CA_FRAMES : S0(SCENES[i + 1]); };
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
type Cam = { f: number; s: number; ox: number; oy: number; dx?: number; dy?: number };
const PLATE: Record<Sc, PK> = { hook: "A", problem: "B", research: "A", calendar: "B", connectors: "A", analytics: "B", approval: "A", closing: "A" };
const camKeys = (sc: Sc): Cam[] => {
  const a = S0(sc), b = S1(sc), n = b - a;
  switch (sc) {
    case "hook": return [{ f: 0, s: 1.0, ox: 540, oy: 1150 }, { f: LN("l02").sf - a - 4, s: 1.12, ox: 640, oy: 1180 }, { f: LN("l02").sf - a + 20, s: 1.7, ox: 745, oy: 1200 }, { f: n, s: 1.45, ox: 700, oy: 1200 }];
    case "problem": return [{ f: 0, s: 1.0, ox: 540, oy: 1250 }, { f: n, s: 1.12, ox: 620, oy: 1250 }];
    case "research": return [{ f: 0, s: 1.15, ox: 600, oy: 1200 }, { f: n * 0.4, s: 1.95, ox: 745, oy: 1230 }, { f: n, s: 1.85, ox: 745, oy: 1230 }];
    case "calendar": return [{ f: 0, s: 1.05, ox: 600, oy: 1300 }, { f: n, s: 1.22, ox: 700, oy: 1300 }];
    case "connectors": return [{ f: 0, s: 1.3, ox: 700, oy: 1230 }, { f: n, s: 1.0, ox: 540, oy: 1200 }];
    case "analytics": return [{ f: 0, s: 1.1, ox: 540, oy: 1300 }, { f: n, s: 1.0, ox: 540, oy: 1300 }];
    case "approval": return [{ f: 0, s: 1.0, ox: 540, oy: 1200 }, { f: LN("l14").sf - a, s: 1.75, ox: 540, oy: 1140 }, { f: LN("l15").sf - a - 6, s: 1.8, ox: 700, oy: 1220 }, { f: n, s: 1.3, ox: 620, oy: 1220 }];
    default: return [{ f: 0, s: 1.25, ox: 620, oy: 1200 }, { f: n, s: 1.02, ox: 540, oy: 1200 }];
  }
};
const camAt = (keys: Cam[], f: number) => { let c = keys[0]; for (let i = 0; i < keys.length - 1; i++) { const A = keys[i], B = keys[i + 1]; if (f >= A.f && f <= B.f) { const t = E((f - A.f) / (B.f - A.f)); c = { f, s: A.s + (B.s - A.s) * t, ox: A.ox + (B.ox - A.ox) * t, oy: A.oy + (B.oy - A.oy) * t }; } else if (f > B.f) c = B; } return c; };

/* ============ robot (2D rig, seated) ============ */
const RGEST: Gest2[] = (() => {
  const g: Gest2[] = []; let alt = 0;
  LINES.filter((l) => l.who === "A").forEach((l) => { let t = l.sf + 3; while (t < l.ef - 6) { const len = Math.min(l.ef - t, 38 + (alt % 3) * 10); const type = alt % 3 === 0 ? "explain" : alt % 3 === 1 ? "both" : "present"; g.push({ type, from: t, to: t + len, hand: alt % 2 ? "R" : "L" }); t += len + 3; alt++; } });
  g.push({ type: "point", from: cue("l11", "tools") - 30, to: cue("l11", "tools") + 10, hand: "R", angle: -60 }, { type: "present", from: LN("l18").sf + 10, to: LN("l18").ef, hand: "L" });
  g.push({ type: "invite", from: LN("l16").sf + 8, to: LN("l16").ef + 20 });
  return g;
})();
const RobotLayer: React.FC<{ pk: PK }> = ({ pk }) => {
  const f = useCurrentFrame(); const P = PL[pk].robot; const speaking: [number, number][] = LINES.filter((l) => l.who === "A").map((l) => [l.sf, l.ef + 4]);
  const p = pose2(f, { lip: LA, speaking, gestures: RGEST, walks: [], seed: 11 });
  const frozen = f > LN("l02").ef + 6 && f < LN("l03").sf + 2; if (frozen) { p.mouth = "open"; p.blink = 1; }
  const lean = Math.sin(f / 40) * 0.6; const rK = P.w / 200;
  return (<div style={{ position: "absolute", left: P.cx - P.w / 2, top: P.top, transform: `rotate(${lean}deg)`, transformOrigin: "50% 90%" }}><Robot2 pose={{ ...p, legL: 0, legR: 0 }} width={P.w} shadow={false} />
    <div style={{ position: "absolute", left: 60 * rK, top: 220 * rK, width: 80 * rK, height: 10 * rK, borderRadius: "50%", background: "rgba(0,0,0,.25)", filter: "blur(4px)" }} /></div>);
};

/* ============ Claude (Blender sprites) ============ */
const CLIP_N: Record<string, number> = { IDLE_none: 60, LISTEN_none: 60, TALK_none: 30, TALK_lightbulb: 30, TALK_detective: 30, TALK_calendar: 30, TALK_documents: 30, BOUNCE_none: 24, WAVE_none: 48, CELEBRATE_none: 36, POINT_none: 36, LOOK_none: 60 };
const ACCS: Partial<Record<Sc, string>> = { problem: "lightbulb", research: "detective", calendar: "calendar" };
const accOn = (sc: Sc, f: number): string => { if (sc === "problem") return f >= LN("l04").sf - 2 ? "lightbulb" : "none"; if (sc === "research") return "detective"; if (sc === "calendar") return f >= LN("l07").sf - 2 ? "calendar" : "none"; return "none"; };
const claudeFrame = (f: number): { tag: string; idx: number; acc: string } => {
  const sc = sceneAt(f); const acc = accOn(sc, f); const cl = LINES.find((l) => l.who === "C" && f >= l.sf - 3 && f <= l.ef + 8); const speaking = !!cl && f >= cl.sf - 2 && f <= cl.ef + 2; const env = lipAt(LC, f);
  const loop = (tag: string, k: number) => ({ tag, idx: ((k % CLIP_N[tag]) + CLIP_N[tag]) % CLIP_N[tag], acc });
  const once = (tag: string, k: number) => ({ tag, idx: Math.max(0, Math.min(CLIP_N[tag] - 1, k)), acc });
  if (f >= LN("l02").sf - 2 && f < LN("l02").sf + 24) return once("BOUNCE_none", f - (LN("l02").sf - 2));
  if (f >= LN("l15").sf - 2 && f < LN("l15").sf + 48) return once("WAVE_none", f - (LN("l15").sf - 2));
  if (f >= LN("l09").sf - 2 && f < LN("l09").sf + 24) return once("BOUNCE_none", f - (LN("l09").sf - 2));
  if (f >= LN("l17").sf - 2 && f < LN("l17").ef + 40) return loop("CELEBRATE_none", f - LN("l17").sf);
  if (f >= LN("l11").sf + 120 && f < LN("l11").sf + 156 && sc === "connectors") return once("POINT_none", f - (LN("l11").sf + 120));
  if (acc !== "none") { const tag = `TALK_${acc}`; return speaking && env > 0.1 ? loop(tag, f) : { tag, idx: 0, acc }; }
  if (speaking) return env > 0.1 ? loop("TALK_none", f) : { tag: "TALK_none", idx: 0, acc };
  const rob = LINES.some((l) => l.who === "A" && f >= l.sf - 2 && f <= l.ef); return rob ? loop("LISTEN_none", f) : loop("IDLE_none", f);
};
const ClaudeLayer: React.FC<{ pk: PK }> = ({ pk }) => {
  const f = useCurrentFrame(); const P = PL[pk].claude; const c = claudeFrame(f); const sc = sceneAt(f);
  const chg = Math.min(...[S0(sc), LN("l04").sf, LN("l07").sf].map((t) => Math.abs(f - t))); const pop = 1 + 0.12 * Math.sin(clamp(1 - chg / 12) * Math.PI);
  const bob = Math.sin(f / 18) * 0.012;
  return (<div style={{ position: "absolute", left: P.x - P.size / 2, top: P.feet - 0.81 * P.size, width: P.size, height: P.size, transform: `scale(${pop + bob})`, transformOrigin: "50% 81%", zIndex: 30 }}>
    <div style={{ position: "absolute", left: "12%", right: "12%", top: "76%", height: "9%", borderRadius: "50%", background: "rgba(0,0,0,.35)", filter: "blur(6px)", zIndex: -1 }} />
    <Img src={staticFile(`ep27/claude/${c.tag}/${String(c.idx).padStart(3, "0")}.png`)} style={{ width: P.size, height: P.size, display: "block" }} /></div>);
};

/* ============ screen-space UI helpers ============ */
const Panel: React.FC<{ x: number; y: number; w: number; h: number; a?: number; acc?: string; children?: React.ReactNode; pad?: number; z?: number }> = ({ x, y, w, h, a = 0, acc = K.line, children, pad = 14, z = 60 }) => { const f = useCurrentFrame(); const s = useSp(a, SOFT); return (<div style={{ position: "absolute", left: x, top: y + Math.sin((f + x) / 40) * 3, width: w, height: h, opacity: clamp(s * 1.6), transform: `perspective(1200px) translateZ(${(1 - s) * -200}px) rotateX(${(1 - s) * 14}deg) translateY(${(1 - s) * 30}px)`, borderRadius: 20, background: K.panel, border: `2px solid ${acc}`, boxShadow: "0 18px 40px rgba(0,0,0,.5)", padding: pad, fontFamily: sans, color: K.white, overflow: "hidden", zIndex: z }}>{children}</div>); };
const Label: React.FC<{ text: string; y?: number; a?: number }> = ({ text, y = 1010, a = 20 }) => { const s = useSp(a); return <div style={{ position: "absolute", left: 40, right: 40, top: y, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 21, color: K.amber, letterSpacing: 1.5, opacity: clamp(s * 2), zIndex: 70, textShadow: "0 2px 6px #000" }}>{text}</div>; };
const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; a: number; c?: string; dots?: boolean }> = ({ x1, y1, x2, y2, a, c = K.cyan, dots = true }) => { const f = useCurrentFrame(); const p = pr(f, a, a + 14); return (<svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, zIndex: 58, pointerEvents: "none" }}><line x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={c} strokeWidth={4} strokeLinecap="round" />{dots && f > a + 14 && [0, 1, 2].map((i) => { const t = (((f - a) * 0.014 + i / 3) % 1 + 1) % 1; return <circle key={i} cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r={6} fill={c} opacity={Math.sin(Math.PI * t)} style={{ filter: `drop-shadow(0 0 6px ${c})` }} />; })}</svg>); };
const Node: React.FC<{ x: number; y: number; w: number; h?: number; a: number; label: string; sub?: string; c: string; glyph?: string }> = ({ x, y, w, h = 110, a, label, sub, c, glyph }) => { const s = useSp(a); const f = useCurrentFrame(); const hot = f > a && f < a + 26; return (<div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 20, background: K.panel, border: `${hot ? 4 : 2.5}px solid ${c}`, boxShadow: hot ? `0 0 34px ${c}99` : `0 0 14px ${c}22`, opacity: clamp(s * 1.6), transform: `scale(${0.8 + 0.2 * s})`, fontFamily: sans, color: K.white, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", zIndex: 62 }}>{glyph ? <div style={{ fontSize: 32 }}>{glyph}</div> : null}<div style={{ fontWeight: 900, fontSize: w > 260 ? 32 : 26, letterSpacing: 1 }}>{label}</div>{sub ? <div style={{ fontWeight: 600, fontSize: 18, color: K.dim, marginTop: 2 }}>{sub}</div> : null}</div>); };
const Kin: React.FC<{ text: string; a: number; y: number; size?: number; c?: string; out?: number }> = ({ text, a, y, size = 96, c = K.white, out }) => { const f = useCurrentFrame(); const o = out ? 1 - pr(f, out, out + 8) : 1; return (<div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: size, color: c, letterSpacing: 2, zIndex: 66, opacity: o, textShadow: `0 0 40px ${K.orange}88, 0 5px 0 rgba(0,0,0,.5)` }}>{text.split("").map((ch, i) => { const s = spring({ frame: f - a - i * 1.4, fps: 30, config: { damping: 10, stiffness: 190, mass: 0.6 } }); return <span key={i} style={{ display: "inline-block", whiteSpace: "pre", transform: `perspective(700px) rotateX(${(1 - s) * -70}deg) translateY(${(1 - s) * 40}px)`, opacity: clamp(s * 2) }}>{ch}</span>; })}</div>); };

/* ============ per-scene overlays (local frame = scene frame) ============ */
const Ov: Record<Sc, React.FC<{ a: number }>> = {
  hook: ({ a }) => { const f = useCurrentFrame() + a; const t2 = LN("l02").sf; const pages = Array.from({ length: 18 }, (_, i) => i);
    return (<>
      <Kin text="MY SOCIAL MEDIA" a={a * 0 + 4} y={470} size={74} c={K.white} out={LN("l01").ef - 6} /><Kin text="ASSISTANT" a={10} y={560} size={96} c={K.orange} out={LN("l01").ef - 6} />
      {f > t2 && pages.map((i) => { const t = (f - t2 - 14 - i * 2.2); if (t < 0) return null; const p = clamp(t / 50); const x = 456 + (i - 8.5) * 38 + Math.sin(i * 1.7) * 30, y = 1200 - E(p) * (520 + (i % 5) * 40); return (<div key={i} style={{ position: "absolute", left: x, top: y, width: 70, height: 84, borderRadius: 8, background: "#fff", transform: `rotate(${(i - 8) * 6 + p * 80}deg) scale(${0.4 + p * 0.8})`, opacity: clamp(1.6 - p) * clamp(t / 6), boxShadow: "0 6px 14px rgba(0,0,0,.4)", zIndex: 55 }}><div style={{ height: 20, background: K.red, borderRadius: "8px 8px 0 0" }} /><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 30, color: "#111", textAlign: "center", marginTop: 8 }}>{i + 1}</div></div>); })}
      <Kin text="30 DAYS OF CONTENT?!" a={t2 + 40 - a} y={560} size={84} c={K.amber} />
    </>); },
  problem: ({ a }) => { const f = useCurrentFrame(); void a; const t0 = LN("l03").sf - S0("problem"); const t4 = LN("l04").sf - S0("problem"); const st = ["Research", "Ideas", "Scripts", "Editing", "Captions", "Approval"]; const cs = [K.cyan, K.amber, K.green, K.orange, K.cyan, K.green]; const pos = [[40, 520], [380, 520], [720, 520], [720, 700], [380, 700], [40, 700]];
    return (<><Kin text="THE PROBLEM" a={4} y={430} size={44} c={K.dim} />
      {st.map((s, i) => <Node key={s} x={pos[i][0]} y={pos[i][1]} w={320} h={120} a={t0 + 30 + i * 12} label={s} sub={`step ${i + 1}`} c={cs[i]} />)}
      {[[360, 580, 380, 580], [700, 580, 720, 580], [880, 640, 880, 700], [720, 760, 700, 760], [380, 760, 360, 760]].map(([x1, y1, x2, y2], i) => <Arrow key={i} x1={x1} y1={y1} x2={x2} y2={y2} a={t4 + 10 + i * 10} c={cs[i + 1]} />)}
      <Kin text="AUTOMATE" a={t4 + 70} y={850} size={70} c={K.green} /></>); },
  research: ({ a }) => { void a; const f = useCurrentFrame(); const t6 = LN("l06").sf - S0("research"); const src = ["Your notes", "Sites you connect", "Documents & feeds"]; const ideas = ["Topic idea", "Hook idea", "Series idea", "Caption idea"];
    return (<><Kin text="RESEARCH → IDEAS" a={4} y={430} size={64} c={K.white} />
      {src.map((s, i) => <Node key={s} x={40} y={540 + i * 125} w={330} h={100} a={t6 + 10 + i * 14} label={s} c={K.cyan} glyph={["📝", "🌐", "📄"][i]} />)}
      {[0, 1, 2].map((i) => <Arrow key={i} x1={370} y1={590 + i * 125} x2={480} y2={680} a={t6 + 40 + i * 8} c={K.cyan} />)}
      <Panel x={480} y={590} w={170} h={180} a={t6 + 40} acc={K.amber}><div style={{ fontWeight: 900, fontSize: 26, color: K.amber, textAlign: "center" }}>CLAUDE</div><div style={{ fontSize: 56, textAlign: "center" }}>🔎</div><div style={{ fontSize: 17, color: K.dim, textAlign: "center" }}>organizes topics</div></Panel>
      {ideas.map((s, i) => { const p = pr(f, t6 + 90 + i * 14, t6 + 110 + i * 14); return <div key={s} style={{ position: "absolute", left: 700 + (i % 2) * 175, top: 560 + Math.floor(i / 2) * 120, width: 160, height: 100, borderRadius: 16, background: "#fff", color: "#111", fontFamily: sans, fontWeight: 900, fontSize: 22, padding: "30px 8px", textAlign: "center", opacity: p, transform: `translateX(${(1 - p) * -120}px) rotate(${(1 - p) * -12 + (i % 2 ? 2 : -2)}deg) scale(${0.6 + 0.4 * p})`, boxShadow: "0 10px 22px rgba(0,0,0,.45)", zIndex: 64 }}>{s}</div>; })}
      <Label text="ILLUSTRATIVE · no real trends or analytics are shown" a={t6 + 30} y={960} /></>); },
  calendar: ({ a }) => { void a; const f = useCurrentFrame(); const t7 = LN("l07").sf - S0("calendar"); const t9 = LN("l09").sf - S0("calendar"); const days = Array.from({ length: 30 }, (_, i) => i); const st = [K.green, K.amber, K.cyan];
    return (<><Panel x={40} y={430} w={1000} h={540} a={4} acc={K.orange} pad={12}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", fontFamily: sans }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: K.orange }} /><div style={{ fontWeight: 900, fontSize: 30 }}>One month of content</div><div style={{ marginLeft: "auto", fontSize: 18, color: K.dim }}>Topic · Script · Caption · Video · Date · Approval</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginTop: 12 }}>{days.map((d) => { const p = pr(f, t7 + 20 + d * 3.2, t7 + 34 + d * 3.2); const c = st[d % 3]; const appr = f > t9 + 14 + d * 1.5 && d < 10; return <div key={d} style={{ height: 78, borderRadius: 10, background: "rgba(255,255,255,.06)", border: `1.5px solid ${p > 0.5 ? c : K.line}`, position: "relative", overflow: "hidden", fontFamily: sans }}><div style={{ position: "absolute", left: 6, top: 3, fontSize: 14, color: K.dim, fontWeight: 700 }}>{d + 1}</div><div style={{ position: "absolute", left: 6, right: 6, bottom: 6, height: 38 * p, borderRadius: 7, background: c + "cc", opacity: p, fontSize: 13, fontWeight: 800, color: "#041", padding: "3px 5px" }}>{["Topic", "Script", "Caption"][d % 3]}</div>{appr ? <div style={{ position: "absolute", right: 5, top: 3, fontSize: 16, color: K.green }}>✓</div> : null}</div>; })}</div></Panel>
      <Label text="DEMO DASHBOARD · illustrative, not a real month of finished videos" a={t7 + 10} y={985} /></>); },
  connectors: ({ a }) => { void a; const t11 = LN("l11").sf - S0("connectors"); const t = (w: string) => cue("l11", w) - S0("connectors"); const nodes = [{ l: "Claude", c: K.amber, x: 40, y: 480 }, { l: "Authorized connectors", c: K.orange, x: 380, y: 480 }, { l: "Research tools", c: K.cyan, x: 720, y: 480 }, { l: "Content workspace", c: K.green, x: 380, y: 680 }, { l: "Approval", c: K.green, x: 720, y: 680 }]; const at = [t11 + 2, t("connectors") - 4, t("skills") - 4, t("workflows") - 4, t("authorized") - 4];
    return (<><Kin text="HOW IT CONNECTS" a={4} y={415} size={44} c={K.dim} />
      {nodes.map((n, i) => <Node key={n.l} x={n.x} y={n.y} w={320} h={120} a={at[i]} label={n.l} c={n.c} />)}
      <Arrow x1={360} y1={540} x2={380} y2={540} a={at[1]} c={K.amber} /><Arrow x1={700} y1={540} x2={720} y2={540} a={at[2]} c={K.orange} /><Arrow x1={880} y1={600} x2={560} y2={680} a={at[3]} c={K.cyan} /><Arrow x1={700} y1={740} x2={720} y2={740} a={at[4]} c={K.green} />
      <Panel x={40} y={830} w={1000} h={120} a={at[4] + 20} acc={K.line}><div style={{ fontWeight: 800, fontSize: 24, color: K.amber }}>Capabilities depend on</div><div style={{ fontWeight: 700, fontSize: 24, marginTop: 6 }}>the connected services · permissions · configuration</div></Panel>
      <Label text="GENERIC ARCHITECTURE · connector names and features vary by service" a={at[4] + 30} y={975} /></>); },
  analytics: ({ a }) => { void a; const f = useCurrentFrame(); const t13 = LN("l13").sf - S0("analytics"); const m = [["Views", 12480, K.cyan], ["Engagement", 8.4, K.green], ["Saves", 940, K.amber], ["Shares", 312, K.orange]] as const; const bars = [["Topic A", 0.9], ["Topic B", 0.55], ["Topic C", 0.72], ["Topic D", 0.35]] as const;
    return (<><Kin text="ANALYTICS" a={4} y={415} size={44} c={K.dim} />
      {m.map(([n, v, c], i) => { const p = pr(f, t13 + 6 + i * 12, t13 + 50 + i * 12); const val = n === "Engagement" ? (v * p).toFixed(1) + "%" : Math.round(v * p).toLocaleString("en-US"); return <Panel key={n} x={40 + (i % 2) * 505} y={470 + Math.floor(i / 2) * 150} w={495} h={135} a={t13 - 10 + i * 10} acc={c}><div style={{ fontWeight: 800, fontSize: 22, color: c, letterSpacing: 2 }}>{n.toUpperCase()}</div><div style={{ fontWeight: 900, fontSize: 64, marginTop: 4 }}>{val}</div></Panel>; })}
      <Panel x={40} y={780} w={1000} h={190} a={t13 + 40} acc={K.line}><div style={{ fontWeight: 800, fontSize: 20, color: K.dim, letterSpacing: 2 }}>WHICH TOPICS PERFORM BEST</div><div style={{ display: "flex", gap: 14, alignItems: "flex-end", height: 120, marginTop: 8 }}>{bars.map(([n, v], i) => { const p = pr(f, t13 + 60 + i * 8, t13 + 90 + i * 8); return <div key={n} style={{ flex: 1, textAlign: "center", fontFamily: sans, fontSize: 18, color: K.dim }}><div style={{ height: 100 * v * p, background: [K.cyan, K.amber, K.green, K.orange][i], borderRadius: 8, marginBottom: 4 }} />{n}</div>; })}</div></Panel>
      <Label text="DEMO DATA · not Agentoon.ai results · needs your connected analytics tools" a={t13} y={985} /></>); },
  approval: ({ a }) => { void a; const f = useCurrentFrame(); const t15 = LN("l15").sf - S0("approval"); const st = ["DRAFT", "REVIEW", "APPROVED", "SCHEDULED"]; const cs = [K.dim, K.amber, K.green, K.cyan]; const prog = clamp((f - (t15 + 40)) / 120) * 3;
    return (<><Kin text="YOU APPROVE" a={LN("l14").sf - S0("approval") + 20} y={440} size={72} c={K.white} />
      {st.map((s, i) => <Node key={s} x={40 + i * 255} y={600} w={235} h={100} a={LN("l14").sf - S0("approval") + 40 + i * 10} label={s} c={cs[i]} />)}
      {[0, 1, 2].map((i) => <Arrow key={i} x1={275 + i * 255} y1={650} x2={295 + i * 255} y2={650} a={LN("l14").sf - S0("approval") + 70 + i * 10} c={cs[i + 1]} dots={false} />)}
      <div style={{ position: "absolute", left: 60 + prog * 255, top: 730, width: 195, height: 110, borderRadius: 16, background: "#fff", color: "#111", fontFamily: sans, fontWeight: 900, fontSize: 24, padding: "14px 12px", textAlign: "center", zIndex: 64, boxShadow: "0 12px 24px rgba(0,0,0,.5)", opacity: pr(f, t15 + 30, t15 + 40) }}>Post #1<div style={{ fontSize: 16, color: "#555", marginTop: 6 }}>{st[Math.min(3, Math.round(prog))].toLowerCase()}</div></div>
      <Label text="Nothing is published automatically · the creator approves" a={t15 + 120} y={880} /></>); },
  closing: ({ a }) => { void a; const f = useCurrentFrame(); const t17 = LN("l17").sf - S0("closing"); const tEnd = LN("l18").sf - S0("closing");
    return (<><Kin text="YOUR IDEAS." a={t17} y={470} size={92} c={K.white} /><Kin text="AI-POWERED WORKFLOW." a={t17 + 24} y={580} size={64} c={K.amber} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 720, height: 100, borderRadius: 50, background: `linear-gradient(90deg, ${K.orange}, ${K.amber})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 900, fontSize: 42, color: "#1a0d05", zIndex: 66, opacity: pr(f, tEnd - 6, tEnd + 8), transform: `scale(${0.9 + 0.1 * pr(f, tEnd - 6, tEnd + 10)})` }}>FOLLOW @AGENTOON.AI</div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 838, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 24, color: K.dim, letterSpacing: 2, opacity: pr(f, tEnd + 6, tEnd + 20), zIndex: 66 }}>Real AI Tools • Skills • Automation</div></>); },
};

/* ============ captions ============ */
const Caps: React.FC = () => {
  const f = useCurrentFrame(); const idx = WORDS.findIndex((w) => f < w.e); const i = idx < 0 ? WORDS.length - 1 : Math.max(0, idx); const w0 = WORDS[i]; if (f < 3 || f > LN("l18").ef + 10) return null;
  const line = WORDS.filter((w) => w.line === w0.line); const lw = line.indexOf(w0); const chunk = Math.floor(lw / 5) * 5; const shown = line.slice(chunk, chunk + 5); const col = w0.who === "C" ? K.orange : K.cyan;
  return (<div style={{ position: "absolute", left: 30, right: 30, top: 205, height: 190, borderRadius: 28, background: "rgba(5,8,14,.86)", border: `1.5px solid ${K.line}`, zIndex: 95, padding: "16px 26px", boxShadow: "0 16px 40px rgba(0,0,0,.45)" }}>
    <div style={{ display: "inline-block", background: col, color: w0.who === "C" ? "#fff" : "#04202a", fontFamily: sans, fontWeight: 900, fontSize: 24, padding: "2px 16px", borderRadius: 10, letterSpacing: 2 }}>{w0.who === "C" ? "CLAUDE" : "AGENTOON"}</div>
    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: "2px 12px", fontFamily: sans, fontWeight: 900, fontSize: 52, color: "#fff", lineHeight: 1.1 }}>
      {shown.map((w, q) => { const act = chunk + q === lw; const p = act ? spring({ frame: f - w.s, fps: 30, config: { damping: 11, stiffness: 220, mass: 0.7 } }) : 1; return <span key={w.s + "_" + q} style={{ padding: "0 8px", borderRadius: 10, background: act ? col : "transparent", color: act ? (w0.who === "C" ? "#fff" : "#04202a") : "#fff", transform: `scale(${act ? 0.92 + 0.08 * p : 1})`, display: "inline-block" }}>{w.w}</span>; })}</div></div>);
};

/* ============ world ============ */
const World: React.FC = () => {
  const f = useCurrentFrame(); const sc = sceneAt(f); const a = S0(sc), b = S1(sc); const lf = f - a; const pk = PLATE[sc]; const P = PL[pk]; const c = camAt(camKeys(sc), lf);
  const IN = 12; const tin = E(lf / IN), tout = E((f - (b - 6)) / 6); const op = 0.55 + 0.45 * tin; void tout;
  return (<div style={{ position: "absolute", inset: 0, opacity: op, transform: `scale(${c.s})`, transformOrigin: `${c.ox}px ${c.oy}px`, filter: lf < IN ? `blur(${(1 - tin) * 8}px)` : undefined }}>
    <Img src={staticFile(P.img)} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
    <RobotLayer pk={pk} />
    <Img src={staticFile(P.fg)} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, zIndex: 20 }} />
    <ClaudeLayer pk={pk} />
  </div>);
};
export const ClaudeAssistant: React.FC = () => (
  <AbsoluteFill style={{ background: K.bg }}>
    <Audio src={staticFile("audio/ca-mix.wav")} />
    <World />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 45%, rgba(0,0,0,.45) 100%)", zIndex: 50, pointerEvents: "none" }} />
    {SCENES.map((s) => { const O = Ov[s]; return <Sequence key={s} from={S0(s)} durationInFrames={S1(s) - S0(s) + 8} layout="none"><O a={S0(s)} /></Sequence>; })}
    <div style={{ position: "absolute", left: 40, top: 92, zIndex: 96, fontFamily: sans, fontWeight: 900, fontSize: 30, color: K.white, letterSpacing: 3 }}>AGENTOON<span style={{ color: K.cyan }}>.AI</span></div>
    <Caps />
    <div style={{ position: "absolute", left: 30, right: 30, top: 1830, textAlign: "center", fontFamily: sans, fontWeight: 600, fontSize: 16, color: "rgba(244,247,251,.6)", zIndex: 96 }}>Agentoon.ai animated interpretation of the Claude Code mascot · not an official Anthropic production · demo graphics</div>
  </AbsoluteFill>
);
