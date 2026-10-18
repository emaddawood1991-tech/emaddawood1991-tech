---
name: fmc-medical-carousel
description: Create premium Arabic (RTL) Instagram posts, educational carousels, awareness-day posts, infographics and comparisons for Al Faisal Medical Centre (FMC / مركز الفيصل الطبي), Al Ain, UAE. Arabic is rendered as real HTML text (never AI-generated in images), exported to 1080x1350 PNG with Playwright, with Arabic proofreading, medical review and QC. Use for any FMC Instagram/social medical-content request.
---

# FMC Medical Carousel

Project root: `FMC-Design-System/` (run all commands from there). Arabic is the primary language. Priorities: **Arabic accuracy → medical credibility → visual quality → brand consistency → reliable export.**

## Hard rules
1. **Never** put Arabic text inside AI-generated images or inside SVG illustrations. Arabic is HTML/CSS text only (labels are HTML overlays — see `illustrations.labels()`).
2. Use only the original FMC logo from `assets/logo/` (never redraw/recolour/stretch). If missing → ask the user.
3. Only the 6 approved services may be presented as FMC services (see `references/medical-content.md`). Never invent doctors, prices, phone numbers, QR codes, testimonials, statistics, outcomes.
4. Never publish. Deliver PNGs + source + caption + hashtags for the user to review.
5. Do not claim text is error-free without inspecting the rendered PNGs.

## Workflow (run every time)
1. **Understand**: topic, audience, format (template A–E), slide count, goal. Ask one concise question only if essential info is missing.
2. **Write Arabic content** in `src/content/<slug>.json` (schema below). Plain MSA, short sentences, patient-friendly.
3. **Medical review** against `references/medical-content.md` — hedge ("قد", "غالبًا"), no cure/guarantee claims, no unconfirmed FMC services, flag uncertain items to the user.
4. **Arabic proofread** with `references/arabic-typography.md` checklist (spelling, grammar, tanween placement, punctuation `، ؛ ؟`, terminology consistency).
5. **Pick template + style** (`references/design-system.md`). Vary composition across a series.
6. **Render**: `node src/rendering/render.js src/content/<slug>.json [--style=premium|modern3d|infographic|editorial|awareness] [--only=1,3] [--scale=2]`
   Waits for fonts/images, screenshots exactly 1080×1350, verifies PNG size, and runs automatic QC (overflow, safe area, side margins, text-on-text overlap). Exit code 2 = QC problem.
7. **Inspect every PNG** with the Read tool. Check each Arabic word, line wrapping, clipped letters, punctuation, logo, margins, hierarchy, anatomy. `output/source/<slug>/text-proof.txt` holds the extracted text for a proofreading pass. Automatic QC does **not** catch pseudo-element overlaps or poor anatomy — look at the images.
8. **Fix & re-render** affected slides (`--only=`).
9. **Deliver**: `output/png/<slug>/slide-N.png`, `output/source/<slug>/slide-N.html` (editable), Arabic caption + hashtags (`output/caption-<slug>.md`). Ask before publishing anything.

## Content JSON
```json
{ "slug": "my-topic", "template": "medical-carousel", "style": "premium", "title": "…",
  "slides": [ { "type": "hook|explain|cards|advice|closing", … } ] }
```
Inline markup: `*word*` = blue accent, `!!word!!` = red accent, `\n` = line break. Everything else is HTML-escaped.

| Template (`templates/…`) | Slide types / fields |
|---|---|
| `medical-carousel` (B) | `hook` {tag,title,lead,chips[{icon,text}],illustration}; `explain` {tag,title,lead,illustration,labels[{text,x,y,lx,ly,tone}],note}; `cards` {tag,title,items[{icon,title,text,tone}],numbered,note,warn}; `advice` {tag,title,lead,items[],note,cta{title,text}}; `closing` {title,lead} |
| `single-post` (A) | {tag,title,lead,icon or illustration} |
| `health-awareness` (C) | {day,date,icon,title,lead,fmc} |
| `medical-infographic` (D) | {tag,title,lead,items[{icon,title,text,tone}] (≤6),note} |
| `medical-comparison` (E) | {tag,title,a{icon,title},b{icon,title},rows[[label,a,b]] (≤3),note} |

Icons: see `src/components/icons.js` (`iconNames`). Illustrations: `handNerve`, `wristCross` (vector, in `src/components/illustrations.js`). For a new anatomy topic add a vector function there, or supply a licensed/own image in `assets/medical-images/` (use it as CSS `background-image` with class `.photo`). Never claim an illustration was AI-generated unless a generation tool actually produced it; never use un-licensed images.

## Best-practice reminders
- Slide fits: ≤4 cards per slide, headline ≤3 lines, body ≤2 lines per card. Safe area: 110 px sides, content ends at y=1200 (footer 130 px).
- Slogan is rendered `Ideal Care – الرعاية المثالية` (LTR container, Arabic run isolated). Don't edit by hand.
- Last carousel slide: include logo/CTA (`advice.cta` or `closing`) + disclaimer footer (`more:false`).
- Series: change `bg` variants / styles to avoid identical compositions.

Reference files: `references/brand-guidelines.md`, `references/arabic-typography.md`, `references/medical-content.md`, `references/design-system.md`.
