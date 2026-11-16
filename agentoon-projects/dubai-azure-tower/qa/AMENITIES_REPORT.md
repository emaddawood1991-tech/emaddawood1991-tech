# Amenity floors report: Wellness & Fitness (floors 10 + 11) and Sky Restaurant & Café (floor 45)

Built on each floor's TRUE tower outline (computed from the tower model, not a rectangle). Conceptual layouts; structural and building-services feasibility is not verified.

## Inspection numbers (from the model)
| Floor | Plate | Net of core | Used |
|---|---|---|---|
| 10 (and 11) | 1,565 m² | 1,377 m² | two levels, voids for pool hall + gymnastics hall |
| 45 | 840 m² | 739 m² | about 660 m² programme |

## What was built
* **Wellness, level 10:** reception + 4 lifts, men's/women's changing (lockers, benches, showers), spa (reception, 4 treatment rooms with massage tables and doors, relaxation lounge with loungers, cedar sauna, steam room), double-height pool hall (17 × 6.5 m sunk pool, 1.5 m deep, mosaic floor with moving caustics, two animated ripple layers, underwater lights, cove ceiling lighting, 9 pool loungers, tables, plants), double-height gymnastics hall (mats, 2 rings rigs, pull-up rigs, plyo boxes, kettlebells, medicine balls, sprung floor), mobility lounge with stretching mats and juice bar, feature stair opening.
* **Wellness, level 11:** weightlifting gym (4 power racks with loaded bars, 4 lifting platforms, 4 benches, 3 dumbbell racks, 2 cable crossovers, 2 leg presses, 6 selectorised machines, mirror wall on the core), cardio (8 treadmills, 6 bikes, 4 rowers), rim walkway with pull-up rigs overlooking both voids behind a glass balustrade.
* **Sky restaurant, floor 45:** host + lifts, main restaurant (about 90 seats in three rows, marble floor with dark inlay and parquet border, timber slat ceiling, pendant clusters, cove light, service stations), café (curved counter, two espresso machines, pastry display, shelving, lounge chairs), VIP room (3 m table, 8 chairs, pendant), restrooms, kitchen/back of house (2 ranges with hoods, prep tables, fridges, shelving, dishwashing, staff door and kitchen pass doors).
* **Interaction:** nav buttons for both floors and on the floor picker (10, 11, 45) and tower click routing; camera presets (gym overview, weightlifting, gymnastics, spa reception, treatment, pool; main restaurant, café, VIP, panoramic); click any equipment for its details; room light buttons, pool lights, decorative lights, interactive doors, room labels, level selector (both / 10 / 11); lift rides between 1, 10, 12, 45, 50.
* **Amenities tour:** new button; 8 stages from gym overview to sunset dining; continuous camera rigs; silent. Existing tours untouched.
* **Ceiling fix (lobby + all plan floors):** the lobby ceiling was filled with a polygon triangulation that left a notch and was coplanar with the lift-core top (flickering). It is now a clean fan from the tower axis and the core stops just under it. On floors 12, 49, 50 and the new floors ceilings now appear automatically when the camera is inside a room (and hide for top-down views) so lights never float against the sky.
* **Performance:** all static furniture, equipment and walls are merged per material. Floors are built only on first visit.

## Tests
* `tools/qa.mjs`: **54/54 pass**, no JavaScript errors (`qa/amenities-qa-results.json`). New: layout checks on the real outlines (0 overlaps, 0 pieces outside the glass), equipment records, camera presets, lift ride 12 → 45, Amenities tour start/stop.
* Screenshots: `qa/amenities/`.

## Render cost (High; valid anywhere)
| View | Draw calls | Triangles |
|---|---|---|
| Wellness gym | 188 | 312k |
| Wellness pool | 211 | 279k |
| Sky restaurant | 230 | 466k |
(For comparison floor 12 plan = 1,717 calls.) Frame rate not measured (software renderer only).

## Not done / limits
* No free CC0 models or textures (hosts blocked here); all equipment is procedural, so it is detailed but stylised (no brand-accurate machines).
* Pool water is layered ripples + caustics + environment reflection (no refraction or planar mirror).
* Level 11 reuses level 10's outline (about 0.7° twist difference ignored).
* The two voids (pool hall, gymnastics hall) need part of the floor 11 slab removed: structural approval required. Sauna, steam, pool loads and kitchen exhaust are unverified.
* Existing floor 12 and 50 plans are still rectangles (corners poke outside the tower outline); refit is a separate task.
* Spa and gym interiors are still fairly plain (white walls); a richer wall/ceiling finish pass is possible.
* Stair is a visual run of steps only; no slab cut-out detail around it.
