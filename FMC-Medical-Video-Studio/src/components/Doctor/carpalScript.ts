/**
 * Episode 01 — carpal tunnel syndrome: presenter performance, camera path and wrist-model state, all driven by the narration timeline.
 * (Counterpart of lowerBackScript.ts. Reuses the acting engine, camera presets, C1 camera sampler and the procedural WristHandModel.)
 */
import * as THREE from 'three';
import type {Content, SceneId} from '../../lib/schema';
import type {TimelineItem} from '../../lib/timeline';
import {A, reach, type Clip, type Perf} from './engine';
import {armIK, HAND, sx, type V3} from './skeleton';
import {GESTURE_ACTING} from './actingPrinciples';
import {phrases, REST_X} from './lowerBackScript';
import {CAM} from './cameraPresets';
import type {CamKey} from '../Medical3D';
import {defaultWristState, type WristState} from '../Medical3D';

const at = (tl: TimelineItem[], id: SceneId) => tl.find((t) => t.id === id)!;
const end = (t: TimelineItem) => t.from + t.duration;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ss = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
export const ramp = (f: number, a: number, b: number) => ss((f - a) / Math.max(1, b - a));

/** Wrist/hand hologram placement in the world (model units are cm → 0.05 m per unit = 5× life size). */
export const HW = {pos: [0.56, 1.28, -0.1] as V3, scale: 0.05};
export const handYaw = (f: number) => 0.06 * Math.sin(f / 95);
export const handWorld = (local: V3, f: number): V3 => {
  const p = new THREE.Vector3(...local).multiplyScalar(HW.scale).applyEuler(new THREE.Euler(0, handYaw(f), 0));
  return [HW.pos[0] + p.x, HW.pos[1] + p.y, HW.pos[2] + p.z];
};

export const PAIR = {pos: [0.12, 1.42, 5.7] as V3, target: [0.12, 1.34, 0] as V3, fov: 34};
const CARPAL_CAM = {
  intro: {...CAM.WIDE, pos: [-0.15, 1.4, 6.5] as V3, target: [-0.3, 1.28, 0] as V3},
  approach: {pos: [0.4, 1.36, 3.9] as V3, target: [0.46, 1.3, -0.1] as V3, fov: 34},
  wrist: {pos: [0.6, 1.4, 2.5] as V3, target: [0.56, 1.3, -0.1] as V3, fov: 32},
  wristRight: {pos: [0.7, 1.42, 2.7] as V3, target: [0.66, 1.34, -0.1] as V3, fov: 32},
  hand: {pos: [0.56, 1.52, 3.1] as V3, target: [0.56, 1.58, -0.1] as V3, fov: 34},
  splint: {pos: [0.56, 1.34, 3.1] as V3, target: [0.56, 1.12, -0.1] as V3, fov: 34},
  end: {pos: [0.0, 1.72, 3.7] as V3, target: [0.05, 2.0, 0] as V3, fov: 32},
};

