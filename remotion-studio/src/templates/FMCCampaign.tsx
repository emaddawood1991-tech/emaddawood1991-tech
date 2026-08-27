/**
 * FMC Campaign v3 — Al Faisal Medical Center
 * Redesigned to match FMC reference video style:
 *  - Persistent logo + clinic name header (always visible)
 *  - Step-numbered text card: red circle badge, Arabic title, English subtitle, divider, rotating bullets
 *  - Dark navy footer bar with bilingual clinic name
 *  - Landscape: video in left panel (56%), step card on right
 *  - Portrait: full-screen video + bottom slide-up card
 */
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

// ── Timing ─────────────────────────────────────────────────────────────────────
const FPS   = 30;
const s     = (sec: number) => Math.round(sec * FPS);
const AUDIO = s(88.2);   // 2646 frames
const FADE  = 15;        // 0.5 s crossfade
const INTRO = s(2.5);    // 75 frames

export const totalFrames = AUDIO;

// ── Brand colours ──────────────────────────────────────────────────────────────
const C = {
  blue:      "#1C3F8F",
  red:       "#CC1F1F",
  silver:    "#8BAFC8",
  idealBlue: "#5B8DB8",
  dark:      "#0D1F3C",
  white:     "#FFFFFF",
  bg:        "#06111E",
};

// ── Types ──────────────────────────────────────────────────────────────────────
type Motion = "still"|"zoomIn"|"zoomOut"|"panLeft"|"panRight"|"panUp"|"panDown";

interface SegDef {
  src: string;
  motion: Motion;
  step: string;
  ar: string;
  en: string;
  bullets: string[];
}

// ── Assets ─────────────────────────────────────────────────────────────────────
const C1 = staticFile("videos/fmc2-clip1.mp4");
const C2 = staticFile("videos/fmc2-clip2.mp4");
const C3 = staticFile("videos/fmc2-clip3.mp4");
const CLIP_DUR = 300;   // 10 s per clip
const LOGO_SRC = staticFile("images/fmc-logo.webp");

// ── 9 Segments with step text ──────────────────────────────────────────────────
const SEGMENTS: SegDef[] = [
  {
    src: C1, motion: "zoomIn",  step: "01",
    ar: "رعاية طبية متكاملة",   en: "Comprehensive Medical Care",
    bullets: ["تشخيص دقيق وعلاج متكامل", "فريق طبي متخصص ومتميز", "رعاية شاملة من الوقاية للعلاج"],
  },
  {
    src: C2, motion: "panLeft", step: "02",
    ar: "فريقنا الطبي",          en: "Our Medical Team",
    bullets: ["أطباء متخصصون ذوو خبرة", "كفاءات طبية معتمدة دولياً", "نخبة من أفضل الكوادر الطبية"],
  },
  {
    src: C3, motion: "panRight", step: "03",
    ar: "أحدث التقنيات",          en: "Advanced Technology",
    bullets: ["تقنيات تشخيصية متطورة", "معدات طبية من الجيل الجديد", "نتائج دقيقة وسريعة"],
  },
  {
    src: C1, motion: "zoomOut", step: "04",
    ar: "خدماتنا الطبية",         en: "Our Medical Services",
    bullets: ["خدمات وقائية وتشخيصية", "علاجات متخصصة ومتنوعة", "برامج متابعة مستمرة"],
  },
  {
    src: C2, motion: "panUp",   step: "05",
    ar: "صحتك أولويتنا",          en: "Your Health, Our Priority",
    bullets: ["رعاية مرضى متميزة", "بيئة علاجية مريحة وآمنة", "دعم متواصل على مدار الساعة"],
  },
  {
    src: C3, motion: "zoomIn",  step: "06",
    ar: "نخدم مجتمع العين",       en: "Serving Al Ain Community",
    bullets: ["موثوق به من آلاف المرضى", "خدمة مجتمعية متميزة", "حضور راسخ في مدينة العين"],
  },
  {
    src: C1, motion: "panLeft", step: "07",
    ar: "جودة بلا حدود",          en: "Quality Without Limits",
    bullets: ["معايير طبية دولية عالية", "متابعة جودة مستمرة", "رضا المريض هدفنا الأول"],
  },
  {
    src: C2, motion: "panDown", step: "08",
    ar: "لماذا FMC؟",              en: "Why Choose FMC?",
    bullets: ["الخبرة والتكنولوجيا معاً", "رعاية شخصية متميزة", "سمعة مبنية على الثقة"],
  },
  {
    src: C3, motion: "zoomOut", step: "09",
    ar: "احجز موعدك الآن",         en: "Book Your Appointment",
    bullets: ["+971 37 548 881", "www.fmc-uae.ae", "العين · الإمارات العربية المتحدة"],
  },
];

