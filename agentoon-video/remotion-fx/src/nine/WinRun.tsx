import React from "react";
import { AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Robot2, pose2, Gest2, Walk, walkDistance } from "../fx/RobotRig2";
import { clamp } from "../fx/math";
import TL from "../../public/data/win-timeline.json";

/** Episode 26: WIN + R, 5 Windows commands (Part 9). PREVIEW.
 *  IMPORTANT HONESTY: no Windows PC was available. Every Windows window below is an ORIGINAL ILLUSTRATION drawn in Remotion (no Microsoft assets, no Windows logo), made at the user's request,
 *  and it is labelled on screen "ILLUSTRATION · NOT A REAL WINDOWS RECORDING". List rows/dates are generic sample text, not real data. */
export const WIN_FRAMES = TL.frames as number;
type Ln = { id: string; sf: number; ef: number };
const LINES = TL.lines as Ln[]; const WORDS = TL.words as { w: string; line: string; s: number; e: number }[];
const LN = (id: string) => LINES.find((l) => l.id === id)!;
const IDS = ["hook", "c41", "c42", "c43", "c44", "c45", "close"] as const; type Id = (typeof IDS)[number];
const PAD = 45;
const S0 = (id: Id) => (id === "hook" ? 0 : id === "close" ? LN(id).sf - 6 : LN(id).sf - PAD);
const S1 = (id: Id) => { const i = IDS.indexOf(id); return i === IDS.length - 1 ? WIN_FRAMES : S0(IDS[i + 1]); };
const cue = (id: string, word: string, nth = 0) => { const ws = WORDS.filter((w) => w.line === id); const m = ws.filter((w) => w.w.toLowerCase().replace(/[^a-z0-9@-]/g, "").includes(word.toLowerCase())); return (m[nth] ?? m[0] ?? { s: LN(id).sf }).s; };
const tc = (id: Id, word: string, nth = 0) => cue(id, word, nth) - S0(id);
const K = { bg: "#05080E", panel: "rgba(13,20,33,.92)", line: "rgba(255,255,255,.14)", green: "#3DDC97", cyan: "#38D6F5", orange: "#FF9A3C", white: "#F4F7FB", dim: "#8A97AD", red: "#FF5D6C" };
const ACC: Record<Id, string> = { hook: K.cyan, c41: K.orange, c42: K.cyan, c43: K.green, c44: K.orange, c45: K.cyan, close: K.green };
const sans = '"Inter","DejaVu Sans",Arial,sans-serif'; const mono = '"DejaVu Sans Mono",ui-monospace,Menlo,monospace'; const seg = '"Segoe UI","Inter","DejaVu Sans",Arial,sans-serif';
const POP = { damping: 13, stiffness: 150, mass: 0.8 }; const SOFT = { damping: 22, stiffness: 100, mass: 1 };
const E = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
const pr = (f: number, a: number, b: number) => E((f - a) / (b - a));
const useSp = (a: number, cfg = POP) => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return spring({ frame: f - a, fps, config: cfg }); };

