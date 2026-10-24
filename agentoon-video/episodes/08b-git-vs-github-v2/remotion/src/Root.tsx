import React from "react";
import {Composition} from "remotion";
import {Timeline, TimelineProps} from "./Timeline";
import props from "./props.json";

const FPS = 30;
export const Root: React.FC = () => (
  <>
    <Composition id="GitTimelineA" component={Timeline} width={1000} height={620} fps={FPS}
      durationInFrames={Math.round(props.A.dur * FPS)} defaultProps={props.A as unknown as TimelineProps} />
    <Composition id="GitTimelineB" component={Timeline} width={1000} height={620} fps={FPS}
      durationInFrames={Math.round(props.B.dur * FPS)} defaultProps={props.B as unknown as TimelineProps} />
  </>
);
