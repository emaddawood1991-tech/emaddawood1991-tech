# FMC Medical Video Studio — permanent project instructions

Read this whenever you work in this folder. For any FMC video request, **use the project skill `fmc-video-producer`** (`.claude/skills/fmc-video-producer/SKILL.md`) and do not make the user repeat these requirements or reinstall tools. Registry of tools and their verified status: `FMC_SKILLS_REGISTRY.md`. Standards detail: `docs/FMC_PRODUCTION_STANDARDS.md`, `docs/v7/*`, `docs/skills/*`.

**Status:** infrastructure complete (V7 + skills registry). **Do not render any video until the user authorises production for that video.** Planning, scripting, stills, tests and QC are fine.

## 1. Identity and branding
- Client: **مركز الفيصل الطبي** (Al Faisal Medical Center, FMC), Al Ain, UAE. Official Arabic name exactly `مركز الفيصل الطبي`. Slogan exactly `Ideal Care – الرعاية المثالية`.
- Official logo only: `assets/logo/fmc-original-logo.png` (sha256 pinned in `src/lib/fmcStandards.ts`; never recreate/recolour/AI-generate). Corner mark = `LogoBug`→`LogoMark` seal (dark scenes) or bare (light scenes); coat logo on the presenter; prominent in the closing.
- Current services only: العلاج الطبيعي، طب العظام، الطب العام، التأهيل العصبي، علاج الإصابات الرياضية، إعادة التأهيل بعد العمليات الجراحية. **Never** occupational therapy or speech therapy.
- No phone numbers, QR codes, websites or handles unless explicitly requested. No production-status banners, progress bars or "draft/preview" text inside finished videos (status lives in reports).
- Educational content only; no guaranteed results; the presenter is a fictional educational character, not a real FMC physician.

## 2. Approved skills — how and when (details + status in `FMC_SKILLS_REGISTRY.md`)
| Capability | Form | When | Rules |
|---|---|---|---|
| **fmc-video-producer** | project skill | every FMC video task | coordinator; loads these rules; picks the rest |
| **HyperFrames** 0.8.171 (Apache-2.0) | Claude plugin `hyperframes@hyperframes` + pinned CLI | motion-graphics/overlay studies, GSAP/keyframe inspection, audio-mix concepts | Reference skills OK: `hyperframes-core/-animation/-keyframes/-creative`. CLI only via `npm run hf -- lint\|check\|keyframes\|timeline` (adapter `v7/hyperframes-adapter`). **Never** `/hyperframes:hyperframes` entry router, `media-use`, `product-launch-video`, `pr-to-video`, `faceless-explainer`, `slideshow`, `remotion-to-hyperframes`, nor `tts/auth/cloud/cloudrun/lambda/publish/add/transcribe/render` (HeyGen accounts, catalog music/SFX, cloud, paid). FMC's renderer is Remotion — no migration |
| **Lemo Opuscar** (MIT) | Claude plugin `lemo-opuscar@lemolab` (guidance) | creative direction, storyboard, camera, lighting, pacing | Use `docs/v7/FMC_DIRECTING_SYSTEM.md` first. If the plugin is invoked, run only its clone step, never `deps`/render/voice/music; never adopt its foley/SFX advice or copy styles |
| **Claude Animation Base** (MIT) | no installable skill → project guidance + code | doctor acting/gestures | `docs/skills/claude-animation-principles.md`, `src/components/Doctor/actingPrinciples.ts`; its "Clawd" character/assets not used |
| **Continuous-camera transitions** | original code (OneTake concept only; OneTake is noncommercial — never install/copy) | scene-to-scene flow | `docs/skills/continuous-camera-transitions.md`, `src/lib/{cameraFlow,continuousTransitions}.ts` |
| **Collage B-roll** | original local components | optional: awareness/prevention topics only | `docs/skills/paper-collage-broll.md`, `src/components/Collage`; no paid video-generation API; never for anatomy |
Do not invoke every skill; choose by task. Use existing working components first; do not reinstall dependencies per video (`npm run verify:skills` checks the setup without rendering).

## 3. Production architecture (reuse, don't rebuild)
Remotion 4 + React Three Fiber (`src/templates/DoctorExplainer.tsx` = doctor reel; `MedicalExplainer.tsx` = legacy template). Narration drives the timeline (`src/lib/timeline.ts`). Presenter rig + acting engine: `src/components/Doctor/*`. Anatomy: `src/components/Medical3D`. Camera: `cameraPresets.ts` (framing standards), `cameraFlow.ts` (C1 sampler). Directing styles: `src/lib/directorStyles.ts` (documentary | commercial | explainer3d via `selectDirectorStyle`; `--style` flag). Standards/constants: `src/lib/fmcStandards.ts`. Pipeline scripts: `scripts/{generate-script,voice-compare,generate-voiceover,render-video,produce,mix-audio,approve}.ts`. Content: `content/<slug>.json` (hash-locked script; optional `sceneType` A–F). Format: 1080×1920, 30 fps, h264 yuv420p + AAC.

