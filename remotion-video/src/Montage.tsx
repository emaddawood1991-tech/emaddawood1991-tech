import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

// Add your video clips here.
// Place video files in the public/ folder, then reference them with staticFile().
export const CLIPS: MontageClip[] = [
  { src: staticFile("clip1.mp4"), durationInFrames: 90 },
  { src: staticFile("clip2.mp4"), durationInFrames: 90 },
  { src: staticFile("clip3.mp4"), durationInFrames: 90 },
];

// Frames for each crossfade transition between clips
export const TRANSITION_FRAMES = 20;

export type MontageClip = {
  src: string;
  durationInFrames: number;
};

// Total duration = sum of all clips + transitions between them
export const totalMontageFrames = (clips: MontageClip[]) =>
  clips.reduce((acc, c) => acc + c.durationInFrames, 0) +
  TRANSITION_FRAMES * Math.max(0, clips.length - 1);

// A single clip — fills the full frame, starts at the beginning of the clip
const ClipScene: React.FC<{ src: string }> = ({ src }) => {
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

// The montage — clips play in sequence with crossfade transitions
export const MontageVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        {CLIPS.map((clip, i) => (
          <>
            <TransitionSeries.Sequence
              key={`clip-${i}`}
              durationInFrames={clip.durationInFrames}
            >
              <ClipScene src={clip.src} />
            </TransitionSeries.Sequence>

            {i < CLIPS.length - 1 && (
              <TransitionSeries.Transition
                key={`transition-${i}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />
            )}
          </>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
