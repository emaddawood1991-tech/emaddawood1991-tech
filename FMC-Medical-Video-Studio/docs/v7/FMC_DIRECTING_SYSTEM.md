# FMC Directing System (V7)

Code: `src/lib/directorStyles.ts` · `src/lib/continuousTransitions.ts` · `src/lib/cameraFlow.ts` · `src/components/Doctor/cameraPresets.ts` · `src/lib/fmcStandards.ts`. Tests: `tests/camera-and-style.test.ts`.

## Where the craft rules come from
Adapted as **grammar** (no code, assets, characters or style names copied) from the MIT-licensed Lemo Opuscar `DIRECTOR.md` / `TECHNIQUE.md`, which I read in full:

| Principle (Opuscar) | How FMC applies it |
|---|---|
| Judge a film by sound, rhythm, camera, directing | Sound = narration + soft bed only; rhythm = narration drives timing; camera = continuous presets; directing = scene types A–F |
| Hook in the first 3 s | Problem stated and the affected region shown inside 3 s (PACING.firstFramesProblemWithinSec) |
| One subject, one goal, one turn | One condition → one care pathway → FMC close |
| One signature move at the peak | Per style (below): doctor's gesture → camera travels into the anatomy |
| Every shot needs a reason; ≥ 4 different camera moves; subject ≥ ⅓ frame at key moments | Camera moves listed per style; framing standards enforced numerically |
| Hold text long enough to read (≥ 1.8 s, title ≥ 4 s); fewer words, not faster cuts | `TYPOGRAPHY` limits: ≤ 3 cards, ≤ 6 words, ≥ 40 px; hold ≥ 1.5–2 s per information beat |
| Design transitions inside the medium, not default fades | Continuous-camera transitions (below) |
| Anticipation / follow-through, keyframed pose blends | `actingPrinciples.ts` (also from ClaudeAnimationBase) |
| Review loop: contact sheets, enlarged strips, one full viewing with sound | `audio:qc`, `standards:qc`, frame review; human listening remains required |
| Copyright red lines | Logo only from the supplied file; no outside brands/footage |

**Deliberately NOT adopted:** Opuscar's "every visible action has a sound / use sound as a transition / foley layers" — it contradicts `FMC_AUDIO` (no effects). Opuscar's "avoid piano and strings" is consistent with FMC's pad-only bed. Its `-14 LUFS` target is replaced by FMC's −16 LUFS / −1.5 dBTP.

## The three styles
| | A · Premium Medical Documentary (`documentary`) | B · Modern Healthcare Commercial (`commercial`) | C · Advanced Medical 3D Explainer (`explainer3d`) |
|---|---|---|---|
| Intent | Calm, authoritative, realistic anatomy, controlled light | Bright, reassuring clinic feel; the presenter is the human face | Anatomy is the subject; layered structures, one accent highlight |
| Background | deep-navy gradient | bright clinic | dark graded studio |
| Light rig | warm key + teal rim (**identical to the pre-V7 rig**) | brighter, softer, higher fill | stronger key/rim, low fill |
| Doctor | 40–55 % intro, 35–45 % beside anatomy | 45–55 % intro, 38–45 % beside | 40–50 % intro, 30–40 % beside / inset |
| Camera | slow dolly-in, gentle orbit ≤ 25°, pull-back reveal, long holds | medium push-in, soft drift, rack to info | close-up reveal, layer peel, orbit ≤ 35°, pull through structures |
| Signature move | the doctor's gesture becomes the camera's destination | doctor turns and the frame glides to the care information | camera travels through the layers to the injury site |
| Scene-type bias | A B C D E F | A B E D F | C D B A E F |
| Topics (selector tags) | spine, joint, fracture, tendon, diagnosis, degenerative | prevention, posture, ergonomics, general-practice, post-surgery-rehab, sports-injury, wellness, awareness | nerve, carpal-tunnel, surgical, complex-joint, shoulder, knee, wrist, neuro-rehab, mechanism |

All three: FMC navy/teal palette, official logo, Arabic standards, **no** cartoon / cyberpunk / gaming / glitch / neon / sci-fi HUD / aggressive-tech look (tested). `selectDirectorStyle({topic, tags, goal})` is deterministic (tag overlap, goal tie-break, default = documentary). Selected per video via `--style documentary|commercial|explainer3d` (render script) / `styleKey` prop. Today only the **lighting rig** is wired into the renderer; palette/typography/camera tokens are data for the next scripts to consume.

## Continuous-camera transitions (original design; sound = none)
`TRANSITIONS` in `src/lib/continuousTransitions.ts`; each has `sfx: null` (tested), 40–90 frames, a via-waypoint and reveal windows.

| Transition | What the viewer sees |
|---|---|
| `doctorToSpine` | Doctor indicates the lower back → camera dollies toward that region → the anatomical model (already in the world) fills the frame; incoming information fades in beside the structure |
| `spineToExplanation` | Camera moves through the relevant structures with a slight lateral arc; Arabic information appears beside what it describes |
| `explanationToTreatment` | Camera pulls back from the anatomy into the full-body rehabilitation demonstration |
| `treatmentToClosing` | Last clinical image settles into the branded ending beside the original logo |

`transitionKeys()` builds the camera keys; `revealAt()` gives outgoing/incoming opacity per frame. `sampleCameraFlow()` (PCHIP) keeps velocity continuous so the camera passes through keys instead of stopping, rests only on deliberate holds, and never overshoots a framing.
**Status:** presets and sampler are implemented and tested; the sampler is already live for every render. The existing lower-back script still uses its hand-written keys, so the transition presets are not yet used by a script.

## Shot patterns (from `SHOT_STANDARDS`)
full-body intro (WIDE, 40–55 %) · medium speaking (CLOSE, waist-up) · explaining anatomy (BESIDE, 35–45 %) · demonstrating pain (CLOSE, hand on the region) · pointing to treatment information (BESIDE) · anatomy focus (ANAT, anatomy fills frame) · closing (END).
Camera-specific scale presets are used; the character's anatomical proportions are **never** scaled.

## Not done in this phase
Collage visuals now exist as an early local component set (`docs/skills/paper-collage-broll.md`). Verified/licensed anatomical meshes (Phase 9) — the lumbar model is still the procedural simplified educational model.
