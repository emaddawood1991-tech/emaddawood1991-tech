/**
 * FMC AUDIO QC — run before any export:   npm run audio:qc -- [--video file.mp4] [--stems dir] [--slug lower-back-pain] [--out report.md]
 *
 * 1. SOURCE AUDIT   (static): every place the code can emit audio — <Audio>, video elements, sfx-like strings, audio assets,
 *                   nested compositions registered in Root.tsx, stock footage with embedded audio streams.
 * 2. POLICY AUDIT   : FMC_AUDIO_POLICY flags and the asset folders that must not exist.
 * 3. FILE ANALYSIS  : (needs --video) loudness, true peak, clipping, and SUSPICIOUS non-speech transients, especially near scene boundaries.
 *
 * Honesty rules: the transient detector reports WHEN a sudden sound occurs and whether it is outside narration / near a scene seam.
 * It cannot say WHICH component or file made it, and it cannot judge comfort, pronunciation or taste. Static findings tell you which
 * code paths COULD make sound; a rendered-file finding is a lead to investigate by listening, not a diagnosis.
 * Exit code 1 = at least one ERROR (policy breach). Warnings need a human look.
 */
import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {join, relative} from 'node:path';
import {arg, p, loadContent} from '../lib/common';
import {loudness} from '../lib/audio-metrics';
import {FMC_AUDIO_POLICY, FMC_AUDIO_TARGETS} from '../src/lib/audioPolicy';
import {computeTimeline, FPS} from '../src/lib/timeline';
import {ManifestSchema} from '../src/lib/schema';

type Finding = {level: 'ERROR' | 'WARN' | 'INFO'; area: string; msg: string};
const F: Finding[] = [];
const add = (level: Finding['level'], area: string, msg: string) => F.push({level, area, msg});

const walk = (dir: string, out: string[] = []) => {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n.startsWith('.')) continue;
    const f = join(dir, n);
    statSync(f).isDirectory() ? walk(f, out) : out.push(f);
  }
  return out;
};
const rel = (f: string) => relative(p(), f);

// ───────────────────────── 1. SOURCE AUDIT ─────────────────────────
const srcFiles = walk(p('src')).filter((f) => /\.(tsx?|jsx?)$/.test(f));
const allowed = (f: string) => f.endsWith('src/lib/audioPolicy.tsx');
const sources: string[] = [];
for (const f of srcFiles) {
  const t = readFileSync(f, 'utf8');
  const lines = t.split('\n');
  lines.forEach((ln, i) => {
    const code = ln.replace(/\/\/.*$/, '').replace(/\{\/\*.*?\*\/\}/g, '').replace(/^\s*\*.*$/, '');
    const at = `${rel(f)}:${i + 1}`;
    if (!allowed(f) && /<(Html5Audio|Audio)[\s>]/.test(code)) add('ERROR', 'source', `${at} raw <Audio> — use <NarrationAudio>/<PolicySfx> from src/lib/audioPolicy`);
    if (/<(OffthreadVideo|Html5Video|Video)[\s>]/.test(code)) {
      const block = lines.slice(i, i + 3).join(' ');
      if (!/muted(=\{footageMuted\(\)\}|=\{true\}|\s|\/)/.test(block) || /muted=\{false\}/.test(block)) add('ERROR', 'source', `${at} video element is not muted (embedded footage audio would play)`);
      else sources.push(`${at} video element (muted via policy)`);
    }
    if (/addSound|whoosh|swoosh|\bsfx\b|click|notification|\bding\b|chime/i.test(code) && !allowed(f) && !/src\/(Root\.tsx|lib\/schema\.ts)$/.test(rel(f))) add('WARN', 'source', `${at} sound-effect-like identifier: ${code.trim().slice(0, 100)}`);
    const m = code.match(/staticFile\(([^)]+)\)/);
    if (m && /\.(mp3|wav|ogg|m4a|aac)/i.test(m[1]) && !allowed(f)) add('ERROR', 'source', `${at} audio file referenced directly: ${m[1]}`);
  });
  const n = (t.match(/<NarrationAudio/g) ?? []).length, s = (t.match(/<PolicySfx/g) ?? []).length;
  if (n) sources.push(`${rel(f)}: ${n} <NarrationAudio> (narration)`);
  if (s && !allowed(f)) add('WARN', 'source', `${rel(f)}: ${s} <PolicySfx> present — renders nothing unless policy flag + approval id`);
}
// nested compositions registered in Root.tsx → which template each one renders
const root = readFileSync(p('src', 'Root.tsx'), 'utf8');
const comps = [...root.matchAll(/<Composition\s+id="([^"]+)"\s+component=\{(\w+)\}/g)].map((m) => `${m[1]} → ${m[2]}`);
if (comps.length) add('INFO', 'source', `registered compositions: ${comps.join('; ')}`);
// render props: schema may carry music/sfx but the render script must null them
const rv = readFileSync(p('scripts', 'render-video.ts'), 'utf8');
if (!/enforceRenderProps/.test(rv)) add('ERROR', 'pipeline', 'scripts/render-video.ts does not call enforceRenderProps()');
const mx = readFileSync(p('scripts', 'mix-audio.ts'), 'utf8');
if (!/assertSfxAllowed/.test(mx)) add('ERROR', 'pipeline', 'scripts/mix-audio.ts does not gate effects with assertSfxAllowed()');
if (/swell|whoosh/i.test(mx)) add('WARN', 'pipeline', 'scripts/mix-audio.ts mentions swell/whoosh — re-check it cannot add seam effects by default');

