/** Synthesises an ORIGINAL ambient pad with ffmpeg (LEGACY — prefer scripts/audio/compose_pads_v6.py). It no longer generates any whoosh/effect: effects are disabled by FMC_AUDIO_POLICY (no third-party licence involved). Replace with licensed music any time. */
import {mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {p} from '../lib/common';

mkdirSync(p('assets', 'audio', 'music'), {recursive: true});
const ff = (...a: string[]) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
// A-minor-ish suspended pad: stacked sines with slow tremolo, low-passed, reverbed.
const notes = [110, 164.81, 220, 329.63, 440];
const inputs = notes.flatMap((f) => ['-f', 'lavfi', '-i', `sine=frequency=${f}:sample_rate=44100:duration=70`]);
const mix = notes.map((_, i) => `[${i}:a]volume=${[0.5, 0.35, 0.3, 0.16, 0.08][i]},tremolo=f=${(0.12 + i * 0.03).toFixed(2)}:d=0.35[a${i}]`).join(';');
ff(...inputs, '-filter_complex', `${mix};${notes.map((_, i) => `[a${i}]`).join('')}amix=inputs=${notes.length}:normalize=0,lowpass=f=1800,aecho=0.8:0.6:700|1100:0.35|0.25,afade=t=in:d=3,afade=t=out:st=66:d=4,loudnorm=I=-26:TP=-3[o]`, '-map', '[o]', '-ac', '2', '-b:a', '192k', p('assets', 'audio', 'music', 'ambient-bed.mp3'));
console.log('Wrote assets/audio/music/ambient-bed.mp3 (no effects generated)');
