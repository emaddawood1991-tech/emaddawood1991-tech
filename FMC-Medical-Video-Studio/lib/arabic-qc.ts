import {readFileSync} from 'node:fs';
import type {Content} from '../src/lib/schema';
import {scriptHash} from './common';

export const CLINIC = 'مركز الفيصل الطبي';
export const ALLOWED_SERVICES = ['العلاج الطبيعي', 'طب العظام', 'الطب العام', 'التأهيل العصبي', 'علاج الإصابات الرياضية', 'إعادة التأهيل بعد العمليات الجراحية'];

const DIACRITICS = /[ً-ٰٟۖ-ۭ]/g;
export const stripDiacritics = (s: string) => s.replace(DIACRITICS, '');

const FORBIDDEN_NAMES = ['مركز الفيصلي الطبي', 'مركز فيصل الطبي', 'عيادة الفيصل', 'مركز الفيصل الطبى', 'مركز الفيصل الطبية', 'مركز الفيصل للطب', 'عيادات الفيصل'];
const FORBIDDEN_SERVICES = ['علاج وظيفي', 'العلاج الوظيفي', 'العلاج الوظيفى', 'علاج النطق', 'أمراض النطق', 'تخاطب', 'علاج التخاطب'];
const FORBIDDEN_CLAIMS = ['نضمن', 'مضمون', 'شفاء تام', 'شفاء كامل', 'علاج نهائي', '100%', 'بدون ألم نهائيا', 'الأفضل في'];

/** Frequent spelling slips: [wrong pattern, correct form, note]. Whole-word matches only. */
const SPELLING: [RegExp, string][] = [
  [/(^|\s)الى(?=\s|$|[،.؟])/g, 'إلى'],
  [/(^|\s)اسفل(?=\s|$|[،.؟])/g, 'أسفل'],
  [/(^|\s)الاعصاب(?=\s|$|[،.؟])/g, 'الأعصاب'],
  [/(^|\s)الالم(?=\s|$|[،.؟])/g, 'الألم'],
  [/(^|\s)الاقراص(?=\s|$|[،.؟])/g, 'الأقراص'],
  [/(^|\s)اذا(?=\s|$|[،.؟])/g, 'إذا'],
  [/(^|\s)الاشارات(?=\s|$|[،.؟])/g, 'الإشارات'],
  [/(^|\s)الاسباب(?=\s|$|[،.؟])/g, 'الأسباب'],
  [/(^|\s)الانزلاق(?=\s|$|[،.؟])/g, 'الانزلاق'.replace('ا', 'ا')], // 'الانزلاق' is correct (wasl alef); kept as sentinel, never flagged
  [/غظروف/g, 'غضروف'],
  [/غضروفى/g, 'غضروفي'],
  [/(^|\s)تاهيل/g, 'تأهيل'],
  [/(^|\s)التاهيل/g, 'التأهيل'],
  [/(^|\s)الفقرات القطينة/g, 'الفقرات القطنية'],
];
const YA_ALLOWED = new Set(['إلى', 'على', 'حتى', 'المرضى', 'مرضى', 'متى', 'لدى', 'سوى', 'الأخرى', 'أخرى', 'الكبرى', 'الصغرى', 'الوسطى', 'العليا', 'الأولى', 'أولى', 'الأقصى', 'المستشفى', 'مستشفى', 'معنى', 'المعنى', 'مثنى', 'الفضلى', 'المثلى', 'الذكرى', 'الشكوى', 'الدعوى', 'الرؤى', 'تقوى', 'هدى', 'الهدى', 'أنى']);

export type Finding = {level: 'error' | 'warn'; scene: string; field: string; rule: string; message: string; text?: string};

const textFields = (c: Content) =>
  c.scenes.flatMap((s) => [
    {scene: s.id, field: 'narration', text: s.narration, spoken: true},
    ...(s.onScreen.title ? [{scene: s.id, field: 'onScreen.title', text: s.onScreen.title, spoken: false}] : []),
    ...(s.onScreen.subtitle ? [{scene: s.id, field: 'onScreen.subtitle', text: s.onScreen.subtitle, spoken: false}] : []),
    ...(s.onScreen.bullets ?? []).map((b, i) => ({scene: s.id, field: `onScreen.bullets[${i}]`, text: b, spoken: false})),
  ]);

