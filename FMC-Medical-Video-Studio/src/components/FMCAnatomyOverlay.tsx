import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {CornerBrackets, GuideLine, RingMarker, ScanLine} from './FMCMedicalHighlight';

/** World → 1080×1920 screen projection for the 3D scenes' overlays (same camera maths as the canvas). */
export const projectPoint = (p: THREE.Vector3, cam: {pos: [number, number, number]; look: [number, number, number]; fov: number}, w = 1080, h = 1920): [number, number] => {
  const c = new THREE.PerspectiveCamera(cam.fov, w / h, 1, 800);
  c.position.set(...cam.pos);
  c.lookAt(...cam.look);
  c.updateMatrixWorld(true);
  const v = p.clone().project(c);
  return [(v.x * 0.5 + 0.5) * w, (-v.y * 0.5 + 0.5) * h];
};

/** R3F camera rig driven by explicit numbers (frame-accurate, no physics). */
export const CamRig: React.FC<{pos: [number, number, number]; look?: [number, number, number]; fov?: number}> = ({pos, look = [0, -4, 0], fov = 30}) => {
  const {camera} = useThree();
  camera.position.set(...pos);
  (camera as THREE.PerspectiveCamera).fov = fov;
  camera.lookAt(...look);
  camera.updateProjectionMatrix();
  return null;
};

/** Observation graphics for a stationary clinical close-up (frame brackets + one soft scan). No pretend measurements. */
export const BackObservationOverlay: React.FC<{from: number; to: number}> = ({from, to}) => (
  <>
    <CornerBrackets x={170} y={560} w={760} h={820} from={from} to={to} />
    <ScanLine x={170} w={760} y0={570} y1={1370} from={from + 14} dur={70} />
  </>
);

/** Shoulder-level reference: one horizontal hairline and two tip rings, placed on the footage (source coordinates) while the subject faces the camera squarely. */
export const ShoulderLevelGuide: React.FC<{from: number; to: number; left: [number, number]; right: [number, number]}> = ({from, to, left, right}) => {
  const y = (left[1] + right[1]) / 2;
  return (
    <>
      <GuideLine p0={[(left[0] + right[0]) / 2, y]} p1={[left[0] - 70, y]} from={from} to={to} dashed />
      <GuideLine p0={[(left[0] + right[0]) / 2, y]} p1={[right[0] + 70, y]} from={from} to={to} dashed />
      <RingMarker x={left[0]} y={left[1]} from={from + 10} to={to} />
      <RingMarker x={right[0]} y={right[1]} from={from + 16} to={to} />
    </>
  );
};
