import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING, theme } from "../fx/theme";
import { Robot, robotPose, Gesture } from "../fx/RobotRig";
import { AnimatedSubtitles } from "../fx/kinetic";
import { clamp } from "../fx/math";
import TL from "../../public/data/fsk-timeline.json";
import REAL from "../../public/data/fsk-real.json";

/** Episode 21: Founder Skill (github.com/Jakeschincariol/founder-skill). Pixel-art business simulation (procedural SVG sprites) + REAL material:
 *  plugin install/list terminal recordings, the repo's own unit_economics.py output (matcha-café example), real persona cards from panel.py (seeded), real slash list. */
type Scene = { id: string; start: number; len: number };
const SC = TL.scenes as Scene[]; const S = (id: string) => SC.find((s) => s.id === id)!;
const LIP = TL.lip as { fps: number; a: number[] }; export const FSK_FRAMES = TL.frames;
const R: any = REAL; const C = R.cfo;
const term = (n: string) => staticFile(`ep21/term/${n}`);
const GESTURES: Gesture[] = [{ type: "wave", at: 10, hand: "R" }, { type: "nod", at: S("intro").start + 40 }, { type: "wow", at: S("board").start + 150 }, { type: "nod", at: S("comp").start + 120 }, { type: "wow", at: S("price").start + 200 }, { type: "nod", at: S("others").start + 90 }, { type: "nod", at: S("install").start + 30 }, { type: "wow", at: S("install").start + 300 }, { type: "nod", at: S("result").start + 80 }, { type: "celebrate", at: S("cta").start + 60 }];
const PAL = { sky: "#1B2140", sky2: "#2B3470", ground: "#2F5D46", ground2: "#25493A", brick: "#C0674A", brick2: "#A5543B", win: "#FFD56B", winoff: "#5A4B3A", roof: "#3A3F66", skin: "#F2C79B", hair: "#3B2A20", lime: "#C8F031", amber: "#FFB23E", teal: "#35F2FF", red: "#FF5A4D", white: "#F4F6FA", ink: "#0F1115", wood: "#8A5A35", wood2: "#6E4528" };
const money = (n: number) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");

/* ---------- pixel engine ---------- */
const U = 6;
const Stage: React.FC<{ rows: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ rows, children, style }) => (
  <svg width={1080} height={rows * U} viewBox={`0 0 180 ${rows}`} shapeRendering="crispEdges" style={{ display: "block", ...style }}>{children}</svg>
);
const P: React.FC<{ x: number; y: number; w: number; h: number; c: string; o?: number }> = ({ x, y, w, h, c, o = 1 }) => <rect x={x} y={y} width={w} height={h} fill={c} opacity={o} />;
const Person: React.FC<{ x: number; y: number; c: string; hair?: string; f: number; flip?: boolean; sit?: boolean; hat?: string; k?: number }> = ({ x, y, c, hair = PAL.hair, f, flip, sit, hat, k = 1 }) => {
  const step = Math.floor(f / 6) % 2; const dx = flip ? -1 : 1;
  return (
    <g transform={flip ? `translate(${x + 7 * k},${y}) scale(${-k},${k})` : `translate(${x},${y}) scale(${k})`}>
      <P x={2} y={0} w={3} h={3} c={PAL.skin} /><P x={2} y={0} w={3} h={1} c={hair} />{hat ? <P x={1} y={-1} w={5} h={1} c={hat} /> : null}<P x={2} y={1} w={1} h={1} c={PAL.ink} /><P x={4} y={1} w={1} h={1} c={PAL.ink} />
      <P x={1} y={3} w={5} h={4} c={c} /><P x={0} y={3 + (step ? 1 : 0)} w={1} h={3} c={PAL.skin} /><P x={6} y={3 + (step ? 0 : 1)} w={1} h={3} c={PAL.skin} />
      {sit ? <P x={1} y={7} w={5} h={2} c="#2D3350" /> : (<><P x={2} y={7} w={1} h={step ? 3 : 4} c="#2D3350" /><P x={4} y={7} w={1} h={step ? 4 : 3} c="#2D3350" /></>)}
    </g>
  );
};
const Building: React.FC<{ x: number; ground: number; floors: number; t: number; f: number; sign?: boolean }> = ({ x, ground, floors, t, f, sign }) => {
  const els: React.ReactNode[] = []; const fh = 12, w = 44;
  for (let i = 0; i < floors; i++) {
    const p = clamp(t - i); if (p <= 0) continue; const h = Math.round(fh * p); const y = ground - (i + 1) * fh + (fh - h);
    els.push(<P key={"f" + i} x={x} y={y} w={w} h={h} c={i % 2 ? PAL.brick2 : PAL.brick} />);
    if (p > 0.9) for (let j = 0; j < 3; j++) els.push(<P key={`w${i}${j}`} x={x + 5 + j * 13} y={y + 3} w={7} h={5} c={(Math.floor(f / 9) + i * 2 + j) % 7 ? PAL.win : PAL.winoff} />);
  }
  const top = ground - Math.min(floors, Math.ceil(t)) * fh; const rp = clamp(t - (floors - 1));
  return <g>{els}{rp > 0.9 ? <><P x={x - 2} y={top - 3} w={w + 4} h={3} c={PAL.roof} />{sign ? <P x={x + 8} y={top - 11} w={28} h={7} c={PAL.lime} /> : null}</> : null}</g>;
};
const Sky: React.FC<{ rows: number; f: number }> = ({ rows, f }) => (
  <g><P x={0} y={0} w={180} h={rows} c={PAL.sky} /><P x={0} y={Math.floor(rows * 0.45)} w={180} h={Math.ceil(rows * 0.55)} c={PAL.sky2} o={0.55} />
    {Array.from({ length: 26 }).map((_, i) => <P key={i} x={(i * 37) % 178} y={(i * 53) % Math.floor(rows * 0.5)} w={1} h={1} c={PAL.white} o={(Math.floor(f / 12) + i) % 5 ? 0.9 : 0.3} />)}</g>
);

