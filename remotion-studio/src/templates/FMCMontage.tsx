import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

// ── Timing helpers ────────────────────────────────────────────────────────────
const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

// Measured durations
const CLIP1_DUR = 300; // 10.006s
const CLIP2_DUR = 300; // 10.006s
const CLIP3_DUR = 270; //  9.003s
const AUDIO_DUR = s(73.2); // 2196 frames — drives the entire timeline

export const totalFrames = AUDIO_DUR;

// ── FMC Brand palette ─────────────────────────────────────────────────────────
const B = {
  navy:   "#0A2558",
  blue:   "#1B3A6B",
  teal:   "#0099B4",
  gold:   "#C9A227",
  white:  "#FFFFFF",
  light:  "#EAF4F8",
};

// ── Types ─────────────────────────────────────────────────────────────────────
type KenBurns = "still" | "zoomIn" | "zoomOut" | "panLeft" | "panRight" | "panUp";

// ── Ken Burns video clip ──────────────────────────────────────────────────────
const Clip: React.FC<{
  src: string;
  totalFrames: number;
  motion?: KenBurns;
  fadeIn?: number;
}> = ({ src, totalFrames, motion = "still", fadeIn = 15 }) => {
  const frame = useCurrentFrame();
  const t = totalFrames > 0 ? frame / totalFrames : 0;

  const opacity = interpolate(frame, [0, fadeIn], [0, 1], {
    extrapolateRight: "clamp",
  });

  let scale = 1.05;
  let tx = 0;
  let ty = 0;

  if (motion === "zoomIn")    scale = interpolate(t, [0, 1], [1.04, 1.14]);
  if (motion === "zoomOut")   scale = interpolate(t, [0, 1], [1.14, 1.04]);
  if (motion === "panLeft")  { scale = 1.10; tx = interpolate(t, [0, 1],  [2, -2]); }
  if (motion === "panRight") { scale = 1.10; tx = interpolate(t, [0, 1], [-2,  2]); }
  if (motion === "panUp")    { scale = 1.10; ty = interpolate(t, [0, 1],  [2, -2]); }

  return (
    <AbsoluteFill style={{ opacity }}>
      <OffthreadVideo
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateX(${tx}%) translateY(${ty}%)`,
        }}
        muted
      />
    </AbsoluteFill>
  );
};

// ── Gradient vignette ─────────────────────────────────────────────────────────
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at center, transparent 45%, rgba(10,37,88,0.5) 100%)",
      pointerEvents: "none",
    }}
  />
);

// ── Bottom scrim — ensures lower-third readability ────────────────────────────
const BottomScrim: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(to top, ${B.navy}bb 0%, transparent 35%)`,
      pointerEvents: "none",
    }}
  />
);

// ── Animated lower third ──────────────────────────────────────────────────────
const LowerThird: React.FC<{
  line1: string;
  line2?: string;
  showFor?: number;
}> = ({ line1, line2, showFor = 90 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slide = spring({ frame, fps, config: { damping: 20, stiffness: 200, mass: 0.8 } });
  const opacity = interpolate(
    frame,
    [0, 8, showFor - 12, showFor],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 72,
        left: 0,
        opacity,
        transform: `translateX(${(1 - slide) * -160}px)`,
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {/* Teal accent bar */}
      <div style={{ width: 5, backgroundColor: B.teal, flexShrink: 0 }} />
      {/* Text block */}
      <div
        style={{
          backgroundColor: `${B.navy}e8`,
          paddingLeft: 18,
          paddingRight: 28,
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        <div
          style={{
            color: B.white,
            fontSize: 26,
            fontWeight: 700,
            fontFamily: "'Segoe UI', Arial, sans-serif",
            letterSpacing: 0.5,
          }}
        >
          {line1}
        </div>
        {line2 && (
          <div
            style={{
              color: B.teal,
              fontSize: 18,
              fontWeight: 400,
              fontFamily: "'Segoe UI', Arial, sans-serif",
              marginTop: 3,
              letterSpacing: 0.3,
            }}
          >
            {line2}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Floating keyword chip ─────────────────────────────────────────────────────
const Chip: React.FC<{
  text: string;
  right?: number;
  top?: number;
  delay?: number;
  showFor?: number;
}> = ({ text, right = 48, top = 48, delay = 0, showFor = 70 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);

  const sc = spring({ frame: f, fps, config: { damping: 14, stiffness: 200 } });
  const op = interpolate(f, [0, 8, showFor, showFor + 10], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        right,
        top,
        transform: `scale(${sc})`,
        opacity: op,
        backgroundColor: `${B.teal}cc`,
        border: `1px solid ${B.teal}88`,
        borderRadius: 8,
        padding: "7px 16px",
        color: B.white,
        fontSize: 17,
        fontWeight: 600,
        fontFamily: "'Segoe UI', Arial, sans-serif",
        letterSpacing: 0.8,
        backdropFilter: "blur(4px)",
      }}
    >
      {text}
    </div>
  );
};

// ── Gold divider line ─────────────────────────────────────────────────────────
const GoldLine: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const width = interpolate(f, [0, 40], [0, 180], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        width,
        height: 3,
        backgroundColor: B.gold,
        borderRadius: 2,
      }}
    />
  );
};

// ── Progress bar ──────────────────────────────────────────────────────────────
const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pct = frame / durationInFrames;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: "rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          width: `${pct * 100}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${B.teal}, ${B.gold})`,
        }}
      />
    </div>
  );
};

