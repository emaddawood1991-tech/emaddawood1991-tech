/**
 * FMC Campaign — Al Faisal Medical Center
 * Two exports:  FMCPortrait  (1080×1920 — social / Reels / Stories)
 *               FMCLandscape (1920×1080 — TV / YouTube / broadcast)
 */
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
} from "remotion";

// ── Timing ────────────────────────────────────────────────────────────────────
const FPS   = 30;
const s     = (sec: number) => Math.round(sec * FPS);
const AUDIO = s(88.2);   // 2646 frames — drives the entire timeline
const FADE  = 15;        // 0.5 s crossfade
const INTRO = s(2.5);    // 75 frames

export const totalFrames = AUDIO;

// ── FMC Brand (from real logo) ────────────────────────────────────────────────
const C = {
  blue:      "#1C3F8F",
  red:       "#CC1F1F",
  silver:    "#8BAFC8",
  idealBlue: "#5B8DB8",
  dark:      "#0D1F3C",
  white:     "#FFFFFF",
  bg:        "#06111E",
};

// ── Clip sources + motions ────────────────────────────────────────────────────
type Motion = "still"|"zoomIn"|"zoomOut"|"panLeft"|"panRight"|"panUp"|"panDown";
const C1 = staticFile("videos/fmc2-clip1.mp4");
const C2 = staticFile("videos/fmc2-clip2.mp4");
const C3 = staticFile("videos/fmc2-clip3.mp4");
const CLIP_DUR = 300; // all clips = 10.006 s

const SEGMENTS: { src: string; motion: Motion }[] = [
  { src: C1, motion: "zoomIn"   },
  { src: C2, motion: "panLeft"  },
  { src: C3, motion: "panRight" },
  { src: C1, motion: "zoomOut"  },
  { src: C2, motion: "panUp"    },
  { src: C3, motion: "zoomIn"   },
  { src: C1, motion: "panLeft"  },
  { src: C2, motion: "panDown"  },
  { src: C3, motion: "zoomOut"  },
];

// Absolute start frame for each segment
const SEG_STARTS = SEGMENTS.map((_, i) =>
  (INTRO - FADE) + i * (CLIP_DUR - FADE)
);
const LAST_CLIP_END  = SEG_STARTS[SEGMENTS.length - 1] + CLIP_DUR;
const OUTRO_START    = LAST_CLIP_END - s(4);   // outro overlaps last 4 s of clip
const OUTRO_DURATION = AUDIO - OUTRO_START;

// ── SVG Heart Logo ────────────────────────────────────────────────────────────
const FMCLogo: React.FC<{ size?: number }> = ({ size = 180 }) => (
  <svg width={size} height={size * 1.22} viewBox="0 0 200 244" fill="none">
    {/* Left blue swoosh */}
    <path
      d="M 92 48 C 58 26, 14 56, 18 100 C 22 144, 68 176, 92 194"
      stroke={C.blue}
      strokeWidth="30"
      strokeLinecap="round"
    />
    {/* Inner silver layer (right side) */}
    <path
      d="M 106 36 C 122 18, 158 42, 160 82 C 162 124, 128 162, 106 194"
      stroke={C.silver}
      strokeWidth="19"
      strokeLinecap="round"
    />
    {/* Outer red swoosh (right side) */}
    <path
      d="M 119 18 C 146 4, 188 34, 184 82 C 180 132, 138 168, 106 194"
      stroke={C.red}
      strokeWidth="30"
      strokeLinecap="round"
    />
    {/* FMC letters */}
    <text fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="58">
      <tspan x="8"  y="230" fill={C.blue}>{`F`}</tspan>
      <tspan fill={C.silver}>{`M`}</tspan>
      <tspan fill={C.red}>{`C`}</tspan>
    </text>
    {/* Ideal Care tagline */}
    <text x="10" y="246" fontFamily="Arial, sans-serif" fontSize="19" fill={C.idealBlue} letterSpacing="2">
      Ideal Care
    </text>
  </svg>
);

// ── Animated FMC logo wrapper ─────────────────────────────────────────────────
const AnimLogo: React.FC<{ size?: number; delay?: number }> = ({ size = 180, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);
  const sc = spring({ frame: f, fps, config: { damping: 12, stiffness: 110, mass: 0.9 } });
  const op = interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ transform: `scale(${sc})`, opacity: op }}>
      <FMCLogo size={size} />
    </div>
  );
};

