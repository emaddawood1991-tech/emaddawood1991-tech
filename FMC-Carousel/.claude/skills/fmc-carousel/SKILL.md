---
name: fmc-carousel
description: Generate a 5-slide (max 6) Arabic RTL medical Instagram carousel for Al Faisal Medical Center (FMC / مركز الفيصل الطبي, Al Ain, UAE) from a medical topic — researched, proofread MSA copy, HTML/CSS/SVG slides rendered by Playwright to 1080x1350 PNG, plus contact sheet, ZIP, Arabic caption and hashtags. Static images only; never publishes.
---

# fmc-carousel

Project root `FMC-Carousel/`. Priorities: Arabic accuracy → medical credibility → visual quality → brand consistency → reliable export. **Static PNG only. No videos. Never publish.**

## Workflow (every topic)
1. **Research** the condition with reliable clinical sources (WebSearch if available: AAOS, NICE CKS, Cochrane, Mayo, NHS). If sources can't be reached, say so and rely on well-established guidance only. Never invent statistics.
2. **Write** Arabic MSA copy into `src/content/<slug>.json` (5 slides; a 6th only if the topic genuinely needs it — prevention, mistakes, warning signs).
3. **Proofread** (checklist below) and **medical review** (hedged claims, no guarantees, only approved FMC services).
4. **Design**: slide types in `templates/carousel/index.js`. Vary compositions: hook, explain (labelled diagram), cards, steps (timeline), advice (+FMC CTA). Illustrations: `src/components/illustrations.js` (`handNerve`, `wristCross`); for other anatomy add a correct vector function or use a licensed image from `assets/medical/` (no emojis as medical visuals).
5. **Render**: `node src/rendering/render.js src/content/<slug>.json` (`--only=2,3` to re-render; `--scale=2` for 2160×2700).
6. **Review**: open every PNG (Read tool) and read every Arabic word; compare with `output/source/<slug>/text-proof.txt`. Auto-QC covers: fonts loaded, exact size, safe area, margins, clipping, text overlap, **text ≥24px (phone readability)**, logo/illustration inside canvas. It does NOT catch pseudo-element overlaps or poor anatomy — look.
7. **Fix → re-render** until QC prints OK for all slides.
8. **Deliver**: `node src/rendering/contact-sheet.js <slug>` → `output/preview/contact-sheet.png`; write `output/caption-<slug>.md` (Arabic caption + AR/EN hashtags); `node src/rendering/pack.js <slug>` → `output/FMC-Carousel-<slug>.zip`. Tell the user nothing was published.

## Content JSON
`{ "slug","template":"carousel","style":"premium","title","slides":[…] }` — slide types: `hook` {tag,title,lead,chips[{icon,text}],illustration}; `explain` {tag,title,lead,illustration,labels[{text,x,y,lx,ly,tone}],note}; `cards` {tag,title,items[{icon,title,text,tone:""|"red"|"aqua"}],note}; `steps` {tag,title,items[{title,text,fmc}],note}; `advice` {tag,title,lead,items[],note,cta{title,text}}; `closing`. Markup: `*blue*`, `!!red!!`, `\n`.
Standard slide 5 = advice with `cta` (logo tile + «صحتك تستحق العناية» + مركز الفيصل الطبي) and footer slogan + disclaimer.

## Branding
- Name: مركز الفيصل الطبي · AL FAISAL MEDICAL CENTER. Slogan exactly: **Ideal Care – الرعاية المثالية** (footer, via `slogan()`).
- Logo: only `assets/logo/fmc-logo-trimmed.png` (from the supplied original `fmc-logo-original.webp`). Never redraw/recolour/stretch. If missing → ask the user to upload it.
- Palette from the logo: navy #0B2455, blue #2E5AB4, sky #8FB8E3, ice #EAF3FB, red #D7262E (accent/warnings). Turquoise #1FA8B8/#0E8FA3 as supporting accent (icon badges, highlights). White backgrounds, soft gradients, generous whitespace.
- Never add phone numbers, websites, QR codes, prices, doctor names unless the user asks. No fake testimonials.

## Approved FMC services (only these)
العلاج الطبيعي · طب العظام · الطب العام · التأهيل العصبي · علاج الإصابات الرياضية · إعادة التأهيل بعد العمليات الجراحية. Never invent departments, devices, procedures. A topic may discuss e.g. injections or surgery only as options a doctor decides, never as FMC offerings.

## Arabic typography
Real HTML text only; `<html lang="ar" dir="rtl">`; fonts embedded from `assets/fonts` (Cairo default, Tajawal, IBM Plex Sans Arabic). Titles 800 / lh 1.4, body 500 / lh 1.7; body ≥28px, nothing <24px. No letter-spacing on Arabic. LTR runs in `<bdi>`/`.ltr`. Arabic-Indic digits in numbered badges. Break headlines with `\n` at phrase boundaries.
Proofread: hamza forms, ة/ه, ى/ي, tanween on the letter before alif (ليلًا، غالبًا), punctuation `، ؛ ؟`, agreement, consistent terms (العصب المتوسط، النفق الرسغي، جبيرة الرسغ، العلاج الطبيعي), one address form (مفرد) throughout, short natural sentences.

## Medical content rules
Accurate, hedged (قد، غالبًا), patient-friendly, ≤ ~12 words per line item. No cure/guarantee claims, no individual diagnosis, no fear-mongering, no invented numbers. Always include when-to-see-a-doctor on symptom topics and the disclaimer «محتوى توعوي ولا يغني عن استشارة الطبيب».

## Slide structure
1 hook (short headline + large illustration) · 2 explain (diagram with HTML labels) · 3 symptoms/causes (icon cards) · 4 treatment (steps; FMC service badge only when relevant) · 5 advice + red flags + FMC branding/CTA · optional 6 extra value.
Layout: 1080×1350, 110px side margins, content ends y=1200, footer 130px, ≤4 items/slide.
