---
name: agentoon-ui
description: >-
  Real software tutorial animation for Agentoon.ai: authentic screen recordings or captures, cursor tracking, click highlights, smart zooms, UI focus transitions, browser/laptop framing, terminal and code-line emphasis, mobile readability. Use whenever a video shows a website, app, settings screen, terminal, repo or file. Never fabricates software output.
argument-hint: <tool, site or workflow to demonstrate>
allowed-tools: Read Edit Write Grep Glob Bash
---

# /agentoon-ui

Viewers trust the video only if every screen is real. Read `.claude/skills/agentoon-video-producer/references/{real-demo-standard,official-sources-and-real-assets,mobile-readability}.md` first; this skill adds the animation craft.

## 1. Get real material before designing (in this order)
1. Run it for real (CLI, local app, `git clone` of the repo, local test app) and keep the verbatim output in `data/`.
2. Capture real pages with Playwright (`NODE_PATH=$(npm root -g) node capture.js`; phone-size viewport 540x960 at deviceScaleFactor 2; pattern: `episodes/14-bland-claude-mcp/capture_bland.js`). The cloud sandbox allows only some hosts (check with `curl`); a blocked host means **no capture**: record it in `data/OFFICIAL-SOURCES.md` under MUST RECORD.
3. Read official docs through any connected MCP (`get_*_doc`) or `curl` and show the text verbatim, labelled with its source (`FROM THE BLAND DOCS`), never as if it were a screenshot of the site.
4. Owner screen recordings (ask for exact shots; give a numbered shot list).
If none of these exists for a step, show an honest label card (`NOT RECORDED YET`) or a labelled concept diagram. **Never mock up a website or app and present it as real.**

## 2. Label vocabulary (>= 28 px chip, visible >= 1.5 s)
`VERBATIM` · `FROM THE README` · `REAL FILE FROM THE REPO · NOT RUN` · `REAL RESULT · <system>` · `RUN IN THIS SESSION` · `PROJECT PHOTOS · NOT MY TV` · `CONCEPT VISUAL · NOT A REAL CALL` · `DIAGRAM · NOT A SCREENSHOT` · `NOT RECORDED YET`.

## 3. Animation craft
- **Browser/laptop framing:** `kit/snippets/laptop-screen.js` (real content inside a laptop with purposeful zoom toward the screen) or a bezel div (`episodes/13` `.bezel`). Content fills the frame at phone size: crop to the narrated region, do not shrink a desktop page.
- **Smart zoom:** scale 1.15-1.3 anchored at the card's top (`zoomTo(cam, 540, cardTop, s, at, 0.7)`) so headers stay visible; release after the line is read.
- **Highlight / focus ring:** one SVG rect (`mkRing`) hopping with `attr` tweens to each narrated line/row; stroke 6, white on dark, navy on light.
- **Cursor and clicks:** an SVG pointer moved with transforms along eased paths; click = 0.12 s scale to 0.86 + an expanding ring that fades (one ring, no loops); sync a `tick` SFX (`/agentoon-audio`). Only for clicks that happen in the real recording.
- **Terminal / code:** `Term.card/type` (`kit/term.js`) or `clip-path inset(0 100% 0 0) -> 0` with `steps(n)`; lines >= 32 px mono; highlight the exact line with a tinted bar + ring. Verbatim text only; shell-wrap long commands with `\` and say "wrapped for the screen".
- **UI focus transition:** dim the rest (`opacity .35`) and lift the focused card (`scale 1.04`) for the narrated detail.
- **Verification evidence:** if a connector/tool really ran, show the **actual result** with private data hidden (counts, status) and label it `REAL RESULT`.

## 4. Mobile readability gate
Command text readable at 360 px width; no captions over code (move the card or the caption band); run `bash .claude/skills/agentoon-video-producer/scripts/mobile-check.sh` and review the phone-size sheet.

## Do not
Invent terminal output, connector states, stars/stats, TV or device compatibility, success messages, or incoming-call evidence; show keys, tokens, phone numbers, emails or org names; imply a test ran if it did not.
