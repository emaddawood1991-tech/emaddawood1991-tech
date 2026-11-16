import * as THREE from "three";
import { deg } from "./outline.js";

// Polar layout helpers for floors built on the true tower outline (floor 49, floor 50, and any future floor).
// Angles are in degrees (0 = east, 90 = Gulf/sea side, 180 = west, 270 = entrance side). t runs 0 at the core face to 1 at the glass.
// "edge" offsets are metres measured outward from the glass line: negative = inside, positive = beyond the facade (approved projections only).
export function polarKit(F, O, M) {
  const P = { O }, OX = O.OX, OZ = O.OZ, norm = (a) => ((a % 360) + 360) % 360;
  P.T = (a, t, inset = 0) => O.polar(deg(a), t, inset);
  P.face = (a) => Math.atan2(Math.cos(deg(a)), Math.sin(deg(a)));        // rotation.y that makes a piece's front face outward
  P.faceIn = (a) => P.face(a) + Math.PI;
  P.out = (a) => [Math.cos(deg(a)), Math.sin(deg(a))];
  P.tan = (a) => [-Math.sin(deg(a)), Math.cos(deg(a))];
  P.edge = (a, d = 0) => O.pt(deg(a), O.edgeR(deg(a)) + d);              // point on the glass line (d = offset outward)
  // u = metres along the arc (the angle is recomputed at each point because the lobed outline is not a circle), v = metres outward
  P.at = (a, t, u = 0, v = 0) => { let a2 = a; if (u) { const [x0, z0] = P.T(a, t), r = Math.hypot(x0 - OX, z0 - OZ) + v; a2 = a + (u / r) * (180 / Math.PI); } const [x, z] = P.T(a2, t), [ox, oz] = P.out(a2); return [x + ox * v, z + oz * v]; };
  P.eat = (a, d, u = 0, v = 0) => { let a2 = a; if (u) { const [x0, z0] = P.edge(a, d), r = Math.hypot(x0 - OX, z0 - OZ) + v; a2 = a + (u / r) * (180 / Math.PI); } const [x, z] = P.edge(a2, d), [ox, oz] = P.out(a2); return [x + ox * v, z + oz * v]; };
  P.rad = (x, z) => Math.hypot(x - OX, z - OZ);
  P.polyArea = (pts) => { let A = 0; for (let i = 0; i < pts.length; i++) { const [a, b] = pts[i], [c, d] = pts[(i + 1) % pts.length]; A += a * d - c * b; } return Math.abs(A) / 2; };
  P.sectorPts = (a1, a2, t1, t2, n = 40) => { const pts = []; for (let i = 0; i <= n; i++) pts.push(P.T(a1 + ((a2 - a1) * i) / n, t2)); for (let i = n; i >= 0; i--) pts.push(P.T(a1 + ((a2 - a1) * i) / n, t1)); return pts; };
  P.sectorArea = (a1, a2, t1, t2) => P.polyArea(P.sectorPts(a1, a2, t1, t2));
  P.ringArea = (a1, a2, d1, d2) => { const pts = []; for (let i = 0; i <= 40; i++) pts.push(P.edge(a1 + ((a2 - a1) * i) / 40, d2)); for (let i = 40; i >= 0; i--) pts.push(P.edge(a1 + ((a2 - a1) * i) / 40, d1)); return P.polyArea(pts); };

  // a wall that follows a curve pt(a), door gaps are single chords centred on the door angle
  P.chain = (pt, a1, a2, o = {}) => {
    const doors = (o.doors || []).slice().sort((p, q) => p.a - q.a), spans = []; let cur = a1;
    for (const d of doors) { const [x, z] = pt(d.a), r = P.rad(x, z), half = ((d.w / 2 + 0.04) / r) * (180 / Math.PI); spans.push({ a1: cur, a2: d.a - half }); spans.push({ a1: d.a - half, a2: d.a + half, d }); cur = d.a + half; }
    spans.push({ a1: cur, a2 });
    for (const s of spans) {
      if (s.a2 - s.a1 < 0.05) continue;
      if (s.d) { const p = pt(s.a1), q = pt(s.a2), L = Math.hypot(q[0] - p[0], q[1] - p[1]); F.wallA(p[0], p[1], q[0], q[1], { ...o.wall, doors: [{ s: L / 2, w: s.d.w, swing: s.d.swing || 1, name: s.d.name, glass: s.d.glass, leaf: s.d.leaf, h: s.d.h }] }); continue; }
      const [mx, mz] = pt((s.a1 + s.a2) / 2), r = P.rad(mx, mz), n = Math.max(1, Math.ceil(((s.a2 - s.a1) * Math.PI / 180 * r) / (o.step || 1.8)));
      for (let i = 0; i < n; i++) { const p = pt(s.a1 + ((s.a2 - s.a1) * i) / n), q = pt(s.a1 + ((s.a2 - s.a1) * (i + 1)) / n); F.wallA(p[0], p[1], q[0], q[1], o.wall || {}); }
    }
  };
  P.arc = (a1, a2, t, wall = {}, doors = []) => P.chain((a) => P.T(a, t), a1, a2, { wall, doors });                       // wall at constant depth fraction t
  P.glassArc = (a1, a2, d = -0.12, doors = [], wall = {}) => P.chain((a) => P.edge(a, d), a1, a2, { wall: { glass: true, t: 0.1, ...wall }, doors });   // glazing line (doors = terrace doors)
  P.radial = (a, t1, t2, o = {}) => F.radial(deg(a), t1, t2, o);
  P.cross = (a, d1, d2, o = {}) => { const [x1, z1] = P.edge(a, d1), [x2, z2] = P.edge(a, d2); F.wallA(x1, z1, x2, z2, o); };   // wall running across a terrace

  // flat ribbons: strips between two curves (inner then outer, angle increasing) – faces up like F.sector
  P.strip = (a1, a2, pIn, pOut, mat, y = 0.012, step = 1.5) => {
    const n = Math.max(2, Math.ceil(Math.abs(a2 - a1) / step)), pos = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) { const a = a1 + ((a2 - a1) * i) / n; for (const p of [pIn(a), pOut(a)]) { pos.push(p[0], y, p[1]); uv.push(p[0] / 3, p[1] / 3); } }
    for (let i = 0; i < n; i++) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; F.floorG.add(m); return m;
  };
  P.fascia = (a1, a2, d, mat, y0 = -0.4, y1 = 0) => {
    const n = Math.max(2, Math.ceil(Math.abs(a2 - a1) / 1.5)), pos = [], idx = [];
    for (let i = 0; i <= n; i++) { const p = P.edge(a1 + ((a2 - a1) * i) / n, d); pos.push(p[0], y0, p[1], p[0], y1, p[1]); }
    for (let i = 0; i < n; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: mat.color ? mat.color.getHex() : 0xb9b6b0, roughness: 0.9, side: THREE.DoubleSide })); F.floorG.add(m); return m;
  };
  // terrace regions (approved projections beyond the glass line). Items on them are validated against these bands, not the envelope.
  F.terraces = [];
  P.terrace = (name, a1, a2, depth, mat, o = {}) => {
    F.terraces.push({ name, a1: norm(a1), a2: a1 + (a2 - a1), span: a2 - a1, depth });
    P.strip(a1, a2, (a) => P.edge(a, -0.12), (a) => P.edge(a, depth), mat, 0.02); P.strip(a1, a2, (a) => P.edge(a, -0.12), (a) => P.edge(a, depth), new THREE.MeshStandardMaterial({ color: 0xb9b6b0, roughness: 0.95, side: THREE.DoubleSide }), -0.02);
    P.fascia(a1, a2, depth, mat);
    P.chain((a) => P.edge(a, depth - 0.05), a1, a2, { wall: { glass: true, t: 0.05, h: 1.15 } });
  };
  P.onTerrace = (x, z, slack = 0.15) => {
    const a = norm((Math.atan2(z - OZ, x - OX) * 180) / Math.PI), r = P.rad(x, z), e = O.edgeR(deg(a));
    return F.terraces.some((t) => { const d = norm(a - t.a1); return d <= t.span && r >= e - 0.1 && r <= e + t.depth - slack; });
  };
  F.insideFn = (x, z) => O.inside(x, z, 0.35) || P.onTerrace(x, z);


  // glass pool on a terrace: tangent to the facade, searched over angle and length so every corner of its frame sits on the terrace
  P.fitPool = (a0, L0, W, name, TDEP, wiggle = 40) => {
    let best = null;
    for (let L = L0; L >= L0 - 2 && (!best || best.w < 0.12); L -= 0.5) for (let da = -wiggle; da <= wiggle; da += 2) { const a = a0 + da, hl = L / 2 + 0.4, hw = W / 2 + 0.4; for (let d = 0.3; d <= TDEP - 0.15; d += 0.05) { let worst = 1e9; for (const [u, v] of [[-hl, -hw], [hl, -hw], [-hl, hw], [hl, hw], [0, -hw], [0, hw]]) { const [bx, bz] = P.edge(a, d), [tx, tz] = P.tan(a), [ox, oz] = P.out(a), x = bx + tx * u + ox * v, z = bz + tz * u + oz * v, dd = P.rad(x, z) - O.edgeR(Math.atan2(z - OZ, x - OX)); worst = Math.min(worst, dd - 0.02, TDEP - 0.25 - dd); } const ok = worst >= 0.12, better = !best || (ok && !(best.w >= 0.12)) || (ok === (best.w >= 0.12) && (ok ? Math.abs(da) < Math.abs(best.da) || (Math.abs(da) === Math.abs(best.da) && worst > best.w) : worst > best.w)); if (better) best = { w: worst, a, d, L, da }; } }
    const [x, z] = P.eat(best.a, best.d); const pl = F.pool(x, z, best.L, W, { side: -1, name, rot: -(deg(best.a) + Math.PI / 2) }); pl.fit = { a: best.a, d: +best.d.toFixed(2), L: best.L, margin: +best.w.toFixed(2) }; return pl;
  };
  // loungers on either side of a fitted pool (angles derived from the pool's real position and length)
  P.around = (pl, sunbed, planter) => { const [x, z] = P.eat(pl.fit.a, 0), r = P.rad(x, z), k = (m) => (m / r) * (180 / Math.PI); const o = pl.fit.L / 2 + 0.4; sunbed(pl.fit.a - k(o + 1.3), 2.0); sunbed(pl.fit.a + k(o + 1.3), 2.0); sunbed(pl.fit.a - k(o + 2.8), 2.0); sunbed(pl.fit.a + k(o + 2.8), 2.0); if (planter) { planter(pl.fit.a - k(o + 4.2), 2.6); planter(pl.fit.a + k(o + 4.2), 2.6); } };
  // ceiling lights for a wedge room: a grid of downlights
  P.gridPts = (a1, a2, t1, t2, na, nt) => { const out = []; for (let i = 0; i < na; i++) for (let j = 0; j < nt; j++) { const a = a1 + ((a2 - a1) * (i + 0.5)) / na, t = t1 + ((t2 - t1) * (j + 0.5)) / nt, p = P.T(a, t); out.push([p[0], p[1], 0]); } return out; };
  P.room = (key, name, a1, a2, t1, t2, na = 3, nt = 2, inten = 6.5, range = 12) => F.roomPts(key, name, P.gridPts(a1, a2, t1, t2, na, nt), { round: true, inten, range });
  P.sec = (a1, a2, t1, t2, mat, y = 0.012) => F.sector(deg(a1), deg(a2), t1, t2, mat, y);
  return P;
}

