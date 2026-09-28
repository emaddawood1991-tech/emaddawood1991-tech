import React from "react";
import {
  AbsoluteFill, Audio, Img, OffthreadVideo, Sequence,
  interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

// ─── Timing ───────────────────────────────────────────────────────────────
const FPS       = 30;
const s         = (sec: number) => Math.round(sec * FPS);
const INTRO_DUR = s(2.5);   // 75f  – logo reveal + event title
const NARR_DUR  = s(18.4);  // 552f – voiceover length
const MAIN_DUR  = NARR_DUR + s(1); // +1s buffer after narration
const OUTRO_DUR = s(7);     // 210f – CTA / contact card
export const totalFrames = INTRO_DUR + MAIN_DUR + OUTRO_DUR; // 837 ≈ 28s
const MAIN_START  = INTRO_DUR;
const OUTRO_START = MAIN_START + MAIN_DUR;
const FADE        = 15; // 0.5s crossfade

// ─── Colours ──────────────────────────────────────────────────────────────
const C = {
  navy:     "#061322",
  blue:     "#0D3370",
  midBlue:  "#1A5496",
  teal:     "#00C9C8",
  tealDim:  "rgba(0,201,200,0.25)",
  gold:     "#D4A843",
  goldLight:"#F5D77E",
  white:    "#FFFFFF",
  offWhite: "#EEE8DF",
  silver:   "#98AEC2",
  overlay:  "rgba(6,19,34,0.68)",
};

// ─── Assets ───────────────────────────────────────────────────────────────
const VIDEO = staticFile("videos/older-persons-clip.mp4");
const LOGO  = staticFile("images/older-persons-logo.webp");
const NARR  = staticFile("audio/older-persons-narration.wav");
const MUSIC = staticFile("audio/older-persons-music.mp3");

// ─── Messages (synced to 3 phases of 18s narration) ───────────────────────
const MSGS = [
  { ar: "نُقدّر كبارنا ونحتفي بهم",         en: "We honour and celebrate our elders",        start: 0        },
  { ar: "صحتهم أمانة في أعناقنا",           en: "Their health is our responsibility",         start: s(6.3)   },
  { ar: "رعاية شاملة بكل محبة واحترام",     en: "Comprehensive care with love & respect",     start: s(12.5)  },
];

// ─── Shared primitives ────────────────────────────────────────────────────

const Logo: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <Img src={LOGO} style={{ width: size, height: size, objectFit: "contain" }} />
);

function useFade(from = 0, to = FADE) {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

// ─── Header (persistent during video section) ─────────────────────────────
const Header: React.FC<{ isPortrait: boolean }> = ({ isPortrait }) => {
  const op = useFade(0, 12);
  const h  = isPortrait ? 88 : 68;
  const ls = isPortrait ? 56 : 44;
  const ts = isPortrait ? 18 : 14;
  const ss = isPortrait ? 11 : 9;
  const px = isPortrait ? 28 : 22;
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: h, zIndex: 20,
      display: "flex", alignItems: "center", gap: 12, padding: `0 ${px}px`,
      background: "linear-gradient(to bottom, rgba(6,19,34,0.92) 0%, transparent 100%)",
      opacity: op,
    }}>
      <Logo size={ls} />
      <div>
        <div style={{ color: C.white, fontSize: ts, fontWeight: 700, fontFamily: "sans-serif", direction: "rtl" }}>
          مركز الفيصل الطبي
        </div>
        <div style={{ color: C.teal, fontSize: ss, fontFamily: "sans-serif", letterSpacing: 0.8 }}>
          Al Faisal Medical Center
        </div>
      </div>
    </div>
  );
};

// ─── Footer bar ───────────────────────────────────────────────────────────
const FooterBar: React.FC<{ isPortrait: boolean }> = ({ isPortrait }) => {
  const h  = isPortrait ? 54 : 44;
  const fs = isPortrait ? 12 : 10;
  const px = isPortrait ? 28 : 22;
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, height: h, zIndex: 20,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: `0 ${px}px`,
      background: `linear-gradient(90deg, ${C.navy} 0%, ${C.blue} 50%, ${C.navy} 100%)`,
      borderTop: `1.5px solid ${C.teal}`,
    }}>
      <div style={{ color: C.teal, fontSize: fs, fontFamily: "sans-serif" }}>Al Faisal Medical Center</div>
      <div style={{ color: C.white, fontSize: fs, fontFamily: "sans-serif", direction: "rtl" }}>مركز الفيصل الطبي</div>
    </div>
  );
};

