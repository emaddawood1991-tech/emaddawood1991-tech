import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Robot2, pose2, Gest2 } from "../fx/RobotRig2";
import { clamp } from "../fx/math";
import TL from "../../public/data/rmc-timeline.json";
import REAL from "../../public/data/rmc-real.json";
import CLIPS from "../../public/ep24/claude/clips.json";

/** My Robot Meets Claude Code: dialogue about Anthropic Agent Skills. Original Agentoon.ai production, NOT an official Anthropic ad; the Claude character is an original fan-style
 *  character (Blender 5.3 render of a body traced from the official Claude Code docs favicon). Real material: skills cloned from github.com/anthropics/skills, a real
 *  `claude -p` run of frontend-design and webapp-testing on a sample site, real Playwright output, real `claude plugin` terminal captures, real docs.code.claude.com page. */
type Line = { id: string; who: "A" | "C"; start: number; end: number; sf: number; ef: number; scene: string };
const LINES = TL.lines as Line[]; const L = (id: string) => LINES.find((l) => l.id === id)!; export const RMC_FRAMES = TL.frames;
const LIP = { A: TL.lipA as { fps: number; a: number[] }, C: TL.lipC as { fps: number; a: number[] } };
const C = { cream: "#F0EEE6", wall1: "#F3EEE2", wall2: "#E2D9C6", floor: "#CDBFA8", ink: "#141413", coral: "#D97757", coralD: "#B85C3E", teal: "#1FC9B6", soft: "#6E665C", paper: "#FBF9F4", dark: "#1B1613" };
const sans = '"Inter", "DejaVu Sans", Arial, sans-serif'; const mono = '"DejaVu Sans Mono", ui-monospace, Menlo, monospace';
const POP = { damping: 13, stiffness: 140, mass: 0.8 }; const SOFT = { damping: 22, stiffness: 100, mass: 1 };
const shot = (n: string) => staticFile(`ep24/shots/${n}`); const termf = (n: string) => staticFile(`ep24/term/${n}`);
const cue = (id: string, word: string, nth = 0) => { const l = L(id); const ws = TL.words.filter((w) => w.line === id); const m = ws.filter((w) => w.w.toLowerCase().replace(/[^a-z0-9@-]/g, "").includes(word.toLowerCase())); const w = m[nth] ?? m[0]; return w ? w.s : l.sf; };
const at = (s: number) => Math.round(s * 30);
const on = (f: number, a: number, b: number) => f >= a && f < b;
const fadeIO = (f: number, a: number, b: number, k = 8) => clamp(Math.min((f - a) / k, (b - f) / k));

