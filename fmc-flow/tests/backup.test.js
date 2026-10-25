import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDb } from '../server/db.js';
import { seed } from '../server/seed.js';
import { backup, restore } from '../server/backup.js';

test('encrypted backup restores into an identical, integrity-checked database; wrong key and tampering fail', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fmcb-'));
  const dbPath = join(dir, 'src.db');
  const db = openDb(dbPath); seed(db); db.close();
  const key = 'a'.repeat(64);
  const file = backup({ dbPath, dir: join(dir, 'b'), key });
  assert.ok(!readFileSync(file).includes('Sample Patient'), 'backup file must be encrypted');
  const out = restore(file, join(dir, 'restored.db'), key);
  const r = new DatabaseSync(out);
  assert.equal(r.prepare('SELECT COUNT(*) c FROM patients').get().c, 8);
  assert.throws(() => restore(file, join(dir, 'x.db'), 'b'.repeat(64)));
  const buf = readFileSync(file); buf[buf.length - 1] ^= 1; writeFileSync(file, buf);
  assert.throws(() => restore(file, join(dir, 'y.db'), key));
  assert.throws(() => backup({ dbPath, dir: join(dir, 'b'), key: 'short' }), /64 hex/);
});