/* ============ robot ============ */
const RW = 340, RK = RW / 200, FLOORY = 1630; const ROBOT_TOP = FLOORY - RW * 1.4 * (272 / 280);
const LEFT = 30, RIGHT = 700, CENTER = 370;
const SIDE: Record<Id, number> = { hook: CENTER, c41: LEFT, c42: RIGHT, c43: LEFT, c44: RIGHT, c45: LEFT, close: RIGHT };
type WSeg = { w: Walk; dir: 1 | -1; x0: number; x1: number };
const fitWalk = (from: number, need: number): Walk => { let to = from + 24; const mk = (): Walk => ({ from, to, ramp: 12, amp: 30, stepsPerSec: 2.5 }); while (walkDistance(to, mk()) * RK < need) to++; return mk(); };
const WSEGS: WSeg[] = (() => { const out: WSeg[] = []; let x = -RW - 20; IDS.forEach((id) => { const target = SIDE[id]; const need = Math.abs(target - x); const from = id === "hook" ? 4 : S0(id) + 3; if (need < 6 && id !== "hook") return; const w = fitWalk(from, need); const d = walkDistance(w.to, w) * RK * (target >= x ? 1 : -1); out.push({ w, dir: target >= x ? 1 : -1, x0: x, x1: x + d }); x += d; }); return out; })();
const robotX = (f: number) => { let x = WSEGS[0].x0; for (const s of WSEGS) { if (f < s.w.from) return x; if (f >= s.w.to) { x = s.x1; continue; } return s.x0 + s.dir * walkDistance(f, s.w) * RK; } return x; };
const facing = (f: number) => { for (const s of WSEGS) if (f >= s.w.from && f <= s.w.to + 2) return s.dir; return 1; };
const POINTS: Partial<Record<Id, string[]>> = { hook: ["windows", "press"], c41: ["scheduler", "automated", "when", "actions", "startup"], c42: ["wizard", "configure", "control", "files"], c43: ["assistance", "desktop", "without"], c44: ["sign-in", "pin", "fingerprint", "device"], c45: ["security", "names", "dates", "troubleshooting"], close: ["powerful", "shortcut", "follow"] };
const GESTS: Gest2[] = (() => {
  const gs: Gest2[] = []; let alt = 0;
  IDS.forEach((id) => {
    const a = S0(id), b = S1(id), side = SIDE[id]; const hand: "L" | "R" = side >= RIGHT ? "L" : "R"; const ang = side >= RIGHT ? 74 : -72;
    const walkEnd = WSEGS.filter((s) => s.w.from >= a - 2 && s.w.from < b).reduce((m, s) => Math.max(m, s.w.to), a);
    let cur = walkEnd + 4; const pts = (POINTS[id] ?? []).map((w) => cue(id === "hook" ? "hook" : id, w) - 6).filter((t) => t > cur).sort((p, q) => p - q);
    const fill = (from: number, to: number) => { let t = from; while (t < to - 14) { const len = Math.min(to - t, 40 + (alt % 3) * 14); const type = alt % 3 === 0 ? "explain" : alt % 3 === 1 ? "present" : "both"; gs.push({ type, from: t, to: t + len, hand: alt % 2 ? "R" : "L" }); t += len + 2; alt++; } };
    for (const p of pts) { if (p - cur > 16) fill(cur, p - 2); const to = Math.min(b, p + 44); if (to - p > 10) gs.push({ type: "point", from: p, to, hand, angle: ang }); cur = Math.max(cur, to + 2); }
    if (id === "close") { gs.push({ type: "invite", from: Math.max(cur, b - 70), to: b }); fill(cur, b - 72); } else fill(cur, b);
  });
  return gs;
})();
const LIPA = TL.lip as { fps: number; a: number[] };
const RobotLayer: React.FC = () => {
  const f = useCurrentFrame(); const x = robotX(f); const speaking: [number, number][] = LINES.map((l) => [l.sf, l.ef + 4]);
  const p = pose2(f, { lip: LIPA, speaking, gestures: GESTS, walks: WSEGS.map((s) => s.w), seed: 7 });
  return (<>
    <div style={{ position: "absolute", left: x - 40, top: FLOORY - 56, width: RW + 80, height: 110, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(56,214,245,.28) 0%, rgba(56,214,245,0) 70%)", zIndex: 58 }} />
    <div style={{ position: "absolute", left: x, top: ROBOT_TOP, zIndex: 60 }}><Robot2 pose={p} width={RW} shadow={false} flip={facing(f) === -1} rim /></div></>);
};

/* ============ chrome ============ */
const Background: React.FC = () => {
  const f = useCurrentFrame(); const idx = IDS.findIndex((id) => f >= S0(id) && f < S1(id)); const acc = ACC[IDS[Math.max(0, idx)]]; const off = (f * 0.9) % 60;
  return (<AbsoluteFill style={{ background: `radial-gradient(1100px 900px at 50% 24%, #101d33 0%, #070c15 58%, ${K.bg} 100%)` }}>
    <div style={{ position: "absolute", left: -200, top: 120, width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${acc}33 0%, ${acc}00 66%)`, transform: `translate(${Math.sin(f / 90) * 40}px,${Math.cos(f / 110) * 30}px)` }} />
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: 14 }, (_, i) => { const y = 1420 + Math.pow((i * 60 + off) / 840, 1.8) * 500; return <line key={"h" + i} x1={0} x2={1080} y1={y} y2={y} stroke="rgba(56,214,245,.12)" strokeWidth={1.5} />; })}
      {Array.from({ length: 17 }, (_, i) => { const x0 = 540 + (i - 8) * 120; return <line key={"v" + i} x1={540 + (x0 - 540) * 0.18} y1={1420} x2={540 + (x0 - 540) * 3.2} y2={1920} stroke="rgba(56,214,245,.1)" strokeWidth={1.5} />; })}
      {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 197) % 1080 + Math.sin(f / 40 + i) * 20} cy={200 + ((i * 331) % 1400) - ((f * (0.2 + (i % 5) * 0.08)) % 120)} r={1 + (i % 3)} fill={i % 4 ? K.cyan : K.orange} opacity={0.3 + 0.3 * Math.sin(f / 18 + i)} />)}
    </svg></AbsoluteFill>);
};
const Header: React.FC = () => {
  const f = useCurrentFrame(); const i = IDS.findIndex((id) => f >= S0(id) && f < S1(id)); const k = Math.max(0, i); const acc = ACC[IDS[k]];
  return (<div style={{ position: "absolute", left: 40, right: 40, top: 86, height: 100, zIndex: 96, fontFamily: sans }}>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}><div style={{ fontWeight: 900, fontSize: 38, color: K.white, letterSpacing: 2 }}>WIN + R</div><div style={{ fontWeight: 800, fontSize: 24, color: acc, letterSpacing: 2 }}>PART 9</div>
      <div style={{ marginLeft: "auto", fontWeight: 800, fontSize: 24, color: K.dim, letterSpacing: 2 }}>AGENTOON<span style={{ color: K.cyan }}>.AI</span></div></div>
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>{Array.from({ length: 5 }, (_, j) => <div key={j} style={{ height: 7, flex: 1, borderRadius: 4, background: k - 1 >= j ? acc : "rgba(255,255,255,.14)" }} />)}</div></div>);
};
const Caps: React.FC = () => {
  const f = useCurrentFrame(); const idx = WORDS.findIndex((w) => f < w.e); const i = idx < 0 ? WORDS.length - 1 : Math.max(0, idx); const w0 = WORDS[i]; if (f < 3) return null;
  const line = WORDS.filter((w) => w.line === w0.line); const lw = line.indexOf(w0); const chunk = Math.floor(lw / 5) * 5; const shown = line.slice(chunk, chunk + 5); const k = IDS.indexOf(w0.line as Id); const acc = ACC[IDS[k < 0 ? 0 : k]];
  return (<div style={{ position: "absolute", left: 30, right: 30, top: 205, height: 190, borderRadius: 28, background: "rgba(5,8,14,.84)", border: `1.5px solid ${K.line}`, zIndex: 95, padding: "22px 26px", boxShadow: "0 16px 40px rgba(0,0,0,.45)", display: "flex", alignItems: "center" }}>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontFamily: sans, fontWeight: 900, fontSize: 54, color: "#fff", lineHeight: 1.1 }}>
      {shown.map((w, q) => { const act = chunk + q === lw; const p = act ? spring({ frame: f - w.s, fps: 30, config: { damping: 11, stiffness: 220, mass: 0.7 } }) : 1; return <span key={w.s + "_" + q} style={{ padding: "0 10px", borderRadius: 10, background: act ? acc : "transparent", color: act ? K.bg : "#fff", transform: `scale(${act ? 0.92 + 0.08 * p : 1})`, display: "inline-block" }}>{w.w}</span>; })}</div></div>);
};
const Stage: React.FC<{ id: Id; children: React.ReactNode; full?: boolean }> = ({ id, children, full }) => {
  const f = useCurrentFrame(); const a = S0(id), b = S1(id); const p = E(f / 14), q = E((f - (b - a)) / 12); const sc = 1 + 0.03 * clamp(f / (b - a));
  const dx = (1 - p) * 110 - q * 110; const blur = (1 - p) * 10 + q * 10; const op = clamp(p * 1.4) * (1 - q);
  return (<div style={{ position: "absolute", left: 0, top: full ? 0 : 430, width: 1080, height: full ? 1920 : 720, transform: `translateX(${dx}px) scale(${sc})`, transformOrigin: "50% 50%", filter: blur > 0.2 ? `blur(${blur}px)` : undefined, opacity: op, zIndex: 40 }}>{children}</div>);
};
const Panel: React.FC<{ x: number; y: number; w: number; h: number; a?: number; acc?: string; children?: React.ReactNode; pad?: number }> = ({ x, y, w, h, a = 0, acc = K.line, children, pad = 16 }) => { const f = useCurrentFrame(); const s = useSp(a, SOFT); return (<div style={{ position: "absolute", left: x, top: y + Math.sin((f + x) / 40) * 3, width: w, height: h, opacity: clamp(s * 1.6), transform: `translateY(${(1 - s) * 30}px)`, borderRadius: 22, background: K.panel, border: `2px solid ${acc}`, boxShadow: "0 18px 40px rgba(0,0,0,.45)", padding: pad, fontFamily: sans, color: K.white, overflow: "hidden" }}>{children}</div>); };

/* ============ illustration desktop + Windows-style windows (ORIGINAL drawings) ============ */
const W = { bg: "#F3F3F3", card: "#FFFFFF", ink: "#1B1B1B", sub: "#616161", line: "#D9D9D9", blue: "#0067C0", sel: "#CCE4F7" };
const DESK_W = 1000, DESK_H = 560;
const Hi: React.FC<{ x: number; y: number; w: number; h: number; a: number; b?: number; c?: string }> = ({ x, y, w, h, a, b = 9999, c = K.orange }) => { const f = useCurrentFrame(); const p = pr(f, a, a + 12) * (1 - pr(f, b, b + 8)); if (p <= 0) return null; return (<svg width={w + 20} height={h + 20} style={{ position: "absolute", left: x - 10, top: y - 10, overflow: "visible", zIndex: 30, pointerEvents: "none" }}><rect x={10} y={10} width={w} height={h} rx={8} fill="none" stroke={c} strokeWidth={4} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 0 8px ${c})` }} opacity={0.4 + 0.6 * Math.abs(Math.sin(f / 9))} /></svg>); };
const Cursor: React.FC<{ keys: [number, number, number][]; clicks?: number[] }> = ({ keys, clicks = [] }) => {
  const f = useCurrentFrame(); let x = keys[0][1], y = keys[0][2]; for (let i = 0; i < keys.length - 1; i++) { const [f0, x0, y0] = keys[i], [f1, x1, y1] = keys[i + 1]; if (f >= f0 && f <= f1) { const t = E((f - f0) / (f1 - f0)); x = x0 + (x1 - x0) * t; y = y0 + (y1 - y0) * t; } else if (f > f1) { x = x1; y = y1; } }
  return (<div style={{ position: "absolute", left: 0, top: 0, zIndex: 40, pointerEvents: "none" }}>{clicks.map((c, i) => { const p = clamp((f - c) / 14); return p > 0 && p < 1 ? <div key={i} style={{ position: "absolute", left: x - 22, top: y - 22, width: 44, height: 44, borderRadius: "50%", border: `3px solid ${K.orange}`, transform: `scale(${0.3 + p})`, opacity: 1 - p }} /> : null; })}
    <svg width={28} height={34} style={{ position: "absolute", left: x, top: y, filter: "drop-shadow(0 2px 3px rgba(0,0,0,.5))" }}><path d="M2 2 L2 26 L8 20 L12 30 L17 28 L13 18 L22 18 Z" fill="#fff" stroke="#000" strokeWidth={2} strokeLinejoin="round" /></svg></div>);
};
const Win: React.FC<{ x: number; y: number; w: number; h: number; title: string; open: number; children: React.ReactNode; dark?: boolean }> = ({ x, y, w, h, title, open, children }) => {
  const f = useCurrentFrame(); const s = useSp(open, { damping: 16, stiffness: 170, mass: 0.7 }); if (f < open) return null;
  return (<div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `scale(${0.88 + 0.12 * s})`, transformOrigin: "50% 60%", opacity: clamp(s * 2), borderRadius: 10, background: W.bg, boxShadow: "0 24px 60px rgba(0,0,0,.55), 0 0 0 1px rgba(0,0,0,.3)", overflow: "hidden", fontFamily: seg, color: W.ink }}>
    <div style={{ height: 34, background: W.card, borderBottom: `1px solid ${W.line}`, display: "flex", alignItems: "center", padding: "0 12px", fontSize: 14, color: W.ink }}><div style={{ width: 14, height: 14, borderRadius: 3, background: W.blue, marginRight: 10 }} />{title}<div style={{ marginLeft: "auto", letterSpacing: 18, color: W.sub }}>—▢✕</div></div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 34, bottom: 0 }}>{children}</div></div>);
};
const Zoom: React.FC<{ keys: { f: number; cx: number; cy: number; s: number }[]; children: React.ReactNode }> = ({ keys, children }) => {
  const f = useCurrentFrame(); let s = keys[0].s, cx = keys[0].cx, cy = keys[0].cy; for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (f >= a.f && f <= b.f) { const t = E((f - a.f) / (b.f - a.f)); s = a.s + (b.s - a.s) * t; cx = a.cx + (b.cx - a.cx) * t; cy = a.cy + (b.cy - a.cy) * t; } else if (f > b.f) { s = b.s; cx = b.cx; cy = b.cy; } }
  const tx = Math.min(0, Math.max(DESK_W - DESK_W * s, DESK_W / 2 - cx * s)), ty = Math.min(0, Math.max(DESK_H - DESK_H * s, DESK_H / 2 - cy * s));
  return <div style={{ position: "absolute", left: 0, top: 0, width: DESK_W, height: DESK_H, transformOrigin: "0 0", transform: `translate(${tx}px,${ty}px) scale(${s})` }}>{children}</div>;
};
const Desktop: React.FC<{ id: Id; cmd: string; zoom?: { f: number; cx: number; cy: number; s: number }[]; children: React.ReactNode; clicks?: number[]; curs?: [number, number, number][] }> = ({ id, cmd, zoom = [{ f: 0, cx: 500, cy: 280, s: 1 }], children, clicks = [], curs }) => {
  const f = useCurrentFrame(); const a = 4, tp = 10, tEnd = PAD - 9; const typed = Math.floor(clamp((f - tp) / (tEnd - tp)) * cmd.length); const run = pr(f, a, a + 8) * (1 - pr(f, PAD - 5, PAD)); const enterAt = PAD - 8;
  return (<div style={{ position: "absolute", left: 40, top: 140, width: DESK_W, height: DESK_H, borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,.6), 0 0 0 3px rgba(255,255,255,.12)", background: "radial-gradient(900px 600px at 70% 30%, #6AA8FF 0%, #2B4FD8 38%, #0F1C5C 80%)", zIndex: 5 }}>
    <Zoom keys={zoom}>
      <div style={{ position: "absolute", left: 0, top: 0, width: DESK_W, height: DESK_H - 44 }}>{[0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: 24, top: 24 + i * 84, width: 56, height: 56, borderRadius: 12, background: "rgba(255,255,255,.18)" }} />)}</div>
      {children}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 44, background: "rgba(243,243,243,.86)", borderTop: "1px solid rgba(0,0,0,.15)", display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>{Array.from({ length: 7 }, (_, i) => <div key={i} style={{ width: 24, height: 24, borderRadius: 6, background: i === 0 ? W.blue : "rgba(0,0,0,.25)" }} />)}<div style={{ position: "absolute", right: 18, fontFamily: seg, fontSize: 13, color: W.ink }}>12:00</div></div>
      {run > 0 && (<div style={{ position: "absolute", left: 16, bottom: 62, width: 400, height: 176, borderRadius: 10, background: W.bg, boxShadow: "0 20px 50px rgba(0,0,0,.55)", opacity: run, transform: `translateY(${(1 - run) * 20}px)`, fontFamily: seg, color: W.ink, zIndex: 20, overflow: "hidden" }}>
        <div style={{ height: 30, background: W.card, borderBottom: `1px solid ${W.line}`, padding: "6px 12px", fontSize: 13 }}>Run</div>
        <div style={{ padding: "14px 16px", fontSize: 13, color: W.sub }}>Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.</div>
        <div style={{ margin: "0 16px", display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}><span>Open:</span><div style={{ flex: 1, height: 28, border: `1.5px solid ${W.blue}`, background: "#fff", padding: "4px 8px", fontFamily: mono, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden" }}>{cmd.slice(0, typed)}<span style={{ opacity: Math.floor(f / 7) % 2 }}>|</span></div></div>
        <div style={{ position: "absolute", right: 16, bottom: 12, display: "flex", gap: 8 }}><div style={{ width: 74, height: 26, borderRadius: 4, background: f > enterAt ? W.blue : "#fff", color: f > enterAt ? "#fff" : W.ink, border: `1px solid ${W.line}`, fontSize: 13, textAlign: "center", lineHeight: "26px", outline: f > enterAt - 3 && f < PAD ? `3px solid ${K.orange}` : "none" }}>OK</div><div style={{ width: 74, height: 26, borderRadius: 4, background: "#fff", border: `1px solid ${W.line}`, fontSize: 13, textAlign: "center", lineHeight: "26px" }}>Cancel</div></div></div>)}
      {curs ? <Cursor keys={curs} clicks={clicks} /> : null}
    </Zoom></div>);
};

const Row: React.FC<{ cols: string[]; widths: number[]; sel?: boolean; hdr?: boolean; y?: number }> = ({ cols, widths, sel, hdr }) => (<div style={{ display: "flex", height: 30, alignItems: "center", background: sel ? W.sel : "transparent", borderBottom: `1px solid ${W.line}`, fontSize: hdr ? 12 : 13, color: hdr ? W.sub : W.ink, fontWeight: hdr ? 600 : 400 }}>{cols.map((c, i) => <div key={i} style={{ width: widths[i], padding: "0 10px", whiteSpace: "nowrap", overflow: "hidden" }}>{c}</div>)}</div>);

/* 41 Task Scheduler */
const Win41: React.FC<{ id: Id; o: number; hl?: boolean }> = ({ id, o, hl = true }) => {
  const f = useCurrentFrame(); const t = (w: string) => tc(id, w); const rows = [["Sample daily task", "Ready", "At 3:00 every day", "Tomorrow 3:00"], ["Sample startup task", "Ready", "At system startup", "n/a"], ["Sample weekly task", "Ready", "At 9:00 every Monday", "Next Monday 9:00"], ["Sample logon task", "Ready", "At log on of any user", "n/a"]]; const ws = [210, 90, 190, 170];
  return (<><Win x={30} y={20} w={940} h={480} title="Task Scheduler" open={o}>
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ width: 210, borderRight: `1px solid ${W.line}`, padding: 10, fontSize: 13, lineHeight: "26px" }}><div>▾ Task Scheduler (Local)</div><div style={{ background: W.sel, borderRadius: 4, paddingLeft: 12, color: W.blue, fontWeight: 600 }}>Task Scheduler Library</div><div style={{ paddingLeft: 12 }}>▸ Microsoft</div></div>
      <div style={{ flex: 1 }}><Row hdr cols={["Name", "Status", "Triggers", "Next Run Time"]} widths={ws} />{rows.map((r, i) => <Row key={i} cols={r} widths={ws} sel={i === 0 && f > o + 20} />)}
        <div style={{ margin: 10, borderTop: `1px solid ${W.line}`, paddingTop: 8 }}><div style={{ display: "flex", gap: 18, fontSize: 13, color: W.sub }}>{["General", "Triggers", "Actions", "Conditions"].map((x, i) => <div key={x} style={{ borderBottom: (f < t("actions") ? i === 1 : i === 2) ? `3px solid ${W.blue}` : "none", color: (f < t("actions") ? i === 1 : i === 2) ? W.ink : W.sub, fontWeight: 600 }}>{x}</div>)}</div>
          <div style={{ marginTop: 10, fontSize: 14 }}>{f < t("actions") ? "Daily - At 3:00 every day  (Enabled)" : "Start a program - Sample application"}</div></div></div></div></Win>
    {hl && <><Hi x={241} y={84} w={660} h={30} a={t("automated")} b={t("when")} c={K.orange} /><Hi x={541} y={54} w={190} h={150} a={t("when")} b={t("actions")} c={K.cyan} /><Hi x={241} y={212} w={660} h={74} a={t("actions")} b={t("startup")} c={K.green} /><Hi x={241} y={54} w={660} h={150} a={t("startup")} c={K.orange} /></>}</>);
};
const Win42: React.FC<{ id: Id; o: number; hl?: boolean }> = ({ id, o, hl = true }) => {
  const f = useCurrentFrame(); const t1 = tc(id, "configure"), t2 = tc(id, "control"), t3 = tc(id, "files"); const pg = f < t1 ? 0 : f < t2 ? 1 : 2; const titles = ["Welcome to the Create a Shared Folder Wizard", "Folder Path", "Shared Folder Permissions"];
  return (<><Win x={170} y={30} w={660} h={460} title="Create a Shared Folder Wizard" open={o}><div style={{ padding: "26px 30px" }}>
    <div style={{ fontSize: 22, fontWeight: 600, color: W.blue }}>{titles[pg]}</div>
    <div style={{ marginTop: 18, fontSize: 15, color: W.ink, lineHeight: "24px" }}>{pg === 0 && "This wizard helps you share a folder so other people on the network can reach it, and set who has access."}{pg === 1 && <>Browse to the folder you want to share and give the share a name.<div style={{ marginTop: 14, height: 30, border: `1px solid ${W.line}`, background: "#fff", padding: "4px 8px", fontSize: 13, color: W.sub }}>Folder path: (choose a folder)</div><div style={{ marginTop: 10, height: 30, border: `1px solid ${W.line}`, background: "#fff", padding: "4px 8px", fontSize: 13, color: W.sub }}>Share name: (choose a name)</div></>}{pg === 2 && <>Choose who can open the folder:{["All users have read-only access", "Administrators have full access; other users read-only", "Customize permissions"].map((x, i) => <div key={i} style={{ marginTop: 10, display: "flex", gap: 10, fontSize: 14 }}><div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${W.sub}`, background: i === 0 ? W.blue : "#fff" }} />{x}</div>)}</>}</div>
    <div style={{ position: "absolute", right: 24, bottom: 20, display: "flex", gap: 10 }}>{["< Back", "Next >", "Cancel"].map((x, i) => <div key={x} style={{ width: 84, height: 30, border: `1px solid ${W.line}`, background: i === 1 ? W.blue : "#fff", color: i === 1 ? "#fff" : W.ink, borderRadius: 4, textAlign: "center", lineHeight: "30px", fontSize: 13 }}>{x}</div>)}</div></div></Win>
    {hl && <><Hi x={200} y={84} w={600} h={40} a={o + 12} b={t1} c={K.cyan} /><Hi x={200} y={170} w={600} h={80} a={t1} b={t2} c={K.orange} /><Hi x={200} y={130} w={600} h={130} a={t2} b={t3} c={K.green} /><Hi x={716} y={436} w={96} h={38} a={t3} c={K.red} /></>}</>);
};
const Win43: React.FC<{ id: Id; o: number; hl?: boolean }> = ({ id, o, hl = true }) => {
  const t1 = tc(id, "assistance"), t2 = tc(id, "desktop"), t3 = tc(id, "without");
  return (<><Win x={230} y={22} w={540} h={500} title="System Properties" open={o}><div style={{ padding: "12px 16px" }}>
    <div style={{ display: "flex", gap: 0, fontSize: 12, borderBottom: `1px solid ${W.line}` }}>{["Computer Name", "Hardware", "Advanced", "System Protection", "Remote"].map((x) => <div key={x} style={{ padding: "6px 8px", background: x === "Remote" ? "#fff" : "transparent", border: x === "Remote" ? `1px solid ${W.line}` : "none", borderBottom: "none", fontWeight: x === "Remote" ? 600 : 400 }}>{x}</div>)}</div>
    <div style={{ marginTop: 14, border: `1px solid ${W.line}`, borderRadius: 6, padding: 12, background: "#fff" }}><div style={{ fontWeight: 600, fontSize: 14 }}>Remote Assistance</div><div style={{ marginTop: 8, display: "flex", gap: 8, fontSize: 13 }}><div style={{ width: 16, height: 16, border: `2px solid ${W.sub}` }} />Allow Remote Assistance connections to this computer</div><div style={{ marginTop: 8, fontSize: 12, color: W.sub }}>Lets a trusted person help you remotely.</div></div>
    <div style={{ marginTop: 12, border: `1px solid ${W.line}`, borderRadius: 6, padding: 12, background: "#fff" }}><div style={{ fontWeight: 600, fontSize: 14 }}>Remote Desktop</div>{["Don't allow remote connections to this computer", "Allow remote connections to this computer"].map((x, i) => <div key={x} style={{ marginTop: 8, display: "flex", gap: 8, fontSize: 13 }}><div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${W.sub}`, background: i === 0 ? W.blue : "#fff" }} />{x}</div>)}<div style={{ marginTop: 10, fontSize: 12, color: W.sub }}>Hosting incoming connections depends on your Windows edition (not available on Home).</div></div>
    <div style={{ position: "absolute", right: 20, bottom: 16, display: "flex", gap: 8 }}>{["OK", "Cancel", "Apply"].map((x) => <div key={x} style={{ width: 72, height: 28, border: `1px solid ${W.line}`, background: "#fff", borderRadius: 4, textAlign: "center", lineHeight: "28px", fontSize: 13 }}>{x}</div>)}</div></div></Win>
    {hl && <><Hi x={246} y={106} w={508} h={100} a={t1} b={t2} c={K.cyan} /><Hi x={246} y={214} w={508} h={150} a={t2} b={t3} c={K.orange} /><Hi x={246} y={322} w={508} h={44} a={t3} c={K.green} /></>}</>);
};
const Settings: React.FC<{ o: number; title: string; children: React.ReactNode }> = ({ o, title, children }) => (<Win x={60} y={14} w={880} h={500} title="Settings" open={o}><div style={{ display: "flex", height: "100%" }}><div style={{ width: 200, padding: 12, fontSize: 13, lineHeight: "30px", color: W.sub, background: "#EDEDED" }}>{["Accounts", "Your info", "Sign-in options", "Windows Update", "Update history"].map((x) => <div key={x} style={{ color: x === title ? W.blue : W.sub, fontWeight: x === title ? 700 : 400 }}>{x}</div>)}</div><div style={{ flex: 1, padding: "14px 20px" }}><div style={{ fontSize: 24, fontWeight: 600 }}>{title}</div>{children}</div></div></Win>);
const Win44: React.FC<{ id: Id; o: number; hl?: boolean }> = ({ id, o, hl = true }) => {
  const t1 = tc(id, "pin"), t2 = tc(id, "fingerprint"), t3 = tc(id, "device"); const items = [["Facial recognition (Windows Hello)", "Sign in with your camera"], ["Fingerprint recognition (Windows Hello)", "Sign in with your fingerprint scanner"], ["PIN (Windows Hello)", "Sign in with a PIN"], ["Security key", "Sign in with a physical security key"], ["Password", "Sign in with your account password"]];
  return (<><Settings o={o} title="Sign-in options">{items.map(([a, b], i) => <div key={a} style={{ marginTop: 8, height: 54, background: "#fff", border: `1px solid ${W.line}`, borderRadius: 6, padding: "6px 14px" }}><div style={{ fontSize: 14, fontWeight: 600 }}>{a}</div><div style={{ fontSize: 12, color: W.sub }}>{b}</div></div>)}<div style={{ marginTop: 10, fontSize: 12, color: W.sub }}>Options shown depend on your device and hardware.</div></Settings>
    {hl && <><Hi x={280} y={226} w={640} h={56} a={t1} b={t2} c={K.cyan} /><Hi x={280} y={102} w={640} h={116} a={t2} b={t3} c={K.orange} /><Hi x={280} y={408} w={640} h={28} a={t3} c={K.green} /></>}</>);
};
const Win45: React.FC<{ id: Id; o: number; hl?: boolean }> = ({ id, o, hl = true }) => {
  const t1 = tc(id, "security"), t2 = tc(id, "names"), t3 = tc(id, "dates"); const cats = ["Quality Updates", "Driver Updates", "Definition Updates", "Other Updates"];
  return (<><Settings o={o} title="Update history">{cats.map((c, i) => <div key={c} style={{ marginTop: 8 }}><div style={{ height: 36, background: "#fff", border: `1px solid ${W.line}`, borderRadius: 6, padding: "8px 14px", fontSize: 14, fontWeight: 600 }}>{i === 0 ? "▾ " : "▸ "}{c}</div>{i === 0 && [0, 1, 2].map((r) => <div key={r} style={{ height: 44, marginLeft: 12, padding: "6px 14px", borderBottom: `1px solid ${W.line}`, background: "#fff" }}><div style={{ fontSize: 13, fontWeight: 600 }}>Example cumulative update (name shown here)</div><div style={{ fontSize: 12, color: W.sub }}>Successfully installed on (date shown here)</div></div>)}</div>)}</Settings>
    {hl && <><Hi x={280} y={102} w={640} h={36} a={t1} b={t2} c={K.cyan} /><Hi x={292} y={138} w={620} h={44} a={t2} b={t3} c={K.orange} /><Hi x={292} y={138} w={620} h={132} a={t3} c={K.green} /></>}</>);
};