// ─── Intro card ───────────────────────────────────────────────────────────
const IntroCard: React.FC<{ isPortrait: boolean }> = ({ isPortrait }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSc  = spring({ frame,        fps, config: { damping: 18 } });
  const titleSc = spring({ frame: frame - 16, fps, config: { damping: 22 } });
  const subOp   = spring({ frame: frame - 32, fps, config: { damping: 20 } });

  const titleY  = interpolate(titleSc, [0, 1], [60, 0]);
  const titleOp = interpolate(titleSc, [0, 1], [0, 1]);

  const ls = isPortrait ? 130 : 100;
  const ringSize = isPortrait ? 320 : 250;

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 40%, ${C.midBlue} 0%, ${C.navy} 70%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: isPortrait ? 28 : 20,
    }}>
      {/* Decorative rings */}
      {[1, 0.5, 0.25].map((op, i) => (
        <div key={i} style={{
          position: "absolute",
          width: ringSize + i * 60, height: ringSize + i * 60,
          border: `1px solid ${C.gold}`,
          borderRadius: "50%", opacity: op * 0.18,
        }} />
      ))}

      {/* Logo */}
      <div style={{ transform: `scale(${logoSc})`, filter: "drop-shadow(0 4px 24px rgba(0,201,200,0.35))" }}>
        <Logo size={ls} />
      </div>

      {/* Event badge + title */}
      <div style={{ transform: `translateY(${titleY}px)`, opacity: titleOp, textAlign: "center", padding: "0 48px" }}>
        {/* Gold pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16,
          background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldLight} 50%, ${C.gold} 100%)`,
          borderRadius: 50, padding: isPortrait ? "10px 30px" : "8px 24px",
        }}>
          <span style={{ fontSize: isPortrait ? 20 : 16 }}>🌿</span>
          <span style={{
            color: C.navy, fontWeight: 800, fontSize: isPortrait ? 16 : 13,
            fontFamily: "sans-serif", direction: "rtl",
          }}>
            1 أكتوبر  ·  October 1
          </span>
        </div>

        {/* Arabic title */}
        <div style={{
          color: C.white, fontSize: isPortrait ? 40 : 32, fontWeight: 800,
          fontFamily: "sans-serif", direction: "rtl", lineHeight: 1.3,
          textShadow: "0 2px 24px rgba(0,0,0,0.55)",
        }}>
          يوم المسن العالمي
        </div>

        {/* English subtitle */}
        <div style={{
          color: C.offWhite, fontSize: isPortrait ? 18 : 14,
          fontFamily: "sans-serif", letterSpacing: 1.5, marginTop: 10,
          opacity: subOp,
        }}>
          International Day of Older Persons
        </div>

        {/* Teal line */}
        <div style={{
          margin: "18px auto 0",
          width: isPortrait ? 160 : 120, height: 2,
          background: `linear-gradient(90deg, transparent, ${C.teal}, transparent)`,
          opacity: subOp,
        }} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Animated message text ─────────────────────────────────────────────────
const FloatingMessage: React.FC<{ ar: string; en: string; delay?: number; isPortrait: boolean }> =
  ({ ar, en, delay = 0, isPortrait }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame: frame - delay, fps, config: { damping: 22 } });
  const y  = interpolate(sc, [0, 1], [40, 0]);
  const op = interpolate(sc, [0, 1], [0, 1]);
  return (
    <div style={{ transform: `translateY(${y}px)`, opacity: op, textAlign: "center" }}>
      <div style={{
        color: C.white, fontSize: isPortrait ? 28 : 22, fontWeight: 700,
        fontFamily: "sans-serif", direction: "rtl", lineHeight: 1.5,
        textShadow: "0 2px 16px rgba(0,0,0,0.85)",
      }}>{ar}</div>
      <div style={{
        color: C.teal, fontSize: isPortrait ? 15 : 12,
        fontFamily: "sans-serif", letterSpacing: 0.8, marginTop: 6,
        textShadow: "0 1px 8px rgba(0,0,0,0.7)",
      }}>{en}</div>
    </div>
  );
};

