import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING, theme } from "../fx/theme";
import { Robot, robotPose, Gesture } from "../fx/RobotRig";
import { AnimatedSubtitles } from "../fx/kinetic";
import { AnimatedCounter } from "../fx/data";
import { clamp } from "../fx/math";
import TL from "../../public/data/fs-timeline.json";
import REAL from "../../public/data/fs-real.json";

/** Episode 20: ONE 93 s vertical video about Vercel Labs' find-skills. Every external visual is real: the skills.sh recording, the terminal sessions (real pty captures of
 *  `npx skills add` / `npx skills find`), the real SKILL.md text. The "example" scene uses OUR OWN tested Remotion clips and says so on screen. */
type Scene = { id: string; start: number; len: number };
const SC = TL.scenes as Scene[];
const S = (id: string) => SC.find((s) => s.id === id)!;
const LIP = TL.lip as { fps: number; a: number[] };
export const FS_FRAMES = TL.frames;
const clip = (n: string) => staticFile(`clips/${n}.mp4`);
const foot = (n: string) => staticFile(`ep20/footage/${n}.mp4`);
const term = (n: string) => staticFile(`ep20/term/${n}`);
const R: any = REAL;

const GESTURES: Gesture[] = [
  { type: "wave", at: 12, hand: "R" }, { type: "nod", at: S("intro").start + 30 }, { type: "nod", at: S("install").start + 40 },
  { type: "wow", at: S("search").start + 120 }, { type: "nod", at: S("inspect").start + 60 }, { type: "wow", at: S("example").start + 80 },
  { type: "nod", at: S("why").start + 100 }, { type: "celebrate", at: S("cta").start + 190 },
];