// ── FMC intro card ────────────────────────────────────────────────────────────
const IntroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSc = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const lineOp = interpolate(frame, [18, 35], [0, 1], { extrapolateRight: "clamp" });
  const tagOp  = interpolate(frame, [32, 52], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [s(1.8), s(2.2)], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(150deg, ${B.navy} 0%, #112244 55%, #0D3354 100%)`,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        opacity: fadeOut,
      }}
    >
      {/* Top accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, ${B.teal}, ${B.gold})` }} />

      <div style={{ transform: `scale(${logoSc})`, textAlign: "center" }}>
        <div style={{ fontSize: 88, fontWeight: 900, color: B.white, fontFamily: "sans-serif", letterSpacing: 14, textShadow: `0 4px 24px ${B.teal}55` }}>
          FMC
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 10, opacity: lineOp }}>
          <GoldLine />
        </div>

        <div style={{ fontSize: 22, color: B.light, fontFamily: "sans-serif", fontWeight: 300, letterSpacing: 5, marginTop: 14, opacity: tagOp }}>
          AL FAISAL MEDICAL CENTER
        </div>
        <div style={{ fontSize: 17, color: B.teal, fontFamily: "sans-serif", fontWeight: 400, letterSpacing: 3, marginTop: 6, opacity: tagOp }}>
          AL AIN  •  UAE
        </div>
      </div>

      {/* Bottom accent */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${B.gold}, ${B.teal})` }} />
    </AbsoluteFill>
  );
};

// ── FMC outro card ────────────────────────────────────────────────────────────
const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sc  = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const op1 = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });
  const op2 = interpolate(frame, [28, 48], [0, 1], { extrapolateRight: "clamp" });
  const op3 = interpolate(frame, [44, 62], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(150deg, ${B.navy} 0%, #112244 60%, #0D3354 100%)`,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 0,
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, ${B.teal}, ${B.gold})` }} />

      <div style={{ transform: `scale(${sc})`, textAlign: "center" }}>
        <div style={{ fontSize: 80, fontWeight: 900, color: B.white, fontFamily: "sans-serif", letterSpacing: 12, textShadow: `0 4px 24px ${B.teal}55` }}>
          FMC
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 8, opacity: op1 }}>
          <GoldLine />
        </div>
        <div style={{ fontSize: 20, color: B.light, fontFamily: "sans-serif", fontWeight: 300, letterSpacing: 4, marginTop: 12, opacity: op1 }}>
          AL FAISAL MEDICAL CENTER
        </div>
      </div>

      <div style={{ marginTop: 36, textAlign: "center", opacity: op2 }}>
        <div style={{ fontSize: 28, color: B.gold, fontFamily: "sans-serif", fontWeight: 700, letterSpacing: 2 }}>
          احجز موعدك الآن
        </div>
        <div style={{ fontSize: 20, color: B.light, fontFamily: "sans-serif", fontWeight: 400, marginTop: 6, letterSpacing: 1 }}>
          Book Your Appointment Today
        </div>
      </div>

      <div style={{ marginTop: 32, textAlign: "center", opacity: op3 }}>
        <div style={{ fontSize: 16, color: B.teal, fontFamily: "sans-serif", letterSpacing: 2 }}>
          Al Ain  •  UAE  •  مركز الفيصل الطبي
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${B.gold}, ${B.teal})` }} />
    </AbsoluteFill>
  );
};

