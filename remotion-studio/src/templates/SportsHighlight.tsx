import { AbsoluteFill, Sequence, staticFile, interpolate, useCurrentFrame } from "remotion";
import { AnimatedClip } from "../components/AnimatedClip";
import { AnimatedText } from "../components/AnimatedText";
import { seconds } from "../lib/audio";

// ── Edit these to customise your sports highlight ───────────────────────────
const TEAM = "Al Hilal";
const SCORE = "3 – 1";
const STATS = [
  { label: "Shots on Target", value: "8" },
  { label: "Possession", value: "62%" },
  { label: "Pass Accuracy", value: "91%" },
];
const CLIPS = [
  { src: staticFile("videos/goal-1.mp4"), caption: "⚽ GOAL! Stunning strike!", durationInFrames: seconds(4) },
  { src: staticFile("videos/goal-2.mp4"), caption: "🔥 What a pass!", durationInFrames: seconds(4) },
  { src: staticFile("videos/goal-3.mp4"), caption: "💥 Header — 3-1!", durationInFrames: seconds(4) },
];
const ACCENT = "#FFD700";
// ─────────────────────────────────────────────────────────────────────────────

export const totalFrames =
  seconds(3) + CLIPS.reduce((a, c) => a + c.durationInFrames, 0) + seconds(4);

const FlashEffect: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame % 6, [0, 3, 6], [0, 0.25, 0], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${flash})` }} />;
};

export const SportsHighlight: React.FC = () => {
  let offset = 0;

  const introStart = 0;
  const introDur = seconds(3);
  offset += introDur;

  const clipOffsets = CLIPS.map((c) => {
    const start = offset;
    offset += c.durationInFrames;
    return { start, dur: c.durationInFrames };
  });

  const statsStart = offset;
  const statsDur = seconds(4);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0d0d" }}>

      {/* Intro scoreboard */}
      <Sequence from={introStart} durationInFrames={introDur}>
        <AbsoluteFill style={{ backgroundColor: "#111", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 28, color: ACCENT, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" }}>Match Highlights</div>
          <div style={{ fontSize: 72, fontWeight: 900, color: "#fff" }}>{SCORE}</div>
          <div style={{ fontSize: 32, color: "#aaa" }}>{TEAM}</div>
        </AbsoluteFill>
      </Sequence>

      {/* Action clips */}
      {CLIPS.map((clip, i) => (
        <Sequence key={i} from={clipOffsets[i].start} durationInFrames={clipOffsets[i].dur}>
          <AnimatedClip src={clip.src} type="video" durationInFrames={clipOffsets[i].dur} entranceEffect="zoomIn" exitEffect="wipeDown" />
          <FlashEffect />
          <AnimatedText text={clip.caption} position="top" effect="slideIn" fontSize={40} color={ACCENT} background="rgba(0,0,0,0.6)" />
        </Sequence>
      ))}

      {/* Stats card */}
      <Sequence from={statsStart} durationInFrames={statsDur}>
        <AbsoluteFill style={{ backgroundColor: "#111", justifyContent: "center", alignItems: "center", gap: 32, flexDirection: "column" }}>
          <div style={{ fontSize: 28, color: ACCENT, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Match Stats</div>
          <div style={{ display: "flex", gap: 60 }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: "#fff" }}>{s.value}</div>
                <div style={{ fontSize: 18, color: "#888", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Add music: <Audio src={staticFile("audio/music/sporty.mp3")} volume={0.5} /> */}
    </AbsoluteFill>
  );
};
