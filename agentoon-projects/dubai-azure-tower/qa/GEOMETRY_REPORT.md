# Geometry correction: floors 49 and 50 on the true tower outline

## Root cause
Floors 49, 50 (and 12) were standalone rectangles (`main.js` 28x20, `plans_apts.js` 34x20 + 6.5 m terrace, `plans_office.js` 40x28) in their own
coordinate system. Nothing tied them to `tower.js` `ringPoint` (taper, 3 lobes, twist 92.5 deg at floor 49 / 94.7 deg at floor 50). `placeOut()` only
moved the surrounding world by hand-tuned offsets, so facade and interior matched from one camera only.
Best possible placement of the old rectangles (rotation + offset searched): floor 50 = 18% outside the facade + 12% inside the core; floor 49 = 4% + 15%; floor 12 = 5% + 14%.

## Fix
- `outline.js`: `getTowerFloorFootprint(f)` (single source of truth), `buildShell` (slab, core, glass, rails). `plans_polar.js`: reusable polar layout kit (wall chains, terraces, pool fitter, furniture helpers).
- Floor 50 (`plans_apts.js`) and new floor 49 (`plans_pent.js`, own mode `pent`) rebuilt as sectors around the core: service band, hall ring, rooms at the glass.
- Terraces + glass pools project 4 m beyond the glass line (approved projections). The tower exterior was NOT changed and has no matching cantilever slabs at 49/50 yet.
- Floor 45 defect found by the new validator and fixed: kitchen wall door placed beyond the wall end, wall poked 1.28 m through the facade.

## Validation (`geomcheck.js`, `tools/qa.mjs`: 65/65 pass)
Per floor: outline vs tower facade (<0.06 m), twist, elevation, items/walls inside footprint (terraces whitelisted), overlaps, in-wall, apartments disjoint/covering, lifts on core face.
Stack (floors 1-50): slabs never beyond the facade, lift-shaft zone (r 3.4 m) inside core (min core 3.95 m), outline/twist continuity. Floors 48/49/50 outlines differ <=0.35 m (the real twist step of 2.1 deg).
Known approximation: wellness level 11 shares floor 10's outline.

## Debug tool
Display > "Geometry check (debug)" (red facade, yellow glass line, cyan core, apartment boundaries, magenta violations, blue terrace limits) and "Exterior fit (x-ray)" (floor placed in tower coordinates inside the x-ray tower).

## Screenshots
`qa/geometry/before`, `after`, `compare_1..5.png`, `before_rect_vs_outline.png`.
## Limits
MEP routing on the new floors is illustrative (rectangular per-room bounding boxes). Floor 12 not yet refitted. Legacy `floor` mode code remains but is unreachable.
