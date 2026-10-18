import * as THREE from 'three';

/**
 * FMC Doctor — original procedural 3D character (no external model, no Agentoon code).
 * Units are metres. Facing direction is +Z; the character's LEFT side is +X (screen-right for a front camera).
 * Hierarchy: root(floor, yaw) → hips(pelvis height) → torso(spine rotation) → {neck/head, shoulders → arms}
 *            hips → thighs → shins → feet. Arms/legs are driven by analytic two-bone IK in parent space.
 */
export const DIM = {
  hipY: 0.9,
  hipX: 0.092,
  thigh: 0.44,
  shin: 0.43,
  ankleH: 0.075,
  shoulderX: 0.178,
  shoulderY: 0.47,
  upperArm: 0.265,
  foreArm: 0.24,
  neckY: 0.53,
  headY: 0.185,
  handLen: 0.145,
};

export type V3 = [number, number, number];
export type Side = 'L' | 'R';
export const sx = (s: Side) => (s === 'L' ? 1 : -1);

export type HandShape = {curl: number[]; spread: number}; // curl: [thumb, index, middle, ring, pinky] 0..1
export const HAND = {
  relaxed: {curl: [0.3, 0.35, 0.4, 0.45, 0.5], spread: 0.08},
  open: {curl: [0.05, 0.05, 0.05, 0.05, 0.05], spread: 0.25},
  point: {curl: [0.7, 0.0, 0.95, 0.95, 0.95], spread: 0},
  fist: {curl: [0.8, 0.95, 0.95, 0.95, 0.95], spread: 0},
  flat: {curl: [0.0, 0.0, 0.0, 0.0, 0.0], spread: 0.0},
  present: {curl: [0.1, 0.12, 0.15, 0.2, 0.25], spread: 0.1},
} satisfies Record<string, HandShape>;

export type Face = {
  smile: number; // 0..1
  brow: number; // -1 (lowered) .. 1 (raised)
  furrow: number; // 0..1 inner-brow pinch (concern)
  eyeOpen: number; // 0..1.2 baseline openness (blink multiplies)
  blink: number; // 0 open .. 1 closed
  lookX: number; // eye yaw  (rad)
  lookY: number; // eye pitch (rad)
  mouthO: number; // 0..1 jaw opening
  mouthW: number; // width factor
};

export type ArmPose = {upper: THREE.Quaternion; fore: THREE.Quaternion; hand: THREE.Quaternion; shape: HandShape; /** shoulder joint position in torso space (clavicle lift/protract) */ sh: THREE.Vector3};
export type LegPose = {thigh: THREE.Quaternion; shin: THREE.Quaternion; footPitch: number};

export type DoctorPose = {
  root: {x: number; y: number; z: number; yaw: number};
  hips: {yOffset: number; roll: number; yaw: number; x: number};
  torso: {pitch: number; yaw: number; roll: number};
  head: {pitch: number; yaw: number; roll: number};
  arms: {L: ArmPose; R: ArmPose};
  legs: {L: LegPose; R: LegPose};
  face: Face;
  /** 0..1 pain highlight on the lower back (red glow patch on the coat) */
  painGlow: number;
};

const DOWN = new THREE.Vector3(0, -1, 0);

/** Two-bone IK. Returns the middle joint position for a root→target reach with an elbow/knee pole hint. */
export const solveTwoBone = (root: THREE.Vector3, target: THREE.Vector3, l1: number, l2: number, pole: THREE.Vector3) => {
  const d = new THREE.Vector3().subVectors(target, root);
  const maxR = (l1 + l2) * 0.9995;
  const dist = Math.min(Math.max(d.length(), Math.abs(l1 - l2) + 1e-3), maxR);
  const dir = d.lengthSq() > 1e-9 ? d.clone().normalize() : new THREE.Vector3(0, -1, 0);
  const cosA = THREE.MathUtils.clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1);
  const a = Math.acos(cosA);
  const perp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));
  if (perp.lengthSq() < 1e-8) perp.set(0, 0, 1).sub(dir.clone().multiplyScalar(dir.z));
  perp.normalize();
  const mid = root.clone().add(dir.clone().multiplyScalar(l1 * Math.cos(a))).add(perp.multiplyScalar(l1 * Math.sin(a)));
  const end = root.clone().add(dir.clone().multiplyScalar(dist));
  return {mid, end};
};

