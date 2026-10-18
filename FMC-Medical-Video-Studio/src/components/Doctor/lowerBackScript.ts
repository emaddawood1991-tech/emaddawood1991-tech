import * as THREE from 'three';
import type {Content, SceneId, VoiceManifest} from '../../lib/schema';
import {FPS, type TimelineItem} from '../../lib/timeline';
import {A, type Clip, type Perf} from './engine';
import type {V3} from './skeleton';
import type {CamKey} from '../Medical3D';

/** World placement of the hologram spine (original LumbarSpine model, scaled to ~0.75 m). */
export const SPINE = {pos: [0.34, 1.2, -0.1] as V3, scale: 0.034, rotY: Math.PI * 0.82, center: [0, -2.0, -1.5] as V3};
export const spineWorld = (local: V3): V3 => {
  const p = new THREE.Vector3(local[0] - SPINE.center[0], local[1] - SPINE.center[1], local[2] - SPINE.center[2]).multiplyScalar(SPINE.scale);
  p.applyEuler(new THREE.Euler(0, SPINE.rotY, 0));
  return [SPINE.pos[0] + p.x, SPINE.pos[1] + p.y, SPINE.pos[2] + p.z];
};
/** Where a fingertip should hover for a spine level (centre line, offset toward the presenter). */
const tipAt = (localY: number, dx = -0.115): V3 => {
  const w = spineWorld([0, localY, -1.5]);
  return [w[0] + dx, w[1], w[2] + 0.07];
};
export const TIP = {
  vertebrae: () => tipAt(0),
  discs: () => tipAt(2.0),
  nerves: () => tipAt(-7.0, -0.12),
  l45: () => tipAt(-6.1),
  lowerNerve: () => tipAt(-10.5, -0.12),
};

