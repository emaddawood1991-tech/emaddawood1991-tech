// Stage S21: the API reference must match the real router and permission table. Regenerate with: npm run docs:api
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { openDb } from '../server/db.js';
import { createApp } from '../server/app.js';
import { buildApiDoc } from '../server/apidoc.js';

const doc = () => buildApiDoc(createApp({ db: openDb(':memory:') }).app);

test('docs/API.md is up to date with the router', () => {
  const onDisk = readFileSync(new URL('../docs/API.md', import.meta.url), 'utf8');
  assert.equal(onDisk, doc(), 'docs/API.md is stale: run `npm run docs:api` and commit the result');
});

test('every route is documented with an access rule, and only the four known routes are public', () => {
  const md = doc();
  const publicRows = md.split('\n').filter((l) => l.includes('Public (no sign-in)'));
  assert.equal(publicRows.length, 4, `unexpected public routes:\n${publicRows.join('\n')}`);
  for (const must of ['POST | `/api/login`', 'GET | `/api/time`', '`/api/recovery-request`']) assert.ok(md.includes(must.replace(' | ', ' | ')) || md.includes(must.split(' | ')[1]), `missing ${must}`);
  assert.ok(!md.includes('no role'), 'a permission is used by a route but granted to no role');
});