// Furniture helpers shared by every outline-based floor. All positions are polar: (angle, depth fraction t, metres along the arc u, metres outward v).
export function polarFurn(F, M, P, H, TI = 0.38) {
  const { box, rbox, cyl } = H, { face, faceIn, at } = P, deg = (d) => (d * Math.PI) / 180;
  const sunbed = (a, d, u = 0) => { const [x, z] = P.eat(a, d, u, 0), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face(a) + Math.PI / 2; F.furn.add(g); rbox(g, 0.75, 0.14, 2.0, 0.05, M.cream, 0, 0.2, 0); const back = rbox(g, 0.75, 0.14, 0.7, 0.05, M.cream, 0, 0.35, -0.75); back.rotation.x = 0.55; for (const sx of [-0.3, 0.3]) for (const sz of [-0.9, 0.9]) cyl(g, 0.02, 0.02, 0.2, M.steel, sx, 0, sz, 6); F.fp("sunbed", x, z, 0.8, 2.0, face(a) + Math.PI / 2); };
  const planter = (a, d) => { const [x, z] = P.eat(a, d); box(F.furn, 1.0, 0.5, 0.4, M.stoneDark, x, 0, z, face(a) + Math.PI / 2); F.plant(x, z, 0.7, 1.1); };
  const wardrobe = (a, t, side, w = 2.0, mat = M.walnut, u0 = 0.42, v0 = 0) => { const s = side > 0 ? 1 : -1, [x, z] = at(a, t, s * u0, v0); F.tall(x, z, s > 0 ? -deg(a) : -deg(a) + Math.PI, w, 0.6, 2.4, mat); };
  const bedroom = (a1, a2, t1, size = "queen", o = {}) => { const am = (a1 + a2) / 2, f = face(am), [bx, bz] = at(am, t1, 0, 1.42); F.bed(bx, bz, f, size); const sp = size === "king" ? 1.4 : 1.22; F.bedside(...at(am, t1, -sp, 0.5), f); F.bedside(...at(am, t1, sp, 0.5), f); F.rug(...at(am, t1, 0, 2.2), 2.4, 2.0, M.cream, f); if (o.arm) F.armchair(...at(am + o.arm, t1, 0, 3.6), faceIn(am + o.arm), M.sage); };
  const living = (a1, a2, t1, o = {}) => {    // distances v measured outward from the inner wall at depth fraction t1
    const am = o.c || (a1 + a2) / 2, f = face(am), fi = faceIn(am), sp = o.sp || 10;
    F.tv(...at(o.tv === undefined ? am : o.tv, t1, 0, t1 === 0 ? 1.0 : 0.5), f, 1.4, true); F.rug(...at(am, t1, 0, 2.7), 3.6, 2.4, M.cream, f); F.coffee(...at(am, t1, 0, 2.7), 0.9, 0.6, true); F.sofa(...at(am, t1, 0, 4.2), fi, o.len || 2.6, M.grey);
    F.armchair(...at(am - sp, t1, 0, 2.9), faceIn(am - sp) - 0.8, M.sage); F.armchair(...at(am + sp, t1, 0, 2.9), faceIn(am + sp) + 0.8, M.rust); F.plant(...at(a1 + 2.5, t1, 0, 5.1), 1.0, 1.6); F.plant(...at(a2 - 2.5, t1, 0, 5.1), 1.0, 1.6);
  };
  const dining = (a, t, n = 6, w = 2.4) => { const [x, z] = at(a, t, 0, 0); F.table(x, z, w, 1.1, { top: M.walnut, rot: face(a) }); F.chairsAround(x, z, w, 1.1, n, face(a), M.cream, { ends: n > 4 }); };
  const kitchen = (a1, a2, o = {}) => { const am = (a1 + a2) / 2, f = face(am), tb = o.tb, run = tb === undefined ? 0 : tb; F.kitchenRun(...at(am, run, 0, run === 0 ? (o.v || 0.95) : 0.5), f, o.len || 2.6, { wallCab: true, hob: 0.5, sink: -0.7 }); F.fridge(...at(a1 + (o.fr || 1.8), run, 0, run === 0 ? 0.8 : 0.55), f); F.island(...at(am, tb === undefined ? TI : tb, 0, tb === undefined ? -1.55 : 2.9), face(am), o.isl || 2.0, 0.9); F.stool(...at(am - 4, tb === undefined ? TI : tb, 0, tb === undefined ? -2.4 : 3.9)); F.stool(...at(am + 4, tb === undefined ? TI : tb, 0, tb === undefined ? -2.4 : 3.9)); };
  const wetPod = (a1, a2, kind, tb = 0, dm = 3.5) => {     // fixtures hug the base wall (depth fraction tb); the pod's far wall is dm metres out
    const am = (a1 + a2) / 2, f = face(am), fi = faceIn(am), fw = (a2 - a1) * Math.PI / 180 * P.rad(...at(am, tb, 0, 1)), uu = Math.min(0.78, fw * 0.3);
    if (kind === "bath") { F.shower(...at(am, tb, -uu, tb === 0 ? 0.8 : 0.68), f, 0.9, 0.9); F.wcSet(...at(am, tb, uu + 0.05, tb === 0 ? 0.68 : 0.52), f); F.basin(...at(am, tb, -uu * 0.6, dm - 0.55), fi, 0.7); }
    if (kind === "walkin") { wardrobe(a1, tb + 0.0, 1, 1.4, M.walnut, 0.45, 1.4); wardrobe(a2, tb + 0.0, -1, 1.4, M.walnut, 0.45, 1.4); F.rug(...at(am, tb, 0, 1.6), 1.2, 1.2, M.cream, f); }
    if (kind === "master") { F.tub(...at(am, tb, 0, tb === 0 ? 1.0 : 0.5), f); F.shower(...at(am, tb, -uu, 2.5), f, 0.9, 0.9); F.wcSet(...at(am, tb, uu + 0.05, dm - 0.5), fi); F.basin(...at(am, tb, -uu * 0.2, dm - 0.55), fi, 0.8); }
  };

  return { sunbed, planter, wardrobe, bedroom, living, dining, kitchen, wetPod };
}
