#!/usr/bin/env node
// ZIP with final PNGs + editable source (self-contained relative paths) + preview + caption.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const slug = process.argv[2];
const items = [`output/png/${slug}`, `output/source/${slug}`, `output/preview/${slug}`, `output/caption-${slug}.md`, `src/content/${slug}.json`,
  'src/styles', 'templates', 'assets/fonts', 'assets/medical/foot-scanner-extracted.png', 'assets/logo/fmc-logo-trimmed.png', 'assets/logo/fmc-logo-original.webp'].filter((p) => fs.existsSync(path.join(ROOT, p)));
const zip = path.join(ROOT, 'output', process.argv[3] || `FMC-Carousel-${slug}.zip`);
fs.rmSync(zip, { force: true });
const r = spawnSync('zip', ['-rq', zip, ...items], { cwd: ROOT, stdio: 'inherit' });
if (r.status) process.exit(r.status);
console.log(`zip: ${path.relative(ROOT, zip)} (${(fs.statSync(zip).size / 1024).toFixed(0)} KB)`);
