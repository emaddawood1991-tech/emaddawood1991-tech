import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { seconds } from "../lib/audio";

// ── Edit to customise ────────────────────────────────────────────────────────
const COLORS = [
  { name: "RED",    hex: "#FF4757", emoji: "🍎🌹❤️",  things: "apple, rose, heart" },
  { name: "ORANGE", hex: "#FF6348", emoji: "🍊🎃🦊",  things: "orange, pumpkin, fox" },
  { name: "YELLOW", hex: "#FFDD59", emoji: "🌟🍋🌻",  things: "star, lemon, sunflower" },
  { name: "GREEN",  hex: "#2ED573", emoji: "🌿🐸🍀",  things: "leaf, frog, clover" },
  { name: "BLUE",   hex: "#1E90FF", emoji: "🌊🐬💎",  things: "ocean, dolphin, gem" },
  { name: "PURPLE", hex: "#A29BFE", emoji: "🍇🦄🔮",  things: "grapes, unicorn, crystal" },
  { name: "PINK",   hex: "#FF6B9D", emoji: "🌸🦩🍭",  things: "blossom, flamingo, candy" },
];
const FRAMES_PER_COLOR = seconds(3);
// ─────────────────────────────────────────────────────────────────────────────

export const totalFrames = seconds(2) + COLORS.length * FRAMES_PER_COLOR + seconds(2);

const ColorScene: React.FC<{ item: typeof COLORS[0] }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const circleScale = spring({ frame, fps, config: { damping: 10, stiffness: 150 } });
  const textOpacity = interpolate(frame, [18, 30], [0, 1], { extrapolateRight: "clamp" });
  const emojiSlide = interpolate(frame, [28, 44], [80, 0], { extrapolateRight: "clamp" });
  const emojiOpacity = interpolate(frame, [28, 44], [0, 1], { extrapolateRight: "clamp" });

  // Pulsing glow on the color circle
  const glow = interpolate(Math.sin(frame * 0.15), [-1, 1], [20, 40]);

  return (
    <AbsoluteFill style={{
      backgroundColor: "#1a0533",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      gap: 24,
      fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive",
    }}>

      {/* Big color circle */}
      <div style={{
        width: 320,
        height: 320,
        borderRadius: "50%",
        backgroundColor: item.hex,
        transform: `scale(${circleScale})`,
        boxShadow: `0 0 ${glow}px ${glow}px ${item.hex}88`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 80,
      }}>
        {item.emoji.split("")[0]}
      </div>

      {/* Color name */}
      <div style={{
        fontSize: 96,
        fontWeight: 900,
        color: item.hex,
        textShadow: `3px 3px 0 rgba(0,0,0,0.4)`,
        opacity: textOpacity,
        letterSpacing: 8,
      }}>
        {item.name}
      </div>

      {/* Examples */}
      <div style={{
        fontSize: 36,
        color: "#fff",
        opacity: emojiOpacity,
        transform: `translateY(${emojiSlide}px)`,
        textAlign: "center",
      }}>
        <span style={{ fontSize: 56 }}>{item.emoji}</span>
        <br />
        {item.things}
      </div>

      {/* Background bubbles */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 60 + i * 20,
          height: 60 + i * 20,
          borderRadius: "50%",
          backgroundColor: item.hex,
          opacity: 0.08 + i * 0.02,
          top: `${10 + i * 14}%`,
          right: `${4 + i * 6}%`,
          transform: `scale(${interpolate(Math.sin((frame + i * 20) * 0.08), [-1, 1], [0.9, 1.1])})`,
        }} />
      ))}

    </AbsoluteFill>
  );
};

export const CartoonColors: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a0533" }}>

      {/* Intro */}
      <Sequence from={0} durationInFrames={seconds(2)}>
        <AbsoluteFill style={{
          background: "linear-gradient(135deg, #FF4757, #FFA502, #2ED573, #1E90FF, #A29BFE)",
          justifyContent: "center", alignItems: "center", flexDirection: "column",
          fontFamily: "'Comic Sans MS', cursive",
        }}>
          <div style={{ fontSize: 80, fontWeight: 900, color: "#fff", textShadow: "4px 4px 0 rgba(0,0,0,0.3)" }}>🌈 Learn Colors! 🎨</div>
          <div style={{ fontSize: 44, color: "rgba(255,255,255,0.95)", marginTop: 8 }}>Red, Orange, Yellow and more!</div>
        </AbsoluteFill>
      </Sequence>

      {/* Color scenes */}
      {COLORS.map((item, i) => (
        <Sequence key={i} from={seconds(2) + i * FRAMES_PER_COLOR} durationInFrames={FRAMES_PER_COLOR}>
          <ColorScene item={item} />
        </Sequence>
      ))}

      {/* Rainbow outro */}
      <Sequence from={seconds(2) + COLORS.length * FRAMES_PER_COLOR} durationInFrames={seconds(2)}>
        <AbsoluteFill style={{
          background: "linear-gradient(135deg, #FF4757, #FFA502, #FFDD59, #2ED573, #1E90FF, #A29BFE, #FF6B9D)",
          justifyContent: "center", alignItems: "center", flexDirection: "column",
          fontFamily: "'Comic Sans MS', cursive",
        }}>
          <div style={{ fontSize: 80, fontWeight: 900, color: "#fff", textShadow: "4px 4px 0 rgba(0,0,0,0.25)" }}>You know colors! 🌈</div>
          <div style={{ fontSize: 60, marginTop: 12 }}>🎉🏆⭐🎊✨</div>
        </AbsoluteFill>
      </Sequence>

    </AbsoluteFill>
  );
};
