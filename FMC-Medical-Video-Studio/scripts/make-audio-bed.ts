/** Synthesises an ORIGINAL ambient pad + soft whoosh with ffmpeg (no third-party licence involved). Replace with licensed music any time. */
import {mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {p} from '../lib/common';

mkdirSync(p('assets', 'audio', 'music'), {recursive: true});
mkdirSync(p('assets', 'audio', 'sfx'), {recursive: true});
const ff = (...a: string[]) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
// A-minor-ish suspended pad: stacked sines with slow tremolo, low-passed, reverbed.
const notes = [110, 164.81, 220, 329.63, 440];
const inputs = notes.flatMap((f) => ['-f', 'lavfi', '-i', `sine=frequency=${f}:sample_rate=44100:duration=70`]);
const mix = notes.map((_, i) => `[${i}:a]volume=${[0.5, 0.35, 0.3, 0.16, 0.08][i]},tremolo=f=${(0.12 + i * 0.03).toFixed(2)}:d=0.35[a${i}]`).join(';');
ff(...inputs, '-filter_complex', `${mix};${notes.map((_, i) => `[a${i}]`).join('')}amix=inputs=${notes.length}:normalize=0,lowpass=f=1800,aecho=0.8:0.6:700|1100:0.35|0.25,afade=t=in:d=3,afade=t=out:st=66:d=4,loudnorm=I=-26:TP=-3[o]`, '-map', '[o]', '-ac', '2', '-b:a', '192k', p('assets', 'audio', 'music', 'ambient-bed.mp3'));
// Soft whoosh: band-passed noise swell.
ff('-f', 'lavfi', '-i', 'anoisesrc=d=1.6:c=pink:r=44100:a=0.5', '-af', 'bandpass=f=900:w=1.2,tremolo=f=1.2:d=0.2,afade=t=in:d=0.7,afade=t=out:st=0.7:d=0.9,volume=0.5', '-ac', '2', p('assets', 'audio', 'sfx', 'whoosh.mp3'));
console.log('Wrote assets/audio/music/ambient-bed.mp3 and assets/audio/sfx/whoosh.mp3');
