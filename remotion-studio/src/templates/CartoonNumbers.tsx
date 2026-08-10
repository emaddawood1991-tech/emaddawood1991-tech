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
const NUMBERS = [
  { num: 1,  word: "ONE",   emoji: "🍎", color: "#FF4757", objects: ["🍎"] },
  { num: 2,  word: "TWO",   emoji: "🐝", color: "#FFA502", objects: ["🐝","🐝"] },
  { num: 3,  word: "THREE", emoji: "⭐", color: "#2ED573", objects: ["⭐","⭐","⭐"] },
  { num: 4,  word: "FOUR",  emoji: "🌸", color: "#1E90FF", objects: ["🌸","🌸","🌸","🌸"] },
  { num: 5,  word: "FIVE",  emoji: "🦋", color: "#A29BFE", objects: ["🦋","🦋","🦋","🦋","🦋"] },
  { num: 6,  word: "SIX",   emoji: "🎈", color: "#FF6B81", objects: ["🎈","🎈","🎈","🎈","🎈","🎈"] },
  { num: 7,  word: "SEVEN", emoji: "🌟", color: "#FDCB6E", objects: ["🌟","🌟","🌟","🌟","🌟","🌟","🌟"] },
  { num: 8,  word: "EIGHT", emoji: "🍓", color: "#E17055", objects: ["🍓","🍓","🍓","🍓","🍓","🍓","🍓","🍓"] },
  { num: 9,  word: "NINE",  emoji: "🐠", color: "#00CEC9", objects: ["🐠","🐠","🐠","🐠","🐠","🐠","🐠","🐠","🐠"] },
  { num: 10, word: "TEN",   emoji: "🎉", color: "#6C5CE7", objects: ["🎉","🎉","🎉","🎉","🎉","🎉","🎉","🎉","🎉","🎉"] },
];
const FRAMES_PER_NUMBER = seconds(3);
// ─────────────────────────────────────────────────────────────────────────────

export const totalFrames = seconds(2) + NUMBERS.length * FRAMES_PER_NUMBER + seconds(2);

const NumberScene: React.FC<{ item: typeof NUMBERS[0] }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 8, stiffness: 180 } });
  const wordOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const objectsOpacity = interpolate(frame, [35, 50], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(160deg, ${item.color}ee, ${item.color}88)`,
      justifyContent: "flex-start",
      alignItems: "center",
      flexDirection: "column",
      paddingTop: 60,
      fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive",
    }}>

      {/* Big number */}
      <div style={{ transform: `scale(${scale})`, fontSize: 220, fontWeight: 900, color: "#fff", textShadow: "6px 6px 0 rgba(0,0,0,0.25)", lineHeight: 1 }}>
        {item.num}
      </div>

      {/* Word */}
      <div style={{ fontSize: 60, fontWeight: 800, color: "#fff", opacity: wordOpacity, textShadow: "3px 3px 0 rgba(0,0,0,0.2)", marginBottom: 24 }}>
        {item.word}
      </div>

      {/* Objects grid */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 12,
        maxWidth: 700,
        opacity: objectsOpacity,
      }}>
        {item.objects.map((obj, i) => {
          const objScale = spring({ frame: Math.max(0, frame - 35 - i * 4), fps, config: { damping: 10, stiffness: 200 } });
          return (
            <div key={i} style={{ fontSize: item.num > 7 ? 48 : 64, transform: `scale(${objScale})` }}>
              {obj}
            </div>
          );
        })}
      </div>

    </AbsoluteFill>
  );
};

export const CartoonNumbers: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a2e" }}>

      {/* Intro */}
      <Sequence from={0} durationInFrames={seconds(2)}>
        <AbsoluteFill style={{
          background: "linear-gradient(135deg, #6c47ff, #2ed573)",
          justifyContent: "center", alignItems: "center", flexDirection: "column",
          fontFamily: "'Comic Sans MS', cursive",
        }}>
          <div style={{ fontSize: 80, fontWeight: 900, color: "#fff", textShadow: "4px 4px 0 rgba(0,0,0,0.2)" }}>🔢 Count 1 to 10! 🔢</div>
          <div style={{ fontSize: 50, marginTop: 8 }}>1️⃣2️⃣3️⃣4️⃣5️⃣</div>
        </AbsoluteFill>
      </Sequence>

      {/* Number scenes */}
      {NUMBERS.map((item, i) => (
        <Sequence key={i} from={seconds(2) + i * FRAMES_PER_NUMBER} durationInFrames={FRAMES_PER_NUMBER}>
          <NumberScene item={item} />
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence from={seconds(2) + NUMBERS.length * FRAMES_PER_NUMBER} durationInFrames={seconds(2)}>
        <AbsoluteFill style={{
          background: "linear-gradient(135deg, #f9ca24, #6c47ff)",
          justifyContent: "center", alignItems: "center", flexDirection: "column",
          fontFamily: "'Comic Sans MS', cursive",
        }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: "#fff" }}>You can count! 🎉</div>
          <div style={{ fontSize: 60, marginTop: 16 }}>1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟</div>
        </AbsoluteFill>
      </Sequence>

    </AbsoluteFill>
  );
};
