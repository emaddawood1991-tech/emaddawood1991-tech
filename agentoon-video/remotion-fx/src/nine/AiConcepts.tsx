import React from "react";
import { AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Robot2, pose2, Gest2, Walk, walkDistance } from "../fx/RobotRig2";
import { clamp, rng } from "../fx/math";
import TL from "../../public/data/ac-timeline.json";
import TOK from "../../public/data/ac-tokens.json";

/** Episode 25: 8 AI concepts in 90 seconds. Original Agentoon.ai production (Remotion). Real material: token splits are produced by the real o200k_base tokenizer (gpt-tokenizer, run locally).
 *  Everything else is an explanatory animation, labelled ILLUSTRATIVE / SIMPLIFIED where it is not real data. 3D = own perspective projection (not three.js). */
export const AC_FRAMES = TL.frames as number;
type Ln = { id: string; sf: number; ef: number };
const LINES = TL.lines as Ln[]; const WORDS = TL.words as { w: string; line: string; s: number; e: number }[];
const LN = (id: string) => LINES.find((l) => l.id === id)!;
const IDS = ["hook", "llm", "api", "tokens", "ft", "rag", "emb", "dev", "all", "cta"] as const; type Id = (typeof IDS)[number];
const S0 = (id: Id) => (id === "hook" ? 0 : LN(id).sf - 4);
const S1 = (id: Id) => { const i = IDS.indexOf(id); return i === IDS.length - 1 ? AC_FRAMES : S0(IDS[i + 1]); };
const cue = (id: string, word: string, nth = 0) => { const ws = WORDS.filter((w) => w.line === id); const m = ws.filter((w) => w.w.toLowerCase().replace(/[^a-z0-9@-]/g, "").includes(word.toLowerCase())); return (m[nth] ?? m[0] ?? { s: LN(id).sf }).s; };
const tc = (id: Id, word: string, nth = 0) => cue(id, word, nth) - S0(id); // local frame of a spoken word

const K = { bg: "#05080E", panel: "rgba(13,20,33,.9)", line: "rgba(255,255,255,.14)", green: "#3DDC97", cyan: "#38D6F5", orange: "#FF9A3C", white: "#F4F7FB", dim: "#8A97AD", red: "#FF5D6C" };
const ACC: Record<Id, string> = { hook: K.cyan, llm: K.cyan, api: K.orange, tokens: K.green, ft: K.orange, rag: K.cyan, emb: K.green, dev: K.orange, all: K.green, cta: K.cyan };
const sans = '"Inter","DejaVu Sans",Arial,sans-serif'; const mono = '"DejaVu Sans Mono",ui-monospace,Menlo,monospace';
const POP = { damping: 13, stiffness: 150, mass: 0.8 }; const SOFT = { damping: 22, stiffness: 100, mass: 1 };
const E = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
const pr = (f: number, a: number, b: number) => E((f - a) / (b - a));
const useSp = (a: number, cfg = POP) => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return spring({ frame: f - a, fps, config: cfg }); };