/* ============ command scene frame ============ */
type Cfg = { id: Id; num: string; name: string; sub: string; cmd: string; Window: React.FC<{ id: Id; o: number; hl?: boolean }>; zoom: { f: number; cx: number; cy: number; s: number }[]; curs: [number, number, number][]; clicks: number[] };
const CFG: Cfg[] = [
  { id: "c41", num: "41", name: "TASK SCHEDULER", sub: "Inspect Windows automation", cmd: "taskschd.msc", Window: Win41, zoom: [{ f: 0, cx: 500, cy: 300, s: 1 }, { f: PAD + 20, cx: 500, cy: 280, s: 1 }, { f: PAD + 90, cx: 480, cy: 200, s: 1.45 }, { f: PAD + 170, cx: 600, cy: 180, s: 1.5 }, { f: PAD + 240, cx: 500, cy: 340, s: 1.4 }, { f: PAD + 300, cx: 500, cy: 280, s: 1 }], curs: [[0, 120, 470], [PAD - 16, 300, 420], [PAD + 20, 380, 110], [PAD + 80, 500, 150], [PAD + 160, 700, 320], [PAD + 300, 500, 300]], clicks: [PAD - 8, PAD + 24] },
  { id: "c42", num: "42", name: "NETWORK SHARING", sub: "Share folders with authorized users", cmd: "shrpubw", Window: Win42, zoom: [{ f: 0, cx: 500, cy: 300, s: 1 }, { f: PAD + 30, cx: 500, cy: 260, s: 1.3 }, { f: PAD + 150, cx: 500, cy: 260, s: 1.35 }, { f: PAD + 240, cx: 500, cy: 300, s: 1 }], curs: [[0, 120, 470], [PAD - 16, 300, 420], [PAD + 30, 700, 440], [PAD + 100, 720, 460], [PAD + 200, 720, 460]], clicks: [PAD - 8, tcN("c42", "configure") - 6, tcN("c42", "control") - 6] },
  { id: "c43", num: "43", name: "REMOTE ACCESS", sub: "Review remote connection settings", cmd: "SystemPropertiesRemote", Window: Win43, zoom: [{ f: 0, cx: 500, cy: 300, s: 1 }, { f: PAD + 40, cx: 500, cy: 200, s: 1.4 }, { f: PAD + 150, cx: 500, cy: 300, s: 1.4 }, { f: PAD + 260, cx: 500, cy: 280, s: 1 }], curs: [[0, 120, 470], [PAD - 16, 300, 420], [PAD + 40, 420, 150], [PAD + 150, 600, 300], [PAD + 260, 500, 300]], clicks: [PAD - 8] },
  { id: "c44", num: "44", name: "SIGN-IN SECURITY", sub: "Review Windows Hello options", cmd: "ms-settings:signinoptions", Window: Win44, zoom: [{ f: 0, cx: 500, cy: 300, s: 1 }, { f: PAD + 50, cx: 600, cy: 230, s: 1.4 }, { f: PAD + 150, cx: 600, cy: 260, s: 1.35 }, { f: PAD + 240, cx: 500, cy: 280, s: 1 }], curs: [[0, 120, 470], [PAD - 16, 300, 420], [PAD + 40, 620, 190], [PAD + 160, 620, 260], [PAD + 240, 500, 300]], clicks: [PAD - 8] },
  { id: "c45", num: "45", name: "UPDATE HISTORY", sub: "Review installed Windows updates", cmd: "ms-settings:windowsupdate-history", Window: Win45, zoom: [{ f: 0, cx: 500, cy: 300, s: 1 }, { f: PAD + 50, cx: 600, cy: 200, s: 1.4 }, { f: PAD + 160, cx: 600, cy: 260, s: 1.4 }, { f: PAD + 240, cx: 500, cy: 280, s: 1 }], curs: [[0, 120, 470], [PAD - 16, 300, 420], [PAD + 40, 620, 180], [PAD + 160, 620, 260], [PAD + 240, 500, 300]], clicks: [PAD - 8] },
];
function tcN(id: Id, w: string) { return tc(id, w); }