const SEG_STARTS     = SEGMENTS.map((_, i) => (INTRO - FADE) + i * (CLIP_DUR - FADE));
const LAST_CLIP_END  = SEG_STARTS[SEGMENTS.length - 1] + CLIP_DUR;
const OUTRO_START    = LAST_CLIP_END - s(4);
const OUTRO_DURATION = AUDIO - OUTRO_START;

// ── Small logo (header) ────────────────────────────────────────────────────────
const SmallLogo: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
    <div style={{
      position: "absolute", inset: 0,
      background: "rgba(255,255,255,0.93)",
      borderRadius: Math.round(size * 0.18),
      boxShadow: "0 2px 14px rgba(28,63,143,0.28)",
    }} />
    <Img
      src={LOGO_SRC}
      style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative" }}
    />
  </div>
);

// ── Big logo (intro / outro) ───────────────────────────────────────────────────
const BigLogo: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: Math.round(size * 1.22), position: "relative" }}>
    <div style={{
      position: "absolute", inset: 0,
      background: "rgba(255,255,255,0.92)",
      borderRadius: 16,
      boxShadow: "0 0 40px rgba(28,63,143,0.35), 0 0 12px rgba(204,31,31,0.25)",
    }} />
    <Img
      src={LOGO_SRC}
      style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative" }}
    />
  </div>
);

const AnimBigLogo: React.FC<{ size: number; delay?: number }> = ({ size, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f  = Math.max(0, frame - delay);
  const sc = spring({ frame: f, fps, config: { damping: 12, stiffness: 110, mass: 0.9 } });
  const op = interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ transform: `scale(${sc})`, opacity: op }}>
      <BigLogo size={size} />
    </div>
  );
};

// ── Persistent header (logo + clinic name) ────────────────────────────────────
const Header: React.FC<{ isPortrait?: boolean }> = ({ isPortrait }) => {
  const logoSize = isPortrait ? 60 : 48;
  const arFs     = isPortrait ? 20 : 16;
  const enFs     = isPortrait ? 13 : 10;
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0,
      height: isPortrait ? 90 : 72,
      display: "flex", alignItems: "center", gap: 12,
      padding: isPortrait ? "0 28px" : "0 20px",
      background: `linear-gradient(to bottom, rgba(6,17,30,0.92) 0%, rgba(6,17,30,0.55) 70%, transparent 100%)`,
      zIndex: 20,
    }}>
      <SmallLogo size={logoSize} />
      <div>
        <div style={{
          color: C.white, fontSize: arFs, fontWeight: 700,
          fontFamily: "sans-serif", direction: "rtl", whiteSpace: "nowrap",
        }}>
          مركز الفيصل الطبي
        </div>
        <div style={{
          color: C.silver, fontSize: enFs,
          fontFamily: "sans-serif", letterSpacing: 0.8, marginTop: 2,
        }}>
          Al Faisal Medical Center
        </div>
      </div>
    </div>
  );
};

// ── Footer bar ────────────────────────────────────────────────────────────────
const FooterBar: React.FC<{ isPortrait?: boolean }> = ({ isPortrait }) => (
  <div style={{
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: isPortrait ? 60 : 50,
    backgroundColor: C.dark,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: isPortrait ? "0 28px" : "0 20px",
    zIndex: 20,
  }}>
    <div style={{
      color: C.white, fontSize: isPortrait ? 18 : 14,
      fontWeight: 600, fontFamily: "sans-serif", direction: "rtl",
    }}>
      مركز الفيصل الطبي
    </div>
    <div style={{
      color: C.silver, fontSize: isPortrait ? 14 : 12,
      fontFamily: "sans-serif", letterSpacing: 0.8,
    }}>
      Al Faisal Medical Center
    </div>
  </div>
);

