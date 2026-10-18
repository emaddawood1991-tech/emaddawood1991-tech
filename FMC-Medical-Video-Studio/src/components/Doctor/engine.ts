import * as THREE from 'three';
import {armIK, DIM, HAND, legIK, neutralFace, neutralPose, sx, type ArmPose, type DoctorPose, type Face, type HandShape, type Side, type V3} from './skeleton';

/**
 * Procedural acting engine for the FMC Doctor (original code).
 * A performance is a list of clips; each clip has an in/out blend and can drive body channels, face, look-at and
 * arm intents (IK targets resolved AFTER the torso pose is known). Walking uses world-planted foot targets + leg IK (no foot sliding while stepping).
 */
export type Ctx = {
  frame: number;
  fps: number;
  /** world → torso-local (arm IK targets are solved in torso space) */
  toTorso: (w: THREE.Vector3) => THREE.Vector3;
  camera: THREE.Vector3;
};

export type Body = {
  root?: Partial<DoctorPose['root']>;
  hips?: Partial<DoctorPose['hips']>;
  torso?: Partial<DoctorPose['torso']>;
  head?: Partial<DoctorPose['head']>;
  face?: Partial<Face>;
  painGlow?: number;
};
export type ArmIntent = (c: Ctx, t: number) => ArmPose;
export type Clip = {
  name: string;
  start: number;
  end: number;
  inF?: number;
  outF?: number;
  body?: (t: number, f: number) => Body;
  arms?: {L?: ArmIntent; R?: ArmIntent};
  /** world-space point the head/eyes should track */
  look?: V3 | 'camera';
};

const ss = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
const weight = (c: Clip, f: number) => {
  if (f < c.start || f > c.end) return 0;
  const i = c.inF ?? 10, o = c.outF ?? 10;
  return ss((f - c.start) / Math.max(1, i)) * (1 - ss((f - (c.end - o)) / Math.max(1, o)));
};
const lerp = (a: number, b: number, w: number) => a + (b - a) * w;

const mix = <T extends Record<string, number>>(base: T, add: Partial<T> | undefined, w: number): T => {
  if (!add) return base;
  const out: Record<string, number> = {...base};
  for (const k of Object.keys(add)) out[k] = lerp(out[k] ?? 0, (add as Record<string, number>)[k], w);
  return out as T;
};

const blendArm = (a: ArmPose, b: ArmPose, w: number): ArmPose => ({
  upper: a.upper.clone().slerp(b.upper, w),
  fore: a.fore.clone().slerp(b.fore, w),
  hand: a.hand.clone().slerp(b.hand, w),
  shape: {curl: a.shape.curl.map((c, i) => lerp(c, b.shape.curl[i], w)), spread: lerp(a.shape.spread, b.shape.spread, w)},
  sh: a.sh.clone().lerp(b.sh, w),
});

// ---------------------------------------------------------------- arm intent helpers
const medialHand = (s: Side): V3 => [0, -sx(s) * 1.25, 0];
const handE = (s: Side, e: V3): V3 => [e[0], e[1] + medialHand(s)[1], e[2]];

/** Arm reaching a torso-local WRIST target. */
export const reach = (s: Side, p: V3, pole: V3, hand: V3 = [0, 0, 0], shape: HandShape = HAND.relaxed): ArmIntent => () => armIK(s, new THREE.Vector3(...p), new THREE.Vector3(...pole), handE(s, hand), shape);

/** Arm whose INDEX FINGERTIP should touch a WORLD point: wrist = tip − handLen along shoulder→tip. */
export const pointAtWorld = (s: Side, world: V3, standOff = 0.0, shape: HandShape = HAND.point): ArmIntent => (c) => {
  const tip = c.toTorso(new THREE.Vector3(...world));
  const sh = new THREE.Vector3(sx(s) * DIM.shoulderX, DIM.shoulderY, 0);
  const dir = tip.clone().sub(sh).normalize();
  const wrist = tip.clone().sub(dir.clone().multiplyScalar(DIM.handLen + standOff));
  // palm faces down/sideways, index along the arm direction
  const hand: V3 = [0, 0, 0];
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  void q;
  const pole = new THREE.Vector3(sx(s) * 0.5, -0.4, -0.3);
  const arm = armIK(s, wrist, pole, handE(s, hand), shape);
  // orient the hand so the fingers continue the forearm direction
  const foreWorld = arm.upper.clone().multiply(arm.fore);
  const want = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  arm.hand = foreWorld.clone().invert().multiply(want).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -sx(s) * 0.4, 0)));
  return arm;
};