// ─── Portrait video section (full-screen video + text overlay) ─────────────
const VideoSectionPortrait: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, FADE], [0, 1], { extrapolateRight: "clamp" });
  const kbScale = interpolate(frame, [0, MAIN_DUR], [1.0, 1.08]);

  const activeIdx = MSGS.reduce((a, m, i) => frame >= m.start ? i : a, 0);

  return (
    <AbsoluteFill>
      {/* Video background */}
      <AbsoluteFill style={{ overflow: "hidden", opacity: fadeIn }}>
        <OffthreadVideo
          src={VIDEO}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kbScale})` }}
          muted
        />
      </AbsoluteFill>

      {/* Gradient overlay */}
      <AbsoluteFill style={{
        background: `linear-gradient(to bottom,
          rgba(6,19,34,0.75) 0%,
          rgba(6,19,34,0.25) 35%,
          rgba(6,19,34,0.30) 60%,
          rgba(6,19,34,0.80) 100%)`,
        opacity: fadeIn,
      }} />

      {/* Teal accent line above text */}
      <div style={{
        position: "absolute", bottom: 185, left: "18%", right: "18%",
        height: 2, background: `linear-gradient(90deg, transparent, ${C.teal}, transparent)`,
        opacity: 0.8,
      }} />

      {/* Text block */}
      <div style={{
        position: "absolute", bottom: 110, left: 0, right: 0,
        display: "flex", justifyContent: "center", padding: "0 48px",
      }}>
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
  const fadeIn = interpolate(frame, [0, FADE], [0, 1], { extrapolateRight: "clamp" });

  const activeIdx = MSGS.reduce((a, m, i) => frame >= m.start ? i : a, 0);

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      {/* Right: video panel (60%) */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: "60%", overflow: "hidden",
      }}>
        <OffthreadVideo
          src={VIDEO}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
        />
        {/* subtle right-side vignette to blend with left panel */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to left, transparent 60%, rgba(6,19,34,0.8) 100%)",
        }} />
      </div>

      {/* Left: info panel (40%) */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "42%",
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.blue} 100%)`,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "80px 36px 56px 36px", gap: 22,
        borderRight: `2px solid ${C.teal}`,
      }}>
        {/* Logo */}
        <Logo size={58} />

        {/* Gold pill */}
        <div style={{
          display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 8,
          background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldLight} 100%)`,
          borderRadius: 50, padding: "7px 20px",
        }}>
          <span style={{ fontSize: 14 }}>🌿</span>
          <span style={{ color: C.navy, fontWeight: 800, fontSize: 12, fontFamily: "sans-serif", direction: "rtl" }}>
            1 أكتوبر · October 1
          </span>
        </div>

        {/* Event title */}
        <div>
          <div style={{
            color: C.white, fontSize: 30, fontWeight: 800,
            fontFamily: "sans-serif", direction: "rtl", lineHeight: 1.35,
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}>
            يوم المسن العالمي
          </div>
          <div style={{ color: C.silver, fontSize: 12, fontFamily: "sans-serif", letterSpacing: 1, marginTop: 6 }}>
            International Day of Older Persons
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 100, height: 2, background: `linear-gradient(90deg, ${C.teal}, transparent)` }} />

        {/* Rotating message */}
        <div style={{ minHeight: 80 }}>
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

// ─── Outro / CTA card ─────────────────────────────────────────────────────
const OutroCard: React.FC<{ isPortrait: boolean }> = ({ isPortrait }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOp    = spring({ frame,        fps, config: { damping: 20 } });
  const logoSc  = spring({ frame: frame - 8,  fps, config: { damping: 18 } });
  const msgOp   = spring({ frame: frame - 20, fps, config: { damping: 18 } });
  const infoOp  = spring({ frame: frame - 36, fps, config: { damping: 18 } });

  const ls = isPortrait ? 110 : 85;

  const ContactRow: React.FC<{ icon: string; text: string; color?: string }> = ({ icon, text, color }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: "rgba(255,255,255,0.05)", borderRadius: 14,
      padding: isPortrait ? "14px 28px" : "10px 22px",
      border: `1px solid ${C.tealDim}`,
    }}>
      <span style={{ fontSize: isPortrait ? 22 : 18 }}>{icon}</span>
      <span style={{
        color: color ?? C.white, fontSize: isPortrait ? 19 : 15,
        fontFamily: "sans-serif", fontWeight: 600, letterSpacing: 0.5,
      }}>{text}</span>
    </div>
  );

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 30%, ${C.blue} 0%, ${C.navy} 65%)`,
      opacity: bgOp,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: isPortrait ? 26 : 18,
    }}>
      {/* Decorative circles */}
      {[280, 360, 440].map((d, i) => (
        <div key={i} style={{
          position: "absolute",
          width: isPortrait ? d : d * 0.75, height: isPortrait ? d : d * 0.75,
          border: `1px solid ${C.gold}`, borderRadius: "50%",
          opacity: 0.08 * (3 - i),
        }} />
      ))}

      {/* Logo */}
      <div style={{
        transform: `scale(${logoSc})`,
        filter: "drop-shadow(0 4px 28px rgba(0,201,200,0.4))",
      }}>
        <Logo size={ls} />
      </div>

      {/* Closing message */}
      <div style={{ opacity: msgOp, textAlign: "center", padding: "0 48px" }}>
        <div style={{
          color: C.gold, fontSize: isPortrait ? 23 : 18, fontWeight: 700,
          fontFamily: "sans-serif", direction: "rtl",
        }}>
          مع تمنياتنا بصحة وسعادة دائمة
        </div>
        <div style={{ color: C.offWhite, fontSize: isPortrait ? 14 : 11, fontFamily: "sans-serif", marginTop: 5 }}>
          Wishing you health and happiness always
        </div>
      </div>

      {/* Gold divider */}
      <div style={{
        opacity: msgOp,
        width: isPortrait ? 180 : 140, height: 1,
        background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
      }} />

      {/* Contact info */}
      <div style={{
        opacity: infoOp, display: "flex", flexDirection: "column",
        alignItems: "center", gap: isPortrait ? 12 : 9,
      }}>
        <ContactRow icon="📞" text="+971 3 754 8881" />
        <ContactRow icon="🌐" text="www.fmc-uae.ae" color={C.teal} />
      </div>

      {/* FMC name */}
      <div style={{ opacity: infoOp, textAlign: "center" }}>
        <div style={{ color: C.white, fontSize: isPortrait ? 16 : 13, fontFamily: "sans-serif", direction: "rtl" }}>
          مركز الفيصل الطبي
        </div>
        <div style={{ color: C.silver, fontSize: isPortrait ? 11 : 9, fontFamily: "sans-serif", letterSpacing: 1 }}>
          Al Faisal Medical Center
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Compositions ─────────────────────────────────────────────────────────