/* per-command visual identity cards (side, opposite the robot) */
const Ident: React.FC<{ id: Id }> = ({ id }) => {
  const f = useCurrentFrame(); const acc = ACC[id]; const left = SIDE[id] <= LEFT; const x = left ? 410 : 40; const s = useSp(PAD + 30, SOFT);
  const node = (xx: number, yy: number, t: string, c: string, w = 140) => <g><rect x={xx} y={yy} width={w} height={64} rx={14} fill={K.panel as string} stroke={c} strokeWidth={3} /><text x={xx + w / 2} y={yy + 40} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={22} fill={K.white}>{t}</text></g>;
  const dots = (x1: number, y1: number, x2: number, y2: number, c: string, n = 4) => Array.from({ length: n }, (_, i) => { const t = (((f * 0.012 + i / n) % 1) + 1) % 1; return <circle key={i} cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r={7} fill={c} opacity={Math.sin(Math.PI * t)} style={{ filter: `drop-shadow(0 0 6px ${c})` }} />; });
  const comp = (xx: number, yy: number, c: string) => <g><rect x={xx} y={yy} width={90} height={62} rx={8} fill={K.panel as string} stroke={c} strokeWidth={3} /><rect x={xx + 24} y={yy + 66} width={42} height={8} fill={c} /><rect x={xx + 12} y={yy + 76} width={66} height={8} rx={4} fill={c} /></g>;
  const shield = (cx: number, cy: number, c: string, sc = 1) => <path transform={`translate(${cx},${cy}) scale(${sc})`} d="M0 -34 L28 -22 V6 C28 22 14 32 0 38 C-14 32 -28 22 -28 6 V-22 Z" fill={c + "33"} stroke={c} strokeWidth={4} />;
  let body: React.ReactNode = null; let label = "";
  if (id === "c41") { label = "TRIGGER → ACTION"; body = <g>{node(10, 110, "Trigger", K.cyan)}{node(250, 110, "Action", K.orange)}{node(450, 110, "Status", K.green, 150)}<path d="M150 142 L250 142 M390 142 L450 142" stroke={K.white} strokeWidth={3} />{dots(150, 142, 250, 142, K.cyan)}{dots(390, 142, 450, 142, K.orange)}<g transform="translate(70,24)"><rect width={64} height={56} rx={8} fill="#fff" /><rect width={64} height={16} rx={8} fill={K.orange} /><text x={32} y={44} textAnchor="middle" fontFamily={sans} fontWeight={900} fontSize={24} fill="#111">41</text></g><g transform="translate(520,56)"><circle r={34} fill="none" stroke={K.cyan} strokeWidth={4} /><line x1={0} y1={0} x2={0} y2={-22} stroke={K.cyan} strokeWidth={4} transform={`rotate(${f * 4})`} /><line x1={0} y1={0} x2={16} y2={0} stroke={K.white} strokeWidth={4} transform={`rotate(${f / 3})`} /></g></g>; }
  if (id === "c42") { label = "CONCEPT · NOT A LIVE SHARE"; body = <g>{comp(10, 70, K.cyan)}{comp(500, 70, K.green)}<g transform={`translate(${250 + 70 * Math.sin(f / 14)},120)`}><path d="M0 0 H22 L28 8 H56 V44 H0 Z" fill={K.orange} /></g>{dots(110, 100, 500, 100, K.orange, 5)}{shield(300, 60, K.green, 0.9)}<text x={300} y={230} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={22} fill={K.dim}>permissions decide who gets in</text></g>; }
  if (id === "c43") { label = "CONCEPT · NO CONNECTION MADE"; body = <g>{comp(10, 70, K.green)}{comp(500, 70, K.cyan)}{dots(110, 100, 500, 100, K.green, 5)}{shield(300, 100, K.green, 1.1)}<rect x={280} y={92} width={40} height={30} rx={6} fill={K.green} /><path d="M288 92 V82 a12 12 0 0 1 24 0 V92" fill="none" stroke={K.green} strokeWidth={4} /><text x={300} y={230} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={22} fill={K.dim}>Assistance · Desktop (edition dependent)</text></g>; }
  if (id === "c44") { label = "FINGERPRINT · FACE · PIN"; body = <g><g transform="translate(70,100)">{[44, 34, 24, 14].map((r, i) => <circle key={i} r={r} fill="none" stroke={K.orange} strokeWidth={4} strokeDasharray={`${40 - i * 6} 10`} transform={`rotate(${f * (i % 2 ? -2 : 2)})`} />)}</g><g transform="translate(250,100)"><rect x={-44} y={-44} width={88} height={88} rx={20} fill="none" stroke={K.cyan} strokeWidth={4} strokeDasharray="30 18" /><circle cx={-14} cy={-8} r={5} fill={K.cyan} /><circle cx={14} cy={-8} r={5} fill={K.cyan} /><path d="M-16 16 Q0 28 16 16" fill="none" stroke={K.cyan} strokeWidth={4} /></g>{shield(430, 100, K.green, 1.2)}{[0, 1, 2, 3].map((i) => <circle key={i} cx={510 + i * 28} cy={100} r={9} fill={f % 60 > i * 12 ? K.white : "rgba(255,255,255,.25)"} />)}<text x={300} y={230} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={22} fill={K.dim}>options depend on your hardware</text></g>; }
  if (id === "c45") { label = "UPDATE TIMELINE"; body = <g><line x1={30} y1={110} x2={600} y2={110} stroke={K.dim} strokeWidth={4} />{[0, 1, 2, 3].map((i) => { const p = pr(f, PAD + 40 + i * 18, PAD + 56 + i * 18); return <g key={i} opacity={p}><circle cx={90 + i * 135} cy={110} r={16} fill={K.cyan} /><path d={`M${82 + i * 135} 110 l6 7 l12 -14`} stroke={K.bg} strokeWidth={4} fill="none" /><rect x={50 + i * 135} y={20} width={80} height={50} rx={8} fill="#fff" /><rect x={50 + i * 135} y={20} width={80} height={14} rx={7} fill={K.orange} /></g>; })}{shield(560, 190, K.green, 0.8)}<text x={300} y={230} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={22} fill={K.dim}>history ≠ proof you are fully up to date</text></g>; }
  return (<div style={{ position: "absolute", left: x, top: 1180, width: 630, height: 330, zIndex: 70, opacity: clamp(s * 1.6), transform: `translateX(${(1 - s) * (left ? 80 : -80)}px)`, borderRadius: 24, background: K.panel as string, border: `1.5px solid ${acc}88`, boxShadow: `0 0 40px ${acc}22, 0 18px 40px rgba(0,0,0,.5)`, fontFamily: sans, padding: "16px 22px" }}>
    <div style={{ fontWeight: 800, fontSize: 22, color: acc, letterSpacing: 3 }}>{label}</div>
    <svg width={586} height={260} style={{ marginTop: 4, overflow: "visible" }}>{body}</svg></div>);
};

