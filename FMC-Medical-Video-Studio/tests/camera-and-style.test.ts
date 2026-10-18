import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sampleCameraFlow, type CamKey} from '../src/lib/cameraFlow';
import {TRANSITIONS, transitionKeys, revealAt, type TransitionName} from '../src/lib/continuousTransitions';
import {DIRECTOR_STYLES, selectDirectorStyle} from '../src/lib/directorStyles';
import {CAM, SHOT_STANDARDS, doctorPct, visibleHeightM} from '../src/components/Doctor/cameraPresets';
import {actingEase, actingExtremes, GESTURE_ACTING} from '../src/components/Doctor/actingPrinciples';
import {sceneVarietyProblems} from '../src/lib/fmcStandards';

const keys: CamKey[] = [
  {f: 0, pos: [0, 1.4, 6], target: [0, 1.2, 0], fov: 34},
  {f: 60, pos: [0, 1.4, 6], target: [0, 1.2, 0], fov: 34},                // hold
  {f: 120, pos: [0.4, 1.3, 3], target: [0.4, 1.2, 0], fov: 34},
  {f: 180, pos: [0.45, 1.25, 2.6], target: [0.45, 1.2, -0.1], fov: 32},
  {f: 240, pos: [0.1, 1.5, 6.4], target: [0.1, 1.3, 0], fov: 34},
];
const at = (f: number) => sampleCameraFlow(keys, f);
const flat = (f: number) => { const s = at(f); return [...s.pos, ...s.target, s.fov]; };

test('camera path passes exactly through every key', () => {
  for (const k of keys) { const s = at(k.f); k.pos.forEach((v, i) => assert.ok(Math.abs(v - s.pos[i]) < 1e-9)); }
});

test('camera path is C1: no velocity jump anywhere (no stop-start at keys)', () => {
  let worst = 0;
  for (let f = 1; f < 239; f++) { const a = flat(f - 1), b = flat(f), c = flat(f + 1); for (let i = 0; i < 7; i++) worst = Math.max(worst, Math.abs((c[i] - b[i]) - (b[i] - a[i]))); }
  assert.ok(worst < 0.2, `max second difference ${worst}`);
});

test('a through-key (not a hold) does not stop: speed at key 120 > 0', () => {
  const v = Math.abs(flat(121)[2] - flat(119)[2]) / 2;
  assert.ok(v > 0.005, `z speed at key = ${v}`);
});

test('hold keys rest: zero speed at the end of a hold', () => {
  const v = Math.abs(flat(61)[2] - flat(59)[2]) / 2;
  const through = Math.abs(flat(121)[2] - flat(119)[2]) / 2;
  assert.ok(v < 0.1 * through, `speed at hold ${v} vs through-key ${through}`);
});

test('no overshoot: each channel stays inside the range of the keys', () => {
  for (let f = 0; f <= 240; f++) {
    const s = flat(f);
    for (let i = 0; i < 7; i++) {
      const vals = keys.map((k) => [...k.pos, ...k.target, k.fov ?? 35][i]);
      assert.ok(s[i] >= Math.min(...vals) - 1e-9 && s[i] <= Math.max(...vals) + 1e-9, `ch${i} f${f}`);
    }
  }
});

test('transitions carry no sound and are calm (1.3–3 s, bounded camera speed)', () => {
  for (const n of Object.keys(TRANSITIONS) as TransitionName[]) {
    const t = TRANSITIONS[n];
    assert.equal(t.sfx, null);
    assert.ok(t.frames[0] >= 40 && t.frames[1] <= 90, n);
    const from = CAM.CLOSE, to = n === 'explanationToTreatment' ? CAM.WIDE : CAM.ANAT;
    const ks = transitionKeys(n, 0, t.frames[1], from, to);
    let maxSpeed = 0;
    for (let f = 1; f <= t.frames[1]; f++) { const a = sampleCameraFlow(ks, f - 1).pos, b = sampleCameraFlow(ks, f).pos; maxSpeed = Math.max(maxSpeed, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 30); }
    assert.ok(maxSpeed <= DIRECTOR_STYLES.documentary.camera.maxCameraSpeedMPerSec * 1.6, `${n} peak speed ${maxSpeed.toFixed(2)} m/s`);
    const r0 = revealAt(n, 0, t.frames[1], 0), r1 = revealAt(n, 0, t.frames[1], t.frames[1]);
    assert.deepEqual([r0.outgoing, r0.incoming, r1.outgoing, r1.incoming], [1, 0, 0, 1]);
  }
});