export const buildCarpalPerformance = (tl: TimelineItem[], content: Content, visemes: {fps: number; scenes: Record<string, {o: number[]; w: number[]}>} | null): Perf => {
  const o = at(tl, 'opening'), an = at(tl, 'anatomy'), sy = at(tl, 'symptoms'), tr = at(tl, 'treatment'), cl = at(tl, 'closing');
  const po = phrases(tl, content, 'opening'), pa = phrases(tl, content, 'anatomy'), ps = phrases(tl, content, 'symptoms'), pt = phrases(tl, content, 'treatment'), pc = phrases(tl, content, 'closing');
  const clips: Clip[] = [];
  const C = clips.push.bind(clips);
  const world = (local: V3) => (f: number) => handWorld(local, f);
  const pointer = (s: number, e: number, fn: (f: number) => V3, side: 'L' | 'R' = 'L', shape = HAND.point) => {
    const base = A.pointAtAnatomy(s, e, [0, 0, 0], side);
    C({...base, name: 'pointCarpal#' + s, acting: GESTURE_ACTING, arms: {[side]: ((cx: any, t: number) => (A.pointAtAnatomy(0, 1, fn(cx.frame), side).arms as any)[side](cx, t)) as any}});
    void shape;
  };

  // ── 1 · human introduction: walks in, looks at the viewer, raises his hand so the fingers are seen
  C(A.lookAtCamera(46, an.from + 6));
  C(A.react(50, po[1].s, 'concerned'));
  const showS = 88, showE = an.from + 18;
  C({
    name: 'showHand', start: showS, end: showE, inF: 30, outF: 20, acting: GESTURE_ACTING,
    arms: {R: ((c: any, t: number) => armIK('R', new THREE.Vector3(-0.42, 0.52 + 0.006 * Math.sin(t * 0.1), 0.18), new THREE.Vector3(-0.5, -1, 0), [0, 0.6, 0], {curl: [0.12, 0.1, 0.1, 0.12, 0.16], spread: 0.28})) as any},
    body: () => ({face: {smile: 0.2, furrow: 0.3, brow: 0.25}, torso: {yaw: -0.08}}),
    look: 'camera',
  });
  // ── 2 · wrist anatomy: he turns toward the model, touches his own wrist, then points at the carpal tunnel
  C({name: 'face-model', start: an.from - 4, end: end(an) + 6, inF: 28, outF: 24, body: () => ({root: {yaw: 0.5}, face: {smile: 0.25, brow: 0.2}})});
  C(A.pointToWrist(an.from + 14, pa[0].e - 10, 'R'));
  C(A.lookAtAnatomy(an.from + 10, end(an), handWorld([0.1, 1.0, 0.7], an.from + 60)));
  pointer(pa[1].s - 8, end(an) - 4, world([0.1, 1.0, 0.9]), 'L');
  // ── 3 · symptoms: looks at the fingers, then shows how a cup becomes hard to hold (mild, no exaggeration)
  C({name: 'face-model-b', start: end(an) - 6, end: ps[1].s - 10, inF: 20, outF: 26, body: () => ({root: {yaw: 0.45}, face: {furrow: 0.3, brow: 0.2, smile: 0.1}})});
  C(A.lookAtAnatomy(sy.from + 4, ps[1].s - 12, handWorld([2.0, 12, 0.6], sy.from + 90)));
  C(A.react(sy.from + 10, ps[1].s - 10, 'concerned'));
  const cupS = ps[1].s - 8, cupE = end(sy) + 14;
  C({
    name: 'holdCup', start: cupS, end: cupE, inF: 26, outF: 24,
    arms: {R: ((c: any, t: number) => {
      const tremor = 0.006 * Math.sin(t * 0.9) * clamp01((t - 40) / 30);
      const sag = 0.02 * clamp01((t - 46) / 40);
      return armIK('R', new THREE.Vector3(-0.38 + tremor, 0.42 - sag, 0.22), new THREE.Vector3(-0.5, -1, 0), [0, 0.6, 0], {curl: [0.5, 0.62, 0.64, 0.64, 0.62], spread: 0.05});
    }) as any},
    body: (t) => ({hold: {side: 'R', amount: ramp(t, 8, 26) * (1 - ramp(t, cupE - cupS - 26, cupE - cupS - 6)), tilt: 0.05 + 0.32 * clamp01((t - 46) / 52)}, face: {furrow: 0.45, brow: 0.25, smile: 0}, head: {pitch: -0.02}}),
    look: 'camera',
  });
  // ── 4 · care: assessment gesture, then he indicates the neutral wrist and the splint, then a gentle hand exercise
  C({name: 'face-model-c', start: end(sy) + 4, end: pt[1].s + 80, inF: 20, outF: 26, body: () => ({root: {yaw: 0.45}, face: {smile: 0.45, brow: 0.25}})});
  C(A.lookAtCamera(tr.from + 18, pt[0].s + 50));
  C(A.explain(pt[0].s, pt[0].s + 62, 'R', true));
  pointer(pt[0].s + 58, pt[1].s + 46, world([0.2, 1.2, 1.0]), 'L');
  C(A.lookAtAnatomy(pt[0].s + 56, pt[1].s + 44, handWorld([0, 0, 1], tr.from + 140)));
  const exS = pt[1].s + 50, exE = end(tr) + 6;
  C({name: 'face-camera-d', start: exS - 22, end: end(tr) + 10, inF: 24, outF: 22, body: () => ({root: {yaw: 0.0}, face: {smile: 0.55, brow: 0.25}})});
  C({
    name: 'handExercise', start: exS, end: exE, inF: 24, outF: 22,
    arms: {R: ((c: any, t: number) => {
      const cyc = (t / 44) % 1, k = cyc < 0.4 ? ss(cyc / 0.4) : cyc < 0.65 ? 1 : 1 - ss((cyc - 0.65) / 0.35);
      const hook = Math.sin(Math.PI * clamp01(cyc / 0.4)) * 0.45;
      return armIK('R', new THREE.Vector3(-0.42, 0.5, 0.18), new THREE.Vector3(-0.5, -1, 0), [0, 0.6, 0], {curl: [0.1 + 0.4 * k, 0.1 + hook + 0.55 * k, 0.1 + hook + 0.6 * k, 0.1 + hook + 0.6 * k, 0.12 + hook + 0.55 * k], spread: 0.15 * (1 - k)});
    }) as any},
    look: 'camera',
  });
  // ── 5 · FMC closing
  C({name: 'face-camera-e', start: end(tr) - 6, end: end(cl) + 4, inF: 24, outF: 22, body: () => ({root: {yaw: 0.0}})});
  C(A.lookAtCamera(cl.from + 4, end(cl)));
  C(A.react(pc[0].s, end(cl), 'happy'));
  C(A.explain(pc[1].s - 6, pc[1].e - 20, 'L', true));
  C(A.wave(end(cl) - 68, end(cl) - 14, 'R'));

  const walk = {start: 0, end: 84, x0: -1.55, x1: REST_X, z: 0, travelYaw: Math.PI / 2, turnStart: 58, turnEnd: 98, finalYaw: 0};
  const vis = (frame: number) => {
    if (!visemes) return {o: 0, w: 1};
    for (const t of tl) {
      const s = t.from + t.audioFrom;
      if (frame >= s && frame < s + t.audioFrames) { const sc = visemes.scenes[t.id]; const k = frame - s; return {o: sc?.o[k] ?? 0, w: sc?.w[k] ?? 1}; }
    }
    return {o: 0, w: 1};
  };
  return {clips, walk, visemes: vis, restX: REST_X, restZ: 0};
};

