---
name: agentoon-video-producer
description: Produce a new Agentoon.ai 9:16 (1080x1920) educational video about Claude Code, MCP, AI agents or GitHub tools. Covers research, PROBLEM→DISCOVERY→SOLUTION→REAL DEMO→RESULT→TAKEAWAY story, retention-first script, a new visual concept per episode, robot acting, real demos, HyperFrames render, sound and subtitles, and review of the rendered MP4. Use for any new Agentoon.ai video, reel, tutorial or test, and to analyse real Instagram/TikTok metrics of Agentoon videos.
argument-hint: <tool or topic>
---

# Agentoon.ai Video Producer

**SAME BRAND. DIFFERENT VISUAL EXPERIENCE. EVERY VIDEO.**

Videos must feel professionally directed, tell an interesting story, teach something real, and make viewers excited for the next Agentoon.ai tutorial. They must not merely look animated, look like a screen recording, or look like an animated PowerPoint.

**Topic:** `$ARGUMENTS` (if empty, ask for the tool/topic in one short question, then continue).
Apply this standard automatically. Do not ask production questions it already answers.

## Hard rules (never break)

1. **Never modify, re-render or overwrite a completed/approved video** (e.g. the FreeLLMAPI episode). Every video gets its own folder and a new output filename.
2. **Free, local tools only.** Never buy credits, start subscriptions, call paid APIs (Gemini/Veo, HeyGen cloud, paid TTS/music) or expose credentials without the user's explicit approval. Check licence and cost before installing anything.
3. **Never fabricate** demos, output, results, prices or analytics. Label time-lapses and anything simulated.
4. **Never show** API keys, setup codes, passwords or the user's email. Use env vars; blur secret lines.
5. **Preserve the brand:** original robot (never Clawd or another character), logo, one signature ending. See `references/brand-guide.md`.
6. **Do not reuse the previous episode's visual template.** See `references/creative-direction.md`.

## Workflow

