import * as THREE from "three";
import { createKit } from "./plans_core.js";
import { addMEP } from "./plans_mep.js";
import { makeOutline, buildShell, deg } from "./outline.js";
import { polarKit, polarFurn } from "./plans_polar.js";

// Floor 49 - the sky penthouse, laid out on the TRUE floor outline of the tower (same single source of truth as floor 50 and the amenity floors).
// Zones from the core outwards: service band (laundry, powder, walk-in, baths) t 0..0.38, then rooms at the glass. Terraces and the glass pool
// project TERRACE_D beyond the glass line (approved architectural projections). Angles: 0 east, 90 Gulf side, 180 west, 270 entrance.
// Conceptual layout - not an engineering design.
export const PENT_TERRACE_D = 4.0;
export function buildPent(H) {
  const { box, rbox, cyl, canvasTex, artTex } = H;
  const O = makeOutline(49), kit = createKit(H), M = kit.M, F = kit.floor("pent", 56, 56, { noSlab: true, wallH: 3.6, ceilH: 3.3 });
  buildShell(F, O, H, { M, noGlass: true }); F.O = O;
  const P = polarKit(F, O, M), { face, faceIn, at } = P, TD = PENT_TERRACE_D, TI = 0.38;
  const SLAB = new THREE.MeshStandardMaterial({ color: 0xb9b6b0, roughness: 0.95, side: THREE.DoubleSide });
  const fl = (m, ei = 0.35) => { const c = m.clone(); c.envMapIntensity = ei; return c; };
  const wood = fl(M.wood, 0.3), stone = fl(M.stone, 0.45), tile = fl(M.stoneDark, 0.35), carpet = new THREE.MeshStandardMaterial({ color: 0xb7a58f, roughness: 1, envMapIntensity: 0.1 }), deck = new THREE.MeshStandardMaterial({ color: 0xb9a58a, roughness: 0.7, map: M.wood.map, envMapIntensity: 0.3 });
  const board = (txt, p, rot, w, h, bg, fg, fs) => { const t = canvasTex(512, Math.max(64, Math.round((512 * h) / w)), (c, ww, hh) => { c.fillStyle = bg; c.fillRect(0, 0, ww, hh); c.fillStyle = fg; c.font = `600 ${fs || 44}px Georgia,serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, ww / 2, hh / 2); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(p[0], p[1], p[2]); m.rotation.y = rot; F.deco.add(m); };
  const frame = (p, rot, w, h, a, b, c2) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: artTex(a, b, c2), toneMapped: false })); m.position.set(p[0], p[1], p[2]); m.rotation.y = rot; F.deco.add(m); };
  const { sunbed, planter, wardrobe, bedroom, living, dining, kitchen, wetPod } = polarFurn(F, M, P, H, TI), sec = P.sec;

  // slab, terraces, floor finishes ---------------------------------------------------------------------------------------------------------
  F.sector(0, Math.PI * 2, 0, 1, SLAB, -0.02, 0.1);
  P.terrace("Main terrace + pool", 340, 455, TD, deck); P.terrace("Master terrace", 95, 180, TD, deck); P.terrace("Guest + lounge terrace", 180, 250, TD, deck);
  sec(250, 290, 0, TI, stone); sec(250, 290, TI, 1, stone);                                   // lift lobby + foyer
  sec(290, 345, TI, 1, stone); sec(290, 345, 0, TI, tile);                                    // kitchen, laundry + powder
  sec(345, 455, 0, 1, wood);                                                                  // living, dining, reading
  sec(95, 180, TI, 1, carpet); sec(95, 180, 0, TI, tile);                                     // master suite
  sec(180, 220, TI, 1, carpet); sec(180, 220, 0, TI, tile); sec(220, 250, 0, 1, wood);        // guest suite, lounge
  // walls -----------------------------------------------------------------------------------------------------------------------------------
  const PW = { t: 0.2 };
  P.radial(250, 0.02, 1, { ...PW, doors: [{ s: 6.2, w: 1.1, swing: 1, name: "Lounge door" }] }); P.radial(290, 0.02, 1, { ...PW, doors: [{ s: 6.2, w: 1.1, swing: -1, name: "Kitchen door" }] });
  P.arc(250, 290, TI, { t: 0.2 }, [{ a: 270, w: 1.4, swing: 1, name: "Penthouse entrance" }]);
  P.radial(345, TI, 1, { t: 0.2, doors: [{ s: 4.2, w: 3.0, leaf: false, name: "Kitchen opening" }] });
  P.arc(290, 345, TI, {}, [{ a: 304, w: 0.85, swing: -1, name: "Laundry door" }, { a: 331, w: 0.85, swing: -1, name: "Powder room door" }]); P.radial(318, 0.02, TI, { t: 0.15 });
  P.radial(95, 0.02, 1, { ...PW, doors: [{ s: 5.6, w: 1.2, swing: 1, name: "Master suite door" }] });
  P.arc(95, 180, TI, {}, [{ a: 111.5, w: 0.9, swing: -1, name: "Walk-in door" }, { a: 154, w: 1.0, swing: -1, name: "Master bath door" }]); P.radial(128, 0.02, TI, { t: 0.15 });
  P.radial(180, 0.02, 1, { ...PW, doors: [{ s: 6.0, w: 1.0, swing: 1, name: "Guest suite door" }] });
  P.arc(180, 220, TI, {}, [{ a: 200, w: 0.9, swing: -1, name: "Guest ensuite door" }]);
  P.radial(220, 0.02, 1, { ...PW, doors: [{ s: 6.0, w: 1.0, swing: -1, name: "Guest suite / lounge door" }] });
  // lifts + signs
  const lifts = []; for (const a of [262, 278]) { const [x, z] = O.pt(deg(a), O.coreR(deg(a)) + 0.12), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face(a); F.walls.add(g); const mk = (px) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.3, 0.05), M.steel); m.position.set(px, 1.15, 0.03); g.add(m); return m; }; box(g, 1.4, 0.12, 0.06, M.brass, 0, 2.4, 0.04); lifts.push({ a: mk(-0.28), b: mk(0.28), k: 0, t: 0 }); F.fp("lift" + a, x, z, 1.3, 0.4, face(a), { wall: true, soft: true }); }
  { const [sx, sz] = at(270, 0, 0, 0.14); board("PRIVATE PENTHOUSE LIFTS", [sx, 2.95, sz], face(270), 3.0, 0.34, "#14202e", "#f2e3c6", 26); board("FLOOR 49", [sx, 3.3, sz], face(270), 1.8, 0.3, "#14202e", "#f2e3c6", 40); }
  // glazing with terrace doors (none on the foyer / kitchen side)
  const TDOORS = [12, 35, 58, 82, 112, 140, 168, 200, 235].map((a, i) => ({ a, w: 1.8, swing: -1, name: `Terrace door ${i + 1}`, glass: true }));
  P.glassArc(0, 360, -0.12, TDOORS);
  [95, 180, 250, 340].forEach((a) => P.cross(a, -0.1, TD, { glass: true, mat: M.frostGlass, t: 0.06, h: 1.9 }));
  // lights
  const R = [["lob", "Private lift lobby", 250, 290, 0.08, 0.34, 3, 2], ["foy", "Foyer", 252, 288, 0.44, 0.96, 4, 2], ["kit", "Kitchen", 292, 343, 0.44, 0.96, 4, 2], ["svc", "Laundry + powder", 292, 343, 0.08, 0.34, 4, 1],
    ["liv", "Living room", 347, 25, 0.1, 0.96, 6, 3], ["din", "Dining + reading", 25, 93, 0.1, 0.96, 6, 3], ["mas", "Master bedroom", 97, 178, 0.44, 0.96, 6, 2], ["mwi", "Walk-in + master bath", 97, 178, 0.08, 0.34, 6, 1], ["gue", "Guest bedroom", 182, 218, 0.44, 0.96, 3, 2], ["gba", "Guest ensuite", 182, 218, 0.08, 0.34, 2, 1], ["lng", "Family lounge", 222, 248, 0.1, 0.96, 3, 3]];
  R.forEach(([k, n, a1, a2, t1, t2, na, nt]) => P.room(k, n, a1 < a2 ? a1 : a1 - 360, a2, t1, t2, na, nt, 6.5, 14));
  [["terA", "Main terrace + pool", 345, 450], ["terB", "Master terrace", 98, 177], ["terC", "Guest + lounge terrace", 183, 247]].forEach(([k, n, a1, a2]) => { const pts = []; for (let a = a1; a <= a2; a += (a2 - a1) / 6) pts.push([...P.edge(a, 2.0), 0]); F.roomPts(k, n, pts, { round: true, inten: 5, range: 14 }); });

  // furniture -------------------------------------------------------------------------------------------------------------------------------
  // lobby + foyer
  F.plant(...at(255, 0.27, 0, 0), 0.9, 1.7); F.plant(...at(285, 0.27, 0, 0), 0.9, 1.7); F.table(...at(270, 0.27, 0, 0), 0.7, 0.7, { round: true });
  F.cabinet(...at(258, TI, 0, 0.35), face(258), 1.4, 0.8, 0.35, M.walnut, { tag: "foyer-console" }); { const [mx, mz] = at(258, TI, 0, 0.17); F.mirror(mx, 1.6, mz, face(258), 1.2, 1.5); }
  F.cabinet(...at(282, TI, 0, 0.35), face(282), 1.4, 0.8, 0.35, M.walnut, { tag: "foyer-console2" }); F.armchair(...at(270, 0.62, 0, 0), faceIn(270), M.sage); F.table(...at(270, 0.78, 0, 0), 0.9, 0.9, { round: true }); F.plant(...at(254, 0.9, 0, 0), 1.2, 1.9); F.plant(...at(286, 0.9, 0, 0), 1.2, 1.9);
  { const [sx, sz] = at(270, TI, 0, 0.12); board("SKY PENTHOUSE · FLOOR 49", [sx, 2.6, sz], face(270), 3.4, 0.4, "#14202e", "#f2e3c6", 28); }
  // kitchen (run on the core-side wall of the kitchen room) + laundry + powder room
  kitchen(293, 343, { tb: TI, len: 3.2, isl: 2.6, fr: 3.0 });
  { const [wx, wz] = at(297, 0.18, 0, 0.8); F.cabinet(wx, wz, face(297), 0.9, 0.9, 0.7, M.steel, { tag: "washer" }); F.cabinet(...at(305.5, 0.18, 0, 0.8), face(305.5), 0.9, 0.9, 0.7, M.steel, { tag: "dryer" }); const [cx, cz] = at(313, 0.3, 0, 0); cyl(F.furn, 0.32, 0.32, 1.4, M.steel, cx, 0, cz, 28); F.fp("hot-water cylinder", cx, cz, 0.7, 0.7, 0); }
  F.wcSet(...at(331, 0.1, -0.5, 0.55), face(331)); F.basin(...at(331, 0.1, 0.55, 0.65), face(331), 0.6);
  // living + dining + reading corner
  living(350, 31, 0.0, { c: 10, tv: 8, len: 3.4, sp: 11 }); dining(52, 0.7, 8, 3.0); F.cabinet(...at(52, 0.36, 0, 0.3), face(52), 2.0, 0.8, 0.4, M.walnut, { tag: "sideboard" });
  F.armchair(...at(86, 0.78, 0, 0), faceIn(86) + 0.5, M.sage); F.side(...at(86, 0.74, 1.1, 0), true); F.armchair(...at(76, 0.88, 0, 0), faceIn(76) - 0.4, M.rust);
  // master suite
  bedroom(95, 180, TI, "king", { arm: 14 }); wardrobe(95, 0.86, 1, 1.8); wardrobe(180, 0.86, -1, 1.8); F.sofa(...at(137.5, TI, 0, 5.6), faceIn(137.5), 1.8, M.cream);
  wetPod(95, 128, "walkin"); wetPod(128, 180, "master");
  // guest suite + ensuite
  bedroom(180, 220, TI, "queen"); wardrobe(220, 0.86, -1, 1.4); wetPod(180, 220, "bath");
  // family lounge / study
  { const f = face(235); F.tv(...at(235, 0, 0, 1.15), f, 1.2, true); F.rug(...at(235, 0, 0, 2.7), 2.6, 2.0, M.cream, f); F.coffee(...at(235, 0, 0, 2.6), 0.8, 0.5, true); F.sofa(...at(235, 0, 0, 4.0), faceIn(235), 2.2, M.grey); F.desk(...at(227, 0.84, 0, 0), faceIn(227), { w: 1.4, d: 0.65, mon: 1, chair: true }); }
  // terrace: pool + loungers
  const pool = (a, L, W, name) => P.fitPool(a, L, W, name, TD);
  { const pl = pool(30, 11, 2.2, "Penthouse glass pool"); P.around(pl, sunbed, planter); }

  F.finish();
  Object.values(F.rooms).forEach((r) => { if (!r.pts || r.key.startsWith("ter")) return; const xs = r.pts.map((p) => p[0]), zs = r.pts.map((p) => p[1]); r.x1 = Math.min(...xs) - 0.3; r.x2 = Math.max(...xs) + 0.3; r.z1 = Math.min(...zs) - 0.3; r.z2 = Math.max(...zs) + 0.3; });
  addMEP(F, { risers: [{ x: at(246, 0.3)[0], z: at(246, 0.3)[1] }, { x: at(294, 0.3)[0], z: at(294, 0.3)[1] }], blinds: [] });
  { const bm = new THREE.MeshStandardMaterial({ color: 0xd9d2c3, roughness: 0.9, side: THREE.DoubleSide }); for (let a = 0; a < 360; a += 3) { const p = P.edge(a, -0.3), q = P.edge(a + 3, -0.3), L = Math.hypot(q[0] - p[0], q[1] - p[1]), m = new THREE.Mesh(new THREE.BoxGeometry(L - 0.08, 2.4, 0.02), bm); m.position.set((p[0] + q[0]) / 2, F.WALL_H - 1.25, (p[1] + q[1]) / 2); m.rotation.y = Math.atan2(-(q[1] - p[1]), q[0] - p[0]); F.mep.blinds.add(m); } }
  F.liftOn = false; F.liftOpen = (on) => { F.liftOn = on; lifts.forEach((l) => (l.t = on ? 1 : 0)); };
  F.update = (dt) => { F.updateDoors(dt); lifts.forEach((l) => { l.k += (l.t - l.k) * Math.min(1, dt * 3); l.a.position.x = -0.28 - l.k * 0.5; l.b.position.x = 0.28 + l.k * 0.5; }); };
  F.setNight = (k) => F.pools.forEach((p) => p.setNight(k));
  F.unitPolys = { lobbyFoyer: [P.sectorPts(250, 290, 0.02, 1)], kitchen: [P.sectorPts(290, 345, 0.02, 1)], living: [P.sectorPts(345, 455, 0.02, 1)], master: [P.sectorPts(95, 180, 0.02, 1)], guest: [P.sectorPts(180, 220, 0.02, 1)], lounge: [P.sectorPts(220, 250, 0.02, 1)] };
  F.liftPts = [262, 278].map((a) => { const [x, z] = O.pt(deg(a), O.coreR(deg(a)) + 0.12); return { name: "lift " + a, x, z }; });
  F.P = P; F.zones = { foyer: [250, 290], kitchen: [290, 345], living: [345, 455], master: [95, 180], guest: [180, 220], lounge: [220, 250] };
  F.areas = { total: Math.round(O.area().net), living: Math.round(P.sectorArea(345, 455, 0.02, 1)), master: Math.round(P.sectorArea(95, 180, 0.02, 1)), terrace: Math.round(P.ringArea(340, 455, 0, TD) + P.ringArea(95, 250, 0, TD)) };
  return F;
}
