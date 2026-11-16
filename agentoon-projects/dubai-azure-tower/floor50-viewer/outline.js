import * as THREE from "three";
import { ringPoint, TP, floorZ } from "./tower.js";

// True floor outline of the twisting tri-lobed tower at a given floor, in plan coordinates centred on the tower axis
// (axis = (OX, OZ), x east, z toward the Gulf). Star-shaped, so any point is described by (angle, radius).
export const OX = 27, OZ = 27;
const TOP = floorZ(50) + TP.floorH, hf = (z) => Math.max(0, Math.min(1, z / TOP)), radiusAt = (z) => TP.R * (1 - TP.taper * hf(z)), twistAt = (z) => ((TP.twist * Math.PI) / 180) * Math.pow(hf(z), TP.twistExp);
const norm = (a) => { a = a % (Math.PI * 2); return a < 0 ? a + Math.PI * 2 : a; };

export function makeOutline(f) {
  const z = floorZ(f) + 1.5, N = 720, edge = [], core = [];
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2, p = ringPoint(z, th), x = OX - p.x, zz = OZ + p.y; edge.push([norm(Math.atan2(zz - OZ, x - OX)), Math.hypot(x - OX, zz - OZ)]);
    const rc = 0.29 * radiusAt(z) * (1 + 0.52 * Math.max(0, Math.cos(3 * th)) + 0.12 * Math.cos(3 * th)), a = th + twistAt(z), cx = OX - rc * Math.cos(a), cz = OZ + rc * Math.sin(a); core.push([norm(Math.atan2(cz - OZ, cx - OX)), Math.hypot(cx - OX, cz - OZ)]);
  }
  edge.sort((a, b) => a[0] - b[0]); core.sort((a, b) => a[0] - b[0]);
  const look = (T, a) => { a = norm(a); let lo = 0, hi = T.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m][0] <= a) lo = m; else hi = m; } const A = T[lo], B = T[hi]; if (a <= A[0]) { const P = T[T.length - 1]; const span = A[0] + Math.PI * 2 - P[0]; return P[1] + ((A[1] - P[1]) * (a + Math.PI * 2 - P[0])) / span; } if (a >= B[0]) { const Q = T[0]; const span = Q[0] + Math.PI * 2 - B[0]; return B[1] + ((Q[1] - B[1]) * (a - B[0])) / span; } return A[1] + ((B[1] - A[1]) * (a - A[0])) / (B[0] - A[0] || 1); };
  const O = { f, z, OX, OZ, edgeR: (a) => look(edge, a), coreR: (a) => look(core, a) };
  O.pt = (a, r) => [OX + Math.cos(a) * r, OZ + Math.sin(a) * r];
  O.polar = (a, t, inset = 0) => { const c = O.coreR(a) + 0.15, e = O.edgeR(a) - inset; return O.pt(a, c + (e - c) * t); };       // t: 0 at the core, 1 at the glass
  O.inside = (x, zz, inset = 0.3) => { const r = Math.hypot(x - OX, zz - OZ), a = Math.atan2(zz - OZ, x - OX); return r < O.edgeR(a) - inset && r > O.coreR(a) + 0.1; };
  O.ring = (n = 144, fn = O.edgeR, inset = 0) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return O.pt(a, fn(a) - inset); });
  O.area = () => { let A = 0, B = 0; for (let i = 0; i < 720; i++) { const a = (i / 720) * Math.PI * 2; A += 0.5 * O.edgeR(a) ** 2 * ((Math.PI * 2) / 720); B += 0.5 * O.coreR(a) ** 2 * ((Math.PI * 2) / 720); } return { plate: A, core: B, net: A - B }; };
  return O;
}
export const deg = (d) => (d * Math.PI) / 180;

