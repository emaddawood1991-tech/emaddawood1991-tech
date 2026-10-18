import {CAM} from './cameraPresets';
import * as THREE from 'three';
import type {Content, SceneId} from '../../lib/schema';
import type {TimelineItem} from '../../lib/timeline';
import {A, type Clip, type Perf} from './engine';
import type {V3} from './skeleton';
import type {CamKey} from '../Medical3D';

/** Hologram spine: bigger than the presenter's torso so the anatomy is the visual focus (V6). */
export const SPINE = {pos: [0.45, 1.22, -0.1] as V3, scale: 0.044, baseRot: Math.PI * 0.82, center: [0, -2.0, -1.5] as V3};
export const spineRot = (f: number) => SPINE.baseRot + 0.09 * Math.sin(f / 110);
export const spineWorld = (local: V3, f: number): V3 => {
  const p = new THREE.Vector3(local[0] - SPINE.center[0], local[1] - SPINE.center[1], local[2] - SPINE.center[2]).multiplyScalar(SPINE.scale);
  p.applyEuler(new THREE.Euler(0, spineRot(f), 0));
  return [SPINE.pos[0] + p.x, SPINE.pos[1] + p.y, SPINE.pos[2] + p.z];
};
/** Where a fingertip should hover for a spine level (centre line, offset toward the presenter). */
const tipAt = (localY: number, f: number, dx = -0.15): V3 => {
  const w = spineWorld([0, localY, -1.5], f);
  return [w[0] + dx, w[1], w[2] + 0.08];
};
export const TIP = {
  vertebrae: (f: number) => tipAt(0, f),
  discs: (f: number) => tipAt(2.0, f),
  nerves: (f: number) => tipAt(-7.0, f, -0.16),
  l45: (f: number) => tipAt(-6.1, f),
};

const at = (tl: TimelineItem[], id: SceneId) => tl.find((t) => t.id === id)!;
/** Split a scene's narration into phrases proportional to character count (comma/period separated). */
export const phrases = (tl: TimelineItem[], content: Content, id: SceneId) => {
  const item = at(tl, id);
  const text = content.scenes.find((s) => s.id === id)!.narration;
  const parts = text.split(/[،.؟]\s*/).filter(Boolean);
  const total = parts.reduce((a, p) => a + p.length, 0);
  const start = item.from + item.audioFrom;
  let cur = start;
  return parts.map((p) => {
    const d = Math.round((p.length / total) * item.audioFrames);
    const r = {s: cur, e: cur + d};
    cur += d;
    return r;
  });
};

export const REST_X = -0.3;
const lookSpine = (f: number, y = 0): V3 => spineWorld([0, y, -1.5], f);

