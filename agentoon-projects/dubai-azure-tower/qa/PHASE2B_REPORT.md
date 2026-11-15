# Phase 2B report: grand entrance, landscaped park, water, lighting scenes, Luxury Arrival tour

Layout is conceptual (no surveyed site). Everything is in `landscape.js` (park, entrance, water, lighting), `camrig.js` (camera paths), `environment.js` (city district) plus small edits in `tower.js`, `extras.js`, `main.js`, `quality.js`.

## What was built
| Area | Result |
|---|---|
| Entrance | New stone plaza with bronze inlay, slimmer bronze/dark canopy with four columns, 36 warm downlights, illuminated DUBAI AZURE TOWER sign on the fascia, two reflecting pools with small jets flanking a 12 m clear walkway, planters. Stone drop-off bay on the driveway, kerbs, two zebra crossings. |
| Podium conflict fixed | The two raised terraces (5.5 m and 11 m) blocked the street side and the driveway ran into them. They are now opened in a 58° sector on the street side (with end walls) so the plaza meets the lobby at ground level. Tower footprint untouched. |
| Park | Island under the driveway arch plus two flank gardens: curved stone paths with lit edges and bollard lights, ~60 date palms (2 trunk/frond variants, size/lean/rotation variation, near/far frond detail), 3 shade-tree canopy shapes, ~140 shrubs and hedges, 15 flower beds (~700 flowers, colour variation), benches, a twisted-steel sculpture plaza, a timber pergola lounge, road-side hedge, sidewalks and street poles. |
| Water | Entrance pools, 28 m reflecting canal, 9 m fountain basin with 70+ jets of animated spray, underwater lights, lit edges, animated ripple surface that reflects the sky. Spray and ripples switch off on Low. |
| Driveway/street | Kerbs, stone bay, crossings, sidewalks, hedge, two moving cars on the coast road (not on the arrival loop). |
| City | Land-side district of ~90 mid/high-rise blocks (stepped, cylindrical, boxes) in three rows plus far silhouettes, merged into two meshes. |
| Lighting | Four buttons: Day (13:00), Golden hour (17:36), Blue hour (18:33, new twilight sky), Night (22:00). Existing time slider and light controls unchanged. Landscape lights (bollards, up-lights, pool/edge LEDs, sign) follow the night level. |
| Tour | "Luxury arrival" button: 10-stage sequence on one continuous camera rig (smooth speed changes, zero speed at start/end), fade into the lobby and a second rig inside. Silent (no music). Existing tours untouched. Lobby is now visible through the glass when the camera is near the entrance. |
| Quality | Tiers now also scale planting density (Low 30 %, Medium 65 %) and switch spray/ripples off on Low. |
| Collision data | `LAND.LAYOUT` (paths, water, solids, keep-outs) and `LAND.blocked(x,y,z)` are ready for the walkthrough phase. |

## Tests
* `tools/qa.mjs`: **44/44 pass**, no JavaScript errors (`qa/phase2b-qa-results.json`). New checks: four lighting scenes, Luxury Arrival camera path clear of trees/palms/benches/water/ground (1 m clearance, 600 samples), tour start/stop, entrance-to-lobby transition.
* Screenshots: `qa/phase2/` (50-58 garden/entrance/fountain by day, golden, blue, night; 60-69 along the tour path; 70-73 four lighting scenes).
* Standalone HTML loads from `file://` without errors.

## Render cost (High tier; counts valid on any machine)
| View | Draw calls | Triangles |
|---|---|---|
| Tower overview | 677 → 728 | 182k → 272k |
| Tower street | 604 → 645 | 165k → 260k |
| Lobby | 723 → 697 | 295k → 385k |
Low tier: tower overview 727 calls / 238k triangles (planting thinned, no spray). My earlier estimate (25-35 calls, 40-70k triangles) was too low: the real increase is about 50 calls and 90k triangles. Frame rate not measured (software renderer only).

## Not done / limits
* Entrance doors: the existing lobby doors are unchanged (no new glass doors); the lobby is visible through the tower glass.
* Tree uplighting is a glowing disc at the base, not a real light (no extra real lights, for speed). No real shadows for the park (sun shadows only in interiors).
* Cars are still simple box models; no pedestrians outdoors.
* Park walkthrough itself is not built (Phase 4); only its collision data.
* Blue-hour ground is still fairly dark; a fine-tuning pass is possible.
* Tour verified by sampled stills, collision sampling and a scripted start/transition/stop, not by watching all 100 s at real speed.
