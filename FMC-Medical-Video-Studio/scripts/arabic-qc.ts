import {loadContent, scriptHash, arg} from '../lib/common';
import {finalExportGate, runArabicQC} from '../lib/arabic-qc';

const slug = arg('slug', process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'lower-back-pain')!;
const c = loadContent(slug);
const f = runArabicQC(c);
const errors = f.filter((x) => x.level === 'error');
console.log(`Arabic QC — ${slug}  (script hash ${scriptHash(c).slice(0, 12)})`);
for (const x of f) console.log(`  [${x.level.toUpperCase()}] ${x.scene}/${x.field} · ${x.rule}: ${x.message}${x.text ? `\n        «${x.text}»` : ''}`);
if (!f.length) console.log('  automated checks: no findings');
const gate = finalExportGate(c);
console.log(`\nFinal-export gate: ${gate.ok ? 'OPEN' : 'CLOSED — missing: ' + gate.missing.join(', ')}`);
console.log('Note: automated checks catch mechanical errors only. They do not replace human reading and listening review.');
process.exit(errors.length ? 1 : 0);
