/**
 * AUDIO-ONLY remix. The video stream is copied bit-for-bit (no re-encode), so visuals cannot change.
 *   npm run audio:mix -- --video <mp4> --out <mp4> [--slug lower-back-pain]
 * Chain: per-scene voice levelling → gentle compression → original soft pad underscore (no piano) (fade 2s in / 3s out)
 *        → sidechain ducking under narration → (NO scene-change effects unless policy + --sfx-approval) → loudness to -16 LUFS, -1.5 dBTP ceiling.
 */
import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {arg, flag, ffprobeDuration, loadContent, p} from '../lib/common';
import {loudness} from '../lib/audio-metrics';
import {computeTimeline, FPS, totalFrames} from '../src/lib/timeline';
import {ManifestSchema} from '../src/lib/schema';
import {assertSfxAllowed, FMC_AUDIO_POLICY, FMC_AUDIO_TARGETS} from '../src/lib/audioPolicy';

const slug = arg('slug', 'lower-back-pain')!;
const video = arg('video', p('output', slug, `${slug}-reel-DRAFT-voiced.mp4`))!;
const out = arg('out', p('output', 'FMC_Lower_Back_Pain_Final_Audio.mp4'))!;
const NARR_LUFS = -18, FINAL_LUFS = -16;
const MUSIC_LUFS = parseFloat(arg('music-lufs', String(FMC_AUDIO_TARGETS.musicLufs))!);
const NO_SFX = flag('no-sfx');
const tmp = p('.tmp', 'mix'); mkdirSync(tmp, {recursive: true});
const ff = (...a: string[]) => execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...a], {stdio: ['ignore', 'inherit', 'inherit']});

const c = loadContent(slug);
const manifest = ManifestSchema.parse(JSON.parse(readFileSync(p('assets', 'audio', slug, 'manifest.json'), 'utf8')));
const tl = computeTimeline(c, manifest);
const timelineTotal = totalFrames(tl) / FPS;
const vdur = ffprobeDuration(video);
const partial = flag('partial'); // preview cut: use the first part of the timeline, fade out at the end of the cut
const total = partial ? vdur : timelineTotal;
const FADE_OUT = parseFloat(arg('fade-out', '3')!);
const STEMS = arg('stems');
if (!partial && Math.abs(vdur - total) > 0.1) throw new Error(`Video is ${vdur}s but timeline is ${total}s — wrong video for this manifest.`);

// 1) narration bus: static gain per scene to a common loudness, placed at its exact timeline offset
const items = tl.filter((t) => t.audioFile);
const ins = items.flatMap((t) => ['-i', p('assets', t.audioFile!)]);
const chains = items.map((t, i) => {
  const g = NARR_LUFS - loudness(p('assets', t.audioFile!)).lufs;
  const ms = Math.round(((t.from + t.audioFrom) / FPS) * 1000);
  return `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,highpass=f=70,volume=${g.toFixed(2)}dB,adelay=${ms}|${ms}[n${i}]`;
});
const narrRaw = `${tmp}/narr_raw.wav`;
ff(...ins, '-filter_complex', `${chains.join(';')};${items.map((_, i) => `[n${i}]`).join('')}amix=inputs=${items.length}:normalize=0:duration=longest,apad=whole_dur=${total},atrim=0:${total}[o]`, '-map', '[o]', '-ar', '48000', narrRaw);
const narr = `${tmp}/narr.wav`;
// gentle leveller only (2:1, slow release) – no limiter, no EQ boost
ff('-i', narrRaw, '-af', 'acompressor=threshold=-22dB:ratio=2:attack=25:release=300:makeup=1.5dB', narr);

// 2) music bed (one continuous track) with 2 s fade-in / 3 s fade-out
const musicSrc = p(arg('music', 'assets/audio/music/fmc-ambient-pads-v6.wav')!);
if (!existsSync(musicSrc)) throw new Error('Run: python3 scripts/audio/compose_pads_v6.py assets/audio/music/fmc-ambient-pads-v6.wav');
const mRaw = `${tmp}/music_raw.wav`;
ff('-i', musicSrc, '-af', `aresample=48000,atrim=0:${total},asetpts=N/SR/TB`, mRaw);
const mGain = MUSIC_LUFS - loudness(mRaw).lufs;
const music = `${tmp}/music.wav`;
ff('-i', mRaw, '-af', `volume=${mGain.toFixed(2)}dB,afade=t=in:st=0:d=2,afade=t=out:st=${(total - FADE_OUT).toFixed(2)}:d=${FADE_OUT}`, music);

