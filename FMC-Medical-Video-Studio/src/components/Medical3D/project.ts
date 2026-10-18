import * as THREE from 'three';
import {sampleCamera, type CamKey} from './ThreeStage';

/** Projects a world point to screen pixels using the exact same camera as the 3D stage. */
export const projectToScreen = (point: [number, number, number], keys: CamKey[], frame: number, w: number, h: number): [number, number] => {
  const c = sampleCamera(keys, frame);
  const cam = new THREE.PerspectiveCamera(c.fov ?? 35, w / h, 0.1, 400);
  cam.position.set(...c.pos);
  cam.lookAt(...c.target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const v = new THREE.Vector3(...point).project(cam);
  return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h];
};

/** Orbit helper: camera on a circle (degrees: 0 = +X lateral, 90 = +Z anterior, -90 = posterior). */
export const orbit = (center: [number, number, number], radius: number, deg: number, dy = 0): [number, number, number] => {
  const a = (deg * Math.PI) / 180;
  return [center[0] + Math.cos(a) * radius, center[1] + dy, center[2] + Math.sin(a) * radius];
};
