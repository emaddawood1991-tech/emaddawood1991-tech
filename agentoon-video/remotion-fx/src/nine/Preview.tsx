import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING, theme } from "../fx/theme";
import { Robot, robotPose, Gesture } from "../fx/RobotRig";
import { AnimatedSubtitles } from "../fx/kinetic";
import { clamp } from "../fx/math";
import TL from "../../public/data/preview-timeline.json";
import REAL from "../../public/data/tui-real.json";
import TERM from "../../public/data/real-terminal.json";

/** ONE 90-second vertical Agentoon.ai video: hook -> what skills are -> how to use -> nine demos (the rendered D01-D09 clips) -> where skills live -> CTA.
 *  The terminal panels REPLAY real data (verbatim commands/outputs from real `claude -p` runs and real shell commands) and say so on screen. */
type Scene = { id: string; start: number; len: number };
const SC = TL.scenes as Scene[];
const S = (id: string) => SC.find((s) => s.id === id)!;
const LIP = TL.lip as { fps: number; a: number[] };
export const PREVIEW_FRAMES = TL.frames;

const STYLES = [
  { id: "s01", skill: "ui-depth-reel", clip: "D01" },
  { id: "s02", skill: "scrapbook-collage", clip: "D02" },
  { id: "s03", skill: "news-broadcast", clip: "D03" },
  { id: "s04", skill: "neon-outline", clip: "D04" },
  { id: "s05", skill: "agentoon-number-motion", clip: "D05" },
  { id: "s06", skill: "agentoon-3d-showcase", clip: "D06" },
  { id: "s07", skill: "agentoon-kinetic-type", clip: "D07" },
  { id: "s08", skill: "agentoon-data-flow", clip: "D08" },
  { id: "s09", skill: "agentoon-cinematic-cuts", clip: "D09" },
] as const;

const GESTURES: Gesture[] = [
  { type: "wave", at: 10, hand: "R" },
  { type: "nod", at: S("explain").start + 24 }, { type: "nod", at: S("howto").start + 30 },
  ...STYLES.map((s) => ({ type: "wow" as const, at: S(s.id).start + 66 })),
  { type: "nod", at: S("skills").start + 40 },
  { type: "celebrate", at: S("cta").start + 130 },
];
const clip = (c: string) => staticFile(`clips/${c}.mp4`);

/* ---------- shared pieces ---------- */
const Bg: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(120% 70% at 50% 18%, #1B2130 0%, #0B0D12 70%)" }}>
    <div style={{ position: "absolute", inset: 0, opacity: 0.35, backgroundImage: "linear-gradient(rgba(200,240,49,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(200,240,49,.07) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
  </AbsoluteFill>
);

/** Robot narrator: lip-synced to the real narration track (global frame = local frame + scene start). */
const Narrator: React.FC<{ start: number; x: number; y: number; w: number }> = ({ start, x, y, w }) => {
  const f = useCurrentFrame(); const g = f + start;
  const pose = robotPose(g, { lip: LIP, speaking: [[0, PREVIEW_FRAMES]], fps: 30, gestures: GESTURES, seed: 2 });
  return <div style={{ position: "absolute", left: x, top: y }}><Robot pose={pose} width={w} shadow={false} /></div>;
};

const Caps: React.FC<{ id: string; top?: number; size?: number }> = ({ id, top = 36, size = 58 }) => {
  const sc = S(id); const words = TL.words.filter((w) => w.s >= sc.start - 2 && w.s < sc.start + sc.len).map((w) => ({ ...w, s: w.s - sc.start, e: w.e - sc.start }));
  return <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: top + size * 2.6, padding: `${top}px 30px 0`, background: "linear-gradient(180deg, rgba(8,10,14,.92) 0%, rgba(8,10,14,.7) 70%, rgba(8,10,14,0) 100%)", zIndex: 50 }}><AnimatedSubtitles words={words} size={size} perChunk={4} /></div>;
};