// 3) OPTIONAL transition textures (Version B only). One soft airy sound at a time, ~30 dB below the narration, hand-picked times.
//    No file / no times / --no-sfx  =>  digital silence (Version A).
const SFX_FILE = arg('sfx-file');
// POLICY GATE: any effect stem needs the policy flag enabled AND an explicit approval id. Default = refuse.
if (SFX_FILE && !NO_SFX) assertSfxAllowed('transition', arg('sfx-approval'));
if (!FMC_AUDIO_POLICY.backgroundMusicEnabled && arg('music')) throw new Error('FMC audio policy: background music is disabled.');
const SFX_TIMES = (arg('sfx-times', '') ?? '').split(',').filter(Boolean).map(parseFloat).filter((t) => t < total - 1.5);
const REL_DB = parseFloat(arg('sfx-rel-db', '-30')!);
const sfx = `${tmp}/sfx.wav`;
let cuts: number[] = [];
if (!NO_SFX && SFX_FILE && SFX_TIMES.length) {
  const sorted = [...SFX_TIMES].sort((x, y) => x - y);
  const dur = ffprobeDuration(p(SFX_FILE));
  for (let i = 1; i < sorted.length; i++) if (sorted[i] - sorted[i - 1] < dur + 0.5) throw new Error('SFX events overlap: only one transition sound may play at a time.');
  const gdb = NARR_LUFS + REL_DB - loudness(p(SFX_FILE)).lufs; // level relative to the (levelled) narration
  cuts = sorted.map((t) => Math.round(t * 1000));
  const sIns = cuts.flatMap(() => ['-i', p(SFX_FILE)]);
  const sChains = cuts.map((ms, i) => `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${gdb.toFixed(2)}dB,adelay=${ms}|${ms}[s${i}]`);
  ff(...sIns, '-filter_complex', `${sChains.join(';')};${cuts.map((_, i) => `[s${i}]`).join('')}amix=inputs=${cuts.length}:normalize=0,apad=whole_dur=${total},atrim=0:${total}[o]`, '-map', '[o]', sfx);
  console.log(`SFX events at ${sorted.join(', ')} s, ${gdb.toFixed(1)} dB gain (target ${REL_DB} dB under narration)`);
}

// 4) duck music+sfx under narration (sidechain). The narration bus stays untouched.
const duckedBed = `${tmp}/bed_ducked.wav`;
ff(...(cuts.length ? ['-i', music, '-i', sfx, '-i', narr] : ['-i', music, '-i', narr]), '-filter_complex',
  (cuts.length ? '[0:a][1:a]amix=inputs=2:normalize=0[bed];[2:a]asplit=2[k][n];' : '[0:a]anull[bed];[1:a]asplit=2[k][n];') + '[bed][k]sidechaincompress=threshold=0.03:ratio=3.2:attack=60:release=1100:makeup=1[d];[d]alimiter=limit=0.95[o];[n]anullsink', '-map', '[o]', duckedBed);

// 5) final loudness: ONE static gain applied to both stems (no pumping), true-peak ceiling -1.5 dBFS on the sum
const sum0 = `${tmp}/sum0.wav`;
ff('-i', duckedBed, '-i', narr, '-filter_complex', '[0:a][1:a]amix=inputs=2:normalize=0[o]', '-map', '[o]', sum0);
const g = arg('final-gain') ? parseFloat(arg('final-gain')!) : FINAL_LUFS - loudness(sum0).lufs;
const narrOut = `${tmp}/narration_final.wav`, musicOut = `${tmp}/music_final.wav`, sfxOut = `${tmp}/sfx_final.wav`;
ff('-i', narr, '-af', `volume=${g.toFixed(2)}dB,alimiter=limit=0.89:attack=3:release=60:level=disabled`, narrOut);
ff('-i', duckedBed, '-af', `volume=${g.toFixed(2)}dB`, musicOut);
if (cuts.length) ff('-i', sfx, '-af', `volume=${g.toFixed(2)}dB`, sfxOut); else ff('-f', 'lavfi', '-i', `anullsrc=r=48000:cl=stereo`, '-t', total.toFixed(3), sfxOut); // Version A: silence
const fin = `${tmp}/final.wav`;
ff(...(cuts.length ? ['-i', narrOut, '-i', musicOut, '-i', sfxOut] : ['-i', narrOut, '-i', musicOut]), '-filter_complex', `${cuts.length ? '[0:a][1:a][2:a]amix=inputs=3' : '[0:a][1:a]amix=inputs=2'}:normalize=0,alimiter=limit=0.8:attack=5:release=80:level=disabled[o]`, '-map', '[o]', fin);
if (STEMS) {
  mkdirSync(STEMS, {recursive: true});
  writeFileSync(`${STEMS}/gain.json`, JSON.stringify({finalGainDb: g}));
  for (const [src, name] of [[narrOut, 'narration.wav'], [musicOut, 'music.wav'], [sfxOut, 'sound_effects.wav'], [fin, 'final_mix.wav']]) ff('-i', src, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', `${STEMS}/${name}`);
  ff('-i', fin, '-c:a', 'libmp3lame', '-b:a', '256k', `${STEMS}/final_mix.mp3`);
}

// 6) mux: video stream copied untouched
mkdirSync(p('output'), {recursive: true});
ff('-i', video, '-i', fin, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-af', 'alimiter=limit=0.7:attack=3:release=60:level=disabled', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2', '-t', total.toFixed(3), '-movflags', '+faststart', out);
console.log(`stems → ${tmp}\nwrote ${out}\nnarration gain/music gain applied: music ${mGain.toFixed(1)} dB, final ${g.toFixed(1)} dB`);

// 7) automatic post-mix audio QC (policy + loudness + clipping + transients). Reports; a human still has to listen.
{
  const qc = spawnSync('npx', ['tsx', p('scripts', 'audio-qc.ts'), '--video', out, ...(STEMS ? ['--stems', STEMS] : []), '--slug', slug, '--out', out.replace(/\.mp4$/, '.audio-qc.md')], {stdio: 'inherit', cwd: p()});
  if (qc.status !== 0) console.error('\nAUDIO QC FAILED — see the report above. Do not publish until the errors are resolved.');
}
