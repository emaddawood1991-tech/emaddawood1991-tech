/**
 * FMC STANDARDS QC — automated parts of the permanent quality rules.
 *   npm run standards:qc -- [--slug lower-back-pain] [--video output/x.mp4] [--out report.md]
 *
 * Checks: character (static) · camera framing (computed) · typography/content limits · scene variety · logo integrity ·
 * rendered-frame heuristics (bottom banner/line, content cut by frame edge, bright text in Instagram bottom zone) · technical file validation.
 * Heuristics flag things to LOOK at. They do not replace a human reviewing real frames, a native Arabic reader or a clinician.
 */
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {join, relative} from 'node:path';
import {arg, p, loadContent, ffprobeDuration} from '../lib/common';
import {CAM, SHOT_STANDARDS, doctorPct, visibleHeightM} from '../src/components/Doctor/cameraPresets';
import {CHARACTER_SPEC, LOGO, PACING, SCENE_TYPES, TYPOGRAPHY, sceneVarietyProblems, type SceneTypeKey} from '../src/lib/fmcStandards';
import {computeTimeline, FPS, totalFrames} from '../src/lib/timeline';
import {ManifestSchema} from '../src/lib/schema';

type Level = 'ERROR' | 'WARN' | 'INFO';
const F: {level: Level; area: string; msg: string}[] = [];
const add = (level: Level, area: string, msg: string) => F.push({level, area, msg});
const walk = (d: string, o: string[] = []) => { if (!existsSync(d)) return o; for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f, o) : o.push(f); } return o; };
const stripComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

// 1 ─ character (static)
const doctor = stripComments(readFileSync(p('src', 'components', 'Doctor', 'Doctor.tsx'), 'utf8'));
for (const w of CHARACTER_SPEC.forbiddenIdentifiers) if (new RegExp(w, 'i').test(doctor)) add('ERROR', 'character', `Doctor.tsx contains "${w}" — presenter must be clean-shaven`);
if (!/staticFile\('logo\/fmc-original-logo\.png'\)/.test(doctor)) add('ERROR', 'character', 'Doctor.tsx coat logo does not use the official logo file');
add('INFO', 'character', 'static checks only: no facial-hair identifiers; official logo file on coat. Appearance (age, friendliness, proportions) needs a human look at real frames.');

// 2 ─ camera presets (computed from geometry)
for (const [kind, st] of Object.entries(SHOT_STANDARDS)) {
  const c = CAM[st.preset];
  const pct = doctorPct(c), vis = visibleHeightM(c);
  if (st.doctorPct && (pct < st.doctorPct[0] || pct > st.doctorPct[1])) add('ERROR', 'framing', `${kind} (${st.preset}): doctor ${pct.toFixed(0)} % of frame height, required ${st.doctorPct[0]}–${st.doctorPct[1]} %`);
  else if (st.visibleMaxM && vis > st.visibleMaxM) add('ERROR', 'framing', `${kind} (${st.preset}): shows ${vis.toFixed(2)} m of height, max ${st.visibleMaxM} m`);
  else add('INFO', 'framing', `${kind} (${st.preset}): doctor ≈ ${pct.toFixed(0)} %, frame shows ${vis.toFixed(2)} m — ok`);
}
add('INFO', 'framing', 'Presets are validated geometrically. Hands/limbs leaving the frame during a gesture, and cards covering the torso, must still be checked on real frames (see --video).');

