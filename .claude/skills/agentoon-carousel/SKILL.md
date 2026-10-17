---
name: agentoon-carousel
description: Build a complete Agentoon.ai Instagram carousel from any AI topic, e.g. `/agentoon-carousel How MCP servers work`. Researches official docs, writes the slides, designs fresh layouts and illustrations for that topic, renders 7–9 static 1080×1350 PNGs with Playwright, runs a quality gate (mobile size, contrast, overflow, spelling), and delivers PNGs + contact sheet + editable source + ZIP + SEO caption. Use for any Agentoon.ai carousel, or "make a carousel about X".
argument-hint: <topic>
allowed-tools:
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/*)
  - Bash(bash ${CLAUDE_SKILL_DIR}/scripts/*)
---

# Agentoon.ai carousel generator

**Topic:** `$ARGUMENTS`  (if empty, ask the user for the topic in one short question, then continue)

Static images only. Never post, schedule, or upload anything. The user reviews first.
`SKILL` = `${CLAUDE_SKILL_DIR}` (if that text appears unexpanded, find the folder with `ls -d ~/.claude/skills/agentoon-carousel .claude/skills/agentoon-carousel`).
Output goes to `./carousels/<slug>/` in the current project. Never overwrite or delete an existing carousel.

## Always deliver (all of it, every time)

`png/slide-NN.png` (1080×1350, 7–9 slides) · `contact-sheet.png` · `mobile-preview.png` · `source/` + `carousel.json` (+ `extras.mjs` if bespoke) · `qa-report.md` · `caption.md` · `<slug>.zip`. `render.mjs --zip` refuses to package without a valid `caption.md`.

## Workflow

0. `bash SKILL/scripts/setup.sh` — checks Node, Playwright, zip, pyspellchecker (installs the last one). If it prints NOT READY, fix what it says (usually `npm i -g playwright && npx playwright install chromium`).
1. **Research** the topic in official docs/sources (WebFetch/WebSearch). Quote exact commands, names, limits. Never invent features, numbers, versions, or outputs; cut or label anything unverified. For Claude Code topics also read `SKILL/reference/verified-claude-code-commands.md` and re-check it against current docs.
2. **Classify and caveat**: say what each tool/command *is* (built-in, bundled, custom, plugin, MCP, paid, beta) and what extra setup it needs. Put that on the slide.
3. **Scaffold** `node SKILL/scripts/new.mjs "<topic>"` → `carousels/<slug>/carousel.json` from a layout recipe that differs from your earlier carousels (`how-to`, `explainer`, `toolkit`, `workflow`; override with `--recipe`).
4. **Write the content**: replace every `TODO`. Short headlines, one idea per slide, beginner-friendly but exact. Hook = one clear promise + visual proof. Slide order: hook → problem/opportunity → concept → 3 practical slides (steps / code / prompts) → result or takeaway → bonus/limits/mistakes → CTA (Save, Share, Follow @agentoon.ai).
5. **Make it fresh** (see Variation rules): change diagram types and moods to fit the topic, and draw at least one bespoke illustration in `carousels/<slug>/extras.mjs`.
6. **Build** `node SKILL/scripts/build.mjs carousels/<slug>`
7. **Render + quality gate** `node SKILL/scripts/render.mjs carousels/<slug>` → PNGs, contact sheet, phone preview, `qa-report.md`. Exit 1 = fix and re-run until it passes. Lines starting with `!` are advisories (e.g. 240px+ of dead space): fix them too by adding a point/step, a 3rd compare item, a taller illustration, or a different layout.
8. **Look at every PNG and `mobile-preview.png`** (Read the images) and complete the manual list in `SKILL/reference/quality-checklist.md`. Fix, rebuild, re-render.
9. **Write `caption.md`** (format below).
10. **Package** `node SKILL/scripts/render.mjs carousels/<slug> --zip`, then give the user: the contact sheet, the phone preview, the ZIP path, the caption, and a short note on anything unverified or version-dependent.

## Variation rules (same brand, different look every time)

Brand stays fixed: palette, Fraunces/Inter/JetBrains Mono, footer, mascot, 72px grid, badges, type scale, QA thresholds. What must change per topic:
- **Layout sequence**: never reuse the previous carousel's sequence (`new.mjs` avoids it). Mix at least 4 different layouts, alternate `dark / paper / mint / coral` themes, vary the hook (`hook` terminal vs `statement`).
- **Illustrations**: use ≥ 2 different generic diagram types, and make one slide's illustration bespoke to the topic's core mechanism (e.g. a context-window bar for "context engineering", a request/response sequence for "MCP"). Never reuse another carousel's diagram for a different idea.
- **Mascot mood** per slide: `happy wow think wink focus cheer dizzy oops proud`.
- Different step/code/compare/stat structures instead of repeating one template.

### Layouts (`scripts/lib.mjs`, `scripts/layouts-extra.mjs`)

| layout | fields |
|---|---|
| `hook` | kicker, title, rows[{cmd,verb}], bubble, swipe, save — terminal-style hook |
| `statement` | kicker, title, sub, chips[], swipe, save, mood, mascotSize — big-claim hook / problem / myth |
| `concept` | kicker, title, label, lede, rows[{badge,ex,text,hot?,ghost?}], banner?, rowPad? (roomier rows) — kinds / categories |
| `diagram` | kicker, title, text, mood, diagram, points[], watch — full-slide illustration |
| `steps` | kicker, title, mood, steps[{title,text,code?}] (3–4), watch |
| `codefocus` | kicker, title, text, code[], notes[], watch — big code or prompt with numbered notes |
| `compare` | kicker, title, left{label,items[]}, right{label,items[]}, tag?, watch?, verdict — before/after, myth/fact, do/don't |
| `checklist` | kicker, title, items[{t,d,ok?}], note — mistakes (ok:false), tips, requirements |
| `stat` | kicker, title, value, label, text, source — one sourced number |
| `skill` | n, cmd, badge, mood, title, text, diagram, code[], tag, watch — one command/tool per slide |
| `cheatsheet` | kicker, title, badge, badgeNote, rows[{cmd,use,note}], legendTag, legend[] |
| `cta` | kicker, titleLines[], followLabel, handle, followSub, followBtn, actions[], ask — Follow @agentoon.ai is the hero |
| `custom` | html — your own markup in the slide shell |

Every layout accepts `theme` (`dark|paper|coral|mint`). Markup: `*accent italic*`, `` `inline mono` ``; code: `{{c:/cmd}} {{f:--flag}} {{k:key}} {{s:str}} {{m:# comment}} {{p:>}}`.

### Illustrations

Generic, JSON-driven (`"diagram": {"type": …}`): `flow` · `fanout` · `ladder` · `cycle` · `timeline` · `stack` · `grid` · `bars` · `versus` (see `scripts/diagrams-generic.mjs`; `|` = line break in labels). Named diagrams from the Claude Code example: `simplify`, `review`, `batch`, `loop`, `debug`.

Bespoke: create `carousels/<slug>/extras.mjs` (the build passes you the kit, so no import paths):

```js
export default ({ T, line, arrowhead, MUTED, ACC, ONA }) => ({
  diagrams: { myMechanism: () => `<svg viewBox="0 0 936 360" width="936" height="360">${arrowhead}…</svg>` },
  css: ``, // optional extra CSS
});
```
Then use `"diagram": "myMechanism"`. SVG rules: 936px wide, text ≥ 28px, theme vars only (`var(--fg) --muted --accent --accent-t --on-accent --card --line`), kit helpers `T(x,y,text,{s,w,c,a,f})`, `line(x1,y1,x2,y2)`, `arrowhead`, plus `icon`, `mascot`, `esc`, `fmt`.

Mascot: `mascot(width, mood)`; icons: `icon("bolt")` (see `assets/sprite.svg`: arrow bookmark send plus check x branch refresh bug spark shield layers folder file follow star clock code bolt).

## Design + quality (details in `reference/design-system.md`, `reference/quality-checklist.md`)

- 1080×1350 · padding 72 · footer reserved. Min sizes: label 26, body 30, code 32, diagram text 28, headlines ≥ 56 (px). Contrast ≥ 4.5:1 using `--accent-t` for accent text and `--on-accent` on accent fills.
- Gate (automatic, exit 1 on failure): sizes, contrast, margins, alignment, overflow, overlap, footer gap, mascot clearance, TODO leftovers, spelling (add legit product/tech words to `"spellAllow": [...]` in carousel.json), fonts. Then eyes on every image.
- Never copy another creator's artwork or layouts. Original robot mascot only.

## caption.md format

```
# Instagram caption — <title>
## Caption (copy-paste)
<hook line + emoji>
<3–5 value lines, one per tool/step, exact names>
Good to know: <accurate caveats, requirements, version notes>
💾 Save · 📤 Share · ➕ Follow @agentoon.ai for <niche>
<question that invites a comment>
Source: <official pages, date checked>
## Hashtags
<15–20, mix of broad + niche>
## Alt text
<one sentence per slide group>
```

## Install (personal, all projects)

`bash SKILL/scripts/install-personal.sh` copies this folder to `~/.claude/skills/agentoon-carousel` (add `--link` to symlink). Personal skills load in every project on that machine (not in cloud sessions, which only read the repo's `.claude/skills/`).
