# Project instructions

## Agentoon.ai video production (permanent)

For any request to make, script, animate, render or review an Agentoon.ai video (reel, tutorial, test, intro, ending), use the project skill **`agentoon-video-producer`** (`/agentoon-video-producer <tool or topic>`) and follow it automatically. Do not ask production questions its standard already answers.

**SAME BRAND. DIFFERENT VISUAL EXPERIENCE. EVERY VIDEO.**

Always:
- Never modify, re-render or overwrite a completed video (for example the FreeLLMAPI episode). New video, new folder, new output filename.
- Retention first: real result or compelling problem in 0–2 s; something new every 5–8 s; visual change every 2–4 s; no filler motion.
- Story: PROBLEM → DISCOVERY → SOLUTION → REAL DEMO → RESULT → TAKEAWAY. Explain why the tool matters before install commands.
- The original robot acts in every scene (feeling, looking at, doing, reaction to the real result). Original logo and robot only (never Clawd). One concise signature ending with one follow CTA.
- Cinematic, not a screen recording or animated PowerPoint. A new visual concept per episode (backgrounds, typography, motion, camera, subtitles); never reuse the previous template.
- Narration about 155–170 wpm, natural, no silent gap over about 1 s.
- Mobile-first: large, zoomed commands and UI; subtitles never cover code; platform-safe areas; check contrast on light and dark.
- Sound: voice above music, subtle music changes, meaningful SFX, sparing whooshes/glitches; about −15 LUFS, true peak ≤ −1 dBTP, no clipping.
- Verify every technical claim and use real demos and real GitHub links/commands. Never fabricate results or analytics. Never show keys, codes, passwords or the user's email.
- Free, local tools only (HyperFrames primary). No paid services, APIs, credits or subscriptions without explicit approval; check licences first. OneTake is noncommercial: ideas only. Skip the paid Gemini collage workflow.
- Motion (from the reference analysis, `references/reference-analysis.md`): pick a fresh hero technique + carrier + transition family + environment arc per episode; diagrams and lists build progressively on their words; real UI is cropped, zoomed to the narrated detail with a drawn-on highlight; transitions are carried by something on screen with motion blur; every hold keeps moving; the robot works on the interface (perch, peek, press, climb, pull); a motion burst about every 3 s. Never imitate another creator's branding; keep the single follow ending ("Follow @agentoon.ai" + "Real AI Tools • Skills • Automation").
- After rendering, review the actual MP4 (`scripts/validate-render.sh`, `scripts/motion-profile.sh`, phone-size sheet, seams) and fix significant problems before delivery.
- **Real demos only (no placeholders in a deliverable):** follow `references/real-demo-standard.md`; get real material before designing scenes (run it locally, local stand-in app if a site is unreachable, Playwright screenshots, verbatim transcripts); label honestly ("VERBATIM", "LOCAL TEST APP", "RUN ON MY BUILD"); trace every number to `data/`; run `scripts/no-placeholders.sh`. Ending: Outro with "Follow @agentoon.ai" + "Real AI Tools • Skills • Automation". Hook shows the real result in the first 3 s; 60-90 s when verified material supports it.
- **No moving light sweeps** (the vertical scan-beam loop is retired); show real software inside laptop/computer illustrations with purposeful zoom toward the screen (`references/real-demo-standard.md` section 7, `kit/snippets/laptop-screen.js`).
- Analyse Instagram/TikTok metrics only when the user provides them.
- **Optional tools (additive):** Remotion (projects `remotion-video`, `remotion-studio`, `remotion-claude`) and Blender (only if an MCP is connected) may supply extra shots that are rendered to MP4 and composited into HyperFrames. They never replace HyperFrames, the kit, the robot or the existing effects. Install/render Remotion in a scratch copy, never in the repo; never run `remotion-claude`'s `npm run gen` (paid OpenAI/ElevenLabs) without approval. Details: `references/remotion-blender.md`.
- **Permanent quality gate (additive; all style rules above stay):** real software for real tools (Windows UI, github.com, genuine Claude Code activity, real AI-app UI, real command results); never present a placeholder or mock-up as a recording. Every video has `data/OFFICIAL-SOURCES.md` ("OFFICIAL WEBSITES & REAL VISUAL ASSETS": exact URLs, repos, docs, logos, screenshots, verified install steps) made before scenes. Mobile-first proof with `scripts/mobile-check.sh` (large commands, safe areas, captions off commands). A video is FINAL only if `scripts/final-gate.sh` passes and `data/QC-REPORT.md` is complete; otherwise name it `*-PREVIEW.mp4`, report exact blockers plus a MUST RECORD list, and keep preparing other assets. Never claim a tool (Remotion, Blender, Pexels, Shotcut, Lemo Opuscar, MCPs) that was not actually used. Details: `references/final-approval-gate.md`, `official-sources-and-real-assets.md`, `mobile-readability.md`, `real-demo-standard.md` section 8.

