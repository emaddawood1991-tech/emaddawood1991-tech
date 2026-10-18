import {execFileSync, spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {needEnv, ffprobeDuration} from './common';

export const loudness = (file: string) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {encoding: 'utf8'});
  const t = r.stderr;
  const lufs = parseFloat(t.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop()?.match(/-?[\d.]+/)?.[0] ?? 'NaN');
  const peak = parseFloat(t.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop()?.match(/-?[\d.]+/)?.[0] ?? 'NaN');
  return {lufs, truePeakDb: peak};
};

export const silence = (file: string) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'silencedetect=n=-40dB:d=0.7', '-f', 'null', '-'], {encoding: 'utf8'});
  return (r.stderr.match(/silence_end/g) ?? []).length;
};

const lev = (a: string, b: string) => {
  const m = a.length, n = b.length;
  const d = Array.from({length: m + 1}, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
};
export const normalizeAr = (s: string) => s.replace(/[\u064B-\u065F\u0670]/g, '').replace(/[إأآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^\u0621-\u064A\s]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * AUTOMATED round-trip check: Gemini transcribes the generated audio, we compare to the approved text.
 * This catches dropped/garbled words. It is NOT a human listening review and cannot judge accent, tone or tashkeel.
 */
export const asrRoundTrip = async (audioFile: string, expected: string) => {
  const key = needEnv('GEMINI_API_KEY', 'ASR round-trip check');
  const ext = audioFile.split('.').pop();
  const mime = ext === 'mp3' ? 'audio/mp3' : 'audio/wav';
  const model = process.env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'x-goog-api-key': key},
    body: JSON.stringify({contents: [{parts: [{text: 'Transcribe this Arabic audio verbatim in Arabic script. Output only the transcript, no commentary.'}, {inlineData: {mimeType: mime, data: readFileSync(audioFile).toString('base64')}}]}]}),
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`ASR check failed: HTTP ${res.status} ${j.error?.message ?? ''}`);
  const heard: string = j.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join(' ') ?? '';
  const a = normalizeAr(expected), b = normalizeAr(heard);
  const wer = lev(a, b) / Math.max(a.length, 1);
  return {heard, charErrorRate: +wer.toFixed(3)};
};

export {ffprobeDuration, execFileSync};