// ── Video clip with Ken Burns ─────────────────────────────────────────────────
const Clip: React.FC<{ src: string; dur: number; motion?: Motion }> = ({
  src, dur, motion = "still",
}) => {
  const frame = useCurrentFrame();
  const t = dur > 0 ? frame / dur : 0;

  const opacity = interpolate(frame, [0, FADE], [0, 1], { extrapolateRight: "clamp" });

  let scale = 1.06;
  let tx = 0, ty = 0;
  if (motion === "zoomIn")   scale = interpolate(t, [0,1], [1.04, 1.16]);
  if (motion === "zoomOut")  scale = interpolate(t, [0,1], [1.16, 1.04]);
  if (motion === "panLeft")  { scale = 1.10; tx = interpolate(t, [0,1], [3,  -3]); }
  if (motion === "panRight") { scale = 1.10; tx = interpolate(t, [0,1], [-3,  3]); }
  if (motion === "panUp")    { scale = 1.10; ty = interpolate(t, [0,1], [3,  -3]); }
  if (motion === "panDown")  { scale = 1.10; ty = interpolate(t, [0,1], [-3,  3]); }

  return (
    <AbsoluteFill style={{ opacity }}>
      <OffthreadVideo
        src={src}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: `scale(${scale}) translateX(${tx}%) translateY(${ty}%)`,
        }}
        muted
      />
    </AbsoluteFill>
  );
};

// ── Vignette ──────────────────────────────────────────────────────────────────
const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(6,17,30,0.6) 100%)", pointerEvents: "none" }} />
);

// ── Bottom scrim ──────────────────────────────────────────────────────────────
const Scrim: React.FC = () => (
  <AbsoluteFill style={{ background: `linear-gradient(to top, ${C.bg}cc 0%, transparent 40%)`, pointerEvents: "none" }} />
);

