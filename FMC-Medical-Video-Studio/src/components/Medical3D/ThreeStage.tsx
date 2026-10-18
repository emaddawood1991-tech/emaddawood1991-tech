import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';

import {sampleCameraFlow, type CamKey as FlowKey} from '../../lib/cameraFlow';
export type CamKey = FlowKey;

/** Continuous (non-stop-at-every-key) camera sampler — see src/lib/cameraFlow.ts. */
export const sampleCamera = (keys: CamKey[], frame: number) => sampleCameraFlow(keys, frame);

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
