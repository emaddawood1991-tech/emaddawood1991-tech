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

`png/slide-NN.png` (1080×1350, 7–9 slides, identical size) · `contact-sheet.png` · `mobile-preview.png` · `safe-area-check.png` (4:5) · `preview-1x1-crop.png` · `sources.md` (fact-check log) · `verified-links.md` (tool/repo carousels: verified URLs + install commands) · `source/` + `carousel.json` (+ `extras.mjs` if bespoke) · `qa-report.md` · `caption.md` · `<slug>.zip`. `render.mjs --zip` refuses to package without a valid `caption.md`.

## Workflow

0. `bash SKILL/scripts/setup.sh` — checks Node, Playwright, zip, pyspellchecker (installs the last one). If it prints NOT READY, fix what it says (usually `npm i -g playwright && npx playwright install chromium`).
1. **Research** the topic in official docs/sources. For third-party products (connectors, plugins, tools) read *their* current docs and the host platform's docs; record every claim, its basis and status in `carousels/<slug>/sources.md`. If the user references a video, file or page you cannot open, say so, ask them to provide it, and never claim you inspected it; record "NOT inspected" in `sources.md`. If an official site cannot be fetched, say so, use only what you can verify, qualify the rest on the slide ("depends on your plan", "available metrics"), and never invent menus, plans, metrics or prices. Mark mock-up numbers "Demo data". Never promise results (growth, revenue) and never imply access to data without an authorized connection. Use WebFetch/WebSearch. Quote exact commands, names, limits. Never invent features, numbers, versions, or outputs; cut or label anything unverified. For Claude Code topics also read `SKILL/reference/verified-claude-code-commands.md` and re-check it against current docs.
2. **Classify and caveat**: say what each tool/command *is* (built-in, bundled, custom, plugin, MCP, paid, beta) and what extra setup it needs. Put that on the slide.
3. **Scaffold** `node SKILL/scripts/new.mjs "<topic>"` → `carousels/<slug>/carousel.json` from a layout recipe that differs from your earlier carousels (`how-to`, `explainer`, `toolkit`, `workflow`; override with `--recipe`).
4. **Write the content**: replace every `TODO`. Short headlines, one idea per slide, beginner-friendly but exact. Hook = one clear promise + visual proof. Slide order: hook → problem/opportunity → concept → 3 practical slides (steps / code / prompts) → result or takeaway → bonus/limits/mistakes → CTA (Save, Share, Follow @agentoon.ai).
5. **Make it fresh** (see Variation rules): change diagram types and moods to fit the topic, and draw at least one bespoke illustration in `carousels/<slug>/extras.mjs`.
6. **Build** `node SKILL/scripts/build.mjs carousels/<slug>`
7. **Render + quality gate** `node SKILL/scripts/render.mjs carousels/<slug>` → PNGs, contact sheet, phone preview, `qa-report.md`. Exit 1 = fix and re-run until it passes. Lines starting with `!` are advisories (e.g. 240px+ of dead space): fix them too by adding a point/step, a 3rd compare item, a taller illustration, or a different layout.
8. **Look at every PNG and `mobile-preview.png`** (Read the images) and complete the manual list in `SKILL/reference/quality-checklist.md`. Fix, rebuild, re-render.
9. **Write `caption.md`** (format below).
10. **Package** `node SKILL/scripts/render.mjs carousels/<slug> --zip`, then give the user: the contact sheet, the phone preview, the ZIP path, the caption, and a short note on anything unverified or version-dependent.

## Instagram safe area + crop checks (automatic, enforced)

Instagram's editor and grid can cover or crop the edges of a 4:5 image. Every slide keeps essential content (text, logos, mascot, diagrams, cards, CTA, **footer and slide number**) inside a conservative safe area: **top ≥ 100px, bottom ≥ 180px (everything sits above y = 1170), left/right ≥ 70px**. The canvas stays exactly 1080×1350 (4:5) on every slide.
- `assets/base.css` defines it: `--safe-top 100`, `--safe-bottom 180`, `--safe-x 70`; content starts at `--pad-top 106`, ends at `--pad-bottom 284`, the footer sits on the bottom boundary. **Content height is ~960px**: plan copy, diagram heights and prompt cards for that, not for 1350.
- Header mascots use `right:var(--safe-x);top:var(--mascot-top)` (138px, below the 1:1 crop line). Bespoke layouts must do the same and never use negative margins that leave the safe area.
- If a slide overflows, **reflow, don't shrink the canvas or scale the slide**: tighten paddings/gaps, drop a title size by 4–8px, use per-slide overrides (`titleSize`, `promptSize`, `watchSize`, `watchPad`, `rowPad`, `codeSize`, `illMargin`), shorten diagram geometry, or change layout. Never go below the minimum font sizes; don't delete required content.
- `render.mjs` fails on any text, card, pill, code box, callout, diagram, mascot or footer outside the safe area, and on any PNG that is not exactly 1080×1350 (read from the PNG header; all slides must match).
- **Previews:** `safe-area-check.png` (4:5, unsafe zones shaded red) · `preview-1x1-crop.png` (simulated 1:1 centre crop: top and bottom 135px removed) · `mobile-preview.png` (390px phone scale) · `contact-sheet.png`. Look at all of them.
- **1:1 crop report:** the gate lists what a 1:1 centre crop would clip (advisory `ℹ` lines + a section in `qa-report.md`). With a 100px top margin the small kicker label sits inside that 135px band by design; titles, prompts, diagrams, CTA and footer must survive it.
- **Never claim margins fix a wrong aspect ratio.** They only reduce clipping risk. If Instagram's editor offers a crop control, tell the user to keep the original 4:5 (not 1:1). Say this in the hand-off when showing the crop preview.
- Older carousels built before these rules can be reproduced with `"legacyMargins": true` in `carousel.json`; never use it for new posts.