// ── Top scrim (for top logo/title area in portrait) ───────────────────────────
const TopScrim: React.FC = () => (
  <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${C.bg}bb 0%, transparent 35%)`, pointerEvents: "none" }} />
);

// ── Lower third ───────────────────────────────────────────────────────────────
const LowerThird: React.FC<{
  line1: string; line2?: string; showFor?: number; isPortrait?: boolean;
}> = ({ line1, line2, showFor = 80, isPortrait = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slide = spring({ frame, fps, config: { damping: 22, stiffness: 220, mass: 0.8 } });
  const op = interpolate(frame, [0, 8, showFor - 10, showFor], [0, 1, 1, 0], { extrapolateRight: "clamp" });

  const fs1 = isPortrait ? 30 : 26;
  const fs2 = isPortrait ? 20 : 17;

  return (
    <div style={{ position: "absolute", bottom: isPortrait ? 100 : 72, left: 0, opacity: op, transform: `translateX(${(1-slide)*-200}px)`, display: "flex", alignItems: "stretch" }}>
      {/* Blue accent */}
      <div style={{ width: 5, background: `linear-gradient(180deg, ${C.blue}, ${C.red})`, flexShrink: 0 }} />
      <div style={{ backgroundColor: `${C.dark}ee`, paddingLeft: 18, paddingRight: 30, paddingTop: 10, paddingBottom: 10 }}>
        <div style={{ color: C.white, fontSize: fs1, fontWeight: 700, fontFamily: "sans-serif", letterSpacing: 0.4 }}>{line1}</div>
        {line2 && <div style={{ color: C.silver, fontSize: fs2, fontWeight: 400, fontFamily: "sans-serif", marginTop: 3 }}>{line2}</div>}
      </div>
    </div>
  );
};

// ── Arabic keyword badge ──────────────────────────────────────────────────────
const Badge: React.FC<{ text: string; right?: number; top?: number; delay?: number; showFor?: number }> = ({
  text, right = 48, top = 48, delay = 0, showFor = 70,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);
  const sc = spring({ frame: f, fps, config: { damping: 14, stiffness: 200 } });
  const op = interpolate(f, [0, 8, showFor, showFor + 8], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", right, top, transform: `scale(${sc})`, opacity: op, backgroundColor: `${C.blue}cc`, border: `1px solid ${C.silver}55`, borderRadius: 8, padding: "7px 16px", color: C.white, fontSize: 17, fontWeight: 600, fontFamily: "sans-serif", letterSpacing: 1, backdropFilter: "blur(6px)" }}>
      {text}
    </div>
  );
};

// ── Progress bar ──────────────────────────────────────────────────────────────
const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(255,255,255,0.08)" }}>
      <div style={{ width: `${(frame/durationInFrames)*100}%`, height: "100%", background: `linear-gradient(90deg, ${C.blue}, ${C.red})` }} />
    </div>
  );
};

// ── Section heading ───────────────────────────────────────────────────────────
const SectionHeading: React.FC<{ ar: string; en?: string; isPortrait?: boolean }> = ({ ar, en, isPortrait }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: { damping: 18, stiffness: 200 } });
  const op = interpolate(frame, [0, 10, 60, 75], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const fsAr = isPortrait ? 28 : 22;
  const fsEn = isPortrait ? 16 : 13;

  return (
    <div style={{ position: "absolute", top: isPortrait ? 48 : 40, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: op, transform: `scale(${sc})` }}>
      <div style={{ fontSize: fsAr, color: C.silver, fontFamily: "sans-serif", fontWeight: 600, letterSpacing: 2, direction: "rtl" }}>{ar}</div>
      {en && <div style={{ fontSize: fsEn, color: C.idealBlue, fontFamily: "sans-serif", fontWeight: 400, marginTop: 4, letterSpacing: 2 }}>{en}</div>}
      <div style={{ width: 36, height: 2, background: `linear-gradient(90deg, ${C.blue}, ${C.red})`, marginTop: 8, borderRadius: 1 }} />
    </div>
  );
};

// ── Intro card ────────────────────────────────────────────────────────────────
const IntroCard: React.FC<{ isPortrait?: boolean }> = ({ isPortrait }) => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [s(2), s(2.5)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const subOp   = interpolate(frame, [48, 65], [0, 1], { extrapolateRight: "clamp" });
  const arOp    = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });

  const logoSize = isPortrait ? 200 : 170;
  const titleFs  = isPortrait ? 58  : 50;
  const subFs    = isPortrait ? 20  : 17;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #112255 0%, ${C.bg} 70%)`, justifyContent: "center", alignItems: "center", flexDirection: "column", opacity: fadeOut }}>
      {/* Top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, ${C.blue}, ${C.silver}, ${C.red})` }} />

      <AnimLogo size={logoSize} delay={0} />

      <div style={{ marginTop: 24, textAlign: "center", opacity: titleOp }}>
        <div style={{ fontSize: titleFs, fontWeight: 900, color: C.white, fontFamily: "sans-serif", letterSpacing: 10, textShadow: `0 4px 24px ${C.blue}66` }}>
          <span style={{ color: C.blue }}>F</span>
          <span style={{ color: C.silver }}>M</span>
          <span style={{ color: C.red }}>C</span>
        </div>
        <div style={{ width: 80, height: 2, background: `linear-gradient(90deg, ${C.blue}, ${C.red})`, margin: "10px auto" }} />
        <div style={{ fontSize: subFs, color: C.idealBlue, fontFamily: "sans-serif", fontWeight: 300, letterSpacing: 4, opacity: subOp }}>
          AL FAISAL MEDICAL CENTER
        </div>
        <div style={{ fontSize: isPortrait ? 18 : 15, color: C.silver, fontFamily: "sans-serif", marginTop: 6, letterSpacing: 2, opacity: subOp }}>
          AL AIN  •  UAE
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: isPortrait ? 32 : 26, color: C.white, fontFamily: "sans-serif", fontWeight: 700, direction: "rtl", opacity: arOp, textShadow: `0 2px 12px ${C.dark}` }}>
        مركز الفيصل الطبي
      </div>

      {/* Bottom accent */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${C.red}, ${C.silver}, ${C.blue})` }} />
    </AbsoluteFill>
  );
};

// ── Outro card with contact info ──────────────────────────────────────────────
const OutroCard: React.FC<{ isPortrait?: boolean }> = ({ isPortrait }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgOp  = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const sc    = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const op1   = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const op2   = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });
  const op3   = interpolate(frame, [55, 72], [0, 1], { extrapolateRight: "clamp" });

  const logoSize = isPortrait ? 160 : 140;
  const arFs     = isPortrait ? 30  : 26;
  const enFs     = isPortrait ? 18  : 15;
  const contactFs= isPortrait ? 22  : 19;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #0D2050 0%, ${C.bg} 70%)`, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 0, opacity: bgOp }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, ${C.blue}, ${C.silver}, ${C.red})` }} />

      <div style={{ transform: `scale(${sc})` }}>
        <FMCLogo size={logoSize} />
      </div>

      <div style={{ marginTop: 20, textAlign: "center", opacity: op1 }}>
        <div style={{ fontSize: arFs, color: C.white, fontFamily: "sans-serif", fontWeight: 700, direction: "rtl" }}>
          مركز الفيصل الطبي
        </div>
        <div style={{ fontSize: enFs, color: C.silver, fontFamily: "sans-serif", fontWeight: 300, letterSpacing: 3, marginTop: 4 }}>
          AL FAISAL MEDICAL CENTER  •  IDEAL CARE
        </div>
        <div style={{ width: 60, height: 2, background: `linear-gradient(90deg, ${C.blue}, ${C.red})`, margin: "12px auto" }} />
      </div>

      {/* Contact info */}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: op2 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          backgroundColor: `${C.blue}33`, border: `1px solid ${C.blue}55`, borderRadius: 10,
          padding: "10px 24px", backdropFilter: "blur(6px)",
        }}>
          <span style={{ fontSize: 20 }}>📞</span>
          <span style={{ fontSize: contactFs, color: C.white, fontFamily: "sans-serif", fontWeight: 600, letterSpacing: 1 }}>
            +971 37 548 881
          </span>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          backgroundColor: `${C.red}22`, border: `1px solid ${C.red}44`, borderRadius: 10,
          padding: "10px 24px", backdropFilter: "blur(6px)",
        }}>
          <span style={{ fontSize: 20 }}>🌐</span>
          <span style={{ fontSize: contactFs, color: C.white, fontFamily: "sans-serif", fontWeight: 600, letterSpacing: 1 }}>
            www.fmc-uae.ae
          </span>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: isPortrait ? 16 : 14, color: C.idealBlue, fontFamily: "sans-serif", letterSpacing: 2, opacity: op3 }}>
        Al Ain  •  UAE  •  الإمارات العربية المتحدة
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${C.red}, ${C.silver}, ${C.blue})` }} />
    </AbsoluteFill>
  );
};