/* ---------- shared ---------- */
const Bg: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(120% 70% at 50% 18%, #1B2130 0%, #0B0D12 70%)" }}>
    <div style={{ position: "absolute", inset: 0, opacity: 0.33, backgroundImage: "linear-gradient(rgba(200,240,49,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(200,240,49,.07) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
  </AbsoluteFill>
);
const Narrator: React.FC<{ start: number; x: number; y: number; w: number }> = ({ start, x, y, w }) => {
  const f = useCurrentFrame(); const g = f + start;
  return <div style={{ position: "absolute", left: x, top: y, zIndex: 60 }}><Robot pose={robotPose(g, { lip: LIP, speaking: [[0, FS_FRAMES]], fps: 30, gestures: GESTURES, seed: 5 })} width={w} shadow={false} /></div>;
};
const Caps: React.FC<{ id: string; top?: number; size?: number }> = ({ id, top = 34, size = 56 }) => {
  const sc = S(id); const words = TL.words.filter((w) => w.s >= sc.start - 2 && w.s < sc.start + sc.len).map((w) => ({ ...w, s: w.s - sc.start, e: w.e - sc.start }));
  return <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: top + size * 2.7, padding: `${top}px 30px 0`, background: "linear-gradient(180deg, rgba(8,10,14,.93) 0%, rgba(8,10,14,.72) 70%, rgba(8,10,14,0) 100%)", zIndex: 70 }}><AnimatedSubtitles words={words} size={size} perChunk={4} /></div>;
};
const Pill: React.FC<{ text: string; x: number; y: number; at: number; bg?: string; fg?: string; size?: number }> = ({ text, x, y, at, bg = theme.lime, fg = theme.ink, size = 36 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: f - at, fps, config: SPRING.pop });
  return <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s})`, transformOrigin: "left center", opacity: clamp(s * 2), background: bg, color: fg, fontFamily: theme.mono, fontWeight: 800, fontSize: size, padding: "9px 20px", borderRadius: 14, whiteSpace: "nowrap", boxShadow: "0 10px 26px rgba(0,0,0,.45)", zIndex: 40 }}>{text}</div>;
};
const Drift: React.FC<{ len: number; children: React.ReactNode; z?: number }> = ({ len, children, z = 0.05 }) => {
  const f = useCurrentFrame(); const k = f / len;
  return <AbsoluteFill style={{ transform: `scale(${1 + z * k}) translate(${-12 * k}px, ${-22 * k}px)`, transformOrigin: "50% 12%" }}>{children}</AbsoluteFill>;
};
const Frame: React.FC<{ x: number; y: number; w: number; h: number; label?: string; children: React.ReactNode }> = ({ x, y, w, h, label, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 22, overflow: "hidden", border: "2px solid rgba(200,240,49,.6)", boxShadow: "0 26px 70px rgba(0,0,0,.6)", background: "#0E1117" }}>
    {children}
    {label ? <div style={{ position: "absolute", left: 14, top: 12, fontFamily: theme.mono, fontWeight: 800, fontSize: 22, color: theme.ink, background: theme.lime, padding: "4px 12px", borderRadius: 8, zIndex: 5 }}>{label}</div> : null}
  </div>
);
const Box: React.FC<{ x: number; y: number; w: number; h: number; at: number; dur?: number; color?: string }> = ({ x, y, w, h, at, dur = 90, color = theme.lime }) => {
  const f = useCurrentFrame(); const p = clamp((f - at) / 10); const o = f > at + dur ? clamp(1 - (f - at - dur) / 8) : p;
  return <div style={{ position: "absolute", left: x - 8, top: y - 8, width: w + 16, height: h + 16, border: `5px solid ${color}`, borderRadius: 12, opacity: o, transform: `scale(${0.94 + 0.06 * p})`, boxShadow: `0 0 24px ${color}`, zIndex: 30 }} />;
};

/* ---------- 1 HOOK: skill library expanding around the robot + rolling counter ---------- */
const Hook: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const names: { skill: string; source: string; installs: string }[] = [...R.leaderboard.slice(0, 11), { skill: "remotion-best-practices", source: "remotion-dev/skills", installs: "861K" }];
  return (
    <AbsoluteFill>
      <Bg />
      {names.map((n, i) => {
        const ang = (i / names.length) * Math.PI * 2 + i * 0.35; const depth = 0.55 + 0.45 * ((i * 5) % 7) / 6;
        const s = spring({ frame: f - 14 - i * 4, fps, config: SPRING.pop }); const rx = 300 * depth + 60, ry = 330 * depth + 60;
        const x = 540 + Math.cos(ang + f * 0.004) * rx * s - 190 * (0.7 + 0.5 * depth), y = 930 + Math.sin(ang + f * 0.004) * ry * s - 50 + Math.sin(f / 22 + i) * 8;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 380, transform: `scale(${(0.7 + 0.5 * depth) * s})`, opacity: clamp(s * 1.6) * (0.55 + 0.45 * depth), filter: depth < 0.7 ? "blur(1.5px)" : "none", background: "#141A26", border: "2px solid rgba(200,240,49,.55)", borderRadius: 18, padding: "12px 18px", boxShadow: "0 16px 40px rgba(0,0,0,.5)", zIndex: Math.round(depth * 10) }}>
          <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 28, color: "#fff" }}>{n.skill}</div>
          <div style={{ fontFamily: theme.mono, fontSize: 19, color: "#9AA1AE", display: "flex", justifyContent: "space-between" }}><span>{n.source}</span><span style={{ color: theme.lime }}>{n.installs}</span></div>
        </div>;
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", zIndex: 50 }}>
        <AnimatedCounter to={R.total} start={6} dur={120} size={170} label="" />
        <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 30, color: theme.lime, marginTop: -6 }}>SKILLS LISTED ON skills.sh · checked {R.checked}</div>
      </div>
      <Narrator start={0} x={290} y={1250} w={500} />
      <Caps id="hook" top={34} size={54} />
    </AbsoluteFill>
  );
};

/* ---------- 2 INTRO: real skills.sh recording, camera move into the search box ---------- */
const Intro: React.FC = () => {
  const f = useCurrentFrame(); const e = (a: number, b: number) => { const t = clamp((f - a) / (b - a)); return t * t * (3 - 2 * t); };
  const K = (arr: number[][]) => { // keyframes [frame, tx, ty, z]
    let i = 0; while (i < arr.length - 2 && f > arr[i + 1][0]) i++; const [f0, x0, y0, z0] = arr[i], [f1, x1, y1, z1] = arr[i + 1]; const t = clamp((f - f0) / (f1 - f0)), q = t * t * (3 - 2 * t);
    return { tx: x0 + (x1 - x0) * q, ty: y0 + (y1 - y0) * q, z: z0 + (z1 - z0) * q };
  };
  const { tx, ty, z } = K([[0, 540, 700, 1], [40, 120, 573, 1.9], [105, 120, 573, 1.9], [140, 300, 519, 1.5], [170, 400, 330, 1.3], [330, 540, 560, 1.2]]); const px = 540, py = 520;
  return (
    <AbsoluteFill>
      <Bg /><Caps id="intro" top={34} size={52} />
      <Frame x={0} y={250} w={1080} h={1330} label="skills.sh · REAL SITE RECORDING">
        <div style={{ width: 1080, height: 1400, transform: `translate(${px - tx * z}px, ${py - ty * z}px) scale(${z})`, transformOrigin: "0 0" }}>
          <OffthreadVideo src={foot("home")} muted startFrom={36} style={{ width: 1080, height: 1400 }} />
        </div>
      </Frame>
      <Pill text="All Time (1,455,781)  ← live directory total" x={40} y={1535} at={60} bg={theme.amber} size={28} />
      <Pill text="find-skills · vercel-labs/skills" x={40} y={1610} at={30} size={30} />
      <Pill text="search the open directory" x={40} y={1685} at={90} bg="#fff" size={28} />
      <Narrator start={S("intro").start} x={720} y={1540} w={330} />
    </AbsoluteFill>
  );
};

/* ---------- 3 INSTALL: real terminal session ---------- */
const TermVid: React.FC<{ name: string; frames: number; x?: number; y?: number; w?: number }> = ({ name, frames, x = 30, y = 230, w = 1020 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, borderRadius: 22, overflow: "hidden", border: "2px solid rgba(200,240,49,.6)", boxShadow: "0 26px 70px rgba(0,0,0,.6)", background: "#0E1117" }}>
    <div style={{ height: 46, background: "#171B24", display: "flex", alignItems: "center", gap: 10, padding: "0 18px", fontFamily: theme.mono, fontSize: 18, color: "#9AA1AE" }}>
      <i style={{ width: 13, height: 13, borderRadius: 9, background: "#FF5F57" }} /><i style={{ width: 13, height: 13, borderRadius: 9, background: "#FEBC2E" }} /><i style={{ width: 13, height: 13, borderRadius: 9, background: "#28C840" }} />
      <span style={{ marginLeft: 12 }}>REAL TERMINAL SESSION · recorded on this computer</span>
    </div>
    <Sequence layout="none" from={0} durationInFrames={frames}><OffthreadVideo src={term(`${name}.mp4`)} muted style={{ width: w, display: "block" }} /></Sequence>
    <Sequence layout="none" from={frames}><Img src={term(`${name}-last.png`)} style={{ width: w, display: "block" }} /></Sequence>
  </div>
);
const Install: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const row = (t: string, at: number, c = "#fff") => { const s = spring({ frame: f - at, fps, config: SPRING.settle }); return <div style={{ opacity: s, transform: `translateX(${(1 - s) * 40}px)`, fontFamily: theme.mono, fontWeight: 800, fontSize: 34, color: c, marginBottom: 16 }}>{t}</div>; };
  return (
    <AbsoluteFill>
      <Bg /><Caps id="install" top={34} size={52} />
      <Drift len={390}>
        <TermVid name="01-install" frames={212} />
        <Box x={52} y={1000 - 36 * 0} w={0} h={0} at={9999} />
        <div style={{ position: "absolute", left: 60, top: 1090 }}>
          {row("1  Found 1 skill in vercel-labs/skills", 150)}
          {row("2  Copied to  ./.claude/skills/find-skills", 200, "#9FE7FF")}
          {row("3  Claude Code can now load it", 250, "#B6F7A8")}
        </div>
        <Pill text="✓ INSTALLED" x={60} y={960} at={190} bg="#28C840" size={38} />
        <Pill text="REVIEW SKILLS BEFORE USE · full agent permissions" x={60} y={1470} at={290} bg={theme.amber} size={27} />
      </Drift>
      <Narrator start={S("install").start} x={700} y={1500} w={340} />
    </AbsoluteFill>
  );
};

/* ---------- 4 SEARCH: three real searches ---------- */
const Cards: React.FC<{ q: string; at: number }> = ({ q, at }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const items = R.search[q] as { id: string; skill: string; source: string; installs: number }[];
  const fmt = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(n));
  return <div style={{ position: "absolute", left: 40, right: 40, top: 1080 }}>
    <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 26, color: theme.lime, marginBottom: 12 }}>TOP MATCHES · skills.sh search API · "{q}"</div>
    {items.slice(0, 3).map((it, i) => { const s = spring({ frame: f - at - i * 8, fps, config: SPRING.pop }); return (
      <div key={it.id} style={{ transform: `translateX(${(1 - s) * 120}px)`, opacity: clamp(s * 2), background: "#141A26", border: "2px solid rgba(200,240,49,.5)", borderRadius: 16, padding: "12px 20px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 32, color: "#fff" }}>{it.skill}</div><div style={{ fontFamily: theme.mono, fontSize: 21, color: "#9AA1AE" }}>{it.source}</div></div>
        <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 32, color: theme.lime }}>{fmt(it.installs)}</div>
      </div>); })}
  </div>;
};
const Search: React.FC = () => (
  <AbsoluteFill>
    <Bg /><Caps id="search" top={34} size={52} />
    <Drift len={420} z={0.04}>
      <Sequence from={4} durationInFrames={140}><TermVid name="02-find-remotion" frames={132} /><Cards q="remotion" at={110} /></Sequence>
      <Sequence from={144} durationInFrames={140}><TermVid name="03-find-motion" frames={140} /><Cards q="motion graphics" at={110} /></Sequence>
      <Sequence from={284}><TermVid name="04-find-video" frames={140} /><Cards q="video editing" at={110} /><Pill text="NOISY QUERY: READ BEFORE YOU PICK" x={40} y={1500} at={60} bg={theme.amber} size={30} /></Sequence>
    </Drift>
    <Narrator start={S("search").start} x={720} y={1580} w={320} />
  </AbsoluteFill>
);

/* ---------- 5 INSPECT: real skill page, audits, real SKILL.md source ---------- */
const Inspect: React.FC = () => {
  const f = useCurrentFrame(); const e = (a: number, b: number) => { const t = clamp((f - a) / (b - a)); return t * t * (3 - 2 * t); };
  const z = 1 + 0.35 * e(30, 100) - 0.35 * e(140, 200); const ox = 300, oy = 330;
  const lines: string[] = R.skillmd; const shown = Math.min(lines.length, Math.floor(clamp((f - 150) / 230) * lines.length));
  return (
    <AbsoluteFill>
      <Bg /><Caps id="inspect" top={34} size={50} />
      <Frame x={30} y={230} w={1020} h={720} label="skills.sh/remotion-dev/skills/remotion-best-practices · REAL">
        <div style={{ width: 1020, height: 1320, transform: `scale(${z})`, transformOrigin: `${ox}px ${oy}px` }}><OffthreadVideo src={foot("skillpage")} muted startFrom={30} playbackRate={0.9} style={{ width: 1020, height: 1322 }} /></div>
      </Frame>
      <Pill text="863.0K installs · 7.5K stars" x={40} y={965} at={50} size={30} />
      <Pill text="Audits: Trust Hub PASS · Socket PASS · Snyk FAIL" x={40} y={1040} at={110} bg={theme.amber} size={28} />
      <Frame x={30} y={1120} w={1020} h={720} label="SOURCE · SKILL.md (raw, remotion-dev/skills)">
        <div style={{ padding: "58px 22px 0", fontFamily: theme.mono, fontSize: 21, lineHeight: "27px", color: "#E8EAF0", whiteSpace: "pre-wrap" }}>
          {lines.slice(0, shown).map((l, i) => <div key={i} style={{ color: i < 5 ? "#FFD479" : /^#/.test(l) ? theme.lime : "#E8EAF0" }}><span style={{ color: "#5B6475" }}>{String(i + 1).padStart(2, " ")}  </span>{l.slice(0, 74)}</div>)}
        </div>
      </Frame>
      <Pill text="plain Markdown instructions · read it first" x={40} y={1860} at={230} bg="#fff" size={26} />
      <Narrator start={S("inspect").start} x={760} y={1560} w={300} />
    </AbsoluteFill>
  );
};

/* ---------- 6 EXAMPLE: OUR OWN tested Remotion animation components ---------- */
const EX = [
  { c: "D05", s: "/agentoon-data-motion", d: "animated number counter" }, { c: "D07", s: "/agentoon-kinetic-type", d: "kinetic typography" },
  { c: "D01", s: "/ui-depth-reel", d: "floating software cards" }, { c: "D06", s: "/agentoon-3d-showcase", d: "3D camera movement" },
];
const Example: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const L = S("example").len / 4;
  return (
    <AbsoluteFill>
      <Bg /><Caps id="example" top={34} size={50} />
      <Pill text="OUR OWN TESTED REMOTION COMPONENTS" x={40} y={240} at={4} bg={theme.amber} size={32} />
      <Pill text="find-skills only helps you DISCOVER skills" x={40} y={318} at={14} bg="#fff" size={28} />
      {EX.map((x, i) => (
        <Sequence key={x.c} from={Math.round(i * L)} durationInFrames={Math.round(L) + 4}>
          <Frame x={165} y={400} w={750} h={1334}><OffthreadVideo src={clip(x.c)} muted startFrom={i === 0 ? 70 : 90} playbackRate={0.95} style={{ width: 750, height: 1334 }} /></Frame>
          <Pill text={`${x.s} · ${x.d}`} x={40} y={1752} at={2} size={28} />
        </Sequence>
      ))}
      <Narrator start={S("example").start} x={800} y={1560} w={260} />
    </AbsoluteFill>
  );
};

/* ---------- 7 WHY: skill categories branching from one search node ---------- */
const bez = (a: [number, number], c: [number, number], b: [number, number], t: number): [number, number] => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
const Why: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const C: [number, number] = [540, 560]; const cats = ["remotion", "motion graphics", "video editing", "web development", "automation"];
  const pos: [number, number][] = [[150, 960], [345, 1150], [540, 960], [735, 1150], [930, 960]];
  const cs = spring({ frame: f - 6, fps, config: SPRING.pop });
  return (
    <AbsoluteFill>
      <Bg /><Caps id="why" top={34} size={50} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {cats.map((c, i) => { const at = 30 + i * 18; const p = pos[i]; const ctl: [number, number] = [(C[0] + p[0]) / 2, C[1] + 230]; const grow = clamp((f - at) / 22); const pt = bez(C, ctl, p, grow);
          const pk = ((f - at - 22 + i * 17) % 60) / 60; const pp = f > at + 22 ? bez(C, ctl, p, pk) : null;
          return <g key={c}><path d={`M${C[0]},${C[1]} Q${ctl[0]},${ctl[1]} ${pt[0]},${pt[1]}`} stroke={i % 2 ? "#35F2FF" : theme.lime} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.85} />
            {pp ? <circle cx={pp[0]} cy={pp[1]} r={11} fill="#fff" /> : null}</g>; })}
      </svg>
      <div style={{ position: "absolute", left: 540 - 300, top: 560 - 58, width: 600, textAlign: "center", transform: `scale(${cs})`, background: theme.lime, color: theme.ink, borderRadius: 24, padding: "16px 10px", fontFamily: theme.mono, fontWeight: 800, fontSize: 40, boxShadow: "0 0 50px rgba(200,240,49,.6)", zIndex: 20 }}>npx skills find</div>
      {cats.map((c, i) => { const s = spring({ frame: f - 46 - i * 18, fps, config: SPRING.pop }); const p = pos[i]; return (
        <div key={c} style={{ position: "absolute", left: p[0] - 140, top: p[1] - 10, width: 280, textAlign: "center", transform: `scale(${s})`, opacity: clamp(s * 2), background: "#141A26", border: "2px solid rgba(200,240,49,.6)", borderRadius: 18, padding: "14px 8px", fontFamily: theme.mono, fontWeight: 800, fontSize: 28, color: "#fff", zIndex: 10 }}>{c}</div>); })}
      {["1  SEARCH BY TASK", "2  INSPECT THE SOURCE", "3  INSTALL WHAT FITS"].map((t, i) => { const s = spring({ frame: f - 150 - i * 24, fps, config: SPRING.pop }); return (
        <div key={t} style={{ position: "absolute", left: 60, top: 1290 + i * 92, transform: `translateX(${(1 - s) * 100}px)`, opacity: clamp(s * 2), fontFamily: theme.mono, fontWeight: 800, fontSize: 44, color: i === 2 ? theme.lime : "#fff" }}>{t}</div>); })}
      <Pill text="installing find-skills ≠ installing every skill" x={40} y={1600} at={250} bg={theme.amber} size={32} />
      <Narrator start={S("why").start} x={760} y={1650} w={270} />
    </AbsoluteFill>
  );
};

/* ---------- 8 CTA ---------- */
const Cta: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const sc = S("cta"); const ec = spring({ frame: f - 190, fps, config: SPRING.pop });
  return (
    <AbsoluteFill>
      <Bg />
      {f < 190 ? (
        <>
          <Caps id="cta" top={34} size={52} />
          <Frame x={30} y={260} w={600} h={778} label="skills.sh · REAL"><div style={{ width: 600, height: 778, overflow: "hidden" }}><OffthreadVideo src={foot("home")} muted startFrom={200} style={{ width: 600, height: 778 }} /></div></Frame>
          <Narrator start={sc.start} x={600} y={560} w={470} />
          <Pill text="skills.sh" x={60} y={1080} at={20} size={44} />
          <Pill text="npx skills find <task>" x={60} y={1170} at={50} bg="#fff" size={34} />
        </>
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", gap: 24, transform: `scale(${0.9 + 0.1 * ec})`, opacity: clamp(ec * 2) }}>
          <div style={{ fontFamily: theme.body, fontWeight: 900, fontSize: 120, lineHeight: "118px", textAlign: "center", color: "#fff" }}>FIND<br /><span style={{ background: theme.lime, color: theme.ink, padding: "0 18px" }}>SKILLS</span></div>
          <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 40, color: "#fff" }}>by Vercel Labs · skills.sh</div>
          <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 64, color: theme.lime }}>AGENTOON.AI</div>
          <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 36, color: "#fff" }}>Follow @agentoon.ai</div>
          <div style={{ fontFamily: theme.mono, fontSize: 28, color: "#9AA1AE" }}>Real AI Tools • Skills • Automation</div>
        </AbsoluteFill>
      )}
      {f >= 190 ? <Narrator start={sc.start} x={380} y={1450} w={330} /> : null}
    </AbsoluteFill>
  );
};

export const FindSkills: React.FC = () => (
  <AbsoluteFill style={{ background: "#0B0D12" }}>
    <Audio src={staticFile("audio/fs-mix.wav")} />
    {([["hook", Hook], ["intro", Intro], ["install", Install], ["search", Search], ["inspect", Inspect], ["example", Example], ["why", Why], ["cta", Cta]] as const).map(([id, C]) => (
      <Sequence key={id} from={S(id).start} durationInFrames={S(id).len}><C /></Sequence>
    ))}
  </AbsoluteFill>
);
