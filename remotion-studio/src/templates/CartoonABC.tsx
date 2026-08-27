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
const LETTERS = [
  { letter: "A", word: "Apple", emoji: "🍎", color: "#FF4757" },
  { letter: "B", word: "Ball",  emoji: "⚽", color: "#2ED573" },
  { letter: "C", word: "Cat",   emoji: "🐱", color: "#FFA502" },
  { letter: "D", word: "Dog",   emoji: "🐶", color: "#1E90FF" },
  { letter: "E", word: "Egg",   emoji: "🥚", color: "#FF6B81" },
  { letter: "F", word: "Fish",  emoji: "🐟", color: "#7BED9F" },
  { letter: "G", word: "Grapes",emoji: "🍇", color: "#A29BFE" },
  { letter: "H", word: "Hat",   emoji: "🎩", color: "#FD79A8" },
  { letter: "I", word: "Ice",   emoji: "🧊", color: "#74B9FF" },
  { letter: "J", word: "Juice", emoji: "🧃", color: "#FDCB6E" },
];
const FRAMES_PER_LETTER = seconds(3); // 3 seconds each
// ─────────────────────────────────────────────────────────────────────────────

export const totalFrames = seconds(2) + LETTERS.length * FRAMES_PER_LETTER + seconds(2);

const BounceIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);
  const scale = spring({ frame: f, fps, config: { damping: 10, stiffness: 200, mass: 0.8 } });
  return <div style={{ transform: `scale(${scale})` }}>{children}</div>;
};

const LetterCard: React.FC<{ item: typeof LETTERS[0] }> = ({ item }) => {
  const frame = useCurrentFrame();

  const bgOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const wordSlide = interpolate(frame, [15, 30], [60, 0], { extrapolateRight: "clamp" });
  const wordOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });

  // Wiggle the emoji
  const wiggle = Math.sin(frame * 0.3) * 8;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${item.color}cc, ${item.color}44)`,
        opacity: bgOpacity,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 0,
        fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive",
      }}
    >
      {/* Big letter */}
      <BounceIn delay={0}>
        <div style={{
          fontSize: 280,
          fontWeight: 900,
          color: "#fff",
          textShadow: `6px 6px 0px rgba(0,0,0,0.2)`,
          lineHeight: 1,
        }}>
          {item.letter}
        </div>
      </BounceIn>

      {/* Emoji */}
      <div style={{ fontSize: 100, transform: `rotate(${wiggle}deg)`, marginTop: -20 }}>
        {item.emoji}
      </div>

      {/* Word */}
      <div style={{
        fontSize: 72,
        fontWeight: 700,
        color: "#fff",
        textShadow: "3px 3px 0px rgba(0,0,0,0.2)",
        transform: `translateY(${wordSlide}px)`,
        opacity: wordOpacity,
        marginTop: 8,
      }}>
        {item.letter} is for {item.word}
      </div>

      {/* Star decorations */}
      {["⭐", "✨", "🌟"].map((star, i) => (
        <div key={i} style={{
          position: "absolute",
          fontSize: 40,
          top: `${15 + i * 25}%`,
          left: `${5 + i * 4}%`,
          transform: `rotate(${Math.sin((frame + i * 30) * 0.1) * 20}deg)`,
          opacity: 0.7,
        }}>{star}</div>
      ))}
    </AbsoluteFill>
  );
};

export const CartoonABC: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a0533" }}>

      {/* Intro */}
      <Sequence from={0} durationInFrames={seconds(2)}>
        <AbsoluteFill style={{
          background: "linear-gradient(135deg, #6c47ff, #ff6b9d)",
          justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 16,
          fontFamily: "'Comic Sans MS', cursive",
        }}>
          <div style={{ fontSize: 80, fontWeight: 900, color: "#fff", textShadow: "4px 4px 0 rgba(0,0,0,0.2)" }}>🅰️ Learn ABC! 🅱️</div>
          <div style={{ fontSize: 36, color: "rgba(255,255,255,0.9)" }}>Letters, words, and fun!</div>
          <div style={{ fontSize: 60 }}>🌟⭐✨</div>
        </AbsoluteFill>
      </Sequence>

      {/* Letter scenes */}
      {LETTERS.map((item, i) => (
        <Sequence key={i} from={seconds(2) + i * FRAMES_PER_LETTER} durationInFrames={FRAMES_PER_LETTER}>
          <LetterCard item={item} />
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence from={seconds(2) + LETTERS.length * FRAMES_PER_LETTER} durationInFrames={seconds(2)}>
        <AbsoluteFill style={{
          background: "linear-gradient(135deg, #f9ca24, #f0932b)",
          justifyContent: "center", alignItems: "center", flexDirection: "column",
          fontFamily: "'Comic Sans MS', cursive",
        }}>
          <div style={{ fontSize: 80, fontWeight: 900, color: "#fff", textAlign: "center" }}>Great job! 🎉</div>
          <div style={{ fontSize: 50 }}>🌈⭐🎊🏆🎈</div>
        </AbsoluteFill>
      </Sequence>

    </AbsoluteFill>
  );
};