## Real screenshots / third-party visuals

- If the topic is about real software, **use real screenshots, never drawn fake UI**. Put downloaded files in `carousels/<slug>/assets/` (JPEG, ≤1800px wide); `build.mjs` copies them to `source/assets/media/`. Show them in a window frame, crop **insets** from the same image (fractions of the source) and label them; keep a record of every image URL + licence/credit in `sources.md`.
- Take images only from official sources (project README/docs); download the image file only, never install or run the software. If the official website is unreachable (DNS/proxy), say so, use the official GitHub README images, and do not claim the site was inspected.
- Label conceptual mock-ups "Concept mock-up"; never present them as real. Tools still alpha/beta must be called that, with the project's own status wording. Don't call early software a full replacement.
- Per-app slide pattern (see `carousels/artcraft-adobe-alternatives/extras.mjs`: `collage`, `appShot`, `moreTools`, `toolkit`): compare row (old tool → alternative), window + zoom inset, 3 check bullets, status chip + short URL. Pills/chips need ≥30px and `white-space:nowrap`; window-bar labels use class `src` (26px).

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
| `diagram` | kicker, title, titleSize?, text, mood, diagram (name \| spec), points[], tag?, watch — full-slide illustration |
| `prompt` | kicker \| n+of, title, why?, prompt (with `[placeholders]`), promptStyle terminal\|note\|chat, chatWith?, ill (name \| spec), order?, tag?/watch?, banner?, titleSize/promptSize/watchSize/watchPad — copy-paste prompt + illustration |
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

Bespoke: create `carousels/<slug>/extras.mjs` (the build passes you the kit, so no import paths). It may export `diagrams` (SVG), `ills` (named HTML/SVG illustrations usable as `diagram`/`ill`), `layouts` (whole custom slide layouts built with `shell`, `mascot`, `icon`…) and `css`:

```js
export default ({ T, line, arrowhead, MUTED, ACC, ONA }) => ({
  diagrams: { myMechanism: () => `<svg viewBox="0 0 936 360" width="936" height="360">${arrowhead}…</svg>` },
  css: ``, // optional extra CSS
});
```
Then use `"diagram": "myMechanism"`. SVG rules: 936px wide, text ≥ 28px, theme vars only (`var(--fg) --muted --accent --accent-t --on-accent --card --line`), kit helpers `T(x,y,text,{s,w,c,a,f})`, `line(x1,y1,x2,y2)`, `arrowhead`, plus `icon`, `mascot`, `esc`, `fmt`.

Brand marks (Instagram, ChatGPT, …): draw clearly simplified glyphs, label them in the hand-off, and let users drop official SVGs into `carousels/<slug>/brand/` (an extras helper can inline them). Never imply endorsement.

Mascot: `mascot(width, mood)`; icons: `icon("bolt")` (see `assets/sprite.svg`: arrow bookmark send plus check x branch refresh bug spark shield layers folder file follow star clock code bolt).

## Design + quality (details in `reference/design-system.md`, `reference/quality-checklist.md`)

- 1080×1350 · Instagram safe area (100px top, 180px bottom, 70px sides) · footer inside it. Min sizes: label 26, body 30, code 32, diagram text 28, headlines ≥ 56 (px). Contrast ≥ 4.5:1 using `--accent-t` for accent text and `--on-accent` on accent fills.
- Gate (automatic, exit 1 on failure; 1:1 crop notes are informational): safe area, canvas size, sizes, contrast, margins, alignment, overflow, overlap, footer gap, mascot clearance, TODO leftovers, spelling (add legit product/tech words to `"spellAllow": [...]` in carousel.json), fonts. Then eyes on every image.
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