// ── Shared text overlay schedule ──────────────────────────────────────────────
const TextOverlays: React.FC<{ isPortrait?: boolean }> = ({ isPortrait = false }) => (
  <>
    {/* Seg 0 — clinic opening */}
    <Sequence from={SEG_STARTS[0] + s(0.6)} durationInFrames={s(8)}>
      <SectionHeading ar="مركز الفيصل الطبي" en="AL FAISAL MEDICAL CENTER" isPortrait={isPortrait} />
      <LowerThird line1="رعاية طبية متكاملة" line2="Comprehensive Medical Care" showFor={s(7.5)} isPortrait={isPortrait} />
    </Sequence>

    {/* Seg 1 — team */}
    <Sequence from={SEG_STARTS[1] + s(0.6)} durationInFrames={s(8)}>
      <SectionHeading ar="فريقنا الطبي" en="OUR MEDICAL TEAM" isPortrait={isPortrait} />
      <LowerThird line1="أطباء متخصصون وذوو خبرة" line2="Experienced Specialist Physicians" showFor={s(7.5)} isPortrait={isPortrait} />
      <Badge text="متخصصون" right={52} top={isPortrait ? 92 : 60} delay={20} />
    </Sequence>

    {/* Seg 2 — technology */}
    <Sequence from={SEG_STARTS[2] + s(0.6)} durationInFrames={s(7)}>
      <SectionHeading ar="أحدث التقنيات" en="ADVANCED TECHNOLOGY" isPortrait={isPortrait} />
      <LowerThird line1="تقنيات تشخيصية متطورة" line2="State-of-the-Art Diagnostics" showFor={s(6.5)} isPortrait={isPortrait} />
    </Sequence>
    <Sequence from={SEG_STARTS[2] + s(1.5)} durationInFrames={s(5)}>
      <Badge text="تشخيص دقيق" right={52} top={isPortrait ? 92 : 60} delay={0} />
    </Sequence>

    {/* Seg 3 — services */}
    <Sequence from={SEG_STARTS[3] + s(0.6)} durationInFrames={s(8)}>
      <SectionHeading ar="خدماتنا" en="OUR SERVICES" isPortrait={isPortrait} />
      <LowerThird line1="خدمات طبية شاملة" line2="Preventive · Diagnostic · Therapeutic" showFor={s(7.5)} isPortrait={isPortrait} />
    </Sequence>

    {/* Seg 4 — patient care */}
    <Sequence from={SEG_STARTS[4] + s(0.6)} durationInFrames={s(8)}>
      <SectionHeading ar="صحتك أولويتنا" en="YOUR HEALTH IS OUR PRIORITY" isPortrait={isPortrait} />
      <LowerThird line1="رعاية مرضى متميزة" line2="Patient-Centred Excellence" showFor={s(7.5)} isPortrait={isPortrait} />
      <Badge text="صحتك أولاً" right={52} top={isPortrait ? 92 : 60} delay={15} />
    </Sequence>

    {/* Seg 5 — community */}
    <Sequence from={SEG_STARTS[5] + s(0.6)} durationInFrames={s(7)}>
      <SectionHeading ar="نخدم مجتمع العين" en="SERVING AL AIN COMMUNITY" isPortrait={isPortrait} />
      <LowerThird line1="موثوق به من آلاف المرضى" line2="Trusted by Thousands in Al Ain" showFor={s(6.5)} isPortrait={isPortrait} />
    </Sequence>

    {/* Seg 6 — quality */}
    <Sequence from={SEG_STARTS[6] + s(0.6)} durationInFrames={s(8)}>
      <SectionHeading ar="جودة بلا حدود" en="QUALITY WITHOUT LIMITS" isPortrait={isPortrait} />
      <LowerThird line1="معايير طبية دولية" line2="International Medical Standards" showFor={s(7.5)} isPortrait={isPortrait} />
    </Sequence>

    {/* Seg 7 — why us */}
    <Sequence from={SEG_STARTS[7] + s(0.6)} durationInFrames={s(8)}>
      <SectionHeading ar="لماذا FMC؟" en="WHY CHOOSE FMC?" isPortrait={isPortrait} />
      <LowerThird line1="الخبرة والتكنولوجيا والرعاية" line2="Expertise · Technology · Compassion" showFor={s(7.5)} isPortrait={isPortrait} />
      <Badge text="الأفضل في العين" right={52} top={isPortrait ? 92 : 60} delay={20} />
    </Sequence>

    {/* Seg 8 — CTA */}
    <Sequence from={SEG_STARTS[8] + s(0.6)} durationInFrames={s(6)}>
      <SectionHeading ar="احجز موعدك الآن" en="BOOK YOUR APPOINTMENT TODAY" isPortrait={isPortrait} />
      <LowerThird line1="+971 37 548 881  •  www.fmc-uae.ae" showFor={s(5.5)} isPortrait={isPortrait} />
    </Sequence>
  </>
);

