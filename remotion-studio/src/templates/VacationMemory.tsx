import { AbsoluteFill, Sequence, staticFile, interpolate, useCurrentFrame } from "remotion";
import { AnimatedClip } from "../components/AnimatedClip";
import { AnimatedText } from "../components/AnimatedText";
import { seconds } from "../lib/audio";

// ── Edit these to customise your vacation video ──────────────────────────────
const TITLE = "Dubai 2025 ✈️";
const MEMORIES = [
  { src: staticFile("images/vacation-1.jpg"), caption: "Day 1 — Burj Khalifa", durationInFrames: seconds(5) },
  { src: staticFile("images/vacation-2.jpg"), caption: "Desert Safari at Sunset", durationInFrames: seconds(5) },
  { src: staticFile("images/vacation-3.jpg"), caption: "Marina Walk", durationInFrames: seconds(5) },
  { src: staticFile("images/vacation-4.jpg"), caption: "Dubai Frame Views", durationInFrames: seconds(5) },
  { src: staticFile("images/vacation-5.jpg"), caption: "Last Night — Unforgettable ❤️", durationInFrames: seconds(5) },
];
// ─────────────────────────────────────────────────────────────────────────────

export const totalFrames =
  seconds(3) + MEMORIES.reduce((a, m) => a + m.durationInFrames, 0) + seconds(3);

const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(Math.sin(frame * 7.3), [-1, 1], [0, 0.04]);
  return <AbsoluteFill style={{ backgroundColor: `rgba(255,240,200,${opacity})` }} />;
};

export const VacationMemory: React.FC = () => {
  let offset = 0;
  const introDur = seconds(3);
  offset += introDur;

  const memOffsets = MEMORIES.map((m) => {
    const start = offset;
    offset += m.durationInFrames;
    return { start, dur: m.durationInFrames };
  });

  const outroDur = seconds(3);
  const outroStart = offset;

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1008" }}>

      {/* Warm intro */}
      <Sequence from={0} durationInFrames={introDur}>
        <AbsoluteFill style={{
          background: "linear-gradient(135deg, #f5a623, #e07b00)",
          justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 12,
        }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: "#fff", textAlign: "center" }}>{TITLE}</div>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.8)" }}>A collection of memories</div>
        </AbsoluteFill>
      </Sequence>

      {/* Photo memories */}
      {MEMORIES.map((mem, i) => (
        <Sequence key={i} from={memOffsets[i].start} durationInFrames={memOffsets[i].dur}>
          <AnimatedClip src={mem.src} type="image" durationInFrames={memOffsets[i].dur} entranceEffect="fadeIn" exitEffect="crossfade" />
          <FilmGrain />
          {/* Warm vignette */}
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)" }} />
          <AnimatedText text={mem.caption} position="bottom" effect="fadeIn" delay={15} fontSize={36} color="#fff" background="rgba(0,0,0,0.45)" />
        </Sequence>
      ))}

      {/* Warm outro */}
      <Sequence from={outroStart} durationInFrames={outroDur}>
        <AbsoluteFill style={{
          background: "linear-gradient(135deg, #e07b00, #f5a623)",
          justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 8,
        }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#fff" }}>Until next time 🌍</div>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.8)" }}>Made with love</div>
        </AbsoluteFill>
      </Sequence>

      {/* Add music: <Audio src={staticFile("audio/music/calm.mp3")} volume={0.4} /> */}
    </AbsoluteFill>
  );
};
