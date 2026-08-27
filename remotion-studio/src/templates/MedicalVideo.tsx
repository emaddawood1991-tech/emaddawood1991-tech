import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { AnimatedClip } from "../components/AnimatedClip";
import { AnimatedText } from "../components/AnimatedText";
import { seconds } from "../lib/audio";

// ── Edit these to customise your medical video ──────────────────────────────
const TITLE = "Advanced Cardiac Care";
const SUBTITLE = "Precision treatment. Expert care. Better outcomes.";
const SCENES = [
  { src: staticFile("images/medical-1.jpg"), caption: "World-class medical facilities", durationInFrames: seconds(4) },
  { src: staticFile("images/medical-2.jpg"), caption: "Expert specialist teams", durationInFrames: seconds(4) },
  { src: staticFile("images/medical-3.jpg"), caption: "Cutting-edge technology", durationInFrames: seconds(4) },
  { src: staticFile("images/medical-4.jpg"), caption: "Compassionate patient care", durationInFrames: seconds(4) },
];
const ACCENT = "#1a73e8";
// ─────────────────────────────────────────────────────────────────────────────

export const totalFrames = seconds(3) + SCENES.reduce((a, s) => a + s.durationInFrames, 0) + seconds(3);

export const MedicalVideo: React.FC = () => {
  let offset = 0;

  // Intro
  const introFrames = seconds(3);
  const intro = { start: 0, dur: introFrames };
  offset += introFrames;

  // Scenes
  const sceneOffsets = SCENES.map((s) => {
    const start = offset;
    offset += s.durationInFrames;
    return { start, dur: s.durationInFrames };
  });

  // Outro
  const outroStart = offset;
  const outroDur = seconds(3);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a1628", fontFamily: "system-ui, sans-serif" }}>

      {/* Intro title card */}
      <Sequence from={intro.start} durationInFrames={intro.dur}>
        <AbsoluteFill style={{ backgroundColor: "#0a1628", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 16 }}>
          <div style={{ width: 60, height: 4, background: ACCENT, borderRadius: 2 }} />
          <div style={{ fontSize: 56, fontWeight: 800, color: "#fff", textAlign: "center", padding: "0 60px" }}>{TITLE}</div>
          <div style={{ fontSize: 24, color: "#a0b4d0", textAlign: "center", maxWidth: 700 }}>{SUBTITLE}</div>
        </AbsoluteFill>
      </Sequence>

      {/* Scene clips */}
      {SCENES.map((scene, i) => (
        <Sequence key={i} from={sceneOffsets[i].start} durationInFrames={sceneOffsets[i].dur}>
          <AnimatedClip src={scene.src} type="image" durationInFrames={sceneOffsets[i].dur} entranceEffect="fadeIn" exitEffect="crossfade" />
          {/* Blue accent bar */}
          <AbsoluteFill style={{ bottom: 0, top: "auto", height: 6, background: ACCENT }} />
          <AnimatedText text={scene.caption} position="bottom" effect="slideIn" fontSize={36} />
        </Sequence>
      ))}

      {/* Outro CTA */}
      <Sequence from={outroStart} durationInFrames={outroDur}>
        <AbsoluteFill style={{ backgroundColor: ACCENT, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: "#fff" }}>Book a Consultation</div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.85)" }}>Your health. Our priority.</div>
        </AbsoluteFill>
      </Sequence>

      {/* Background music — add your file to public/audio/music/calm.mp3 */}
      {/* <Audio src={staticFile("audio/music/calm.mp3")} volume={0.3} /> */}
    </AbsoluteFill>
  );
};
