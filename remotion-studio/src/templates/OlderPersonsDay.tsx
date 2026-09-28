import React from "react";
import {
  AbsoluteFill, Audio, Img, OffthreadVideo, Sequence,
  interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

// ─── Timing ───────────────────────────────────────────────────────────────
const FPS       = 30;
const s         = (sec: number) => Math.round(sec * FPS);
const INTRO_DUR = s(3);     // 90f  – logo reveal + event title
const NARR_DUR  = s(18.4);  // 552f – voiceover length
const MAIN_DUR  = NARR_DUR + s(1);
const OUTRO_DUR = s(7);     // 210f – CTA / contact card
export const totalFrames = INTRO_DUR + MAIN_DUR + OUTRO_DUR;
const MAIN_START  = INTRO_DUR;
const OUTRO_START = MAIN_START + MAIN_DUR;
const FADE        = 15;

// ─── Colours ──────────────────────────────────────────────────────────────
const C = {
  navy:      "#061322",
  blue:      "#0D3370",
  midBlue:   "#1A5496",
  teal:      "#00C9C8",
  tealDim:   "rgba(0,201,200,0.25)",
  gold:      "#D4A843",
  goldLight: "#F5D77E",
  white:     "#FFFFFF",
  offWhite:  "#EEE8DF",
  silver:    "#98AEC2",
  overlay:   "rgba(6,19,34,0.68)",
};

// ─── Assets ───────────────────────────────────────────────────────────────
const VIDEO      = staticFile("videos/older-persons-clip.mp4");
const FMC_LOGO   = staticFile("images/fmc-ideal-care-logo.webp");   // FMC brand logo (blue/red)
const DAY_ICON   = staticFile("images/older-persons-logo.webp");     // Elderly care icon (blue/teal)
const NARR       = staticFile("audio/older-persons-narration.wav");
const MUSIC      = staticFile("audio/older-persons-music.mp3");

// ─── Messages ─────────────────────────────────────────────────────────────
const MSGS = [
  { ar: "نُقدّر كبارنا ونحتفي بهم",      en: "We honour and celebrate our elders",    start: 0       },
  { ar: "صحتهم أمانة في أعناقنا",        en: "Their health is our responsibility",     start: s(6.3)  },
  { ar: "رعاية شاملة بكل محبة واحترام",  en: "Comprehensive care with love & respect", start: s(12.5) },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
function useFade(from = 0, to = FADE) {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

// ─── Header (FMC logo + name, bigger) ────────────────────────────────────
const Header: React.FC<{ isPortrait: boolean }> = ({ isPortrait }) => {
  const op = useFade(0, 12);
  const h  = isPortrait ? 106 : 84;
  const ls = isPortrait ? 80 : 64;   // logo size ↑
  const ts = isPortrait ? 22 : 17;   // title font ↑
  const ss = isPortrait ? 13 : 11;   // subtitle font ↑
  const px = isPortrait ? 32 : 28;
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: h, zIndex: 20,
      display: "flex", alignItems: "center", gap: 14, padding: `0 ${px}px`,
      background: "linear-gradient(to bottom, rgba(6,19,34,0.94) 0%, transparent 100%)",
      opacity: op,
    }}>
      <Img src={FMC_LOGO} style={{ width: ls, height: ls, objectFit: "contain" }} />
      <div>
        <div style={{ color: C.white, fontSize: ts, fontWeight: 800, fontFamily: "sans-serif", direction: "rtl" }}>
          مركز الفيصل الطبي
        </div>
        <div style={{ color: C.teal, fontSize: ss, fontFamily: "sans-serif", letterSpacing: 0.8 }}>
          Al Faisal Medical Center  ·  FMC Ideal Care
        </div>
      </div>
    </div>
  );
};

