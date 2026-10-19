/**
 * Non-rendering persistence check:  npm run verify:skills [-- --quick] [-- --fresh-session] [-- --out file.md]
 * Verifies that the FMC production instructions, the fmc-video-producer skill, the skills registry, the installed plugins and the enforced audio
 * policy are all in place and consistent. It never renders video, never calls a paid API.
 *   --quick          skip `tsc` and `npm test`
 *   --fresh-session  also start a headless `claude -p` session (one tiny model call) and check skill discovery from both working directories
 * Statuses: PASS / FAIL / WARN / SKIP. Exit 1 on any FAIL.
 */
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {arg, flag, p} from '../lib/common';
import {FMC_AUDIO} from '../src/lib/audioPolicy';

type Row = {id: string; what: string; status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP'; detail: string};
const rows: Row[] = [];
const add = (id: string, what: string, status: Row['status'], detail = '') => rows.push({id, what, status, detail});
const repo = join(p(), '..');
const read = (f: string) => readFileSync(f, 'utf8');
const run = (cmd: string, args: string[], cwd = p()) => spawnSync(cmd, args, {cwd, encoding: 'utf8', timeout: 600000});

// 1 ─ CLAUDE.md carries the production rules
const claudeMd = existsSync(p('CLAUDE.md')) ? read(p('CLAUDE.md')) : '';
const REQUIRED = ['مركز الفيصل الطبي', 'Ideal Care – الرعاية المثالية', 'clean-shaven', 'Never a robot', 'fmc-video-producer', 'FMC_SKILLS_REGISTRY.md', 'FMC_AUDIO', '<NarrationAudio>', 'Continuous-camera', 'audio:qc', 'standards:qc', 'verify:skills', 'Do not render any video until', 'original FMC logo', 'No phone numbers', 'OneTake', 'HyperFrames', 'Lemo Opuscar', 'Claude Animation Base', 'Collage', 'Modern Standard Arabic', 'Medical anatomy', 'automatic whooshes'];
const missing = REQUIRED.filter((s) => !claudeMd.includes(s));
add('claude-md', 'FMC-Medical-Video-Studio/CLAUDE.md contains the production rules', missing.length ? 'FAIL' : 'PASS', missing.length ? `missing: ${missing.join(' | ')}` : `${REQUIRED.length} required markers present`);
const rootMd = existsSync(join(repo, 'CLAUDE.md')) ? read(join(repo, 'CLAUDE.md')) : '';
add('root-claude-md', 'repo-root CLAUDE.md points sessions started at the root to the FMC rules', /FMC-Medical-Video-Studio\/CLAUDE\.md/.test(rootMd) ? 'PASS' : 'FAIL');

// 2 ─ the skill: location, format, copies identical
const skillPaths = [join(repo, '.claude/skills/fmc-video-producer/SKILL.md'), p('.claude/skills/fmc-video-producer/SKILL.md')];
const skillTexts = skillPaths.map((f) => (existsSync(f) ? read(f) : null));
add('skill-exists', 'fmc-video-producer SKILL.md exists (repo root + FMC folder)', skillTexts.every(Boolean) ? 'PASS' : 'FAIL', skillPaths.filter((_, i) => !skillTexts[i]).join(', '));
if (skillTexts[0] && skillTexts[1]) add('skill-identical', 'both copies are identical (no drift)', skillTexts[0] === skillTexts[1] ? 'PASS' : 'FAIL');
const skill = skillTexts[1] ?? skillTexts[0] ?? '';
const fm = skill.match(/^---\n([\s\S]*?)\n---\n/);
const fmField = (k: string) => fm?.[1].match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim() ?? '';
const name = fmField('name'), desc = fmField('description');
add('skill-frontmatter', 'frontmatter: name = fmc-video-producer (lowercase-hyphen ≤ 64), description present ≤ 1024 chars', fm && name === 'fmc-video-producer' && /^[a-z0-9-]{1,64}$/.test(name) && desc.length > 40 && desc.length <= 1024 ? 'PASS' : 'FAIL', `name="${name}", description ${desc.length} chars`);
add('skill-description', 'description carries the required wording (Arabic medical video production for مركز الفيصل الطبي …)', desc.includes('Professional Arabic medical video production for مركز الفيصل الطبي') && /approved cinematic animation, character, anatomy, and audio workflows/.test(desc) ? 'PASS' : 'FAIL');
add('skill-no-duplication', 'skill is a coordinator (< 120 lines, no code blocks)', skill.split('\n').length < 120 && !/```/.test(skill) ? 'PASS' : 'WARN', `${skill.split('\n').length} lines`);

// 3 ─ referenced files exist
const PLACEHOLDER = /[<>*|{}$…]|^https?:|^~|^\/(root|home)|\s|^-|^npm|^\.env|node_modules|^output\/|^assets\/audio\/sfx\/$|\.\.\./;
const refFiles = [join(repo, '.claude/skills/fmc-video-producer/SKILL.md'), p('CLAUDE.md'), p('FMC_SKILLS_REGISTRY.md'), ...['claude-animation-principles', 'continuous-camera-transitions', 'paper-collage-broll'].map((n) => p('docs', 'skills', `${n}.md`))];
const bad: string[] = [];
let checked = 0;
for (const f of refFiles.filter(existsSync)) {
  const text = read(f).replace(/```[\s\S]*?```/g, (m) => (m.startsWith('```json skills-registry') ? '' : m));
  for (const m of text.matchAll(/`([^`\n]+)`/g)) {
    const t = m[1].replace(/[,.:;)]+$/, '');
    if (PLACEHOLDER.test(t) || !/^[\w./@-]+$/.test(t)) continue;
    if (!(/\.(md|ts|tsx|json|mjs|png|html|js)$/.test(t) || (t.includes('/') && t.endsWith('/')))) continue;
    if (!t.includes('/') && !/^(CLAUDE|FMC_[A-Z_]+|README)\.md$/.test(t) && !/^(package|tsconfig)\.json$/.test(t)) continue; // bare names like "index.html" are not project paths
    checked++;
    if (![p(t), join(repo, t), join(p('src'), t)].some(existsSync)) bad.push(`${t} (in ${f.replace(repo + '/', '')})`);
  }
}
add('refs', 'file paths referenced by CLAUDE.md / skill / registry / skill docs exist', bad.length ? 'FAIL' : 'PASS', bad.length ? bad.slice(0, 12).join('; ') : `${checked} path references resolved`);

// 4 ─ registry
const regText = existsSync(p('FMC_SKILLS_REGISTRY.md')) ? read(p('FMC_SKILLS_REGISTRY.md')) : '';
let registry: any[] = [];
try { registry = JSON.parse(regText.match(/```json skills-registry\n([\s\S]*?)\n```/)![1]); } catch { /* handled below */ }
const STATUS = new Set(['INSTALLED', 'CONFIGURED', 'TESTED', 'NOT AVAILABLE']);
const regProblems: string[] = [];
const FIELDS = ['id', 'name', 'repository', 'version', 'location', 'license', 'installation', 'capability', 'invocation', 'usedFor', 'evidence', 'limitations', 'files'];
for (const e of registry) {
  for (const k of FIELDS) if (e[k] === undefined || e[k] === '') regProblems.push(`${e.id}: missing ${k}`);
  if (!STATUS.has(e.installation) || !STATUS.has(e.capability)) regProblems.push(`${e.id}: bad status`);
  if (e.capability === 'TESTED' && String(e.evidence).length < 40) regProblems.push(`${e.id}: TESTED without evidence`);
  for (const f of e.files ?? []) if (![p(f), join(repo, f)].some(existsSync)) regProblems.push(`${e.id}: file ${f} missing`);
}
if (new Set(registry.map((e) => e.id)).size !== registry.length) regProblems.push('duplicate ids');
for (const id of ['fmc-video-producer', 'hyperframes', 'lemo-opuscar', 'claude-animation-base', 'continuous-camera-transitions', 'collage-broll']) if (!registry.some((e) => e.id === id)) regProblems.push(`registry lacks ${id}`);
add('registry', 'FMC_SKILLS_REGISTRY.md machine block valid (fields, statuses, evidence, files)', registry.length && !regProblems.length ? 'PASS' : 'FAIL', regProblems.join('; ') || `${registry.length} entries`);

// 5 ─ installed plugins discoverable
const ip = join(homedir(), '.claude', 'plugins', 'installed_plugins.json');
if (!existsSync(ip)) add('plugins', 'plugins installed and discoverable', 'SKIP', `${ip} not found (fresh container?) — settings.json offers the install; run: claude plugin marketplace add heygen-com/hyperframes && claude plugin install hyperframes@hyperframes; claude plugin marketplace add lemomo-ai/lemo-opuscar && claude plugin install lemo-opuscar@lemolab`);
else {
  const inst = JSON.parse(read(ip)); const plugins = inst.plugins ?? inst;
  const probs: string[] = [];
  const NEED: Record<string, string[]> = {'hyperframes@hyperframes': ['hyperframes-core', 'hyperframes-animation', 'hyperframes-keyframes', 'hyperframes-audio', 'hyperframes-creative', 'hyperframes-cli'], 'lemo-opuscar@lemolab': ['lemo-opuscar']};
  for (const [pl, skills] of Object.entries(NEED)) {
    const entry = plugins[pl]?.[0];
    if (!entry) { probs.push(`${pl} not installed`); continue; }
    if (!existsSync(entry.installPath)) { probs.push(`${pl}: installPath missing`); continue; }
    for (const s of skills) if (!existsSync(join(entry.installPath, 'skills', s, 'SKILL.md')) && !existsSync(join(entry.installPath, 'plugin', 'skills', s, 'SKILL.md'))) probs.push(`${pl}: skill ${s} missing`);
    const reg = registry.find((e) => e.plugin === pl);
    if (reg && !String(reg.version).includes(String(entry.version).slice(0, 12))) probs.push(`${pl}: registry version "${reg.version}" ≠ installed ${entry.version}`);
  }
  add('plugins', 'plugins installed, versions match registry, their skills exist on disk', probs.length ? 'FAIL' : 'PASS', probs.join('; ') || Object.keys(NEED).map((k) => `${k} ${plugins[k][0].version}`).join(', '));
}
const settingsOk = [join(repo, '.claude/settings.json'), p('.claude/settings.json')].map((f) => { try { const s = JSON.parse(read(f)); return !!s.enabledPlugins?.['hyperframes@hyperframes'] && !!s.enabledPlugins?.['lemo-opuscar@lemolab'] && !!s.extraKnownMarketplaces?.hyperframes && !!s.extraKnownMarketplaces?.lemolab; } catch { return false; } });
add('project-settings', 'project .claude/settings.json (repo root + FMC) declares the marketplaces and enabled plugins', settingsOk.every(Boolean) ? 'PASS' : 'FAIL');

// 6 ─ audio policy still enforced
const flags = ['transitionSFX', 'cameraSFX', 'characterSFX', 'interfaceSFX', 'anatomySFX', 'autoSoundEffects', 'piano', 'percussion', 'vocals', 'footageAudio'] as const;
add('audio-flags', 'FMC_AUDIO: all effect/piano/percussion/vocal/footage flags false; narration + music on', flags.every((k) => (FMC_AUDIO as any)[k] === false) && FMC_AUDIO.narration && FMC_AUDIO.backgroundMusic ? 'PASS' : 'FAIL');
const aq = run('npx', ['tsx', 'scripts/audio-qc.ts']);
add('audio-qc', 'audio:qc passes on the repo (no raw <Audio>, no effect assets, no sfx in content, silent overlays)', aq.status === 0 ? 'PASS' : 'FAIL', aq.status === 0 ? '' : aq.stdout.slice(-400));
const hf = run('node', ['scripts/hf.mjs', 'render']);
add('hf-guard', 'guarded HyperFrames wrapper refuses render without approval', hf.status === 3 ? 'PASS' : 'FAIL', `exit ${hf.status}`);

// 7 ─ existing components still work
if (flag('quick')) add('tsc-tests', 'type-check + unit tests', 'SKIP', '--quick');
else {
  const ts = run('npx', ['tsc', '--noEmit']);
  add('tsc', 'TypeScript compiles (existing production components intact)', ts.status === 0 ? 'PASS' : 'FAIL', ts.status === 0 ? '' : (ts.stdout + ts.stderr).slice(0, 400));
  const tt = run('npm', ['test', '--silent']);
  const m = (tt.stdout + tt.stderr).match(/# pass (\d+)[\s\S]*# fail (\d+)/);
  add('tests', 'unit/integration tests', tt.status === 0 ? 'PASS' : 'FAIL', m ? `${m[1]} pass, ${m[2]} fail` : (tt.stdout + tt.stderr).slice(-300));
}

// 8 ─ optional fresh session discovery
if (flag('fresh-session')) {
  for (const cwd of [repo, p()]) {
    const r = spawnSync('claude', ['-p', 'Reply with exactly: OK', '--output-format', 'stream-json', '--verbose', '--max-turns', '1'], {cwd, encoding: 'utf8', timeout: 170000});
    let skills: string[] = [];
    for (const line of (r.stdout ?? '').split('\n')) { try { const d = JSON.parse(line); if (d.type === 'system' && d.subtype === 'init') { skills = d.skills ?? []; break; } } catch { /* not json */ } }
    const want = ['fmc-video-producer', 'hyperframes:hyperframes-core', 'lemo-opuscar:lemo-opuscar'];
    const miss = want.filter((s) => !skills.includes(s));
    add(`fresh-${cwd === repo ? 'root' : 'fmc'}`, `fresh headless session from ${cwd === repo ? 'repo root' : 'FMC folder'} lists ${want.join(', ')}`, skills.length && !miss.length ? 'PASS' : 'FAIL', skills.length ? (miss.length ? `missing: ${miss.join(', ')}` : `${skills.length} skills listed`) : 'could not read init event (is `claude` on PATH / authenticated?)');
  }
} else add('fresh', 'fresh-session skill discovery', 'SKIP', 'run with --fresh-session (one tiny model call)');

// report
const fails = rows.filter((r) => r.status === 'FAIL').length;
const md = `# FMC persistence verification (non-rendering)\n\nGenerated by \`npm run verify:skills\`. Result: **${fails ? 'FAIL' : 'PASS'}** — ${rows.filter((r) => r.status === 'PASS').length} pass, ${fails} fail, ${rows.filter((r) => r.status === 'WARN').length} warn, ${rows.filter((r) => r.status === 'SKIP').length} skipped.\n\n| Check | Status | Detail |\n|---|---|---|\n${rows.map((r) => `| ${r.what} | ${r.status} | ${r.detail.replace(/\|/g, '/').replace(/\n/g, ' ')} |`).join('\n')}\n`;
console.log(md);
if (arg('out')) writeFileSync(arg('out')!, md);
process.exit(fails ? 1 : 0);
