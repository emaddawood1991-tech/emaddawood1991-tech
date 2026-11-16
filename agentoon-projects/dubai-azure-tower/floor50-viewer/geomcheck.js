import { ringPoint, TP, floorZ } from "./tower.js";
import { makeOutline, getTowerFloorFootprint, OX, OZ } from "./outline.js";

// Reusable architectural geometry validation. Everything is measured against the tower's own geometry (tower.js ringPoint: twist, taper, lobes),
// never against the interior layout. Works for any floor built with outline.js / plans_polar.js (floor 49, 50, wellness 10/11, sky 45, future floors).
export const TOL = { envelope: 0.12, wall: 0.1, outline: 0.06, rotationDeg: 0.5, elevation: 0.01, lift: 0.3, step: 0.45, shaft: 3.4 };
const norm = (a) => ((a % 360) + 360) % 360, ang = (x, z) => Math.atan2(z - OZ, x - OX), rad = (x, z) => Math.hypot(x - OX, z - OZ);

// independent edge radius at plan angle a (radians) straight from tower.js: densely sample ringPoint at the floor's height
function skinRadiusTable(z, N = 1440) {
  const pts = []; for (let i = 0; i < N; i++) { const p = ringPoint(z, (i / N) * Math.PI * 2), x = OX - p.x, zz = OZ + p.y; pts.push([Math.atan2(zz - OZ, x - OX), Math.hypot(x - OX, zz - OZ)]); }
  pts.sort((a, b) => a[0] - b[0]);
  return (a) => { a = Math.atan2(Math.sin(a), Math.cos(a)); let lo = 0, hi = pts.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m][0] <= a) lo = m; else hi = m; } const A = pts[lo], B = pts[hi]; if (a < pts[0][0] || a > pts[pts.length - 1][0]) return Math.max(pts[0][1], pts[pts.length - 1][1]); return A[1] + ((B[1] - A[1]) * (a - A[0])) / (B[0] - A[0] || 1); };
}

