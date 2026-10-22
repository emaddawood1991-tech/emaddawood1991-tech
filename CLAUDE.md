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
- Motion (from the reference analysis, `references/reference-analysis.md`): pick a fresh hero technique + carrier + transition family + environment arc per episode; diagrams and lists build progressively on their words; real UI is cropped, zoomed to the narrated detail with a drawn-on highlight; transitions are carried by something on screen with motion blur; every hold keeps moving; the robot works on the interface (perch, peek, press, climb, pull); a motion burst about every 3 s. Never imitate another creator's branding; keep the single "+ Follow Agentoon.ai" ending.
- After rendering, review the actual MP4 (`scripts/validate-render.sh`, `scripts/motion-profile.sh`, phone-size sheet, seams) and fix significant problems before delivery.
- Analyse Instagram/TikTok metrics only when the user provides them.
- **Optional tools (additive):** Remotion (projects `remotion-video`, `remotion-studio`, `remotion-claude`) and Blender (only if an MCP is connected) may supply extra shots that are rendered to MP4 and composited into HyperFrames. They never replace HyperFrames, the kit, the robot or the existing effects. Install/render Remotion in a scratch copy, never in the repo; never run `remotion-claude`'s `npm run gen` (paid OpenAI/ElevenLabs) without approval. Details: `references/remotion-blender.md`.
