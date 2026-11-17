# Engineering upgrade: audit + plan (awaiting approval)
Checkpoint: local tag `pre-engineering-upgrade` (= b68a842; the git proxy refuses tag pushes, the commit itself is on the branch).

## 1. Geometry audit (measured)
| Area | Source | Status |
|---|---|---|
| Floors 10/11, 45, 49, 50 | outline.js / plans_polar.js | on true outline, validated (0 issues) |
| Floor 12 offices | plans_office.js 40x28 rect, core rect 12x9 = 108 m2 | WRONG: real core 182 m2; best placement still 5% outside facade + 14% in core |
| Lobby (floor 1) | main.js uses ringPoint for floor/ceiling/glass (OK); core = 6.4 m cylinder | real structural core radius at floor 1 is 6.1-11.4 m (Y wings): lobby core does not match; lobby fittings may sit inside real core wings |
| Lifts (extras.js) | 5 shafts 2.4 m at fixed world coords (+-2.7) | corners come within 0.2 m of the core wall on 8 floors (Express A), 7 (Mid-rise 1), 4 (Express B); floor lift doors (apts/pent/sky) sit on the core face at different angles, not at these shafts |
| Parking | extras.js rectangle -95..105 x -102..72, 3 levels, 8.4 m column grid, 30x30 core box | independent basement design, legitimate; only the 30x30 core/lift lobby must tie to the real core and shafts |
| Podium / terraces | tower.js site cylinders (radius 86/66/50) | not part of floor footprints; lobby top view fixed earlier |
| Facade, slabs, rotation, elevation (all 50 floors) | tower.js ringPoint | consistent; validateStack passes |

## 2. Existing MEP: connected vs visual
- plans_mep.js (floors 12, 50, 49 now): generated from rooms/fixtures per floor; risers are per-floor stubs; nothing links floors to a plant, tank, pump, sewer or main board. Visual per-floor.
- Legacy floor-49 MEP (main.js G.elec/water/sewer/fire/ac, hot-water cylinder, wet riser, FACP, fire demo, glass-pool engineering in extras.js POOLG): rectangle-based; **now unreachable after the floor-49 refit (regression against "preserve existing demonstrations")**. Must be ported.
- Parking (extras.js): supply/exhaust shafts, ducts, jet fans, CO sensors, detectors, sprinklers, fire demo: most complete system, but local to the basement.
- Elevators: animated cars (5 shafts) + lift-ride cabin: connected to nothing else.
- Wellness 10/11 and Sky 45: no MEP at all. Lobby: no MEP. Floor 12: MEP generic.
- HVAC basis in project: central chilled water, fan-coil units per room, mechanical ventilation in parking. Keep (no mixing).

## 3. Vertical service shafts today
Only the lift shafts exist as shafts. Riser positions are per-floor guesses (plans_mep). No electrical/water/drain/duct/fire shafts shared between floors -> must be created.

## 4. Proposed shared data model (new `building.js`)
- `site`: footprint(f), core(f), shaft zones, usable area (wraps outline.js); `stack`: floor table (elevation, use, plan builder, outline).
- `shafts`: named vertical zones (lift x5, stairs x2, electrical riser, plumbing/drain stack x2, HVAC duct x2, fire riser/stair pressure, smoke extract) as fixed world positions inside the core's minimum radius (3.95 m), with per-floor tap points.
- `plant`: basement/roof equipment (main LV room, transformer, water tank + booster pumps, fire pumps + tank, chiller plant, AHUs, sewage ejector pit, pool plant) with coordinates.
- `network`: graph nodes {id, system, floor, pos, kind} and edges {from, to, direction, kind: pipe/cable/duct, flow}. Systems: elec, water, sewer(gravity|pumped), vent, hvac(supply/return/fresh/exhaust), fireDetect, sprinkler, smoke, pool. All drawn from the graph; floors add taps, not free-floating pipes.
- `inspect`: each node has name, purpose, system, flow direction, explanation (drives the click card).
- Validator (geomcheck.js extended): graph connectivity (every fixture reaches a source/sink), drainage monotonic downhill, supply/return pairing, sprinklers reach fire pump, shafts align per floor and sit inside core, no clash with required routes.

## 5. Correction plan (stages as requested; each ends with checks + checkpoint)
1. Stage 2a: floor 12 refit on true outline (4 tenants as sectors, lounge, reception, core lift lobby) using plans_polar; lobby core replaced by true core outline + 3 lift portals on the real core face; lobby reception/lounges re-checked against real core (F.check + validator).
2. Stage 3: building.js + shaft layout; move lift shafts to guaranteed-inside positions, keep 5 cars/animation; align floor lift doors to shafts.
3. Stage 4: port legacy floor-49 demos (electric/water/sewer/fire/HVAC, fire demo, pool engineering) to the new penthouse + graph; floor 50, floor 12, lobby, garage on the graph.
4. Stage 5: add MEP to wellness (pool circulation/filtration/humidity control), spa, gym, sky restaurant/cafe (kitchen extraction, grease drain), documented as concept.
5. Stage 6: Engineering Explorer UI (system selector, floor/room isolation, x-ray/cutaway, legend, click cards), flow animation (instanced particles), wastewater follow-route, fire demo split detection vs sprinkler (heat-triggered, one head), smoke control sequence labelled "conceptual design basis".
6. Stage 7: validators, perf, QA, standalone export.

## 6. Conflicts / proposals needing your decision
- Parking footprint stays as is (different design). Confirm.
- Lift shaft count/positions: propose a 2x2 lift block + service lift in the centre (r<3.4 m); no change to car animation.
- Terraces on 49/50 project beyond the skin; tower.js has no matching slabs. Propose adding cantilever slabs to tower.js (exterior change) or keeping terraces inside the glass line (smaller units).
- Sky/spa/pool tenants' MEP is a visual concept; no code compliance claimed.

## 7. Risks / performance
- Many pipes: use merged/instanced geometry per system per floor, lazy-build per floor on selection, one shared particle InstancedMesh per system; target <= +60 draw calls with all systems on, <= 200k extra triangles; measured on software GPU only, real-device numbers need you.
- Scope: ~3-4 large sessions; MEP UI/data model is the biggest part.
- Floor 12 / lobby refit can change room sizes (office 1,520 m2 plate vs 1,120 m2 rect: more space, but wedge rooms).
