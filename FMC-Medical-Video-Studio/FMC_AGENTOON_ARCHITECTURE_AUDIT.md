# FMC ↔ Agentoon.ai — Architecture Audit

## 0. What I could and could not inspect (read this first)
| Item | Access | Evidence |
|---|---|---|
| FMC Medical Video Studio (repo `emaddawood1991-tech/emaddawood1991-tech`, folder `FMC-Medical-Video-Studio/`) | **Full** | source, git history, rendered outputs |
| Agentoon.ai **production project** (`kit/`, `engine/hf.sh`, `CHECKLIST.md`, `references/*`, episodes) | **Not accessible** — no such folder on this machine. Searched `/` for "agentoon": only (a) a marketing site `dawoud-labs/` that contains Agentoon promo images/videos/QR codes (a Next.js site, not the video engine), (b) `emaddawood1991-tech/.claude/skills/agentoon-carousel` (carousel skill), (c) two claude.ai-synced skills `agentoon-episode` and `agentoon-video-producer` | filesystem search |
| What I *can* say about Agentoon | Only what those two skill documents **state** about the engine, kit and rules. I did not read `robot.js`, `captions.js`, `camera.js`, `track.js`, `collage.js`, `py/agaudio.py`, or `hf.sh`, and the skills' `references/*.md` files are not present (the synced skills contain only `SKILL.md`). | skill text |

**→ Please give me the Agentoon.ai project path (or paste/zip `kit/` and `CHECKLIST.md`) if you want the reusable components verified or copied.** Every "Agentoon does X" below is from skill text, not from code I inspected. Nothing in Agentoon was modified.

Tools "already installed" — evidence: on this machine, before V7, **no** HyperFrames or Lemo Opuscar plugin/skill and no global `hyperframes` binary (`claude plugin list`, `npm ls -g`, `~/.claude`). The Agentoon skills say Agentoon uses HyperFrames (Apache-2.0, local-only), Lemo Opuscar (MIT), ClaudeAnimationBase (MIT techniques), GSAP; whether they are installed on **your** Agentoon machine cannot be checked from here.

## 1. Architecture comparison
| Layer | FMC (inspected) | Agentoon.ai (per skill docs) |
|---|---|---|
| Renderer | Remotion 4.0.505 (React) + React Three Fiber/three 0.170; software GL; 30 fps, 1080×1920 | HyperFrames (HTML + GSAP, seekable timelines), local render, 24 fps, 1080×1920 |
| Character | Procedural 3D human presenter: skeleton + analytic IK, lip-sync from narration loudness, clip-based acting engine | 2D/robot mascot (`robot.js` acting library: introduce, aimPoint IK, react, worried, celebrate…) |
| Medical visuals | 3D procedural lumbar spine, anchors, callouts | not applicable (tech tutorials: terminals, GitHub pages, dashboards) |
| Camera | keyframed 3D camera (stop-at-every-key before V7; C1 sampler now) | `camera.js` / `track.js` keyframe camera with motion-blur on fast moves; "one continuous camera through one world" |
| Motion graphics | React components (Arabic cards, callouts, logo reveal) | GSAP timelines, masked reveals, parallax, 3D tilt, `looks.json` (a new look per episode) |
| Subtitles | none (narration only; text cards) | word-timed kinetic captions (`captions.js`) |
| Narration | MiniMax + Google Arabic TTS, approval gates, ASR round-trip, script hash lock | edge-tts English voice, word boundaries saved |
| Music / SFX | pad bed, ducking, **no SFX (enforced since V6/V7)** | music 18–24 dB under voice with ducking; "small SFX on meaningful actions; whooshes, glitches, impacts sparingly" |
| QC | `arabic-qc`, `audio-qc`, `standards-qc`, `anim-qc`, tests (V7) | `hf.sh lint/check/snapshot`; `CHECKLIST.md`; post-render ffprobe, ebur128, silencedetect, phone-size contact sheets |
| Process rules | approval gates (human Arabic/medical/pronunciation) | retention-first beats (hook 0–2 s, new beat every 5–8 s, camera change every 2–4 s), never overwrite approved videos, one folder per episode, free/local tools only |

