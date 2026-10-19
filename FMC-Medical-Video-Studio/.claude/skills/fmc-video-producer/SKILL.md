---
name: fmc-video-producer
description: Professional Arabic medical video production for مركز الفيصل الطبي (Al Faisal Medical Center, Al Ain) using approved cinematic animation, character, anatomy, and audio workflows. Use for ANY request to create, plan, script, storyboard, render, review or improve an FMC / Al Faisal video, reel or Instagram video (e.g. "make an FMC video about lower back pain"). Loads the FMC production rules, picks only the approved skills the topic needs, reuses the existing Remotion + 3D presenter engine, and enforces the no-sound-effects audio policy. Takes precedence over generic video skills for FMC work.
argument-hint: <medical topic, e.g. lower back pain>
---

# FMC Video Producer

**Topic:** `$ARGUMENTS` (if empty, ask for the topic in one short question).

This skill is a **coordinator**. It does not re-implement anything: the engine, presenter, audio policy and QC already live in the project. Work from `FMC-Medical-Video-Studio/` (the project root for every path below).

## 0. Load the rules first (every time, no questions about them)
1. Read `FMC-Medical-Video-Studio/CLAUDE.md` — identity, audio policy, character, Arabic, QC. Do not ask the user to repeat any of it.
2. Check `FMC_SKILLS_REGISTRY.md` for what is INSTALLED / TESTED before relying on a tool. Never reinstall: run `npm run verify:skills` (non-rendering) instead.
3. **Rendering is gated.** Only render when the user has authorised production for this video. Planning, scripting, stills and QC are allowed without it.

## 1. Choose capabilities by task (use only what the task needs)
| Need | Use | How |
|---|---|---|
| Overall engine, scenes, render, TTS, approvals | Existing project (Remotion + R3F) | `npm run produce`, `scripts/*`, `src/templates/DoctorExplainer.tsx` |
| Creative direction, storyboard, camera grammar, lighting | **Lemo Opuscar** guidance | Read `docs/v7/FMC_DIRECTING_SYSTEM.md` first (it already adapts DIRECTOR.md/TECHNIQUE.md). Only if deeper reference is needed, invoke `/lemo-opuscar:lemo-opuscar` and run **only** its clone step (`setup.sh` without `deps`); never run its render/voice/music tools, never copy its styles or sound design |
| Style choice | project code | `selectDirectorStyle()` in `src/lib/directorStyles.ts` → documentary / commercial / explainer3d |
| Motion-graphics overlays, GSAP, keyframe inspection, HyperFrames audio-mix concepts | **HyperFrames** (reference + guarded CLI) | Read `/hyperframes:hyperframes-core`, `-animation`, `-keyframes`, `-creative` as reference. Run the CLI only through `npm run hf -- lint\|check\|keyframes\|timeline` (isolated `v7/hyperframes-adapter`). **Do not** invoke `/hyperframes:hyperframes` (router/entry point), `media-use`, `product-launch-video`, `pr-to-video`, `faceless-explainer`, `slideshow`, `remotion-to-hyperframes`, or any of `tts/auth/cloud/add/publish/transcribe/render`: FMC's output framework is Remotion |
| Doctor acting / gestures | project guidance + code | `docs/skills/claude-animation-principles.md`, `src/components/Doctor/{engine,lowerBackScript,actingPrinciples}.ts` |
| Camera transitions | project code | `docs/skills/continuous-camera-transitions.md`, `src/lib/cameraFlow.ts`, `continuousTransitions.ts` |
| Anatomy | project code | `src/components/Medical3D`; anatomy workflow in `CLAUDE.md` §Medical anatomy (clinician review required) |
| Collage B-roll (optional; prevention/awareness only) | project components | `docs/skills/paper-collage-broll.md`, `src/components/Collage` |
| Arabic script/QC/pronunciation | project code | `npm run arabic:check -- <slug>`, `config/pronunciation.json`, approvals via `npm run approve` |
| Audio | project code | narration via TTS pipeline; bed `npm run audio:pads`; mix `scripts/mix-audio.ts`; QC `npm run audio:qc` |

Do not invoke every skill. For lower back pain: this skill + directing doc + character/anatomy components + Arabic QC + audio QC (HyperFrames only if an overlay study is wanted).

## 2. Workflow (details: `docs/v7/FMC_PRODUCTION_WORKFLOW.md`)
Research → Arabic script (draft → `arabic:check` → **human** review → hash-lock) → creative direction (style + scene types A–F) → storyboard (stills) → character animation → medical animation → motion graphics → audio (approved TTS + pad bed) → continuous transitions → QC → render **only after approval**.
Defaults: 1080×1920, 9:16, 30 fps, h264 yuv420p + AAC; Arabic narration; original logo; consistent presenter; no automatic sound effects; Arabic cards ≥ 40 px, ≤ 3 cards, ≤ 6 words, safe zones respected.

## 3. Non-negotiables (enforced in code — do not work around)
- Audio = Arabic narration + ONE extremely soft pad bed. No whooshes/SFX/camera or character sounds/transition sounds. Config `FMC_AUDIO` in `src/lib/audioPolicy.tsx`; scenes cannot declare `sfx`; `<NarrationAudio>` is the only audio component; the mixer refuses effects without flag + approval.
- Presenter: human male, clean-shaven, white coat + navy scrubs, **original logo** (`assets/logo/fmc-original-logo.png`, never recreated), never a robot, camera-scale presets instead of scaling his body.
- Name `مركز الفيصل الطبي`, slogan `Ideal Care – الرعاية المثالية`; six current services only; no phone/QR/website unless asked; no production banners or progress bars in finished videos.
- Arabic must be correct MSA with real RTL text layers; pronunciation and medical accuracy need humans.
- No paid APIs, subscriptions, cloud rendering or catalog assets without explicit approval; secrets only via `.env`.

## 4. Before finishing any task
Run (non-rendering): `npx tsc --noEmit && npm test && npm run qc:all && npm run verify:skills`. After a render: `npm run audio:qc -- --video <file>` and `npm run standards:qc -- --video <file>`, then review real frames. Report honestly: automated results, what a human still must check (Arabic, pronunciation, medical accuracy, listening comfort). Never claim a check that was not run. Never overwrite earlier outputs; new path per video.
