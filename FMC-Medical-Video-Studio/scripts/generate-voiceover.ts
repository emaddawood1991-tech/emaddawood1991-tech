/**
 * Generates per-scene narration with the APPROVED provider from the approved ttsText.
 * Refuses to run if the Arabic QC fails, the script hash isn't locked, or no voice provider is approved.
 */
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {arg, ffprobeDuration, flag, loadContent, p, scriptHash} from '../lib/common';
import {runArabicQC} from '../lib/arabic-qc';
import {asrRoundTrip, loudness} from '../lib/audio-metrics';
import {minimaxTTS} from '../lib/tts/minimax';
import {googleTTS} from '../lib/tts/google';
import type {VoiceManifest} from '../src/lib/schema';

const slug = arg('slug', 'lower-back-pain')!;
const c = loadContent(slug);
const errs = runArabicQC(c).filter((f) => f.level === 'error');
if (errs.length) throw new Error(`Arabic QC has ${errs.length} error(s); fix before generating voice.`);
if (!c.approvals.approvedHash) throw new Error('Script is not approved/locked. Run: npm run approve -- script ' + slug + ' --by "<name>"');
const cfg = JSON.parse(readFileSync(p('config', 'voice.json'), 'utf8'));
const provider = (arg('provider') ?? cfg.approvedProvider) as 'minimax' | 'google' | null;
if (!provider) throw new Error('No approved voice provider. Run npm run voice:compare, listen, then npm run voice:approve.');

const dir = p('assets', 'audio', slug);
mkdirSync(dir, {recursive: true});
const gen = provider === 'minimax' ? minimaxTTS : googleTTS;
const ext = provider === 'minimax' ? 'mp3' : 'wav';
const scenes: VoiceManifest['scenes'] = [];
let model = '', voice = '';
for (const s of c.scenes) {
  const file = `${dir}/${s.id}.${ext}`;
  const r = await gen(s.ttsText, file); // exact approved text, never rewritten
  model = r.model; voice = r.voice;
  const durationSec = ffprobeDuration(file);
  if (!(durationSec > 0.5)) throw new Error(`Scene ${s.id}: audio is empty or too short.`);
  const m = loudness(file);
  let asr = 'asr: skipped';
  if (process.env.GEMINI_API_KEY && !flag('no-asr')) {
    const a = await asrRoundTrip(file, s.narration);
    asr = `asr char-error ${a.charErrorRate}`;
    if (a.charErrorRate > 0.25) console.warn(`  ⚠ ${s.id}: transcript differs notably from approved text. Listen before approving.\n     heard: ${a.heard}`);
  }
  console.log(`  ${s.id}: ${durationSec.toFixed(2)}s, ${m.lufs} LUFS, ${asr}`);
  scenes.push({id: s.id, file: `audio/${slug}/${s.id}.${ext}`, durationSec});
}
const manifest: VoiceManifest = {provider, model, voice, scriptHash: scriptHash(c), scenes};
writeFileSync(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`Voiceover ready (${provider}). Listen to ${dir}, then: npm run approve -- pronunciation ${slug} --by "<name>"`);