// ─── Footer bar ───────────────────────────────────────────────────────────
const FooterBar: React.FC<{ isPortrait: boolean }> = ({ isPortrait }) => (
  <div style={{
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: isPortrait ? 58 : 46, zIndex: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: `0 ${isPortrait ? 32 : 28}px`,
    background: `linear-gradient(90deg, ${C.navy} 0%, ${C.blue} 50%, ${C.navy} 100%)`,
    borderTop: `2px solid ${C.teal}`,
  }}>
    <div style={{ color: C.teal, fontSize: isPortrait ? 14 : 11, fontFamily: "sans-serif" }}>
      Al Faisal Medical Center
    </div>
    <div style={{ color: C.white, fontSize: isPortrait ? 14 : 11, fontFamily: "sans-serif", direction: "rtl" }}>
      مركز الفيصل الطبي
    </div>
  </div>
);

// ─── INTRO CARD ───────────────────────────────────────────────────────────
const IntroCard: React.FC<{ isPortrait: boolean }> = ({ isPortrait }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Staggered animation chain
  const fmcSc    = spring({ frame,           fps, config: { damping: 20 } });
  const iconSc   = spring({ frame: frame - 8, fps, config: { damping: 16 } });
  const pillSc   = spring({ frame: frame - 20, fps, config: { damping: 22 } });
  const titleSc  = spring({ frame: frame - 28, fps, config: { damping: 22 } });
  const subOp    = spring({ frame: frame - 42, fps, config: { damping: 20 } });

  const titleY  = interpolate(titleSc, [0, 1], [70, 0]);
  const titleOp = interpolate(titleSc, [0, 1], [0, 1]);
  const pillY   = interpolate(pillSc, [0, 1], [40, 0]);
  const pillOp  = interpolate(pillSc, [0, 1], [0, 1]);

  // Sizes – portrait vs landscape
  const fmcSize  = isPortrait ? 90  : 72;   // FMC logo at top ↑
  const iconSize = isPortrait ? 260 : 200;  // Day icon large ↑
  const titleFs  = isPortrait ? 56  : 44;   // Arabic title ↑↑
  const subFs    = isPortrait ? 24  : 18;   // English subtitle ↑
  const pillFs   = isPortrait ? 18  : 14;

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 35%, ${C.midBlue} 0%, ${C.navy} 70%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: isPortrait ? 20 : 14,
    }}>
      {/* Decorative rings */}
      {[300, 390, 480].map((d, i) => (
        <div key={i} style={{
          position: "absolute",
          width: isPortrait ? d : d * 0.72, height: isPortrait ? d : d * 0.72,
          border: `1px solid ${C.gold}`, borderRadius: "50%",
          opacity: (3 - i) * 0.07,
        }} />
      ))}

      {/* FMC brand logo – top, smaller */}
      <div style={{ transform: `scale(${fmcSc})`, filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.4))" }}>
        <Img src={FMC_LOGO} style={{ width: fmcSize, height: fmcSize, objectFit: "contain" }} />
      </div>

      {/* Day icon – large, centre */}
      <div style={{
        transform: `scale(${iconSc})`,
        filter: "drop-shadow(0 6px 32px rgba(0,201,200,0.45))",
      }}>
        <Img src={DAY_ICON} style={{ width: iconSize, height: iconSize, objectFit: "contain" }} />
      </div>

      {/* Gold date pill */}
      <div style={{ transform: `translateY(${pillY}px)`, opacity: pillOp, textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldLight} 50%, ${C.gold} 100%)`,
          borderRadius: 50, padding: isPortrait ? "12px 36px" : "9px 28px",
        }}>
          <span style={{ fontSize: isPortrait ? 22 : 18 }}>🌿</span>
          <span style={{
            color: C.navy, fontWeight: 800, fontSize: pillFs,
            fontFamily: "sans-serif", direction: "rtl",
          }}>
            1 أكتوبر  ·  October 1
          </span>
        </div>
      </div>

      {/* Arabic event title – big */}
      <div style={{ transform: `translateY(${titleY}px)`, opacity: titleOp, textAlign: "center", padding: "0 40px" }}>
        <div style={{
          color: C.white, fontSize: titleFs, fontWeight: 800,
          fontFamily: "sans-serif", direction: "rtl", lineHeight: 1.25,
          textShadow: "0 3px 28px rgba(0,0,0,0.6)",
        }}>
          يوم المسن العالمي
        </div>

        {/* English subtitle */}
        <div style={{
          color: C.offWhite, fontSize: subFs,
          fontFamily: "sans-serif", letterSpacing: 1.5, marginTop: 12,
          opacity: subOp,
        }}>
          International Day of Older Persons
        </div>

        {/* Teal accent line */}
        <div style={{
          margin: "16px auto 0",
          width: isPortrait ? 180 : 140, height: 2,
          background: `linear-gradient(90deg, transparent, ${C.teal}, transparent)`,
          opacity: subOp,
        }} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Animated message ─────────────────────────────────────────────────────
const FloatingMessage: React.FC<{ ar: string; en: string; isPortrait: boolean }> = ({ ar, en, isPortrait }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: { damping: 22 } });
  const y  = interpolate(sc, [0, 1], [45, 0]);
  const op = interpolate(sc, [0, 1], [0, 1]);
  return (
    <div style={{ transform: `translateY(${y}px)`, opacity: op, textAlign: "center" }}>
      <div style={{
        color: C.white, fontSize: isPortrait ? 34 : 26, fontWeight: 800,
        fontFamily: "sans-serif", direction: "rtl", lineHeight: 1.45,
        textShadow: "0 2px 18px rgba(0,0,0,0.9)",
      }}>{ar}</div>
      <div style={{
        color: C.teal, fontSize: isPortrait ? 18 : 14,
        fontFamily: "sans-serif", letterSpacing: 0.8, marginTop: 8,
        textShadow: "0 1px 10px rgba(0,0,0,0.7)",
      }}>{en}</div>
    </div>
  );
};

// ─── Portrait video section ────────────────────────────────────────────────
const VideoSectionPortrait: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn  = interpolate(frame, [0, FADE], [0, 1], { extrapolateRight: "clamp" });
  const kbScale = interpolate(frame, [0, MAIN_DUR], [1.0, 1.08]);
  const activeIdx = MSGS.reduce((a, m, i) => frame >= m.start ? i : a, 0);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ overflow: "hidden", opacity: fadeIn }}>
        <OffthreadVideo src={VIDEO} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kbScale})` }} muted />
      </AbsoluteFill>
      <AbsoluteFill style={{
        background: `linear-gradient(to bottom, rgba(6,19,34,0.78) 0%, rgba(6,19,34,0.22) 35%, rgba(6,19,34,0.30) 60%, rgba(6,19,34,0.82) 100%)`,
        opacity: fadeIn,
      }} />
      {/* Teal accent above text */}
      <div style={{
        position: "absolute", bottom: 210, left: "15%", right: "15%",
        height: 2, background: `linear-gradient(90deg, transparent, ${C.teal}, transparent)`, opacity: 0.85,
      }} />
      {/* Rotating messages */}
      <div style={{ position: "absolute", bottom: 130, left: 0, right: 0, display: "flex", justifyContent: "center", padding: "0 44px" }}>
        {MSGS.map((m, i) => i === activeIdx ? (
          <Sequence key={i} from={m.start} durationInFrames={MSGS[i + 1] ? MSGS[i + 1].start - m.start : MAIN_DUR}>
            <FloatingMessage ar={m.ar} en={m.en} isPortrait />
          </Sequence>
        ) : null)}
      </div>
    </AbsoluteFill>
  );
};