/* ---------- shared UI ---------- */
const Bg: React.FC = () => <AbsoluteFill style={{ background: "#0B0D12" }} />;
const Narrator: React.FC<{ start: number; x: number; y: number; w: number }> = ({ start, x, y, w }) => {
  const f = useCurrentFrame(); const g = f + start;
  return <div style={{ position: "absolute", left: x, top: y, zIndex: 80 }}><Robot pose={robotPose(g, { lip: LIP, speaking: [[0, FSK_FRAMES]], fps: 30, gestures: GESTURES, seed: 9 })} width={w} shadow={false} /></div>;
};
const Caps: React.FC<{ id: string; size?: number }> = ({ id, size = 54 }) => {
  const sc = S(id); const words = TL.words.filter((w) => w.s >= sc.start - 2 && w.s < sc.start + sc.len).map((w) => ({ ...w, s: w.s - sc.start, e: w.e - sc.start }));
  return <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 34 + size * 2.7, padding: "34px 30px 0", background: "linear-gradient(180deg, rgba(8,10,14,.94) 0%, rgba(8,10,14,.7) 70%, rgba(8,10,14,0) 100%)", zIndex: 90 }}><AnimatedSubtitles words={words} size={size} perChunk={4} /></div>;
};
const Pill: React.FC<{ text: string; x: number; y: number; at: number; bg?: string; fg?: string; size?: number; type?: boolean }> = ({ text, x, y, at, bg = theme.lime, fg = theme.ink, size = 36, type }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: f - at, fps, config: SPRING.pop }); const n = type ? Math.ceil(text.length * clamp((f - at) / 28)) : text.length;
  return <div style={{ position: "absolute", left: x, top: y, transform: `scale(${type ? 1 : s})`, transformOrigin: "left center", opacity: clamp(s * 2), background: bg, color: fg, fontFamily: theme.mono, fontWeight: 800, fontSize: size, padding: "9px 20px", borderRadius: 4, border: "4px solid #0F1115", whiteSpace: "nowrap", boxShadow: "6px 6px 0 rgba(0,0,0,.55)", zIndex: 70 }}>{text.slice(0, n)}</div>;
};
const useCount = (to: number, at: number, dur: number) => { const f = useCurrentFrame(); const t = clamp((f - at) / dur); return to * (1 - Math.pow(1 - t, 3)); };
const Frame: React.FC<{ x: number; y: number; w: number; h: number; children: React.ReactNode; label?: string }> = ({ x, y, w, h, children, label }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", border: "5px solid #0F1115", boxShadow: "8px 8px 0 rgba(200,240,49,.7)", background: "#0E1117", zIndex: 20 }}>{children}
    {label ? <div style={{ position: "absolute", left: 10, top: 8, fontFamily: theme.mono, fontWeight: 800, fontSize: 20, color: theme.ink, background: theme.lime, padding: "3px 10px", zIndex: 5 }}>{label}</div> : null}</div>
);
const TermVid: React.FC<{ name: string; frames: number; rate?: number; x?: number; y?: number; w?: number }> = ({ name, frames, rate = 1, x = 30, y = 0, w = 1020 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, background: "#0E1117", border: "5px solid #0F1115", boxShadow: "8px 8px 0 rgba(200,240,49,.7)", zIndex: 20 }}>
    <div style={{ height: 38, background: "#171B24", display: "flex", alignItems: "center", gap: 10, padding: "0 16px", fontFamily: theme.mono, fontSize: 17, color: "#9AA1AE" }}>REAL TERMINAL RECORDING · idle waits shortened</div>
    <Sequence layout="none" from={0} durationInFrames={frames}><OffthreadVideo src={term(`${name}.mp4`)} muted playbackRate={rate} style={{ width: w - 10, display: "block" }} /></Sequence>
    <Sequence layout="none" from={frames}><Img src={term(`${name}-last.png`)} style={{ width: w - 10, display: "block" }} /></Sequence>
  </div>
);