export const buildCarpalCamera = (tl: TimelineItem[], content: Content): CamKey[] => {
  const an = at(tl, 'anatomy'), sy = at(tl, 'symptoms'), tr = at(tl, 'treatment'), cl = at(tl, 'closing');
  const pa = phrases(tl, content, 'anatomy'), ps = phrases(tl, content, 'symptoms'), pt = phrases(tl, content, 'treatment');
  const k = (f: number, c: {pos: V3; target: V3; fov: number}): CamKey => ({f, pos: c.pos, target: c.target, fov: c.fov});
  return [
    k(0, CARPAL_CAM.intro), k(96, PAIR), k(an.from + 12, PAIR),                           // intro → pair shot (doctor + hologram hand)
    k(an.from + 52, CARPAL_CAM.approach),                                                    // camera leaves the doctor and approaches the wrist
    k(pa[0].e + 8, CARPAL_CAM.wrist), k(pa[1].s + 60, CARPAL_CAM.wrist), k(pa[1].s + 110, CARPAL_CAM.wristRight), // carpal tunnel close-up, then the cross-section
    k(end(an) + 6, CARPAL_CAM.wristRight),
    k(sy.from + 48, CARPAL_CAM.hand), k(ps[1].s - 16, CARPAL_CAM.hand),                  // the whole hand: sensory territory
    k(ps[1].s + 26, PAIR), k(end(sy) + 12, PAIR),                                          // pair shot: the cup demonstration
    k(tr.from + 36, PAIR), k(pt[0].s + 44, PAIR),                                          // assessment
    k(pt[0].s + 84, CARPAL_CAM.splint), k(pt[1].s + 44, CARPAL_CAM.splint),               // neutral wrist, splint
    k(pt[1].s + 80, PAIR), k(end(tr) + 6, PAIR),                                          // gentle exercise (presenter)
    k(cl.from + 50, CARPAL_CAM.end), k(end(cl) + 30, CARPAL_CAM.end),
  ];
};