export const buildPerformance = (tl: TimelineItem[], content: Content, visemes: {fps: number; scenes: Record<string, {o: number[]; w: number[]}>} | null): Perf => {
  const o = at(tl, 'opening'), an = at(tl, 'anatomy'), sy = at(tl, 'symptoms'), tr = at(tl, 'treatment'), fm = at(tl, 'fmc'), cl = at(tl, 'closing');
  const pa = phrases(tl, content, 'anatomy');
  const ps = phrases(tl, content, 'symptoms');
  const pt = phrases(tl, content, 'treatment');
  const pf = phrases(tl, content, 'fmc');
  const clips: Clip[] = [];
  const C = clips.push.bind(clips);
  const end = (t: TimelineItem) => t.from + t.duration;
  // pointing targets follow the (slowly rotating) hologram frame by frame
  const pointer = (c: Clip, fn: (f: number) => V3, side: 'L' | 'R' = 'L'): Clip => {
    const base = A.pointAtAnatomy(c.start, c.end, [0, 0, 0], side);
    return {...base, arms: {[side]: ((cx: any, t: number) => (A.pointAtAnatomy(0, 1, fn(cx.frame), side).arms as any)[side](cx, t)) as any}};
  };
  const P = (s: number, e: number, fn: (f: number) => V3, side: 'L' | 'R' = 'L') => C(pointer({...A.idle(s, e), name: 'p'}, fn, side));

  // ---- 1 · Doctor introduces the problem (full body, ~47 % of frame): walks in, looks at camera, one short wave, concerned question
  C(A.lookAtCamera(46, an.from + 10));
  C(A.wave(88, 132, 'R'));
  C(A.react(112, an.from + 14, 'concerned'));

  // ---- 2 · Demonstrates the pain location: turns slightly, hand on the lumbar region, red highlight on the coat
  const backS = an.from + 18, backE = pa[0].e + 18;
  C({...A.pointToLowerBack(backS, backE, 'R'), body: (_t, f) => ({torso: {pitch: -0.04}, face: {furrow: 0.4, smile: 0.1, brow: 0.2}, painGlow: Math.min(1, Math.max(0, (f - (backS + 24)) / 22)) * 0.9 * (1 - Math.min(1, Math.max(0, (f - (backE - 18)) / 18)))})});
  C({name: 'turn-3q-back', start: an.from + 6, end: backE + 20, inF: 26, outF: 24, body: () => ({root: {yaw: 1.0}})});
  // doctor leaves the frame (full-screen anatomy), narration continues; he returns beside the model for the nerve explanation
  C({name: 'face-spine', start: backE - 10, end: end(an) + 6, inF: 26, outF: 18, body: () => ({root: {yaw: 0.8}, face: {smile: 0.25, brow: 0.2}})});
  C(A.lookAtAnatomy(backE, pa[2].s + 10, lookSpine(an.from + 300)));
  P(pa[2].s + 14, end(an) - 8, (f) => TIP.nerves(f), 'L');
  C(A.lookAtCamera(pa[2].e - 34, end(an)));

  // ---- 3 · Symptoms
  C({name: 'stay-3q', start: end(an) - 6, end: end(sy) + 4, inF: 14, outF: 20, body: () => ({root: {yaw: 0.55}})});
  C(A.react(ps[0].s, ps[1].s - 10, 'concerned'));
  C({...A.pointToLowerBack(ps[0].s + 4, ps[1].s + 8, 'R'), body: () => ({torso: {pitch: 0.06}, face: {furrow: 0.5, smile: 0, brow: 0.3}})});
  C(A.lookAtCamera(ps[0].s + 4, ps[1].s - 8));
  P(ps[1].s, ps[2].s + 4, (f) => TIP.l45(f), 'L');
  C(A.lookAtAnatomy(ps[1].s + 6, ps[2].s - 4, lookSpine(ps[1].s, -6)));
  C({...A.pointToKnee(ps[2].s, ps[3].s - 6, 'R'), look: [REST_X, 0.55, 0.3]});
  C(A.react(ps[2].s, ps[3].s - 6, 'concerned'));
  C(A.explain(ps[3].s, end(sy) + 4, 'L', true));
  C(A.react(ps[3].s + 20, end(sy), 'happy'));

  // ---- 4 · Treatment: reassurance, present the model (flexion demo), posture / rehab demo, gradual progress
  C({name: 'stay-3q-b', start: end(sy), end: pt[2].s - 12, inF: 12, outF: 20, body: () => ({root: {yaw: 0.5}})});
  C(A.explain(pt[0].s, pt[0].e + 6, 'R', true));
  C(A.react(pt[0].s, pt[1].s, 'happy'));
  C(A.presentMedicalModel(pt[1].s, pt[2].s, [spineWorld([0, 0, -1.5], pt[1].s)[0] - 0.2, spineWorld([0, 0, -1.5], pt[1].s)[1] - 0.05, spineWorld([0, 0, -1.5], pt[1].s)[2] + 0.1], 'L'));
  C(A.lookAtAnatomy(pt[1].s + 4, pt[2].s - 6, lookSpine(pt[1].s)));
  C({name: 'face-camera-b', start: pt[2].s - 12, end: end(tr) + 4, inF: 22, outF: 22, body: () => ({root: {yaw: 0.0}})});
  C({name: 'posture', start: pt[2].s - 6, end: pt[2].e + 6, inF: 14, outF: 14, body: (t) => ({torso: {pitch: Math.max(-0.05, 0.16 - 0.22 * Math.min(1, t / 40))}, head: {pitch: -0.04}, face: {smile: 0.55, brow: 0.3}})});
  C(A.rehabReset(pt[2].s + 30, pt[3].s + 40));
  C(A.progressSteps(pt[3].s + 20, end(tr)));

  // ---- 5 · FMC message
  C({name: 'face-camera', start: end(tr) - 4, end: end(fm) + 4, inF: 22, outF: 22, body: () => ({root: {yaw: 0.0}})});
  C(A.lookAtCamera(fm.from + 10, end(fm)));
  C(A.explain(pf[0].s, pf[1].s + 10, 'L', true));
  C(A.react(pf[0].s, pf[1].e, 'happy'));
  C(A.explain(pf[1].s + 10, pf[2].s, 'R', false));
  C(A.react(pf[2].s, pf[4].e, 'serious'));
  C(A.attention(pf[2].s + 6, pf[3].s + 10, 'R'));
  C({...A.explain(pf[3].s, pf[4].s, 'L', false), body: () => ({face: {furrow: 0.4, smile: 0.0}})});
  C({...A.explain(pf[4].s, end(fm) + 2, 'L', true), body: () => ({face: {furrow: 0.15, smile: 0.5, brow: 0.2}})});

  // ---- 6 · Closing: friendly wave beside the logo
  C(A.lookAtCamera(cl.from, end(cl)));
  C(A.react(cl.from + 6, end(cl), 'happy'));
  C(A.wave(cl.from + 24, cl.from + 80, 'R'));
  C(A.jump(cl.from + 74, 0.05));

  const walk = {start: 0, end: 84, x0: -1.55, x1: REST_X, z: 0, travelYaw: Math.PI / 2, turnStart: 58, turnEnd: 98, finalYaw: 0};
  const vis = (frame: number) => {
    if (!visemes) return {o: 0, w: 1};
    for (const t of tl) {
      const s = t.from + t.audioFrom;
      if (frame >= s && frame < s + t.audioFrames) {
        const sc = visemes.scenes[t.id];
        const k = frame - s;
        return {o: sc?.o[k] ?? 0, w: sc?.w[k] ?? 1};
      }
    }
    return {o: 0, w: 1};
  };
  return {clips, walk, visemes: vis, restX: REST_X, restZ: 0};
};

