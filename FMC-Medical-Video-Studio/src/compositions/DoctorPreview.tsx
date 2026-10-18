import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {BG_GRADIENT} from '../styles/theme';
import {Doctor} from '../components/Doctor/Doctor';
import {neutralPose} from '../components/Doctor/skeleton';
import {loadFonts} from '../styles/fonts';

export const DoctorPreview: React.FC<{cam?: [number, number, number]; target?: [number, number, number]; fov?: number; yaw?: number}> = ({cam = [0, 1.2, 4.6], target = [0, 1.0, 0], fov = 32, yaw = 0}) => {
  loadFonts();
  const pose = neutralPose();
  pose.root.yaw = yaw;
  return (
    <AbsoluteFill style={{background: BG_GRADIENT}}>
      <ThreeCanvas width={1080} height={1920} camera={{fov, position: cam, near: 0.1, far: 50}} onCreated={({camera}) => camera.lookAt(...target)} gl={{antialias: true, alpha: true}}>
        <hemisphereLight args={['#cfe3ff', '#1a2a40', 0.9]} />
        <directionalLight position={[2, 3.5, 3.5]} intensity={2.3} color="#fff1e0" />
        <directionalLight position={[-3, 2, -2]} intensity={1.4} color="#4fd0d0" />
        <Doctor pose={pose} time={0} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
