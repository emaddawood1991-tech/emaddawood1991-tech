#!/usr/bin/env node
/**
 * Guarded HyperFrames CLI wrapper:  npm run hf -- <command> [args]   (runs inside v7/hyperframes-adapter)
 * Pinned version, telemetry off, and only the FMC-approved commands. Everything that spends money, leaves the machine,
 * downloads a model, or can introduce audio (TTS, catalog music/SFX, registry blocks) is refused.
 */
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const VERSION = '0.8.171';
const ALLOWED = new Set(['lint', 'check', 'timeline', 'keyframes', 'compositions', 'info', 'doctor', 'docs', 'preview', 'snapshot', 'beats']);
const NEEDS_APPROVAL = {render: 'FMC_V7_RENDER_APPROVED', init: 'FMC_V7_HF_INIT_APPROVED'};
const BLOCKED_WHY = {
  tts: 'TTS is owned by the approved MiniMax/Google narration pipeline', transcribe: 'downloads a speech model; narration alignment is handled by FMC',
  auth: 'HeyGen account/sign-in', cloud: 'HeyGen-hosted cloud rendering (paid/external)', cloudrun: 'cloud rendering', lambda: 'cloud rendering', publish: 'publishes content externally',
  add: 'registry blocks can ship SFX/music audio files — inspect first, then use FMC_V7_HF_ADD_APPROVED=1', 'remove-background': 'cloud/model download', upgrade: 'changes the pinned version', skills: 'changes installed skills',
};

const [cmd, ...rest] = process.argv.slice(2);
if (!cmd) { console.error(`usage: npm run hf -- <${[...ALLOWED].join('|')}> [args]`); process.exit(2); }
if (cmd === 'add' && process.env.FMC_V7_HF_ADD_APPROVED === '1') { /* explicit human approval after audio inspection */ }
else if (BLOCKED_WHY[cmd]) { console.error(`FMC policy: "hyperframes ${cmd}" is blocked — ${BLOCKED_WHY[cmd]}.`); process.exit(3); }
else if (NEEDS_APPROVAL[cmd]) {
  if (process.env[NEEDS_APPROVAL[cmd]] !== '1') { console.error(`FMC policy: "hyperframes ${cmd}" needs explicit approval (set ${NEEDS_APPROVAL[cmd]}=1). No video is rendered during the V7 infrastructure phase.`); process.exit(3); }
} else if (!ALLOWED.has(cmd)) { console.error(`FMC policy: "hyperframes ${cmd}" is not on the allow-list.`); process.exit(3); }
if (rest.some((a) => /^--(cloud|lambda|remote)/.test(a))) { console.error('FMC policy: cloud flags are blocked.'); process.exit(3); }

const cwd = join(dirname(fileURLToPath(import.meta.url)), '..', 'v7', 'hyperframes-adapter');
const r = spawnSync('npx', ['--yes', `hyperframes@${VERSION}`, cmd, ...rest], {cwd, stdio: 'inherit', env: {...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1'}});
process.exit(r.status ?? 1);