/* ============ robot ============ */
const RW = 340, RK = RW / 200, FLOORY = 1630; const ROBOT_TOP = FLOORY - RW * 1.4 * (272 / 280);
const LEFT = 30, RIGHT = 700, CENTER = 370;
const SIDE: Record<Id, number> = { hook: CENTER, llm: LEFT, api: RIGHT, tokens: LEFT, ft: RIGHT, rag: LEFT, emb: RIGHT, dev: CENTER, all: LEFT, cta: CENTER };
type WSeg = { w: Walk; dir: 1 | -1; x0: number; x1: number };
const fitWalk = (from: number, need: number): Walk => { let to = from + 24; const mk = (): Walk => ({ from, to, ramp: 12, amp: 30, stepsPerSec: 2.5 }); while (walkDistance(to, mk()) * RK < need) to++; return mk(); };
const WSEGS: WSeg[] = (() => { const out: WSeg[] = []; let x = -RW - 20; IDS.forEach((id) => { const target = SIDE[id]; const need = Math.abs(target - x); const from = id === "hook" ? 4 : S0(id) + 3; if (need < 6 && id !== "hook") return; const w = fitWalk(from, need); const d = walkDistance(w.to, w) * RK * (target >= x ? 1 : -1); out.push({ w, dir: target >= x ? 1 : -1, x0: x, x1: x + d }); x += d; }); return out; })();
const robotX = (f: number) => { let x = WSEGS[0].x0; for (const s of WSEGS) { if (f < s.w.from) return x; if (f >= s.w.to) { x = s.x1; continue; } return s.x0 + s.dir * walkDistance(f, s.w) * RK; } return x; };
const facing = (f: number) => { for (const s of WSEGS) if (f >= s.w.from && f <= s.w.to + 2) return s.dir; return 1; };
const POINTS: Partial<Record<Id, string[]>> = { hook: ["eight", "ninety"], llm: ["large", "language", "recognize", "generate", "predicts"], api: ["applications", "request", "answer"], tokens: ["pieces", "part", "limits", "costs"], ft: ["continues", "selected", "particular", "itself"], rag: ["retrieve", "external", "generating", "retrained"], emb: ["numerical", "compare", "similar"], dev: ["developers", "engineers", "overlap"], all: ["app", "api", "tokens", "llm", "rag", "embeddings", "fine"] };
const buildGestures = (): Gest2[] => {
  const gs: Gest2[] = []; let alt = 0;
  IDS.forEach((id) => {
    const a = S0(id), b = S1(id), side = SIDE[id]; const hand: "L" | "R" = side >= RIGHT ? "L" : "R"; const ang = side >= RIGHT ? 74 : -72;
    const walkEnd = WSEGS.filter((s) => s.w.from >= a - 2 && s.w.from < b).reduce((m, s) => Math.max(m, s.w.to), a);
    let cur = walkEnd + 4; const pts = (POINTS[id] ?? []).map((w) => cue(id, w) - 6).filter((t) => t > cur).sort((p, q) => p - q);
    if (id === "cta") { gs.push({ type: "present", from: cur, to: cur + 60, hand: "R" }, { type: "both", from: cur + 62, to: cur + 100 }, { type: "invite", from: cur + 102, to: b }); return; }
    const fill = (from: number, to: number) => { let t = from; while (t < to - 14) { const len = Math.min(to - t, 40 + (alt % 3) * 14); const type = alt % 3 === 0 ? "explain" : alt % 3 === 1 ? "present" : "both"; gs.push({ type, from: t, to: t + len, hand: alt % 2 ? "R" : "L" }); t += len + 2; alt++; } };
    for (const p of pts) { if (p - cur > 16) fill(cur, p - 2); const to = Math.min(b, p + 44); if (to - p > 10) gs.push({ type: "point", from: p, to, hand, angle: ang }); cur = Math.max(cur, to + 2); }
    fill(cur, b);
  });
  return gs;
};
const GESTS = buildGestures();
const LIPA = TL.lip as { fps: number; a: number[] };
const RobotLayer: React.FC = () => {
  const f = useCurrentFrame(); const x = robotX(f); const speaking: [number, number][] = LINES.map((l) => [l.sf, l.ef + 4]);
  const p = pose2(f, { lip: LIPA, speaking, gestures: GESTS, walks: WSEGS.map((s) => s.w), seed: 5 });
  const fl = facing(f) === -1;
  return (<>
    <div style={{ position: "absolute", left: x - 40, top: FLOORY - 56, width: RW + 80, height: 110, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(56,214,245,.28) 0%, rgba(56,214,245,0) 70%)", zIndex: 58 }} />
    <div style={{ position: "absolute", left: x, top: ROBOT_TOP, zIndex: 60 }}><Robot2 pose={p} width={RW} shadow={false} flip={fl} rim /></div></>);
};

/* ============ background / chrome ============ */
const Background: React.FC = () => {
  const f = useCurrentFrame(); const r = rng(11); const idx = IDS.findIndex((id, i) => f >= S0(id) && f < S1(id)); const acc = ACC[IDS[Math.max(0, idx)]];
  const pts = Array.from({ length: 46 }, () => ({ x: r() * 1080, y: r() * 1500 + 150, s: 1 + r() * 2.6, p: r() * 6, sp: 0.004 + r() * 0.01 }));
  const off = (f * 0.9) % 60;
  return (<AbsoluteFill style={{ background: `radial-gradient(1100px 900px at 50% 24%, #101d33 0%, #070c15 58%, ${K.bg} 100%)` }}>
    <div style={{ position: "absolute", left: -200, top: 120, width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${acc}33 0%, ${acc}00 66%)`, transform: `translate(${Math.sin(f / 90) * 40}px,${Math.cos(f / 110) * 30}px)` }} />
    <div style={{ position: "absolute", right: -260, top: 560, width: 760, height: 760, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,154,60,.16) 0%, rgba(255,154,60,0) 66%)", transform: `translate(${Math.cos(f / 100) * 40}px,${Math.sin(f / 80) * 30}px)` }} />
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: 14 }, (_, i) => { const y = 1420 + Math.pow((i * 60 + off) / 840, 1.8) * 500; return <line key={"h" + i} x1={0} x2={1080} y1={y} y2={y} stroke="rgba(56,214,245,.12)" strokeWidth={1.5} />; })}
      {Array.from({ length: 17 }, (_, i) => { const x0 = 540 + (i - 8) * 120; return <line key={"v" + i} x1={540 + (x0 - 540) * 0.18} y1={1420} x2={540 + (x0 - 540) * 3.2} y2={1920} stroke="rgba(56,214,245,.1)" strokeWidth={1.5} />; })}
      {[0, 1].map((side) => Array.from({ length: 11 }, (_, i) => { const x = side ? 1080 - 26 : 8; const y = 470 + i * 78; const on = Math.sin(f / 9 + i * 1.7 + side * 3) > 0.1; return <g key={side + "_" + i}><rect x={x} y={y} width={18} height={46} rx={5} fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.12)" /><circle cx={x + 9} cy={y + 12} r={3.5} fill={on ? acc : "rgba(255,255,255,.14)"} /><circle cx={x + 9} cy={y + 31} r={3.5} fill={Math.sin(f / 13 + i) > 0.4 ? K.orange : "rgba(255,255,255,.14)"} /></g>; }))}
      {pts.map((p, i) => <circle key={i} cx={p.x + Math.sin(f * p.sp + p.p) * 24} cy={p.y - ((f * p.sp * 40 + p.p * 60) % 160) + 60} r={p.s} fill={i % 5 === 0 ? K.orange : K.cyan} opacity={0.35 + 0.35 * Math.sin(f / 20 + p.p)} />)}
    </svg></AbsoluteFill>);
};
const NAMES = ["", "LLM", "API", "TOKENS", "FINE-TUNING", "RAG", "EMBEDDINGS", "DEVELOPER VS ENGINEER", "HOW IT CONNECTS"];
const Header: React.FC = () => {
  const f = useCurrentFrame(); const i = IDS.findIndex((id) => f >= S0(id) && f < S1(id)); const k = Math.max(0, Math.min(8, i)); const a0 = S0(IDS[Math.max(0, i)]);
  const s = spring({ frame: f - a0, fps: 30, config: POP }); const acc = ACC[IDS[Math.max(0, i)]]; if (i === 0 || i === 9) return (<div style={{ position: "absolute", left: 40, top: 92, zIndex: 96, fontFamily: sans, fontWeight: 900, fontSize: 30, color: K.white, letterSpacing: 3, opacity: 0.9 }}>AGENTOON<span style={{ color: K.cyan }}>.AI</span></div>);
  return (<div style={{ position: "absolute", left: 40, right: 40, top: 86, height: 100, zIndex: 96, fontFamily: sans }}>
    <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: clamp(s * 1.5), transform: `translateX(${(1 - s) * -40}px)` }}>
      <div style={{ fontWeight: 900, fontSize: 64, color: acc, lineHeight: 1 }}>{String(k).padStart(2, "0")}</div>
      <div style={{ fontWeight: 900, fontSize: 38, color: K.white, letterSpacing: 2 }}>{NAMES[k]}</div>
      <div style={{ marginLeft: "auto", fontWeight: 800, fontSize: 24, color: K.dim, letterSpacing: 2 }}>AGENTOON<span style={{ color: K.cyan }}>.AI</span></div></div>
    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>{Array.from({ length: 8 }, (_, j) => <div key={j} style={{ height: 7, flex: 1, borderRadius: 4, background: j < k ? acc : j === k - 1 ? acc : "rgba(255,255,255,.14)", opacity: j < k ? 1 : 0.7 }} />)}</div></div>);
};
const Caps: React.FC = () => {
  const f = useCurrentFrame(); const idx = WORDS.findIndex((w) => f < w.e); const i = idx < 0 ? WORDS.length - 1 : Math.max(0, idx); const w0 = WORDS[i]; if (f < 3) return null;
  const line = WORDS.filter((w) => w.line === w0.line); const lw = line.indexOf(w0); const chunk = Math.floor(lw / 5) * 5; const shown = line.slice(chunk, chunk + 5); const acc = ACC[w0.line as Id];
  return (<div style={{ position: "absolute", left: 30, right: 30, top: 205, height: 190, borderRadius: 28, background: "rgba(5,8,14,.82)", border: `1.5px solid ${K.line}`, zIndex: 95, padding: "22px 26px", boxShadow: "0 16px 40px rgba(0,0,0,.45)", display: "flex", alignItems: "center" }}>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontFamily: sans, fontWeight: 900, fontSize: 56, color: "#fff", lineHeight: 1.1 }}>
      {shown.map((w, k) => { const act = chunk + k === lw; const p = act ? spring({ frame: f - w.s, fps: 30, config: { damping: 11, stiffness: 220, mass: 0.7 } }) : 1; return <span key={w.s + "_" + k} style={{ padding: "0 10px", borderRadius: 10, background: act ? acc : "transparent", color: act ? K.bg : "#fff", transform: `scale(${act ? 0.92 + 0.08 * p : 1})`, display: "inline-block" }}>{w.w}</span>; })}</div></div>);
};

/* ============ scene wrapper: stage + transitions + push-in ============ */
const Stage: React.FC<{ id: Id; children: React.ReactNode; full?: boolean }> = ({ id, children, full }) => {
  const f = useCurrentFrame(); const a = S0(id), b = S1(id); const p = E(f / 14), q = E((f - (b - a)) / 12); const sc = 1 + 0.04 * clamp(f / (b - a));
  const dx = (1 - p) * 110 - q * 110; const blur = (1 - p) * 10 + q * 10; const op = clamp(p * 1.4) * (1 - q);
  return (<div style={{ position: "absolute", left: 0, top: full ? 0 : 420, width: 1080, height: full ? 1920 : 720, transform: `translateX(${dx}px) scale(${sc})`, transformOrigin: "50% 50%", filter: blur > 0.2 ? `blur(${blur}px)` : undefined, opacity: op, zIndex: 40 }}>{children}</div>);
};
const SideCard: React.FC<{ id: Id; label: string; text: string; sub?: string; a?: number }> = ({ id, label, text, sub, a = 40 }) => {
  const s = useSp(a, SOFT); const left = SIDE[id] <= LEFT; const x = left ? 410 : 40; const acc = ACC[id];
  return (<div style={{ position: "absolute", left: x, top: 1210, width: 630, minHeight: 240, zIndex: 70, opacity: clamp(s * 1.6), transform: `translateX(${(1 - s) * (left ? 80 : -80)}px)`, borderRadius: 24, background: K.panel, border: `1.5px solid ${acc}88`, boxShadow: `0 0 40px ${acc}22, 0 18px 40px rgba(0,0,0,.5)`, padding: "22px 28px", fontFamily: sans }}>
    <div style={{ fontWeight: 800, fontSize: 24, color: acc, letterSpacing: 3 }}>{label}</div>
    <div style={{ fontWeight: 900, fontSize: 40, color: K.white, lineHeight: 1.15, marginTop: 8 }}>{text}</div>
    {sub ? <div style={{ fontWeight: 600, fontSize: 26, color: K.dim, marginTop: 10, lineHeight: 1.25 }}>{sub}</div> : null}</div>);
};
const Panel: React.FC<{ x: number; y: number; w: number; h: number; a?: number; acc?: string; children?: React.ReactNode; style?: React.CSSProperties; pad?: number }> = ({ x, y, w, h, a = 0, acc = K.line, children, style, pad = 16 }) => {
  const f = useCurrentFrame(); const s = useSp(a); return (<div style={{ position: "absolute", left: x, top: y + Math.sin((f + x) / 40) * 3, width: w, height: h, opacity: clamp(s * 1.6), transform: `scale(${0.9 + 0.1 * s}) translateY(${(1 - s) * 26}px)`, borderRadius: 22, background: K.panel, border: `2px solid ${acc}`, boxShadow: "0 18px 40px rgba(0,0,0,.45)", padding: pad, fontFamily: sans, color: K.white, overflow: "hidden", ...style }}>{children}</div>);
};
const Tag: React.FC<{ x: number; y: number; text: string; a: number; c?: string; size?: number }> = ({ x, y, text, a, c = K.dim, size = 22 }) => { const s = useSp(a); return <div style={{ position: "absolute", left: x, top: y, fontFamily: sans, fontWeight: 800, fontSize: size, color: c, letterSpacing: 2, opacity: clamp(s * 2) }}>{text}</div>; };
const Note: React.FC<{ text: string; a?: number; y?: number }> = ({ text, a = 20, y = 690 }) => { const s = useSp(a); return <div style={{ position: "absolute", left: 40, right: 40, top: y, textAlign: "center", fontFamily: sans, fontWeight: 700, fontSize: 21, color: K.dim, letterSpacing: 1, opacity: clamp(s * 2) }}>{text}</div>; };
const Draw: React.FC<{ d: string; a: number; len?: number; c?: string; w?: number; dash?: string; arrow?: boolean }> = ({ d, a, len = 18, c = K.cyan, w = 4, dash }) => { const f = useCurrentFrame(); const p = pr(f, a, a + len); return <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray={dash ?? "1"} strokeDashoffset={dash ? 0 : 1 - p} opacity={dash ? p : 1} />; };
const Dots: React.FC<{ x1: number; y1: number; x2: number; y2: number; a: number; n?: number; c?: string; sp?: number; r?: number }> = ({ x1, y1, x2, y2, a, n = 4, c = K.orange, sp = 0.012, r = 7 }) => { const f = useCurrentFrame(); if (f < a) return null; return (<>{Array.from({ length: n }, (_, i) => { const t = (((f - a) * sp + i / n) % 1 + 1) % 1; const o = Math.sin(Math.PI * t); return <circle key={i} cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r={r} fill={c} opacity={o} style={{ filter: `drop-shadow(0 0 8px ${c})` }} />; })}</>); };
const proj = (p: [number, number, number], ry: number, rx: number, d: number, cx: number, cy: number) => { const [x, y, z] = p; const c = Math.cos(ry), s = Math.sin(ry); const X = x * c + z * s; let Z = -x * s + z * c; const c2 = Math.cos(rx), s2 = Math.sin(rx); const Y = y * c2 - Z * s2; Z = y * s2 + Z * c2; const k = d / (d + Z); return { x: cx + X * k, y: cy + Y * k, k, z: Z }; };

/* ============ scenes ============ */
const Hook: React.FC = () => {
  const f = useCurrentFrame(); const tt = (w: string) => tc("hook", w); const ring = Array.from({ length: 8 }, (_, i) => i);
  return (<Stage id="hook" full>
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <g transform={`translate(540,800) rotate(${f * 0.35})`}><circle r={330} fill="none" stroke={K.cyan} strokeWidth={2} strokeDasharray="6 14" opacity={0.6} /><circle r={390} fill="none" stroke={K.orange} strokeWidth={1.5} strokeDasharray="2 18" opacity={0.5} /></g>
      {ring.map((i) => { const ang = (i / 8) * Math.PI * 2 - Math.PI / 2 + f * 0.0035; const s = pr(f, 12 + i * 5, 26 + i * 5); const x = 540 + Math.cos(ang) * 330 * (0.6 + 0.4 * s), y = 800 + Math.sin(ang) * 330 * (0.6 + 0.4 * s); return <g key={i} opacity={s}><circle cx={x} cy={y} r={30} fill={K.panel} stroke={i % 2 ? K.orange : K.cyan} strokeWidth={3} /><text x={x} y={y + 11} textAnchor="middle" fontFamily={sans} fontWeight={900} fontSize={30} fill={K.white}>{i + 1}</text></g>; })}
    </svg>
    {"8 AI".split("").map((ch, i) => { const s = spring({ frame: f - i * 3, fps: 30, config: { damping: 10, stiffness: 160, mass: 0.7 } }); return <div key={i} style={{ position: "absolute", left: 370 + i * 140 - (i>=2?0:0), top: 640, fontFamily: sans, fontWeight: 900, fontSize: 210, color: ch === " " ? "transparent" : K.white, transform: `perspective(900px) rotateX(${(1 - s) * -80}deg) scale(${0.8 + 0.2 * s})`, opacity: clamp(s * 2.2), textShadow: `0 0 40px ${K.cyan}aa, 0 8px 0 ${K.cyan}55` }}>{ch}</div>; })}
    <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: 112, color: K.cyan, letterSpacing: 4, opacity: pr(f, 8, 22), transform: `scale(${0.9 + 0.1 * pr(f, 8, 24)})` }}>CONCEPTS</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1030, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: 70, color: K.orange, letterSpacing: 6, opacity: pr(f, tt("ninety") - 10, tt("ninety") + 4), transform: `translateY(${(1 - pr(f, tt("ninety") - 10, tt("ninety") + 6)) * 30}px)` }}>IN 90 SECONDS</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 530, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: 130, color: K.orange, opacity: pr(f, tt("understand") - 4, tt("understand") + 8) * (1 - pr(f, tt("understand") + 40, tt("understand") + 56)), transform: `rotate(${Math.sin(f / 6) * 6}deg) scale(${1 + 0.1 * Math.sin(f / 5)})` }}>?</div>
  </Stage>);
};

const Llm: React.FC = () => {
  const f = useCurrentFrame(); const t0 = tc("llm", "large"), t1 = tc("llm", "language"), t2 = tc("llm", "model"), tw = tc("llm", "recognize"), tg = tc("llm", "generate"), tp = tc("llm", "predicts");
  const rows = [{ l: "L", rest: "arge", sub: "trained on huge text", t: t0 }, { l: "L", rest: "anguage", sub: "patterns in language", t: t1 }, { l: "M", rest: "odel", sub: "predicts what comes next", t: t2 }];
  const layers = [4, 6, 6, 6, 3]; const ry = 0.5 * Math.sin(f / 70), rx = -0.18 + 0.06 * Math.sin(f / 90);
  const nodes = layers.map((n, l) => Array.from({ length: n }, (_, i) => proj([(l - 2) * 235, (i - (n - 1) / 2) * 66, (((i * 37 + l * 17) % 5) - 2) * 50], ry, rx, 700, 540, 480)));
  const wave = Math.max(0, (f - tw) * 0.085); const prompt = "The capital of France is"; const typed = Math.floor(clamp((f - (t2 + 6)) / 40) * prompt.length);
  const outT = pr(f, tg, tg + 10); const word2 = f > tg + 22;
  return (<Stage id="llm">
    {rows.map((r, i) => { const s = spring({ frame: f - r.t, fps: 30, config: POP }); const ex = pr(f, r.t + 4, r.t + 16); return (<div key={i} style={{ position: "absolute", left: 40 + i * 342, top: 0, width: 322, height: 168, borderRadius: 22, background: K.panel, border: `2px solid ${i === 2 ? K.orange : K.cyan}`, opacity: clamp(s * 1.8), transform: `scale(${0.85 + 0.15 * s})`, padding: "10px 16px", fontFamily: sans, boxShadow: "0 16px 36px rgba(0,0,0,.45)" }}>
      <div style={{ display: "flex", alignItems: "baseline", height: 92 }}><span style={{ fontWeight: 900, fontSize: 96, color: i === 2 ? K.orange : K.cyan, lineHeight: 1 }}>{r.l}</span><span style={{ fontWeight: 800, fontSize: 52, color: K.white, maxWidth: ex * 220, overflow: "hidden", whiteSpace: "nowrap", display: "inline-block" }}>{r.rest}</span></div>
      <div style={{ fontWeight: 600, fontSize: 24, color: K.dim, marginTop: 6, opacity: ex }}>{r.sub}</div></div>); })}
    <Panel x={40} y={192} w={470} h={78} a={t2 + 4} acc={K.cyan} pad={12}><div style={{ fontFamily: mono, fontSize: 24, color: K.white, whiteSpace: "nowrap" }}><span style={{ color: K.dim, fontSize: 16 }}>PROMPT </span>{prompt.slice(0, typed)}<span style={{ color: K.cyan, opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>▍</span></div></Panel>
    <Panel x={570} y={192} w={470} h={78} a={tg - 6} acc={K.green} pad={12}><div style={{ fontFamily: mono, fontSize: 28, color: K.white, whiteSpace: "nowrap", opacity: outT }}><span style={{ color: K.dim, fontSize: 18 }}>RESPONSE </span><span style={{ background: f > tp ? K.green + "55" : "transparent", borderRadius: 6, padding: "0 4px" }}>Paris</span>{word2 ? <span>.</span> : null}</div></Panel>
    <svg width={1080} height={720} style={{ position: "absolute", left: 0, top: 0 }}>
      {nodes.slice(0, -1).map((L, l) => L.map((a, i) => nodes[l + 1].map((b, j) => { const act = clamp(wave - l); return <line key={`${l}_${i}_${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={act > 0 ? K.cyan : "rgba(255,255,255,.35)"} strokeWidth={act > 0 ? 1.6 : 0.8} opacity={act > 0 ? 0.55 : 0.25} />; })))}
      {f > tw && nodes.slice(0, -1).map((L, l) => L.map((a, i) => { const b = nodes[l + 1][(i * 2 + l) % nodes[l + 1].length]; const t = ((f - tw) * 0.02 + (i * 0.173 + l * 0.31)) % 1; return clamp(wave - l) > 0 ? <circle key={`p${l}_${i}`} cx={a.x + (b.x - a.x) * t} cy={a.y + (b.y - a.y) * t} r={5} fill={K.orange} opacity={Math.sin(Math.PI * t)} style={{ filter: `drop-shadow(0 0 7px ${K.orange})` }} /> : null; }))}
      {nodes.map((L, l) => L.map((p, i) => { const act = clamp(wave - l + 0.5); return <circle key={`n${l}_${i}`} cx={p.x} cy={p.y} r={11 * p.k} fill={act > 0.5 ? K.cyan : "#1b2a44"} stroke={act > 0.5 ? "#fff" : "rgba(255,255,255,.5)"} strokeWidth={1.5} style={{ filter: act > 0.5 ? `drop-shadow(0 0 10px ${K.cyan})` : undefined }} />; }))}
      {Math.sin(f) >= -2 && [0, 1].map((i) => <path key={i} d={`M ${i ? 880 : 130} 290 L ${i ? 880 : 130} 310`} stroke={K.dim} />)}
    </svg>
    <Tag x={40} y={690} text="ILLUSTRATIVE NETWORK · real LLMs have billions of parameters" a={40} />
  </Stage>);
};