// ---------------------------------------------------------------- per-floor checks
export function validateFloor(F, floor, opt = {}) {
  const O = F.O || F.outline || makeOutline(floor), issues = [], add = (type, tag, detail) => issues.push({ type, tag, detail }), stats = {};
  const terr = F.terraces || [], onTerr = (x, z) => { const a = norm((ang(x, z) * 180) / Math.PI), r = rad(x, z), e = O.edgeR(ang(x, z)); return terr.some((t) => norm(a - t.a1) <= t.span && r >= e - 0.15 && r <= e + t.depth + 0.05); };
  const inEnv = (x, z, tol) => { const a = ang(x, z), r = rad(x, z); return r <= O.edgeR(a) + tol && r >= O.coreR(a) - 0.12; };
  // 1  elevation + outline identity vs the tower
  if (O.f !== floor) add("elevation", `floor ${floor}`, `outline built for floor ${O.f}`);
  if (Math.abs(O.z - (floorZ(floor) + 1.5)) > TOL.elevation) add("elevation", `floor ${floor}`, `outline z ${O.z} != floorZ+1.5 ${floorZ(floor) + 1.5}`);
  if (F.CEIL !== undefined && F.CEIL + 0.4 > TP.floorH + 1e-6) add("elevation", `floor ${floor}`, `ceiling ${F.CEIL} + slab 0.4 exceeds storey height ${TP.floorH}`);
  const skin = skinRadiusTable(O.z); let worstEdge = 0; for (let k = 0; k < 360; k += 5) { const a = (k * Math.PI) / 180, d = Math.abs(O.edgeR(a) - skin(a)); worstEdge = Math.max(worstEdge, d); }
  stats.edgeVsTower = +worstEdge.toFixed(3); if (worstEdge > TOL.outline) add("rotation", `floor ${floor}`, `interior outline differs from tower facade by ${worstEdge.toFixed(3)} m (rotation/scale)`);
  const twistExpect = (TP.twist * Math.pow(Math.max(0, Math.min(1, O.z / (floorZ(TP.floors) + TP.floorH))), TP.twistExp)); const fp = getTowerFloorFootprint(floor); stats.twistDeg = +fp.twistDeg.toFixed(2);
  if (Math.abs(fp.twistDeg - twistExpect) > TOL.rotationDeg) add("rotation", `floor ${floor}`, `twist ${fp.twistDeg.toFixed(2)}° expected ${twistExpect.toFixed(2)}°`);
  // 2  furniture / fixtures: every corner inside the envelope or on an approved terrace
  let nItems = 0, nTerr = 0;
  (F.reg || []).forEach((r) => { nItems++; const out = r.pts.filter(([x, z]) => (r.wall ? rad(x, z) > O.edgeR(ang(x, z)) + TOL.envelope : !inEnv(x, z, TOL.envelope))); if (!out.length) return; if (out.every(([x, z]) => onTerr(x, z))) { nTerr++; return; } { add("outside-envelope", r.tag, `@${r.cx.toFixed(1)},${r.cz.toFixed(1)} ${out.length}/${r.pts.length} corners outside the tower footprint`); issues[issues.length - 1].pts = r.pts; } });
  stats.items = nItems; stats.itemsOnTerraces = nTerr;
  // 3  walls: every wall rectangle inside the footprint (terrace cross walls / balustrades are glass and not registered)
  let nWalls = 0; (F.wallRects || []).forEach((w) => { nWalls++; const pts = w.pts || [[w.x1, w.z1], [w.x2, w.z1], [w.x2, w.z2], [w.x1, w.z2]], out = pts.filter(([x, z]) => !inEnv(x, z, TOL.wall) && !onTerr(x, z)); if (out.length) { const ex = Math.max(...out.map(([x, z]) => rad(x, z) - O.edgeR(ang(x, z)))); add("wall-outside", "wall", `@${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)} ${out.length} corner(s) beyond the facade (max ${ex.toFixed(2)} m)`); } }); stats.walls = nWalls;
  // 4  collisions reported by the plan kit (overlaps, items in walls, door swings blocked)
  if (F.check) F.check().forEach((s) => add(s.startsWith("overlap") ? "overlap" : s.startsWith("in-wall") ? "in-wall" : s.startsWith("outside") ? "outside-envelope" : "door-swing", s.split(" ")[1] || "", s));
  // 5  units / apartments: disjoint, inside the plate, covering it
  if (F.unitPolys) {
    const names = Object.keys(F.unitPolys), inPoly = (poly, x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
    let multi = 0, none = 0, tot = 0; const hits = {};
    for (let i = 0; i < 6000; i++) { const a = Math.random() * Math.PI * 2, r = O.coreR(a) + 0.4 + Math.random() * (O.edgeR(a) - O.coreR(a) - 0.8), x = OX + Math.cos(a) * r, z = OZ + Math.sin(a) * r, h = names.filter((n) => F.unitPolys[n].some((p) => inPoly(p, x, z))); tot++; if (h.length > 1) { multi++; h.forEach((n) => (hits[n] = (hits[n] || 0) + 1)); } if (!h.length) none++; }
    stats.unitOverlapPct = +((100 * multi) / tot).toFixed(2); stats.unitGapPct = +((100 * none) / tot).toFixed(2);
    if (multi / tot > 0.002) add("unit-overlap", names.join("/"), `${((100 * multi) / tot).toFixed(2)}% of the plate belongs to more than one unit`);
    if (none / tot > 0.02) add("unit-gap", names.join("/"), `${((100 * none) / tot).toFixed(2)}% of the plate belongs to no unit`);
  }
  // 6  lifts: doors on the core face, in the lobby
  (F.liftPts || []).forEach((l) => { const a = ang(l.x, l.z), dr = Math.abs(rad(l.x, l.z) - (O.coreR(a) + 0.12)); if (dr > TOL.lift) add("lift-misaligned", l.name, `door is ${dr.toFixed(2)} m from the core face`); });
  stats.issues = issues.length; return { floor, name: F.name, issues, stats };
}

// ---------------------------------------------------------------- vertical stack checks (whole building, floors 1..50)
export function validateStack(floors = Array.from({ length: TP.floors }, (_, i) => i + 1)) {
  const issues = [], add = (type, tag, detail) => issues.push({ type, tag, detail }), stats = {}; let prev = null, maxStep = 0, maxTwistStep = 0, minCore = 1e9, worstShaft = 0;
  const shaftR = TOL.shaft;
  for (const f of floors) {
    const O = makeOutline(f); let core = 1e9; for (let k = 0; k < 360; k += 3) core = Math.min(core, O.coreR((k * Math.PI) / 180));
    minCore = Math.min(minCore, core); if (core < shaftR) add("shaft", `floor ${f}`, `core radius ${core.toFixed(2)} m < lift-shaft zone ${shaftR} m`);
    // the central shaft zone must lie inside the slab and inside the core on every floor
    const skin = skinRadiusTable(O.z, 720); for (let k = 0; k < 360; k += 6) { const a = (k * Math.PI) / 180, d = Math.abs(O.edgeR(a) - skin(a)); worstShaft = Math.max(worstShaft, d); if (O.edgeR(a) > skin(a) + TOL.outline) add("slab-protrudes", `floor ${f}`, `slab edge ${(O.edgeR(a) - skin(a)).toFixed(3)} m beyond the facade at ${k}°`); }
    if (prev) { let st = 0; for (let k = 0; k < 360; k += 6) { const a = (k * Math.PI) / 180; st = Math.max(st, Math.abs(O.edgeR(a) - prev.O.edgeR(a))); } maxStep = Math.max(maxStep, st); const tw = Math.abs(getTowerFloorFootprint(f).twistDeg - prev.tw); maxTwistStep = Math.max(maxTwistStep, tw); const k = (floorZ(f) - floorZ(f - 1)) / TP.floorH; if (st > TOL.step * k) add("continuity", `floor ${f - 1}→${f}`, `outline jumps ${st.toFixed(2)} m between consecutive floors`); if (tw > 2.5 * k) add("rotation", `floor ${f - 1}→${f}`, `twist step ${tw.toFixed(2)}°`); }
    prev = { O, tw: getTowerFloorFootprint(f).twistDeg };
  }
  stats.minCoreRadius = +minCore.toFixed(2); stats.maxOutlineStep = +maxStep.toFixed(3); stats.maxTwistStepDeg = +maxTwistStep.toFixed(2); stats.worstSlabVsFacade = +worstShaft.toFixed(3);
  return { issues, stats };
}

// neighbours of a floor: outline + core agreement with the floors directly below and above
export function neighbourReport(f) {
  const out = []; for (const g of [f - 1, f + 1]) { if (g < 1 || g > TP.floors) continue; const A = makeOutline(f), B = makeOutline(g); let e = 0, c = 0; for (let k = 0; k < 360; k += 4) { const a = (k * Math.PI) / 180; e = Math.max(e, Math.abs(A.edgeR(a) - B.edgeR(a))); c = Math.max(c, Math.abs(A.coreR(a) - B.coreR(a))); } out.push({ floor: g, maxEdgeDelta: +e.toFixed(3), maxCoreDelta: +c.toFixed(3), twistDelta: +Math.abs(getTowerFloorFootprint(f).twistDeg - getTowerFloorFootprint(g).twistDeg).toFixed(2) }); }
  return out;
}
