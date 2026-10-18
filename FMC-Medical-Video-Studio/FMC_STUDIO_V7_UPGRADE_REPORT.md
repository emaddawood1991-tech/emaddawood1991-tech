# FMC Medical Video Studio — V7 Upgrade Report

**No video was rendered, no MP4 created, no narration or paid media generated.** The only images produced were single stills for layout/logo review: 3 + 4 frames of the existing composition (cards before/after) and 1 logo-study still. Earlier outputs were not touched. Companion reports: `FMC_AGENTOON_ARCHITECTURE_AUDIT.md`, `FMC_V7_DEPENDENCY_LICENSE_REPORT.md`, `docs/v7/FMC_DIRECTING_SYSTEM.md`, `docs/v7/FMC_PRODUCTION_WORKFLOW.md`, `docs/v7/COLLAGE_NOTE.md`.

## Blocking information needed from you
**I could not access the Agentoon.ai project** (no `kit/`, `hf.sh`, `CHECKLIST.md` or episodes on this machine). I only had the two synced skill documents. Please send its location (or the `kit/` folder) if you want `captions.js` / `camera.js` / `track.js` reviewed or adapted. Nothing about Agentoon was invented beyond what those skill texts state.

---
## A. Project comparison — what was learned from Agentoon.ai
(From skill text only; see the audit.) Agentoon's advantages: a shared kit instead of per-video scripts, machine-checkable gates before and after render, continuous-camera storytelling rules, retention-driven pacing numbers, word-timed kinetic captions, a "look" per episode, strict free/local-tool rules. FMC adopted the process gates, the look-system idea, the continuous-camera idea and acting principles. It did **not** adopt Agentoon's SFX habits (whooshes/dings), robot mascot, terminal tooling or social CTA outro.

## B. Installed tools
| Tool | State before | Action |
|---|---|---|
| HyperFrames plugin 0.8.171 (`hyperframes@hyperframes`) | not installed (`claude plugin list`, `npm ls -g`) | **Installed**, user scope, after verifying the docs are current. 21 skills, 0 agents/hooks/MCP |
| HyperFrames CLI | not global | Used via pinned `npx hyperframes@0.8.171`; **not** added to FMC dependencies |
| Lemo Opuscar plugin (`lemo-opuscar@lemolab`) v0.1.0 | not installed | **Installed**, user scope (guidance only) |
| ClaudeAnimationBase | — | **Skipped** (2D p5.js starter; sample "Clawd" character not for FMC). Principles re-implemented |
| OneTake | — | **Skipped — PolyForm Noncommercial**; no code read or used; clone deleted |
| Collage B-roll | — | **Skipped — paid Gemini video generation** |
| Agentoon skills (`agentoon-episode`, `agentoon-video-producer`) | present (synced claude.ai skills) | read only |
Side effects on your Claude Code setup: two user-level marketplaces (`hyperframes`, `lemolab`) and two plugins added; reversible with `claude plugin uninstall …`. HyperFrames adds ~4.1 k always-on tokens per session.

## C. Architecture — what powers FMC now
- **Picture:** unchanged — Remotion + React Three Fiber, procedural 3D presenter, procedural lumbar model.
- **Camera:** new C1 sampler `src/lib/cameraFlow.ts` (live for all renders) + transition presets `continuousTransitions.ts` (not yet used by a script).
- **Direction:** `directorStyles.ts` (3 styles + selector; lighting wired, rest is data), `fmcStandards.ts` (character/typography/scene types/pacing/logo), `cameraPresets.ts` (framing standards computed numerically).
- **Audio:** narration through `<NarrationAudio>` only; music mixed post-render by `mix-audio.ts` from the pad bed; config `FMC_AUDIO`.
- **HyperFrames:** isolated adapter `v7/hyperframes-adapter` (Arabic info-card overlay study; lint/check/timeline/keyframes pass) behind the guarded wrapper `scripts/hf.mjs`. It is **not** part of the production render path. No migration from Remotion — none was justified.
- **QC:** `audio-qc.ts`, `standards-qc.ts`, `anim-qc.ts`, `arabic-qc.ts`, 30 automated tests.

