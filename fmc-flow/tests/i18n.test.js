// Translation keys: a key defined twice in one language silently overwrites the first (the later text shows everywhere).
// Security & Access and Daily Schedule keys (sa…, ds…) must also exist in both languages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/i18n.jsx', import.meta.url), 'utf8');
const cut = src.search(/const AR\b/);
const dict = (txt) => [...txt.matchAll(/(?:^|[\s,{])((?:sa|ds)[A-Za-z0-9_]*):\s*['"`]/g)].map((m) => m[1]);
const en = dict(src.slice(0, cut)), ar = dict(src.slice(cut));

test('I18N-1 no Security & Access or Daily Schedule text key is defined twice in a language', () => {
  const dup = (a) => [...new Set(a.filter((k, i) => a.indexOf(k) !== i))];
  assert.deepEqual(dup(en), [], 'duplicate English keys: ' + dup(en));
  assert.deepEqual(dup(ar), [], 'duplicate Arabic keys: ' + dup(ar));
});
test('I18N-2 every such key exists in both English and Arabic', () => {
  assert.deepEqual(en.filter((k) => !ar.includes(k)), [], 'missing in Arabic');
  assert.deepEqual(ar.filter((k) => !en.includes(k)), [], 'missing in English');
});