const CommandScene: React.FC<{ c: Cfg }> = ({ c }) => {
  const f = useCurrentFrame(); const s = useSp(2); const W_ = c.Window;
  return (<Stage id={c.id}>
    <div style={{ position: "absolute", left: 40, top: 0, display: "flex", alignItems: "center", gap: 20, fontFamily: sans, opacity: clamp(s * 1.6), transform: `translateX(${(1 - s) * -60}px)` }}>
      <div style={{ fontWeight: 900, fontSize: 118, color: ACC[c.id], lineHeight: 1, textShadow: `0 0 30px ${ACC[c.id]}88, 0 6px 0 ${ACC[c.id]}44`, transform: `perspective(600px) rotateY(${Math.sin(f / 30) * 10}deg)` }}>{c.num}</div>
      <div><div style={{ fontWeight: 900, fontSize: 40, color: K.white, letterSpacing: 2 }}>{c.name}</div><div style={{ fontWeight: 700, fontSize: 26, color: K.dim }}>{c.sub}</div></div></div>
    <Desktop id={c.id} cmd={c.cmd} zoom={c.zoom} curs={c.curs} clicks={c.clicks}><W_ id={c.id} o={PAD} /></Desktop>
    <div style={{ position: "absolute", left: 40, top: 704, width: 1000, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 19, color: K.dim, letterSpacing: 1 }}>ILLUSTRATION · NOT A REAL WINDOWS RECORDING · sample text only</div>
  </Stage>);
};