// ── Video clip in a positioned panel ──────────────────────────────────────────
const ClipPanel: React.FC<{
  src: string; dur: number; motion?: Motion;
  panelStyle: React.CSSProperties;
}> = ({ src, dur, motion = "still", panelStyle }) => {
  const frame = useCurrentFrame();
  const t     = dur > 0 ? frame / dur : 0;
  const opacity = interpolate(frame, [0, FADE], [0, 1], { extrapolateRight: "clamp" });

  let scale = 1.06, tx = 0, ty = 0;
  if (motion === "zoomIn")   scale = interpolate(t, [0,1], [1.04, 1.16]);
  if (motion === "zoomOut")  scale = interpolate(t, [0,1], [1.16, 1.04]);
  if (motion === "panLeft")  { scale = 1.10; tx = interpolate(t, [0,1], [ 3, -3]); }
  if (motion === "panRight") { scale = 1.10; tx = interpolate(t, [0,1], [-3,  3]); }
  if (motion === "panUp")    { scale = 1.10; ty = interpolate(t, [0,1], [ 3, -3]); }
  if (motion === "panDown")  { scale = 1.10; ty = interpolate(t, [0,1], [-3,  3]); }

  return (
    <div style={{ position: "absolute", overflow: "hidden", opacity, ...panelStyle }}>
      <OffthreadVideo
        src={src}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: `scale(${scale}) translateX(${tx}%) translateY(${ty}%)`,
        }}
        muted
      />
    </div>
  );
};