### 1. Pre-production (research and story)
1. Research the tool from primary sources (repo, docs, pricing/support pages). Verify every claim; record the source of each. Copy GitHub links and install commands from the real repo and test them.
2. Write the story: PROBLEM → DISCOVERY → SOLUTION → REAL DEMO → RESULT → TAKEAWAY. The viewer must know why the tool matters before any install command. One-sentence takeaway. No list of disconnected features.
3. Beat sheet using `references/retention-editing.md`: hook in 0–2 s, a new discovery/demo/surprise every 5–8 s, a camera or reveal change every 2–4 s. Length 60–90 s (max 1:50); short tests 10–15 s.
4. Pick a NEW visual direction for this topic: choose one hero technique, one carrier, one transition family and one environment arc from the technique↔topic table in `references/reference-analysis.md` (never the previous episode's combination), then log it in the style ledger in `references/creative-direction.md`. Add an **energy line** to the beat sheet: a burst (transition, camera move, transform, big reveal) about every 3 s, and a named motion for every hold.
5. Write the robot acting plan per scene (`references/robot-acting.md`): feeling / looking at / doing / reaction to the software result.
6. Show the plan (logline, beats, concept, acting) to the user only if they asked for approval gates; otherwise proceed.

### 2. Real demonstrations
Record genuine footage: real terminal sessions, real GitHub pages and dashboards captured at phone size, real logs and results. Close-ups on the exact line, row or badge being discussed. Keep terminals at full card width so lines are not cropped.

### 3. Narration
Confident, energetic tech-creator voice, measured **155–170 wpm**, natural rhythm, no artificial dramatic pauses, no silent gap > ~1 s, narration flows through transitions. Save word timings for subtitles. Remove repeated sentences. Free local TTS only (see tool map).

### 4. Build
Primary engine: **HyperFrames** (Apache-2.0), local render only. Compose one continuous world (interface → explanation graphic → real result) joined by a visual device, using layered depth, masked reveals, camera moves, kinetic subtitles and original paper-collage B-roll built in HTML/CSS/SVG/GSAP. Keep reusable components in a shared kit and each episode in its own folder.

**Liveliness rules (from the reference analysis, `references/reference-analysis.md`):** diagrams and lists build progressively on their words, never fully formed; real interfaces are cropped to the readable detail, zoomed to on the narrated word with a drawn-on highlight, then released; transitions are carried by something on screen (cable, scroll, zoom-through, shape that grows into the next scene) with motion blur on fast moves; the frame is layered (environment, tilted UI card with shadow, robot and chips, hero type) with no large empty zones; every hold keeps moving (slow push-in, parallax drift, typing, wire drawing, robot action); the robot works on the interface in every scene.

### 5. Subtitles and sound
Word-timed kinetic subtitles, style chosen per episode, never over code or key UI, inside platform safe areas. Voice clearly above music; music 18–24 dB under with ducking and subtle changes between discovery, demo and result; small SFX only on meaningful actions; whooshes/glitches/impacts sparingly. About −15 LUFS, true peak ≤ −1 dBTP, no clipping.

### 6. Validate, review, deliver
1. Run the pre-render list in `references/quality-checklist.md`.
2. Render the MP4, then run `bash ${CLAUDE_SKILL_DIR}/scripts/validate-render.sh <video.mp4> [word_count]` and `bash ${CLAUDE_SKILL_DIR}/scripts/motion-profile.sh <video.mp4>` (details in `references/technical-validation.md`). Fix dead holds and a motion gap longer than ~3 s before delivery.
3. Review the actual MP4: contact sheets at every scene and seam, the phone-size sheet, audio, timing, spelling, robot acting, branding. Fix significant problems, re-render to a new filename, re-check.
4. Deliver the file path, a short summary, sources, and anything unverified or version-dependent.

### 7. Analytics (only with real metrics)
When the user provides Instagram/TikTok numbers, analyse retention drop points mapped to scenes, average watch time, completion rate, saves and shares; compare with earlier episodes; propose concrete changes for the next video. Never invent numbers. If none are provided, say so and skip.

## Tool map (verify before use; do not assume)

| Tool | Role | Licence / cost | Notes |
|---|---|---|---|
| HyperFrames CLI / Claude Code plugin | Primary video engine | Apache-2.0, free, local render | Needs Node 22+, FFmpeg, Chrome. Run `npx hyperframes doctor`. Use `lint`, `check`, `snapshot`, `render`. Do not use cloud render or `heygen` sign-in. |
| GSAP | Motion | Free "Standard 'no charge'" licence | Vendor locally; don't load from a CDN at render time. |
| Lemo Opuscar | Creative direction (style guides) | MIT | Tuned for Opus 5.5; use as style grammar, not to copy films. Some styles feature Clawd: never use Clawd. |
| ClaudeAnimationBase | Character-animation principles | MIT | Principles only (p5.js engine, Clawd character not used). |
| OneTake | Continuous-camera transition inspiration | PolyForm Noncommercial | **Ideas only. Never install, copy code or assets.** |
| gbro-collage-broll | Paper-collage B-roll idea | MIT, but needs paid Gemini API | **Skip the workflow.** Build the collage effect locally. |
| Local TTS | Narration | Kokoro (free, on-device) or edge-tts | Confirm availability first; no paid TTS. |

**Kit in this repo:** `agentoon-video/kit/` (`robot.js`, `outro.js`, `captions.js`, `camera.js`, `collage.js`, `term.js`, `agentoon.css`, `py/build_audio.py`; docs in `kit/README.md`, licences in `kit/LICENSES.md`). Scaffold a new episode with `agentoon-video/new-episode.sh <NN-slug>`; `episodes/00-quality-test/` is the reference build (rendered, validated). Never reuse its look for a real episode. Render with `npx hyperframes check` then `render --quality delivery --fps 30` inside the episode folder. If the user's own kit (`track.js`, `termplayer.js`, `looks.json`, `engine/hf.sh`) is also present, use it; if a file is missing, say so and build it; never pretend it exists.

## References

- `references/brand-guide.md` — original robot, logo, signature ending, visual identity
- `references/quality-checklist.md` — the complete production checklist
- `references/creative-direction.md` — choosing a new visual style per episode
- `references/technical-validation.md` — ffprobe, audio, safe areas, mobile readability
- `references/robot-acting.md` — expressive mascot performance
- `references/retention-editing.md` — hooks, pacing, storytelling, narration
- `references/reference-analysis.md` — techniques from the approved reference videos, measured benchmarks, technique↔topic table, kit backlog
- `scripts/validate-render.sh` — automated post-render checks and phone-size contact sheet
- `scripts/motion-profile.sh` — motion energy, hard cuts, static stretches, longest gap between motion bursts (read-only)
