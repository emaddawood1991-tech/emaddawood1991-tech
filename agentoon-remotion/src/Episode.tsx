import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import type { Episode as EpisodeT } from "./types";
import { hasTransitionAfter, sceneFrames, transitionFrames } from "./timing";
import { LayerView } from "./layers/LayerView";
import { Captions } from "./Captions";
import { loadEpisodeFonts } from "./fonts";

const SceneView: React.FC<{ scene: EpisodeT["scenes"][number]; frames: number }> = ({ scene, frames }) => (
  <AbsoluteFill style={{ background: scene.background }}>
    {scene.layers.map((l) => (
      <LayerView key={l.id} layer={l} sceneFrames={frames} />
    ))}
  </AbsoluteFill>
);

// Instagram/TikTok UI-safe area: top 250, bottom 340, sides 60
const SafeArea: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", inset: "250px 60px 340px 60px", border: "4px dashed rgba(255,0,80,.8)" }} />
  </AbsoluteFill>
);

export const Episode: React.FC<EpisodeT> = (episode) => {
  const frame = useCurrentFrame();
  void frame;
  loadEpisodeFonts(episode.fonts);
  const tf = transitionFrames(episode);
  const captionFont = episode.fonts?.[0]?.family ?? "system-ui, sans-serif";

  const children: React.ReactNode[] = [];
  episode.scenes.forEach((scene, i) => {
    const frames = sceneFrames(episode, i);
    children.push(
      <TransitionSeries.Sequence key={`s-${scene.id}`} durationInFrames={frames}>
        <SceneView scene={scene} frames={frames} />
      </TransitionSeries.Sequence>,
    );
    if (hasTransitionAfter(episode, i)) {
      children.push(
        <TransitionSeries.Transition
          key={`t-${scene.id}`}
          presentation={
            scene.transition === "slideUp" ? slide({ direction: "from-bottom" }) : fade()
          }
          timing={linearTiming({ durationInFrames: tf })}
        />,
      );
    }
  });

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <TransitionSeries>{children}</TransitionSeries>
      {episode.captions && <Captions captions={episode.captions} family={captionFont} />}
      {episode.audio?.narration && <Audio src={staticFile(episode.audio.narration)} />}
      {episode.audio?.music && (
        <Audio src={staticFile(episode.audio.music)} volume={episode.audio.musicVolume ?? 0.12} loop />
      )}
      {episode.debug && <SafeArea />}
    </AbsoluteFill>
  );
};