/** Convert an IK solution into local joint rotations (bones point along -Y at rest). */
export const limbQuats = (root: THREE.Vector3, mid: THREE.Vector3, end: THREE.Vector3) => {
  const du = mid.clone().sub(root).normalize();
  const df = end.clone().sub(mid).normalize();
  const qu = new THREE.Quaternion().setFromUnitVectors(DOWN, du);
  // fore-bone rotation = minimal rotation in the UPPER bone's own frame (no holonomy twist → no flips when the arm points up)
  const dLocal = df.clone().applyQuaternion(qu.clone().invert());
  const qf = new THREE.Quaternion().setFromUnitVectors(DOWN, dLocal);
  return {upper: qu, fore: qf};
};

export const armIK = (side: Side, targetTorso: THREE.Vector3, elbowPole: THREE.Vector3, handEuler: V3 = [0, 0, 0], shape: HandShape = HAND.relaxed): ArmPose => {
  const base = new THREE.Vector3(sx(side) * DIM.shoulderX, DIM.shoulderY, 0);
  // clavicle follow: the shoulder lifts / protracts as the hand goes up and forward (no stiff shoulders)
  const elev = targetTorso.y - DIM.shoulderY;
  const lift = THREE.MathUtils.clamp(elev * 0.12, -0.01, 0.04);
  const fwd = THREE.MathUtils.clamp(targetTorso.z * 0.06, -0.01, 0.03);
  const inward = -sx(side) * THREE.MathUtils.clamp(Math.max(0, elev) * 0.03, 0, 0.012);
  const sh = base.clone().add(new THREE.Vector3(inward, lift, fwd));
  const {mid, end} = solveTwoBone(sh, targetTorso, DIM.upperArm, DIM.foreArm, elbowPole);
  const {upper, fore} = limbQuats(sh, mid, end);
  return {upper, fore, hand: new THREE.Quaternion().setFromEuler(new THREE.Euler(...handEuler)), shape, sh};
};

export const legIK = (side: Side, ankleHips: THREE.Vector3, footPitch = 0): LegPose => {
  const hip = new THREE.Vector3(sx(side) * DIM.hipX, 0, 0);
  const {mid, end} = solveTwoBone(hip, ankleHips, DIM.thigh, DIM.shin, new THREE.Vector3(0, 0, 1));
  const {upper, fore} = limbQuats(hip, mid, end);
  return {thigh: upper, shin: fore, footPitch};
};

const IDENT = new THREE.Quaternion();
export const neutralFace = (): Face => ({smile: 0.5, brow: 0, furrow: 0, eyeOpen: 1, blink: 0, lookX: 0, lookY: 0, mouthO: 0, mouthW: 1});

export const neutralPose = (): DoctorPose => ({
  root: {x: 0, y: 0, z: 0, yaw: 0},
  hips: {yOffset: 0, roll: 0, yaw: 0, x: 0},
  torso: {pitch: 0, yaw: 0, roll: 0},
  head: {pitch: 0, yaw: 0, roll: 0},
  arms: {
    L: armIK('L', new THREE.Vector3(0.29, -0.04, 0.03), new THREE.Vector3(0.4, -0.2, -0.6), [0, 0, 0], HAND.relaxed),
    R: armIK('R', new THREE.Vector3(-0.29, -0.04, 0.03), new THREE.Vector3(-0.4, -0.2, -0.6), [0, 0, 0], HAND.relaxed),
  },
  legs: {
    L: legIK('L', new THREE.Vector3(DIM.hipX + 0.01, -(DIM.hipY - DIM.ankleH), 0)),
    R: legIK('R', new THREE.Vector3(-DIM.hipX - 0.01, -(DIM.hipY - DIM.ankleH), 0)),
  },
  face: neutralFace(),
  painGlow: 0,
});

export const _ = IDENT;
