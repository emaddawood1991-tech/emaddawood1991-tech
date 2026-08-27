import { AbsoluteFill, Sequence, staticFile, interpolate, useCurrentFrame } from "remotion";
import { AnimatedClip } from "../components/AnimatedClip";
import { seconds } from "../lib/audio";

// ── Edit these to customise your promotional video ───────────────────────────
const PRODUCT_NAME = "Your Product";
const TAGLINE = "The smartest way to get things done.";
const FEATURES = [
  "Save 10+ hours every week",
  "AI-powered automation",
  "Trusted by 50,000+ teams",
];
const CTA = "Try it free — no credit card needed";
const BRAND_COLOR = "#6c47ff";
const CLIPS = [
  { src: staticFile("images/promo-hero.jpg"), durationInFrames: seconds(4) },
  { src: staticFile("images/promo-feature.jpg"), durationInFrames: seconds(3) },
  { src: staticFile("images/promo-social.jpg"), durationInFrames: seconds(3) },
];
// ─────────────────────────────────────────────────────────────────────────────

export const totalFrames =
  seconds(3) +
  CLIPS.reduce((a, c) => a + c.durationInFrames, 0) +
  seconds(1) * FEATURES.length +
  seconds(4);

const PulsingBadge: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const scale = interpolate(f, [0, 8, 14], [0.5, 1.08, 1], { extrapolateRight: "clamp" });
  const opacity = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ opacity, transform: `scale(${scale})`, background: BRAND_COLOR, color: "#fff", padding: "14px 36px", borderRadius: 50, fontSize: 26, fontWeight: 700, margin: "8px 0" }}>
      ✓ {text}
    </div>
  );
};

export const PromotionalVideo: React.FC = () => {
  let offset = 0;
  const introDur = seconds(3);
  offset += introDur;

  const clipOffsets = CLIPS.map((c) => {
    const start = offset;
    offset += c.durationInFrames;
    return { start, dur: c.durationInFrames };
  });

  const featuresStart = offset;
  const featuresDur = seconds(1) * FEATURES.length;
  offset += featuresDur;

  const ctaStart = offset;
  const ctaDur = seconds(4);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0e0014" }}>

      {/* Hero intro */}
      <Sequence from={0} durationInFrames={introDur}>
        <AbsoluteFill style={{ background: `linear-gradient(135deg, #0e0014, ${BRAND_COLOR})`, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 68, fontWeight: 900, color: "#fff", textAlign: "center" }}>{PRODUCT_NAME}</div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.75)", textAlign: "center", maxWidth: 700 }}>{TAGLINE}</div>
        </AbsoluteFill>
      </Sequence>

      {/* Product clips */}
      {CLIPS.map((clip, i) => (
        <Sequence key={i} from={clipOffsets[i].start} durationInFrames={clipOffsets[i].dur}>
          <AnimatedClip src={clip.src} type="image" durationInFrames={clipOffsets[i].dur} entranceEffect="slideIn" exitEffect="zoomOut" />
          <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 60%, rgba(14,0,20,0.85) 100%)" }} />
        </Sequence>
      ))}

      {/* Feature bullets */}
      <Sequence from={featuresStart} durationInFrames={featuresDur}>
        <AbsoluteFill style={{ background: "#0e0014", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 4 }}>
          {FEATURES.map((f, i) => (
            <PulsingBadge key={i} text={f} delay={i * seconds(1)} />
          ))}
        </AbsoluteFill>
      </Sequence>

      {/* CTA */}
      <Sequence from={ctaStart} durationInFrames={ctaDur}>
        <AbsoluteFill style={{ background: BRAND_COLOR, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: "#fff", textAlign: "center" }}>Start Today</div>
          <div style={{ fontSize: 26, color: "rgba(255,255,255,0.85)", textAlign: "center", maxWidth: 700 }}>{CTA}</div>
        </AbsoluteFill>
      </Sequence>

      {/* Add music: <Audio src={staticFile("audio/music/promotional.mp3")} volume={0.4} /> */}
    </AbsoluteFill>
  );
};
