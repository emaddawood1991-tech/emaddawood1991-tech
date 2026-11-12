import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {OVERLAY_CAM, SciaticaOverlay} from '../components/Medical3D/SciaticaOverlay';

/** Study still: overlay calibration over the stock back view. Props: {bones,nerves,orange,red,sec} */
export const SciaticaOverlayStudy: React.FC<{bones?: number; nerves?: number; orange?: number; red?: number; sec?: number}> = ({bones = 1, nerves = 1, orange = 1, red = 1, sec = 1}) => (
  <AbsoluteFill style={{background: '#111'}}>
    <AbsoluteFill><OffthreadVideo src={staticFile('footage/sciatica/back_standing.mp4')} muted startFrom={Math.round(sec * 30)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /></AbsoluteFill>
    <AbsoluteFill style={{zIndex: 5}}>
      <ThreeCanvas width={1080} height={1920} camera={OVERLAY_CAM} gl={{antialias: true, alpha: true}} onCreated={({camera}) => camera.lookAt(540, 960, 0)}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[300, 1200, 800]} intensity={1.4} />
        <SciaticaOverlay st={{bones, nerves, orange, red, pulse: 0.5}} />
      </ThreeCanvas>
    </AbsoluteFill>
  </AbsoluteFill>
);
