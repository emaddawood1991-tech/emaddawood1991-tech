---
name: agentoon-carousel
description: Build an Agentoon.ai Instagram carousel (7–9 static 1080×1350 PNG slides) from a topic. Researches official docs, writes slide copy, generates HTML/CSS/SVG, renders with Playwright, runs layout QA, and packages PNGs + editable source + contact sheet + ZIP + caption. Use for any Agentoon.ai carousel, AI/Claude Code/MCP/agent tutorial post, or "make a carousel about X".
argument-hint: <topic>
---

# Agentoon.ai carousel generator

Topic: `$ARGUMENTS`

Static images only. Never post or schedule anything — the user reviews first.

## Workflow

1. **Research.** Fetch the *current* official docs (WebFetch/WebSearch) for every command, flag, and limit. Compare with `reference/verified-claude-code-commands.md` (dated). Never invent commands, features, versions, numbers, or outputs; never call wording "official" unless it is copied from the docs. Cut or label anything unverified.
2. **Classify every command** as built-in command, bundled skill, custom skill, plugin skill, or MCP prompt, and note anything that needs extra setup (git, login, CLI, plugin install). Show the type on the slide (badge) and on the cheat sheet.
3. **Plan 7–9 slides** (see structure). Short headlines, beginner-friendly, technically exact. Write the hook as one clear promise plus a visual proof (e.g. a terminal with the real commands).
4. **Create** `carousels/<slug>/carousel.json` (start from `templates/carousel.example.json`).
5. **Build** `node .claude/skills/agentoon-carousel/scripts/build.mjs carousels/<slug>` → `source/index.html` (+ copies `base.css` and fonts so the folder is self-contained and editable).
6. **Render + quality gate** `node .claude/skills/agentoon-carousel/scripts/render.mjs carousels/<slug>` → `png/slide-NN.png`, `contact-sheet.png`, `mobile-preview.png` (390px phone scale), `qa-report.md`. Exit 1 = failed gate; fix and re-run until it passes. Needs `pip install pyspellchecker` for the spelling step.
7. **Look at every PNG and `mobile-preview.png`** (Read the images) and complete the manual list in `reference/quality-checklist.md`. The gate cannot judge composition, wraps, empty space, or whether a diagram is accurate.
8. **Write `caption.md`**: SEO caption (hook line, 3–5 value lines, accurate caveats, CTA to save/share/follow @agentoon.ai), 15–20 hashtags, alt text, sources.
9. **Package** `render.mjs <dir> --zip` → `<slug>.zip` (png, source, carousel.json, contact sheet, mobile preview, QA report, caption).

Playwright: resolved via Node (`require("playwright")`). Chromium falls back to `/opt/pw-browsers/chromium`.

## Slide structure (adapt when the topic needs fewer)

1 Hook · 2 Problem/opportunity · 3 Tool or concept · 4–6 Steps / code / prompts · 7 Result or takeaway · 8 Bonus, limits, or mistakes · 9 CTA (Save, Share, Follow @agentoon.ai).
Every slide must be worth saving. Add a "watch-out" line wherever a feature has a real limit.

## Layouts (`scripts/lib.mjs`)

| layout | fields |
|---|---|
| `hook` | kicker, title, rows[{cmd,verb}], bubble, swipe, save |
| `concept` | kicker, title, lede, rows[{badge,ex,text,hot?,ghost?}] (the kinds of slash command) |
| `skill` | n, cmd, badge?, mood, title, text, diagram, code[], tag, watch, flip, theme |
| `cheatsheet` | kicker, title, badge, badgeNote, rows[{cmd,use,note}], legendTag, legend[] |
| `cta` | kicker, titleLines[], followLabel, handle, followSub, followBtn, actions[{icon,t,d}], ask |
| `custom` | html (your own markup inside the slide shell) |

`theme`: `dark`, `paper`, `coral`, `mint`. Alternate themes for rhythm.
Text markup: `*accent italic*`, `` `inline mono` ``. Code markup: `{{c:/cmd}}` `{{f:--flag}}` `{{k:key/path}}` `{{s:string}}` `{{m:# comment}}` `{{p:>}}`.
Diagrams (`skill.diagram`) are SVG functions in `lib.mjs → diagrams` (`simplify`, `review`, `batch`, `loop`, `debug`). For a new topic add a diagram that shows the real mechanism, with diagram text ≥ 28px. Need a one-off composition? Use `custom`.
Mascot: `mascot(width, mood)` — moods `happy wow think wink focus cheer dizzy oops proud` in `assets/sprite.svg`. Pick the mood that matches the slide; keep it ≥ 110px so the expression reads on a phone. Icons: `icon("name")`.

## Design rules (see `reference/design-system.md`)

- Canvas 1080×1350. Content padding 72px; footer reserved at the bottom (brand · page · @agentoon.ai).
- Fraunces (bold + one italic accent word) for headlines, Inter for body, JetBrains Mono for code/labels. All text stays real text.
- Minimum sizes: label 26px · body 30px · code 32px · diagram text 28px · headlines ≥ 56px. Test at phone scale.
- Accent *text* uses `--accent-t` (never raw coral on paper). Text on accent fills uses `--on-accent`. Contrast ≥ 4.5:1.
- Vary composition: different diagram, theme, and block order per slide, but keep type, badges, footer, and grid identical.
- One idea per slide. Generous whitespace. Original robot mascot only. Never copy another creator's artwork or layouts.
- The last slide makes **Follow @agentoon.ai** the largest element; Save/Share are secondary.

## Quality gate

Automated in `render.mjs` (see `reference/quality-checklist.md`): sizes, contrast, margins, alignment, overflow, overlap, footer gap, mascot clearance, spelling, fonts. Then review every image by eye, including `mobile-preview.png`. Do not deliver while the gate fails.