// ── Section title overlay ─────────────────────────────────────────────────────
const SectionTitle: React.FC<{ text: string; sub?: string }> = ({ text, sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sc = spring({ frame, fps, config: { damping: 16, stiffness: 180 } });
  const op = interpolate(frame, [0, 10, 55, 70], [0, 1, 1, 0], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        top: 52,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: op,
        transform: `scale(${sc})`,
      }}
    >
      <div style={{ fontSize: 22, color: B.teal, fontFamily: "sans-serif", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" }}>
        {text}
      </div>
      {sub && (
        <div style={{ fontSize: 14, color: B.light, fontFamily: "sans-serif", fontWeight: 300, marginTop: 4, letterSpacing: 1.5, opacity: 0.85 }}>
          {sub}
        </div>
      )}
      <div style={{ width: 40, height: 2, backgroundColor: B.gold, marginTop: 8, borderRadius: 1 }} />
    </div>
  );
};

// ── Main composition ──────────────────────────────────────────────────────────
const FADE = 15; // crossfade duration in frames (0.5s)
const INTRO_DUR = s(2.2);

// Clip sequence — 7 segments to fill 73.2s
// Each segment: (src, dur, ken-burns motion)
const SEGMENTS: { src: string; dur: number; motion: KenBurns }[] = [
  { src: staticFile("videos/fmc-clip1.mp4"), dur: CLIP1_DUR, motion: "zoomIn"   },
  { src: staticFile("videos/fmc-clip2.mp4"), dur: CLIP2_DUR, motion: "panLeft"  },
  { src: staticFile("videos/fmc-clip3.mp4"), dur: CLIP3_DUR, motion: "zoomOut"  },
  { src: staticFile("videos/fmc-clip1.mp4"), dur: CLIP1_DUR, motion: "panRight" },
  { src: staticFile("videos/fmc-clip2.mp4"), dur: CLIP2_DUR, motion: "panUp"    },
  { src: staticFile("videos/fmc-clip3.mp4"), dur: CLIP3_DUR, motion: "zoomIn"   },
  { src: staticFile("videos/fmc-clip1.mp4"), dur: CLIP1_DUR, motion: "panLeft"  },
];

// Compute absolute start frames for each segment (overlapping by FADE)
const segStarts: number[] = [];
let cursor = INTRO_DUR - FADE;
for (const seg of SEGMENTS) {
  segStarts.push(cursor);
  cursor += seg.dur - FADE;
}
const OUTRO_START = cursor;
const OUTRO_DUR   = totalFrames - OUTRO_START;

export const FMCMontage: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: B.navy }}>

      {/* ── Master narration audio ── */}
      <Audio src={staticFile("audio/fmc-narration.wav")} volume={1} />

      {/* ── Intro card ── */}
      <Sequence from={0} durationInFrames={INTRO_DUR}>
        <IntroCard />
      </Sequence>

      {/* ── Video segments with Ken Burns + crossfade ── */}
      {SEGMENTS.map((seg, i) => (
        <Sequence key={i} from={segStarts[i]} durationInFrames={seg.dur}>
          <Clip src={seg.src} totalFrames={seg.dur} motion={seg.motion} fadeIn={FADE} />
          <Vignette />
          <BottomScrim />
          <ProgressBar />
        </Sequence>
      ))}

      {/* ── Text overlays timed to narration sections ── */}

      {/* Segment 0 — clinic identity */}
      <Sequence from={segStarts[0] + s(0.5)} durationInFrames={s(8)}>
        <SectionTitle text="Advanced Medical Care" sub="Al Faisal Medical Center" />
        <LowerThird
          line1="مركز الفيصل الطبي"
          line2="Al Faisal Medical Center  •  Al Ain, UAE"
          showFor={s(7.5)}
        />
      </Sequence>

      {/* Segment 1 — team */}
      <Sequence from={segStarts[1] + s(0.5)} durationInFrames={s(8)}>
        <SectionTitle text="Our Medical Team" />
        <LowerThird line1="Specialist Physicians" line2="Experienced & Dedicated Professionals" showFor={s(7.5)} />
        <Chip text="طاقم طبي متخصص" right={52} top={92} delay={20} />
      </Sequence>

      {/* Segment 2 — diagnostics */}
      <Sequence from={segStarts[2] + s(0.5)} durationInFrames={s(7)}>
        <SectionTitle text="Diagnostics & Technology" />
        <LowerThird line1="Modern Diagnostic Equipment" line2="State-of-the-Art Facilities" showFor={s(6.5)} />
      </Sequence>
      <Sequence from={segStarts[2] + s(1.5)} durationInFrames={s(5)}>
        <Chip text="تقنيات حديثة" right={52} top={92} delay={0} />
      </Sequence>

      {/* Segment 3 — services */}
      <Sequence from={segStarts[3] + s(0.5)} durationInFrames={s(8)}>
        <SectionTitle text="Comprehensive Services" />
        <LowerThird line1="Full-Spectrum Healthcare" line2="Preventive · Diagnostic · Therapeutic" showFor={s(7.5)} />
      </Sequence>

      {/* Segment 4 — patient care */}
      <Sequence from={segStarts[4] + s(0.5)} durationInFrames={s(8)}>
        <SectionTitle text="Patient-Centred Care" />
        <LowerThird line1="Your Health is Our Priority" line2="صحتك أولويتنا" showFor={s(7.5)} />
        <Chip text="رعاية متميزة" right={52} top={92} delay={15} />
      </Sequence>

      {/* Segment 5 — community */}
      <Sequence from={segStarts[5] + s(0.5)} durationInFrames={s(7)}>
        <SectionTitle text="Serving Al Ain" />
        <LowerThird line1="Trusted by the Community" line2="FMC  •  Al Ain, UAE" showFor={s(6.5)} />
      </Sequence>

      {/* Segment 6 — CTA */}
      <Sequence from={segStarts[6] + s(0.5)} durationInFrames={s(8)}>
        <SectionTitle text="Book Your Appointment" sub="احجز موعدك الآن" />
        <LowerThird line1="Book Today" line2="Al Faisal Medical Center  •  Al Ain" showFor={s(7.5)} />
        <Chip text="احجز الآن" right={52} top={92} delay={20} />
      </Sequence>

      {/* ── Branded outro ── */}
      <Sequence from={OUTRO_START} durationInFrames={OUTRO_DUR}>
        <OutroCard />
      </Sequence>

    </AbsoluteFill>
  );
};