const Api: React.FC = () => {
  const f = useCurrentFrame(); const tr = tc("api", "request"), ta = tc("api", "answer"), tw = tc("api", "website"), tap = tc("api", "applications");
  const N = [{ x: 40, label: "WEBSITE", c: K.cyan, a: 6 }, { x: 430, label: "API", c: K.orange, a: 20 }, { x: 820, label: "AI SERVICE", c: K.green, a: 34 }];
  const jr = `POST /chat\n{ "prompt": "Hi!" }`; const ja = `200 OK\n{ "answer": "Hello!" }`; const ty = (s: string, a: number, sp = 0.9) => s.slice(0, Math.floor(Math.max(0, f - a) * sp));
  return (<Stage id="api">
    {N.map((n, i) => { const s = useSp(n.a); return (<div key={i} style={{ position: "absolute", left: n.x, top: 40, width: 220, height: 190, borderRadius: 24, background: K.panel, border: `3px solid ${n.c}`, opacity: clamp(s * 1.6), transform: `scale(${0.8 + 0.2 * s})`, boxShadow: `0 0 36px ${n.c}44`, fontFamily: sans, textAlign: "center" }}>
      <svg width={220} height={120}>{i === 0 && <g stroke={n.c} strokeWidth={4} fill="none"><rect x={50} y={26} width={120} height={78} rx={10} /><line x1={50} y1={46} x2={170} y2={46} /><circle cx={63} cy={36} r={3} fill={n.c} /><circle cx={75} cy={36} r={3} fill={n.c} /></g>}{i === 1 && <text x={110} y={86} textAnchor="middle" fontFamily={mono} fontWeight={900} fontSize={70} fill={n.c}>{"{ }"}</text>}{i === 2 && <g>{[[80, 40], [140, 36], [110, 70], [76, 90], [146, 92]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={9} fill={n.c} opacity={0.6 + 0.4 * Math.sin(f / 7 + k)} />)}<path d="M80 40L110 70L140 36M76 90L110 70L146 92" stroke={n.c} strokeWidth={2.5} fill="none" /></g>}</svg>
      <div style={{ fontWeight: 900, fontSize: 30, color: K.white, letterSpacing: 2 }}>{n.label}</div></div>); })}
    <svg width={1080} height={720} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <Draw d="M 270 100 L 420 100" a={tap} c={K.orange} /><Draw d="M 660 100 L 810 100" a={tap + 6} c={K.orange} /><Draw d="M 810 170 L 660 170" a={ta - 8} c={K.cyan} /><Draw d="M 420 170 L 270 170" a={ta - 4} c={K.cyan} />
      <Dots x1={270} y1={100} x2={810} y2={100} a={tr} n={5} c={K.orange} sp={0.011} /><Dots x1={810} y1={170} x2={270} y2={170} a={ta} n={5} c={K.cyan} sp={0.011} />
      <text x={345} y={78} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={22} fill={K.orange} opacity={pr(f, tr, tr + 8)}>REQUEST</text><text x={345} y={206} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={22} fill={K.cyan} opacity={pr(f, ta - 6, ta + 4)}>ANSWER</text>
    </svg>
    <Panel x={40} y={290} w={480} h={300} a={tr} acc={K.orange}><div style={{ fontWeight: 800, fontSize: 22, color: K.orange, letterSpacing: 3 }}>REQUEST</div><pre style={{ fontFamily: mono, fontSize: 30, color: K.white, margin: "14px 0 0", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{ty(jr, tr + 4)}</pre></Panel>
    <Panel x={560} y={290} w={480} h={300} a={ta} acc={K.cyan}><div style={{ fontWeight: 800, fontSize: 22, color: K.cyan, letterSpacing: 3 }}>RESPONSE</div><pre style={{ fontFamily: mono, fontSize: 30, color: K.white, margin: "14px 0 0", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{ty(ja, ta + 4)}</pre></Panel>
    <Note text="SIMPLIFIED EXAMPLE · real APIs have their own endpoints, keys and formats" a={tr + 20} y={620} />
  </Stage>);
};

const PAL = [K.cyan, K.green, K.orange, "#B69CFF", "#FF7AB6", "#F6D860", "#5BA7FF", "#7DF0C0", "#FF9A7A"];
const TokBlocks: React.FC<{ ex: { tokens: string[]; ids: number[] }; split: number; size: number; y: number; idsOn?: number }> = ({ ex, split, size, y, idsOn = 0 }) => {
  const f = useCurrentFrame(); const sp = pr(f, split, split + 18);
  return (<div style={{ position: "absolute", left: 40, right: 40, top: y, display: "flex", flexWrap: "wrap", rowGap: 14, columnGap: sp * 10, fontFamily: mono, fontWeight: 700, fontSize: size }}>
    {ex.tokens.map((t, i) => { const s = clamp((f - split - i * 3) / 10); return (<div key={i} style={{ position: "relative", padding: `4px ${4 + 10 * sp}px`, borderRadius: 10, background: sp > 0 ? PAL[i % PAL.length] + Math.round(0x22 + 0x55 * s).toString(16).padStart(2, "0") : "transparent", border: sp > 0 ? `2px solid ${PAL[i % PAL.length]}` : "2px solid transparent", color: K.white, whiteSpace: "pre", transform: `translateY(${-8 * Math.sin(Math.PI * s)}px)` }}>{t.startsWith(" ") ? <span style={{ opacity: 0.35 }}>·</span> : null}{t.trimStart()}<span style={{ position: "absolute", left: 0, right: 0, bottom: -22, textAlign: "center", fontSize: 15, color: PAL[i % PAL.length], opacity: idsOn ? pr(f, idsOn + i * 2, idsOn + i * 2 + 8) : 0 }}>{ex.ids[i]}</span></div>); })}</div>);
};
const Tokens: React.FC = () => {
  const f = useCurrentFrame(); const ex = TOK.examples; const tsp = tc("tokens", "pieces"), tpart = tc("tokens", "part"), tl = tc("tokens", "limits"), tcst = tc("tokens", "costs");
  const typed = ex[0].text.slice(0, Math.floor(clamp((f - 4) / 30) * ex[0].text.length)); const count = Math.round(clamp((f - tsp - 18) / 20) * ex[0].count);
  const ctx = pr(f, tl, tl + 50); const use = Math.round(pr(f, tcst, tcst + 60) * 100);
  return (<Stage id="tokens">
    {f < tsp - 2 ? <div style={{ position: "absolute", left: 40, right: 40, top: 14, fontFamily: mono, fontWeight: 700, fontSize: 46, color: K.white }}>{typed}<span style={{ color: K.green, opacity: Math.floor(f / 8) % 2 }}>▍</span></div> : <TokBlocks ex={ex[0]} split={tsp} size={46} y={14} idsOn={tsp + 30} />}
    <Panel x={760} y={148} w={280} h={64} a={tsp + 20} acc={K.green} pad={8} style={{ textAlign: "center" }}><div style={{ fontWeight: 900, fontSize: 38, color: K.green }}>{count} <span style={{ fontSize: 24, color: K.white }}>TOKENS</span></div></Panel>
    <div style={{ position: "absolute", left: 40, top: 236, fontFamily: sans, fontWeight: 800, fontSize: 22, color: K.dim, letterSpacing: 2, opacity: pr(f, tpart - 14, tpart - 4) }}>ONE WORD ≠ ONE TOKEN</div>
    {f >= tpart - 12 && <TokBlocks ex={ex[1]} split={tpart} size={40} y={282} />}
    <Panel x={620} y={338} w={420} h={60} a={tpart + 24} acc={K.orange} pad={8} style={{ textAlign: "center" }}><div style={{ fontWeight: 900, fontSize: 28, color: K.orange }}>4 words → {ex[1].count} tokens</div></Panel>
    <Panel x={40} y={430} w={500} h={230} a={tl} acc={K.cyan}><div style={{ fontWeight: 800, fontSize: 22, color: K.cyan, letterSpacing: 3 }}>CONTEXT LIMIT</div>
      <div style={{ position: "relative", height: 54, marginTop: 24, borderRadius: 14, border: `2px solid ${K.line}`, overflow: "hidden", background: "rgba(255,255,255,.05)" }}><div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${ctx * 86}%`, background: `repeating-linear-gradient(90deg, ${K.cyan}cc 0 22px, ${K.green}cc 22px 44px, ${K.orange}cc 44px 66px)` }} /><div style={{ position: "absolute", left: "86%", top: 0, bottom: 0, width: 4, background: K.red }} /></div>
      <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 24, color: K.dim, marginTop: 14 }}>Only so many tokens fit at once</div></Panel>
    <Panel x={580} y={430} w={460} h={230} a={tcst} acc={K.orange}><div style={{ fontWeight: 800, fontSize: 22, color: K.orange, letterSpacing: 3 }}>USAGE & API COST</div>
      <div style={{ fontWeight: 900, fontSize: 84, color: K.white, marginTop: 14 }}>{use}<span style={{ fontSize: 34, color: K.dim }}> %</span></div>
      <div style={{ height: 14, borderRadius: 7, background: "rgba(255,255,255,.1)", marginTop: 6 }}><div style={{ height: 14, width: `${use}%`, borderRadius: 7, background: K.orange }} /></div>
      <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 22, color: K.dim, marginTop: 10 }}>more tokens → more usage (illustrative)</div></Panel>
    <Note text="REAL SPLIT · o200k_base tokenizer (gpt-tokenizer, run locally) · other models split text differently" a={tsp + 30} y={684} />
  </Stage>);
};

const Ft: React.FC = () => {
  const f = useCurrentFrame(); const tco = tc("ft", "continues"), tsel = tc("ft", "selected"), tpar = tc("ft", "particular"), tit = tc("ft", "itself");
  const ex = ["Customer: Where is my order?\n→ Hi! It ships today.", "Customer: Can I return it?\n→ Of course, within 30 days.", "Customer: Thanks!\n→ Happy to help!"]; const train = pr(f, tsel, tpar + 30); const done = pr(f, tpar + 30, tpar + 50);
  const bars = Array.from({ length: 12 }, (_, i) => { const a = 0.35 + 0.5 * ((i * 53) % 7) / 7, b = 0.25 + 0.6 * ((i * 31 + 3) % 9) / 9; return a + (b - a) * train + 0.04 * Math.sin(f / 4 + i) * (train > 0 && done < 1 ? 1 : 0); });
  const col = done > 0.5 ? K.green : K.cyan;
  return (<Stage id="ft">
    {ex.map((t, i) => { const a = tsel + i * 14; const s = useSp(a); const p = pr(f, tpar - 4 + i * 6, tpar + 22 + i * 6); return (<div key={i} style={{ position: "absolute", left: 40 + p * 330, top: 40 + i * 110 + p * (100 - i * 100) * 0.4, width: 360, height: 96, borderRadius: 16, background: K.panel, border: `2px solid ${K.orange}`, fontFamily: mono, fontSize: 22, color: K.white, padding: "10px 14px", whiteSpace: "pre", opacity: clamp(s * 1.6) * (1 - p), transform: `scale(${0.8 + 0.2 * s})` }}>{t}</div>); })}
    <Tag x={40} y={4} text="TRAINING EXAMPLES" a={tsel - 6} c={K.orange} />
    <Panel x={440} y={90} w={300} h={300} a={tco - 8} acc={col} style={{ boxShadow: `0 0 ${20 + 50 * train}px ${col}66` }}>
      <div style={{ fontWeight: 800, fontSize: 22, color: col, letterSpacing: 3 }}>{done > 0.5 ? "ADAPTED MODEL" : "BASE MODEL"}</div>
      <svg width={268} height={190} style={{ marginTop: 14 }}>{bars.map((v, i) => <rect key={i} x={i * 22 + 2} y={190 - v * 180} width={16} height={v * 180} rx={4} fill={col} opacity={0.85} />)}</svg>
      <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 20, color: K.dim }}>weights shift (illustrative)</div></Panel>
    <svg width={1080} height={720} style={{ position: "absolute", left: 0, top: 0 }}><Draw d="M 750 240 L 850 240" a={tpar + 30} c={K.green} /><path d="M 850 240 l -14 -12 M 850 240 l -14 12" stroke={K.green} strokeWidth={4} opacity={done} /></svg>
    <Panel x={860} y={150} w={190} h={180} a={tpar + 34} acc={K.green} pad={12}><div style={{ fontWeight: 900, fontSize: 24, color: K.green }}>SAME MODEL, ADJUSTED</div><div style={{ fontFamily: sans, fontSize: 20, color: K.white, marginTop: 8, lineHeight: 1.2 }}>tuned for a task or style</div></Panel>
    <div style={{ position: "absolute", left: 40, top: 430, width: 1000, height: 120, display: "flex", gap: 20, opacity: pr(f, tit - 6, tit + 8), fontFamily: sans }}>
      <div style={{ flex: 1, borderRadius: 18, border: `2px solid ${K.red}`, background: "rgba(255,93,108,.1)", padding: "14px 18px" }}><div style={{ fontWeight: 900, fontSize: 28, color: K.red, textDecoration: "line-through" }}>Uploading documents</div><div style={{ fontWeight: 600, fontSize: 21, color: K.dim, marginTop: 4 }}>that is retrieval (RAG), next</div></div>
      <div style={{ flex: 1, borderRadius: 18, border: `2px solid ${K.green}`, background: "rgba(61,220,151,.1)", padding: "14px 18px" }}><div style={{ fontWeight: 900, fontSize: 28, color: K.green }}>More training on examples</div><div style={{ fontWeight: 600, fontSize: 21, color: K.dim, marginTop: 4 }}>changes the model itself</div></div></div>
    <Note text="ILLUSTRATIVE EXAMPLES · real fine-tuning uses many examples" a={tsel + 10} y={620} />
  </Stage>);
};

const Rag: React.FC = () => {
  const f = useCurrentFrame(); const tq = 6, tret = tc("rag", "retrieve"), text = tc("rag", "external"), tgen = tc("rag", "generating"), tnr = tc("rag", "retrained");
  const hit = [1, 4]; const scan = pr(f, tret, tret + 40);
  return (<Stage id="rag">
    <Panel x={40} y={10} w={300} h={150} a={tq} acc={K.cyan}><div style={{ fontWeight: 800, fontSize: 20, color: K.cyan, letterSpacing: 3 }}>1 · QUESTION</div><div style={{ fontWeight: 800, fontSize: 28, marginTop: 10, lineHeight: 1.2 }}>What is our refund policy?</div></Panel>
    <Panel x={380} y={0} w={400} h={190} a={text - 10} acc={K.orange} pad={12}><div style={{ fontWeight: 800, fontSize: 20, color: K.orange, letterSpacing: 3 }}>2 · SEARCH DOCUMENTS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 10 }}>{Array.from({ length: 6 }, (_, i) => { const h = hit.includes(i) && scan > 0.6; return <div key={i} style={{ height: 46, borderRadius: 8, border: `2px solid ${h ? K.green : K.line}`, background: h ? K.green + "33" : "rgba(255,255,255,.05)", boxShadow: h ? `0 0 16px ${K.green}` : undefined, position: "relative" }}><div style={{ position: "absolute", left: 8, top: 10, right: 8, height: 4, background: "rgba(255,255,255,.25)" }} /><div style={{ position: "absolute", left: 8, top: 22, right: 20, height: 4, background: "rgba(255,255,255,.18)" }} /></div>; })}</div></Panel>
    <Panel x={820} y={10} w={220} h={170} a={tret + 36} acc={K.green} pad={12}><div style={{ fontWeight: 800, fontSize: 20, color: K.green, letterSpacing: 3 }}>PASSAGES</div>{[0, 1].map((i) => <div key={i} style={{ height: 34, borderRadius: 8, background: K.green + "33", marginTop: 10, border: `1.5px solid ${K.green}`, fontSize: 16, fontWeight: 700, padding: "6px 8px" }}>…refund within 30 days…</div>)}</Panel>
    <svg width={1080} height={720} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <Draw d="M 340 85 L 372 85" a={tq + 12} c={K.cyan} /><Draw d="M 780 95 L 812 95" a={tret + 24} c={K.green} /><Draw d="M 930 190 L 930 270 L 700 300" a={tret + 40} c={K.green} len={24} />
      <Dots x1={340} y1={85} x2={780} y2={95} a={tret} n={4} c={K.cyan} sp={0.012} />
      {scan > 0 && scan < 1 && <g transform={`translate(${430 + scan * 280},${60 + scan * 20})`}><circle r={26} fill="none" stroke={K.orange} strokeWidth={5} /><line x1={18} y1={18} x2={38} y2={38} stroke={K.orange} strokeWidth={6} strokeLinecap="round" /></g>}
    </svg>
    <Panel x={40} y={330} w={300} h={110} a={tgen - 40} acc={K.cyan} pad={12}><div style={{ fontWeight: 800, fontSize: 20, color: K.cyan, letterSpacing: 3 }}>QUESTION + PASSAGES</div><div style={{ fontFamily: sans, fontSize: 22, color: K.dim, marginTop: 8 }}>sent together as the prompt</div></Panel>
    <Panel x={400} y={290} w={300} h={170} a={tgen - 10} acc={K.cyan} style={{ boxShadow: `0 0 36px ${K.cyan}44` }}><div style={{ fontWeight: 800, fontSize: 20, color: K.cyan, letterSpacing: 3 }}>3 · LLM GENERATES</div><div style={{ fontWeight: 900, fontSize: 60, color: K.white, marginTop: 6 }}>LLM</div><div style={{ fontFamily: sans, fontWeight: 800, fontSize: 20, color: K.orange, opacity: pr(f, tnr - 4, tnr + 8) }}>NO RETRAINING</div></Panel>
    <Panel x={740} y={290} w={300} h={170} a={tgen + 20} acc={K.green}><div style={{ fontWeight: 800, fontSize: 20, color: K.green, letterSpacing: 3 }}>GROUNDED ANSWER</div><div style={{ fontWeight: 700, fontSize: 24, marginTop: 10, lineHeight: 1.25 }}>Refunds are accepted within 30 days. <span style={{ background: K.green + "44", borderRadius: 6, padding: "0 6px" }}>[1]</span></div></Panel>
    <svg width={1080} height={720} style={{ position: "absolute", left: 0, top: 0 }}><Draw d="M 340 385 L 392 380" a={tgen} c={K.cyan} /><Draw d="M 700 380 L 732 380" a={tgen + 22} c={K.green} /><Dots x1={700} y1={380} x2={740} y2={380} a={tgen + 24} n={2} c={K.green} /></svg>
    <div style={{ position: "absolute", left: 40, top: 500, width: 1000, display: "flex", gap: 16, fontFamily: sans, opacity: pr(f, tnr - 10, tnr + 6) }}>
      <div style={{ flex: 1, borderRadius: 16, border: `2px solid ${K.orange}`, padding: "10px 16px", fontWeight: 800, fontSize: 24, color: K.orange }}>RETRIEVAL <span style={{ color: K.dim, fontWeight: 600, fontSize: 20 }}>runs at question time</span></div>
      <div style={{ flex: 1, borderRadius: 16, border: `2px solid ${K.line}`, padding: "10px 16px", fontWeight: 800, fontSize: 24, color: K.dim }}>TRAINING <span style={{ fontWeight: 600, fontSize: 20 }}>a separate step</span></div></div>
    <Note text="SIMPLIFIED PIPELINE · the documents here are an illustrative example" a={tgen} y={650} />
  </Stage>);
};

const WORDS3: { w: string; p: [number, number, number]; g: number; r: [number, number, number] }[] = [
  { w: "cat", p: [-170, -80, 30], g: 0, r: [140, 100, -120] }, { w: "kitten", p: [-210, -40, 70], g: 0, r: [-120, 150, 60] }, { w: "dog", p: [-130, -110, -20], g: 0, r: [180, -60, 140] }, { w: "puppy", p: [-175, -130, -40], g: 0, r: [-60, -140, -110] },
  { w: "apple", p: [150, -60, -40], g: 1, r: [-200, 60, 40] }, { w: "banana", p: [190, -20, 10], g: 1, r: [100, -150, -150] }, { w: "pizza", p: [130, -100, 60], g: 1, r: [60, 140, 130] },
  { w: "car", p: [-20, 130, 90], g: 2, r: [-150, -120, 60] }, { w: "truck", p: [30, 160, 50], g: 2, r: [190, 40, -80] }, { w: "bike", p: [-60, 150, 20], g: 2, r: [-40, 90, -170] }];
const GC = [K.cyan, K.green, K.orange];
const Emb: React.FC = () => {
  const f = useCurrentFrame(); const tn = tc("emb", "numerical"), tcmp = tc("emb", "compare"), tsim = tc("emb", "similar");
  const m = pr(f, tcmp - 10, tcmp + 50); const ry = 0.35 + f * 0.012, rx = -0.25;
  const pts = WORDS3.map((w) => { const q: [number, number, number] = [(w.r[0] + (w.p[0] - w.r[0]) * m) * 1.6, (w.r[1] + (w.p[1] - w.r[1]) * m) * 1.6, (w.r[2] + (w.p[2] - w.r[2]) * m) * 1.9]; return { ...w, pr: proj(q, ry, rx, 700, 540, 285) }; });
  const near = pr(f, tsim, tsim + 20); const cat = pts[0]; const links = [1, 2].map((i) => pts[i]); const sorted = [...pts].sort((a, b) => b.pr.z - a.pr.z);
  const vec = [0.21, -0.64, 0.08, 0.77, -0.31]; const nv = Math.round(clamp((f - tn) / 24) * vec.length);
  return (<Stage id="emb">
    <svg width={1080} height={520} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {[-1, 1].map((s) => <line key={s} x1={540 + s * 380} y1={250 + 150} x2={540 + s * 380} y2={250 - 150} stroke="rgba(255,255,255,.08)" />)}
      {[[[-260, 0, 0], [260, 0, 0], K.red], [[0, -200, 0], [0, 200, 0], K.green], [[0, 0, -200], [0, 0, 200], K.cyan]].map(([a, b, c], i) => { const A = proj(a as any, ry, rx, 700, 540, 285), B = proj(b as any, ry, rx, 700, 540, 285); return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={c as string} strokeWidth={1.5} opacity={0.35} />; })}
      {near > 0 && links.map((l, i) => <line key={i} x1={cat.pr.x} y1={cat.pr.y} x2={l.pr.x} y2={l.pr.y} stroke={K.cyan} strokeWidth={3} strokeDasharray="6 6" opacity={near} />)}
      {sorted.map((p) => <g key={p.w} opacity={clamp(f / 12)}><circle cx={p.pr.x} cy={p.pr.y} r={(p.w === "cat" ? 15 : 11) * p.pr.k} fill={GC[p.g]} style={{ filter: `drop-shadow(0 0 ${12 * p.pr.k}px ${GC[p.g]})` }} stroke="#fff" strokeWidth={p.w === "cat" ? 3 : 1.2} /><text x={p.pr.x} y={p.pr.y - 22 * p.pr.k} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={24 * p.pr.k} fill="#fff">{p.w}</text></g>)}
    </svg>
    <Panel x={40} y={500} w={620} h={96} a={tn} acc={K.green} pad={12}><div style={{ fontFamily: sans, fontWeight: 800, fontSize: 20, color: K.green, letterSpacing: 3 }}>"cat" BECOMES NUMBERS</div><div style={{ fontFamily: mono, fontSize: 26, color: K.white, marginTop: 6 }}>[{vec.slice(0, nv).join(", ")}{nv < vec.length ? "" : ", …"}]</div></Panel>
    <Panel x={690} y={500} w={350} h={96} a={tsim} acc={K.cyan} pad={12}><div style={{ fontFamily: sans, fontWeight: 800, fontSize: 20, color: K.cyan, letterSpacing: 3 }}>NEAREST TO "cat"</div><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 32, color: K.white, marginTop: 6 }}>kitten · dog</div></Panel>
    <Note text="ILLUSTRATIVE 3D MAP · real embeddings have hundreds or thousands of dimensions" a={tn} y={640} />
  </Stage>);
};

const Dev: React.FC = () => {
  const f = useCurrentFrame(); const td = tc("dev", "developers"), te = tc("dev", "engineers"), to = tc("dev", "overlap"); const ov = pr(f, to - 6, to + 22);
  const steps = ["Data", "Train / fine-tune", "Evaluate", "Deploy", "Monitor"]; const cx = (ov * 70);
  return (<Stage id="dev">
    <Panel x={30 + cx} y={20} w={500} h={640} a={td - 10} acc={K.cyan} pad={0}>
      <div style={{ padding: "16px 22px", fontWeight: 900, fontSize: 30, color: K.cyan, letterSpacing: 2 }}>AI DEVELOPER</div><div style={{ padding: "0 22px", fontWeight: 600, fontSize: 22, color: K.dim }}>builds AI-powered apps</div>
      <div style={{ margin: "16px auto 0", width: 300, height: 450, borderRadius: 36, border: `4px solid ${K.white}55`, background: "#0a1220", padding: 16 }}>
        {[["Hi! Ask me anything", 0], ["Summarise this page", 1], ["Here is a summary…", 0]].map(([t, me], i) => { const s = pr(f, td + i * 22, td + i * 22 + 12); return <div key={i} style={{ marginTop: 16, marginLeft: me ? 40 : 0, marginRight: me ? 0 : 40, padding: "10px 14px", borderRadius: 16, background: me ? K.cyan : "rgba(255,255,255,.12)", color: me ? K.bg : K.white, fontFamily: sans, fontWeight: 700, fontSize: 20, opacity: s, transform: `translateY(${(1 - s) * 16}px)` }}>{t}</div>; })}
        <div style={{ position: "absolute", marginTop: 220, width: 260, height: 44, borderRadius: 22, border: `2px solid ${K.line}`, fontFamily: sans, fontSize: 18, color: K.dim, padding: "10px 16px" }}>Message…</div></div></Panel>
    <Panel x={550 - cx} y={20} w={500} h={640} a={te - 10} acc={K.orange} pad={0}>
      <div style={{ padding: "16px 22px", fontWeight: 900, fontSize: 30, color: K.orange, letterSpacing: 2 }}>AI ENGINEER</div><div style={{ padding: "0 22px", fontWeight: 600, fontSize: 22, color: K.dim }}>may also design, evaluate, deploy, maintain</div>
      <div style={{ padding: "18px 40px" }}>{steps.map((s, i) => { const p = pr(f, te + i * 14, te + i * 14 + 12); return (<div key={i} style={{ position: "relative" }}><div style={{ height: 66, borderRadius: 16, border: `2px solid ${K.orange}`, background: K.orange + "1f", fontFamily: sans, fontWeight: 800, fontSize: 28, color: K.white, padding: "16px 20px", opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>{i + 1}  {s}</div>{i < steps.length - 1 && <div style={{ height: 24, width: 4, background: K.orange, margin: "0 auto", opacity: p }} />}</div>); })}</div></Panel>
    <div style={{ position: "absolute", left: 540 - 190, top: 250, width: 380, height: 160, borderRadius: 80, background: `radial-gradient(circle, ${K.green}55, ${K.green}11 70%)`, border: `3px solid ${K.green}`, opacity: ov, transform: `scale(${0.7 + 0.3 * ov})`, zIndex: 20, textAlign: "center", fontFamily: sans, boxShadow: `0 0 50px ${K.green}66`, padding: "30px 10px" }}><div style={{ fontWeight: 900, fontSize: 38, color: K.white }}>ROLES OVERLAP</div><div style={{ fontWeight: 700, fontSize: 21, color: K.green, marginTop: 6 }}>in practice</div></div>
  </Stage>);
};

const All: React.FC = () => {
  const f = useCurrentFrame(); const t = (w: string) => tc("all", w);
  const B = [{ k: "app", n: "APP", x: 40, y: 30, w: 210, h: 120, c: K.cyan, a: t("app") }, { k: "api", n: "API", x: 330, y: 30, w: 210, h: 120, c: K.orange, a: t("api") }, { k: "llm", n: "LLM", x: 640, y: 10, w: 380, h: 170, c: K.green, a: t("llm") }, { k: "rag", n: "RAG", x: 640, y: 290, w: 380, h: 110, c: K.cyan, a: t("rag") }, { k: "emb", n: "EMBEDDINGS", x: 300, y: 290, w: 280, h: 110, c: K.green, a: t("embeddings") }, { k: "kb", n: "YOUR DOCS", x: 40, y: 290, w: 210, h: 110, c: K.dim, a: t("retrieves") }, { k: "ft", n: "FINE-TUNING (optional)", x: 640, y: 520, w: 380, h: 100, c: K.orange, a: t("fine") }];
  return (<Stage id="all">
    <svg width={1080} height={720} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <Draw d="M 250 90 L 330 90" a={t("api") - 4} c={K.cyan} /><Draw d="M 540 90 L 640 90" a={t("tokens")} c={K.orange} /><Draw d="M 830 290 L 830 180" a={t("rag") + 8} c={K.cyan} /><Draw d="M 580 345 L 640 345" a={t("embeddings") + 6} c={K.green} /><Draw d="M 250 345 L 300 345" a={t("embeddings") + 2} c={K.green} /><Draw d="M 830 520 L 830 410 M 830 400 L 830 400" a={t("fine") + 4} c={K.orange} dash="10 10" />
      <Dots x1={250} y1={90} x2={640} y2={90} a={t("tokens") + 10} n={5} c={K.orange} sp={0.012} /><Dots x1={640} y1={110} x2={250} y2={110} a={t("tokens") + 30} n={4} c={K.cyan} sp={0.012} /><Dots x1={250} y1={345} x2={640} y2={345} a={t("embeddings") + 14} n={4} c={K.green} sp={0.011} /><Dots x1={830} y1={290} x2={830} y2={180} a={t("rag") + 14} n={3} c={K.cyan} sp={0.012} />
    </svg>
    {B.map((b) => { const s = useSp(b.a - 6); const hot = f > b.a && f < b.a + 40; return (<div key={b.k} style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 22, background: K.panel, border: `${hot ? 4 : 2.5}px ${b.k === "ft" ? "dashed" : "solid"} ${b.c}`, boxShadow: hot ? `0 0 44px ${b.c}99` : `0 0 18px ${b.c}22`, opacity: clamp(s * 1.6), transform: `scale(${0.85 + 0.15 * s})`, fontFamily: sans, fontWeight: 900, fontSize: b.k === "ft" ? 28 : 40, color: K.white, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", letterSpacing: 2 }}>{b.n}</div>); })}
    <div style={{ position: "absolute", left: 556, top: 36, fontFamily: sans, fontWeight: 900, fontSize: 22, color: K.orange, opacity: pr(f, t("tokens"), t("tokens") + 8), background: K.bg, padding: "2px 8px", borderRadius: 8, border: `1.5px solid ${K.orange}` }}>tokens</div>
    <div style={{ position: "absolute", left: 40, top: 440, width: 560, fontFamily: sans, fontWeight: 700, fontSize: 24, color: K.dim, opacity: pr(f, t("embeddings") + 16, t("embeddings") + 30) }}>embeddings find the right passages → RAG sends them to the LLM</div>
    <div style={{ position: "absolute", left: 40, top: 520, width: 560, fontFamily: sans, fontWeight: 700, fontSize: 24, color: K.dim, opacity: pr(f, t("fine") + 10, t("fine") + 24) }}>fine-tuning adapts the model itself, if you need it</div>
  </Stage>);
};

const TILES = ["LLM", "API", "TOKENS", "FINE-TUNING", "RAG", "EMBEDDINGS", "DEV VS ENGINEER", "SYSTEM"];
const Cta: React.FC = () => {
  const f = useCurrentFrame(); const tf = tc("cta", "follow"); const hl = Math.floor(f / 14) % 8;
  return (<Stage id="cta">
    <div style={{ position: "absolute", left: 40, top: 0, width: 1000, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {TILES.map((n, i) => { const s = spring({ frame: f - 4 - i * 4, fps: 30, config: POP }); const hot = f > 70 && hl === i; const c = i % 2 ? K.orange : K.cyan; return (<div key={i} style={{ height: 128, borderRadius: 20, background: K.panel, border: `${hot ? 4 : 2}px solid ${c}`, boxShadow: hot ? `0 0 34px ${c}88` : undefined, opacity: clamp(s * 1.6), transform: `scale(${0.8 + 0.2 * s})`, display: "flex", alignItems: "center", gap: 18, padding: "0 22px", fontFamily: sans }}><div style={{ fontWeight: 900, fontSize: 54, color: c }}>{String(i + 1).padStart(2, "0")}</div><div style={{ fontWeight: 900, fontSize: n.length > 10 ? 30 : 38, color: K.white, letterSpacing: 1 }}>{n}</div></div>); })}</div>
    <div style={{ position: "absolute", left: 40, right: 40, top: 598, height: 100, borderRadius: 50, background: `linear-gradient(90deg, ${K.cyan}, ${K.green})`, opacity: pr(f, tf - 4, tf + 10), transform: `scale(${0.9 + 0.1 * pr(f, tf - 4, tf + 12)})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 900, fontSize: 44, color: K.bg, letterSpacing: 1 }}>Follow @agentoon.ai</div>
    <div style={{ position: "absolute", left: 40, right: 40, top: 706, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 24, color: K.dim, letterSpacing: 2, opacity: pr(f, tf + 6, tf + 18) }}>Real AI Tools • Skills • Automation</div>
  </Stage>);
};

export const AiConcepts: React.FC = () => {
  const SC: [Id, React.FC][] = [["hook", Hook], ["llm", Llm], ["api", Api], ["tokens", Tokens], ["ft", Ft], ["rag", Rag], ["emb", Emb], ["dev", Dev], ["all", All], ["cta", Cta]];
  return (<AbsoluteFill style={{ background: K.bg }}>
    <Audio src={staticFile("audio/ac-mix.wav")} />
    <Background />
    {SC.map(([id, C]) => <Sequence key={id} from={S0(id)} durationInFrames={S1(id) - S0(id) + 14} layout="none"><C /></Sequence>)}
    {IDS.slice(1, 9).filter((x) => x !== "dev").map((id, i) => LINES && (SIDE[id] !== undefined) && <Sequence key={"sc" + id} from={S0(id)} durationInFrames={S1(id) - S0(id)} layout="none"><SideCardFor id={id} /></Sequence>)}
    <Header /><Caps /><RobotLayer />
  </AbsoluteFill>);
};

const SIDE_TXT: Partial<Record<Id, [string, string, string]>> = {
  llm: ["WHAT IT IS", "A model that predicts language", "trained on huge amounts of text"],
  api: ["WHY IT MATTERS", "How software talks to services", "your app asks, the service answers"],
  tokens: ["REMEMBER", "Tokens ≠ words", "they set context limits, usage and often cost"],
  ft: ["IN SHORT", "Train a model further on examples", "not the same as retrieval"],
  rag: ["IN SHORT", "Look it up first, then answer", "retrieval is separate from training"],
  emb: ["IN SHORT", "Meaning as numbers", "close vectors = similar meaning"],
  dev: ["IN PRACTICE", "The roles overlap", "titles differ by team and company"],
  all: ["THE SYSTEM", "Each concept has a job", "fine-tuning is the optional path"],
};
const SideCardFor: React.FC<{ id: Id }> = ({ id }) => { const f = useCurrentFrame(); const tx = SIDE_TXT[id]; if (!tx) return null; const b = S1(id) - S0(id); const q = clamp((f - (b - 10)) / 10); return <div style={{ opacity: 1 - q }}><SideCard id={id} label={tx[0]} text={tx[1]} sub={tx[2]} a={Math.max(Math.round(b * 0.18), 100)} /></div>; };