## D. Doctor character
**Improved (source changed)**
- Acting principles: `actingPrinciples.ts` + `Clip.acting` + `armWeight()` in `engine.ts` — anticipation dip (−5 %), overshoot (+4.5 %), settle; enabled on `pointToLowerBack`, `pointToShoulder`, `pointToKnee`, `pointToWrist`, `pointAtAnatomy`, `presentMedicalModel`, `attention`. `anim:qc` after the change: **0 snap frames**, max joint step 0.32 rad/frame (limit 0.45; was 0.23), planted feet 0 cm/frame.
- Character spec encoded (`CHARACTER_SPEC`); automated check that `Doctor.tsx` contains no facial-hair identifiers and uses the official logo; camera presets validated so he stays at 40–55 % (full body) / 35–45 % (beside anatomy) — `BESIDE` pulled back from 45 % to 43 %.
- Pointing gestures to the lower back, shoulder, knee, wrist already existed (V5/V6); opening/closing wave, blink, saccades, finger life, lip-sync (loudness/spectrum) unchanged.
**Not done / still needed**
- I did **not view** the new anticipation/overshoot motion in video (no render); only the numbers.
- The generic `explain` gesture is reused 6× (the new check warns); needs 2–3 variants.
- No finger-articulation upgrade; lip-sync is not phoneme-accurate Arabic; no facial redesign this phase.
- The character is still stylised procedural geometry (not Agentoon-quality); "friendly expressive eyes / natural skin" need a human look at real frames.

## E. Audio
**What caused the unwanted transition effects (confirmed in code/history)**
1. `scripts/render-video.ts` (commit 02fa3d7): `sfx: existsSync('assets/audio/sfx/whoosh.mp3') ? 'audio/sfx/whoosh.mp3' : null` — effects switched on by file existence.
2. `src/templates/MedicalExplainer.tsx`: for every scene after the first, `<Audio src=whoosh volume={0.35}>` for 2 s at the scene start — i.e. at each scene change.
3. `scripts/make-audio-bed.ts` regenerated `whoosh.mp3` (band-passed pink noise, 0.7 s fade-in) on every `audio:bed` run, re-arming (1).
4. `scripts/mix-audio.ts` (commit 4ab0123): pink-noise "air swells" at every scene boundary **on by default**; disabling required remembering `--no-sfx`; the `audio:mix` npm script omitted it.
5. `content/lower-back-pain.json` declared `"sfx": ["soft-whoosh"]`, `["soft-whoosh","ui-tick"]` on every scene; the schema accepted any list (a latent trigger for any future consumer).
6. No component checked any policy; the policy existed only in prompts/CLI flags.
The investigation points you gave (≈4, 20, 39, 55, 75 s) coincide with the scene boundaries (4.67, 20.23, 39.17, 55.53, 75.17 s) — consistent with 2/4. Not provable for "37.mp4" (not available). The detector found no non-speech transients in V2, Final_Audio, V5 or either V6 file (`docs/v7/audio_qc_delivered/*.md`). Embedded footage audio: no footage files exist locally; stock footage is rendered muted via `footageMuted()`. Pre-rendered clips containing effects: none in the repo; HyperFrames registry blocks do contain SFX wavs (guarded).