/* ================= robot ================= */
const RW = 380, RK = RW / 200, FLOORY = 1640; const RX = 40;
const gA = (id: string, parts: [number, number, Gest2["type"], ("L" | "R")?, number?][]): Gest2[] => parts.map(([a, b, type, hand, angle]) => ({ type, from: L(id).sf + a, to: L(id).sf + b, hand, angle }));
const ROBOT_G: Gest2[] = [
  ...gA("l01", [[4, 60, "explain"], [64, 120, "point", "R", -70], [124, 160, "explain"]]),
  ...gA("l02", [[10, 60, "explain", "R"], [70, 120, "present", "R"]]),
  ...gA("l03", [[4, 52, "explain"]]),
  ...gA("l06", [[2, 46, "both"]]), ...gA("l07", [[2, 70, "point", "R", -80]]), ...gA("l10", [[2, 90, "both"]]), ...gA("l12", [[6, 80, "explain"], [84, 150, "point", "R", -75]]), ...gA("l14", [[2, 40, "both"]]),
  { type: "explain", from: L("l04").sf + 20, to: L("l04").sf + 140 }, { type: "present", from: L("l08").sf + 40, to: L("l08").sf + 120, hand: "L" }, { type: "explain", from: L("l11").sf + 10, to: L("l11").sf + 120 },
  { type: "present", from: L("l15").sf + 5, to: L("l15").sf + 80, hand: "R" }, { type: "invite", from: L("l15").sf + 85, to: L("l15").sf + 112 },
];
const RobotLayer: React.FC = () => {
  const f = useCurrentFrame(); const speaking = LINES.filter((l) => l.who === "A").map((l) => [l.sf, l.ef + 4] as [number, number]);
  const p = pose2(f, { lip: LIP.A, speaking, gestures: ROBOT_G, seed: 3 });
  return (<>
    <div style={{ position: "absolute", left: RX - 30, top: FLOORY - 60, width: RW + 60, height: 100, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(20,20,19,.28) 0%, rgba(20,20,19,0) 70%)", zIndex: 58 }} />
    <div style={{ position: "absolute", left: RX, top: FLOORY - RW * 1.4 * (272 / 280), zIndex: 60 }}><Robot2 pose={p} width={RW} shadow={false} /></div></>);
};

/* ================= Claude (Blender sprites + 2D face) ================= */
const PXU = (CLIPS as any).pxu as number; const CS = 1.15; const SPR_W = (CLIPS as any).w * CS, SPR_H = (CLIPS as any).h * CS;
const STAND_X = 700; const WALK = (CLIPS as any).clips.walk; const WALK_N = WALK?.n ?? 36; const LEGL = ((CLIPS as any).legL ?? 1.16) * PXU * CS;
const walkV = (i: number) => { const th = 0.5 * Math.sin((2 * Math.PI * i) / WALK_N); return LEGL * Math.cos(th) * 0.5 * ((2 * Math.PI) / WALK_N) * Math.abs(Math.cos((2 * Math.PI * i) / WALK_N)); };
const walkFrames = 72; const walkDist = (() => { let d = 0; for (let k = 0; k < walkFrames; k++) d += walkV(k % WALK_N); return d; })();
type Seg = { a: number; b: number; clip: string; walkDir?: -1 };
const buildClaude = (): Seg[] => {
  const segs: Seg[] = []; const w0 = L("l02").sf - 40; segs.push({ a: w0, b: w0 + walkFrames, clip: "walk", walkDir: -1 });
  const speakers = LINES.filter((l) => l.who === "C");
  let cursor = w0 + walkFrames; const gesture = (a: number, kind: string) => { segs.push({ a, b: a + 36, clip: kind }); return a + 36; };
  const fillTalk = (a: number, b: number, clip: string) => { if (b > a) segs.push({ a, b, clip }); };
  const timeline: { a: number; b: number; talk: boolean }[] = [];
  const all = LINES.map((l) => ({ a: l.sf, b: l.ef + 6, talk: l.who === "C" }));
  for (const t of all) timeline.push(t);
  // gap after walk: point at the computer, then idle
  cursor = gesture(cursor, "point_L"); void speakers;
  let g = 0;
  for (const t of timeline) {
    let a = Math.max(t.a, cursor); if (a >= t.b) continue; const dur = t.b - a;
    if (!t.talk) { fillTalk(a, t.b, "idle"); cursor = t.b; continue; }
    // long speech: talk loops with gestures at 35% and 75%
    const kinds = ["point_L", "present_R", "present_L", "point_L"]; const marks = dur > 150 ? [0.32, 0.7] : dur > 90 ? [0.5] : [];
    let c = a; for (const m of marks) { const ga = a + Math.round(dur * m); if (ga - c > 10) { fillTalk(c, ga, "talk"); } c = Math.max(c, ga); c = gesture(c, kinds[g++ % kinds.length]); }
    if (L("l15").sf === t.a) { segs.length; }
    fillTalk(c, t.b, "talk"); cursor = Math.max(c, t.b);
  }
  segs.push({ a: cursor, b: RMC_FRAMES + 30, clip: "idle" });
  return segs.sort((p, q) => p.a - q.a);
};
const CSEGS = buildClaude();
const claudeAt = (f: number) => { let s = CSEGS[0]; for (const q of CSEGS) if (f >= q.a) s = q; const m = (CLIPS as any).clips[s.clip]; const n = m?.n ?? 36; const k = f - s.a;
  const loop = s.clip === "idle" || s.clip === "talk" || s.clip === "walk"; let i = loop ? ((k % n) + n) % n : Math.min(n - 1, Math.max(0, k)); if (s.walkDir === -1) i = n - 1 - (k % n >= 0 ? k % n : 0);
  return { seg: s, i, n, anchors: m?.anchors as number[][] | undefined }; };
const claudeX = (f: number) => { const w = CSEGS.find((s) => s.clip === "walk")!; if (f <= w.a) return STAND_X + walkDist; if (f >= w.b) return STAND_X; let d = 0; for (let k = 0; k < f - w.a; k++) d += walkV(k % WALK_N); return STAND_X + walkDist - d; };
const env = (lip: { fps: number; a: number[] }, f: number) => { const t = (f / 30) * lip.fps; const i = Math.floor(t); const a = lip.a[i] ?? 0, b = lip.a[i + 1] ?? a; return a + (b - a) * (t - i); };
const ClaudeLayer: React.FC<{ glow?: boolean }> = ({ glow = true }) => {
  const f = useCurrentFrame(); const { seg, i, anchors } = claudeAt(f); const x = claudeX(f);
  const name = `${seg.clip}_${String(i).padStart(3, "0")}.png`; const a = anchors?.[i] ?? [450, 380, 0]; const talking = LINES.some((l) => l.who === "C" && f >= l.sf - 2 && f <= l.ef + 4);
  const e = talking ? env(LIP.C, f) : 0; const mo = talking ? Math.min(1, e * 1.1) : 0.12; const browUp = talking ? 0.5 + 0.5 * e : 0.35; const blinkP = (f + 17) % 96; const blink = blinkP < 4 ? Math.abs(blinkP - 2) / 2 : 1;
  const px = PXU * CS; const sx = (u: number) => u * px; const faceX = a[0] * CS, faceY = a[1] * CS;
  const speakingIdx = LINES.find((l) => f >= l.sf && f <= l.ef); const lookAtRobot = !!speakingIdx && speakingIdx.who === "A";
  const gaze = lookAtRobot ? -0.05 : 0.0;
  return (<div style={{ position: "absolute", left: x - SPR_W / 2, top: FLOORY + 40 - SPR_H * 0.995, width: SPR_W, height: SPR_H, zIndex: 61, filter: glow ? "drop-shadow(0 0 18px rgba(255,120,30,.55))" : undefined }}>
    <Img src={staticFile(`ep24/claude/${name}`)} style={{ width: SPR_W, height: SPR_H, display: "block" }} />
    <svg width={SPR_W} height={SPR_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g transform={`translate(${faceX},${faceY}) rotate(${(a[2] * 180) / Math.PI})`}>
        {[-0.235, 0.235].map((ex, k) => { const eyeY = sx(-0.06); const cxp = sx(ex); const rr = sx(0.175);
          return (<g key={ex}>
            <ellipse cx={cxp} cy={eyeY} rx={rr} ry={sx(0.215) * (0.12 + 0.88 * blink)} fill="#fff" stroke="#2A1408" strokeWidth={sx(0.028)} />
            <g opacity={blink > 0.35 ? 1 : 0}><circle cx={cxp + sx(gaze * 1.6)} cy={eyeY + sx(0.02)} r={sx(0.108)} fill="#8A3F12" /><circle cx={cxp + sx(gaze * 1.6)} cy={eyeY + sx(0.02)} r={sx(0.068)} fill="#140804" />
              <circle cx={cxp + sx(gaze * 1.6) + sx(0.035)} cy={eyeY - sx(0.03)} r={sx(0.03)} fill="#fff" /></g>
            <path d={`M ${cxp - sx(0.19)} ${sx(-0.3) + (k ? 0 : sx(0.03)) - sx(0.03 * browUp)} Q ${cxp} ${sx(-0.4) - sx(0.05 * browUp)} ${cxp + sx(0.19)} ${sx(-0.3) + (k ? sx(0.03) : 0) - sx(0.03 * browUp)}`} fill="none" stroke="#2A1408" strokeWidth={sx(0.045)} strokeLinecap="round" /></g>); })}
        {(() => { const open = 0.1 + 0.34 * mo; const w = 0.26; const topY = sx(0.18); const botY = topY + sx(open);
          return (<g><clipPath id="mclip"><path d={`M ${sx(-w)} ${topY} Q 0 ${topY + sx(0.06)} ${sx(w)} ${topY} Q ${sx(w * 0.9)} ${botY + sx(0.06)} 0 ${botY + sx(0.05)} Q ${sx(-w * 0.9)} ${botY + sx(0.06)} ${sx(-w)} ${topY} Z`} /></clipPath>
            <path d={`M ${sx(-w)} ${topY} Q 0 ${topY + sx(0.06)} ${sx(w)} ${topY} Q ${sx(w * 0.9)} ${botY + sx(0.06)} 0 ${botY + sx(0.05)} Q ${sx(-w * 0.9)} ${botY + sx(0.06)} ${sx(-w)} ${topY} Z`} fill="#4A0F10" stroke="#2A1408" strokeWidth={sx(0.03)} strokeLinejoin="round" />
            <g clipPath="url(#mclip)"><rect x={sx(-w)} y={topY} width={sx(2 * w)} height={sx(0.07)} fill="#fff" /><ellipse cx={0} cy={botY + sx(0.02)} rx={sx(0.17)} ry={sx(0.09) + sx(0.1) * mo} fill="#F08A8A" /></g></g>); })()}
      </g></svg></div>);
};

/* ================= shared UI ================= */
const Wall: React.FC = () => (<AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.wall1} 0%, ${C.wall2} 78%)` }}>
  <div style={{ position: "absolute", left: 0, right: 0, top: 1560, height: 360, background: `linear-gradient(180deg, ${C.floor}, #B7A88F)` }} />
  <div style={{ position: "absolute", left: 0, right: 0, top: 1556, height: 6, background: "rgba(20,20,19,.12)" }} /></AbsoluteFill>);
const Desk: React.FC = () => (<><div style={{ position: "absolute", left: 470, top: 960, width: 140, height: 56, background: "linear-gradient(90deg,#8E877D,#B9B2A6,#8E877D)", zIndex: 20 }} />
  <div style={{ position: "absolute", left: 0, top: 1010, width: 1080, height: 70, background: "linear-gradient(180deg,#A67C52,#8B6841)", boxShadow: "0 18px 30px rgba(20,20,19,.25)", zIndex: 20 }} />
  <div style={{ position: "absolute", left: 40, top: 1080, width: 1000, height: 480, background: "linear-gradient(180deg, rgba(20,20,19,.18), rgba(20,20,19,0))", zIndex: 5 }} /></>);
const Monitor: React.FC<{ children: React.ReactNode; dim?: number; label?: string; scale?: number }> = ({ children, dim = 0, label, scale = 1 }) => (
  <div style={{ position: "absolute", left: 60, top: 330, width: 960, height: 640, borderRadius: 34, background: "linear-gradient(160deg,#2B2622,#14110F)", boxShadow: "0 30px 60px rgba(20,20,19,.35)", zIndex: 30, transform: `scale(${scale})`, transformOrigin: "50% 100%" }}>
    <div style={{ position: "absolute", left: 22, top: 22, width: 916, height: 596, borderRadius: 18, overflow: "hidden", background: "#000" }}>{children}<div style={{ position: "absolute", inset: 0, background: `rgba(20,16,12,${dim})`, pointerEvents: "none" }} /></div>
    {label ? <div style={{ position: "absolute", left: 30, bottom: -46, fontFamily: sans, fontWeight: 700, fontSize: 22, color: C.soft }}>{label}</div> : null}</div>);
const Shot: React.FC<{ name: string; z0?: number; z1?: number; dur: number; ox?: string; oy?: string }> = ({ name, z0 = 1, z1 = 1.08, dur, ox = "50%", oy = "30%" }) => { const f = useCurrentFrame(); const t = clamp(f / dur); return <Img src={shot(name)} style={{ width: "100%", height: "100%", objectFit: "fill", transform: `scale(${z0 + (z1 - z0) * t})`, transformOrigin: `${ox} ${oy}` }} />; };
const Tag: React.FC<{ text: string; x: number; y: number; at: number; bg?: string; fg?: string; size?: number; z?: number; maxW?: number }> = ({ text, x, y, at, bg = C.coral, fg = "#fff", size = 30, z = 80, maxW }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: f - at, fps, config: POP }); return <div style={{ position: "absolute", left: x, top: y, maxWidth: maxW, transform: `scale(${s})`, transformOrigin: "left center", opacity: clamp(s * 2), background: bg, color: fg, fontFamily: sans, fontWeight: 800, fontSize: size, padding: "8px 18px", borderRadius: 12, boxShadow: "0 10px 24px rgba(20,20,19,.3)", zIndex: z }}>{text}</div>; };
const Card: React.FC<{ x: number; y: number; w: number; h?: number; at: number; out?: number; children: React.ReactNode; z?: number; accent?: string; fromX?: number }> = ({ x, y, w, h, at: a, out, children, z = 70, accent = C.coral, fromX = 120 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: f - a, fps, config: SOFT }); const o = out !== undefined ? clamp((out - f) / 10) : 1;
  return <div style={{ position: "absolute", left: x, top: y + Math.sin((f + x) / 34) * 5, width: w, height: h, transform: `perspective(1400px) translateX(${(1 - s) * fromX}px) translateZ(${(1 - s) * -300}px) rotateY(${(1 - s) * -14 + Math.sin((f + x) / 44) * 2}deg) scale(${0.97 + 0.03 * o})`, opacity: clamp(s * 1.6) * o, zIndex: z, borderRadius: 22, background: C.paper, boxShadow: `0 0 0 3px ${accent}, 0 22px 44px rgba(20,20,19,.32)`, padding: "16px 24px", fontFamily: sans, color: C.ink, overflow: "hidden" }}>{children}</div>; };