const OlderPersonsBase: React.FC<{ isPortrait: boolean }> = ({ isPortrait }) => (
  <AbsoluteFill style={{ background: C.navy }}>
    {/* Audio: background music full length */}
    <Audio src={MUSIC} volume={0.12} />

    {/* Audio: narration starts with main section */}
    <Sequence from={MAIN_START}>
      <Audio src={NARR} volume={1} />
    </Sequence>

    {/* 1 ── Intro */}
    <Sequence from={0} durationInFrames={INTRO_DUR + FADE}>
      <IntroCard isPortrait={isPortrait} />
    </Sequence>

    {/* 2 ── Video section */}
    <Sequence from={MAIN_START} durationInFrames={MAIN_DUR + FADE}>
      {isPortrait
        ? <VideoSectionPortrait />
        : <VideoSectionLandscape />}
    </Sequence>

    {/* Header + footer (overlay during video section) */}
    <Sequence from={MAIN_START} durationInFrames={MAIN_DUR}>
      <AbsoluteFill style={{ zIndex: 20 }}>
        <Header isPortrait={isPortrait} />
        {isPortrait && <FooterBar isPortrait />}
      </AbsoluteFill>
    </Sequence>

    {/* 3 ── Outro */}
    <Sequence from={OUTRO_START} durationInFrames={OUTRO_DUR}>
      <OutroCard isPortrait={isPortrait} />
    </Sequence>
  </AbsoluteFill>
);

export const OlderPersonsPortrait:  React.FC = () => <OlderPersonsBase isPortrait />;
export const OlderPersonsLandscape: React.FC = () => <OlderPersonsBase isPortrait={false} />;
