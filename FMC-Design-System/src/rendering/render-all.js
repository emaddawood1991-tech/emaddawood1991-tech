#!/usr/bin/env node
// Renders every content file: src/content/*.json (+ samples/ with --samples). Exits non-zero if any render fails QC.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dirs = [path.join(ROOT, 'src/content'), ...(process.argv.includes('--samples') ? [path.join(ROOT, 'src/content/samples')] : [])];
let bad = 0;
for (const d of dirs) for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.json'))) {
  const r = spawnSync('node', [path.join(ROOT, 'src/rendering/render.js'), path.join(d, f)], { stdio: 'inherit' });
  if (r.status) bad++;
}
process.exit(bad ? 2 : 0);