/** State of the wrist model at a frame. */
export const wristStateAt = (f: number, tl: TimelineItem[], content: Content): WristState => {
  const o = at(tl, 'opening'), an = at(tl, 'anatomy'), sy = at(tl, 'symptoms'), tr = at(tl, 'treatment'), cl = at(tl, 'closing');
  const pa = phrases(tl, content, 'anatomy'), ps = phrases(tl, content, 'symptoms'), pt = phrases(tl, content, 'treatment');
  const s = defaultWristState();
  s.time = f / 30;
  s.bones = 0; s.tendons = 0; s.ligament = 0; s.nerve = 0;
  // 1: skin hand appears beside the doctor; the affected fingers glow softly
  let skin = ramp(f, 66, 104);
  let sensory = 0.55 * ramp(f, o.from + 108, o.from + 150) * (1 - ramp(f, an.from + 20, an.from + 60));
  let zonesOn = 1;
  // 2: skin fades back, internal structures appear layer by layer
  const dive = ramp(f, an.from + 22, an.from + 84);
  skin = skin * (1 - 0.9 * dive);
  s.bones = ramp(f, an.from + 30, an.from + 84);
  s.tendons = ramp(f, an.from + 46, an.from + 94);
  s.ligament = ramp(f, an.from + 52, an.from + 100);
  s.nerve = ramp(f, an.from + 62, an.from + 108);
  s.nerveGlow = 0.85 * ramp(f, pa[1].s, pa[1].s + 30);
  s.compression = ramp(f, pa[1].s + 36, pa[1].s + 96);
  // 3: the structures fade, the realistic hand returns with the sensory territory
  const back = ramp(f, sy.from + 4, sy.from + 52);
  skin = Math.max(skin, back);
  const inner = 1 - back;
  s.bones *= inner; s.tendons *= inner; s.nerve *= inner; s.ligament *= inner; s.nerveGlow *= inner; s.compression *= inner;
  const z = (a: number) => ramp(f, ps[0].s + a, ps[0].s + a + 22);
  const sensoryS3 = ramp(f, sy.from + 52, sy.from + 74) * (1 - 0.65 * ramp(f, ps[1].s + 20, ps[1].s + 60));
  sensory = Math.max(sensory, sensoryS3) * (1 - ramp(f, tr.from - 6, tr.from + 20));
  s.zones = {thumb: f < sy.from ? zonesOn : z(14), index: f < sy.from ? zonesOn : z(46), middle: f < sy.from ? zonesOn : z(78), ring: f < sy.from ? zonesOn : z(104)};
  s.sensory = sensory;
  s.tingle = 0.9 * sensory;
  // 4: assessment → neutral wrist → splint
  s.flex = 0.5 * ramp(f, tr.from + 6, tr.from + 40) * (1 - ramp(f, pt[0].s + 50, pt[0].s + 96));
  s.splint = ramp(f, pt[1].s + 2, pt[1].s + 46);
  skin = f >= tr.from ? Math.max(skin, ramp(f, tr.from - 4, tr.from + 20)) : skin;
  // 5: gentle ghost of the anatomy as the closing background
  const ghost = ramp(f, end(tr) - 18, cl.from + 30);
  const outS4 = ramp(f, end(tr) - 30, end(tr) + 10);
  skin = skin * (1 - outS4) + 0.16 * ghost;
  s.splint *= 1 - outS4;
  s.flex *= 1 - outS4;
  const gb = 0.55 * ghost;
  s.bones = Math.max(s.bones, gb); s.tendons = Math.max(s.tendons, gb * 0.8); s.nerve = Math.max(s.nerve, gb); s.nerveGlow = Math.max(s.nerveGlow, 0.35 * ghost);
  s.skin = skin;
  return s;
};

/** Cross-section inset opacity (anatomy scene only). */
export const axialAt = (f: number, tl: TimelineItem[], content: Content) => {
  const an = at(tl, 'anatomy'), sy = at(tl, 'symptoms');
  const pa = phrases(tl, content, 'anatomy');
  const op = ramp(f, pa[1].s + 28, pa[1].s + 58) * (1 - ramp(f, sy.from - 2, sy.from + 22));
  return {opacity: op, compression: ramp(f, pa[1].s + 44, pa[1].s + 100), arrows: ramp(f, pa[1].s + 56, pa[1].s + 90) * (1 - ramp(f, end(an) - 10, end(an) + 8))};
};
void reach; void sx;
