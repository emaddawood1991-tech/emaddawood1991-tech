/**
 * AUDIO-ONLY remix. The video stream is copied bit-for-bit (no re-encode), so visuals cannot change.
 *   npm run audio:mix -- --video <mp4> --out <mp4> [--slug lower-back-pain]
 * Chain: per-scene voice levelling → gentle compression → original piano/pad underscore (fade 2s in / 3s out)
 *        → sidechain ducking under narration → faint air swells at scene changes → loudness to -16 LUFS, -1.5 dBTP ceiling.
 */
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync} from 'node:fs';
import {arg, ffprobeDuration, loadContent, p} from '../lib/common';
import {loudness} from '../lib/audio-metrics';
import {computeTimeline, FPS, totalFrames} from '../src/lib/timeline';
import {ManifestSchema} from '../src/lib/schema';

const slug = arg('slug', 'lower-back-pain')!;
const video = arg('video', p('output', slug, `${slug}-reel-DRAFT-voiced.mp4`))!;
const out = arg('out', p('output', 'FMC_Lower_Back_Pain_Final_Audio.mp4'))!;
const NARR_LUFS = -18, MUSIC_LUFS = -22.5, FINAL_LUFS = -16;
const tmp = p('.tmp', 'mix'); mkdirSync(tmp, {recursive: true});
const ff = (...a: string[]) => execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...a], {stdio: ['ignore', 'inherit', 'inherit']});

const c = loadContent(slug);
const manifest = ManifestSchema.parse(JSON.parse(readFileSync(p('assets', 'audio', slug, 'manifest.json'), 'utf8')));
const tl = computeTimeline(c, manifest);
const total = totalFrames(tl) / FPS;
const vdur = ffprobeDuration(video);
if (Math.abs(vdur - total) > 0.1) throw new Error(`Video is ${vdur}s but timeline is ${total}s — wrong video for this manifest.`);

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
const musicSrc = p('assets', 'audio', 'music', 'fmc-ambient-piano.wav');
if (!existsSync(musicSrc)) throw new Error('Run: python3 scripts/audio/compose_music.py assets/audio/music/fmc-ambient-piano.wav 86');
const mRaw = `${tmp}/music_raw.wav`;
ff('-i', musicSrc, '-af', `aresample=48000,atrim=0:${total},asetpts=N/SR/TB`, mRaw);
const mGain = MUSIC_LUFS - loudness(mRaw).lufs;
const music = `${tmp}/music.wav`;
ff('-i', mRaw, '-af', `volume=${mGain.toFixed(2)}dB,afade=t=in:st=0:d=2,afade=t=out:st=${(total - 3).toFixed(2)}:d=3`, music);

// 3) extremely subtle air swells (soft filtered noise) at scene changes — far below narration
const swell = `${tmp}/swell.wav`;
ff('-f', 'lavfi', '-i', 'anoisesrc=d=3:c=pink:r=48000:a=0.5', '-af', 'highpass=f=250,lowpass=f=1800,afade=t=in:st=0:d=1.5:curve=qsin,afade=t=out:st=1.5:d=1.5:curve=qsin,volume=-26dB,aformat=channel_layouts=stereo', swell);
const cuts = tl.slice(1).map((t) => Math.max(0, Math.round((t.from / FPS - 1.2) * 1000)));
const sIns = cuts.flatMap(() => ['-i', swell]);
const sChains = cuts.map((ms, i) => `[${i}:a]adelay=${ms}|${ms}[s${i}]`);
const sfx = `${tmp}/sfx.wav`;
ff(...sIns, '-filter_complex', `${sChains.join(';')};${cuts.map((_, i) => `[s${i}]`).join('')}amix=inputs=${cuts.length}:normalize=0,apad=whole_dur=${total},atrim=0:${total}[o]`, '-map', '[o]', sfx);

// 4) duck music+sfx under narration (sidechain), then sum
const bed = `${tmp}/bed.wav`;
ff('-i', music, '-i', sfx, '-i', narr, '-filter_complex',
  '[0:a][1:a]amix=inputs=2:normalize=0[bed];[2:a]asplit=2[k][n];[bed][k]sidechaincompress=threshold=0.03:ratio=3.2:attack=60:release=1100:makeup=1[ducked];[ducked]alimiter=limit=0.95[d]'
  + ';[d][n]amix=inputs=2:normalize=0[o]', '-map', '[o]', bed);

// 5) final loudness: one static gain (no pumping), true-peak safety ceiling at -1.5 dBFS
const fin = `${tmp}/final.wav`;
const g = FINAL_LUFS - loudness(bed).lufs;
ff('-i', bed, '-af', `volume=${g.toFixed(2)}dB,alimiter=limit=0.84:attack=5:release=80:level=disabled`, fin);

// 6) mux: video stream copied untouched
mkdirSync(p('output'), {recursive: true});
ff('-i', video, '-i', fin, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2', '-t', total.toFixed(3), '-movflags', '+faststart', out);
console.log(`stems → ${tmp}\nwrote ${out}\nnarration gain/music gain applied: music ${mGain.toFixed(1)} dB, final ${g.toFixed(1)} dB`);
