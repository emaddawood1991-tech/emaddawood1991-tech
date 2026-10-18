/**
 * One command, whole pipeline, hard gates:
 *   npm run produce -- --slug lower-back-pain --format reel [--final]
 * Medical research (sources in content) → Arabic script → Arabic QC → approval lock → voice → footage → render → file QC.
 */
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {arg, flag, loadContent, p} from '../lib/common';
import {finalExportGate, runArabicQC} from '../lib/arabic-qc';

const slug = arg('slug', 'lower-back-pain')!;
const format = arg('format', 'reel')!;
const run = (script: string, ...args: string[]) => {
  const r = spawnSync('npx', ['tsx', `scripts/${script}`, ...args], {cwd: p(), stdio: 'inherit'});
  if (r.status !== 0) { console.error(`\n✋ Stopped at ${script}.`); process.exit(r.status ?? 1); }
};

const c = loadContent(slug);
console.log('1/5 Arabic QC');
if (runArabicQC(c).some((f) => f.level === 'error')) { run('arabic-qc.ts', '--slug', slug); }
if (flag('final')) {
  const gate = finalExportGate(c);
  if (!gate.ok) { console.error(`✋ Awaiting human review. Missing: ${gate.missing.join(', ')}\n   Review the script, listen to the voice, then use npm run approve (see README).`); process.exit(3); }
  console.log('2/5 Voiceover (approved provider)');
  if (!existsSync(p('assets', 'audio', slug, 'manifest.json')) || flag('regen-voice')) run('generate-voiceover.ts', '--slug', slug);
}
console.log('3/5 Footage');
if (process.env.PEXELS_API_KEY) run('fetch-footage.ts', '--slug', slug, '--orientation', format === 'reel' ? 'portrait' : 'landscape');
else console.log('   PEXELS_API_KEY not set → treatment scene uses the 3D rehabilitation animation.');
console.log('4/5 Render + 5/5 file QC');
run('render-video.ts', '--slug', slug, '--format', format, ...(flag('final') ? ['--final'] : []));
