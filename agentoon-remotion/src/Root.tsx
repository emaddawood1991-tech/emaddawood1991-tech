import React from "react";
import { Composition } from "remotion";
import { Episode } from "./Episode";
import sample from "../episodes/sample/episode.json";
import type { Episode as EpisodeT } from "./types";
import { totalFrames } from "./timing";

export const Root: React.FC = () => (
  <Composition
    id="Episode"
    component={Episode}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={300}
    defaultProps={sample as unknown as EpisodeT}
    calculateMetadata={({ props }) => ({
      durationInFrames: totalFrames(props),
      fps: props.meta.fps,
      width: 1080,
      height: 1920,
    })}
  />
);