// 3 ─ typography/content (static)
const slug = arg('slug', 'lower-back-pain')!;
const c = loadContent(slug);
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
for (const s of c.scenes) {
  const t = s.onScreen.title, b = s.onScreen.bullets ?? [];
  if (t && words(t) > TYPOGRAPHY.maxWords.title) add('WARN', 'typography', `${s.id}: title has ${words(t)} words (max ${TYPOGRAPHY.maxWords.title})`);
  if (b.length > TYPOGRAPHY.maxWords.cardsPerScene) add('WARN', 'typography', `${s.id}: ${b.length} cards (max ${TYPOGRAPHY.maxWords.cardsPerScene})`);
  b.forEach((x, i) => {
    const n = words(x);
    if (n > TYPOGRAPHY.hardMaxWords.card) add('ERROR', 'typography', `${s.id} card ${i + 1}: ${n} words (hard max ${TYPOGRAPHY.hardMaxWords.card}) — shorten (needs your approval: on-screen text is part of the locked script)`);
    else if (n > TYPOGRAPHY.maxWords.card) add('WARN', 'typography', `${s.id} card ${i + 1}: ${n} words (target ≤ ${TYPOGRAPHY.maxWords.card})`);
  });
}
const tpl = readFileSync(p('src', 'templates', 'DoctorExplainer.tsx'), 'utf8') + readFileSync(p('src', 'templates', 'MedicalExplainer.tsx'), 'utf8');
const sizes: [string, RegExp, number][] = [['title', /<Title[^>]*size=\{(\d+)\}/g, TYPOGRAPHY.minPx.title], ['card', /<Cards[^>]*size=\{(\d+)\}/g, TYPOGRAPHY.minPx.cardText], ['callout', /<Callout[^>]*size=\{(\d+)\}/g, TYPOGRAPHY.minPx.callout]];
for (const [name, re, min] of sizes) for (const m of tpl.matchAll(re)) if (+m[1] < min) add('WARN', 'typography', `${name} font size ${m[1]} px < standard ${min} px (DoctorExplainer/MedicalExplainer) — raise it and re-check layout on a real frame`);

// 4 ─ scene variety
const plan = c.scenes.map((s: any) => ({id: s.id, type: s.sceneType as SceneTypeKey | undefined, sec: s.plannedSec}));
const undeclared = plan.filter((s) => !s.type);
if (undeclared.length) add('WARN', 'variety', `scenes without a declared sceneType (A–F): ${undeclared.map((s) => s.id).join(', ')} — variety cannot be checked automatically`);
else for (const m of sceneVarietyProblems(plan as any)) add('WARN', 'variety', m);
add('INFO', 'variety', `scene types: ${Object.entries(SCENE_TYPES).map(([k, v]) => `${k}=${v.name}`).join('; ')}; limits: ≤${PACING.maxConsecutiveSameSceneType} in a row, ≥${PACING.minDistinctSceneTypes} distinct`);

// 5 ─ logo integrity
const logoPath = p(LOGO.file);
if (!existsSync(logoPath)) add('ERROR', 'logo', `${LOGO.file} missing`);
else {
  const sha = createHash('sha256').update(readFileSync(logoPath)).digest('hex');
  sha === LOGO.sha256 ? add('INFO', 'logo', 'official logo file hash matches the supplied original') : add('ERROR', 'logo', `logo file changed (sha256 ${sha.slice(0, 12)}…) — never edit or recreate the logo`);
  const hdr = readFileSync(logoPath).subarray(0, 33);
  if (LOGO.needsAlpha && hdr[25] !== 6 && hdr[25] !== 4) add('WARN', 'logo', 'logo PNG has no alpha channel');
}
for (const f of walk(p('src')).filter((f) => /\.tsx?$/.test(f))) {
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/staticFile\('([^']*logo[^']*)'\)/gi)) if (m[1] !== 'logo/fmc-original-logo.png') add('ERROR', 'logo', `${relative(p(), f)} uses a different logo asset: ${m[1]}`);
}
if (/preview \|\| props\.label|PREVIEW · NO VOICEOVER|NOT FOR PUBLICATION/.test(readFileSync(p('src', 'templates', 'MedicalExplainer.tsx'), 'utf8').replace(/\/\/.*$/gm, ''))) add('ERROR', 'branding', 'MedicalExplainer still draws a production-status banner');

