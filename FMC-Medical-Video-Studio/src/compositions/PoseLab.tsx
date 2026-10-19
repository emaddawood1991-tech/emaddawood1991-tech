import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Doctor} from '../components/Doctor/Doctor';
import {armIK, neutralPose} from '../components/Doctor/skeleton';
import {BG_GRADIENT} from '../styles/theme';

/** Pose study (stills only): several arm solutions side by side. Variants come from env-free constants below. */
export const POSE_VARIANTS: {side: 'L' | 'R'; target: [number, number, number]; pole: [number, number, number]; euler: [number, number, number]; shape?: {curl: number[]; spread: number}; label?: string}[] = [];
const Rig: React.FC = () => { const {camera} = useThree(); camera.position.set(0, 1.35, 9.0); camera.lookAt(0, 1.3, 0); (camera as THREE.PerspectiveCamera).fov = 36; camera.updateProjectionMatrix(); return null; };
export const PoseLab: React.FC<{variants?: typeof POSE_VARIANTS}> = ({variants = POSE_VARIANTS}) => (
  <AbsoluteFill style={{background: BG_GRADIENT}}>
    <ThreeCanvas width={1080} height={1920} camera={{fov: 36, position: [0, 1.25, 5.2]}} gl={{antialias: true, alpha: true}}>
      <Rig />
      <hemisphereLight args={['#d7e8ff', '#15263c', 1.0]} />
      <directionalLight position={[2.5, 3.8, 3.5]} intensity={2.4} color="#fff0de" />
      <directionalLight position={[0, 1, 4]} intensity={0.6} color="#ffffff" />
      {variants.map((v, i) => {
        const pose = neutralPose();
        pose.arms[v.side] = armIK(v.side, new THREE.Vector3(...v.target), new THREE.Vector3(...v.pole), v.euler, v.shape ?? {curl: [0.12, 0.1, 0.1, 0.12, 0.16], spread: 0.28});
        if (v.label === 'cup') pose.hold = {side: v.side, amount: 1, tilt: 0};
        const n = variants.length, x = (i - (n - 1) / 2) * 0.75;
        return <group key={i} position={[x, 0, 0]}><Doctor pose={pose} time={0} /></group>;
      })}
    </ThreeCanvas>
  </AbsoluteFill>
);