const Caps: React.FC = () => {
  const f = useCurrentFrame(); const idx = TL.words.findIndex((w) => f < w.e); const i = idx < 0 ? TL.words.length - 1 : Math.max(0, idx); const w0 = TL.words[i]; const line = TL.words.filter((w) => w.line === w0.line); const lw = line.findIndex((w) => w === w0);
  const chunk = Math.floor(lw / 5) * 5; const shown = line.slice(chunk, chunk + 5); const who = w0.who; const col = who === "C" ? C.coral : C.teal; const { fps } = useVideoConfig();
  return (<div style={{ position: "absolute", left: 28, right: 28, top: 38, height: 250, borderRadius: 30, background: "rgba(20,16,12,.9)", zIndex: 95, padding: "20px 28px", boxShadow: "0 14px 30px rgba(20,20,19,.35)" }}>
    <div style={{ display: "inline-block", background: col, color: who === "C" ? "#fff" : C.ink, fontFamily: sans, fontWeight: 900, fontSize: 28, padding: "4px 18px", borderRadius: 10, letterSpacing: 1 }}>{who === "C" ? "CLAUDE CODE" : "AGENTOON"}</div>
    <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: "6px 14px", fontFamily: sans, fontWeight: 900, fontSize: 56, color: "#fff", lineHeight: 1.08 }}>
      {shown.map((w, k) => { const act = chunk + k === lw; const p = act ? spring({ frame: f - w.s, fps, config: { damping: 11, stiffness: 220, mass: 0.7 } }) : 1; return <span key={w.s + "_" + k} style={{ padding: "0 10px", borderRadius: 10, background: act ? col : "transparent", color: act && who === "A" ? C.ink : "#fff", transform: `scale(${act ? 0.9 + 0.1 * p : 1})`, display: "inline-block" }}>{w.w}</span>; })}</div></div>);
};