/* ---------- 1 HOOK: startup building rises, then the boardroom ---------- */
const Hook: React.FC = () => {
  const f = useCurrentFrame(); const t = clamp(f / 70) * 4; const wipe = clamp((f - 100) / 24);
  return (
    <AbsoluteFill>
      <Bg /><Caps id="hook" />
      <div style={{ position: "absolute", top: 260, left: 0 }}>
        <Stage rows={150}>
          <Sky rows={150} f={f} />
          <P x={0} y={120} w={180} h={30} c={PAL.ground} /><P x={0} y={120} w={180} h={2} c={PAL.ground2} />
          <Building x={20} ground={120} floors={3} t={clamp(f / 40) * 3} f={f} /><Building x={118} ground={120} floors={5} t={clamp((f - 10) / 50) * 5} f={f} />
          <Building x={69} ground={120} floors={4} t={t} f={f} sign />
          <Person x={((f * 0.9) % 200) - 10} y={108} c="#4C8BF5" f={f} /><Person x={170 - ((f * 0.7) % 200)} y={108} c="#E56B6F" f={f} flip hat={PAL.amber} /><Person x={((f * 0.5 + 80) % 200) - 10} y={108} c="#6BCB77" f={f} />
        </Stage>
        <div style={{ position: "absolute", left: 69 * U + 8 * U, top: (120 - 4 * 12 - 11) * U + 3, fontFamily: theme.mono, fontWeight: 900, fontSize: 27, color: PAL.ink, width: 28 * U, textAlign: "center", opacity: clamp((f - 70) / 12) }}>YOUR IDEA</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, background: PAL.lime, transform: `translateX(${(1 - wipe) * 1080 - (wipe >= 1 ? 1080 : 0)}px)`, zIndex: 60, opacity: f > 100 && f < 128 ? 1 : 0 }} />
      <Pill text="11 FREE CLAUDE SKILLS" x={40} y={1250} at={20} size={44} />
      <Pill text="test the idea BEFORE you spend" x={40} y={1340} at={60} bg="#fff" size={34} />
      <Narrator start={0} x={640} y={1480} w={380} />
    </AbsoluteFill>
  );
};

/* ---------- 2 INTRO: the repository (name, description, license) ---------- */
const Intro: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const lines = [`# The Founder skill`, ``, `Eleven Claude skills that test a business`, `before you launch it. Free, MIT, no`, `signup, no API key, nothing to connect.`];
  const names = ["founder-board", "founder-competitors", "founder-consumer", "founder-pricing", "founder-offer", "founder-cfo", "founder-marketing", "founder-brand", "founder-ops", "founder-launch", "founder-plan"];
  return (
    <AbsoluteFill>
      <Bg /><Caps id="intro" />
      <Frame x={30} y={230} w={1020} h={430} label="github.com/Jakeschincariol/founder-skill · README.md (raw text)">
        <div style={{ padding: "60px 28px 0", fontFamily: theme.mono, fontSize: 30, lineHeight: "44px", color: "#E8EAF0", whiteSpace: "pre" }}>
          {lines.map((l, i) => <div key={i} style={{ color: i === 0 ? theme.lime : "#E8EAF0", fontWeight: i === 0 ? 800 : 400, opacity: clamp((f - 8 - i * 10) / 10) }}>{l.slice(0, Math.ceil(l.length * clamp((f - 8 - i * 10) / 24)))}</div>)}
        </div>
      </Frame>
      <div style={{ position: "absolute", left: 30, top: 700, width: 1020, display: "flex", flexWrap: "wrap", gap: 12 }}>
        {names.map((n, i) => { const s = spring({ frame: f - 60 - i * 6, fps, config: SPRING.pop }); return <div key={n} style={{ transform: `scale(${s})`, opacity: clamp(s * 2), background: i % 2 ? "#9FE7FF" : theme.lime, color: PAL.ink, fontFamily: theme.mono, fontWeight: 800, fontSize: 28, padding: "8px 14px", border: "4px solid #0F1115", boxShadow: "5px 5px 0 rgba(0,0,0,.5)" }}>{n}</div>; })}
      </div>
      <Pill text="11 skills · MIT · by Jake Schincariol" x={40} y={1250} at={130} bg="#fff" size={30} />
      <Narrator start={S("intro").start} x={640} y={1440} w={400} />
    </AbsoluteFill>
  );
};

