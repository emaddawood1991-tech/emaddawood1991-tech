import { AbsoluteFill, Sequence, staticFile, interpolate, useCurrentFrame } from "remotion";
import { AnimatedClip } from "../components/AnimatedClip";
import { AnimatedText } from "../components/AnimatedText";
import { seconds } from "../lib/audio";

// ── Edit these to customise your reel ───────────────────────────────────────
const HASHTAGS = "#fyp #viral #trending";
const CLIPS = [
  { src: staticFile("videos/reel-1.mp4"), caption: "✨ This is everything", durationInFrames: seconds(3) },
  { src: staticFile("videos/reel-2.mp4"), caption: "🔥 You need to see this", durationInFrames: seconds(3) },
  { src: staticFile("videos/reel-3.mp4"), caption: "💥 Don't miss out", durationInFrames: seconds(3) },
  { src: staticFile("videos/reel-4.mp4"), caption: "👇 Follow for more", durationInFrames: seconds(3) },
];
// ─────────────────────────────────────────────────────────────────────────────

export const totalFrames = CLIPS.reduce((a, c) => a + c.durationInFrames, 0) + seconds(2);

const GradientOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 10), [-1, 1], [0.6, 0.8]);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,${pulse}) 100%)`,
      }}
    />
  );
};

export const InstagramReel: React.FC = () => {
  let offset = 0;
  const clipOffsets = CLIPS.map((c) => {
    const start = offset;
    offset += c.durationInFrames;
    return { start, dur: c.durationInFrames };
  });
  const outroStart = offset;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {CLIPS.map((clip, i) => (
        <Sequence key={i} from={clipOffsets[i].start} durationInFrames={clipOffsets[i].dur}>
          <AnimatedClip src={clip.src} type="video" durationInFrames={clipOffsets[i].dur} entranceEffect="zoomIn" exitEffect="slideLeft" />
          <GradientOverlay />
          <AnimatedText text={clip.caption} position="bottom" effect="bounce" fontSize={38} color="#fff" background="transparent" />
        </Sequence>
      ))}

      {/* Outro — hashtags */}
      <Sequence from={outroStart} durationInFrames={seconds(2)}>
        <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 28, color: "#fff", textAlign: "center", letterSpacing: 1 }}>{HASHTAGS}</div>
        </AbsoluteFill>
      </Sequence>

      {/* Add music: <Audio src={staticFile("audio/music/upbeat.mp3")} volume={0.6} /> */}
    </AbsoluteFill>
  );
};
