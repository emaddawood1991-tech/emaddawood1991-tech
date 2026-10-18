import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {LumbarSpine, ThreeStage, useStageTime, type CamKey} from '../Medical3D';

export type AnatomyState = {
  bulge?: [number, number]; // [startFrame, endFrame] ramp 0→1
  glow?: [number, number];
  nerveGlow?: [number, number];
  muscleGlow?: [number, number];
  showMuscles?: boolean;
  flexion?: (frame: number) => number;
  boneOpacity?: number;
};

const ramp = (frame: number, r?: [number, number]) => (r ? interpolate(frame, r, [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0);

/** Scene-level wrapper: one 3D stage showing a lumbar model driven by simple timelines. */
export const AnatomyViewer: React.FC<{camera: CamKey[]; width: number; height: number; state?: AnatomyState; style?: React.CSSProperties}> = ({camera, width, height, state = {}, style}) => {
  const frame = useCurrentFrame();
  const time = useStageTime();
  return (
    <ThreeStage camera={camera} width={width} height={height} style={style}>
      <LumbarSpine
        bulge={ramp(frame, state.bulge)}
        glow={ramp(frame, state.glow)}
        nerveGlow={ramp(frame, state.nerveGlow)}
        muscleGlow={ramp(frame, state.muscleGlow)}
        showMuscles={state.showMuscles}
        flexion={state.flexion ? state.flexion(frame) : 0}
        boneOpacity={state.boneOpacity ?? 1}
        time={time}
      />
    </ThreeStage>
  );
};
