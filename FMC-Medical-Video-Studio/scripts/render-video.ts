/**
 * Renders one format and verifies the file.
 *   --slug <slug> --format reel|tv [--final]
 * Without --final (or while the approval gate is closed) a watermarked, SILENT preview is produced.
 * A FINAL render needs: Arabic QC clean, human approvals + hash lock, real generated narration matching the script hash.
 */
import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {arg, BROWSER, flag, loadContent, p, scriptHash, ffprobeDuration} from '../lib/common';
import {finalExportGate, runArabicQC} from '../lib/arabic-qc';
import {FootageSchema, ManifestSchema, type VideoProps} from '../src/lib/schema';
import {computeTimeline} from '../src/lib/timeline';

const slug = arg('slug', 'lower-back-pain')!;
const format = (arg('format', 'reel') as 'reel' | 'tv');
const wantFinal = flag('final');
const c = loadContent(slug);

const errs = runArabicQC(c).filter((f) => f.level === 'error');
if (errs.length) { console.error(errs.map((e) => `${e.scene}/${e.field}: ${e.message}`).join('\n')); throw new Error('Arabic QC errors: refusing to render.'); }

let preview = !wantFinal;
let manifest = null;
if (wantFinal) {
  const gate = finalExportGate(c);
  if (!gate.ok) throw new Error(`FINAL export blocked. Missing approvals: ${gate.missing.join(', ')}. Use --preview semantics (omit --final) for a visual-only draft.`);
  const mf = p('assets', 'audio', slug, 'manifest.json');
  if (!existsSync(mf)) throw new Error('No voiceover manifest. Run: npm run voice:generate -- --slug ' + slug);
  manifest = ManifestSchema.parse(JSON.parse(readFileSync(mf, 'utf8')));
  if (manifest.scriptHash !== scriptHash(c)) throw new Error('Narration audio was generated from a different script version. Regenerate the voiceover.');
  for (const s of manifest.scenes) if (!existsSync(p('assets', s.file))) throw new Error(`Missing audio file ${s.file}`);
}
const ff = p('assets', 'footage', slug, `footage-${format === 'reel' ? 'portrait' : 'landscape'}.json`);
const footage = existsSync(ff) ? FootageSchema.parse(JSON.parse(readFileSync(ff, 'utf8'))) : null;
const props: VideoProps = {
  content: c, manifest, footage, preview,
  music: existsSync(p('assets', 'audio', 'music', 'ambient-bed.mp3')) ? 'audio/music/ambient-bed.mp3' : null,
  sfx: existsSync(p('assets', 'audio', 'sfx', 'whoosh.mp3')) ? 'audio/sfx/whoosh.mp3' : null,
};
const outDir = p('output', slug);
mkdirSync(`${outDir}/qc`, {recursive: true});
const propsFile = p('.tmp', `${slug}-${format}-props.json`);
mkdirSync(p('.tmp'), {recursive: true});
writeFileSync(propsFile, JSON.stringify(props));
const out = `${outDir}/${slug}-${format}${preview ? '-PREVIEW-silent' : ''}.mp4`;

const r = spawnSync('npx', ['remotion', 'render', 'src/index.ts', format === 'reel' ? 'Reel' : 'TV', out, `--props=${propsFile}`, '--codec=h264', '--audio-codec=aac', '--gl=angle', `--browser-executable=${BROWSER}`, '--concurrency=4', '--crf=18'], {cwd: p(), stdio: 'inherit'});
if (r.status !== 0 || !existsSync(out)) throw new Error('Render failed; no output file. Nothing is claimed as complete.');

// ---- technical QC on the real file ----
const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', out]).toString());
const v = probe.streams.find((s: any) => s.codec_type === 'video'), a = probe.streams.find((s: any) => s.codec_type === 'audio');
const [W, H] = format === 'reel' ? [1080, 1920] : [1920, 1080];
const issues: string[] = [];
if (v.width !== W || v.height !== H) issues.push(`dimensions ${v.width}x${v.height} ≠ ${W}x${H}`);
if (v.codec_name !== 'h264') issues.push(`video codec ${v.codec_name}`);
if (eval(v.r_frame_rate) !== 30) issues.push(`fps ${v.r_frame_rate}`);
if (!preview && (!a || a.codec_name !== 'aac')) issues.push('final export has no AAC audio');
const dur = parseFloat(probe.format.duration);
const black = spawnSync('ffmpeg', ['-hide_banner', '-i', out, '-vf', 'blackdetect=d=0.2:pix_th=0.06', '-an', '-f', 'null', '-'], {encoding: 'utf8'}).stderr.match(/black_start:[\d.]+ black_end:[\d.]+/g) ?? [];
// a leading/trailing black frame is a defect too
if (black.length) issues.push(`black segments: ${black.join(' | ')}`);
// per-scene stills for the visual Arabic-typography inspection
const tl = computeTimeline(c, manifest);
for (const t of tl) {
  const at = ((t.from + t.duration * 0.62) / 30).toFixed(2);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', at, '-i', out, '-frames:v', '1', `${outDir}/qc/${format}-${t.id}.png`]);
}
console.log(`\nQC ${out}\n  ${v.width}x${v.height} ${v.codec_name} ${v.r_frame_rate}fps, audio: ${a ? a.codec_name : 'NONE'}, ${dur.toFixed(2)}s, ${(parseInt(probe.format.size) / 1e6).toFixed(1)} MB`);
console.log(issues.length ? `  ISSUES:\n   - ${issues.join('\n   - ')}` : '  technical checks passed');
console.log(`  QC stills: ${outDir}/qc/${format}-<scene>.png — inspect Arabic text visually against content/${slug}.json`);
if (preview) console.log('  This is a SILENT, watermarked PREVIEW — not a final export.');
if (!preview && !manifest) throw new Error('internal: final without manifest');
void ffprobeDuration;
process.exit(issues.length ? 1 : 0);