/* ================= scene contents (in the monitor / floating) ================= */
const BeforeAfter: React.FC<{ f: number; s: number; e: number }> = ({ f, s, e }) => { const t = clamp((f - s) / (e - s)); const k = t * t * (3 - 2 * t) * 100;
  return (<div style={{ position: "absolute", inset: 0 }}><div style={{ position: "absolute", inset: 0 }}><Shot name="before-d.png" dur={600} z0={1.0} z1={1.04} /></div>
    <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - k}% 0 0)` }}><Shot name="after-d.png" dur={600} /></div>
    <div style={{ position: "absolute", left: `${k}%`, top: 0, bottom: 0, width: 6, background: C.coral, boxShadow: "0 0 18px rgba(217,119,87,.8)", opacity: t > 0 && t < 1 ? 1 : 0 }} />
    <div style={{ position: "absolute", left: 20, top: 16, background: "rgba(20,16,12,.85)", color: "#fff", fontFamily: sans, fontWeight: 800, fontSize: 26, padding: "4px 14px", borderRadius: 8 }}>BEFORE</div>
    <div style={{ position: "absolute", right: 20, top: 16, background: C.coral, color: "#fff", fontFamily: sans, fontWeight: 800, fontSize: 26, padding: "4px 14px", borderRadius: 8, opacity: k > 55 ? 1 : 0 }}>AFTER · frontend-design</div></div>); };
const TestTerm: React.FC<{ f: number; s: number }> = ({ f, s }) => {
  const lines = REAL.tests as string[]; const per = 14; const pass = lines.filter((l) => l.startsWith("PASS")).length, fail = lines.filter((l) => l.startsWith("FAIL")).length;
  const shown = Math.min(lines.length, Math.max(0, Math.floor((f - s) / per) + 1)); const np = lines.slice(0, shown).filter((l) => l.startsWith("PASS")).length, nf = lines.slice(0, shown).filter((l) => l.startsWith("FAIL")).length;
  return (<div style={{ position: "absolute", inset: 0, background: "#0B0E14", fontFamily: mono, padding: "16px 20px" }}>
    <div style={{ color: "#7EE787", fontSize: 22, marginBottom: 6, paddingTop: 52 }}>$ python test_site.py</div>
    {lines.slice(0, shown).map((l, i) => <div key={i} style={{ fontSize: 20.5, lineHeight: 1.3, color: l.startsWith("PASS") ? "#9BE9A8" : l.startsWith("FAIL") ? "#FF7B72" : "#C9D1D9", fontWeight: l.startsWith("FAIL") ? 700 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l}</div>)}
    <div style={{ position: "absolute", right: 18, top: 12, display: "flex", gap: 12, fontFamily: sans, fontWeight: 900 }}>
      <div style={{ background: "#1F6F3B", color: "#fff", borderRadius: 12, padding: "6px 16px", fontSize: 30 }}>{np}/{pass} PASS</div><div style={{ background: "#B3261E", color: "#fff", borderRadius: 12, padding: "6px 16px", fontSize: 30 }}>{nf}/{fail} FAIL</div></div></div>); };
const RepoPanel: React.FC<{ f: number }> = ({ f }) => (<div style={{ position: "absolute", inset: 0, background: "#0D1117", fontFamily: sans, color: "#E6EDF3", padding: "26px 34px" }}>
  <div style={{ fontSize: 30, color: "#9DA7B3" }}>github.com / <b style={{ color: "#58A6FF" }}>anthropics</b> / <b style={{ color: "#58A6FF" }}>skills</b></div>
  <div style={{ fontSize: 22, color: "#8B949E", marginTop: 6 }}>Public repository for Agent Skills · commit {REAL.commit}</div>
  <div style={{ marginTop: 22, border: "1px solid #30363D", borderRadius: 12, overflow: "hidden" }}>{["skills", "spec", "template", "README.md", "THIRD_PARTY_NOTICES.md"].map((n, i) => <div key={n} style={{ padding: "11px 18px", fontSize: 28, borderTop: i ? "1px solid #21262D" : "none", background: n === "skills" && f % 90 > 40 ? "#161B22" : "transparent" }}>{i < 3 ? "📁 " : "📄 "}{n}</div>)}</div>
  <div style={{ marginTop: 14, fontSize: 19, color: "#8B949E" }}>Rendered from a real clone of the repository (not a screenshot of the GitHub page).</div></div>);
const Folder: React.FC<{ name: string; x: number; y: number; at: number; hot?: boolean }> = ({ name, x, y, at: a, hot }) => (<Card x={x} y={y} w={300} h={128} at={a} accent={hot ? C.coral : C.soft} z={72}><div style={{ display: "flex", gap: 14, alignItems: "center" }}><div style={{ fontSize: 56 }}>📁</div><div><div style={{ fontWeight: 900, fontSize: 30 }}>{name}</div><div style={{ fontFamily: mono, fontSize: 19, color: C.coralD }}>└ SKILL.md</div></div></div></Card>);

/* ================= main ================= */
export const RobotMeetsClaude: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S = { arrive: L("l02").sf, what: L("l03").sf, design: L("l05").sf, wow: L("l06").sf, test: L("l07").sf, inst: L("l10").sf, fin: L("l12").sf, end: L("l14").sf };
  const showRepo = on(f, S.arrive + 55, S.what + 30); const showDocs = on(f, S.what + 20, S.design - 80);
  const fd = cue("l05", "frontend-design"); void fd;
  const scene = f < S.what ? "A" : f < S.design ? "B" : f < S.test ? "C" : f < S.inst ? "D" : f < S.fin ? "E" : "F";
  // the monitor screen content
  let screen: React.ReactNode = <Shot name="before-d.png" dur={300} z0={1.55} z1={1.85} ox="0%" oy="0%" />; let label = "Basic sample site (written by Agentoon for this video)";
  if (showRepo) { screen = <RepoPanel f={f} />; label = "anthropics/skills"; }
  else if (showDocs) { screen = <div style={{ position: "absolute", inset: 0, background: C.paper }}><Img src={shot("docs-skills.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "0 0", transform: `scale(${1 + 0.06 * clamp((f - S.what) / 300)})`, transformOrigin: "30% 30%" }} /></div>; label = "code.claude.com/docs/en/skills"; }
  else if (f >= S.design - 80 && f < S.test - 20) {
    const evLog = f < L("l05").sf + at(5.6);
    screen = evLog ? (<div style={{ position: "absolute", inset: 0, background: "#1A1512", fontFamily: mono, color: "#F0EEE6", padding: "22px 28px", fontSize: 25, lineHeight: 1.55 }}>
      <div style={{ color: C.coral, fontWeight: 700 }}>✻ Claude Code · frontend-design run (real log)</div>
      {["Skill(frontend-design:frontend-design)", "Bash(…)", "Read(index.html)", "Write(index.html) · 7.8 KB"].map((t, i) => <div key={t} style={{ opacity: clamp((f - (S.design - 70) - i * 24) / 8) }}>● {t}</div>)}
      <div style={{ opacity: clamp((f - (S.design + 40)) / 10), color: "#9BE9A8", marginTop: 8 }}>✓ done in 42.5 s</div></div>) : <BeforeAfter f={f} s={L("l05").sf + at(6.4)} e={L("l05").sf + at(9.4)} />;
    label = evLog ? "Claude Code · real run of the skill" : "Before → after (real screenshots of the page)"; }
  else if (f >= S.test - 20 && f < S.inst - 10) { screen = <TestTerm f={f} s={L("l08").sf + at(1.2)} />; label = "Playwright test · real output"; }
  else if (f >= S.inst - 10 && f < S.fin - 20) {
    const t0 = L("l11").sf; screen = (<div style={{ position: "absolute", inset: 0, background: "#0B0E14" }}>
      {on(f, t0, t0 + 120) && <Sequence from={t0} durationInFrames={130} layout="none"><OffthreadVideo src={termf("01-marketplace.mp4")} muted playbackRate={1.2} style={{ width: 916, display: "block" }} /></Sequence>}
      {on(f, t0 + 120, t0 + 245) && <Sequence from={t0 + 120} durationInFrames={130} layout="none"><OffthreadVideo src={termf("02-install.mp4")} muted playbackRate={1.2} style={{ width: 916, display: "block" }} /></Sequence>}
      {f >= t0 + 245 && <Sequence from={t0 + 245} layout="none"><OffthreadVideo src={termf("03b-skills.mp4")} muted playbackRate={1.7} style={{ width: 916, display: "block" }} /></Sequence>}</div>);
    label = "Real terminal · CLI form of the same commands"; }
  else if (f >= S.fin - 20) { screen = <Shot name="after-d.png" dur={500} z0={1.0} z1={1.07} />; label = "Redesigned and tested sample site"; }
  const dim = showRepo ? 0 : 0;
  return (<AbsoluteFill style={{ background: C.wall1 }}>
    <Audio src={staticFile("audio/rmc-mix.wav")} />
    <Wall /><Monitor label={label} dim={dim}>{screen}</Monitor><Desk />
    {/* problem annotations */}
    {f < S.arrive + 120 && (<><Tag text="Default fonts" x={80} y={300} at={30} bg={C.ink} size={26} /><Tag text="No layout" x={420} y={300} at={52} bg={C.ink} size={26} /><Tag text="Plain buttons" x={720} y={300} at={74} bg={C.ink} size={26} /></>)}
    {on(f, S.arrive + 55, S.what + 30) && <Tag text="Official repo: anthropics/skills" x={80} y={300} at={S.arrive + 55} bg={C.ink} size={30} z={92} />}
    {/* what are skills: folders + SKILL.md cards + connections */}
    {on(f, L("l04").sf + 30, L("l05").sf + 4) && (<>
      <Folder name="frontend-design" x={40} y={560} at={L("l04").sf + 34} hot={f > cue("l04", "designing")} /><Folder name="webapp-testing" x={40} y={700} at={L("l04").sf + 44} hot={f > cue("l04", "testing")} /><Folder name="skill-creator" x={40} y={840} at={L("l04").sf + 54} hot={f > cue("l04", "creating")} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, zIndex: 71 }}>{[["designing", 624], ["testing", 764], ["creating", 904]].map(([w, y], i) => { const a = cue("l04", w as string); const p = clamp((f - a) / 14); return <path key={w as string} d={`M 340 ${y} C 470 ${y}, 560 ${y}, 700 ${y}`} stroke={C.coral} strokeWidth={5} fill="none" strokeDasharray="520" strokeDashoffset={520 * (1 - p)} />; })}</svg>
      <Card x={700} y={560} w={330} h={110} at={cue("l04", "designing")} accent={C.coral}><b style={{ fontSize: 30 }}>Designing websites</b></Card>
      <Card x={700} y={700} w={330} h={110} at={cue("l04", "testing")} accent={C.coral}><b style={{ fontSize: 30 }}>Testing apps</b></Card>
      <Card x={700} y={840} w={330} h={110} at={cue("l04", "creating")} accent={C.coral}><b style={{ fontSize: 30 }}>New workflows</b></Card></>)}
    {/* design: bug fix diff */}
    {on(f, L("l05").sf + at(8.8), L("l06").sf) && <Card x={90} y={720} w={900} at={L("l05").sf + at(8.8)} accent={C.teal} z={78} fromX={0}>
      <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 28, color: C.coralD }}>Bug found and fixed in the same pass (real code)</div>
      <div style={{ fontFamily: mono, fontSize: 22, color: "#B3261E", marginTop: 6 }}>− document.getElementById("cart-total").textContent = count;</div>
      <div style={{ fontFamily: mono, fontSize: 22, color: "#1F6F3B" }}>+ document.getElementById("cart-count").textContent = count;</div></Card>}
    {/* testing disclaimer */}
    {on(f, L("l09").sf, L("l10").sf) && <Card x={70} y={990} w={940} at={L("l09").sf} accent={C.coral} z={78} fromX={0}><div style={{ fontWeight: 900, fontSize: 32 }}>Skills help find problems. They don't guarantee a perfect site.</div></Card>}
    {/* install slash commands */}
    {on(f, S.inst + 20, S.fin - 40) && <Card x={50} y={960} w={980} at={S.inst + 20} out={S.fin - 40} accent={C.coral} z={78} fromX={0}>
      <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 22, color: C.soft }}>In Claude Code (from the anthropics/skills README):</div>
      <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 25, marginTop: 4 }}>/plugin marketplace add anthropics/skills</div>
      <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 25 }}>/plugin install example-skills@anthropic-agent-skills</div></Card>}
    {/* skill-creator */}
    {on(f, L("l13").sf + 20, L("l14").sf + 20) && <Card x={90} y={700} w={900} at={L("l13").sf + 20} accent={C.coral} z={78}>
      <div style={{ fontFamily: mono, fontSize: 24, color: C.coralD }}>skills/skill-creator/SKILL.md</div>
      <div style={{ fontWeight: 900, fontSize: 40, marginTop: 4 }}>skill-creator</div>
      <div style={{ fontSize: 28, marginTop: 4 }}>{REAL.frontmatter["skill-creator"].description.slice(0, 120)}…</div></Card>}
    {/* end card */}
    {f >= L("l15").sf - 10 && <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", zIndex: 90, fontFamily: sans, opacity: clamp((f - (L("l15").sf - 10)) / 12), transform: `scale(${0.9 + 0.1 * clamp((f - (L("l15").sf - 10)) / 14)})` }}>
      <div style={{ display: "inline-block", background: "rgba(20,16,12,.92)", borderRadius: 28, padding: "26px 40px", boxShadow: "0 20px 44px rgba(20,20,19,.4)" }}>
        <div style={{ color: C.coral, fontWeight: 900, fontSize: 54, letterSpacing: 1 }}>ANTHROPIC AGENT SKILLS</div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 40, fontFamily: mono, marginTop: 6 }}>github.com/anthropics/skills</div>
        <div style={{ marginTop: 18, background: C.teal, color: C.ink, fontWeight: 900, fontSize: 48, padding: "8px 28px", borderRadius: 14, display: "inline-block" }}>FOLLOW @AGENTOON.AI</div>
        <div style={{ color: "#C9C3B8", fontWeight: 700, fontSize: 24, marginTop: 10 }}>Real AI Tools • Skills • Automation</div></div></div>}
    <Tag text="Original Agentoon.ai production · not an official Anthropic ad · fan-style Claude character" x={28} y={1760} at={10} bg="rgba(20,16,12,.8)" fg="#E8E2D6" size={21} z={96} />
    <RobotLayer /><ClaudeLayer /><Caps />
  </AbsoluteFill>);
};