**Changed (files / functions)**
`src/lib/audioPolicy.tsx` (`FMC_AUDIO` frozen config; `NarrationAudio`, `PolicySfx`, `sfxAllowed`, `assertSfxAllowed`, `enforceRenderProps`, `footageMuted`) · `MedicalExplainer.tsx` (whoosh/music `<Audio>`, banner, progress line removed) · `DoctorExplainer.tsx`, `CharacterPreview.tsx`, `TreatmentScene` (policy components) · `render-video.ts` (`enforceRenderProps`, label never drawn) · `mix-audio.ts` (`assertSfxAllowed` gate, pad bed + −34 LUFS defaults, auto `audio:qc`, mux limiter) · `make-audio-bed.ts` (no whoosh) · `src/lib/schema.ts` (`sfx` must be `[]`) · `content/lower-back-pain.json` (`sfx: []` on all scenes; the script hash `e3578fed0067…` is unchanged) · assets: `whoosh.mp3` & piano bed → `assets/audio/_retired/`, optional effects → `sfx-optional/` · `scripts/hf.mjs` (guarded HyperFrames).
**Enforcement for future videos (no prompt sentence needed):** compile-time — compositions can only emit audio through `NarrationAudio`; runtime — `enforceRenderProps` throws on `music`/`sfx`; mixer — refuses effects without the policy flag **and** an approval id; schema — rejects scene `sfx`; `audio:qc` fails on raw `<Audio>`, direct audio references, effect assets in `assets/audio/sfx/`, `sfx` in content files, audio elements/files in `v7/`, non-silent effects stem, clipping/true-peak breaches; `npm test` (11 audio tests) codifies it; `CLAUDE.md` loads the rules into every session.
**Music direction:** `FMC_AUDIO` fixes `piano/percussion/vocals=false`, style `ultra-soft-medical-ambient`; the standard bed is the synthesized pad (`compose_pads_v6.py`), one continuous track, 2 s fade-in/3 s fade-out, sidechain ducking, separate stems. `audio:qc` heuristic on the music bed: pad bed 2.1 onsets/min, crest 13.1 dB → pass; retired piano bed 5.6/min, 15.9 dB → flagged (threshold tuned on those two files only; cannot prove "no piano").
**Not claimed:** that any sound is pleasant. Duplicate-effect detection is static (source references, stems) — no spectral duplicate fingerprinting. Human listening approval is required for every video.

## F. Creative direction
Three styles (documentary / commercial / explainer3d) with deterministic topic selection, forbidden-look list (tested), per-style light rigs, camera grammar, typography and doctor-share targets; four continuous-camera transitions with reveal windows and `sfx: null`. Opuscar's craft rules adapted as grammar (hook, signature move, readable holds, camera motivation); ClaudeAnimationBase's principles for acting; OneTake only as an idea. Detail: `docs/v7/FMC_DIRECTING_SYSTEM.md`. Wired into rendering: documentary lighting (pixel-identical to before) and the C1 camera sampler; everything else is data/presets for the next scripts.
Also changed after viewing stills: info cards were 14 %-white glass (unreadable over the white coat/anatomy) → near-opaque navy, 40 px, anchored at the safe-zone line; corner logo → circular seal.

## G. Arabic quality
**Implemented validation:** existing mechanical QC (spelling patterns, brackets, ي/ى & ه/ة flags, clinic-name variants, forbidden services incl. occupational/speech therapy, forbidden claims, `ttsText` = `narration` + diacritics only, closing must contain name and slogan, hash-lock) **plus V7:** contact-detail rejection (phones, URLs, QR, handles, WhatsApp), pronunciation lexicon (`config/pronunciation.json`, 9 terms; checks narrated terms use the lexicon form), six-service whitelist test, 8 tests. Real text layers, RTL, IBM Plex Sans Arabic only; no AI-generated Arabic imagery.
**Still needs human review:** grammar/wording/medical terminology (reviews not recorded), pronunciation after listening (all 9 lexicon entries are `humanReviewed:false`), letter shaping and kerning on real frames, whether the 13-word safety card should be shortened (locked text), and typography around Instagram UI.
No narration was regenerated and the approved voice/provider was not changed.