// ─── Landscape video section (split panel) ────────────────────────────────
const VideoSectionLandscape: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn    = interpolate(frame, [0, FADE], [0, 1], { extrapolateRight: "clamp" });
  const activeIdx = MSGS.reduce((a, m, i) => frame >= m.start ? i : a, 0);

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      {/* Right: video panel */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "60%", overflow: "hidden" }}>
        <OffthreadVideo src={VIDEO} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, transparent 55%, rgba(6,19,34,0.85) 100%)" }} />
      </div>

      {/* Left: info panel */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "42%",
        background: `linear-gradient(155deg, ${C.navy} 0%, ${C.blue} 100%)`,
        display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "flex-start", padding: "88px 36px 56px 36px", gap: 18,
        borderRight: `2px solid ${C.teal}`,
      }}>
        {/* FMC logo */}
        <Img src={FMC_LOGO} style={{ width: 72, height: 72, objectFit: "contain" }} />

        {/* Day icon */}
        <Img src={DAY_ICON} style={{ width: 160, height: 160, objectFit: "contain", filter: "drop-shadow(0 4px 16px rgba(0,201,200,0.3))" }} />

        {/* Date pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldLight} 100%)`,
          borderRadius: 50, padding: "8px 20px",
        }}>
          <span style={{ fontSize: 16 }}>🌿</span>
          <span style={{ color: C.navy, fontWeight: 800, fontSize: 14, fontFamily: "sans-serif", direction: "rtl" }}>
            1 أكتوبر · October 1
          </span>
        </div>

        {/* Arabic title – big */}
        <div style={{
          color: C.white, fontSize: 36, fontWeight: 800,
          fontFamily: "sans-serif", direction: "rtl", lineHeight: 1.3,
          textShadow: "0 2px 14px rgba(0,0,0,0.45)",
        }}>
          يوم المسن العالمي
        </div>
        <div style={{ color: C.silver, fontSize: 14, fontFamily: "sans-serif", letterSpacing: 1 }}>
          International Day of Older Persons
        </div>

        <div style={{ width: 110, height: 2, background: `linear-gradient(90deg, ${C.teal}, transparent)` }} />

        {/* Rotating message */}
        <div style={{ minHeight: 90 }}>
          {MSGS.map((m, i) => i === activeIdx ? (
            <Sequence key={i} from={m.start} durationInFrames={MSGS[i + 1] ? MSGS[i + 1].start - m.start : MAIN_DUR}>
              <FloatingMessage ar={m.ar} en={m.en} isPortrait={false} />
            </Sequence>
          ) : null)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── OUTRO / CTA ──────────────────────────────────────────────────────────
const OutroCard: React.FC<{ isPortrait: boolean }> = ({ isPortrait }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOp   = spring({ frame,           fps, config: { damping: 20 } });
  const iconSc = spring({ frame: frame - 5, fps, config: { damping: 18 } });
  const fmcSc  = spring({ frame: frame - 15, fps, config: { damping: 18 } });
  const msgOp  = spring({ frame: frame - 24, fps, config: { damping: 18 } });
  const ctaOp  = spring({ frame: frame - 38, fps, config: { damping: 18 } });

  const iconSize = isPortrait ? 180 : 130;
  const fmcSize  = isPortrait ? 90  : 72;

  const ContactRow: React.FC<{ icon: string; text: string; color?: string }> = ({ icon, text, color }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      background: "rgba(255,255,255,0.05)", borderRadius: 16,
      padding: isPortrait ? "16px 32px" : "12px 26px",
      border: `1px solid ${C.tealDim}`,
    }}>
      <span style={{ fontSize: isPortrait ? 24 : 20 }}>{icon}</span>
      <span style={{
        color: color ?? C.white, fontSize: isPortrait ? 20 : 16,
        fontFamily: "sans-serif", fontWeight: 700, letterSpacing: 0.5,
      }}>{text}</span>
    </div>
  );

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 30%, ${C.blue} 0%, ${C.navy} 65%)`,
      opacity: bgOp,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: isPortrait ? 22 : 16,
    }}>
      {/* Decorative rings */}
      {[280, 380, 480].map((d, i) => (
        <div key={i} style={{
          position: "absolute",
          width: isPortrait ? d : d * 0.72, height: isPortrait ? d : d * 0.72,
          border: `1px solid ${C.gold}`, borderRadius: "50%", opacity: (3 - i) * 0.07,
        }} />
      ))}

      {/* Day icon – large */}
      <div style={{
        transform: `scale(${iconSc})`,
        filter: "drop-shadow(0 6px 30px rgba(0,201,200,0.45))",
      }}>
        <Img src={DAY_ICON} style={{ width: iconSize, height: iconSize, objectFit: "contain" }} />
      </div>

      {/* FMC logo below */}
      <div style={{ transform: `scale(${fmcSc})` }}>
        <Img src={FMC_LOGO} style={{ width: fmcSize, height: fmcSize, objectFit: "contain" }} />
      </div>

      {/* Closing message */}
      <div style={{ opacity: msgOp, textAlign: "center", padding: "0 48px" }}>
        <div style={{
          color: C.gold, fontSize: isPortrait ? 26 : 20, fontWeight: 800,
          fontFamily: "sans-serif", direction: "rtl",
        }}>
          مع تمنياتنا بصحة وسعادة دائمة
        </div>
        <div style={{ color: C.offWhite, fontSize: isPortrait ? 15 : 12, fontFamily: "sans-serif", marginTop: 6 }}>
          Wishing you health and happiness always
        </div>
      </div>

      <div style={{ opacity: msgOp, width: isPortrait ? 200 : 160, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />

      {/* Contact */}
      <div style={{ opacity: ctaOp, display: "flex", flexDirection: "column", alignItems: "center", gap: isPortrait ? 14 : 10 }}>
        <ContactRow icon="📞" text="+971 3 754 8881" />
        <ContactRow icon="🌐" text="www.fmc-uae.ae" color={C.teal} />
      </div>

      {/* Centre name */}
      <div style={{ opacity: ctaOp, textAlign: "center" }}>
        <div style={{ color: C.white, fontSize: isPortrait ? 18 : 14, fontFamily: "sans-serif", direction: "rtl" }}>
          مركز الفيصل الطبي
        </div>
        <div style={{ color: C.silver, fontSize: isPortrait ? 12 : 10, fontFamily: "sans-serif", letterSpacing: 1 }}>
          Al Faisal Medical Center
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Compositions ─────────────────────────────────────────────────────────
const OlderPersonsBase: React.FC<{ isPortrait: boolean }> = ({ isPortrait }) => (
  <AbsoluteFill style={{ background: C.navy }}>
    <Audio src={MUSIC} volume={0.12} />
    <Sequence from={MAIN_START}>
      <Audio src={NARR} volume={1} />
    </Sequence>

    {/* 1 – Intro */}
    <Sequence from={0} durationInFrames={INTRO_DUR + FADE}>
      <IntroCard isPortrait={isPortrait} />
    </Sequence>

    {/* 2 – Video section */}
    <Sequence from={MAIN_START} durationInFrames={MAIN_DUR + FADE}>
      {isPortrait ? <VideoSectionPortrait /> : <VideoSectionLandscape />}
    </Sequence>

    {/* Header + footer over video */}
    <Sequence from={MAIN_START} durationInFrames={MAIN_DUR}>
      <AbsoluteFill style={{ zIndex: 20 }}>
        <Header isPortrait={isPortrait} />
        {isPortrait && <FooterBar isPortrait />}
      </AbsoluteFill>
    </Sequence>

    {/* 3 – Outro */}
    <Sequence from={OUTRO_START} durationInFrames={OUTRO_DUR}>
      <OutroCard isPortrait={isPortrait} />
    </Sequence>
  </AbsoluteFill>
);

export const OlderPersonsPortrait:  React.FC = () => <OlderPersonsBase isPortrait />;
export const OlderPersonsLandscape: React.FC = () => <OlderPersonsBase isPortrait={false} />;
