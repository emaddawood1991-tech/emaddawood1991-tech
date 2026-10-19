import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cutPath, steppedFrame} from '../src/components/Collage';

test('collage cut paths are deterministic per seed and differ between seeds', () => {
  assert.equal(cutPath('a', 600, 600), cutPath('a', 600, 600));
  assert.notEqual(cutPath('a', 600, 600), cutPath('b', 600, 600));
  assert.match(cutPath('a', 600, 600, 7), /^M[\d.,L-]+Z$/);
});

test('stepped time snaps to the step', () => {
  assert.equal(steppedFrame(7, 2), 6);
  assert.equal(steppedFrame(8, 2), 8);
  assert.equal(steppedFrame(8, 3), 6);
});

test('collage module is silent and local (no audio, video, network or paid-API references)', () => {
  const src = readFileSync('src/components/Collage/index.tsx', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const bad of [/<Audio/, /<Video/, /OffthreadVideo/, /fetch\(/, /https?:\/\//, /GEMINI/i, /staticFile/]) assert.doesNotMatch(src, bad);
});
