import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {ContentSchema, type Content} from '../src/lib/schema';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const p = (...s: string[]) => join(ROOT, ...s);

/** Loads .env without printing anything. Real environment variables win. */
export const loadEnv = () => {
  const f = p('.env');
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]] && m[2]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
};
loadEnv();

export const needEnv = (name: string, why: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set (${why}). Add it to ${p('.env')} — see .env.example. Nothing was simulated.`);
  return v;
};

export const loadContent = (slug: string): Content => ContentSchema.parse(JSON.parse(readFileSync(p('content', `${slug}.json`), 'utf8')));

/** The approved script is the single source of truth: this hash covers everything spoken or shown. */
export const scriptHash = (c: Content) =>
  createHash('sha256')
    .update(JSON.stringify(c.scenes.map((s) => [s.id, s.narration, s.ttsText, s.onScreen])))
    .digest('hex');

export const ffprobeDuration = (file: string) =>
  parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

export const BROWSER = process.env.FMC_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

export const arg = (name: string, def?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] ?? 'true' : def;
};
export const flag = (name: string) => process.argv.includes(`--${name}`);