test('camera presets satisfy their framing standards (doctor size / visible height)', () => {
  for (const [kind, st] of Object.entries(SHOT_STANDARDS)) {
    const c = CAM[st.preset];
    if (st.doctorPct) { const p = doctorPct(c); assert.ok(p >= st.doctorPct[0] && p <= st.doctorPct[1], `${kind}: ${p.toFixed(1)}%`); }
    if (st.visibleMaxM) assert.ok(visibleHeightM(c) <= st.visibleMaxM, `${kind}: ${visibleHeightM(c).toFixed(2)} m`);
  }
});

test('three director styles; none uses a forbidden look; all keep continuous-camera transitions with null sfx', () => {
  assert.deepEqual(Object.keys(DIRECTOR_STYLES).sort(), ['commercial', 'documentary', 'explainer3d']);
  for (const s of Object.values(DIRECTOR_STYLES)) {
    assert.equal(s.transitions.primary, 'continuous-camera');
    assert.equal(s.transitions.sfx, null);
    assert.ok(s.typography.cardPx >= 40 && s.typography.titlePx >= 64 && s.typography.maxCards <= 3);
    assert.ok(s.look.forbidden.includes('cyberpunk') && s.look.forbidden.includes('cartoon') && s.look.forbidden.includes('whoosh'));
    for (const word of ['cyberpunk', 'cartoon', 'gaming', 'neon', 'glitch']) assert.ok(!JSON.stringify({...s, look: {...s.look, forbidden: []}}).toLowerCase().includes(word), `${s.key} mentions ${word}`);
    assert.ok(s.transitions.allowed.every((t) => t in TRANSITIONS));
  }
});

test('style selector picks by topic', () => {
  assert.equal(selectDirectorStyle({topic: 'lower back pain', tags: ['spine']}).style.key, 'documentary');
  assert.equal(selectDirectorStyle({topic: 'office posture tips', tags: ['posture', 'prevention']}).style.key, 'commercial');
  assert.equal(selectDirectorStyle({topic: 'carpal tunnel', tags: ['nerve', 'wrist'], goal: 'explain-mechanism'}).style.key, 'explainer3d');
  assert.equal(selectDirectorStyle({topic: 'something unknown'}).style.key, 'documentary');
});

test('acting curve: anticipation dip, overshoot, exact 0 at start and exact 1 at end, continuous', () => {
  const ex = actingExtremes(GESTURE_ACTING);
  assert.ok(ex.min <= -GESTURE_ACTING.anticipate * 0.95 && ex.min >= -0.1);
  assert.ok(ex.max >= 1 + GESTURE_ACTING.overshoot * 0.95 && ex.max <= 1.1);
  assert.equal(actingEase(0, GESTURE_ACTING), 0);
  assert.equal(actingEase(1, GESTURE_ACTING), 1);
  let prev = 0;
  for (let i = 1; i <= 400; i++) { const v = actingEase(i / 400, GESTURE_ACTING); assert.ok(Math.abs(v - prev) < 0.04, `jump at ${i / 400}`); prev = v; }
});

test('scene-variety rules', () => {
  assert.deepEqual(sceneVarietyProblems([{id: 'a', type: 'A', sec: 5}, {id: 'b', type: 'C', sec: 10}, {id: 'c', type: 'D', sec: 10}, {id: 'd', type: 'E', sec: 10}]), []);
  assert.ok(sceneVarietyProblems([{id: 'a', type: 'D', sec: 5}, {id: 'b', type: 'D', sec: 10}, {id: 'c', type: 'D', sec: 10}, {id: 'd', type: 'D', sec: 10}]).length >= 2);
});
