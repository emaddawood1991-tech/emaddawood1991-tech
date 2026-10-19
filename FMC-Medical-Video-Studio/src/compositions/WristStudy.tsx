import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {BG_GRADIENT} from '../styles/theme';
import {AxialSection, WristHandModel, defaultWristState, type WristState} from '../components/Medical3D';
import {DIRECTOR_STYLES} from '../lib/directorStyles';

/** Model study (stills only): frame selects a configuration of the wrist/hand model. */
const CONFIGS: Partial<WristState>[] = [
  {skin: 1, bones: 0, tendons: 0, ligament: 0, nerve: 0},                                                                       // 0 skin only
  {skin: 0.12, bones: 1, tendons: 1, ligament: 1, nerve: 1, nerveGlow: 0.8},                                                       // 30 anatomy
  {skin: 0, bones: 1, tendons: 1, ligament: 0.35, nerve: 1, nerveGlow: 1, compression: 1},                                          // 60 compression
  {skin: 1, bones: 0, tendons: 0, ligament: 0, nerve: 0, sensory: 1, tingle: 1},                                                  // 90 sensory zone
  {skin: 1, bones: 0, tendons: 0, ligament: 0, nerve: 0, splint: 1},                                                              // 120 splint
  {skin: 0.25, bones: 1, tendons: 1, ligament: 1, nerve: 1, flex: 0.5, nerveGlow: 0.6, compression: 1},                            // 150 flexed
];
const Rig: React.FC<{pos: [number, number, number]; target: [number, number, number]}> = ({pos, target}) => {
  const {camera} = useThree();
  camera.position.set(...pos); camera.lookAt(...target); (camera as any).fov = 34; camera.updateProjectionMatrix();
  return null;
};
export const WristStudy: React.FC = () => {
  const frame = useCurrentFrame();
  const cfg = CONFIGS[Math.min(CONFIGS.length - 1, Math.floor(frame / 30))];
  const closeup = frame % 30 >= 15;
  const rig = DIRECTOR_STYLES.explainer3d.lighting;
  return (
    <AbsoluteFill style={{background: BG_GRADIENT}}>
      <ThreeCanvas width={1080} height={1920} camera={{fov: 34, position: [0, 4, 52], near: 0.1, far: 400}} gl={{antialias: true, alpha: true}}>
        <Rig pos={closeup ? [3, 1.5, 17] : [0, 2, 52]} target={closeup ? [0.8, 0.8, 0] : [0, 1, 0]} />
        <hemisphereLight args={[rig.hemi.sky, rig.hemi.ground, rig.hemi.intensity]} />
        {rig.lights.map((l, i) => <directionalLight key={i} position={[l.position[0] * 10, l.position[1] * 10, l.position[2] * 10]} intensity={l.intensity} color={l.color} />)}
        <group rotation={[0, 0.0, 0]}><WristHandModel {...defaultWristState()} {...cfg} time={frame / 30} /></group>
        {frame >= 60 && frame < 90 && <group position={[-9, 3, 1]} scale={1.3}><AxialSection compression={1} arrows={1} opacity={1} time={frame / 30} /></group>}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
