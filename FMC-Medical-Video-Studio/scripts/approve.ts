/**
 * Human sign-offs. Records WHO approved WHAT; nothing here is automatic.
 *   npm run approve -- script <slug> --by "Name" [--notes "..."]        locks the script hash
 *   npm run approve -- pronunciation <slug> --by "Name"                 after listening to the narration
 *   npm run approve -- review <slug> --kind grammar|terminology|medical --by "Name"
 *   npm run voice:approve -- --provider minimax|google --by "Name"
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {arg, loadContent, p, scriptHash} from '../lib/common';
import {runArabicQC} from '../lib/arabic-qc';

const [cmd, slug] = process.argv.slice(2).filter((a) => !a.startsWith('--') && !['minimax', 'google'].includes(a));
const by = arg('by');
if (!by) throw new Error('--by "<your name>" is required: approvals must be attributable to a person.');
const stamp = {by, date: new Date().toISOString(), notes: arg('notes')};

if (process.argv.includes('--provider')) {
  const prov = arg('provider');
  if (prov !== 'minimax' && prov !== 'google') throw new Error('--provider must be minimax or google');
  writeFileSync(p('config', 'voice.json'), JSON.stringify({approvedProvider: prov, approvedBy: by, approvedAt: stamp.date}, null, 2));
  console.log(`Approved voice provider: ${prov} (by ${by}).`);
  process.exit(0);
}

const file = p('content', `${slug}.json`);
const raw = JSON.parse(readFileSync(file, 'utf8'));
const c = loadContent(slug);
if (cmd === 'script') {
  const errs = runArabicQC(c).filter((f) => f.level === 'error');
  if (errs.length) throw new Error(`Cannot approve: ${errs.length} Arabic QC error(s). Run npm run arabic:check.`);
  raw.approvals.scriptApproved = stamp;
  raw.approvals.approvedHash = scriptHash(c);
} else if (cmd === 'pronunciation') {
  raw.approvals.pronunciationApproved = stamp;
} else if (cmd === 'review') {
  const k = {grammar: 'grammarReview', terminology: 'medicalTerminologyReview', medical: 'medicalAccuracyReview'}[arg('kind', '') as string];
  if (!k) throw new Error('--kind must be grammar|terminology|medical');
  raw.approvals[k] = stamp;
} else throw new Error('Unknown approval command.');
writeFileSync(file, JSON.stringify(raw, null, 2) + '\n');
console.log(`Recorded ${cmd} approval for ${slug} by ${by}.`);