const swing = (t: number, f: number, a: number) => Math.sin(t * f * Math.PI * 2) * a;

export type Perf = {clips: Clip[]; walk: WalkSpec | null; visemes: (frame: number) => {o: number; w: number}; restX: number; restZ: number; /** turntable mode: feet rotate with the body */ feetFollowYaw?: boolean};
export type WalkSpec = {start: number; end: number; x0: number; x1: number; z: number; travelYaw: number; turnStart: number; turnEnd: number; finalYaw: number};

// ---------------------------------------------------------------- the reusable action library (clip factories)
let seq = 0;
const id = (n: string) => `${n}#${seq++}`;
export const A = {
  idle: (start: number, end: number): Clip => ({name: id('idle'), start, end, inF: 1, outF: 1}),
  /** Walk is configured through Perf.walk (feet are planted in world space). This clip adds the arm swing/lean while walking. */
  walk: (spec: WalkSpec): Clip => ({name: id('walk'), start: spec.start, end: spec.end, inF: 6, outF: 10}),
  wave: (start: number, end: number, side: Side = 'R'): Clip => ({
    name: id('wave'), start, end, inF: 12, outF: 14,
    arms: {[side]: ((c: Ctx, t: number) => {
      const wv = Math.sin(t * 0.5) * (1 - ss((t - 34) / 14)); // ~2 swings, then settle (no endless waving)
      return armIK(side, new THREE.Vector3(sx(side) * (0.37 + 0.035 * wv), 0.78, 0.12), new THREE.Vector3(sx(side) * 0.9, -0.55, -0.1), handE(side, [0, 0, sx(side) * 0.5 * wv]), HAND.open);
    }) as ArmIntent},
    body: (t) => ({face: {smile: 0.85, brow: 0.35}, head: {roll: 0.06 * Math.sin(t * 0.2)}}),
    look: 'camera',
  }),
  jump: (start: number, height = 0.11): Clip => ({
    name: id('jump'), start, end: start + 46, inF: 10, outF: 12,
    body: (t) => {
      const u = Math.max(0, Math.min(1, (t - 10) / 26));
      const crouch = u < 0.28 ? Math.sin((u / 0.28) * Math.PI * 0.5) : 0; // anticipation
      const air = u >= 0.28 && u < 0.85 ? Math.sin(((u - 0.28) / 0.57) * Math.PI) : 0;
      const land = u >= 0.85 ? Math.sin(((u - 0.85) / 0.15) * Math.PI) * 0.6 : 0;
      return {root: {y: air * height}, hips: {yOffset: -0.07 * crouch - 0.05 * land}, face: {smile: 1, brow: 0.5}};
    },
  }),
  pointToLowerBack: (start: number, end: number, side: Side = 'R'): Clip => ({
    name: id('pointToLowerBack'), start, end, inF: 22, outF: 18,
    arms: {[side]: reach(side, [sx(side) * 0.12, 0.1, -0.165], [sx(side) * 0.9, -0.1, -0.7], [-1.2, 0, 0], HAND.flat) as ArmIntent},
    body: () => ({torso: {pitch: -0.05}, face: {furrow: 0.45, smile: 0.12, brow: 0.2}}),
    look: 'camera',
  }),
  pointToShoulder: (start: number, end: number, side: Side = 'R'): Clip => ({
    name: id('pointToShoulder'), start, end, inF: 14, outF: 14,
    arms: {[side]: reach(side, [-sx(side) * 0.17, 0.5, 0.17], [sx(side) * 0.4, 0.2, 0.9], [-0.6, 0, 0], HAND.point) as ArmIntent},
  }),
  /** "Attention" gesture: raised open palm (used for the safety note). */
  attention: (start: number, end: number, side: Side = 'R'): Clip => ({
    name: id('attention'), start, end, inF: 14, outF: 14,
    arms: {[side]: ((c: Ctx, t: number) => armIK(side, new THREE.Vector3(sx(side) * 0.27, 0.56 + 0.012 * Math.sin(t * 0.15), 0.3), new THREE.Vector3(sx(side) * 0.8, -0.3, -0.2), handE(side, [-0.1, 0, sx(side) * 0.25]), HAND.open)) as ArmIntent},
    body: () => ({face: {furrow: 0.35, smile: 0, brow: 0.1}}),
    look: 'camera',
  }),
  pointToKnee: (start: number, end: number, side: Side = 'R'): Clip => ({
    name: id('pointToKnee'), start, end, inF: 14, outF: 14,
    arms: {[side]: reach(side, [sx(side) * 0.16, -0.36, 0.2], [sx(side) * 0.6, 0.0, 0.6], [0.2, 0, 0], HAND.point) as ArmIntent},
    body: () => ({torso: {pitch: 0.12}, head: {pitch: 0.22}}),
  }),
  pointToWrist: (start: number, end: number, side: Side = 'R'): Clip => ({
    name: id('pointToWrist'), start, end, inF: 14, outF: 14,
    arms: {
      [sx(side) > 0 ? 'R' : 'L']: reach(sx(side) > 0 ? 'R' : 'L', [-0.05 * sx(side), 0.12, 0.33], [-sx(side) * 0.3, -0.2, 0.6], [-0.5, 0, 0], HAND.flat),
      [side]: reach(side, [-sx(side) * 0.03, 0.14, 0.27], [sx(side) * 0.5, 0, 0.4], [0, 0, 0], HAND.point),
    } as Clip['arms'],
  }),
  pointAtAnatomy: (start: number, end: number, world: V3 | (() => V3), side: Side = 'L'): Clip => ({
    name: id('pointAtAnatomy'), start, end, inF: 16, outF: 16,
    arms: {[side]: ((c: Ctx, t: number) => pointAtWorld(side, typeof world === 'function' ? world() : world, 0.035 + 0.01 * Math.sin(t * 0.12))(c, t)) as ArmIntent},
    body: () => ({face: {smile: 0.3}}),
  }),
  explain: (start: number, end: number, side: Side = 'L', other = true): Clip => ({
    name: id('explain'), start, end, inF: 16, outF: 16,
    arms: {
      [side]: ((c: Ctx, t: number) => armIK(side, new THREE.Vector3(sx(side) * (0.27 + 0.02 * Math.sin(t * 0.13)), 0.1 + 0.03 * Math.sin(t * 0.11), 0.27 + 0.03 * Math.sin(t * 0.17)), new THREE.Vector3(sx(side) * 0.35, -0.5, -0.6), handE(side, [-0.2, 0, sx(side) * 0.3]), HAND.present)) as ArmIntent,
      ...(other ? {[side === 'L' ? 'R' : 'L']: ((c: Ctx, t: number) => { const o: Side = side === 'L' ? 'R' : 'L'; return armIK(o, new THREE.Vector3(sx(o) * 0.25, -0.03 + 0.015 * Math.sin(t * 0.1 + 1), 0.1), new THREE.Vector3(sx(o) * 0.3, -0.4, -0.8), handE(o, [-0.1, 0, 0]), HAND.relaxed); }) as ArmIntent} : {}),
    },
    body: (t) => ({head: {pitch: 0.03 * Math.sin(t * 0.09)}, face: {smile: 0.45}}),
    look: 'camera',
  }),
  presentMedicalModel: (start: number, end: number, world: V3, side: Side = 'L'): Clip => ({
    name: id('presentMedicalModel'), start, end, inF: 18, outF: 18,
    arms: {[side]: ((c: Ctx) => armIK(side, c.toTorso(new THREE.Vector3(world[0] - 0.12 * sx(side) * -1, world[1], world[2] + 0.05)), new THREE.Vector3(sx(side) * 0.8, -0.5, -0.2), handE(side, [0, 0, 0.5 * sx(side)]), HAND.flat)) as ArmIntent},
    body: () => ({face: {smile: 0.5, brow: 0.25}}),
  }),
  think: (start: number, end: number): Clip => ({
    name: id('think'), start, end, inF: 16, outF: 16,
    arms: {R: reach('R', [-0.05, 0.47, 0.2], [-0.9, 0, 0.5], [-1.0, 0, 0.2], HAND.fist) as ArmIntent},
    body: (t) => ({head: {roll: 0.1, pitch: -0.05}, face: {furrow: 0.35, brow: 0.4, lookY: 0.2, smile: 0.15}, torso: {roll: 0.02 * Math.sin(t * 0.05)}}),
  }),
  react: (start: number, end: number, kind: 'concerned' | 'happy' | 'serious' = 'concerned'): Clip => ({
    name: id('react'), start, end, inF: 14, outF: 14,
    body: () => (kind === 'concerned' ? {face: {furrow: 0.55, brow: 0.3, smile: 0.0}, head: {pitch: 0.05, roll: 0.05}} : kind === 'serious' ? {face: {furrow: 0.45, brow: -0.1, smile: 0.05}} : {face: {smile: 1, brow: 0.45}}),
  }),
  lookAtCamera: (start: number, end: number): Clip => ({name: id('lookAtCamera'), start, end, inF: 10, outF: 10, look: 'camera'}),
  lookAtAnatomy: (start: number, end: number, world: V3): Clip => ({name: id('lookAtAnatomy'), start, end, inF: 12, outF: 12, look: world}),
  /** Rehabilitation demo: hands on hips, gentle lumbar extension then neutral, slow pelvic tilt (no footage available offline). */
  rehabReset: (start: number, end: number): Clip => ({
    name: id('rehabReset'), start, end, inF: 16, outF: 16,
    arms: {
      L: reach('L', [0.21, 0.02, 0.07], [0.9, -0.2, -0.5], [0.0, 0, 0.0], HAND.flat) as ArmIntent,
      R: reach('R', [-0.21, 0.02, 0.07], [-0.9, -0.2, -0.5], [0.0, 0, 0.0], HAND.flat) as ArmIntent,
    },
    body: (t) => {
      const cyc = Math.sin((t / 48) * Math.PI * 2);
      return {torso: {pitch: -0.1 * Math.max(0, cyc) + 0.06 * Math.max(0, -cyc)}, hips: {yaw: 0.05 * cyc}, face: {smile: 0.55, brow: 0.2}};
    },
    look: 'camera',
  }),
  /** Left hand climbs three small "steps" (gradual programme) while he smiles at the camera. */
  progressSteps: (start: number, end: number): Clip => ({
    name: id('progressSteps'), start, end, inF: 14, outF: 14,
    arms: {L: ((c: Ctx, t: number) => {
      const lvl = Math.min(2, Math.floor(t / 24));
      const k = ss((t - lvl * 24) / 14);
      const y = 0.06 + (lvl + k) * 0.11 - (lvl >= 2 ? 0 : 0);
      return armIK('L', new THREE.Vector3(0.3, y, 0.26 + 0.05 * (lvl + k)), new THREE.Vector3(0.7, -0.4, -0.3), handE('L', [-0.1, 0, 0.3]), HAND.flat);
    }) as ArmIntent},
    body: () => ({face: {smile: 0.7, brow: 0.3}}),
    look: 'camera',
  }),
  celebrate: (start: number): Clip => ({
    name: id('celebrate'), start, end: start + 40, inF: 8, outF: 14,
    arms: {R: reach('R', [-0.26, 0.66, 0.12], [-0.9, -0.1, -0.3], [0, 0, -0.2], HAND.fist) as ArmIntent},
    body: () => ({face: {smile: 1, brow: 0.5}}),
    look: 'camera',
  }),
  exitScene: (start: number, end: number): Clip => ({name: id('exitScene'), start, end, inF: 10, outF: 1, look: 'camera'}),
};

