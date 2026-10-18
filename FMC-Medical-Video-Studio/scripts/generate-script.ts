/** Drafts a new content file with Gemini. The draft is UNAPPROVED and must pass Arabic QC + human review. */
import {existsSync, writeFileSync} from 'node:fs';
import {arg, needEnv, p} from '../lib/common';
import {ALLOWED_SERVICES} from '../lib/arabic-qc';

const topic = arg('topic');
const slug = arg('slug');
if (!topic || !slug) throw new Error('Usage: npm run script:generate -- --topic "carpal tunnel syndrome" --slug carpal-tunnel');
const out = p('content', `${slug}.json`);
if (existsSync(out)) throw new Error(`${out} exists; refusing to overwrite.`);
const key = needEnv('GEMINI_API_KEY', 'script drafting');
const model = process.env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash';
const template = JSON.parse((await import('node:fs')).readFileSync(p('content', 'lower-back-pain.json'), 'utf8'));

const prompt = `You are a medical content writer for مركز الفيصل الطبي (Al Ain, UAE). Draft a JSON content file for an Arabic educational video about: "${topic}".
Follow EXACTLY the structure and field names of this example, with the same 6 scene ids in the same order:
${JSON.stringify(template)}
Rules:
- narration: clean Modern Standard Arabic, NO diacritics, Arabic punctuation (، ؟), no Latin letters/digits.
- ttsText: the same words with diacritics added; removing diacritics must give narration exactly.
- Clinic name must be exactly: مركز الفيصل الطبي. Slogan: الرعاية المثالية.
- Only these services may be promoted: ${ALLOWED_SERVICES.join('، ')}. Never mention occupational or speech therapy.
- No guarantees, no diagnosis claims, no invented doctors/equipment. Include an urgent-care safety note where relevant.
- Keep total narration ~45-55 seconds. Keep onScreen text short.
- visual.model must be "lumbar-spine" or "none" (only the lumbar model exists); set "visual.description" to what the ideal visual would be.
- approvals: all null. sources: real, authoritative URLs only.
Return ONLY the JSON.`;
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
  method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': key},
  body: JSON.stringify({contents: [{parts: [{text: prompt}]}], generationConfig: {responseMimeType: 'application/json', temperature: 0.4}}),
});
const j: any = await res.json();
if (!res.ok) throw new Error(`Gemini failed: HTTP ${res.status} ${j.error?.message ?? ''}`);
const draft = JSON.parse(j.candidates[0].content.parts[0].text);
draft.slug = slug;
draft.approvals = {grammarReview: null, medicalTerminologyReview: null, medicalAccuracyReview: null, scriptApproved: null, pronunciationApproved: null, approvedHash: null};
writeFileSync(out, JSON.stringify(draft, null, 2) + '\n');
console.log(`Draft written to ${out}. Next: npm run arabic:check -- ${slug}, then human review and approval.`);