// ───────────────────────── 2. POLICY / ASSET AUDIT ─────────────────────────
for (const k of ['transitionSfxEnabled', 'characterSfxEnabled', 'interfaceSfxEnabled', 'cameraMovementSfxEnabled', 'anatomyAnimationSfxEnabled', 'automaticWhooshesEnabled', 'footageAudioEnabled'] as const)
  if ((FMC_AUDIO_POLICY as any)[k] !== false) add('ERROR', 'policy', `${k} is ${(FMC_AUDIO_POLICY as any)[k]} (default must be false)`);
const audioAssets = walk(p('assets', 'audio')).filter((f) => /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f));
const byKind = (f: string) => (/\/_retired\//.test(f) ? 'retired' : /\/sfx-optional\//.test(f) ? 'sfx-optional' : /\/sfx\//.test(f) ? 'SFX-ACTIVE-FOLDER' : /\/music\//.test(f) ? 'music' : 'narration/other');
for (const f of audioAssets) {
  const k = byKind(f);
  if (k === 'SFX-ACTIVE-FOLDER') add('ERROR', 'assets', `${rel(f)} is in assets/audio/sfx/ — effects must live in sfx-optional/ and stay unreferenced`);
  if (/whoosh|swoosh|click|ding/i.test(f) && k !== 'retired') add('ERROR', 'assets', `${rel(f)} looks like an effect asset outside _retired/`);
  if (/piano/i.test(f) && k !== 'retired') add('WARN', 'assets', `${rel(f)}: piano music violates the music direction`);
}
add('INFO', 'assets', `audio assets: ${['narration/other', 'music', 'sfx-optional', 'retired'].map((k) => `${k}=${audioAssets.filter((f) => byKind(f) === k).length}`).join(', ')}`);
for (const f of walk(p('assets', 'footage')).filter((f) => /\.(mp4|mov|webm|mkv)$/i.test(f))) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', f], {encoding: 'utf8'});
  if (r.stdout.trim()) add('WARN', 'footage', `${rel(f)} has an embedded audio stream (rendered muted by policy; not used)`);
}