// ── Step card (text overlay) ───────────────────────────────────────────────────
const StepCard: React.FC<{
  step: string; ar: string; en: string;
  bullets: string[]; isPortrait?: boolean;
}> = ({ step, ar, en, bullets, isPortrait }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp     = spring({ frame, fps, config: { damping: 20, stiffness: 160, mass: 1.0 } });
  const cardOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Rotate bullet text through the segment duration
  const BULLET_DUR    = Math.floor(CLIP_DUR / bullets.length);
  const rawIdx        = Math.floor(frame / BULLET_DUR);
  const bulletIdx     = Math.min(rawIdx, bullets.length - 1);
  const localBullet   = frame - bulletIdx * BULLET_DUR;
  const bulletOp      = interpolate(
    localBullet,
    [0, 8, BULLET_DUR - 10, BULLET_DUR - 2],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  // ── Portrait: card slides up from bottom ────────────────────────────────────
  if (isPortrait) {
    return (
      <div style={{
        position: "absolute",
        bottom: 64, left: 20, right: 20,
        backgroundColor: "rgba(10,25,52,0.96)",
        borderRadius: 22,
        padding: "20px 24px 26px",
        borderTop: `4px solid ${C.red}`,
        transform: `translateY(${(1 - sp) * 130}px)`,
        opacity: cardOp,
        backdropFilter: "blur(16px)",
        zIndex: 10,
      }}>
        {/* Step badge */}
        <div style={{
          position: "absolute", top: -20, right: 20,
          width: 44, height: 44, borderRadius: "50%",
          backgroundColor: C.red,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: C.white, fontWeight: 800, fontSize: 17, fontFamily: "sans-serif",
          boxShadow: `0 4px 14px ${C.red}66`,
        }}>
          {step}
        </div>
        {/* Arabic title */}
        <div style={{
          color: C.white, fontSize: 26, fontWeight: 800,
          fontFamily: "sans-serif", direction: "rtl",
          marginTop: 6, lineHeight: 1.3,
        }}>
          {ar}
        </div>
        {/* English subtitle */}
        <div style={{
          color: C.idealBlue, fontSize: 14, fontFamily: "sans-serif",
          fontWeight: 500, marginTop: 6,
        }}>
          {en}
        </div>
        {/* Divider */}
        <div style={{
          width: 36, height: 3, backgroundColor: C.red,
          borderRadius: 2, marginTop: 10, marginBottom: 12,
        }} />
        {/* Rotating bullet */}
        <div style={{
          color: "#C8D9EB", fontSize: 18, fontFamily: "sans-serif",
          direction: "rtl", lineHeight: 1.6, opacity: bulletOp,
          minHeight: 28,
        }}>
          {bullets[bulletIdx]}
        </div>
      </div>
    );
  }

  // ── Landscape: card slides in from right ────────────────────────────────────
  return (
    <div style={{
      position: "absolute",
      right: 0,
      top: "50%",
      width: "40%",
      backgroundColor: "rgba(10,25,52,0.95)",
      borderRadius: "18px 0 0 18px",
      padding: "38px 44px 38px 36px",
      borderLeft: `4px solid ${C.red}`,
      transform: `translateX(${(1 - sp) * 100}%) translateY(-50%)`,
      opacity: cardOp,
      backdropFilter: "blur(14px)",
      zIndex: 10,
    }}>
      {/* Step badge */}
      <div style={{
        position: "absolute", top: -24, left: -24,
        width: 52, height: 52, borderRadius: "50%",
        backgroundColor: C.red,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: C.white, fontWeight: 800, fontSize: 20, fontFamily: "sans-serif",
        boxShadow: `0 4px 20px ${C.red}77`,
      }}>
        {step}
      </div>
      {/* Arabic title */}
      <div style={{
        color: C.white, fontSize: 34, fontWeight: 800,
        fontFamily: "sans-serif", direction: "rtl",
        lineHeight: 1.3, marginTop: 14,
      }}>
        {ar}
      </div>
      {/* English subtitle */}
      <div style={{
        color: C.idealBlue, fontSize: 16, fontFamily: "sans-serif",
        fontWeight: 600, letterSpacing: 0.5, marginTop: 10,
      }}>
        {en}
      </div>
      {/* Divider */}
      <div style={{
        width: 44, height: 3, backgroundColor: C.red,
        borderRadius: 2, marginTop: 14, marginBottom: 16,
      }} />
      {/* Rotating bullet */}
      <div style={{
        color: "#C8D9EB", fontSize: 22, fontFamily: "sans-serif",
        direction: "rtl", lineHeight: 1.65, opacity: bulletOp,
        minHeight: 34,
      }}>
        {bullets[bulletIdx]}
      </div>
    </div>
  );
};

// ── Intro card ────────────────────────────────────────────────────────────────
const IntroCard: React.FC<{ isPortrait?: boolean }> = ({ isPortrait }) => {
  const frame   = useCurrentFrame();
  const fadeOut = interpolate(frame, [s(2), s(2.5)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const subOp   = interpolate(frame, [48, 65], [0, 1], { extrapolateRight: "clamp" });
  const arOp    = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });

  const logoSize = isPortrait ? 200 : 170;
  const titleFs  = isPortrait ? 58  : 50;
  const subFs    = isPortrait ? 20  : 17;

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 40%, #112255 0%, ${C.bg} 70%)`,
      justifyContent: "center", alignItems: "center", flexDirection: "column",
      opacity: fadeOut, zIndex: 30,
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, ${C.blue}, ${C.silver}, ${C.red})` }} />
      <AnimBigLogo size={logoSize} delay={0} />
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
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${C.red}, ${C.silver}, ${C.blue})` }} />
    </AbsoluteFill>
  );
};