// 6 ─ rendered file
const video = arg('video');
if (video) {
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', video]).toString());
  const v = probe.streams.find((s: any) => s.codec_type === 'video'), a = probe.streams.find((s: any) => s.codec_type === 'audio');
  const [fn, fd] = v.r_frame_rate.split('/').map(Number);
  if (v.width !== 1080 || v.height !== 1920) add('ERROR', 'file', `dimensions ${v.width}×${v.height}, expected 1080×1920 for a reel`);
  if (Math.abs(fn / fd - FPS) > 0.01) add('ERROR', 'file', `fps ${fn / fd}, expected ${FPS}`);
  if (v.codec_name !== 'h264' || v.pix_fmt !== 'yuv420p') add('WARN', 'file', `codec ${v.codec_name}/${v.pix_fmt} (Instagram-safe: h264/yuv420p)`);
  if (!a) add('ERROR', 'file', 'no audio stream'); else if (a.codec_name !== 'aac') add('WARN', 'file', `audio codec ${a.codec_name}`);
  const mf = p('assets', 'audio', slug, 'manifest.json');
  if (existsSync(mf)) {
    const tlen = totalFrames(computeTimeline(c, ManifestSchema.parse(JSON.parse(readFileSync(mf, 'utf8'))))) / FPS;
    if (Math.abs(ffprobeDuration(video) - tlen) > 0.25) add('WARN', 'file', `duration ${ffprobeDuration(video).toFixed(2)} s vs timeline ${tlen.toFixed(2)} s`);
  }
  // frame heuristics at 270×480, one frame / 2 s
  const W = 270, H = 480;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', video, '-vf', `fps=0.5,scale=${W}:${H}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], {maxBuffer: 1 << 29});
  const n = Math.floor(raw.length / (W * H * 3));
  const px = (f: number, x: number, y: number) => { const o = ((f * H + y) * W + x) * 3; return [raw[o], raw[o + 1], raw[o + 2]]; };
  const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  let banner = 0, edge = 0, bottomText = 0;
  const edgeAt: string[] = [], bannerAt: string[] = [], bottomAt: string[] = [];
  for (let f = 0; f < n; f++) {
    const t = f * 2;
    // red banner / bottom bar: a bottom row (last 12 %) where > 35 % of pixels are strongly red, or any row band of one flat bright colour
    for (let y = Math.floor(H * 0.88); y < H; y++) {
      let red = 0;
      for (let x = 0; x < W; x++) { const [r, g, b] = px(f, x, y); if (r > 150 && g < 90 && b < 90) red++; }
      if (red / W > 0.35) { banner++; bannerAt.push(`${t}s`); break; }
    }
    // content touching the left/right edge (bright pixels in the outer 2 columns across the middle 60 % height)
    let touch = 0, tot = 0;
    for (let y = Math.floor(H * 0.2); y < H * 0.8; y++) for (const x of [0, 1, W - 2, W - 1]) { const [r, g, b] = px(f, x, y); tot++; if (luma(r, g, b) > 150) touch++; }
    if (touch / tot > 0.04) { edge++; edgeAt.push(`${t}s`); }
    // bright (text-like) pixels in the Instagram bottom zone (below 78 % height), excluding the central 20 % where nothing is expected
    let br = 0, bt = 0;
    for (let y = Math.floor(H * 0.78); y < H; y++) for (let x = 0; x < W; x += 2) { const [r, g, b] = px(f, x, y); bt++; if (luma(r, g, b) > 200) br++; }
    if (br / bt > 0.03) { bottomText++; bottomAt.push(`${t}s`); }
  }
  banner ? add('ERROR', 'frames', `red band/bar in the bottom 12 % of ${banner} sampled frame(s): ${bannerAt.join(', ')}`) : add('INFO', 'frames', `no red bottom banner/bar in ${n} sampled frames (1 per 2 s)`);
  edge ? add('WARN', 'frames', `bright content touches the left/right frame edge at ${edgeAt.slice(0, 12).join(', ')}${edgeAt.length > 12 ? '…' : ''} — look for cropped spine/doctor/limbs`) : add('INFO', 'frames', 'no content touching the side edges in sampled frames');
  bottomText ? add('WARN', 'frames', `bright, text-like content in the Instagram bottom zone at ${bottomAt.slice(0, 12).join(', ')}${bottomAt.length > 12 ? '…' : ''} — may be covered by captions/UI; verify it is not essential information`) : add('INFO', 'frames', 'no bright content in the bottom 22 % in sampled frames');
}

const errors = F.filter((f) => f.level === 'ERROR').length, warns = F.filter((f) => f.level === 'WARN').length;
const md = `# FMC standards QC (${slug}${video ? `, ${video}` : ', no video'})\n\nResult: **${errors ? 'FAIL' : 'PASS (automated checks only)'}** — ${errors} error(s), ${warns} warning(s)\n\n${F.map((f) => `- **${f.level}** [${f.area}] ${f.msg}`).join('\n')}\n\n_Limits: heuristics flag candidates for human review. They cannot judge Arabic correctness, pronunciation, medical accuracy, character appeal or audio comfort._\n`;
console.log(md);
if (arg('out')) writeFileSync(arg('out')!, md);
process.exit(errors ? 1 : 0);
