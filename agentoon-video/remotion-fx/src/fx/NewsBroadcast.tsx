import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING, theme } from "./theme";
import { Seq, seqSrc } from "./subject";
import { clamp } from "./math";

/** /news-broadcast: studio-style broadcast layout around a presenter cutout: moving background graphics, animated lower third, headline banner, sliding info panels, ticker.
 *  It is a STYLE: the layout says STYLE DEMO and never shows "LIVE". */
export type NewsProps = { presenter: Seq; headline: string; name: string; role: string; panels: { k: string; v: string }[]; ticker: string; station?: string };
export const NewsBroadcast: React.FC<NewsProps> = ({ presenter, headline, name, role, panels, ticker, station = "AGENTOON NEWS" }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const bg = frame * 0.8; const hl = spring({ frame: frame - 14, fps, config: SPRING.settle }); const lt = spring({ frame: frame - 30, fps, config: SPRING.pop });
  const tick = -((frame * 5) % 2600);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg,#0A1B4D 0%,#0B2C6B 55%,#071433 100%)", fontFamily: theme.body, overflow: "hidden" }}>
      {/* live-style moving background graphics (studio set) */}
      <div style={{ position: "absolute", inset: -200, backgroundImage: "repeating-linear-gradient(115deg, rgba(255,255,255,.05) 0 70px, transparent 70px 140px)", transform: `translateX(${bg % 140}px)` }} />
      {[0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: 540 + Math.cos(frame / 40 + i * 2.1) * 360 - 260, top: 760 + Math.sin(frame / 50 + i * 1.7) * 260 - 260, width: 520, height: 520, borderRadius: "50%", border: `5px solid rgba(80,160,255,${0.28 - i * 0.06})` }} />)}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 150, background: "linear-gradient(#050B1C,#0B1840)", borderBottom: "5px solid #3D8BFF" }} />
      <div style={{ position: "absolute", left: 40, top: 40, display: "flex", alignItems: "center", gap: 20 }}><div style={{ background: "#3D8BFF", color: "#fff", fontWeight: 900, fontSize: 54, padding: "6px 22px", letterSpacing: ".04em" }}>{station}</div><div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 28, color: "#9fc3ff" }}>STYLE DEMO · NOT A LIVE BROADCAST</div></div>
      {/* presenter */}
      <div style={{ position: "absolute", left: 40, top: 330, width: 640, transform: `translateY(${(1 - lt) * 80}px)`, opacity: clamp(lt * 2), filter: "drop-shadow(0 30px 40px rgba(0,0,0,.5))" }}><Img src={staticFile(seqSrc(presenter, frame))} style={{ width: 640 }} /></div>
      {/* moving information panels */}
      {panels.map((p, i) => { const s = spring({ frame: frame - 44 - i * 10, fps, config: SPRING.pop }); const bob = Math.sin(frame / 20 + i) * 6; return <div key={i} style={{ position: "absolute", right: 36, top: 250 + i * 190 + bob, width: 360, height: 160, background: "rgba(5,11,28,.88)", border: "3px solid #3D8BFF", borderLeft: "14px solid #FFB23E", transform: `translateX(${(1 - s) * 420}px)`, padding: "16px 22px" }}><div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 28, color: "#9fc3ff" }}>{p.k}</div><div style={{ fontWeight: 900, fontSize: 56, color: "#fff", lineHeight: 1.1 }}>{p.v}</div></div>; })}
      {/* headline banner */}
      <div style={{ position: "absolute", left: 0, top: 1240, width: 1080, transform: `translateX(${(1 - hl) * -1100}px)` }}>
        <div style={{ background: "#D6202C", color: "#fff", fontWeight: 900, fontSize: 38, letterSpacing: ".08em", padding: "8px 28px", display: "inline-block" }}>BREAKING</div>
        <div style={{ background: "#fff", color: "#0A1B4D", fontWeight: 900, fontSize: 66, lineHeight: 1.08, padding: "20px 36px", textTransform: "uppercase" }}>{headline}</div>
      </div>
      {/* lower third */}
      <div style={{ position: "absolute", left: 40, top: 1000, width: 640, transform: `scaleX(${lt})`, transformOrigin: "0 50%" }}><div style={{ background: "#FFB23E", color: "#0A1B4D", fontWeight: 900, fontSize: 54, padding: "10px 26px" }}>{name}</div><div style={{ background: "#0A1B4D", color: "#fff", fontFamily: theme.mono, fontWeight: 800, fontSize: 30, padding: "8px 26px", border: "3px solid #FFB23E", borderTop: 0 }}>{role}</div></div>
      {/* ticker */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120, background: "#050B1C", borderTop: "5px solid #3D8BFF", overflow: "hidden", display: "flex", alignItems: "center" }}><div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 220, background: "#3D8BFF", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 40, color: "#fff" }}>UPDATES</div><div style={{ whiteSpace: "nowrap", fontWeight: 800, fontSize: 48, color: "#fff", transform: `translateX(${tick + 260}px)`, paddingLeft: 240 }}>{ticker}  ·  {ticker}  ·  {ticker}</div></div>
    </AbsoluteFill>
  );
};
