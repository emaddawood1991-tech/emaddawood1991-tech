import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync, rmSync, writeFileSync} from 'node:fs';
import {FMC_AUDIO, FMC_AUDIO_POLICY, assertSfxAllowed, enforceRenderProps, footageMuted, sfxAllowed, type SfxKind} from '../src/lib/audioPolicy';
import {ContentSchema, SceneSchema} from '../src/lib/schema';
import lowerBackPain from '../content/lower-back-pain.json';

const KINDS: SfxKind[] = ['transition', 'character', 'interface', 'cameraMovement', 'anatomyAnimation', 'automaticWhoosh'];

test('FMC_AUDIO defaults: narration + music only', () => {
  assert.equal(FMC_AUDIO.narration, true);
  assert.equal(FMC_AUDIO.backgroundMusic, true);
  for (const k of ['transitionSFX', 'cameraSFX', 'characterSFX', 'interfaceSFX', 'anatomySFX', 'autoSoundEffects', 'piano', 'percussion', 'vocals', 'footageAudio'] as const) assert.equal(FMC_AUDIO[k], false, k);
  assert.equal(FMC_AUDIO.musicStyle, 'ultra-soft-medical-ambient');
});

test('FMC_AUDIO is frozen (cannot be flipped at runtime)', () => {
  assert.ok(Object.isFrozen(FMC_AUDIO));
  assert.throws(() => { 'use strict'; (FMC_AUDIO as any).transitionSFX = true; }, TypeError);
  assert.ok(Object.isFrozen(FMC_AUDIO_POLICY));
});

test('legacy policy names are derived from FMC_AUDIO', () => {
  assert.equal(FMC_AUDIO_POLICY.transitionSfxEnabled, FMC_AUDIO.transitionSFX);
  assert.equal(FMC_AUDIO_POLICY.automaticWhooshesEnabled, FMC_AUDIO.autoSoundEffects);
  assert.equal(FMC_AUDIO_POLICY.footageAudioEnabled, FMC_AUDIO.footageAudio);
});

test('no effect kind is allowed, even with an approval id', () => {
  for (const k of KINDS) {
    assert.equal(sfxAllowed(k, 'approved-123'), false, k);
    assert.throws(() => assertSfxAllowed(k, 'approved-123'), /FMC audio policy/);
    assert.throws(() => assertSfxAllowed(k, null), /FMC audio policy/);
  }
});

test('render props cannot carry music or sfx', () => {
  assert.throws(() => enforceRenderProps({sfx: 'audio/sfx/whoosh.mp3', music: null}), /sfx/);
  assert.throws(() => enforceRenderProps({sfx: null, music: 'audio/music/x.wav'}), /post stage/);
  assert.deepEqual(enforceRenderProps({sfx: null, music: null}), {sfx: null, music: null});
});

test('footage audio is always muted by default', () => {
  assert.equal(footageMuted(), true);
  assert.equal(footageMuted(true), true); // even "approved" footage stays muted while FMC_AUDIO.footageAudio is false
});

test('scene schema rejects declared sound effects; shipped content declares none', () => {
  const scene = (lowerBackPain as any).scenes[0];
  assert.doesNotThrow(() => SceneSchema.parse(scene));
  assert.throws(() => SceneSchema.parse({...scene, sfx: ['soft-whoosh']}), /sound effects/);
  for (const s of (lowerBackPain as any).scenes) assert.deepEqual(s.sfx ?? [], [], `scene ${s.id}`);
  assert.doesNotThrow(() => ContentSchema.parse(lowerBackPain));
});

test('mix-audio refuses an effect stem without policy flag + approval (end-to-end)', { skip: !existsSync('output/V6/picture.mp4') }, () => {
  const r = spawnSync('npx', ['tsx', 'scripts/mix-audio.ts', '--video', 'output/V6/picture.mp4', '--out', '.tmp/_gate_test.mp4', '--sfx-file', 'assets/audio/sfx-optional/airy-soft-short.wav', '--sfx-times', '20.1', '--sfx-approval', 'x'], {encoding: 'utf8'});
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /FMC audio policy/);
  assert.equal(existsSync('.tmp/_gate_test.mp4'), false);
});

test('audio:qc passes on the repo and FAILS when a raw <Audio> / whoosh reference is injected', () => {
  const clean = spawnSync('npx', ['tsx', 'scripts/audio-qc.ts'], {encoding: 'utf8'});
  assert.equal(clean.status, 0, clean.stdout.slice(-600));
  const probe = 'src/templates/_probe_audio.tsx';
  writeFileSync(probe, "const X = () => <Audio src={staticFile('sfx/whoosh.mp3')} />;\n");
  try {
    const bad = spawnSync('npx', ['tsx', 'scripts/audio-qc.ts'], {encoding: 'utf8'});
    assert.equal(bad.status, 1);
    assert.match(bad.stdout, /raw <Audio>/);
  } finally { rmSync(probe, {force: true}); }
});

test('audio:qc flags an HTML overlay that contains an <audio> element', () => {
  const probe = 'v7/_probe_overlay.html';
  writeFileSync(probe, '<audio id="a" src="x.mp3"></audio>');
  try {
    const bad = spawnSync('npx', ['tsx', 'scripts/audio-qc.ts'], {encoding: 'utf8'});
    assert.equal(bad.status, 1);
    assert.match(bad.stdout, /<audio> element/);
  } finally { rmSync(probe, {force: true}); }
});

test('guarded HyperFrames wrapper blocks cloud / tts / registry add / render', () => {
  for (const cmd of ['render', 'tts', 'cloud', 'add', 'publish', 'auth', 'transcribe']) {
    const r = spawnSync('node', ['scripts/hf.mjs', cmd], {encoding: 'utf8'});
    assert.equal(r.status, 3, `${cmd}: ${r.stderr}`);
    assert.match(r.stderr, /FMC policy/);
  }
});