// ── Portrait composition (9:16 — 1080×1920) ──────────────────────────────────
export const FMCPortrait: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Audio src={staticFile("audio/fmc2-narration.wav")} volume={1} />
    <Audio src={staticFile("audio/fmc2-bgmusic.mp3")}  volume={0.12} />

    {/* Intro */}
    <Sequence from={0} durationInFrames={INTRO}>
      <IntroCard isPortrait />
    </Sequence>

    {/* Clip segments */}
    {SEGMENTS.map((seg, i) => (
      <Sequence key={i} from={SEG_STARTS[i]} durationInFrames={CLIP_DUR}>
        <Clip src={seg.src} dur={CLIP_DUR} motion={seg.motion} />
        <TopScrim />
        <Vignette />
        <Scrim />
        <ProgressBar />
      </Sequence>
    ))}

    {/* Text overlays */}
    <TextOverlays isPortrait />

    {/* Outro */}
    <Sequence from={OUTRO_START} durationInFrames={OUTRO_DURATION}>
      <OutroCard isPortrait />
    </Sequence>
  </AbsoluteFill>
);

// ── Landscape composition (16:9 — 1920×1080) ─────────────────────────────────
export const FMCLandscape: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Audio src={staticFile("audio/fmc2-narration.wav")} volume={1} />
    <Audio src={staticFile("audio/fmc2-bgmusic.mp3")}  volume={0.12} />

    {/* Intro */}
    <Sequence from={0} durationInFrames={INTRO}>
      <IntroCard />
    </Sequence>

    {/* Clip segments */}
    {SEGMENTS.map((seg, i) => (
      <Sequence key={i} from={SEG_STARTS[i]} durationInFrames={CLIP_DUR}>
        <Clip src={seg.src} dur={CLIP_DUR} motion={seg.motion} />
        <TopScrim />
        <Vignette />
        <Scrim />
        <ProgressBar />
      </Sequence>
    ))}

    {/* Text overlays */}
    <TextOverlays />

    {/* Outro */}
    <Sequence from={OUTRO_START} durationInFrames={OUTRO_DURATION}>
      <OutroCard />
    </Sequence>
  </AbsoluteFill>
);