/* ---------- 3 BOARD: pixel boardroom, three advisors (frameworks, not people) ---------- */
const Board: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const lens = [{ n: "OFFERS", c: "#E56B6F", x: 38 }, { n: "MONOPOLY", c: "#4C8BF5", x: 86 }, { n: "PRODUCT", c: "#6BCB77", x: 134 }];
  return (
    <AbsoluteFill>
      <Bg /><Caps id="board" />
      <div style={{ position: "absolute", top: 260, left: 0 }}>
        <Stage rows={150}>
          <P x={0} y={0} w={180} h={150} c="#2A2440" /><P x={0} y={100} w={180} h={50} c={PAL.wood2} /><P x={12} y={14} w={50} h={34} c="#1B2140" /><P x={14} y={16} w={46} h={30} c={PAL.sky2} /><P x={118} y={14} w={50} h={34} c="#1B2140" /><P x={120} y={16} w={46} h={30} c={PAL.sky2} />
          <P x={26} y={78} w={128} h={10} c={PAL.wood} /><P x={26} y={78} w={128} h={2} c="#B98355" /><P x={36} y={88} w={6} h={16} c={PAL.wood2} /><P x={138} y={88} w={6} h={16} c={PAL.wood2} />
          {lens.map((l, i) => <Person key={l.n} x={l.x - 4} y={52 + (Math.floor((f + i * 9) / 20) % 2)} k={2.4} c={l.c} f={f} sit hair={i === 1 ? "#C9C9D0" : PAL.hair} />)}
          <P x={78} y={52} w={24} h={6} c="#fff" o={0.85} /><P x={84} y={58} w={12} h={14} c="#fff" o={0.55} />
        </Stage>
        {lens.map((l, i) => { const s = spring({ frame: f - 30 - i * 24, fps, config: SPRING.pop }); return (
          <div key={l.n} style={{ position: "absolute", left: l.x * U - 40, top: 40 * U - 70, width: 170, textAlign: "center", transform: `scale(${s})`, opacity: clamp(s * 2) }}>
            <div style={{ background: "#fff", border: "4px solid #0F1115", fontFamily: theme.mono, fontWeight: 800, fontSize: 24, padding: "6px 4px", boxShadow: "5px 5px 0 rgba(0,0,0,.5)" }}>{["SCORE ✓", "RISKS ✓", "VOTE ✓"][Math.floor(f / 40 + i) % 3]}</div>
            
          </div>); })}
        {lens.map((l, i) => <div key={l.n + "t"} style={{ position: "absolute", left: l.x * U - 38, top: 110 * U, width: 164, textAlign: "center", fontFamily: theme.mono, fontWeight: 800, fontSize: 26, color: "#fff", background: l.c, border: "4px solid #0F1115", padding: "4px 0" }}>{l.n} LENS</div>)}
      </div>
      <Pill text="/founder-skill:founder-board" x={40} y={1190} at={4} size={38} type />
      <Pill text="vote: fund · fund if · pass" x={40} y={1290} at={150} bg="#fff" size={32} />
      <Pill text="frameworks, not the real people" x={40} y={1380} at={190} bg={PAL.amber} size={30} />
      <Narrator start={S("board").start} x={700} y={1530} w={330} />
    </AbsoluteFill>
  );
};

