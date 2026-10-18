import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BG_GRADIENT} from '../styles/theme';
import {AnatomyViewer} from '../components/AnatomyViewer';
import {SPINE_CENTER, L45_FOCUS} from '../components/Medical3D';

/** Developer composition to inspect the 3D model quickly (Studio: "AnatomyPreview"). */
export const AnatomyPreview: React.FC<{pos?: [number, number, number]; focus?: boolean; muscles?: boolean; fov?: number}> = ({pos = [48, 8, 40], focus = false, muscles = false, fov = 34}) => {
  const target = focus ? L45_FOCUS : SPINE_CENTER;
  return (
    <AbsoluteFill style={{background: BG_GRADIENT}}>
      <AnatomyViewer camera={[{f: 0, pos, target, fov}]} width={1080} height={1920} state={{bulge: [0, 1], glow: [0, 1], nerveGlow: [0, 1], showMuscles: muscles}} />
    </AbsoluteFill>
  );
};