## 2. What Agentoon does better (per its skills)
1. **Process discipline that is machine-checkable:** lint/check gates before render and a fixed post-render review (ffprobe, loudness, silence gaps, phone-size contact sheets at every scene and seam). FMC had audio/Arabic gates but no frame-level or code-level audio gate until V6/V7 → now partly closed (`audio-qc`, `standards-qc`).
2. **A kit, not a script per video:** shared components (`camera.js`, `captions.js`, `agentoon.css`, `looks.json`) plus a scaffold (`new-episode.sh <slug> <look>`). FMC still has a **per-topic hard-coded performance/camera script** (`lowerBackScript.ts`) — the main reason each new FMC video re-invents framing and timing.
3. **Continuous-camera storytelling** as a rule ("one world, one camera, no slideshow") and retention-driven pacing numbers.
4. **Word-timed kinetic subtitles.** FMC has none.
5. **Explicit licence/cost rules** written into the skill (free local tools only; no paid APIs without approval).
6. **Look system:** a different visual concept per episode, same brand.

## 3. Reusable for FMC
| Component / idea | Reuse mode | Status in V7 |
|---|---|---|
| Quality checklist + post-render review procedure | concept → FMC scripts | **Done** (`audio-qc`, `standards-qc`, workflow doc) |
| `looks.json` idea (look per episode) | concept → `DIRECTOR_STYLES` (3 medical-appropriate styles) | **Done** (data + selector + tests; only lighting is wired into the renderer) |
| Continuous camera / keyframe track | concept → `cameraFlow.ts`, `continuousTransitions.ts` | **Done** (sampler live; presets tested, not yet used by a script) |
| Acting principles (anticipation, follow-through, aimPoint) | technique → `actingPrinciples.ts` | **Done** for pointing gestures |
| Retention beat rules | rules → `PACING` constants | **Partial** (constants; not machine-enforced) |
| `captions.js` word-timed subtitles | needs the Agentoon file, Arabic RTL shaping, and Arabic word timings (ASR alignment) | **Not done** — blocked on access + alignment source |
| `camera.js` / `track.js` code | needs the files | **Not inspected** |
| HyperFrames as a *second engine* | isolated adapter `v7/hyperframes-adapter` (lint/check/keyframes only) | **Done (study composition, no render)** |
| `robot.js`, `termplayer.js`, `ansi2frames.py`, the Agentoon outro/CTA | — | **Not reusable** (robot/terminal/social-CTA; FMC forbids robot presenter and extra CTAs) |
| SFX guidance ("pops, dings, whooshes sparingly") | — | **Must NOT be imported** (FMC_AUDIO: no effects) |

## 4. FMC components that should stay unchanged
Remotion + R3F engine and the 3D presenter rig; narration→timeline model; TTS integrations and approval/hash-lock system; Arabic QC rules (clinic name, six services, forbidden services/claims); the official logo file; the procedural lumbar model (until verified models replace it); anim-qc.

## 5. Components that needed replacement (and what happened)
| Component | Problem | V7 action |
|---|---|---|
| Per-scene whoosh in `MedicalExplainer`, render script auto-enabling effects, default seam swells in the mixer, `sfx` declared per scene in content JSON, whoosh regenerated by `audio:bed` | **Root cause of the recurring sounds** (details in the V7 report §E) | Removed / gated / schema-rejected; tested |
| Stop-at-every-key camera sampler | slideshow feel, jerky holds | C1 sampler `cameraFlow.ts` |
| Glass info cards (14 % white) | Arabic unreadable over white coat/anatomy (seen in stills) | near-opaque navy cards, ≥ 40 px, safe-zone anchored |
| Red status banner + bottom progress line in `MedicalExplainer` | production text on screen | removed |
| Square white logo sticker | looks pasted-on | circular seal variant (original PNG untouched) |
| `yuvj420p` output | wrong range tag for some players | `yuv420p` in config |
| Hard-coded lighting | not style-selectable | `DIRECTOR_STYLES.*.lighting` (documentary = old rig, pixel-identical) |

## 6. What causes the recurring FMC production problems
1. **Policies lived in prompts and CLI flags, not in code.** "No SFX" was a flag (`--no-sfx`), a null prop and a sentence in a prompt; the template, the mixer default, the content schema and the asset generator each still had a path that produced effects. → Fixed by one frozen config, a gate in every path, schema validation, and tests.
2. **Per-video bespoke scripts.** Framing, timing and gestures are hand-keyed for each topic, so mistakes (oversized doctor, cards over the torso, repeated gestures) recur. → Standards + numeric checks added; a topic-agnostic scene composer is **recommended, not built**.
3. **QC after the fact, by eye.** → Automated code/frame/audio checks now run before export; human review still required.
4. **No shared kit for captions/typography** → card standard introduced; captions still missing.
5. **Agentoon's SFX-friendly conventions can leak into FMC** if components are copied blindly → explicit "do not import" list above and in `CLAUDE.md`.