// Camera presets live in cameraPresets.ts (with enforced per-shot framing standards).
export const buildCamera = (tl: TimelineItem[], content?: Content): CamKey[] => {
  const o = at(tl, 'opening'), an = at(tl, 'anatomy'), sy = at(tl, 'symptoms'), tr = at(tl, 'treatment'), fm = at(tl, 'fmc'), cl = at(tl, 'closing');
  const e = (t: TimelineItem) => t.from + t.duration;
  const k = (f: number, c: {pos: V3; target: V3; fov: number}): CamKey => ({f, pos: c.pos, target: c.target, fov: c.fov});
  const ps = content ? phrases(tl, content, 'symptoms') : [{s: sy.from + 18, e: 0}, {s: sy.from + 148, e: 0}, {s: sy.from + 345, e: 0}, {s: sy.from + 440, e: 0}];
  const pt = content ? phrases(tl, content, 'treatment') : [{s: tr.from + 18, e: 0}, {s: tr.from + 110, e: 0}, {s: tr.from + 310, e: 0}, {s: tr.from + 395, e: 0}];
  const pa = content ? phrases(tl, content, 'anatomy') : [{s: an.from + 18, e: an.from + 138}, {s: an.from + 138, e: 0}, {s: an.from + 302, e: 0}];
  return [
    k(0, {...CAM.WIDE, pos: [0, 1.4, 6.2]}),
    k(o.from + 100, CAM.WIDE),
    k(an.from + 22, CAM.WIDE), k(an.from + 66, CAM.CLOSE),             // turn + hand on the lumbar region (waist-up)
    k(pa[0].e - 22, CAM.CLOSE), k(pa[0].e + 34, CAM.ANAT),             // dolly into the full-screen anatomy
    k(pa[2].s - 6, CAM.ANAT), k(pa[2].s + 44, CAM.BESIDE),             // doctor returns beside the model for the nerve roots
    k(e(an), CAM.BESIDE), k(ps[0].s + 10, CAM.CLOSE),                // symptoms: concern (close)
    k(ps[1].s - 4, CAM.CLOSE), k(ps[1].s + 40, CAM.L45),               // disc protrusion at L4–L5
    k(ps[2].s - 10, CAM.L45), k(ps[2].s + 40, CAM.BESIDE),             // pain spreading to the leg
    k(ps[3].s - 4, CAM.BESIDE), k(ps[3].s + 36, CAM.CLOSE),
    k(e(sy), CAM.CLOSE), k(tr.from + 70, CAM.CLOSE),                 // treatment
    k(pt[1].s, CAM.CLOSE), k(pt[1].s + 46, CAM.BESIDE), k(pt[1].s + 110, CAM.ANAT),   // spine flexion demonstration
    k(pt[2].s - 14, CAM.ANAT), k(pt[2].s + 34, CAM.WIDE),              // posture / rehab demonstration (full body)
    k(pt[3].s + 14, CAM.WIDE), k(pt[3].s + 60, CAM.CLOSE),
    k(e(tr), CAM.CLOSE), k(fm.from + 70, {...CAM.CLOSE, pos: [-0.18, 1.32, 3.4], target: [-0.3, 1.26, 0]}),
    k(e(fm), {...CAM.CLOSE, pos: [-0.18, 1.32, 3.4], target: [-0.3, 1.26, 0]}),
    k(cl.from + 44, CAM.END), k(e(cl) + 30, CAM.END),
  ];
};
