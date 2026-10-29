import React from "react";
import { AbsoluteFill, Audio, Composition, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";

// 120 s, 3,600 frames, 30 fps, 3840x2160. `public/scenes/S01..S09.mp4` hold the Blender renders per scene
// (render_scenes.py writes them); transitions, titles and the concept disclaimer are composed here.
const FPS = 30;
const SCENES: [string, number, number][] = [
  ["S01", 0, 360], ["S02", 360, 480], ["S03", 840, 420], ["S04", 1260, 450], ["S05", 1710, 360],
  ["S06", 2070, 480], ["S07", 2550, 420], ["S08", 2970, 420], ["S09", 3390, 210],
];

const Fade: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8, len - 8, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const Title: React.FC = () => {
  const f = useCurrentFrame();
  const t = (s: number, e: number) => interpolate(f, [s, s + 42, e - 30, e], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: "Georgia, serif" }}>
      <div style={{ opacity: t(3420 - 0, 3580), color: "#F2E3C6", fontSize: 150, letterSpacing: 18, textShadow: "0 4px 24px rgba(0,0,0,.55)", marginTop: -140 }}>DUBAI AZURE TOWER</div>
      <div style={{ opacity: t(3444, 3580), color: "#fff", fontSize: 52, letterSpacing: 8, marginTop: 28, fontFamily: "Helvetica, Arial, sans-serif" }}>A Conceptual Architectural Vision</div>
    </AbsoluteFill>
  );
};

const Disclaimer: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 56, fontFamily: "Helvetica, Arial, sans-serif" }}>
    <div style={{ color: "rgba(255,255,255,.78)", fontSize: 30, letterSpacing: 3, textShadow: "0 2px 6px rgba(0,0,0,.6)" }}>
      FICTIONAL ARCHITECTURAL CONCEPT - NOT APPROVED - NOT BUILT - NOT FOR SALE
    </div>
  </AbsoluteFill>
);

export const AzureTower: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {SCENES.map(([id, from, len]) => (
      <Sequence key={id} from={from} durationInFrames={len}>
        <Fade len={len}>
          <OffthreadVideo src={staticFile(`scenes/${id}.mp4`)} style={{ width: "100%", height: "100%" }} muted />
        </Fade>
      </Sequence>
    ))}
    <Disclaimer />
    <Title />
    <Audio src={staticFile("azure_score.wav")} />
  </AbsoluteFill>
);

export const Root: React.FC = () => (
  <Composition id="AzureTower" component={AzureTower} durationInFrames={3600} fps={FPS} width={3840} height={2160} />
);