/* ---------- 4 COMPETITORS + BUYERS: marketplace, SIMULATED customers, real persona cards ---------- */
const Comp: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const per: any[] = R.personas;
  const shops = [{ x: 8, c: "#E56B6F", n: "SHOP A" }, { x: 66, c: "#4C8BF5", n: "SHOP B" }, { x: 124, c: "#FFB23E", n: "SHOP C" }];
  const idx = Math.floor(clamp((f - 70) / 200) * 4);
  return (
    <AbsoluteFill>
      <Bg /><Caps id="comp" />
      <div style={{ position: "absolute", top: 250, left: 0 }}>
        <Stage rows={100}>
          <Sky rows={100} f={f} /><P x={0} y={78} w={180} h={22} c={PAL.ground} />
          {shops.map((s, i) => <g key={s.n}><P x={s.x} y={44} w={48} h={34} c={PAL.brick2} /><P x={s.x - 2} y={38} w={52} h={8} c={s.c} /><P x={s.x + 4} y={52} w={14} h={14} c={PAL.win} /><P x={s.x + 26} y={54} w={16} h={24} c={PAL.wood2} /></g>)}
          {Array.from({ length: 7 }).map((_, i) => { const sp = 0.5 + (i % 3) * 0.25; const x = ((f * sp + i * 29) % 210) - 15; return <Person key={i} k={1.7} x={i % 2 ? 190 - x : x} y={62} c={["#4C8BF5", "#E56B6F", "#6BCB77", "#FFB23E", "#B07CFF", "#35C8D1", "#F28CB1"][i]} f={f + i * 5} flip={!!(i % 2)} />; })}
        </Stage>
        {shops.map((s, i) => { const sc = spring({ frame: f - 14 - i * 8, fps, config: SPRING.pop }); return <div key={s.n} style={{ position: "absolute", left: s.x * U, top: 40 * U - 4, width: 52 * U, textAlign: "center", transform: `scale(${sc})`, fontFamily: theme.mono, fontWeight: 900, fontSize: 24, color: PAL.ink }}>{s.n}</div>; })}
        {Array.from({ length: 7 }).map((_, i) => { const sp = 0.5 + (i % 3) * 0.25; const x = ((f * sp + i * 29) % 210) - 15; const px = (i % 2 ? 190 - x : x) * U; return <div key={i} style={{ position: "absolute", left: px - 22, top: 50 * U, fontFamily: theme.mono, fontWeight: 800, fontSize: 15, color: PAL.ink, background: PAL.amber, border: "2px solid #0F1115", padding: "0 3px" }}>SIMULATED</div>; })}
      </div>
      <div style={{ position: "absolute", left: 40, top: 910, width: 1000 }}>
        <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 24, color: theme.lime, marginBottom: 10 }}>100 SIMULATED BUYER CARDS · dealt by the repo's own panel.py (example inputs)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(20, 1fr)", gap: 6, marginBottom: 18 }}>
          {Array.from({ length: 100 }).map((_, i) => { const on = f > 30 + i * 0.9; return <div key={i} style={{ height: 34, background: on ? ["#4C8BF5", "#E56B6F", "#6BCB77", "#FFB23E", "#B07CFF"][i % 5] : "#222", border: "2px solid #0F1115", opacity: on ? 1 : 0.4 }} />; })}
        </div>
        {per.slice(0, 4).map((p, i) => { const s = spring({ frame: f - 70 - i * 48, fps, config: SPRING.pop }); return (
          <div key={p.id} style={{ display: i === Math.min(idx, 3) ? "block" : "none", transform: `scale(${s})`, transformOrigin: "left top", background: "#141A26", border: "4px solid #0F1115", boxShadow: "7px 7px 0 rgba(200,240,49,.6)", padding: "14px 20px", fontFamily: theme.mono }}>
            <div style={{ fontWeight: 800, fontSize: 32, color: "#fff" }}>{p.id} · {p.name}, {p.age} · {p.segment}</div>
            <div style={{ fontSize: 25, color: "#9AA1AE" }}>income {money(p.income)} · {p.behaviour}</div>
            <div style={{ fontSize: 28, color: PAL.amber }}>objection: "{p.objection}"</div>
            <div style={{ fontSize: 22, color: theme.lime, marginTop: 6 }}>SIMULATED BUYER · not a real customer</div>
          </div>); })}
      </div>
      <Pill text="/founder-skill:founder-competitors" x={40} y={1330} at={4} size={34} type />
      <Pill text="/founder-skill:founder-consumer" x={40} y={1420} at={120} size={34} type />
      <Narrator start={S("comp").start} x={720} y={1560} w={310} />
    </AbsoluteFill>
  );
};

