/**
 * Generates the SAME 15-second Arabic medical sample with MiniMax and Google, saves both files,
 * records objective metrics, and writes a scorecard for HUMAN listening approval.
 * Providers whose credentials are missing are reported as NOT RUN (never faked).
 */
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {arg, ffprobeDuration, flag, p} from '../lib/common';
import {runArabicQC, stripDiacritics} from '../lib/arabic-qc';
import {asrRoundTrip, loudness, silence} from '../lib/audio-metrics';
import {minimaxTTS} from '../lib/tts/minimax';
import {googleTTS, listGoogleTTSModels} from '../lib/tts/google';
import type {Content} from '../src/lib/schema';

const sample = JSON.parse(readFileSync(p('content', 'voice-sample.json'), 'utf8')) as {narration: string; ttsText: string; terms: {term: string; tts: string}[]};
if (stripDiacritics(sample.ttsText) !== sample.narration) throw new Error('voice-sample ttsText does not match narration after stripping diacritics.');

const out = p('output', 'voice-samples');
mkdirSync(out, {recursive: true});
const withTerms = flag('terms');

type Row = {provider: string; status: string; file?: string; model?: string; voice?: string; durationSec?: number; lufs?: number; truePeakDb?: number; longPauses?: number; asr?: string; note?: string};
const rows: Row[] = [];

const run = async (provider: 'minimax' | 'google') => {
  const gen = provider === 'minimax' ? minimaxTTS : googleTTS;
  const ext = provider === 'minimax' ? 'mp3' : 'wav';
  try {
    const file = `${out}/sample-${provider}.${ext}`;
    const r = await gen(sample.ttsText, file);
    const dur = ffprobeDuration(file);
    const m = loudness(file);
    const row: Row = {provider, status: 'generated', file, model: r.model, voice: r.voice, durationSec: +dur.toFixed(2), lufs: m.lufs, truePeakDb: m.truePeakDb, longPauses: silence(file)};
    if (process.env.GEMINI_API_KEY) {
      try {
        const a = await asrRoundTrip(file, sample.narration);
        row.asr = `char error rate ${a.charErrorRate} — heard: «${a.heard.trim()}»`;
      } catch (e) {
        row.asr = `not run: ${(e as Error).message}`;
      }
    } else row.asr = 'not run: GEMINI_API_KEY missing';
    if (withTerms) {
      mkdirSync(`${out}/terms-${provider}`, {recursive: true});
      for (const [i, t] of sample.terms.entries()) await gen(t.tts, `${out}/terms-${provider}/${String(i + 1).padStart(2, '0')}.${ext}`);
    }
    rows.push(row);
  } catch (e) {
    rows.push({provider, status: 'NOT RUN', note: (e as Error).message});
  }
};

if (process.env.GEMINI_API_KEY) {
  try {
    console.log('Google TTS-capable models on this key:', (await listGoogleTTSModels()).join(', ') || '(none)');
  } catch (e) {
    console.log('Google model listing failed:', (e as Error).message);
  }
}
await run('minimax');
await run('google');

const md = [
  '# FMC voice comparison — same 15-second Arabic script',
  '',
  `Script (clean): ${sample.narration}`,
  '',
  '## Objective metrics (automated)',
  '| Provider | Status | Model | Voice | Duration | LUFS | True peak | Long pauses | Note |',
  '|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.provider} | ${r.status} | ${r.model ?? '-'} | ${r.voice ?? '-'} | ${r.durationSec ?? '-'} s | ${r.lufs ?? '-'} | ${r.truePeakDb ?? '-'} | ${r.longPauses ?? '-'} | ${r.note ?? ''} |`),
  '',
  '## ASR round-trip (automated; not a listening review)',
  ...rows.map((r) => `- **${r.provider}**: ${r.asr ?? 'n/a'}`),
  '',
  '## Human listening scorecard — fill in, 1 (poor) to 5 (excellent)',
  '| Criterion | MiniMax | Google |',
  '|---|---|---|',
  ...['Arabic pronunciation accuracy', 'Naturalness', 'Medical terminology', 'Voice clarity', 'Pacing', 'Emotional tone', 'Suitable for healthcare advertising'].map((c) => `| ${c} | | |`),
  '',
  'Terms to listen for: ' + sample.terms.map((t) => t.term).join(' · '),
  '',
  'Approve by running: `npm run voice:approve -- --provider minimax|google --by "<your name>"`',
].join('\n');
writeFileSync(`${out}/comparison.md`, md);
console.log(md);
const ran = rows.filter((r) => r.status === 'generated').length;
console.log(`\n${ran}/2 providers generated audio. Files in ${out}`);
process.exit(ran === 0 ? 2 : 0);
