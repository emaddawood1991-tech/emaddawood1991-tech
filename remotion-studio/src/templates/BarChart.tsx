import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { seconds } from "../lib/audio";

// ── Edit to customise ────────────────────────────────────────────────────────
const BARS = [
  { label: "Q1", value: 42, color: "#FF4757" },
  { label: "Q2", value: 68, color: "#FFA502" },
  { label: "Q3", value: 55, color: "#2ED573" },
  { label: "Q4", value: 91, color: "#1E90FF" },
  { label: "Q5", value: 73, color: "#A29BFE" },
];

const CHART_TITLE = "Quarterly Performance";
const Y_AXIS_LABEL = "Score (%)";
const MAX_VALUE = 100;
const BAR_DELAY_FRAMES = 6; // stagger between bars
// ─────────────────────────────────────────────────────────────────────────────

export const totalFrames = seconds(6);

const CHART_HEIGHT = 500;
const CHART_WIDTH = 1400;
const BAR_WIDTH = 160;
const BOTTOM_PADDING = 80;
const LEFT_PADDING = 100;

const AnimatedBar: React.FC<{
  bar: typeof BARS[0];
  index: number;
  maxValue: number;
}> = ({ bar, index, maxValue }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = index * BAR_DELAY_FRAMES;

  const heightProgress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 14, stiffness: 120, mass: 1 },
  });

  const labelOpacity = interpolate(
    frame,
    [delay + 10, delay + 25],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  const valueOpacity = interpolate(
    frame,
    [delay + 18, delay + 35],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  const barHeightPx = (bar.value / maxValue) * (CHART_HEIGHT - BOTTOM_PADDING);
  const currentHeight = heightProgress * barHeightPx;

  const displayValue = Math.round(heightProgress * bar.value);

  // Subtle float on already-risen bars
  const float = interpolate(
    Math.sin((frame - delay) * 0.06),
    [-1, 1],
    [-4, 4]
  );
  const yOffset = heightProgress >= 0.99 ? float : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        height: CHART_HEIGHT - BOTTOM_PADDING,
        transform: `translateY(${yOffset}px)`,
      }}
    >
      {/* Value label on top */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: bar.color,
          marginBottom: 10,
          opacity: valueOpacity,
          textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          fontFamily: "'Segoe UI', Arial, sans-serif",
        }}
      >
        {displayValue}%
      </div>

      {/* Bar */}
      <div
        style={{
          width: BAR_WIDTH,
          height: currentHeight,
          background: `linear-gradient(180deg, ${bar.color}, ${bar.color}99)`,
          borderRadius: "12px 12px 4px 4px",
          boxShadow: `0 0 24px ${bar.color}66, 0 4px 16px rgba(0,0,0,0.3)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Shimmer */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "40%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
            borderRadius: "12px 12px 0 0",
          }}
        />
      </div>

      {/* X-axis label */}
      <div
        style={{
          marginTop: 14,
          fontSize: 30,
          fontWeight: 700,
          color: "#ffffff",
          opacity: labelOpacity,
          fontFamily: "'Segoe UI', Arial, sans-serif",
        }}
      >
        {bar.label}
      </div>
    </div>
  );
};

export const BarChart: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 20], [-30, 0], { extrapolateRight: "clamp" });

  const axisOpacity = interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* Background grid lines */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -45%)",
          width: CHART_WIDTH,
          height: CHART_HEIGHT,
          opacity: axisOpacity * 0.15,
        }}
      >
        {[0, 25, 50, 75, 100].map((tick) => (
          <div
            key={tick}
            style={{
              position: "absolute",
              bottom: BOTTOM_PADDING + ((tick / MAX_VALUE) * (CHART_HEIGHT - BOTTOM_PADDING)),
              left: LEFT_PADDING,
              right: 0,
              height: 1,
              backgroundColor: "#ffffff",
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 56,
          fontWeight: 900,
          color: "#ffffff",
          textShadow: "0 4px 20px rgba(0,0,0,0.5)",
          marginBottom: 40,
          letterSpacing: 2,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        {CHART_TITLE}
      </div>

      {/* Chart area */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 40,
          position: "relative",
          paddingLeft: LEFT_PADDING,
        }}
      >
        {/* Y-axis label */}
        <div
          style={{
            position: "absolute",
            left: -20,
            top: "50%",
            transform: "translateX(-50%) rotate(-90deg)",
            fontSize: 22,
            color: "rgba(255,255,255,0.6)",
            whiteSpace: "nowrap",
            opacity: axisOpacity,
          }}
        >
          {Y_AXIS_LABEL}
        </div>

        {/* Y-axis ticks */}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: BOTTOM_PADDING,
            height: CHART_HEIGHT - BOTTOM_PADDING,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: axisOpacity,
          }}
        >
          {[100, 75, 50, 25, 0].map((tick) => (
            <div key={tick} style={{ fontSize: 20, color: "rgba(255,255,255,0.55)", textAlign: "right", width: 48 }}>
              {tick}
            </div>
          ))}
        </div>

        {/* Bars */}
        {BARS.map((bar, i) => (
          <AnimatedBar key={bar.label} bar={bar} index={i} maxValue={MAX_VALUE} />
        ))}
      </div>

      {/* Bottom divider line */}
      <div
        style={{
          width: CHART_WIDTH,
          height: 2,
          background: "rgba(255,255,255,0.2)",
          marginTop: 4,
          opacity: axisOpacity,
        }}
      />
    </AbsoluteFill>
  );
};