const at = (tl: TimelineItem[], id: SceneId) => tl.find((t) => t.id === id)!;
/** Split a scene's narration into phrases proportional to character count (comma/period separated). */
const phrases = (tl: TimelineItem[], content: Content, id: SceneId) => {
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

export const buildPerformance = (tl: TimelineItem[], content: Content, visemes: {fps: number; scenes: Record<string, {o: number[]; w: number[]}>} | null): Perf => {
  const o = at(tl, 'opening'), an = at(tl, 'anatomy'), sy = at(tl, 'symptoms'), tr = at(tl, 'treatment'), fm = at(tl, 'fmc'), cl = at(tl, 'closing');
  const pa = phrases(tl, content, 'anatomy');
  const ps = phrases(tl, content, 'symptoms');
  const pt = phrases(tl, content, 'treatment');
  const pf = phrases(tl, content, 'fmc');
  const clips: Clip[] = [];
  const C = clips.push.bind(clips);
  const sceneEnd = (t: TimelineItem) => t.from + t.duration;

  // ---- Scene 1: walks in, looks at the camera, waves, asks the question with concern
  C(A.lookAtCamera(48, o.from + o.duration + 6));
  C(A.wave(92, 138, 'R'));
  C(A.react(120, an.from + 20, 'concerned'));

  // ---- Scene 2: turns, hand on lower back (pain location), then the spine appears and he points
  const backStart = an.from + 10, backEnd = pa[0].e + 30;
  C({...A.pointToLowerBack(backStart, backEnd, 'R'), body: (t, f) => ({torso: {pitch: -0.05}, face: {furrow: 0.45, smile: 0.1, brow: 0.2}, painGlow: Math.min(1, Math.max(0, (f - (backStart + 28)) / 22)) * 0.85 * (1 - Math.min(1, Math.max(0, (f - (backEnd - 20)) / 20))), root: {}})});
  C({name: 'turn-profile', start: an.from + 4, end: backEnd + 14, inF: 24, outF: 22, body: () => ({root: {yaw: Math.PI * 0.5}})});
  C(A.pointAtAnatomy(pa[0].e - 6, pa[1].s + 6, () => TIP.vertebrae(), 'L'));
  C(A.pointAtAnatomy(pa[1].s + 8, pa[2].s + 4, () => TIP.discs(), 'L'));
  C(A.pointAtAnatomy(pa[2].s + 6, sceneEnd(an) - 6, () => TIP.nerves(), 'L'));
  C({name: 'face-spine', start: backEnd - 16, end: sceneEnd(an) + 4, inF: 24, outF: 16, body: () => ({root: {yaw: 0.78}, face: {smile: 0.25, brow: 0.2}})});
  C(A.lookAtAnatomy(backEnd - 4, pa[2].e - 40, spineWorld([0, 0, -1.5])));
  C(A.lookAtCamera(pa[2].e - 36, sceneEnd(an)));

  // ---- Scene 3: symptoms — concern, point at the disc/nerve, sweep to the leg, reassure
  C({name: 'stay-3q', start: sceneEnd(an) - 6, end: sceneEnd(sy) + 4, inF: 14, outF: 20, body: () => ({root: {yaw: 0.62}})});
  C(A.react(ps[0].s, ps[1].s - 10, 'concerned'));
  C({...A.pointToLowerBack(ps[0].s + 6, ps[1].s + 10, 'R'), body: () => ({torso: {pitch: 0.08}, face: {furrow: 0.5, smile: 0, brow: 0.3}})});
  C(A.lookAtCamera(ps[0].s + 4, ps[1].s - 8));
  C(A.pointAtAnatomy(ps[1].s, ps[2].s + 4, () => TIP.l45(), 'L'));
  C(A.lookAtAnatomy(ps[1].s + 6, ps[2].s - 4, spineWorld([0, -6, -1.5])));
  C({...A.pointToKnee(ps[2].s, ps[3].s - 6, 'R'), look: [REST_X, 0.55, 0.3]});
  C(A.react(ps[2].s, ps[3].s - 6, 'concerned'));
  C(A.explain(ps[3].s, sceneEnd(sy) + 4, 'L', true));
  C(A.react(ps[3].s + 20, sceneEnd(sy), 'happy'));

  // ---- Scene 4: treatment — reassurance, present the model, posture, progressive steps
  C({name: 'stay-3q-b', start: sceneEnd(sy), end: sceneEnd(tr), inF: 12, outF: 20, body: () => ({root: {yaw: 0.55}})});
  C(A.explain(pt[0].s, pt[0].e + 6, 'R', true));
  C(A.react(pt[0].s, pt[1].s, 'happy'));
  C(A.presentMedicalModel(pt[1].s, pt[2].s, [spineWorld([0, 0, -1.5])[0] - 0.14, spineWorld([0, 0, -1.5])[1] - 0.05, spineWorld([0, 0, -1.5])[2] + 0.1], 'L'));
  C(A.lookAtAnatomy(pt[1].s + 4, pt[2].s - 6, spineWorld([0, 0, -1.5])));
  C({name: 'posture', start: pt[2].s - 6, end: pt[3].s + 8, inF: 14, outF: 14, body: (t) => ({torso: {pitch: Math.max(-0.06, 0.2 - 0.26 * Math.min(1, t / 40))}, head: {pitch: -0.05}, face: {smile: 0.55, brow: 0.3}})});
  C(A.explain(pt[2].s, pt[2].e + 4, 'R', false));
  C(A.progressSteps(pt[3].s, sceneEnd(tr)));

  // ---- Scene 5: FMC message — welcome, explain, then a serious safety note
  C({name: 'face-camera', start: sceneEnd(tr) - 4, end: sceneEnd(fm) + 4, inF: 22, outF: 22, body: () => ({root: {yaw: 0.0}})});
  C(A.lookAtCamera(fm.from + 10, sceneEnd(fm)));
  C(A.explain(pf[0].s, pf[1].s + 10, 'L', true));
  C(A.react(pf[0].s, pf[1].e, 'happy'));
  C(A.explain(pf[1].s + 10, pf[2].s, 'R', false));
  C(A.react(pf[2].s, pf[4].e, 'serious'));
  C(A.attention(pf[2].s + 6, pf[3].s + 10, 'R'));
  C({...A.explain(pf[3].s, pf[4].s, 'L', false), body: () => ({face: {furrow: 0.4, smile: 0.0}})});
  C({...A.explain(pf[4].s, sceneEnd(fm) + 2, 'L', true), body: () => ({face: {furrow: 0.15, smile: 0.5, brow: 0.2}})});

  // ---- Scene 6: closing — friendly wave with a small hop
  C(A.lookAtCamera(cl.from, cl.from + cl.duration));
  C(A.react(cl.from + 6, cl.from + cl.duration, 'happy'));
  C(A.wave(cl.from + 18, cl.from + cl.duration - 2, 'R'));
  C(A.jump(cl.from + 60, 0.07));

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

export const buildCamera = (tl: TimelineItem[]): CamKey[] => {
  const an = at(tl, 'anatomy'), sy = at(tl, 'symptoms'), tr = at(tl, 'treatment'), fm = at(tl, 'fmc'), cl = at(tl, 'closing');
  const e = (t: TimelineItem) => t.from + t.duration;
  return [
    {f: 0, pos: [0, 1.28, 4.4], target: [-0.1, 1.12, 0], fov: 34},
    {f: 140, pos: [0, 1.28, 4.3], target: [-0.12, 1.12, 0], fov: 34},
    {f: an.from + 100, pos: [-0.06, 1.28, 3.8], target: [-0.1, 1.12, 0], fov: 34},
    {f: an.from + 190, pos: [-0.02, 1.26, 3.6], target: [-0.02, 1.14, -0.05], fov: 34},
    {f: e(an) - 20, pos: [0.0, 1.24, 3.5], target: [-0.02, 1.16, -0.08], fov: 34},
    {f: sy.from + 140, pos: [0.0, 1.22, 3.5], target: [-0.02, 1.16, -0.08], fov: 34},
    {f: sy.from + 290, pos: [0.12, 1.16, 3.0], target: [0.1, 1.12, -0.1], fov: 32},
    {f: sy.from + 380, pos: [0.3, 1.12, 2.3], target: [0.3, 1.1, -0.1], fov: 29},
    {f: e(sy) - 10, pos: [0.08, 1.24, 3.4], target: [0.0, 1.16, -0.05], fov: 34},
    {f: e(tr), pos: [0.04, 1.26, 3.6], target: [-0.02, 1.16, -0.05], fov: 34},
    {f: fm.from + 60, pos: [-0.16, 1.26, 3.2], target: [-0.3, 1.2, 0], fov: 32},
    {f: e(fm), pos: [-0.16, 1.28, 3.3], target: [-0.3, 1.22, 0], fov: 32},
    {f: cl.from + 40, pos: [-0.2, 1.7, 3.2], target: [-0.26, 2.0, 0], fov: 32},
    {f: e(cl) + 30, pos: [-0.2, 1.7, 3.1], target: [-0.26, 2.0, 0], fov: 32},
  ];
};