// ── Outro card ────────────────────────────────────────────────────────────────
const OutroCard: React.FC<{ isPortrait?: boolean }> = ({ isPortrait }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const sc   = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const op1  = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const op2  = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });
  const op3  = interpolate(frame, [55, 72], [0, 1], { extrapolateRight: "clamp" });

  const logoSize  = isPortrait ? 160 : 140;
  const arFs      = isPortrait ? 30  : 26;
  const enFs      = isPortrait ? 18  : 15;
  const contactFs = isPortrait ? 22  : 19;

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 40%, #0D2050 0%, ${C.bg} 70%)`,
      justifyContent: "center", alignItems: "center", flexDirection: "column",
      opacity: bgOp, zIndex: 30,
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, ${C.blue}, ${C.silver}, ${C.red})` }} />
      <div style={{ transform: `scale(${sc})` }}>
        <BigLogo size={logoSize} />
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
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: op2 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, backgroundColor:`${C.blue}33`, border:`1px solid ${C.blue}55`, borderRadius:10, padding:"10px 24px", backdropFilter:"blur(6px)" }}>
          <span style={{ fontSize: 20 }}>📞</span>
          <span style={{ fontSize: contactFs, color: C.white, fontFamily: "sans-serif", fontWeight: 600, letterSpacing: 1 }}>+971 37 548 881</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, backgroundColor:`${C.red}22`, border:`1px solid ${C.red}44`, borderRadius:10, padding:"10px 24px", backdropFilter:"blur(6px)" }}>
          <span style={{ fontSize: 20 }}>🌐</span>
          <span style={{ fontSize: contactFs, color: C.white, fontFamily: "sans-serif", fontWeight: 600, letterSpacing: 1 }}>www.fmc-uae.ae</span>
        </div>
      </div>
      <div style={{ marginTop: 16, fontSize: isPortrait ? 16 : 14, color: C.idealBlue, fontFamily: "sans-serif", letterSpacing: 2, opacity: op3 }}>
        Al Ain  •  UAE  •  الإمارات العربية المتحدة
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${C.red}, ${C.silver}, ${C.blue})` }} />
    </AbsoluteFill>
  );
};

// ── Portrait composition (9:16 — 1080×1920) ───────────────────────────────────
export const FMCPortrait: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Audio src={staticFile("audio/fmc2-narration.wav")} volume={1} />
    <Audio src={staticFile("audio/fmc2-bgmusic.mp3")}  volume={0.12} />

    {/* Full-screen video clips + bottom step card */}
    {SEGMENTS.map((seg, i) => (
      <Sequence key={i} from={SEG_STARTS[i]} durationInFrames={CLIP_DUR}>
        <ClipPanel
          src={seg.src} dur={CLIP_DUR} motion={seg.motion}
          panelStyle={{ top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <StepCard isPortrait
          step={seg.step} ar={seg.ar} en={seg.en} bullets={seg.bullets}
        />
      </Sequence>
    ))}

    {/* Header + Footer always on top of clips */}
    <Header isPortrait />
    <FooterBar isPortrait />

    {/* Intro (z-index 30 covers header/footer) */}
    <Sequence from={0} durationInFrames={INTRO + FADE}>
      <IntroCard isPortrait />
    </Sequence>

    {/* Outro (z-index 30 covers header/footer) */}
    <Sequence from={OUTRO_START} durationInFrames={OUTRO_DURATION}>
      <OutroCard isPortrait />
    </Sequence>
  </AbsoluteFill>
);

// ── Landscape composition (16:9 — 1920×1080) ──────────────────────────────────
export const FMCLandscape: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Audio src={staticFile("audio/fmc2-narration.wav")} volume={1} />
    <Audio src={staticFile("audio/fmc2-bgmusic.mp3")}  volume={0.12} />

    {/* Left-panel video + right-side step card */}
    {SEGMENTS.map((seg, i) => (
      <Sequence key={i} from={SEG_STARTS[i]} durationInFrames={CLIP_DUR}>
        <ClipPanel
          src={seg.src} dur={CLIP_DUR} motion={seg.motion}
          panelStyle={{ left: 24, top: 82, width: "56%", bottom: 58, borderRadius: 18 }}
        />
        <StepCard
          step={seg.step} ar={seg.ar} en={seg.en} bullets={seg.bullets}
        />
      </Sequence>
    ))}

    {/* Header + Footer always on top of clips */}
    <Header />
    <FooterBar />

    {/* Intro (z-index 30 covers header/footer) */}
    <Sequence from={0} durationInFrames={INTRO + FADE}>
      <IntroCard />
    </Sequence>

    {/* Outro (z-index 30 covers header/footer) */}
    <Sequence from={OUTRO_START} durationInFrames={OUTRO_DURATION}>
      <OutroCard />
    </Sequence>
  </AbsoluteFill>
);