## 4. 3D character (permanent)
Human **male** medical presenter, ~30–35 yr, **clean-shaven (no beard, no moustache)**, short neat dark hair, friendly expressive eyes, white coat + **navy scrubs**, **original FMC logo on the coat**, stylised premium 3D. **Never a robot**, never a static PNG, never replaced. Natural hand/body movement (IK arms, finger life, weight shift, blink, saccades, look-at), Arabic lip-sync from the narration, gestures that carry meaning (pain = turn + hand on the correct lumbar region), pointing to lower back/shoulder/knee/wrist, interacting with anatomy. Correct scale via **camera presets** (full body 40–55 % of frame, beside anatomy 35–45 %), never by scaling his proportions. Tests: `npm run anim:qc`, `standards:qc` (no facial-hair identifiers, logo, framing).

## 5. Medical anatomy workflow
Real 3D anatomy (currently the procedural simplified lumbar model — labelled as simplified on screen; verified/licensed meshes are a future dependency). Each animation serves one educational purpose; highlight only the structure under discussion; no distortion or decorative glow; anatomy sometimes fills the frame; doctor supports. Cite sources in the content file. **A clinician must review anatomy and wording**; never invent findings or promise outcomes. Do not use collage visuals for anatomy.

## 6. Arabic language
Professional Modern Standard Arabic for UAE audiences; real text layers (never AI-generated image text), RTL, one font family (IBM Plex Sans Arabic / "FMC Arabic"), cards ≥ 40 px (title ≥ 64), ≤ 3 cards, ≤ 6 words per card, safe zones (top 270, bottom 420, sides 72/120 px). `ttsText` may only add diacritics to `narration` (no silent rewrites; script hash-lock). Run `npm run arabic:check -- <slug>`; pronunciation lexicon `config/pronunciation.json` (machine-drafted, `humanReviewed:false` until a native speaker listens). Human reviews (grammar, terminology, medical, pronunciation) are required before a final export; software cannot verify them. Keep the approved TTS provider/voice (MiniMax or Google) — never switch because a plugin offers TTS.

## 7. Audio policy (enforced in code, `src/lib/audioPolicy.tsx` → `FMC_AUDIO`)
Arabic narration is the main audio + ONE extremely soft continuous ambient pad bed (no piano melodies, percussion, bass, vocals, electronics; −34 LUFS bed, sidechain ducking, 2 s fade-in/3 s fade-out; final −16 LUFS, true peak ≤ −1.5 dBTP; separate stems). **Disabled by default and in code:** transition/camera/character/interface/anatomy SFX, automatic whooshes, any electronic transition sound, embedded footage audio. Scenes cannot declare `sfx` (schema); only `<NarrationAudio>` may emit audio; `enforceRenderProps` strips music/sfx from renders; `mix-audio.ts` refuses effects without the policy flag **and** an approval id; `audio:qc` fails on raw `<Audio>`, effect assets in `assets/audio/sfx/`, `sfx` in content, audio in `v7/`, non-silent effects stem, clipping, peaks. Never edit `FMC_AUDIO` to enable effects on your own. Never lower the master to hide a sound — find the source. Human listening approval is always required.

## 8. Camera and transitions
Continuous-camera only (`TRANSITIONS`: doctorToSpine, spineToExplanation, explanationToTreatment, treatmentToClosing), 40–90 frames, calm, **no sound**, no slide-to-slide cards, C1 sampler. First 3 s state the problem; show the affected region early; ≥ 1.5 s hold on information; every scene adds information or a meaningful perspective change. Scene types A–F (`SCENE_TYPES`), ≤ 2 consecutive of the same type.

## 9. Quality control (run, then report honestly)
Before production: `npx tsc --noEmit && npm test && npm run qc:all && npm run verify:skills`. After a render: `npm run audio:qc -- --video f.mp4 [--stems dir]` and `npm run standards:qc -- --video f.mp4`, then watch real frames and listen to the whole audio. QC report sections: audio sources/effects · Arabic · character consistency · framing · anatomy accuracy · scene variety · typography/safe zones · logo · technical · human-approval items. Automated checks flag candidates; they cannot judge Arabic pronunciation, medical accuracy or listening comfort. Never claim a check that was not run; never approve an unreviewed video.

## 10. Safety, licensing, hygiene
- Secrets only in `.env` (gitignored); never print keys. No paid APIs, subscriptions, cloud rendering, or HeyGen/catalog assets without explicit approval. No PRs unless asked.
- OneTake = PolyForm Noncommercial → never use its code/assets. gbro-collage-broll's Gemini video generation is paid → never enable. HyperFrames (Apache-2.0), Lemo Opuscar (MIT), ClaudeAnimationBase (MIT) = guidance/tooling only. Remotion and GSAP licence terms for commercial use are flagged for the owner's confirmation.
- Never overwrite earlier outputs (new path per video); Agentoon.ai files are a reference only and must never be modified. Checkpoint: commit `fe7c918` (pre-V7).