/* ---------- 5 PRICING + CFO: real numbers from unit_economics.py ---------- */
const Price: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const cost = [["Matcha", 0.92], ["Oat milk", 0.38], ["Cup, lid, straw", 0.24], ["Card fees", 0.2]] as const;
  let run = C.price; const steps = cost.map(([n, v], i) => { const at = 34 + i * 26; const p = clamp((f - at) / 18); const a = run; run -= v; return { n, v, a, b: run, p }; });
  const contrib = useCount(C.contribution, 150, 40), be = useCount(C.breakeven, 175, 50), mg = useCount(C.margin, 200, 45), y1 = useCount(C.year1, 240, 60);
  const bars = C.months as { m: number; cum: number }[]; const maxA = 70000, base = 1060;
  return (
    <AbsoluteFill>
      <Bg /><Caps id="price" />
      <div style={{ position: "absolute", left: 40, top: 230, width: 1000 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ background: PAL.lime, color: PAL.ink, border: "5px solid #0F1115", boxShadow: "8px 8px 0 rgba(0,0,0,.6)", padding: "8px 24px", fontFamily: theme.mono, fontWeight: 900, fontSize: 80, transform: `rotate(${Math.sin(f / 14) * 4}deg)` }}>${C.price.toFixed(2)}</div>
          <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 28, color: "#fff" }}>one cup · example café</div>
        </div>
        {steps.map((s) => <div key={s.n} style={{ marginTop: 12, opacity: clamp(s.p * 2) }}><div style={{ display: "flex", justifyContent: "space-between", fontFamily: theme.mono, fontWeight: 800, fontSize: 28, color: "#fff" }}><span>− {s.n}</span><span style={{ color: PAL.red }}>−${s.v.toFixed(2)}</span></div><div style={{ height: 16, width: `${(s.b / C.price) * 100}%`, background: PAL.teal, border: "3px solid #0F1115", transition: "none" }} /></div>)}
        <div style={{ marginTop: 14, fontFamily: theme.mono, fontWeight: 900, fontSize: 40, color: PAL.lime, opacity: clamp((f - 140) / 10) }}>= ${contrib.toFixed(2)} left per cup</div>
      </div>
      <div style={{ position: "absolute", left: 40, top: 800, width: 1000, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[["BREAK-EVEN", `${Math.round(be)} cups/day`, 175], ["MARGIN AT PLAN", `${Math.round(mg)}%`, 200], ["YEAR 1 PROFIT", money(y1), 240], ["PAYBACK", `month ${C.payback_month}`, 280]].map(([k, v, at]: any) => { const s = spring({ frame: f - at + 14, fps, config: SPRING.pop }); return <div key={k} style={{ transform: `scale(${s})`, background: "#141A26", border: "4px solid #0F1115", boxShadow: "6px 6px 0 rgba(200,240,49,.6)", padding: "10px 16px" }}><div style={{ fontFamily: theme.mono, fontSize: 22, color: "#9AA1AE", fontWeight: 800 }}>{k}</div><div style={{ fontFamily: theme.mono, fontSize: 44, fontWeight: 900, color: "#fff" }}>{v}</div></div>; })}
      </div>
      <div style={{ position: "absolute", left: 40, top: 1180, width: 1000, height: 300 }}>
        <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 22, color: theme.lime }}>CASH AFTER STARTUP SPEND · months 1–12 (tool output)</div>
        <svg width={1000} height={260} viewBox="0 0 1000 260" shapeRendering="crispEdges" style={{ display: "block" }}>
          <line x1={0} x2={1000} y1={120} y2={120} stroke="#fff" strokeWidth={3} opacity={0.5} />
          {bars.map((b, i) => { const g = clamp((f - 120 - i * 6) / 14); const h = Math.abs(b.cum) / maxA * 115 * g; const pos = b.cum >= 0; return <rect key={i} x={i * 83 + 6} y={pos ? 120 - h : 120} width={70} height={h} fill={pos ? PAL.lime : PAL.red} stroke="#0F1115" strokeWidth={3} />; })}
        </svg>
      </div>
      <Pill text="/founder-skill:founder-pricing" x={40} y={1520} at={4} size={32} type />
      <Pill text="/founder-skill:founder-cfo" x={40} y={1600} at={130} size={32} type />
      <Pill text="example inputs from the repo, not your business" x={40} y={1690} at={260} bg={PAL.amber} size={26} />
      <Narrator start={S("price").start} x={770} y={1560} w={290} />
    </AbsoluteFill>
  );
};

