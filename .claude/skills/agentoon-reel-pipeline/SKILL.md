---
name: agentoon-reel-pipeline
description: Orchestrate Agentoon.ai short-video production across ElevenLabs (narration), Magnific (approved AI media), Playwright (real software demos), Blender, Pexels, Reel Studio (captions/motion styles), Remotion (custom compositions) and Shotcut (manual review). Use for "make an Agentoon reel/video about X". Planning + QC playbook only; it never generates, spends credits, or publishes without explicit approval.
argument-hint: <topic> [en|ar]
---

# agentoon-reel-pipeline

**Topic:** `$ARGUMENTS` (if empty, ask for the topic and language in one short question.)

## Hard rules
- No paid generation (ElevenLabs, Magnific, any credit-based tool) without the user's explicit approval of the *specific* job and its estimated cost.
- Never publish, schedule, upload, overwrite or delete anything. Outputs go to a new `videos/<slug>/` folder.
- Never fabricate a UI, terminal output, screenshot, or result. Every software shot is a real capture or is clearly labelled illustrative.
- Reel Studio is an **additional** tool. It does not replace Remotion or the existing engine. Do not clone it into this repo; it lives in its own folder (see `INSTALL-WINDOWS.md`).
- Do not touch the FMC medical-center workflow.
- Never print tokens, keys or credentials.

## Fixed Agentoon.ai look (never drop)
Agentoon.ai branding + original robot mascot · existing signature ending · premium cinematic direction · dark-purple "Night Ops" styling where it fits · topic-specific motion graphics · HyperFrames / Lemo Opuscar techniques where already used · smooth zoom-ins/outs · animated subtitles that never cover commands · quiet mouse-click/keyboard SFX · no loud transitions · no silent gaps · natural narration ~155–170 WPM · default 60–90 s · **1080×1920, 30 fps, H.264 MP4**.

## Stage 0 — Preflight (always)
Run and report, do not assume: `node -v`, `ffmpeg -version`, `claude mcp list`, existing Remotion project present, Blender present, Reel Studio folder present (`node scripts/studio.mjs doctor --quick` inside it). Report each as INSTALLED / CONNECTED / TESTED / AUTHORIZATION REQUIRED / NOT AVAILABLE / FAILED. A config entry is not proof a tool works.

## Stage 1 — Preproduction
1. Research the topic in official docs; quote exact names, commands, versions. Label anything unverified.
2. Script to 60–90 s at 155–170 WPM (word count ≈ 150–250 for EN). Arabic: write for the ear, note diacritics for ambiguous words.
3. Scene table: `# | time | narration | visual source (Playwright/Magnific/Blender/Pexels/Motion) | on-screen text | SFX`.
4. Asset list with licence/source per item. **Stop and show the plan for approval.**

## Stage 2 — Narration (ElevenLabs MCP)
Only after approval and with the MCP CONNECTED. List voices (free), pick EN or AR voice, generate a short test line first, then the full take. Check pronunciation of product names (spell phonetically if needed). Voice cloning only for voices the user owns / is authorised to clone. Export WAV/MP3 to `videos/<slug>/audio/`. Record cost and any plan restrictions.

## Stage 3 — Visuals
| Need | Tool | Rule |
|---|---|---|
| Real software demo | Playwright MCP | Real navigation + real screenshots/recording from public or user-authorised sessions only; save to `videos/<slug>/captures/` with URL + timestamp in a `captures.md` log |
| AI image/video, character consistency | Magnific MCP | Approved prompts only, 9:16, quote credits first |
| Mascot / 3D / cinematic | Blender (existing) | Reuse original mascot rig; no redesign |
| Stock footage | Pexels workflow (existing) | Licensed clips; keep attribution log |
| Topic motion graphics | Remotion / HyperFrames | Night Ops palette, topic-specific |

## Stage 4 — Edit
- **Reel Studio**: captions, supported styles, motion-graphics-without-recording (`instructions/GRAPHICS.md` in its folder). Choose it when its styles/captions save time.
- **Remotion** (existing engine): custom compositions, mascot scenes, signature ending, anything Reel Studio's styles can't express. Default for brand-critical shots.
- **Shotcut**: manual trim/review when the user asks.
- Keep editable sources (`.tsx`, project JSON, `.mlt`) next to the render.

### Known integration gap (do not paper over)
Reel Studio and the Remotion project are separate engines. There is **no tested automated handoff** between them. Until one is built and verified: render the Reel Studio part to MP4, import it as a clip into the Remotion composition (or the reverse) manually, and say so in the report. Do not claim a seamless pipeline.

## Stage 5 — QC (on real rendered frames)
1. `ffprobe` confirms 1080×1920, 30 fps, H.264, AAC.
2. Extract frames (`ffmpeg -vf fps=1`) and *look at them*: spelling, captions vs. narration sync, nothing hidden behind Instagram/TikTok UI (keep ~220 px bottom, ~150 px top, ~80 px sides clear).
3. Subtitles never cover commands/UI being shown.
4. Audio: no clipping, narration clearly above SFX, loudness ≈ −14 LUFS (`ffmpeg -af loudnorm=print_format=summary`), no unneeded silence.
5. Technical authenticity: every command/UI matches a real capture.
6. Deliver: MP4, contact sheet, QC report, source folder, captions text. Wait for approval before anything else.

## Status of this pipeline
Documented, **untested end-to-end**. Update this section only after a real run passes.