// ---------------------------------------------------------------- evaluation
const matFromRoot = (root: DoctorPose['root'], hips: DoctorPose['hips'], torso: DoctorPose['torso']) => {
  const mRoot = new THREE.Matrix4().compose(new THREE.Vector3(root.x, root.y, root.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, root.yaw, 0)), new THREE.Vector3(1, 1, 1));
  const mHips = new THREE.Matrix4().compose(new THREE.Vector3(hips.x, DIM.hipY + hips.yOffset, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, hips.yaw, hips.roll)), new THREE.Vector3(1, 1, 1));
  const mTorso = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(torso.pitch, torso.yaw, torso.roll));
  const hipsW = mRoot.clone().multiply(mHips);
  const torsoW = hipsW.clone().multiply(mTorso);
  return {hipsW, torsoW};
};

const blinkAt = (f: number) => {
  const period = 96 + ((f / 96) | 0) % 3 * 17;
  const k = f % period;
  if (k > 6) return 0;
  return k < 3 ? k / 3 : 1 - (k - 3) / 3;
};

export const evaluate = (perf: Perf, frame: number, fps: number, camera: V3): DoctorPose => {
  const t = frame / fps;
  const pose = neutralPose();
  const clips = perf.clips.map((c) => ({c, w: weight(c, frame)})).filter((x) => x.w > 0.001);

  // ---- idle body life (breathing, weight shift, micro head motion)
  pose.root.x = perf.restX; pose.root.z = perf.restZ;
  pose.torso.pitch = 0.012 * Math.sin(t * 1.5);
  pose.torso.roll = 0.012 * Math.sin(t * 0.7);
  pose.hips.roll = 0.012 * Math.sin(t * 0.7 + 1);
  pose.hips.x = 0.014 * Math.sin(t * 0.45); // weight shift over the feet (feet stay planted)
  pose.torso.roll += -0.35 * 0.014 * Math.sin(t * 0.45);
  pose.head.yaw = 0.03 * Math.sin(t * 0.6);
  pose.head.pitch = 0.02 * Math.sin(t * 0.9 + 0.5);

  // ---- walking root motion
  const wk = perf.walk;
  let gait: {L: THREE.Vector3; R: THREE.Vector3; phase: number} | null = null;
  let walkW = 0;
  if (wk) {
    const u = Math.min(1, Math.max(0, (frame - wk.start) / (wk.end - wk.start)));
    const e = u < 1 ? (1 - Math.cos(Math.PI * Math.min(1, u * 1.0))) / 2 * 0.0 + u : 1; // constant speed for the step cycle
    const speedEase = u < 0.12 ? ss(u / 0.12) * 0.5 + 0.5 * (u / 0.12) * 0 : 1; // gentle start
    void speedEase;
    const eased = u * u * (3 - 2 * u) * 0.35 + u * 0.65; // slow-in/slow-out but never stalls (keeps the step cycle moving)
    pose.root.x = lerp(wk.x0, wk.x1, eased);
    pose.root.z = wk.z;
    const tt = Math.min(1, Math.max(0, (frame - wk.turnStart) / Math.max(1, wk.turnEnd - wk.turnStart)));
    pose.root.yaw = lerp(wk.travelYaw, wk.finalYaw, ss(tt));
    walkW = frame >= wk.start && frame <= wk.end + 14 ? 1 : 0;
    if (frame < wk.start) { pose.root.x = wk.x0; pose.root.yaw = wk.travelYaw; }
    // gait
    const S = 0.255, st = 0.62, a = st * S;
    const D = pose.root.x - wk.x0;
    const phi = (ψ0: number) => ((D / (2 * S) + ψ0) % 1 + 1) % 1;
    const foot = (ψ: number, lateral: number) => {
      let rel: number, lift = 0;
      const hx = pose.root.x;
      if (ψ < st) rel = a - 2 * S * ψ; else {
        const s = (ψ - st) / (1 - st);
        rel = -a + 2 * a * ss(s);
        lift = 0.085 * Math.sin(Math.PI * Math.min(1, s * 1.05));
      }
      return new THREE.Vector3(hx + rel, DIM.ankleH + lift, wk.z + lateral);
    };
    const lateralL = -0.098 * Math.sin(wk.travelYaw), lateralR = 0.098 * Math.sin(wk.travelYaw);
    const phL = phi(0.15), phR = phi(0.65);
    gait = {L: foot(phL, lateralL), R: foot(phR, lateralR), phase: phL};
    // settle into the standing stance with two small steps (the farther foot first), each with a lift arc — no sliding
    const settleT = Math.min(1, Math.max(0, (frame - (wk.end - 4)) / 26));
    if (frame >= wk.end - 4) {
      const stand = (side: Side) => {
        const local = new THREE.Vector3(sx(side) * 0.105, DIM.ankleH, 0.0).applyEuler(new THREE.Euler(0, wk.finalYaw, 0));
        return new THREE.Vector3(wk.x1 + local.x, DIM.ankleH, wk.z + local.z);
      };
      const sL = stand('L'), sR = stand('R');
      const first: Side = gait.L.distanceTo(sL) >= gait.R.distanceTo(sR) ? 'L' : 'R';
      for (const side of ['L', 'R'] as Side[]) {
        const win = side === first ? 0 : 0.5;
        const uu = Math.min(1, Math.max(0, (settleT - win) / 0.5));
        const tgt = side === 'L' ? sL : sR;
        gait[side].lerp(tgt, ss(uu));
        gait[side].y += 0.055 * Math.sin(Math.PI * uu);
      }
      if (settleT >= 1) walkW = 0;
    }
    if (frame > wk.end + 30) gait = null;
    // when walking has finished the character stays at x1
    if (frame > wk.end) { pose.root.x = wk.x1; pose.root.yaw = lerp(wk.travelYaw, wk.finalYaw, ss(tt)); }
    if (gait) {
      const bob = 0.014 * Math.abs(Math.cos(Math.PI * D / (2 * S) * 2 * 0.5 * 2)) * (frame <= wk.end ? 1 : 0);
      pose.hips.yOffset = -0.018 + bob * 0.8;
      pose.hips.roll += 0.03 * Math.sin(2 * Math.PI * phL) * (frame <= wk.end ? 1 : 0);
      pose.torso.yaw += -0.06 * Math.sin(2 * Math.PI * phL) * (frame <= wk.end ? 1 : 0);
      pose.torso.pitch += 0.035 * (frame <= wk.end ? 1 : 0);
    }
  }

  // ---- body clips (pass 1)
  let look: {target: V3 | 'camera'; w: number} | null = null;
  const f2 = pose.face;
  for (const {c, w} of clips) {
    const b = c.body?.(frame - c.start, frame);
    if (b) {
      if (b.root) pose.root = mix(pose.root, b.root as DoctorPose['root'], w);
      if (b.hips) pose.hips = mix(pose.hips, b.hips as DoctorPose['hips'], w);
      if (b.torso) pose.torso = mix(pose.torso, b.torso as DoctorPose['torso'], w);
      if (b.head) pose.head = mix(pose.head, b.head as DoctorPose['head'], w);
      if (b.face) Object.assign(f2, mix(f2, b.face, w));
      if (b.painGlow !== undefined) pose.painGlow = lerp(pose.painGlow, b.painGlow, w);
    }
    if (c.look && (!look || w >= look.w)) look = {target: c.look, w};
  }

  // ---- matrices for IK / look-at
  const {hipsW, torsoW} = matFromRoot(pose.root, pose.hips, pose.torso);
  const inv = torsoW.clone().invert();
  const ctx: Ctx = {frame, fps, toTorso: (w) => w.clone().applyMatrix4(inv), camera: new THREE.Vector3(...camera)};

  // ---- look-at (head leads, eyes finish the job)
  if (look) {
    const tw = look.target === 'camera' ? new THREE.Vector3(...camera) : new THREE.Vector3(...look.target);
    const local = ctx.toTorso(tw).sub(new THREE.Vector3(0, DIM.neckY + DIM.headY, 0.01));
    const yaw = Math.atan2(local.x, local.z);
    const pitch = -Math.atan2(local.y, Math.hypot(local.x, local.z));
    const clampv = (v: number, m: number) => Math.max(-m, Math.min(m, v));
    const hy = clampv(yaw * 0.7, 0.95), hp = clampv(pitch * 0.7, 0.45);
    pose.head.yaw = lerp(pose.head.yaw, hy, look.w);
    pose.head.pitch = lerp(pose.head.pitch, hp, look.w);
    f2.lookX = lerp(f2.lookX, clampv(yaw - hy, 0.35), look.w);
    f2.lookY = lerp(f2.lookY, clampv(-(pitch - hp), 0.3), look.w);
  }

  // ---- eye life: small gaze saccades held for ~1.3 s each (never a dead stare)
  const hold = Math.floor(frame / 38);
  const hsh = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  f2.lookX += (hsh(hold) - 0.5) * 0.07;
  f2.lookY += (hsh(hold + 91) - 0.5) * 0.04;

  // ---- blink + speech
  f2.blink = Math.max(f2.blink, blinkAt(frame));
  const v = perf.visemes(frame);
  f2.mouthO = v.o;
  f2.mouthW = v.w;
  pose.head.pitch += 0.05 * v.o - 0.01; // speaking nod
  f2.smile = Math.max(0, Math.min(1, f2.smile));

  // ---- arms (pass 2)
  const swingW = walkW;
  const phase = gait ? gait.phase : 0;
  const idleArm = (s: Side): ArmPose => {
    const sw = swingW * 0.15 * Math.sin(2 * Math.PI * (s === 'L' ? phase + 0.5 : phase));
    return armIK(s, new THREE.Vector3(sx(s) * (0.285 + 0.01 * Math.sin(t * 0.8 + (s === 'L' ? 0 : 2))), -0.045 + 0.008 * Math.sin(t * 1.5), 0.03 + sw), new THREE.Vector3(sx(s) * 0.4, -0.2, -0.6), handE(s, [0.1, 0, 0]), HAND.relaxed);
  };
  const arms: DoctorPose['arms'] = {L: idleArm('L'), R: idleArm('R')};
  for (const {c, w} of clips) {
    if (!c.arms) continue;
    for (const s of ['L', 'R'] as Side[]) {
      const intent = c.arms[s];
      if (intent) arms[s] = blendArm(arms[s], intent(ctx, frame - c.start), w);
    }
  }
  for (const sd of ['L', 'R'] as Side[]) {
    const sh = arms[sd].shape;
    const pointing = sh.curl[1] < 0.2 && sh.curl[2] > 0.8;
    arms[sd] = {...arms[sd], shape: {spread: sh.spread, curl: sh.curl.map((c, i) => Math.max(0, Math.min(1, c + (pointing && i === 1 ? 0 : 0.045 * Math.sin(t * 1.3 + i * 0.9 + (sd === 'L' ? 0 : 2)))))) }};
  }
  pose.arms = arms;

  // ---- legs from world-planted feet
  const hipsInv = hipsW.clone().invert();
  const stand = (side: Side) => {
    const sp = wk ? {x: wk.x1, z: wk.z, yaw: wk.finalYaw} : {x: perf.restX, z: perf.restZ, yaw: perf.feetFollowYaw ? pose.root.yaw : 0};
    const p = new THREE.Vector3(sx(side) * 0.105, DIM.ankleH, 0).applyEuler(new THREE.Euler(0, sp.yaw, 0));
    return new THREE.Vector3(sp.x + p.x, DIM.ankleH, sp.z + p.z);
  };
  const feet = {L: gait ? gait.L : stand('L'), R: gait ? gait.R : stand('R')};
  // jump: feet follow the body up
  for (const s of ['L', 'R'] as Side[]) {
    const w = feet[s].clone();
    w.y += pose.root.y;
    const local = w.applyMatrix4(hipsInv);
    pose.legs[s] = legIK(s, local, gait && w.y > DIM.ankleH + 0.01 ? -0.25 : 0);
  }
  return pose;
};