// build the architectural shell on a plan-kit floor F (created with noSlab): slab, core, curved panoramic glass, ceiling
export function buildShell(F, O, H, opt = {}) {
  const { M } = opt, WALL_H = F.WALL_H, CEIL = F.CEIL, { std } = H;
  const mk = (geo, mat, grp, y = 0) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.receiveShadow = true; grp.add(m); return m; };
  const fan = (pts, y, up = true) => { const pos = [OX, y, OZ]; pts.forEach(([x, z]) => pos.push(x, y, z)); const idx = []; for (let i = 0; i < pts.length; i++) idx.push(0, 1 + i, 1 + ((i + 1) % pts.length)); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const uv = []; for (let i = 0; i < pos.length; i += 3) uv.push(pos[i] / 4, pos[i + 2] / 4); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); return g; };
  const ribbon = (pts, y0, y1) => { const pos = [], idx = []; pts.forEach(([x, z]) => pos.push(x, y0, z, x, y1, z)); for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length, a = i * 2, b = j * 2; idx.push(a, b, a + 1, a + 1, b, b + 1); } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; };
  const edge = O.ring(180, O.edgeR, 0.05), coreP = O.ring(120, O.coreR, 0), slabMat = std(0xaaa7a0, 0.95);
  // slab (below the finish level), core block, glass wall, head/sill rails + mullions, ceiling
  const slab = mk(fan(edge, -0.02), slabMat, F.floorG); slab.material = std(0xb9b6b0, 0.95); const sideG = ribbon(edge, -0.4, 0); mk(sideG, new THREE.MeshStandardMaterial({ color: 0xb9b6b0, roughness: 0.95, side: THREE.DoubleSide }), F.floorG);
  const coreMat = opt.coreMat || M.core; const coreClad = new THREE.MeshStandardMaterial({ color: 0x4a413a, roughness: 0.55, side: THREE.DoubleSide, envMapIntensity: 0.5 }); const coreSide = mk(ribbon(coreP, 0, WALL_H), coreClad, F.walls); const coreTop = mk(fan(coreP, WALL_H), new THREE.MeshStandardMaterial({ color: 0xcfc9bf, roughness: 0.9, side: THREE.DoubleSide }), F.walls);
  const glassPts = O.ring(240, O.edgeR, 0.12), glass = mk(ribbon(glassPts, 0.05, WALL_H), M.glass, F.glassG); glass.material.side = THREE.DoubleSide;
  const frameM = M.frame; for (const [y, h] of [[0, 0.07], [WALL_H - 0.07, 0.07]]) mk(ribbon(O.ring(240, O.edgeR, 0.1), y, y + h), new THREE.MeshStandardMaterial({ color: 0xc9a25a, roughness: 0.3, metalness: 1, side: THREE.DoubleSide }), F.walls);
  for (let i = 0; i < 240; i += 3) { const [x, z] = glassPts[i], [x2, z2] = glassPts[(i + 1) % 240], th = Math.atan2(-(z2 - z), x2 - x); const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, WALL_H, 0.12), frameM); b.position.set(x, WALL_H / 2, z); b.rotation.y = th; F.walls.add(b); }
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.95, side: THREE.DoubleSide }); const ceilM = mk(fan(O.ring(180, O.edgeR, 0.1), CEIL), ceilMat, F.ceil);
  // core ceiling cap is part of the ceiling fan, so the core is hidden in plan views via the wall materials only
  F.insideFn = (x, z) => O.inside(x, z, 0.35);
  F.ceilMesh = ceilM; F.outline = O;
  // sector floor finish (annular strip between two angles / depth fractions)
  F.sector = (a1, a2, t1, t2, mat, y = 0.012, inset = 0.12) => { const n = Math.max(2, Math.ceil(Math.abs(a2 - a1) / deg(1.5))), pos = [], uv = [], idx = []; for (let i = 0; i <= n; i++) { const a = a1 + ((a2 - a1) * i) / n; for (const t of [t1, t2]) { const [x, z] = O.polar(a, t, t >= 0.99 ? inset : 0); pos.push(x, y, z); uv.push(x / 3, z / 3); } } for (let i = 0; i < n; i++) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; F.floorG.add(m); return m; };
  F.radial = (a, t1, t2, o = {}) => { const [x1, z1] = O.polar(a, t1), [x2, z2] = O.polar(a, t2, t2 >= 0.99 ? 0.12 : 0); F.wallA(x1, z1, x2, z2, o); return [x1, z1, x2, z2]; };
  F.arcWall = (a1, a2, t, o = {}) => { const n = Math.max(1, Math.ceil(Math.abs(a2 - a1) / deg(4))); for (let i = 0; i < n; i++) { const A = a1 + ((a2 - a1) * i) / n, B = a1 + ((a2 - a1) * (i + 1)) / n, p = O.polar(A, t), q = O.polar(B, t); F.wallA(p[0], p[1], q[0], q[1], { ...o, doors: o.doors && o.doors.filter((d) => d.i === i).map((d) => ({ ...d, s: d.s })) }); } };
  // room with lights at given plan points
  F.roomPts = (key, name, pts, o = {}) => { const mat = new THREE.MeshStandardMaterial({ color: 0xb8b2a8, emissive: 0xffd9a0, emissiveIntensity: 0.03, roughness: 0.4 }); const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length; const pl = new THREE.PointLight(0xffd8a8, 0, o.range || 15, 2); pl.position.set(cx, CEIL - 0.5, cz); F.g.add(pl); const ceilH = o.ceilH || CEIL; const inst = new THREE.InstancedMesh(o.round ? new THREE.CylinderGeometry(0.09, 0.09, 0.02, 14) : new THREE.BoxGeometry(o.long ? 1.4 : 0.6, 0.02, 0.2 * (o.long ? 1 : 3)), mat, pts.length); const m4 = new THREE.Matrix4(); pts.forEach(([x, z, r], i) => { m4.makeRotationY(r || 0).setPosition(x, ceilH - 0.03, z); inst.setMatrixAt(i, m4); }); inst.frustumCulled = false; (o.grp || F.ceil).add(inst); F.rooms[key] = { key, name, mat, pl, base: o.inten || 7, x1: cx, z1: cz, x2: cx, z2: cz, cx, cz, pts }; F.lightsOn[key] = false; return F.rooms[key]; };
  return F;
}
