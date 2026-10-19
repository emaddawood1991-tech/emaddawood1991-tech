# Original continuous-camera transitions (project capability)

**Status:** independently implemented; commercially appropriate. Inspired only by the *public idea* of feitangyuan/onetake ("motion that never cuts to the next slide"). OneTake is **PolyForm Noncommercial** — none of its code, assets, templates or text was copied or installed, and its repository clone was deleted. Do not install or run it for FMC.

**Code:** `src/lib/cameraFlow.ts` (C1 sampler, live in every render via `sampleCamera`) · `src/lib/continuousTransitions.ts` (`TRANSITIONS`, `transitionKeys`, `revealAt`) · tests `tests/camera-and-style.test.ts`.

**Presets:** `doctorToSpine` · `spineToExplanation` · `explanationToTreatment` · `treatmentToClosing` (stories in `docs/v7/FMC_DIRECTING_SYSTEM.md`).
**Use:** build keys with `transitionKeys(name, f0, f1, fromPreset, toPreset)` from `CAM` presets, concatenate into the script's camera key list, drive info reveals with `revealAt`. Keep the 3D model in the world across the transition (nothing "cuts").
**Rules:** 40–90 frames; calm (≤ ~1.2–1.4 m/s camera speed); holds ≥ 1.5 s on information; **`sfx: null` — no sound for transitions, ever** (smooth motion needs no whoosh).
**Status in scripts:** presets implemented/tested; the existing lower-back script still uses hand-keyed keys.
