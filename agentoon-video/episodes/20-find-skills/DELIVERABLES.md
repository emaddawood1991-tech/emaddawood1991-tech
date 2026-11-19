# Episode 20 — Find Skills (Vercel Labs) — PREVIEW package

Status: **PREVIEW** (not the final export; waiting for approval). Engine: **Remotion** (composition `FindSkills`, `agentoon-video/remotion-fx/src/nine/FindSkills.tsx`). Output `agentoon-video/remotion-fx/out/FIND-SKILLS-PREVIEW.mp4` (1080×1920, 30 fps, ≈93 s).

## 1. Source links (all opened/fetched on 2026-11-19; raw copies in `data/raw/`)
| What | URL |
|---|---|
| Directory | https://skills.sh (leaderboard "All Time (1,455,781)", #1 = find-skills, 4.4M installs) |
| Docs | https://skills.sh/docs , https://skills.sh/docs/cli |
| CLI repository | https://github.com/vercel-labs/skills (npm package `skills` 1.9.0, MIT) |
| find-skills instructions | https://github.com/vercel-labs/skills/blob/main/skills/find-skills/SKILL.md |
| Skill shown in the inspect scene | https://skills.sh/remotion-dev/skills/remotion-best-practices (863.0K installs, 7.5K GitHub stars, audits: Gen Agent Trust Hub Pass, Socket Pass, **Snyk Fail**) |
| Its source | https://github.com/remotion-dev/skills/blob/main/skills/remotion-best-practices/SKILL.md (raw text shown; 114-line plain-Markdown router that links to other Markdown files) |

## 2. Commands shown in the video (all executed for real; outputs captured in `data/term/*.jsonl`)
```
npx skills add vercel-labs/skills --skill find-skills -a claude-code -y     # -a/-y added only to skip prompts in the recording
npx skills find remotion
npx skills find motion graphics
npx skills find video editing
npx skills add https://github.com/remotion-dev/skills --skill remotion-best-practices   # install command shown on its skills.sh page (NOT executed in the video)
```
Syntax verified against the README of package `skills@1.9.0` and by running it (`add <owner/repo> --skill <name> -a <agent>`, `find [query]`). Result of the install: `./.claude/skills/find-skills/SKILL.md` (verified on disk). Telemetry was disabled for the recordings (`DISABLE_TELEMETRY=1`).

## 3. Honest notes (what is real and what is not)
* Real: skills.sh recording (Playwright, real site), the terminal sessions (real pty captures replayed frame-exact, idle waits shortened), the search results, the SKILL.md text, the directory total.
* The Claude Code app window itself was **not** recorded (no interactive Claude Code session was allowed here); the terminal shown is the real shell session running the real `npx skills` CLI. The video says "REAL TERMINAL SESSION".
* github.com pages render unstyled in this sandbox, so the source is shown as the raw SKILL.md text instead of a GitHub page screenshot.
* Environment note: Node's `fetch` ignores the sandbox proxy, so `npx skills find` printed "No skills found" until `NODE_USE_ENV_PROXY=1` was set; the video shows the real results.
* The "example" scene uses **our own** tested Remotion components (D05, D07, D01, D06). The finder does not create them; the video says so on screen and in the narration.
* The CLI search and the skills.sh search API return the same index but a slightly different order; the cards use the API order, the terminal shows the CLI output.
* Not claimed: that installing find-skills installs other skills (narration says it does not); Snyk "Fail" audit is shown, not hidden.
* No third-party skill was installed other than find-skills (instruction-only Markdown, reviewed before install). The `skills` npm package (1.9.0) has no preinstall/postinstall script (only dev/build scripts); dependencies: `nostics`, `tar`, `yaml`.
* Robot: the approved 2D SVG rig (no Blender robot asset exists in this repo); lip-sync from the loudness envelope of the real narration.

## 4. Slash skills audited and used (all 11 exist; `validate-skills.py`: 12/12 valid)
| Scene | Skill | Implementation (code) |
|---|---|---|
| all | `/agentoon-director` | `select-skills.py` run on the brief → plan (`data/PLAN.md`) |
| hook | `/agentoon-data-motion`, `/agentoon-3d-motion` (parallax depth) | `AnimatedCounter` 0→1,455,781 (`fx/data.tsx`); 12 spring-in skill cards on depth-scaled orbits with parallax drift (`Hook`) |
| intro | `/agentoon-camera`, `/agentoon-ui` | keyframed camera (translate+scale) into the real skills.sh recording: total → search box → results; cursor dot injected in the recording |
| install, search | `/agentoon-ui`, `/agentoon-typography` | pty capture → `term_render.py` → MP4; callout pills, animated word captions (`fx/kinetic.tsx`) |
| inspect | `/agentoon-camera`, `/agentoon-typography` | page zoom + typed-in real SKILL.md lines, audit pills |
| example | `/agentoon-motion`, `/agentoon-transitions` | our D05 counter, D07 kinetic type, D01 ui-depth, D06 3D clips, sliding between them |
| why | `/agentoon-diagrams`-style graph (custom SVG) | bezier edges growing from one search node, travelling packets, staggered category nodes |
| all | `/agentoon-robot`, `/agentoon-audio`, `/agentoon-qc` | robot rig + gestures + lip-sync; Kokoro TTS 163 wpm, synth music bed ducked under voice, keyboard/mouse-click SFX only, −15 LUFS; QC below |
Approved external skills reused: Remotion best-practice skills (installed plugin `remotion:*`), HyperFrames skills not needed. Blender: not used (no robot asset).

## 5. Instagram / TikTok captions
**Instagram (Reel)**
> One Claude Code skill that finds other skills. 🔎
> Vercel Labs' Find Skills searches the open directory at skills.sh — I installed it, searched "remotion", "motion graphics" and "video editing", and checked the source before trusting anything.
> `npx skills add vercel-labs/skills --skill find-skills`
> Then: `npx skills find remotion`
> Review skills before you install them — they run with full agent permissions. Save this for later 👇
> Follow @agentoon.ai — Real AI Tools • Skills • Automation
> #claudecode #aiagents #aitools #remotion #automation #agentoon

**TikTok**
> Find thousands of Claude Code skills with ONE skill 🤯 Find Skills by Vercel Labs → skills.sh. Search by task, read the source, then install. Not every result is great — check first! Follow @agentoon.ai for real AI tutorials. #claudecode #aitools #aiagents #remotion #coding

## 6. QC log
(see bottom of this file after the render check)