/* ---------- 6 THE OTHER SKILLS ---------- */
const ICONS: Record<string, string[]> = {
  offer: ["..RRRR..", ".RRRRRR.", "RRRYYRRR", "RRRYYRRR", "RRRRRRRR", "RYYYYYYR", "RYYYYYYR", "RRRRRRRR"],
  marketing: ["......WW", "....WWWW", "BBBBWWWW", "BBBBWWWW", "BBBBWWWW", "..BB.WWW", "..BB..WW", "..BB...."],
  brand: ["...PP...", "..PPPP..", ".PPPPPP.", "PPPYYPPP", ".PPYYPP.", ".PP..PP.", "PP....PP", "P......P"],
  ops: ["..GGGG..", ".GGGGGG.", "GG.GG.GG", "GGG..GGG", "GGG..GGG", "GG.GG.GG", ".GGGGGG.", "..GGGG.."],
  launch: ["...RR...", "..RRRR..", "..WWWW..", "..WBBW..", "..WWWW..", ".RWWWWR.", "RR.YY.RR", "...YY..."],
  plan: ["WWWWWW..", "WIIIIW..", "WWWWWW..", "WIIIIW..", "WWWWWW..", "WIIIIW..", "WWWWWW..", "........"],
};
const ICOL: Record<string, string> = { R: "#E56B6F", Y: "#FFD56B", W: "#F4F6FA", B: "#4C8BF5", P: "#B07CFF", G: "#6BCB77", I: "#2D3350", ".": "transparent" };
const Icon: React.FC<{ k: string; s?: number }> = ({ k, s = 14 }) => <svg width={8 * s} height={8 * s} viewBox="0 0 8 8" shapeRendering="crispEdges">{ICONS[k].flatMap((row, y) => row.split("").map((c, x) => (c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={ICOL[c]} />)))}</svg>;
const Others: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const cards = [["offer", "OFFER", "founder-offer"], ["marketing", "MARKETING", "founder-marketing"], ["brand", "BRAND", "founder-brand"], ["ops", "OPERATIONS", "founder-ops"], ["launch", "LAUNCH", "founder-launch"], ["plan", "BUSINESS PLAN", "founder-plan"]];
  return (
    <AbsoluteFill>
      <Bg /><Caps id="others" />
      <div style={{ position: "absolute", left: 40, top: 240, width: 1000, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        {cards.map(([k, n, c], i) => { const s = spring({ frame: f - 8 - i * 20, fps, config: SPRING.pop }); const bob = Math.sin((f + i * 11) / 14) * 5; return (
          <div key={k} style={{ transform: `scale(${s}) translateY(${bob}px)`, background: "#141A26", border: "5px solid #0F1115", boxShadow: "8px 8px 0 rgba(200,240,49,.65)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 18 }}>
            <Icon k={k} /><div><div style={{ fontFamily: theme.mono, fontWeight: 900, fontSize: 36, color: "#fff" }}>{n}</div><div style={{ fontFamily: theme.mono, fontSize: 19, color: theme.lime, fontWeight: 800 }}>/founder-skill:{c}</div></div>
          </div>); })}
      </div>
      <div style={{ position: "absolute", left: 40, top: 1130, fontFamily: theme.mono, fontWeight: 800, fontSize: 30, color: "#fff" }}>RUN IN ORDER:</div>
      <div style={{ position: "absolute", left: 40, top: 1180, width: 1000, fontFamily: theme.mono, fontWeight: 800, fontSize: 25, color: theme.lime, lineHeight: "36px" }}>
        {["board → competitors → consumer → pricing → offer →", "cfo → marketing → brand → ops → launch → plan"].map((l, i) => <div key={i} style={{ opacity: clamp((f - 150 - i * 20) / 14) }}>{l}</div>)}
      </div>
      <Pill text="each skill reads what the others wrote (founder/ folder)" x={40} y={1300} at={200} bg="#fff" size={26} />
      <Narrator start={S("others").start} x={680} y={1480} w={360} />
    </AbsoluteFill>
  );
};

/* ---------- 7 INSTALL: README commands, real terminal recordings, installed slash list ---------- */
const Install: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const slash: string[] = R.slash;
  const readme = ["/plugin marketplace add Jakeschincariol/founder-skill", "/plugin install founder-skill@founder-skill"];
  return (
    <AbsoluteFill>
      <Bg /><Caps id="install" />
      <Frame x={30} y={225} w={1020} h={250} label="README.md · Install · as a plugin, in Claude Code">
        <div style={{ padding: "58px 24px 0", fontFamily: theme.mono, fontSize: 25, lineHeight: "40px", color: "#E8EAF0", whiteSpace: "pre" }}>
          {readme.map((l, i) => <div key={i} style={{ color: theme.lime }}>{l.slice(0, Math.ceil(l.length * clamp((f - 6 - i * 24) / 28)))}</div>)}
        </div>
      </Frame>
      <Sequence from={60} durationInFrames={120}><TermVid name="01-marketplace" frames={112} rate={1.5} y={500} /></Sequence>
      <Sequence from={170} durationInFrames={90}><TermVid name="02-install" frames={80} rate={1.7} y={500} /></Sequence>
      <Sequence from={250} durationInFrames={125}><TermVid name="03-list" frames={55} rate={1.7} y={500} /></Sequence>
      <Pill text="same commands, run via the claude CLI" x={40} y={1180} at={90} bg={PAL.amber} size={26} />
      {f >= 290 ? (
        <div style={{ position: "absolute", left: 30, top: 1230, width: 1020, background: "#141A26", border: "5px solid #0F1115", boxShadow: "8px 8px 0 rgba(200,240,49,.7)", padding: "10px 16px", zIndex: 30 }}>
          <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 21, color: theme.lime }}>REAL CLAUDE CODE SESSION · installed slash commands</div>
          {slash.map((s, i) => { const sp = spring({ frame: f - 295 - i * 3, fps, config: SPRING.settle }); return <div key={s} style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 24, lineHeight: "31px", color: i % 2 ? "#9FE7FF" : "#fff", opacity: sp, transform: `translateX(${(1 - sp) * 40}px)` }}>/{s}</div>; })}
        </div>
      ) : null}
      <Narrator start={S("install").start} x={750} y={1590} w={300} />
    </AbsoluteFill>
  );
};

