import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING, theme } from "./theme";
import { clamp, easeInOutCubic } from "./math";

/** /ui-depth-reel: an ordinary software screen recording lifts into a real CSS-3D scene: perspective tilt, layered card copies behind, floating UI panels cropped from
 *  the same UI in front, and a camera that moves THROUGH the depth with parallax. `lift` = frame when the flat screen starts lifting. */
export type DepthPanel = { src: string; crop: [number, number, number, number]; /* x,y,w,h in source px */ srcW: number; srcH: number; x: number; y: number; z: number; w: number; label?: string; at: number };
export type UiDepthProps = { video: string; videoW?: number; videoH?: number; lift?: number; liftDur?: number; panels: DepthPanel[]; startFrom?: number };
const WW = 900;
export const UiDepthReel: React.FC<UiDepthProps> = ({ video, videoW = 1280, videoH = 800, lift = 24, liftDur = 36, panels, startFrom = 0 }) => {
  const frame = useCurrentFrame(); const { fps, durationInFrames } = useVideoConfig();
  const L = easeInOutCubic(clamp((frame - lift) / liftDur)); // 0 = flat original, 1 = full depth scene
  const T = clamp((frame - lift) / (durationInFrames - lift)); // camera journey progress after lift
  const h = (WW * videoH) / videoW;
  // camera: starts flat & frontal, then orbit + dolly THROUGH the panels
  const camRY = L * (-24 + 44 * easeInOutCubic(T)), camRX = L * (12 - 8 * T), camZ = L * (-120 + 520 * easeInOutCubic(T)), camX = L * (60 - 120 * T);
  const flatScale = 1.2 - 0.2 * L; // the flat screen fills the width at the start
  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 70% at 50% 30%, #1B2130 0%, #0B0D12 75%)", overflow: "hidden", perspective: 1500, perspectiveOrigin: "50% 45%" }}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translate3d(${camX}px, 0, ${camZ}px) rotateX(${camRX}deg) rotateY(${camRY}deg) scale(${flatScale})` }}>
        {/* far depth plane: grid */}
        <div style={{ position: "absolute", left: -600, top: -300, width: 2280, height: 2500, transform: `translateZ(${-520 * L}px)`, opacity: L, backgroundImage: "linear-gradient(rgba(200,240,49,.10) 2px, transparent 2px), linear-gradient(90deg, rgba(200,240,49,.10) 2px, transparent 2px)", backgroundSize: "110px 110px" }} />
        {/* layered copies of the screen behind (depth stack) */}
        {[3, 2, 1].map((i) => <div key={i} style={{ position: "absolute", left: 90, top: 520, width: WW, height: h, borderRadius: 22, transform: `translateZ(${-i * 70 * L}px) translate(${i * 26 * L}px, ${-i * 22 * L}px)`, background: i === 1 ? "#161A22" : "#10131A", border: `3px solid ${i === 1 ? "#3A4152" : "#2A3040"}`, opacity: 0.9 * L }} />)}
        {/* the real screen recording (main plane) */}
        <div style={{ position: "absolute", left: 90, top: 520, width: WW, height: h, borderRadius: 22, overflow: "hidden", border: `${3 + 3 * L}px solid ${L > 0.5 ? theme.lime : "#E9EBEF"}`, boxShadow: `0 ${40 * L}px ${80 * L}px rgba(0,0,0,.6)`, background: "#fff" }}>
          <OffthreadVideo src={staticFile(video)} startFrom={startFrom} muted style={{ width: WW, height: h, objectFit: "cover" }} />
        </div>
        {/* floating UI panels cropped from the same interface, at different depths (parallax) */}
        {panels.map((p, i) => {
          const s = spring({ frame: frame - (lift + p.at), fps, config: SPRING.pop }); const sc = p.w / p.crop[2]; const hh = p.crop[3] * sc;
          return (
            <div key={i} style={{ position: "absolute", left: p.x, top: p.y, width: p.w, height: hh, transform: `translateZ(${p.z * s}px) translateY(${(1 - s) * 80}px) rotateY(${(1 - s) * -30}deg)`, opacity: clamp(s * 2) * L, borderRadius: 18, overflow: "hidden", border: `3px solid ${theme.lime}`, boxShadow: "0 30px 60px rgba(0,0,0,.55), 0 0 30px rgba(200,240,49,.25)", background: "#fff" }}>
              <Img src={staticFile(p.src)} style={{ position: "absolute", left: -p.crop[0] * sc, top: -p.crop[1] * sc, width: p.srcW * sc, height: p.srcH * sc, maxWidth: "none" }} />
              {p.label && <div style={{ position: "absolute", left: 0, bottom: 0, background: theme.lime, color: "#0F1115", fontFamily: theme.mono, fontWeight: 800, fontSize: 26, padding: "4px 12px" }}>{p.label}</div>}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
