import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runArabicQC, ALLOWED_SERVICES, CLINIC} from '../lib/arabic-qc';
import {ContentSchema} from '../src/lib/schema';
import {LOGO} from '../src/lib/fmcStandards';
import lowerBackPain from '../content/lower-back-pain.json';

const base = () => ContentSchema.parse(structuredClone(lowerBackPain));
const errors = (c: ReturnType<typeof base>) => runArabicQC(c).filter((f) => f.level === 'error');

test('shipped script has no automated Arabic errors', () => assert.deepEqual(errors(base()), []));

test('official name and the six current services', () => {
  assert.equal(CLINIC, 'مركز الفيصل الطبي');
  assert.deepEqual(ALLOWED_SERVICES, ['العلاج الطبيعي', 'طب العظام', 'الطب العام', 'التأهيل العصبي', 'علاج الإصابات الرياضية', 'إعادة التأهيل بعد العمليات الجراحية']);
});

test('discontinued services are rejected (occupational / speech therapy)', () => {
  for (const bad of ['العلاج الوظيفي', 'علاج النطق']) {
    const c = base(); c.scenes[3].onScreen.bullets = [bad];
    assert.ok(errors(c).some((f) => f.rule === 'service'), bad);
  }
  const c = base(); c.services = ['العلاج الوظيفي'];
  assert.ok(errors(c).some((f) => f.rule === 'service'));
});

test('contact details are rejected (phone, website, QR, handle, WhatsApp)', () => {
  for (const bad of ['اتصل على 0501234567', 'www.alfaisal.example', 'امسح رمز QR', 'تواصل عبر واتساب', 'info@example.com']) {
    const c = base(); c.scenes[4].onScreen.bullets = [bad];
    assert.ok(errors(c).some((f) => f.rule === 'contact-details'), bad);
  }
});

test('wrong clinic-name variants and unsupported claims are rejected', () => {
  const c1 = base(); c1.scenes[5].narration = 'مركز فيصل الطبي. الرعاية المثالية.'; assert.ok(errors(c1).some((f) => f.rule === 'clinic-name'));
  const c2 = base(); c2.scenes[3].onScreen.bullets = ['شفاء تام مضمون']; assert.ok(errors(c2).some((f) => f.rule === 'claim'));
});

test('ttsText may only add diacritics (no silent narration rewrite)', () => {
  const c = base(); c.scenes[0].ttsText = c.scenes[0].ttsText + ' كلمة';
  assert.ok(errors(c).some((f) => f.rule === 'tts-matches-narration'));
});

test('pronunciation lexicon is present, machine-drafted and NOT marked human-reviewed', () => {
  const lex = JSON.parse(readFileSync('config/pronunciation.json', 'utf8'));
  assert.ok(lex.entries.length >= 5);
  assert.ok(lex.entries.every((e: any) => e.humanReviewed === false), 'nothing may claim human review before a human did it');
});

test('official logo file is unmodified and has an alpha channel', () => {
  const buf = readFileSync(LOGO.file);
  assert.equal(createHash('sha256').update(buf).digest('hex'), LOGO.sha256);
  assert.ok(buf[25] === 6 || buf[25] === 4, 'PNG colour type must include alpha');
});
