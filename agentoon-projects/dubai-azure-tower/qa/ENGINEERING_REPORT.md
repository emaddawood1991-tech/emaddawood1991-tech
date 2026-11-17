# Engineering upgrade, stages 2-6 (first delivery)

## Geometry (stage 2, done)
- Floor 12 offices rebuilt on the true outline (4 tenants + business lounge + lift lobby/reception around a corridor ring that follows the core); lobby core rebuilt on the true 3-wing core outline (was a 6.4 m cylinder; real radius 6.1-11.4 m).
- `geomcheck.js` now validates floors 10, 11, 12, 45, 49, 50 and the lobby (0 issues) plus the 1-50 stack.

## Shared service infrastructure (stage 3, done)
`building.js`: shafts (5 lifts kept, shaft boxes 2.4 -> 2.2 m so they fit the core on every floor; four 1.2 m riser shafts in the quadrants: electrical + fire alarm, plumbing + fire water, drainage, mechanical), plant rooms (main LV, generator, chilled-water energy station, water tank + boosters, hot water, fire tank + pumps, ejector pit), utility connections, one node/edge graph for all systems.
Graph: 1,734 nodes, 1,840 connections. Validator (`validateEngineering`) checks: endpoints, connectivity to sources/sinks for every system, gravity drains never rise, supply/return pairing for every unit, shafts inside the core on all 50 floors, no clash with lift shafts, no horizontal route through a lift shaft.

## Engineering Explorer (stage 6, first version)
Nav "Engineering Explorer". Systems: electricity, clean water (cold + hot), sewage (soil, waste, vent, pumped basement drainage, grease trap, oil interceptor, pool air gap), HVAC (district chilled water, fan-coils, AHU for gym/restaurant, pool dehumidification, kitchen hood, garage supply/exhaust, fresh air + exhaust risers), fire detection, sprinklers, smoke control (extract, stair pressurisation, lift recall), pool circulation.
Whole-building or single-floor view, floor interior shown in tower coordinates, transparent tower, animated flow, legend, click inspection card (name, purpose, flow direction), route trace (wastewater to the sewer, signals to the panel, supply back to the source).
Fire demonstration: fire -> detector -> loop -> riser -> panel -> sounders; lift recall, smoke damper/extract/stair pressurisation; only heads near the fire open (68 C), water route from the pumps animates. Conceptual, labelled.

## Assumptions (conceptual design basis)
District cooling (no on-site heat rejection); stairs and fire-fighting lobbies are not modelled (stair pressurisation shown to a stair-core damper only); fire riser shares the plumbing shaft in its own compartment (real design would use a fire-fighting lobby); 1 % drain fall (conceptual); no code compliance claimed; needs review by qualified engineers.

## Not yet done / next
- Per-room isolation (floor isolation is done); selective facade hiding; richer equipment geometry (pumps, AHUs, cable trays are markers + pipes); pool hall duct detail; labels are limited to major equipment.
- Parking geometry left as its own rectangle (agreed). Lobby washrooms exist in the graph but have no modelled walls yet.
- Per-floor "behind the walls" layers (addMEP) are still the older rectangle-based per-room routing on floors 12, 49, 50 (illustrative); the Explorer graph is the connected model.
