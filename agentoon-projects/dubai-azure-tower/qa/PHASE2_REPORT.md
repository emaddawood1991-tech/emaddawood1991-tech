# Phase 2 report: exterior materials, glass, environment lighting, Dubai surroundings

## Changes
| Area | What changed | Files |
|---|---|---|
| Environment lighting | Whole-building view now reflects the real time-of-day sky (image-based lighting rebuilt from the sky dome whenever the time moves ~18 min or the storm level changes). Interior views keep the previous studio lighting. | `main.js` |
| Glass facade | New facade texture: glass panes with a sky-like gradient and per-pane tint, bronze mullions/transoms/sills, darker spandrel at each slab; separate roughness+metalness map (glass smooth, frames metal). Window lit-mask re-fitted to the panes. | `tower.js` |
| Night lighting | Bronze fins and slab-edge bands glow softly at night (on top of the existing lit windows and crown). | `tower.js` |
| Sky | Procedural drifting clouds in the sky shader; colour follows sunset, night and storm. Clouds also appear in reflections. | `main.js` |
| Dubai surroundings | New `environment.js`: textured asphalt, sand and paving, dashed road centre lines, kerbs and sidewalks, 79 instanced palms, 72 instanced street lights (heads light up at night). Sidewalks, palms and lamps are in the outside world, so they also show from the upper floors. | `environment.js`, `main.js` |
| Sea | Slightly less metallic, so it stops washing out under the sky reflection. | `main.js` |

All instanced; added render cost is small (see below). No existing feature removed.

## Tests
* Functional regression (`tools/qa.mjs`): **40/40 pass**, no JavaScript errors (`qa/phase2-qa-results.json`).
* Standalone HTML loads from `file://` without errors.
* After-screenshots of the tower views (day, crown, street, sunset, night): `qa/phase2/`, compare with `qa/phase1-baseline/`.

## Render cost vs Phase 1 (High tier, counts valid on any machine)
| View | Draw calls | Triangles | Textures |
|---|---|---|---|
| Tower overview | 695 → 677 | 166k → 182k | 8 → 14 |
| Lobby | 696 → 723 | 278k → 295k | 17 → 23 |
| Floor 12 plan | 1,701 → 1,715 | 405k → 422k | 42 → 48 |
| Floor 50 plan | 1,062 → 1,076 | 327k → 344k | 61 → 67 |

Memory: the facade textures are now 1728×1224 (three maps), roughly 25 MB more GPU memory than before. Frame rate not measured (software renderer only).

## Not done / limits
* Entrance, podium, balcony and crown **geometry** unchanged (only materials and night lighting); a redesigned entrance/crown is a larger modelling job.
* No external CC0 textures or models used so far: everything is procedural, so there are no licensing or loading risks. Nearby buildings still use the earlier simple blocks (only their lighting changed through the environment).
* No real-GPU frame-rate numbers yet.
* Close-up views of the new palms, sidewalks and street lights were not separately screenshotted; the overview views show them.