## H. Tests
| Check | Result |
|---|---|
| `npx tsc --noEmit` | **pass** |
| `npm test` (30 tests: audio policy 11, camera/style/acting 11, Arabic/brand 8) | **30 pass, 0 fail** (one test failed first — an over-strict hold-speed threshold — fixed in the test) |
| `npm run audio:qc` on the repo | **PASS**, 0 errors, 0 warnings. Negative tests: injected raw `<Audio>`, `<audio>` in `v7/`, effect request without approval → all correctly fail |
| `audio:qc --video` on V2 / Final_Audio / V5 / V6 Clean / V6 SoftFX | V6 Clean pass; V2, Final_Audio, V5 **fail** true-peak (−1.0/−1.1/−0.9 dBTP > −1.5); V6 SoftFX fails the "stem not silent" check (it contains its 4 deliberate effects, made before the gate existed); no non-speech transients found in any |
| `npm run standards:qc` on the repo | **FAIL (1 error)**: 13-word safety card in the FMC scene (locked script text). Warnings: opening title 8 words, symptoms has 4 cards, `explain` gesture repeats |
| `anim:qc` | 0 snaps, planted feet 0 cm/frame |
| `arabic:check` | no automated findings; 1 warning (lexicon unreviewed) |
| HyperFrames `lint` / `check` / `timeline` / `keyframes` on the overlay | pass (first lint run found a real asset-path error and 2 warnings — fixed). `check` contrast: 0/0 (transparent bg) |
| `remotion compositions` (Reel, TV, DoctorReel, CharacterPreview, LogoStudy, …) | loads after all changes |
| Stills | cards before/after (7 frames), logo seal vs sticker |
**Not tested:** any full render; the motion of the new camera sampler/acting overshoot as video; styles B/C lighting visually; transitions inside a real script; `hyperframes render/snapshot`; real-device Instagram overlay; listening comfort; Arabic pronunciation; medical accuracy; Remotion licence status; GSAP licence text.

## I. Remaining work before the next video
1. Your authorisation to render; Agentoon kit location if captions/camera code should be reused.
2. Human sign-offs: Arabic grammar/terminology/medical review, script approval, pronunciation after listening (lexicon review).
3. Decide the content items: shorten/split the 13-word safety card, symptoms 4→3 cards, 8-word opening title.
4. Wire `TRANSITIONS` + `selectDirectorStyle` into the next topic script; build explain-gesture variants; check the new motion in a short **approved** test.
5. Verified/licensed anatomical models and clinician review of anatomy animation (Phase 9 — **not started**); finger articulation & phoneme-accurate lip-sync upgrades.
6. Word-timed Arabic captions (needs alignment source + Agentoon `captions.js`).
7. Remotion/GSAP licence confirmation; decide whether to keep the HyperFrames plugin enabled.
8. Optional: paper-collage local technique (design note only).

## J. Readiness (based on evidence above)
| System | Status | Basis |
|---|---|---|
| No-SFX audio enforcement | **Ready** | 6 root causes removed/gated; 11 tests incl. end-to-end gate; QC negative tests |
| Audio validation (automated) | **Ready** (automated scope) | measures sources, assets, peaks, clipping, loudness, non-speech transients, stems |
| Audio comfort / music taste | **Blocked on human listening** | cannot be measured |
| Background music bed | **Partially ready** | pad bed exists and passes heuristics; piano absence unprovable; not listened to |
| Arabic validation | **Partially ready** | automated rules + lexicon pass; all human reviews open |
| Narration/TTS | **Ready (unchanged)** | approved providers kept; no new generation done |
| Branding / logo | **Ready** | hash pinned, alpha verified, seal checked on a still; end-screen not re-viewed |
| Typography / cards | **Partially ready** | fixed and verified on 4 stills; content-length items need approval; IG overlay unverified |
| Camera / continuous transitions | **Partially ready** | sampler tested & live; presets tested; not used by a script; motion not viewed |
| Directing styles | **Partially ready** | data + selector + tests; only lighting wired; B/C unseen |
| Doctor animation | **Partially ready** | 0 snaps, acting principles on; unseen motion, repetitive `explain` |
| 3D medical anatomy upgrade | **Blocked** | not started; needs verified models + clinician |
| HyperFrames integration | **Partially ready** | isolated, guarded, lint/check pass; not in the production path; no render tested |
| Lemo Opuscar | **Ready (as guidance)** | read and adapted |
| Word-timed captions | **Blocked** | Agentoon files + Arabic timing |
| Collage visuals | **Not implemented (optional)** | note only |
| Production workflow & standards docs | **Ready** | `docs/v7/*`, `CLAUDE.md` |
| **Rendering the next video** | **Blocked pending your approval** | by your instruction |
