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
