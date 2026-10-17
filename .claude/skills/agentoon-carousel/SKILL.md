---
name: agentoon-carousel
description: Build an Agentoon.ai Instagram carousel (7–9 static 1080×1350 PNG slides) from a topic. Researches official docs, writes slide copy, generates HTML/CSS/SVG, renders with Playwright, runs layout QA, and packages PNGs + editable source + contact sheet + ZIP + caption. Use for any Agentoon.ai carousel, AI/Claude Code/MCP/agent tutorial post, or "make a carousel about X".
argument-hint: <topic>
---

# Agentoon.ai carousel generator

Topic: `$ARGUMENTS`

Static images only. Never post or schedule anything — the user reviews first.

## Workflow

1. **Research.** Use official docs (WebFetch/WebSearch). Quote exact commands, flags, and limits. Never invent commands, features, versions, numbers, or outputs. If a claim cannot be verified, cut it or label it as an example.
2. **Plan 7–9 slides** (see structure). Short headlines, beginner-friendly, technically exact.
3. **Create** `carousels/<slug>/carousel.json` (start from `templates/carousel.example.json`).
4. **Build** `node .claude/skills/agentoon-carousel/scripts/build.mjs carousels/<slug>` → `source/index.html` (+ copies `base.css` and fonts so the folder is self-contained and editable).
5. **Render + QA** `node .claude/skills/agentoon-carousel/scripts/render.mjs carousels/<slug>` → `png/slide-NN.png`, `contact-sheet.png`. Exit code 1 means a QA error.
6. **Look at every PNG** (Read the images). QA cannot judge composition, awkward line breaks, empty space, or whether a diagram is accurate. Fix, rebuild, re-render until clean.
7. **Write `caption.md`**: SEO-friendly caption (hook line, 3–5 short value lines, CTA to save/share/follow @agentoon.ai) + 15–20 relevant hashtags.
8. **Package** `render.mjs <dir> --zip` → `<slug>.zip` (png, source, carousel.json, contact sheet, caption).

Playwright: resolved via Node (`require("playwright")`). Chromium falls back to `/opt/pw-browsers/chromium`.

## Slide structure (adapt when the topic needs fewer)

1 Hook · 2 Problem/opportunity · 3 Tool or concept · 4–6 Steps / code / prompts · 7 Result or takeaway · 8 Bonus, limits, or mistakes · 9 CTA (Save, Share, Follow @agentoon.ai).
Every slide must be worth saving. Add a "watch-out" line wherever a feature has a real limit.

## Layouts (`scripts/lib.mjs`)

| layout | fields |
|---|---|
| `hook` | kicker, big, title, sub, chips[] |
| `concept` | kicker, title, chips[], lede, code[] |
| `skill` | n, cmd, title, text, diagram, code[], tag, watch, flip, theme |
| `cheatsheet` | kicker, title, rows[{cmd,use,note}], source |
| `cta` | kicker, titleLines[], actions[{icon,t,d}], ask |
| `custom` | html (your own markup inside the slide shell) |

`theme`: `dark`, `paper`, `coral`, `mint`. Alternate themes for rhythm.
Text markup: `*accent italic*`, `` `inline mono` ``. Code markup: `{{c:/cmd}}` `{{f:--flag}}` `{{k:key/path}}` `{{s:string}}` `{{m:# comment}}` `{{p:>}}`.
Diagrams (`skill.diagram`) are SVG functions in `lib.mjs → diagrams` (`simplify`, `review`, `batch`, `loop`, `debug`). For a new topic add a new diagram function that shows the real mechanism — don't reuse unrelated ones. Need a one-off composition? Use `custom`.
Icons/mascot live in `assets/sprite.svg` (`#mascot`, `#i-*`). Reuse via `icon("name")` / `mascot(width)`.

## Design rules (see `reference/design-system.md`)

- Canvas 1080×1350. Margins 72px; footer reserved at the bottom (brand · page · @agentoon.ai).
- Fraunces (bold + italic accent word) for headlines, Inter for body, JetBrains Mono for code/labels. All text stays real text.
- Minimum font size 24px (labels/footer only); body ≥ 28px; headlines ≥ 56px.
- Vary composition: different diagram, theme, and block order per slide. No identical templates.
- One idea per slide. Generous whitespace. Original robot mascot only — never copy another creator's artwork or layouts.

## QA checklist (automated in `render.mjs`, then verify by eye)

No text outside safe margins · no text touching the footer · no clipped/overflowing code, cards, pills · stacked blocks don't overlap · SVG text inside its viewBox · fonts loaded · nothing under 24px. By eye: phone-size legibility (view `contact-sheet.png`), headline line breaks, balance of empty space, facts match sources.
