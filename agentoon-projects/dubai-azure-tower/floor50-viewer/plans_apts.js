import * as THREE from "three";
import { createKit } from "./plans_core.js";
import { addMEP } from "./plans_mep.js";
import { makeOutline, buildShell, deg } from "./outline.js";
import { polarKit, polarFurn } from "./plans_polar.js";

// Floor 50 - three sky residences around a private lift lobby, laid out on the TRUE floor outline of the tower (tower.js ringPoint:
// twist, taper, lobes) via outline.js. Zones, from the core outwards: service band (kitchen, baths, walk-ins) t 0..0.38, corridor ring
// 0.38..0.5, rooms 0.5..1, glass at 1. Terraces + glass pools project 4 m beyond the glass line (approved architectural projections).
// Angles: 0 = east, 90 = Gulf side, 180 = west, 270 = entrance. Conceptual layout - not an engineering design.
export const TERRACE_D = 4.0;
export function buildApts(H) {
  const { box, rbox, cyl, canvasTex, artTex } = H;
  const O = makeOutline(50), kit = createKit(H), M = kit.M, F = kit.floor("apts", 56, 56, { noSlab: true, wallH: 3.6, ceilH: 3.3 });
  buildShell(F, O, H, { M, noGlass: true }); F.O = O;
  const P = polarKit(F, O, M), { T, face, faceIn, at } = P, TD = TERRACE_D;
  const SLAB = new THREE.MeshStandardMaterial({ color: 0xb9b6b0, roughness: 0.95, side: THREE.DoubleSide });
  const fl = (m, ei = 0.35) => { const c = m.clone(); c.envMapIntensity = ei; return c; };
  const wood = fl(M.wood, 0.3), stone = fl(M.stone, 0.4), tile = fl(M.stoneDark, 0.35), carpet = new THREE.MeshStandardMaterial({ color: 0xb7a58f, roughness: 1, envMapIntensity: 0.1 }), deck = new THREE.MeshStandardMaterial({ color: 0xb9a58a, roughness: 0.7, map: M.wood.map, envMapIntensity: 0.3 });
  const board = (txt, p, rot, w, h, bg, fg, fs) => { const t = canvasTex(512, Math.max(64, Math.round((512 * h) / w)), (c, ww, hh) => { c.fillStyle = bg; c.fillRect(0, 0, ww, hh); c.fillStyle = fg; c.font = `600 ${fs || 44}px Georgia,serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, ww / 2, hh / 2); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(p[0], p[1], p[2]); m.rotation.y = rot; F.deco.add(m); };
  const frame = (p, rot, w, h, a, b, c2) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: artTex(a, b, c2), toneMapped: false })); m.position.set(p[0], p[1], p[2]); m.rotation.y = rot; F.deco.add(m); };
  const TI = 0.38, TC = 0.5;                                                   // service-band / corridor-ring depth fractions
  // slab, terraces (projections), floor finishes ---------------------------------------------------------------------------------------------
  F.sector(0, Math.PI * 2, 0, 1, SLAB, -0.02, 0.1);
  P.terrace("3-bedroom terrace", 75, 235, TD, deck); P.terrace("1-bedroom terrace", 235, 305, TD, deck); P.terrace("2-bedroom terrace", 305, 435, TD, deck);
  const sec = P.sec;
  sec(225, 315, 0, TI, stone);                                                               // lift lobby
  sec(235, 305, TI, 1, wood); sec(235, 305 + 0, TI, TI, wood); sec(280, 305, TI, 0.62, tile);                              // 1BR
  sec(175, 235, TI, 1, wood); sec(175, 225, 0, TI, stone); sec(75, 175, TI, TC, stone); sec(125, 175, TC, 1, carpet); sec(75, 125, TC, 1, carpet);  // 3BR living, kitchen, corridor, bedrooms
  sec(75, 175, 0, TI, tile);
  sec(305, 360, TI, 1, wood); sec(315, 360, 0, TI, stone); sec(360, 435, TI, TC, stone); sec(360, 435, TC, 1, carpet); sec(360, 435, 0, TI, tile);  // 2BR
  // party walls + lobby ---------------------------------------------------------------------------------------------------------------
  const PW = { t: 0.2 };
  P.radial(225, 0.02, TI, { ...PW, doors: [{ s: 1.7, w: 1.1, swing: 1, name: "3-bedroom entrance" }] }); P.radial(315, 0.02, TI, { ...PW, doors: [{ s: 1.7, w: 1.1, swing: -1, name: "2-bedroom entrance" }] });
  P.arc(225, 315, TI, { t: 0.2 }, [{ a: 270, w: 1.2, swing: 1, name: "1-bedroom entrance" }]);
  P.radial(235, TI, 1, PW); P.radial(305, TI, 1, PW); P.radial(75, 0.02, 1, PW);
  // lifts (four, on the core face) + signs
  const lifts = []; for (const a of [243, 261, 279, 297]) { const [x, z] = O.pt(deg(a), O.coreR(deg(a)) + 0.12), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face(a); F.walls.add(g); const mk = (px) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.3, 0.05), M.steel); m.position.set(px, 1.15, 0.03); g.add(m); return m; }; box(g, 1.4, 0.12, 0.06, M.brass, 0, 2.4, 0.04); lifts.push({ a: mk(-0.28), b: mk(0.28), k: 0, t: 0 }); F.fp("lift" + a, x, z, 1.3, 0.4, face(a), { wall: true, soft: true }); }
  { const [sx, sz] = at(270, 0, 0, 0.14); board("RESIDENTIAL LIFTS · EXPRESS", [sx, 2.95, sz], face(270), 4.2, 0.36, "#14202e", "#f2e3c6", 26); board("FLOOR 50", [sx, 3.3, sz], face(270), 1.8, 0.3, "#14202e", "#f2e3c6", 40); }
  // ---- 3-BEDROOM -------------------------------------------------------------------------------------------------------------------------
  P.arc(75, 175, TC, {}, [{ a: 87, w: 0.95, swing: 1, name: "3BR bedroom 3 door" }, { a: 112, w: 0.95, swing: 1, name: "3BR bedroom 2 door" }, { a: 150, w: 1.0, swing: 1, name: "3BR master door" }]);
  P.arc(75, 175, TI, {}, [{ a: 87.5, w: 0.85, swing: -1, name: "3BR bath 3 door" }, { a: 112, w: 0.85, swing: -1, name: "3BR bath 2 door" }, { a: 136, w: 0.85, swing: -1, name: "3BR walk-in door" }, { a: 161.5, w: 0.9, swing: -1, name: "3BR master bath door" }]);
  P.radial(175, TC, 1, { t: 0.15 }); P.radial(125, TC, 1, { t: 0.15 }); P.radial(100, TC, 1, { t: 0.15 });
  P.radial(175, 0.02, TI, { t: 0.15 }); P.radial(148, 0.02, TI, { t: 0.15 }); P.radial(125, 0.02, TI, { t: 0.15 }); P.radial(100, 0.02, TI, { t: 0.15 });
  P.arc(175, 225, TI, {}, [{ a: 192, w: 2.4, leaf: false, name: "Kitchen opening" }]);
  // ---- 2-BEDROOM -------------------------------------------------------------------------------------------------------------------------
  P.arc(360, 435, TC, {}, [{ a: 15, w: 0.95, swing: 1, name: "2BR bedroom 2 door" }, { a: 55, w: 1.0, swing: 1, name: "2BR master door" }]);
  P.arc(360, 435, TI, {}, [{ a: 15, w: 0.85, swing: -1, name: "2BR bath door" }, { a: 41, w: 0.85, swing: -1, name: "2BR walk-in door" }, { a: 63.5, w: 0.9, swing: -1, name: "2BR master bath door" }]);
  P.radial(360, TC, 1, { t: 0.15 }); P.radial(390, TC, 1, { t: 0.15 }); P.radial(360, 0.02, TI, { t: 0.15 }); P.radial(390, 0.02, TI, { t: 0.15 }); P.radial(412, 0.02, TI, { t: 0.15 });
  P.arc(315, 360, TI, {}, [{ a: 342, w: 2.2, leaf: false, name: "Kitchen opening" }]);
  // ---- 1-BEDROOM -------------------------------------------------------------------------------------------------------------------------
  P.radial(280, TI, 1, { t: 0.15, doors: [{ s: 4.2, w: 0.95, swing: 1, name: "1BR bedroom door" }] }); P.arc(280, 305, 0.62, {}, [{ a: 293, w: 0.85, swing: -1, name: "1BR bath door" }]);
  // ---- glazing with terrace doors --------------------------------------------------------------------------------------------------------
  const TDOORS = [87, 112, 150, 192, 212, 250, 267, 293, 330, 350, 15, 55].map((a, i) => ({ a: ((a % 360) + 360) % 360, w: 1.5, swing: -1, name: `Terrace door ${i + 1}`, glass: true }));
  P.glassArc(0, 360, -0.12, TDOORS);
  [75, 235, 305].forEach((a) => P.cross(a, -0.1, TD, { glass: true, mat: M.frostGlass, t: 0.06, h: 1.9 }));
  // ---- lights ----------------------------------------------------------------------------------------------------------------------------
  const R = [["lob", "Private lobby", 225, 315, 0.08, 0.34, 6, 2], ["liv3", "3BR · living / dining", 175, 235, 0.44, 0.96, 5, 2], ["kit3", "3BR · kitchen + entry", 178, 222, 0.06, 0.34, 3, 2], ["cor3", "3BR · hall", 78, 172, 0.41, 0.47, 8, 1], ["b3", "3BR · bedroom 3", 75, 100, 0.55, 0.95, 2, 2], ["b2", "3BR · bedroom 2", 100, 125, 0.55, 0.95, 2, 2], ["mas", "3BR · master suite", 125, 175, 0.55, 0.95, 4, 2], ["ba3", "3BR · baths + dressing", 78, 172, 0.08, 0.34, 6, 1],
    ["liv1", "1BR · living / kitchen", 235, 280, 0.44, 0.96, 4, 2], ["bd1", "1BR · bedroom", 280, 305, 0.7, 0.96, 2, 1], ["ba1", "1BR · bath", 280, 305, 0.42, 0.6, 2, 1],
    ["liv2", "2BR · living / kitchen", 305, 360, 0.44, 0.96, 4, 2], ["kit2", "2BR · entry + kitchen", 316, 358, 0.06, 0.34, 3, 2], ["cor2", "2BR · hall", 362, 433, 0.41, 0.47, 6, 1], ["bd2", "2BR · bedroom 2", 360, 390, 0.55, 0.95, 2, 2], ["mas2", "2BR · master bedroom", 390, 435, 0.55, 0.95, 3, 2], ["ba2", "2BR · baths + dressing", 362, 433, 0.08, 0.34, 6, 1]];
  R.forEach(([k, n, a1, a2, t1, t2, na, nt]) => P.room(k, n, a1, a2, t1, t2, na, nt, 6.5, 13));
  const terr = [["ter3", "3BR · terrace", 78, 232], ["ter1", "1BR · terrace", 238, 302], ["ter2", "2BR · terrace", 308, 432]]; terr.forEach(([k, n, a1, a2]) => { const pts = []; for (let a = a1; a <= a2; a += (a2 - a1) / 5) pts.push([...P.edge(a, 2.0), 0]); F.roomPts(k, n, pts, { round: true, inten: 5, range: 14, ceilH: F.CEIL }); });

  const { sunbed, planter, wardrobe, bedroom, living, dining, kitchen, wetPod } = polarFurn(F, M, P, H, TI);
  // 3BR ----------------------------------------------------------------------------------------------------------------------------------
  bedroom(75, 100, 0.52, "queen"); bedroom(100, 125, 0.52, "queen"); bedroom(125, 175, 0.52, "king", { arm: -3 });
  wardrobe(75, 0.68, 1, 1.4); wardrobe(125, 0.68, 1, 1.4); wardrobe(175, 0.68, -1, 2.2); F.desk(...at(112, 0.9, 0, -0.2), faceIn(112), { w: 1.2, d: 0.6, mon: 1, chair: true });
  wetPod(75, 100, "bath"); wetPod(100, 125, "bath"); wetPod(125, 148, "walkin"); wetPod(148, 175, "master");
  living(176, 212, TI, { c: 194, len: 3.0, sp: 9 }); dining(224, 0.8, 6, 2.4);
  kitchen(180, 222); F.cabinet(...at(218, 0.4, 0, 0.3), faceIn(218), 1.2, 0.8, 0.35, M.walnut, { tag: "foyer-console" });
  // 1BR ----------------------------------------------------------------------------------------------------------------------------------
  bedroom(280, 305, 0.68, "queen"); wardrobe(305, 0.8, -1, 1.4); wetPod(280, 305, "bath", TI, 2.3);
  living(254, 279, TI, { c: 266, tv: 264, len: 2.4, sp: 7 }); dining(246, 0.78, 4, 1.8);
  F.kitchenRun(...at(245.5, TI, 0, 0.5), face(245.5), 2.0, { wallCab: true, hob: 0.4, sink: -0.6 }); F.fridge(...at(254.5, TI, 0, 0.5), face(254.5));
  // 2BR ----------------------------------------------------------------------------------------------------------------------------------
  bedroom(360, 390, 0.52, "queen"); bedroom(390, 435, 0.52, "king", { arm: 3 }); wardrobe(360, 0.68, 1, 1.4); wardrobe(435, 0.68, -1, 2.2);
  wetPod(360, 390, "bath"); wetPod(390, 412, "walkin"); wetPod(412, 435, "master");
  living(306, 336, TI, { c: 321, len: 2.8, sp: 9 }); dining(348, 0.78, 4, 2.0);
  kitchen(334, 360, { len: 2.0, isl: 1.6, v: 1.15 });
  // lobby ---------------------------------------------------------------------------------------------------------------------------------
  F.sofa(...at(240, 0.2, 0, 0.5), faceIn(240) + Math.PI, 1.8, M.cream); F.sofa(...at(300, 0.2, 0, 0.5), faceIn(300) + Math.PI, 1.8, M.cream); F.plant(...at(228, 0.3, 0, 0), 1.1, 1.8); F.plant(...at(312, 0.3, 0, 0), 1.1, 1.8);
  F.table(...at(262, 0.26, 0, 0), 0.7, 0.7, { round: true }); F.table(...at(278, 0.26, 0, 0), 0.7, 0.7, { round: true });
  { const [sx, sz] = at(270, TI, 0, 0.12); board("SKY RESIDENCES · FLOOR 50", [sx, 2.6, sz], face(270), 3.6, 0.4, "#14202e", "#f2e3c6", 28); }
  // terraces: pools + loungers -------------------------------------------------------------------------------------------------------------
  const pool = (a, L, W, name) => P.fitPool(a, L, W, name, TD);
  [[155, 8.5, "3-bedroom pool"], [270, 5.5, "1-bedroom pool"], [10, 7.0, "2-bedroom pool"]].forEach(([ang, L, nm], i) => { const pl = pool(ang, L, 2.0, nm); P.around(pl, sunbed, planter); });

  // ---- finish ----------------------------------------------------------------------------------------------------------------------------
  F.finish();
  // MEP routing uses each room's rectangle: give the wedge rooms a bounding box (illustrative routing)
  Object.values(F.rooms).forEach((r) => { if (!r.pts || r.key.startsWith("ter")) return; const xs = r.pts.map((p) => p[0]), zs = r.pts.map((p) => p[1]); r.x1 = Math.min(...xs) - 0.3; r.x2 = Math.max(...xs) + 0.3; r.z1 = Math.min(...zs) - 0.3; r.z2 = Math.max(...zs) + 0.3; });
  addMEP(F, { risers: [{ x: at(236, 0.3)[0], z: at(236, 0.3)[1] }, { x: at(304, 0.3)[0], z: at(304, 0.3)[1] }], blinds: [] });
  { const bm = new THREE.MeshStandardMaterial({ color: 0xd9d2c3, roughness: 0.9, side: THREE.DoubleSide }); for (let a = 0; a < 360; a += 3) { const p = P.edge(a, -0.3), q = P.edge(a + 3, -0.3), L = Math.hypot(q[0] - p[0], q[1] - p[1]), m = new THREE.Mesh(new THREE.BoxGeometry(L - 0.08, 2.4, 0.02), bm); m.position.set((p[0] + q[0]) / 2, F.WALL_H - 1.25, (p[1] + q[1]) / 2); m.rotation.y = Math.atan2(-(q[1] - p[1]), q[0] - p[0]); F.mep.blinds.add(m); } }
  F.liftOn = false; F.liftOpen = (on) => { F.liftOn = on; lifts.forEach((l) => (l.t = on ? 1 : 0)); };
  F.update = (dt) => { F.updateDoors(dt); lifts.forEach((l) => { l.k += (l.t - l.k) * Math.min(1, dt * 3); l.a.position.x = -0.28 - l.k * 0.5; l.b.position.x = 0.28 + l.k * 0.5; }); };
  F.setNight = (k) => F.pools.forEach((p) => p.setNight(k));
  const ar = (a1, a2, t1, t2) => Math.round(P.sectorArea(a1, a2, t1, t2)), tr = (a1, a2) => Math.round(P.ringArea(a1, a2, 0, TD));
  F.units = [{ name: "3-bedroom residence", beds: 3, baths: 3, area: `${ar(75, 235, 0.02, 1) - ar(225, 235, 0.02, TI)} m²`, terrace: `${tr(75, 235)} m²`, pool: F.pools[0] }, { name: "1-bedroom residence", beds: 1, baths: 1, area: `${ar(235, 305, TI, 1)} m²`, terrace: `${tr(235, 305)} m²`, pool: F.pools[1] }, { name: "2-bedroom residence", beds: 2, baths: 2, area: `${ar(305, 435, 0.02, 1) - ar(305, 315, 0.02, TI)} m²`, terrace: `${tr(305, 435)} m²`, pool: F.pools[2] }];
  F.unitPolys = { lobby: [P.sectorPts(225, 315, 0.02, TI)], br1: [P.sectorPts(235, 305, TI, 1)], br3: [P.sectorPts(75, 225, 0.02, 1), P.sectorPts(225, 235, TI, 1)], br2: [P.sectorPts(315, 435, 0.02, 1), P.sectorPts(305, 315, TI, 1)] };
  F.liftPts = [243, 261, 279, 297].map((a) => { const [x, z] = O.pt(deg(a), O.coreR(deg(a)) + 0.12); return { name: "lift " + a, x, z }; });
  F.P = P; F.zones = { lobby: [225, 315], br1: [235, 305], br2: [305, 435], br3: [75, 235] };
  return F;
}
