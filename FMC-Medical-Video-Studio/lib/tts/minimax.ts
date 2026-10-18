import {writeFileSync} from 'node:fs';
import {needEnv} from '../common';

const BASE = 'https://api.minimax.io';

const call = async (path: string, body: unknown) => {
  const key = needEnv('MINIMAX_API_KEY', 'MiniMax TTS — create a key at https://platform.minimax.io');
  const group = process.env.MINIMAX_GROUP_ID ? `?GroupId=${encodeURIComponent(process.env.MINIMAX_GROUP_ID)}` : '';
  const res = await fetch(`${BASE}${path}${group}`, {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${key}`}, body: JSON.stringify(body)});
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || (json.base_resp && json.base_resp.status_code !== 0)) {
    throw new Error(`MiniMax ${path} failed: HTTP ${res.status} ${json.base_resp?.status_msg ?? ''} (code ${json.base_resp?.status_code ?? 'n/a'})`);
  }
  return json;
};

/** Lists system voices so an Arabic male voice can be chosen from what the account really offers. */
export const listMiniMaxVoices = async (): Promise<{id: string; name?: string; description?: string}[]> => {
  const j = await call('/v1/get_voice', {voice_type: 'system_voice'});
  return (j.system_voice ?? []).map((v: any) => ({id: v.voice_id, name: v.voice_name, description: Array.isArray(v.description) ? v.description.join(' ') : v.description}));
};

export const pickMiniMaxVoice = async () => {
  if (process.env.MINIMAX_VOICE_ID) return process.env.MINIMAX_VOICE_ID;
  const voices = await listMiniMaxVoices();
  const ar = voices.filter((v) => /arab/i.test(`${v.id} ${v.name ?? ''}`));
  if (!ar.length) throw new Error('No Arabic MiniMax system voice found. Set MINIMAX_VOICE_ID explicitly.');
  const male = ar.find((v) => /(guy|man|male|boy)/i.test(`${v.id} ${v.name ?? ''}`) && !/woman|female|girl/i.test(`${v.id} ${v.name ?? ''}`));
  if (!male) throw new Error(`No clearly male Arabic voice detected. Candidates: ${ar.map((v) => v.id).join(', ')}. Set MINIMAX_VOICE_ID.`);
  return male.id;
};

export const minimaxTTS = async (text: string, outFile: string) => {
  const model = process.env.MINIMAX_TTS_MODEL || 'speech-2.6-hd';
  const voice = await pickMiniMaxVoice();
  const j = await call('/v1/t2a_v2', {
    model,
    text,
    stream: false,
    language_boost: 'Arabic',
    voice_setting: {voice_id: voice, speed: 0.95, vol: 1, pitch: 0},
    audio_setting: {sample_rate: 32000, bitrate: 128000, format: 'mp3', channel: 1},
  });
  const hex: string | undefined = j.data?.audio;
  if (!hex) throw new Error('MiniMax returned no audio data.');
  writeFileSync(outFile, Buffer.from(hex, 'hex'));
  return {provider: 'minimax' as const, model, voice, file: outFile};
};