## Process safety
- Never use pkill -f / grep-kill in a Bash call that also mentions the process name.
- To stop renders, run ONLY: bash scripts/stop_renders.sh  (as its own Bash call).
- Exit code 144 = the shell killed itself; nothing after it ran.
- Edit files with the Edit tool or a python patch that asserts the old text exists.

## Agentoon.ai slash-skill library (video production)
Start any new video with **`/agentoon-director <topic or brief>`**: it audits the environment, selects only the specialist skills the story needs, and writes `data/PLAN.md`. Specialists (invoke individually when needed): `/agentoon-motion`, `/agentoon-camera`, `/agentoon-typography`, `/agentoon-robot`, `/agentoon-ui`, `/agentoon-3d`, `/agentoon-morph`, `/agentoon-diagrams`, `/agentoon-audio`, `/agentoon-transitions`, and `/agentoon-qc` (final gate, blocks FINAL when real demos are missing). They extend, never replace, `agentoon-video-producer` and its rules above. Never use every effect: each effect must serve a narrated beat, and every video needs a different hero technique, carrier and transition family. Validate the set with `python3 .claude/skills/agentoon-director/scripts/validate-skills.py`.

## Real motion graphics (mandatory for every video; added 2026-11-15)
Registry with sources, locations, licences, dependencies and test results: `agentoon-video/docs/SKILL-REGISTRY.md`.
- **Working effect slash skills (Remotion, proven by rendered clips):** `/scrapbook-collage`, `/explainer-panel-reel`, `/neon-outline`. Code: `agentoon-video/remotion-fx/` (`npm install` there once; render with `bash .claude/skills/agentoon-director/scripts/render-fx.sh <CompId> <out.mp4>`). Proof clips: `agentoon-video/remotion-fx/proof/`.
- **Installed GitHub skills (project-level, MIT):** `video-effects` (JesseEisenbart), `motion-graphics`, `cinematic-camera`, `terminal-inserts`, `article-highlights` (Liamrjohnston). Official Remotion skills are reused from the existing `remotion:*` plugin skills (not duplicated).
- `/agentoon-director` section 7 is the pipeline: analyse → inspect real skills (`scripts/discover-skills.py`) → choose styles that fit (never all) → write `data/FX-TIMELINE.json` → implement in code → render + inspect frames → `scripts/check-fx-usage.py <episode>` → fix.
- Every future video: purposeful motion graphics throughout; real logos + screenshots for software tutorials; kinetic typography for key points; animated comparisons for alternatives; camera movement that directs attention; the original robot with lip-sync; no static slides or generic crossfades; nothing excessive.
- A skill name in a prompt is not proof. An effect counts only if it exists as code, was rendered, and the extracted frames were viewed. Report which engine rendered each scene (Remotion / HyperFrames / Blender; Blender has no robot asset in the repo).
- Third-party skills' intake questions are pre-answered by Agentoon defaults (9:16, 1080x1920, 30 fps, no questions). `cinematic-camera`, `terminal-inserts`, `article-highlights` forbid neon: never combine them with `/neon-outline` in one scene.

### Motion-graphics expansion (2026-11-15)
- Six more REAL effect skills (Remotion components, rendered proof in `agentoon-video/remotion-fx/proof/`): `/agentoon-data-motion` (counters, odometer, percent, progress, countdown, charts), `/agentoon-3d-motion` (three.js/R3F logo + text + fly-through, Blender turntable), `/agentoon-kinetic-type` (words, letters, morph, 3D title, subtitles), `/agentoon-infographics` (MCP/API diagrams, flow lines, networks, timeline, morphing comparison), `/agentoon-logo-motion` (reveal, particles, shape morph, presentation), `/agentoon-cinematic-fx` (transitions, motion blur, tracking, speed ramp, light sweep).
- `/agentoon-director` auto-selects them: `python3 .claude/skills/agentoon-director/scripts/select-skills.py "<brief>"` now prints "Real effect skills" from `reference/fx-registry.json` (max 1 hero + 2 supporting; component files must exist). Never apply all effects to every video.
- The "no moving light sweeps" rule above is relaxed by the user's 2026-11-15 instruction: `LightSweep` is allowed as ONE subtle sweep per reveal; looping scan beams stay retired.
- Registry, sources, licences, limitations: `agentoon-video/docs/SKILL-REGISTRY.md`; components: `agentoon-video/remotion-fx/README.md`.

## Permanent Claude character (approved 2026-11-26)
For any Claude / Claude Code video use ONLY the Claude Code mascot in `agentoon-video/assets/claude-mascot/` (README there): small blocky terracotta (#D97757) body, two black square eyes, two short side arms, four short legs; 3D Blender rig with 11 actions (IDLE, BOUNCE, WAVE, LOOK, WALK, RUN, TALK, THINK, POINT, CELEBRATE, LISTEN) and removable accessories. It replaces the older star-shaped Claude (Episode 24; do not reuse). Always label it "Agentoon.ai animated interpretation of the Claude Code mascot, not an official Anthropic production". Never add humanoid limbs, big eyes, gloves or a separate head.
Character registry: Agentoon robot (original, approved, 2D rig `remotion-fx/src/fx/RobotRig2.tsx`) and Claude mascot (above).