export const runArabicQC = (c: Content): Finding[] => {
  const out: Finding[] = [];
  const add = (level: Finding['level'], scene: string, field: string, rule: string, message: string, text?: string) => out.push({level, scene, field, rule, message, text});

  for (const f of textFields(c)) {
    const t = f.text;
    // Review 1 — mechanical grammar/typography
    if (DIACRITICS.test(t)) add('error', f.scene, f.field, 'no-diacritics', 'Clean/on-screen text must not contain diacritics (they belong only in ttsText).', t);
    DIACRITICS.lastIndex = 0;
    if (/ـ/.test(t)) add('error', f.scene, f.field, 'tatweel', 'Tatweel (kashida) is not allowed.', t);
    if (/[A-Za-z0-9]/.test(t)) add('error', f.scene, f.field, 'latin-chars', 'Latin letters/digits are not allowed inside Arabic text.', t);
    if (/[,;?]/.test(t)) add('error', f.scene, f.field, 'ascii-punct', 'Use Arabic punctuation ، ؛ ؟ instead of , ; ?', t);
    if (/\s{2,}/.test(t) || /^\s|\s$/.test(t)) add('error', f.scene, f.field, 'spacing', 'Double/leading/trailing spaces.', t);
    if (/\s[،؛؟.:]/.test(t)) add('error', f.scene, f.field, 'space-before-punct', 'No space before punctuation.', t);
    if (/[،؛؟.:][^\s\n]/.test(t) && !/\d[.:]\d/.test(t)) add('error', f.scene, f.field, 'space-after-punct', 'Missing space after punctuation.', t);
    if (/(^|\s)(\S+)\s+\2(?=\s|$)/.test(t)) add('error', f.scene, f.field, 'repeated-word', 'Immediately repeated word.', t);
    const opens = (t.match(/[(\[«]/g) ?? []).length, closes = (t.match(/[)\]»]/g) ?? []).length;
    if (opens !== closes) add('error', f.scene, f.field, 'brackets', 'Unbalanced brackets/quotes.', t);
    if (!/[؀-ۿ]/.test(t)) add('error', f.scene, f.field, 'not-arabic', 'No Arabic characters found.', t);
    if (f.spoken && !/[.؟!]$/.test(t)) add('warn', f.scene, f.field, 'end-punct', 'Spoken sentence should end with . or ؟', t);

    // Spelling
    for (const [re, fix] of SPELLING) {
      re.lastIndex = 0;
      const m = re.exec(t);
      if (m && m[0].trim() !== fix && !(fix === 'الانزلاق')) add('error', f.scene, f.field, 'spelling', `Probable misspelling "${m[0].trim()}" → "${fix}"`, t);
    }
    for (const w of t.split(/[\s،؛؟.:]+/).filter(Boolean)) {
      if (/ى$/.test(w) && !YA_ALLOWED.has(w) && !YA_ALLOWED.has(w.replace(/^[وفبلك]/, ''))) add('warn', f.scene, f.field, 'ya-alef-maqsura', `Word ends with ى: "${w}" — verify (ي vs ى).`, t);
      if (/ه$/.test(w) && w.length > 3) add('warn', f.scene, f.field, 'ha-ta-marbuta', `Word ends with ه: "${w}" — verify (ه vs ة).`, t);
    }

    // Brand + services + claims
    for (const bad of FORBIDDEN_NAMES) if (t.includes(bad)) add('error', f.scene, f.field, 'clinic-name', `Forbidden clinic-name variant "${bad}". Use "${CLINIC}".`, t);
    for (const m of t.matchAll(/مركز\s+(?:ال)?فيصل\S*(?:\s+\S+)?/g)) {
      const found = m[0].replace(/\s+/g, ' ');
      if (!found.startsWith(CLINIC)) add('error', f.scene, f.field, 'clinic-name', `Clinic name must be exactly "${CLINIC}" (found "${found}").`, t);
    }
    for (const bad of FORBIDDEN_SERVICES) if (t.includes(bad)) add('error', f.scene, f.field, 'service', `"${bad}" is not a current FMC service.`, t);
    for (const bad of FORBIDDEN_CLAIMS) if (t.includes(bad)) add('error', f.scene, f.field, 'claim', `Unsupported medical/marketing claim "${bad}".`, t);
  }

  for (const s of c.scenes) {
    // TTS text may only add diacritics: never silently rewrite narration.
    if (stripDiacritics(s.ttsText) !== s.narration)
      add('error', s.id, 'ttsText', 'tts-matches-narration', 'ttsText with diacritics removed must equal narration exactly (single source of truth).', s.ttsText);
    // Review 3 — pronunciation readiness: names need diacritics in TTS text
    if (s.narration.includes(CLINIC) && !s.ttsText.includes('مَرْكَزِ الْفَيْصَلِ الطِّبِّيِّ') && !s.ttsText.includes('مَرْكَزُ الْفَيْصَلِ الطِّبِّيُّ'))
      add('warn', s.id, 'ttsText', 'clinic-name-diacritics', 'Add full diacritics to the clinic name in ttsText.', s.ttsText);
    if (/[A-Za-z0-9]/.test(s.ttsText)) add('error', s.id, 'ttsText', 'latin-chars', 'TTS text must be pure Arabic.', s.ttsText);
    const words = s.narration.split(/\s+/).length;
    if (words / s.plannedSec > 3.2) add('warn', s.id, 'pacing', 'pacing', `~${words} words in ${s.plannedSec}s planned; timeline will stretch to fit narration.`);
  }

  // Contact details are never added unless explicitly requested (phone numbers, websites, QR, handles, messaging apps).
  for (const f of textFields(c)) {
    if (/(?:\+?\d[\d\s-]{6,}\d)/.test(f.text) || /https?:|www\.|\.(?:com|ae|org|net)\b|@\w|\bQR\b|رمز\s*الاستجابة|واتساب|واتس\s*اب|\bwhatsapp\b|تواصل\s+معنا\s+على|اتصل\s+(?:بنا|على)/i.test(f.text))
      add('error', f.scene, f.field, 'contact-details', 'Phone numbers, websites, QR codes and handles must not appear unless explicitly requested.', f.text);
  }
  // Pronunciation lexicon: where a known term is narrated, ttsText must carry the lexicon's diacritised form (human review still required).
  try {
    const lex = JSON.parse(readFileSync(new URL('../config/pronunciation.json', import.meta.url), 'utf8')).entries as {term: string; tts: string; alt?: string[]; humanReviewed: boolean}[];
    for (const s of c.scenes) for (const e of lex) {
      if (!stripDiacritics(s.ttsText).includes(e.term)) continue;
      const forms = [e.tts, ...(e.alt ?? [])];
      if (!forms.some((x) => s.ttsText.includes(x))) add('warn', s.id, 'ttsText', 'pronunciation-lexicon', `"${e.term}" is narrated but ttsText does not use the lexicon form (${forms[0]}) — check case endings or update the lexicon.`, s.ttsText);
    }
    const open = lex.filter((e) => !e.humanReviewed).length;
    if (open) add('warn', '-', 'pronunciation', 'lexicon-unreviewed', `${open} lexicon entries are machine-drafted and not human-reviewed; pronunciation approval after listening is still required.`);
  } catch { add('warn', '-', 'pronunciation', 'lexicon-missing', 'config/pronunciation.json not found or invalid.'); }

  for (const sv of c.services) if (!ALLOWED_SERVICES.includes(sv)) add('error', '-', 'services', 'service', `"${sv}" is not in the allowed service list.`);
  if (c.scenes.at(-1)?.id !== 'closing') add('error', '-', 'scenes', 'structure', 'Last scene must be the branded closing.');
  const closing = c.scenes.find((s) => s.id === 'closing');
  if (closing && !closing.narration.includes(CLINIC)) add('error', 'closing', 'narration', 'branding', `Closing must mention "${CLINIC}".`);
  if (closing && !closing.narration.includes('الرعاية المثالية')) add('error', 'closing', 'narration', 'branding', 'Closing must include the slogan الرعاية المثالية.');

  // Approval lock
  const a = c.approvals;
  const h = scriptHash(c);
  if (a.approvedHash && a.approvedHash !== h) add('error', '-', 'approvals', 'hash-lock', 'Script changed after approval. Re-run grammar/medical review and re-approve.');
  return out;
};

export type Gate = {ok: boolean; missing: string[]};
/** Everything a human must sign before a FINAL export. */
export const finalExportGate = (c: Content): Gate => {
  const a = c.approvals;
  const missing: string[] = [];
  if (!a.grammarReview) missing.push('grammarReview');
  if (!a.medicalTerminologyReview) missing.push('medicalTerminologyReview');
  if (!a.medicalAccuracyReview) missing.push('medicalAccuracyReview');
  if (!a.scriptApproved) missing.push('scriptApproved (human)');
  if (!a.pronunciationApproved) missing.push('pronunciationApproved (human, after listening)');
  if (!a.approvedHash) missing.push('approvedHash');
  else if (a.approvedHash !== scriptHash(c)) missing.push('approvedHash mismatch (script edited after approval)');
  return {ok: missing.length === 0, missing};
};
