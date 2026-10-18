/** Objective animation QC for the FMC Doctor performance: foot sliding, joint snaps, leg reach. Output: output/V5/anim_qc.json */
import * as THREE from 'three';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {loadContent, p} from '../lib/common';
import {ManifestSchema} from '../src/lib/schema';
import {computeTimeline, totalFrames, FPS} from '../src/lib/timeline';
import {buildCamera, buildPerformance} from '../src/components/Doctor/lowerBackScript';
import {evaluate} from '../src/components/Doctor/engine';
import {DIM} from '../src/components/Doctor/skeleton';

const slug = 'lower-back-pain';
const c = loadContent(slug);
const manifest = ManifestSchema.parse(JSON.parse(readFileSync(p('assets', 'audio', slug, 'manifest.json'), 'utf8')));
const vis = JSON.parse(readFileSync(p('assets', 'audio', slug, 'visemes.json'), 'utf8'));
const tl = computeTimeline(c, manifest);
const perf = buildPerformance(tl, c, vis);
const keys = buildCamera(tl);
const total = totalFrames(tl);
const camPos = (f: number): [number, number, number] => keys[Math.min(keys.length - 1, keys.findIndex((k) => k.f >= f) < 0 ? keys.length - 1 : keys.findIndex((k) => k.f >= f))].pos;

const ankle = (pose: ReturnType<typeof evaluate>, side: 'L' | 'R') => {
  const mRoot = new THREE.Matrix4().compose(new THREE.Vector3(pose.root.x, pose.root.y, pose.root.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, pose.root.yaw, 0)), new THREE.Vector3(1, 1, 1));
  const mHips = new THREE.Matrix4().compose(new THREE.Vector3(0, DIM.hipY + pose.hips.yOffset, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, pose.hips.yaw, pose.hips.roll)), new THREE.Vector3(1, 1, 1));
  const leg = pose.legs[side];
  const hip = new THREE.Vector3((side === 'L' ? 1 : -1) * DIM.hipX, 0, 0);
  const knee = hip.clone().add(new THREE.Vector3(0, -DIM.thigh, 0).applyQuaternion(leg.thigh));
  const an = knee.clone().add(new THREE.Vector3(0, -DIM.shin, 0).applyQuaternion(leg.thigh.clone().multiply(leg.shin)));
  return an.applyMatrix4(mRoot.clone().multiply(mHips));
};

const angVel = (a: THREE.Quaternion, b: THREE.Quaternion) => 2 * Math.acos(Math.min(1, Math.abs(a.dot(b))));
let prev = evaluate(perf, 0, FPS, camPos(0));
let prevAnk = {L: ankle(prev, 'L'), R: ankle(prev, 'R')};
const walkSlide: number[] = [], standSlide: number[] = [];
let maxVel = 0, maxVelAt = 0, snaps = 0;
const worstJoint: Record<string, number> = {};
for (let f = 1; f < total; f++) {
  const pose = evaluate(perf, f, FPS, camPos(f));
  const ank = {L: ankle(pose, 'L'), R: ankle(pose, 'R')};
  for (const s of ['L', 'R'] as const) {
    const grounded = ank[s].y < DIM.ankleH + 0.012 && prevAnk[s].y < DIM.ankleH + 0.012;
    if (grounded) {
      const d = Math.hypot(ank[s].x - prevAnk[s].x, ank[s].z - prevAnk[s].z) * 100; // cm per frame
      (f < (perf.walk?.end ?? 0) ? walkSlide : standSlide).push(d);
      if (d > 1.0) console.log('slide', f, s, d.toFixed(2), 'rootY', pose.root.y.toFixed(3));
    }
  }
  const pairs: [string, THREE.Quaternion, THREE.Quaternion][] = [
    ['armL.upper', prev.arms.L.upper, pose.arms.L.upper], ['armR.upper', prev.arms.R.upper, pose.arms.R.upper],
    ['armL.fore', prev.arms.L.fore, pose.arms.L.fore], ['armR.fore', prev.arms.R.fore, pose.arms.R.fore],
    ['legL.thigh', prev.legs.L.thigh, pose.legs.L.thigh], ['legR.thigh', prev.legs.R.thigh, pose.legs.R.thigh],
  ];
  for (const [n, a, b] of pairs) {
    const v = angVel(a, b);
    worstJoint[n] = Math.max(worstJoint[n] ?? 0, v);
    if (v > maxVel) { maxVel = v; maxVelAt = f; }
    if (v > 0.45) { snaps++; console.log('snap', f, n, v.toFixed(2)); }
  }
  const yawStep = Math.abs(pose.root.yaw - prev.root.yaw);
  if (yawStep > 0.12) snaps++;
  prev = pose; prevAnk = ank;
}
const stat = (a: number[]) => ({frames: a.length, mean: +(a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)).toFixed(3), max: +Math.max(0, ...a).toFixed(3), over1cm: a.filter((v) => v > 1.0).length});
const report = {
  totalFrames: total,
  groundedFootSpeed_cmPerFrame_whileWalking: stat(walkSlide),
  groundedFootSpeed_cmPerFrame_afterWalk: stat(standSlide),
  maxJointAngularStep_radPerFrame: {value: +maxVel.toFixed(3), atFrame: maxVelAt, perJoint: Object.fromEntries(Object.entries(worstJoint).map(([k, v]) => [k, +v.toFixed(3)]))},
  snapFramesOver0_45rad: snaps,
  note: 'Sliding is estimated from the rendered skeleton (ankle world positions). A planted foot is ~0 cm/frame; the root walks ~1.5 cm/frame.',
};
mkdirSync(p('output', 'V5'), {recursive: true});
writeFileSync(p('output', 'V5', 'anim_qc.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
