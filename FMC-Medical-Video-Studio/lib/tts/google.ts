import {execFileSync} from 'node:child_process';
import {unlinkSync, writeFileSync} from 'node:fs';
import {needEnv} from '../common';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

/** Lists models on this key that advertise generateContent AND have "tts" in the name (so we never assume support). */
export const listGoogleTTSModels = async () => {
  const key = needEnv('GEMINI_API_KEY', 'Google AI Studio — https://aistudio.google.com/apikey');
  const res = await fetch(`${BASE}/models?pageSize=200`, {headers: {'x-goog-api-key': key}});
  if (!res.ok) throw new Error(`Google models list failed: HTTP ${res.status}`);
  const j: any = await res.json();
  return (j.models ?? []).filter((m: any) => /tts/i.test(m.name)).map((m: any) => m.name.replace('models/', '') as string);
};

// Style prompts made the 3.x models read/pace unnaturally (8 words took 18 s), so none is sent unless GEMINI_TTS_STYLE is set.
const _UNUSED_STYLE = 'Read the following Modern Standard Arabic text as a professional male medical narrator: calm, warm, confident, clear, natural pacing, no exaggeration. Pronounce every diacritic exactly as written. Text:';

export const googleTTS = async (text: string, outFile: string) => {
  const key = needEnv('GEMINI_API_KEY', 'Google AI Studio — https://aistudio.google.com/apikey');
  const model = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts';
  const voice = process.env.GEMINI_TTS_VOICE || 'Charon';
  let res: Response = undefined as unknown as Response;
  for (let attempt = 0; attempt < 6; attempt++) {
    res = await fetch(`${BASE}/models/${model}:generateContent`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'x-goog-api-key': key},
    body: JSON.stringify({
      contents: [{parts: [{text: process.env.GEMINI_TTS_STYLE ? `${process.env.GEMINI_TTS_STYLE}\n${text}` : text}]}],
      generationConfig: {responseModalities: ['AUDIO'], speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: voice}}}},
    }),
  });
    if (res.status !== 429) break;
    const wait = parseFloat((await res.clone().text()).match(/retry in ([\d.]+)s/)?.[1] ?? '20');
    console.log(`  Google rate limit (free tier); waiting ${Math.ceil(wait) + 2}s…`);
    await new Promise((r) => setTimeout(r, (wait + 2) * 1000));
  }
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google TTS failed: HTTP ${res.status} ${j.error?.message ?? ''}`);
  const b64: string | undefined = j.candidates?.[0]?.content?.parts?.find((x: any) => x.inlineData)?.inlineData?.data;
  if (!b64) throw new Error('Google TTS returned no audio (model may not support speech output).');
  const pcm = `${outFile}.pcm`;
  writeFileSync(pcm, Buffer.from(b64, 'base64'));
  // Gemini TTS returns raw 24 kHz, 16-bit, mono PCM.
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm, outFile]);
  unlinkSync(pcm);
  return {provider: 'google' as const, model, voice, file: outFile};
};
