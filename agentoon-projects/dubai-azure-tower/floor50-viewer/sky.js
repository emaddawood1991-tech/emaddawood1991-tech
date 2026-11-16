import * as THREE from "three";
import { createKit } from "./plans_core.js";
import { makeOutline, buildShell, deg } from "./outline.js";
import { createModels } from "./models.js";

// Azure Sky Restaurant & Café on floor 45, laid out on the true tower outline (conceptual layout).
export function buildSky(H) {
  const { std, canvasTex } = H, kit = createKit(H), M = kit.M, O = makeOutline(45);
  const F = kit.floor("sky45", 56, 56, { noSlab: true, wallH: 3.6, ceilH: 3.4 }); buildShell(F, O, H, { M }); F.ceilMesh.visible = false; F.floorG.children.slice(0, 2).forEach((m) => (m.visible = false));
  const MD = createModels(F, H, M), G = MD.G;
  const T = (a, t, i = 0) => O.polar(deg(a), t, i), face = (a) => Math.atan2(Math.cos(deg(a)), Math.sin(deg(a))), faceIn = (a) => face(a) + Math.PI, CEILH = 3.4;
  const SLAB = new THREE.MeshStandardMaterial({ color: 0xb9b6b0, roughness: 0.95, side: THREE.DoubleSide }), CEILM = new THREE.MeshStandardMaterial({ color: 0xf1ede6, roughness: 0.9, side: THREE.DoubleSide }), WOODC = new THREE.MeshStandardMaterial({ color: 0x8a5f38, roughness: 0.5 });
  const sec = (a1, a2, t1, t2, mat, y = 0.012) => F.sector(deg(a1), deg(a2), t1, t2, mat, y);
  const marble = new THREE.MeshStandardMaterial({ map: M.stone.map, roughness: 0.18, color: 0xe9e2d4, envMapIntensity: 0.55 }), darkMarble = new THREE.MeshStandardMaterial({ map: M.stoneDark.map, roughness: 0.2, envMapIntensity: 0.5 }), woodF = new THREE.MeshStandardMaterial({ map: M.wood.map, roughness: 0.5, envMapIntensity: 0.35 }), carpetF = new THREE.MeshStandardMaterial({ color: 0x7a6a58, roughness: 1, envMapIntensity: 0.15 }), stoneF = new THREE.MeshStandardMaterial({ map: M.stone.map, roughness: 0.3, envMapIntensity: 0.4 }), tileF = std(0xcfd6d5, 0.45, 0, { envMapIntensity: 0.3 });
  F.sector(0, Math.PI * 2, 0, 1, SLAB, -0.02, 0.1); { const m = F.sector(0, Math.PI * 2, 0, 1, CEILM, CEILH, 0.1); F.floorG.remove(m); F.ceil.add(m); }
  // floors: main dining marble with a parquet border at the glass, café wood, VIP carpet, service tile
  sec(62, 199, 0, 0.78, marble); sec(62, 199, 0.78, 1, woodF); sec(199, 240, 0, 1, woodF); sec(240, 262, 0, 1, carpetF); sec(262, 300, 0, 1, stoneF); sec(300, 393, 0, 1, tileF); sec(33, 62, 0, 1, stoneF);
  sec(95, 165, 0.38, 0.52, darkMarble, 0.014);   // inlaid feature band
  // partitions: main|café glass, café|VIP solid with door, VIP|WC, WC|kitchen, kitchen|host with service doors, host|main open arch
  F.radial(deg(199), 0.02, 1, { glass: true, t: 0.08, doors: [{ s: 8.5, w: 1.6, swing: 1, name: "Café opening", glass: true, leaf: false }] });
  F.radial(deg(240), 0.02, 1, { doors: [{ s: 8, w: 1.1, swing: -1, name: "VIP room door" }] });
  F.radial(deg(262), 0.02, 1, { doors: [{ s: 9, w: 1.0, swing: 1, name: "Restrooms door" }] });
  F.radial(deg(300), 0.02, 1, { doors: [{ s: 9, w: 1.1, swing: -1, name: "Staff door" }] });
  F.radial(deg(33 + 360), 0.02, 1, { doors: [{ s: 6, w: 1.4, swing: 1, name: "Kitchen service door" }, { s: 8.0, w: 1.2, swing: -1, name: "Kitchen pass door" }] });
  F.radial(deg(62), 0.55, 1, { glass: true, t: 0.08, doors: [] });
  // ---- lifts + host
  const lifts = []; for (const a of [40, 47, 54]) { const [x, z] = O.pt(deg(a), O.coreR(deg(a)) + 0.12), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face(a); F.walls.add(g); const mk = (px) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.3, 0.05), M.steel); m.position.set(px, 1.15, 0.03); g.add(m); return m; }; lifts.push({ a: mk(-0.28), b: mk(0.28), k: 0, t: 0 }); }
  F.liftOpen = (on) => lifts.forEach((l) => (l.t = on ? 1 : 0));
  { const [x, z] = T(55, 0.55); MD.hostStand(x, z, faceIn(55) + Math.PI); F.plant(...T(36, 0.9), 1.2, 1.9); F.plant(...T(58, 0.92), 1.2, 1.9); const [sx, sz] = T(44, 0.8); F.sofa(sx, sz, faceIn(44) + Math.PI, 2.0, M.cream); }
  // ---- main restaurant 62-199: three rows of dining tables, banquettes, pendants, bar
  const rows = [[0.85, 70, 190, 7.4, 1.1, 4], [0.64, 72, 188, 8.5, 1.15, 4], [0.4, 76, 184, 11, 1.0, 2]];
  rows.forEach(([t, a1, a2, step, w, n]) => { for (let a = a1; a <= a2; a += step) { const [x, z] = T(a, t); MD.diningSet(x, z, face(a), n, w); } });
  for (let a = 70; a < 190; a += 24) { const [x, z] = T(a, 0.62); MD.pendant(x, z, CEILH - 0.04, F.ceil); }
  for (let a = 66; a < 198; a += 22) { const [x, z] = T(a, 0.14); F.cabinet(x, z, faceIn(a) + Math.PI, 1.8, 1.0, 0.45, M.walnut, { tag: "service station" }); }
  [[66, 0.95], [196, 0.95]].forEach(([a, t]) => F.plant(...T(a, t), 1.3, 2.0));
  // ---- café 199-240: coffee counter, espresso, pastry case, lounge chairs, shelves
  { for (let a = 206; a < 232; a += 5) { const p = T(a, 0.32), q = T(a + 5, 0.32), L = Math.hypot(q[0] - p[0], q[1] - p[1]), th = Math.atan2(-(q[1] - p[1]), q[0] - p[0]); const g = new THREE.Mesh(new THREE.BoxGeometry(L, 1.0, 0.7), M.walnut); g.position.set((p[0] + q[0]) / 2, 0.5, (p[1] + q[1]) / 2); g.rotation.y = th; F.furn.add(g); const tp = new THREE.Mesh(new THREE.BoxGeometry(L + 0.04, 0.05, 0.8), M.stone); tp.position.set((p[0] + q[0]) / 2, 1.02, (p[1] + q[1]) / 2); tp.rotation.y = th; F.furn.add(tp); }
    F.fp("coffee bar", ...T(219, 0.32), 14, 0.9, 0, { soft: true }); const [ex, ez] = T(212, 0.27); MD.espresso(ex, 1.05, ez, faceIn(212)); const [ex2, ez2] = T(224, 0.27); MD.espresso(ex2, 1.05, ez2, faceIn(224)); const [px, pz] = T(232, 0.32); MD.pastryCase(px, pz, face(232) + Math.PI / 2, 2.0); const [sx, sz] = T(219, 0.1); MD.shelving(sx, sz, faceIn(219) + Math.PI, 2.0);
    for (let i = 0; i < 4; i++) { const a = 205 + i * 10.6, [x, z] = T(a, 0.7), ux = -Math.sin(deg(a)), uz = Math.cos(deg(a)); F.table(x, z, 0.7, 0.7, { round: true, top: M.stoneDark }); F.armchair(x + 0.95 * ux, z + 0.95 * uz, Math.atan2(-ux, -uz), M.sage); F.armchair(x - 0.95 * ux, z - 0.95 * uz, Math.atan2(ux, uz), M.rust); }
    F.plant(...T(202, 0.92), 1.1, 1.8); F.plant(...T(237, 0.92), 1.1, 1.8); for (let a = 205; a < 236; a += 10) { const [x, z] = T(a, 0.96); } }
  // ---- VIP 240-262
  { const [x, z] = T(251, 0.62); F.table(x, z, 3.0, 1.2, { top: M.walnut, rot: face(251) + Math.PI / 2 }); for (let i = 0; i < 4; i++) { const u = -1.0 + i * 0.67; for (const s of [-1, 1]) { const px = x + Math.cos(deg(251)) * s * 0.9 + (-Math.sin(deg(251))) * u, pz = z + Math.sin(deg(251)) * s * 0.9 + Math.cos(deg(251)) * u; MD.chair(px, pz, s > 0 ? faceIn(251) + Math.PI : face(251) + Math.PI, MD.G.velvet2); } } MD.pendant(x, z, CEILH - 0.04, F.ceil, 0.7); const [bx, bz] = T(250, 0.12); F.cabinet(bx, bz, faceIn(250) + Math.PI, 1.6, 1.0, 0.45, M.walnut, { tag: "VIP service" }); F.plant(...T(257, 0.93), 1.0, 1.7); }
  // ---- WC 262-300 (simple fit-out)
  for (let i = 0; i < 3; i++) { const a = 268 + i * 6, [x, z] = T(a, 0.88); F.wcSet(x, z, face(a) + Math.PI); } for (let i = 0; i < 3; i++) { const a = 286 + i * 4.5, [x, z] = T(a, 0.9); F.basin(x, z, face(a) + Math.PI, 0.8); }
  // ---- kitchen + back of house 300-393: line, prep, dish, storage along the core
  { const [x1, z1] = T(318, 0.7); MD.range(x1, z1, face(318) + Math.PI / 2, 2.4); const [x2, z2] = T(334, 0.7); MD.range(x2, z2, face(334) + Math.PI / 2, 2.4); const [p1x, p1z] = T(326, 0.42); MD.prep(p1x, p1z, face(326) + Math.PI / 2, 2.4); const [p2x, p2z] = T(344, 0.42); MD.prep(p2x, p2z, face(344) + Math.PI / 2, 2.4);
    for (let i = 0; i < 3; i++) { const [x, z] = T(312 + i * 12, 0.14); MD.fridge(x, z, faceIn(312 + i * 12) + Math.PI, 1.4); } for (let i = 0; i < 2; i++) { const [x, z] = T(348 + i * 14, 0.14); MD.shelving(x, z, faceIn(348 + i * 14) + Math.PI, 2.0); }
    const [dx, dz] = T(372, 0.6); MD.dish(dx, dz, face(372) + Math.PI / 2); const [s1x, s1z] = T(358, 0.78); MD.prep(s1x, s1z, face(358) + Math.PI / 2, 2.2); const [s2x, s2z] = T(384, 0.3); MD.shelving(s2x, s2z, faceIn(384) + Math.PI, 2.0);  }
  // coffered slat ceiling detail (radial timber slats) + cove ring
  { const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.06, 0.12), WOODC, 90), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(); let i = 0; for (let a = 66; a < 196; a += 1.5) { const p0 = T(a, 0.12), p1 = T(a, 0.96), L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-(p1[1] - p0[1]), p1[0] - p0[0])); p.set((p0[0] + p1[0]) / 2, CEILH - 0.12, (p0[1] + p1[1]) / 2); s.set(L, 1, 1); m4.compose(p, q, s); if (i < 90) slats.setMatrixAt(i++, m4); } slats.count = i; slats.frustumCulled = false; F.ceil.add(slats); }
  const coveMat = new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffc27a, emissiveIntensity: 0.4 }); { for (let a = 64; a < 196; a += 4) { const p = T(a, 0.97, 0.3), q = T(a + 4, 0.97, 0.3), L = Math.hypot(q[0] - p[0], q[1] - p[1]), b = new THREE.Mesh(new THREE.BoxGeometry(L, 0.05, 0.12), coveMat); b.position.set((p[0] + q[0]) / 2, CEILH - 0.35, (p[1] + q[1]) / 2); b.rotation.y = Math.atan2(-(q[1] - p[1]), q[0] - p[0]); F.ceil.add(b); } }
  // ---- rooms + lights
  const gridPts = (a1, a2, t1, t2, na, nt) => { const out = []; for (let i = 0; i < na; i++) for (let j = 0; j < nt; j++) { const a = a1 + ((a2 - a1) * (i + 0.5)) / na, t = t1 + ((t2 - t1) * (j + 0.5)) / nt, p = T(a, t); out.push([p[0], p[1], 0]); } return out; };
  [["main", "Main restaurant", 62, 199, 0.1, 0.95, 14, 3, 7, 18], ["cafe", "Café", 199, 240, 0.1, 0.95, 5, 2, 6.5, 12], ["vip", "VIP dining", 240, 262, 0.1, 0.95, 3, 2, 6, 10], ["host", "Host + lifts", 33, 62, 0.1, 0.95, 3, 2, 6, 10], ["wc", "Restrooms", 262, 300, 0.1, 0.95, 3, 2, 5, 8], ["boh", "Kitchen + service", 300, 393, 0.1, 0.95, 8, 3, 8, 14]].forEach(([k, n, a1, a2, t1, t2, na, nt, inten, rng]) => F.roomPts(k, n, gridPts(a1, a2, t1, t2, na, nt), { round: k !== "boh", long: k === "boh", inten, range: rng, ceilH: CEILH }));
  const root = new THREE.Group(); root.name = "sky"; root.add(F.g); root.updateMatrixWorld(true); F.items.forEach((it) => it.box.setFromObject(it.g));
  F.mergeStatic(F.furn); F.mergeStatic(F.walls); F.finish();
  const api = { g: root, F, O, items: F.items, doors: F.doors, doorMeshes: F.doorMeshes, rooms: F.rooms, lightsOn: F.lightsOn };
  api.setDoors = (o) => F.setDoors(o); api.setLight = (k, on) => F.setLight(k, on); api.setAllLights = (on) => F.setAllLights(on); api.liftOpen = F.liftOpen; api.check = () => F.check(); api.fade = (op) => F.fade(op);
  api.decorOn = false; api.setDecor = (on) => { api.decorOn = on; G.warm.emissiveIntensity = on ? 2.2 : 0.15; coveMat.emissiveIntensity = on ? 1.6 : 0.4; };
  api.update = (dt) => { F.updateDoors(dt); lifts.forEach((l) => { l.k += (l.t - l.k) * Math.min(1, dt * 3); l.a.position.x = -0.28 - l.k * 0.5; l.b.position.x = 0.28 + l.k * 0.5; }); };
  api.ceil = F.ceil; api.furn = F.furn; api.floorG = F.floorG; api.walls = F.walls;
  return api;
}
