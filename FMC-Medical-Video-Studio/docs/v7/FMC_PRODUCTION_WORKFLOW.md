# FMC Production Workflow (V7)

Default output: 1080 × 1920, 9:16, 30 fps, h264 `yuv420p` + AAC, Arabic narration, original FMC logo, consistent presenter, no automatic sound effects.
**Rendering requires explicit user authorisation** (the `hf` wrapper also refuses `render` without `FMC_V7_RENDER_APPROVED=1`; the FMC render script needs `--final` approvals).

| # | Step | What happens | Command / file | Gate |
|---|---|---|---|---|
| 1 | Topic research | Understand the condition; collect sources (`sources` in the content file); no invented findings or guaranteed results | `content/<slug>.json` | human (clinician) |
| 2 | Arabic script | Draft → mechanical QC → human grammar/terminology/medical review → hash-lock | `npm run script:generate`, `npm run arabic:check -- <slug>`, `npm run approve -- review …`, `approve -- script` | **human** |
| 3 | Creative direction | `selectDirectorStyle()` → documentary / commercial / explainer3d; pick scene types A–F per scene (`sceneType`) | `src/lib/directorStyles.ts`, `docs/v7/FMC_DIRECTING_SYSTEM.md` | creative approval |
| 4 | Storyboard | presenter / anatomy / treatment scenes, shots from `SHOT_STANDARDS`, transitions from `TRANSITIONS`; first 3 s state the problem | stills only (Remotion `still`) | user approval of storyboard |
| 5 | Character animation | Approved clean-shaven presenter; acting plan per scene (feeling / look-at / action); gestures with anticipation (`GESTURE_ACTING`) | `src/components/Doctor/*`, `npm run anim:qc` (0 snaps, planted feet) | review stills |
| 6 | Medical animation | Real 3D anatomy; each animation has an educational purpose; highlight only the structure discussed | `src/components/Medical3D` | **clinician** |
| 7 | Motion graphics | Arabic cards ≥ 40 px, ≤ 3 cards, ≤ 6 words, safe zones; optional HyperFrames overlay studies (`v7/hyperframes-adapter`, lint/check only) | `npm run hf -- check` | stills |
| 8 | Audio | Approved TTS voice (MiniMax/Google, unchanged) → narration stems → pad bed (`npm run audio:pads`) → mix with ducking | `npm run voice:generate`, `scripts/mix-audio.ts` | **human listening** |
| 9 | Transitions | Continuous-camera presets, no sound | `src/lib/continuousTransitions.ts` | review |
| 10 | Quality control | `npm test`, `npx tsc --noEmit`, `npm run qc:all`; after render `audio:qc --video`, `standards:qc --video`; human watch + listen + Arabic + clinician sign-off | `FMC_QC_REPORT` template below | **human** |
| 11 | Rendering | Only after approval; new output path, never overwrite earlier versions | `npm run produce …` | **user authorisation** |

## QC report sections (every video)
1 Audio sources & effects audit · 2 Arabic language review · 3 Character consistency · 4 Character framing · 5 Anatomical accuracy · 6 Scene variety · 7 Typography & safe zones · 8 Original logo verification · 9 Technical validation · 10 Limitations needing human approval. Automated findings come from `audio-qc` / `standards-qc`; items 2, 5 and the "comfort" part of 1 are human-only.

## Protecting existing work
Checkpoint = commit `fe7c918` on branch `claude/upbeat-pascal-hhmirn` (local tag `fmc-pre-v7-checkpoint` points to it; pushing the tag was refused by the network proxy), dependency snapshot `docs/v7/dependency-snapshot-before-v7.txt`, all earlier exports untouched, Agentoon.ai files never modified, one new output path per video.