type Ln = { t: string; at: number; dur?: number; c?: string };
const mono: React.CSSProperties = { fontFamily: theme.mono, fontSize: 22, lineHeight: "30px", color: "#E8EAF0", whiteSpace: "pre-wrap", wordBreak: "break-all" };
/** Terminal panel. Lines type in character by character (dur>0) or appear at once. The title bar states plainly that this is a replay of real data. */
const Term: React.FC<{ x: number; y: number; w: number; h: number; lines: Ln[]; label?: string }> = ({ x, y, w, h, lines, label = "REPLAY OF A REAL RUN" }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 22, overflow: "hidden", background: "#0E1117", border: "2px solid rgba(200,240,49,.55)", boxShadow: "0 24px 60px rgba(0,0,0,.55)" }}>
      <div style={{ height: 46, background: "#171B24", display: "flex", alignItems: "center", gap: 10, padding: "0 18px", fontFamily: theme.mono, fontSize: 18, color: "#9AA1AE" }}>
        <i style={{ width: 13, height: 13, borderRadius: 9, background: "#FF5F57" }} /><i style={{ width: 13, height: 13, borderRadius: 9, background: "#FEBC2E" }} /><i style={{ width: 13, height: 13, borderRadius: 9, background: "#28C840" }} />
        <span style={{ marginLeft: 12 }}>claude · {label}</span>
      </div>
      <div style={{ padding: "12px 20px" }}>
        {lines.map((l, i) => {
          if (f < l.at) return null;
          const p = l.dur ? clamp((f - l.at) / l.dur) : 1; const n = Math.ceil(l.t.length * p);
          return <div key={i} style={{ ...mono, color: l.c ?? "#E8EAF0" }}>{l.t.slice(0, n)}{l.dur && p < 1 ? <span style={{ background: theme.lime, color: theme.lime }}>▌</span> : null}</div>;
        })}
      </div>
    </div>
  );
};

const Pill: React.FC<{ text: string; x: number; y: number; at: number; bg?: string; fg?: string; size?: number; w?: number }> = ({ text, x, y, at, bg = theme.lime, fg = theme.ink, size = 40, w }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: f - at, fps, config: SPRING.pop });
  return <div style={{ position: "absolute", left: x, top: y, width: w, textAlign: "center", transform: `scale(${s})`, transformOrigin: "left center", opacity: clamp(s * 2), background: bg, color: fg, fontFamily: theme.mono, fontWeight: 800, fontSize: size, padding: "10px 22px", borderRadius: 16, whiteSpace: "nowrap", boxShadow: "0 10px 26px rgba(0,0,0,.45)" }}>{text}</div>;
};

/** Boxed clip (scaled, rounded, lime frame). */
const ClipBox: React.FC<{ src: string; x: number; y: number; scale: number; from?: number; rate?: number; end?: number }> = ({ src, x, y, scale, from = 0, rate = 1, end }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 1080 * scale, height: 1920 * scale, borderRadius: 26, overflow: "hidden", border: "3px solid rgba(200,240,49,.8)", boxShadow: "0 30px 80px rgba(0,0,0,.6)", background: "#000" }}>
    <OffthreadVideo src={src} muted startFrom={from} endAt={end} playbackRate={rate} style={{ width: 1080 * scale, height: 1920 * scale }} />
  </div>
);