/* ---------- 8 RESULT: real tool output, payback progress, honest disclaimer ---------- */
const Result: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const m = Math.min(12, Math.floor(clamp((f - 30) / 140) * 12) + 1); const pay = C.payback_month;
  const lines = ["# Unit economics: Moss Matcha Bar (an example)", "Break-even: 186 cups a day.", "Profit margin at your plan (383 a day): 38%", "Year 1 operating profit: $93,926 on $563,160", "Startup money earned back: month 8.", "Cash you need before it pays for itself: $34,092", "No red flags in these numbers. They are only as", "good as the inputs: check every cost against a quote."];
  return (
    <AbsoluteFill>
      <Bg /><Caps id="result" />
      <div style={{ position: "absolute", top: 230, left: 0 }}>
        <Stage rows={90}>
          <Sky rows={90} f={f} /><P x={0} y={70} w={180} h={20} c={PAL.ground} />
          <Building x={20} ground={70} floors={2} t={2} f={f} sign /><Building x={116} ground={70} floors={3} t={3} f={f} />
          <Person x={((f * 0.8) % 200) - 10} y={60} c="#E56B6F" f={f} /><Person x={170 - ((f * 0.6) % 200)} y={60} c="#4C8BF5" f={f} flip />
        </Stage>
      </div>
      <Frame x={30} y={800} w={1020} h={430} label="founder/cfo.md · real output of the plugin's CFO tool (example inputs)">
        <div style={{ padding: "56px 22px 0", fontFamily: theme.mono, fontSize: 24, lineHeight: "40px", color: "#E8EAF0" }}>{lines.map((l, i) => <div key={i} style={{ opacity: clamp((f - 20 - i * 14) / 10), color: i === 0 ? theme.lime : /month 8|\$34,092/.test(l) ? PAL.amber : "#E8EAF0" }}>{l}</div>)}</div>
      </Frame>
      <div style={{ position: "absolute", left: 40, top: 1262, width: 1000 }}>
        <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 24, color: "#fff", marginBottom: 6 }}>PAYBACK PROGRESS · month {m} of 12</div>
        <div style={{ display: "flex", gap: 6 }}>{Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ flex: 1, height: 36, border: "3px solid #0F1115", background: i < m ? (i + 1 >= pay ? PAL.lime : PAL.teal) : "#222" }} />)}</div>
      </div>
      <div style={{ position: "absolute", left: 40, top: 1380, width: 1000, background: PAL.amber, color: PAL.ink, border: "5px solid #0F1115", boxShadow: "8px 8px 0 rgba(0,0,0,.6)", padding: "12px 18px", fontFamily: theme.mono, fontWeight: 900, fontSize: 31, lineHeight: "40px", transform: `scale(${spring({ frame: f - 110, fps, config: SPRING.pop })})`, transformOrigin: "left top" }}>SIMULATED BUYERS + PROJECTIONS ≠ PROOF OF REAL DEMAND</div>
      <Pill text="/founder-skill:founder-plan → verdict: Profitable · Not yet · Incomplete" x={40} y={1530} at={160} bg="#fff" size={23} />
      <Narrator start={S("result").start} x={720} y={1600} w={300} />
    </AbsoluteFill>
  );
};

/* ---------- 9 CTA ---------- */
const Cta: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: f - 20, fps, config: SPRING.pop });
  return (
    <AbsoluteFill>
      <Bg /><Caps id="cta" />
      <div style={{ position: "absolute", top: 300, left: 0 }}>
        <Stage rows={80}><Sky rows={80} f={f} /><P x={0} y={60} w={180} h={20} c={PAL.ground} /><Building x={68} ground={60} floors={4} t={4} f={f} sign /><Person x={((f * 0.9) % 200) - 10} y={50} c="#6BCB77" f={f} /></Stage>
      </div>
      <div style={{ position: "absolute", left: 40, top: 820, width: 1000, textAlign: "center", transform: `scale(${s})`, background: "#141A26", border: "5px solid #0F1115", boxShadow: "8px 8px 0 rgba(200,240,49,.7)", padding: "20px 10px" }}>
        <div style={{ fontFamily: theme.mono, fontWeight: 900, fontSize: 54, color: theme.lime }}>FOUNDER SKILL</div>
        <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 30, color: "#fff" }}>github.com/Jakeschincariol/founder-skill</div>
        <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 28, color: "#9AA1AE", marginTop: 8 }}>11 free skills · MIT</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1180, textAlign: "center", fontFamily: theme.mono }}>
        <div style={{ fontWeight: 900, fontSize: 56, color: "#fff" }}>AGENTOON.AI</div><div style={{ fontWeight: 800, fontSize: 34, color: theme.lime }}>Follow @agentoon.ai</div><div style={{ fontSize: 26, color: "#9AA1AE" }}>Real AI Tools • Skills • Automation</div>
      </div>
      <Narrator start={S("cta").start} x={370} y={1500} w={340} />
    </AbsoluteFill>
  );
};

export const FounderSkill: React.FC = () => (
  <AbsoluteFill style={{ background: "#0B0D12" }}>
    <Audio src={staticFile("audio/fsk-mix.wav")} />
    {([["hook", Hook], ["intro", Intro], ["board", Board], ["comp", Comp], ["price", Price], ["others", Others], ["install", Install], ["result", Result], ["cta", Cta]] as const).map(([id, Cm]) => (
      <Sequence key={id} from={S(id).start} durationInFrames={S(id).len}><Cm /></Sequence>
    ))}
  </AbsoluteFill>
);
