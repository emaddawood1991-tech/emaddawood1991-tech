import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('persistence: CLAUDE.md, producer skill, registry, plugin declarations and audio policy verify (non-rendering, --quick)', () => {
  const r = spawnSync('npx', ['tsx', 'scripts/verify-skills.ts', '--quick'], {encoding: 'utf8'});
  assert.equal(r.status, 0, r.stdout.slice(-1500));
  assert.match(r.stdout, /Result: \*\*PASS\*\*/);
});