// ───────────────────────── 3. RENDERED FILE ANALYSIS ─────────────────────────
const video = arg('video');
const stems = arg('stems');
let fileReport: any = null;
if (video) {
  if (!existsSync(video)) throw new Error(`video not found: ${video}`);
  const lu = loudness(video);
  const slug = arg('slug', 'lower-back-pain')!;
  const decode = (af?: string) => {
    const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', video, '-vn', ...(af ? ['-af', af] : []), '-ac', '1', '-ar', '48000', '-f', 's16le', '-'], {maxBuffer: 1 << 29});
    return new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 2));
  };
  const pcm = decode();
  let clipped = 0;
  for (let i = 0; i < pcm.length; i++) if (Math.abs(pcm[i]) >= 32700) clipped++;
  const sr = 48000, hop = 480; // 10 ms
  const envDb = (x: Int16Array) => {
    const n = Math.floor(x.length / hop), o = new Float64Array(n);
    for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < hop; j++) { const v = x[i * hop + j] / 32768; s += v * v; } o[i] = 10 * Math.log10(s / hop + 1e-12); }
    return o;
  };
  // narration windows and scene seams from the real timeline
  const c = loadContent(slug);
  const mf = p('assets', 'audio', slug, 'manifest.json');
  const tl = existsSync(mf) ? computeTimeline(c, ManifestSchema.parse(JSON.parse(readFileSync(mf, 'utf8')))) : [];
  const speech = tl.filter((t) => t.audioFile).map((t) => [(t.from + t.audioFrom) / FPS, (t.from + t.audioFrom + t.audioFrames) / FPS] as const);
  const seams = tl.slice(1).map((t) => t.from / FPS);
  const inSpeech = (t: number) => speech.some(([a, b]) => t >= a - 0.05 && t <= b + 0.05);
  // sharp sounds live in the upper band; look there for sudden rises (>= 14 dB within 30 ms) above -52 dBFS
  const hi = envDb(decode('highpass=f=2500'));
  const events: {t: number; riseDb: number; levelDb: number; speech: boolean; nearSeam: number | null}[] = [];
  for (let i = 10; i < hi.length - 3; i++) {
    const base = Math.max(...Array.from(hi.slice(i - 10, i - 3)), -120);
    const rise = Math.max(hi[i], hi[i + 1], hi[i + 2]) - base;
    if (rise >= 14 && hi[i + 2] > -52 && (i === 10 || hi[i - 1] < hi[i] + 0.1)) {
      const t = i / 100;
      if (events.length && t - events[events.length - 1].t < 0.4) continue;
      const seam = seams.find((s) => Math.abs(s - t) <= 1.5);
      events.push({t: +t.toFixed(2), riseDb: +rise.toFixed(1), levelDb: +hi[i + 2].toFixed(1), speech: inSpeech(t), nearSeam: seam == null ? null : +(t - seam).toFixed(2)});
    }
  }
  const nonSpeech = events.filter((e) => !e.speech);
  const nearSeam = events.filter((e) => e.nearSeam != null && !e.speech);
  // energy in the narration gaps that are close to scene seams (a quiet music bed should stay far below speech)
  const full = envDb(pcm);
  const gapReports: string[] = [];
  for (const s of seams) {
    const a = Math.floor((s - 0.7) * 100), b = Math.floor((s + 0.2) * 100);
    const seg = Array.from(full.slice(Math.max(0, a), b)).filter((v) => isFinite(v));
    if (seg.length) gapReports.push(`${s.toFixed(1)} s: peak ${Math.max(...seg).toFixed(1)} dBFS (10 ms RMS) in the ±1 s around the seam`);
  }
  fileReport = {file: video, integratedLufs: lu.lufs, truePeakDb: lu.truePeakDb, clippedSamples: clipped, events, gapReports, seams, speechWindows: speech};
  if (Math.abs(lu.lufs - FMC_AUDIO_TARGETS.finalLufs) > 1.5) add('WARN', 'file', `integrated loudness ${lu.lufs} LUFS (target ${FMC_AUDIO_TARGETS.finalLufs} ±1.5)`);
  if (lu.truePeakDb > FMC_AUDIO_TARGETS.truePeakCeilingDb + 0.2) add('ERROR', 'file', `true peak ${lu.truePeakDb} dBTP exceeds ceiling ${FMC_AUDIO_TARGETS.truePeakCeilingDb}`);
  if (clipped > 0) add('ERROR', 'file', `${clipped} samples at/near full scale (clipping)`);
  if (nonSpeech.length) add('WARN', 'file', `${nonSpeech.length} sudden bright transient(s) OUTSIDE narration at ${nonSpeech.map((e) => e.t + 's').join(', ')} — listen at those times; source not identified by software`);
  if (nearSeam.length) add('WARN', 'file', `${nearSeam.length} transient(s) within ±1.5 s of a scene seam (${nearSeam.map((e) => e.t + 's').join(', ')}) outside narration`);
  if (!events.length) add('INFO', 'file', 'no sudden bright transients ≥14 dB found (this does not prove the audio is comfortable — a human must listen)');
  if (stems) {
    const sf = join(stems, 'sound_effects.wav');
    if (existsSync(sf)) {
      const x = new Int16Array(execFileSync('ffmpeg', ['-v', 'error', '-i', sf, '-ac', '1', '-ar', '48000', '-f', 's16le', '-'], {maxBuffer: 1 << 29}).buffer);
      let mxv = 0; for (let i = 0; i < x.length; i++) mxv = Math.max(mxv, Math.abs(x[i]));
      const db = 20 * Math.log10(mxv / 32768 + 1e-9);
      db > -80 ? add('ERROR', 'stems', `sound_effects stem is not silent (peak ${db.toFixed(1)} dBFS) — effects present`) : add('INFO', 'stems', 'sound_effects stem is digital silence');
    } else add('WARN', 'stems', `no sound_effects.wav in ${stems}`);
  }
  add('INFO', 'file', `${lu.lufs} LUFS, ${lu.truePeakDb} dBTP, ${clipped} clipped samples, ${events.length} bright onsets of which ${events.length - nonSpeech.length} are inside narration (normal speech consonants, ignored) and ${nonSpeech.length} outside`);
}

// ───────────────────────── report ─────────────────────────
const errors = F.filter((f) => f.level === 'ERROR').length, warns = F.filter((f) => f.level === 'WARN').length;
let md = `# FMC audio QC\n\n- Policy: ${JSON.stringify(FMC_AUDIO_POLICY)}\n- Result: **${errors ? 'FAIL' : 'PASS (automated checks only)'}** — ${errors} error(s), ${warns} warning(s)\n\n## Audio sources found in code\n${sources.map((s) => `- ${s}`).join('\n') || '- none'}\n\n## Findings\n${F.map((f) => `- **${f.level}** [${f.area}] ${f.msg}`).join('\n')}\n`;
if (fileReport) md += `\n## Rendered file\n- ${fileReport.file}\n- Seams (s): ${fileReport.seams.map((s: number) => s.toFixed(2)).join(', ')}\n- Non-speech transient candidates: ${fileReport.events.filter((e: any) => !e.speech).map((e: any) => `${e.t}s (+${e.riseDb} dB, ${e.speech ? 'in speech' : 'NOT speech'}${e.nearSeam != null ? `, ${e.nearSeam}s from seam` : ''})`).join('; ') || 'none'}\n${fileReport.gapReports.map((g: string) => `- ${g}`).join('\n')}\n`;
md += `\n_Limits: automated analysis flags suspicious sounds; it does not identify their source and cannot judge listening comfort, pronunciation or taste._\n`;
console.log(md);
const out = arg('out');
if (out) writeFileSync(out, md);
process.exit(errors ? 1 : 0);