/* ---------- 00:00 HOOK: rapid before/after ---------- */
const Wipe: React.FC<{ c: string; b: number; a: number }> = ({ c, b, a }) => {
  const f = useCurrentFrame(); const p = clamp((f - 14) / 14); const e = p * p * (3 - 2 * p);
  const box: React.CSSProperties = { position: "absolute", inset: 0, objectFit: "cover", width: 1080, height: 1400 };
  return (
    <AbsoluteFill>
      <OffthreadVideo src={clip(c)} muted startFrom={b} style={box} />
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - e) * 100}% 0 0)` }}><OffthreadVideo src={clip(c)} muted startFrom={a} style={box} /></div>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: e * 1080 - 3, width: 6, background: theme.lime, opacity: p > 0 && p < 1 ? 1 : 0 }} />
      <div style={{ position: "absolute", left: 30, top: 150, fontFamily: theme.mono, fontWeight: 800, fontSize: 34, color: theme.ink, background: p < 0.5 ? "#fff" : theme.lime, padding: "6px 16px", borderRadius: 10 }}>{p < 0.5 ? "BEFORE" : "AFTER"}</div>
    </AbsoluteFill>
  );
};
const Hook: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: f - 6, fps, config: SPRING.slam });
  return (
    <AbsoluteFill>
      <Bg />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1400, overflow: "hidden" }}>
        <Sequence from={0} durationInFrames={45}><Wipe c="D06" b={8} a={104} /></Sequence>
        <Sequence from={45} durationInFrames={45}><Wipe c="D05" b={8} a={110} /></Sequence>
        <Sequence from={90} durationInFrames={45}><Wipe c="D08" b={8} a={110} /></Sequence>
        <Sequence from={135} durationInFrames={45}><Wipe c="D03" b={8} a={110} /></Sequence>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1400, bottom: 0, background: "linear-gradient(180deg,#0B0D12,#111724)" }} />
      <Caps id="hook" top={40} />
      <div style={{ position: "absolute", left: 470, top: 1440, transform: `scale(${s})`, transformOrigin: "left top", fontFamily: theme.body, fontWeight: 900, fontSize: 92, lineHeight: "96px", color: "#fff" }}>ONE<br /><span style={{ background: theme.lime, color: theme.ink, padding: "0 14px" }}>SLASH</span><br />COMMAND</div>
      <Narrator start={0} x={40} y={1440} w={400} />
    </AbsoluteFill>
  );
};

const Drift: React.FC<{ len: number; children: React.ReactNode; z?: number }> = ({ len, children, z = 0.06 }) => {
  const f = useCurrentFrame(); const k = f / len;
  return <AbsoluteFill style={{ transform: `scale(${1 + z * k}) translate(${-14 * k}px, ${-26 * k}px)`, transformOrigin: "50% 12%" }}>{children}</AbsoluteFill>;
};
/* ---------- EXPLAIN + HOW TO USE: wide terminal on top, "what it produces" clip below ---------- */
const Explain: React.FC = () => (
  <AbsoluteFill>
    <Bg /><Caps id="explain" top={36} size={54} />
    <Drift len={302}>
    <Term x={30} y={190} w={1020} h={660} lines={[
      { t: "$ " + TERM.cmd_grep, at: 10, dur: 50, c: theme.lime },
      ...TERM.out_grep.map((t, i) => ({ t, at: 70 + i * 14 } as Ln)),
      { t: "", at: 120 },
      { t: "$ " + TERM.cmd_fx, at: 128, dur: 36, c: theme.lime },
      ...TERM.out_fx.map((t, i) => ({ t, at: 172 + i * 7, c: "#9FE7FF" } as Ln)),
    ]} label="REAL shell output" />
    <Pill text="CUSTOM SKILL · NOT BUILT-IN" x={40} y={880} at={96} bg={theme.amber} size={34} />
    <Pill text="REMOTION COMPONENTS" x={560} y={880} at={196} size={34} />
    <ClipBox src={clip("D02")} x={60} y={960} scale={0.46} from={40} rate={0.45} />
    </Drift>
    <Narrator start={S("explain").start} x={700} y={1330} w={340} />
  </AbsoluteFill>
);
const HowTo: React.FC = () => {
  const r = (REAL as any)["news-broadcast"];
  return (
    <AbsoluteFill>
      <Bg /><Caps id="howto" top={36} size={54} />
      <Drift len={246}>
      <Term x={30} y={190} w={1020} h={690} lines={[
        { t: "$ " + TERM.cmd_ls, at: 6, dur: 40, c: theme.lime },
        ...TERM.out_ls.map((t, i) => ({ t, at: 50 + i * 5, c: "#9FE7FF" } as Ln)),
        { t: "", at: 100 },
        { t: "❯ " + r.prompt, at: 108, dur: 44, c: "#fff" },
        { t: "● Bash(" + r.bash[0] + ")", at: 160, c: theme.amber },
        { t: "● " + r.final, at: 186, c: "#B6F7A8" },
      ]} label="REPLAY OF A REAL RUN (claude -p)" />
      <Pill text="/news-broadcast" x={40} y={905} at={112} size={42} />
      <Pill text="INSTALLED: .claude/skills/" x={430} y={905} at={20} bg="#fff" size={30} />
      <ClipBox src={clip("D03")} x={60} y={985} scale={0.44} from={30} rate={0.6} />
      </Drift>
      <Narrator start={S("howto").start} x={700} y={1330} w={340} />
    </AbsoluteFill>
  );
};

/* ---------- NINE DEMOS: input -> typed command -> rendered result, skill name always visible ---------- */
const Style: React.FC<{ sid: string; skill: string; comp: string; len: number }> = ({ sid, skill, comp, len }) => {
  const r = (REAL as any)[skill]; const f = useCurrentFrame(); const sc = S(sid);
  const rate2 = 150 / Math.max(60, len - 66);
  const lines: Ln[] = [
    { t: "❯ " + r.prompt, at: 6, dur: 44, c: "#fff" },
    { t: "● Bash(" + r.bash[0] + ")", at: 56, c: theme.amber },
    { t: "● " + r.final, at: 100, c: "#B6F7A8" },
  ];
  return (
    <AbsoluteFill>
      <Bg /><Caps id={sid} top={30} size={52} />
      <Term x={30} y={180} w={700} h={430} lines={lines} />
      <Narrator start={sc.start} x={750} y={205} w={300} />
      <Pill text={"/" + skill} x={30} y={625} at={4} size={skill.length > 20 ? 34 : 40} />
      <div style={{ position: "absolute", right: 40, top: 640, fontFamily: theme.mono, fontWeight: 800, fontSize: 30, color: f < 64 ? "#fff" : theme.lime }}>{f < 64 ? "INPUT" : "OUTPUT"}</div>
      <Sequence from={0} durationInFrames={60}><ClipBox src={clip(comp)} x={194} y={700} scale={0.62} from={0} rate={0.5} /></Sequence>
      <Sequence from={60}><ClipBox src={clip(comp)} x={194} y={700} scale={0.62} from={30} rate={rate2} /></Sequence>
    </AbsoluteFill>
  );
};

/* ---------- WHERE THE SKILLS LIVE ---------- */
const Skills: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const row = (t: string, at: number, indent: number, c = "#fff") => { const s = spring({ frame: f - at, fps, config: SPRING.settle }); return <div style={{ marginLeft: indent * 56, opacity: s, transform: `translateX(${(1 - s) * 40}px)`, fontFamily: theme.mono, fontWeight: 800, fontSize: 40, color: c, marginBottom: 18 }}>{t}</div>; };
  return (
    <AbsoluteFill>
      <Bg /><Caps id="skills" top={36} size={54} />
      <Term x={30} y={190} w={1020} h={300} lines={[
        { t: "$ pwd", at: 6, dur: 6, c: theme.lime }, { t: TERM.abs, at: 14 },
        { t: "$ " + TERM.cmd_tree, at: 24, dur: 22, c: theme.lime }, ...TERM.out_tree.map((t, i) => ({ t, at: 50 + i * 6, c: "#9FE7FF" } as Ln)),
      ]} label="REAL shell output" />
      <div style={{ position: "absolute", left: 70, top: 560 }}>
        {row("📁 .claude/skills/", 30, 0, theme.lime)}{row("📁 news-broadcast/", 48, 1)}{row("📄 SKILL.md   (name · description · steps)", 66, 2, "#9FE7FF")}
      </div>
      <Pill text="OUR SKILLS: CUSTOM · LOCAL" x={40} y={900} at={80} bg={theme.amber} size={36} />
      <Pill text="NOT A PUBLIC DOWNLOAD" x={40} y={985} at={92} bg={theme.amber} size={36} />
      <Pill text="BUILD YOUR OWN: code.claude.com/docs/en/skills" x={40} y={1090} at={110} size={30} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 1200, display: "flex", flexWrap: "wrap", gap: 12 }}>
        {TERM.out_ls.map((n, i) => { const sp = spring({ frame: f - 100 - i * 4, fps, config: SPRING.pop }); return <span key={n} style={{ transform: `scale(${sp})`, opacity: clamp(sp * 2), fontFamily: theme.mono, fontWeight: 800, fontSize: 24, color: theme.ink, background: i % 2 ? "#9FE7FF" : theme.lime, padding: "6px 14px", borderRadius: 10 }}>/{n}</span>; })}
      </div>
      <Narrator start={S("skills").start} x={680} y={1400} w={340} />
    </AbsoluteFill>
  );
};

/* ---------- CTA: nine results in quick succession, then the end card ---------- */
const Cta: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const sc = S("cta"); const sFlip = spring({ frame: f - 126, fps, config: SPRING.pop });
  return (
    <AbsoluteFill>
      <Bg />
      {f < 126 ? (
        <>
          {STYLES.map((s, i) => (
            <Sequence key={s.id} from={i * 14} durationInFrames={14}>
              <ClipBox src={clip(s.clip)} x={95} y={150} scale={0.8} from={96} />
              <Pill text={"/" + s.skill} x={95} y={1720 - 120} at={0} size={34} />
            </Sequence>
          ))}
          <Caps id="cta" top={30} size={50} />
        </>
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", gap: 26, transform: `scale(${0.9 + 0.1 * sFlip})`, opacity: clamp(sFlip * 2) }}>
          <div style={{ fontFamily: theme.body, fontWeight: 900, fontSize: 118, lineHeight: "118px", textAlign: "center", color: "#fff" }}>9 MOTION<br />GRAPHICS<br /><span style={{ background: theme.lime, color: theme.ink, padding: "0 18px" }}>SKILLS</span></div>
          <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 68, color: theme.lime }}>AGENTOON.AI</div>
          <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 38, color: "#fff" }}>Follow @agentoon.ai</div>
          <div style={{ fontFamily: theme.mono, fontSize: 30, color: "#9AA1AE" }}>Real AI Tools • Skills • Automation</div>
        </AbsoluteFill>
      )}
      <Narrator start={sc.start} x={f < 126 ? 760 : 380} y={f < 126 ? 1560 : 1420} w={f < 126 ? 280 : 340} />
    </AbsoluteFill>
  );
};

export const NinePreview: React.FC = () => (
  <AbsoluteFill style={{ background: "#0B0D12" }}>
    <Audio src={staticFile("audio/preview-mix.wav")} />
    <Sequence from={S("hook").start} durationInFrames={S("hook").len}><Hook /></Sequence>
    <Sequence from={S("explain").start} durationInFrames={S("explain").len}><Explain /></Sequence>
    <Sequence from={S("howto").start} durationInFrames={S("howto").len}><HowTo /></Sequence>
    {STYLES.map((s) => <Sequence key={s.id} from={S(s.id).start} durationInFrames={S(s.id).len}><Style sid={s.id} skill={s.skill} comp={s.clip} len={S(s.id).len} /></Sequence>)}
    <Sequence from={S("skills").start} durationInFrames={S("skills").len}><Skills /></Sequence>
    <Sequence from={S("cta").start} durationInFrames={S("cta").len}><Cta /></Sequence>
  </AbsoluteFill>
);
