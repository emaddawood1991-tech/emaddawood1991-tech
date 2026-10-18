import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';

export type CamKey = {f: number; pos: [number, number, number]; target: [number, number, number]; fov?: number};

const lerp3 = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t) as [number, number, number];

export const sampleCamera = (keys: CamKey[], frame: number) => {
  if (frame <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (frame >= a.f && frame <= b.f) {
      const t = Easing.inOut(Easing.cubic)((frame - a.f) / (b.f - a.f));
      return {f: frame, pos: lerp3(a.pos, b.pos, t), target: lerp3(a.target, b.target, t), fov: (a.fov ?? 35) + ((b.fov ?? 35) - (a.fov ?? 35)) * t};
    }
  }
  return keys[keys.length - 1];
};

const Rig: React.FC<{keys: CamKey[]}> = ({keys}) => {
  const frame = useCurrentFrame();
  const {camera} = useThree();
  const c = sampleCamera(keys, frame);
  camera.position.set(...c.pos);
  (camera as import('three').PerspectiveCamera).fov = c.fov ?? 35;
  camera.lookAt(...c.target);
  camera.updateProjectionMatrix();
  return null;
};

/** Studio lighting rig + keyframed camera. Transparent background so the HUD shows through. */
export const ThreeStage: React.FC<{camera: CamKey[]; children: React.ReactNode; width: number; height: number; style?: React.CSSProperties}> = ({camera, children, width, height, style}) => {
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height, ...style}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 35, near: 0.1, far: 400, position: camera[0].pos}} gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}}>
        <Rig keys={camera} />
        <hemisphereLight args={['#BFD9F2', '#102A43', 0.9]} />
        <directionalLight position={[30, 40, 35]} intensity={2.4} color="#FFF4E6" />
        <directionalLight position={[-35, 10, -25]} intensity={1.6} color="#00A6A6" />
        <directionalLight position={[0, -20, 30]} intensity={0.5} color="#9CC7F0" />
        {children}
      </ThreeCanvas>
    </div>
  );
};

export const useStageTime = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
};

export {interpolate};