/* ============ hook: montage + physical keyboard ============ */
const KEYROWS = [["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="], ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]"], ["Caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"], ["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"], ["Ctrl", "WIN", "Alt", "Space", "Alt", "Ctrl"]];
const Hook: React.FC = () => {
  const f = useCurrentFrame(); const tH = tc("hook", "hold"), tR = tc("hook", "press"); const KW = 66, G = 6; const winDown = pr(f, tH - 4, tH + 4) * (1 - pr(f, 140, 146)); const rDown = pr(f, tR - 4, tR + 3) * (1 - pr(f, 140, 146));
  const mont = [[Win41, "c41"], [Win42, "c42"], [Win43, "c43"], [Win44, "c44"], [Win45, "c45"]] as const; const mi = Math.floor(f / 9); const showM = f < 45; const kb = pr(f, 40, 56);
  return (<Stage id="hook" full>
    {showM && (() => { const [C_, id] = mont[Math.min(4, mi)]; const t = (f % 9) / 9; return <div style={{ position: "absolute", left: 40, top: 660, transform: `scale(${0.78 + t * 0.04})`, transformOrigin: "50% 0%", opacity: 1 - (f > 40 ? pr(f, 40, 46) : 0) }}><div style={{ position: "relative", width: DESK_W, height: DESK_H, borderRadius: 18, overflow: "hidden", background: "radial-gradient(900px 600px at 70% 30%, #6AA8FF 0%, #2B4FD8 38%, #0F1C5C 80%)", boxShadow: "0 30px 70px rgba(0,0,0,.6)" }}><C_ id={id as Id} o={0} hl={false} /></div></div>; })()}
    <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: 130, color: K.white, letterSpacing: 4, opacity: pr(f, 4, 16), textShadow: `0 0 40px ${K.cyan}aa`, transform: `scale(${0.85 + 0.15 * pr(f, 4, 18)})` }}>WIN + R</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 590, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: 36, color: K.cyan, opacity: pr(f, 10, 24) * (showM ? 1 : 1) }}>5 WINDOWS COMMANDS YOU SHOULD KNOW</div>
    <div style={{ position: "absolute", left: 0, top: 700, width: 1080, perspective: 1200, opacity: kb }}>
      <div style={{ margin: "0 auto", width: 1000, transform: `rotateX(38deg) rotateZ(${Math.sin(f / 50) * 1.5}deg) translateY(${(1 - kb) * 60}px)`, transformStyle: "preserve-3d" }}>
        {KEYROWS.map((row, ri) => <div key={ri} style={{ display: "flex", gap: G, marginBottom: G, justifyContent: "center" }}>{row.map((k, ki) => { const isW = k === "WIN", isR = k === "R" && ri === 1; const down = isW ? winDown : isR ? rDown : 0; const w = k === "Space" ? 360 : k === "Tab" || k === "Caps" || k === "Shift" ? 100 : k === "Ctrl" || k === "Alt" || k === "WIN" ? 86 : KW; const glow = (isW || isR) ? K.cyan : undefined; return <div key={ki} style={{ width: w, height: KW, borderRadius: 12, background: glow ? `linear-gradient(180deg, ${K.cyan}, #1c8fb0)` : "linear-gradient(180deg,#2a3448,#161c2b)", border: `2px solid ${glow ?? "rgba(255,255,255,.18)"}`, boxShadow: glow ? `0 0 ${24 + 20 * down}px ${K.cyan}, 0 ${6 - 5 * down}px 0 #0d4a5e` : "0 6px 0 #0b0f18", transform: `translateY(${down * 6}px)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 800, fontSize: k.length > 2 ? 20 : 28, color: glow ? "#021" : "#c7d2e6" }}>{k === "Space" ? "" : k}</div>; })}</div>)}
        {[["WIN", 0.5, tH], ["R", 0.62, tR]].map(([k, px, tt], i) => { const d = pr(f, (tt as number) - 22, (tt as number) - 4); return <div key={i} style={{ position: "absolute", left: i === 0 ? 245 : 400, top: i === 0 ? 4 * (KW + G) - 70 + (1 - d) * -150 : 1 * (KW + G) - 70 + (1 - d) * -150, width: 54, height: 150, borderRadius: 30, background: "linear-gradient(90deg,#f0c8a8,#d8a07c)", opacity: clamp(d * 2) * (1 - pr(f, 138, 146)), boxShadow: "0 12px 20px rgba(0,0,0,.45)" }} />; })}
      </div></div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1130, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 24, color: K.dim, opacity: kb }}>keyboard shown is a graphic · windows shown are illustrations</div>
  </Stage>);
};

const Close: React.FC = () => {
  const f = useCurrentFrame(); const items = [["41", "taskschd.msc", K.orange], ["42", "shrpubw", K.cyan], ["43", "SystemPropertiesRemote", K.green], ["44", "ms-settings:signinoptions", K.orange], ["45", "ms-settings:windowsupdate-history", K.cyan]] as const; const tf = tc("close", "follow");
  return (<Stage id="close">
    <div style={{ position: "absolute", left: 0, right: 0, top: -4, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: 54, color: K.white, letterSpacing: 3 }}>SAVE THESE 5 COMMANDS</div>
    <div style={{ position: "absolute", left: 40, top: 70, width: 1000, display: "flex", flexDirection: "column", gap: 10 }}>{items.map(([n, c, col], i) => { const s = spring({ frame: f - 8 - i * 20, fps: 30, config: POP }); return <div key={n} style={{ height: 86, borderRadius: 20, background: K.panel as string, border: `3px solid ${col}`, display: "flex", alignItems: "center", gap: 22, padding: "0 26px", opacity: clamp(s * 1.6), transform: `translateX(${(1 - s) * 140}px)`, boxShadow: `0 0 24px ${col}33` }}><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 56, color: col, width: 80 }}>{n}</div><div style={{ fontFamily: mono, fontWeight: 700, fontSize: c.length > 24 ? 31 : 38, color: K.white }}>{c}</div></div>; })}</div>
    <div style={{ position: "absolute", left: 40, top: 584, width: 1000, height: 90, borderRadius: 45, background: `linear-gradient(90deg, ${K.cyan}, ${K.green})`, opacity: pr(f, tf - 8, tf + 6), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 900, fontSize: 42, color: K.bg }}>FOLLOW @agentoon.ai</div>
    <div style={{ position: "absolute", left: 40, top: 688, width: 1000, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 22, color: K.dim, letterSpacing: 2, opacity: pr(f, tf, tf + 12) }}>PART 9 — WINDOWS SHORTCUTS · Real AI Tools • Skills • Automation</div>
  </Stage>);
};

export const WinRun: React.FC = () => (
  <AbsoluteFill style={{ background: K.bg }}>
    <Audio src={staticFile("audio/win-mix.wav")} />
    <Background />
    <Sequence from={S0("hook")} durationInFrames={S1("hook") - S0("hook") + 14} layout="none"><Hook /></Sequence>
    {CFG.map((c) => <Sequence key={c.id} from={S0(c.id)} durationInFrames={S1(c.id) - S0(c.id) + 14} layout="none"><CommandScene c={c} /><Ident id={c.id} /></Sequence>)}
    <Sequence from={S0("close")} durationInFrames={S1("close") - S0("close")} layout="none"><Close /></Sequence>
    <Header /><Caps /><RobotLayer />
  </AbsoluteFill>
);
