import * as THREE from "three";
import { createKit } from "./plans_core.js";
import { makeOutline, buildShell, deg } from "./outline.js";
import { createModels } from "./models.js";

// Azure Wellness & Fitness Club: floors 10 + 11 on the true tower outline (conceptual layout, not engineered).
// Level 10: reception, changing, spa, double-height pool hall, double-height gymnastics hall, mobility lounge.
// Level 11: weightlifting gym, cardio, functional rim overlooking the two voids (the slab openings need structural approval).
export function buildWellness(H) {
  const { std, canvasTex } = H, kit = createKit(H), M = kit.M, O = makeOutline(10), H1 = 4.0, VOID_H = 7.55;
  const mkLevel = (name, y) => { const F = kit.floor(name, 56, 56, { noSlab: true, wallH: 3.6, ceilH: 3.3 }); buildShell(F, O, H, { M }); F.g.position.y = y; return F; };
  const L10 = mkLevel("wellness10", 0), L11 = mkLevel("wellness11", H1);
  const root = new THREE.Group(); root.name = "wellness"; root.add(L10.g, L11.g);
  // hide the shell's full-plate slab/ceiling: both levels build their slab/ceiling from sectors so voids can be cut
  [L10, L11].forEach((F) => { F.ceilMesh.visible = false; F.floorG.children.slice(0, 2).forEach((m) => (m.visible = false)); });
  const T = (a, t, i = 0) => O.polar(deg(a), t, i), face = (a) => Math.atan2(Math.cos(deg(a)), Math.sin(deg(a))), faceIn = (a) => face(a) + Math.PI;
  const soft = (m, k = 0.3) => { const c = m.clone(); c.envMapIntensity = k; return c; };   // grazing-angle reflections wash out dark floors, so floor finishes use a low environment strength
  const fl = { stone: soft(M.stone, 0.5), wood: soft(M.wood, 0.35), vinyl: M.vinyl, carpet: soft(M.carpetWarm, 0.2), rubber: std(0x3d3f45, 1, 0, { envMapIntensity: 0.12 }), turf: std(0x2f6a35, 1, 0, { envMapIntensity: 0.15 }), stoneDark: soft(M.stoneDark, 0.4), tile: soft(std(0xdfe6e5, 0.35), 0.4) };
  // double-height glass in the void sectors
  const voidGlass = (a1, a2) => { const n = Math.ceil((a2 - a1) / 2), pts = []; for (let i = 0; i <= n; i++) pts.push(T(a1 + ((a2 - a1) * i) / n, 1, 0.12)); const pos = [], idx = []; pts.forEach(([x, z]) => pos.push(x, 3.55, z, x, VOID_H, z)); for (let i = 0; i < pts.length - 1; i++) { const a = i * 2, b = (i + 1) * 2; idx.push(a, b, a + 1, a + 1, b, b + 1); } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, M.glass); m.material.side = THREE.DoubleSide; L10.glassG.add(m); for (let i = 0; i < pts.length; i += 2) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, VOID_H - 3.55, 0.14), M.frame); b.position.set(pts[i][0], (3.55 + VOID_H) / 2, pts[i][1]); L10.walls.add(b); } };
  const ceilSector = (F, a1, a2, y, mat) => { const m = F.sector(deg(a1), deg(a2), 0.0, 1, mat, y, 0.1); m.material = mat; F.floorG.remove(m); F.ceil.add(m); return m; };
  const CEIL_M = new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.95, side: THREE.DoubleSide }), SLAB_M = new THREE.MeshStandardMaterial({ color: 0xb9b6b0, roughness: 0.95, side: THREE.DoubleSide });
  const secF = (F, a1, a2, t1, t2, mat, y) => F.sector(deg(a1), deg(a2), t1, t2, mat, y);
  const sectorPts = (a1, a2, t1, t2, n = 24) => { const o = [], b = []; for (let i = 0; i <= n; i++) { o.push(T(a1 + ((a2 - a1) * i) / n, t2, 0.12)); b.push(T(a2 - ((a2 - a1) * i) / n, t1, 0)); } return [...o, ...b]; };
  const floorHole = (F, a1, a2, t1, t2, mat, hole, y = 0.012) => { const pts = sectorPts(a1, a2, t1, t2), s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))); s.holes.push(new THREE.Path(hole.map(([x, z]) => new THREE.Vector2(x, -z)))); const g = new THREE.ShapeGeometry(s); const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, g.attributes.position.getX(i) / 3, g.attributes.position.getY(i) / 3); const m = new THREE.Mesh(g, mat); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; F.floorG.add(m); return m; };

  // ================================================================= LEVEL 10
  const A = L10, MD = createModels(A, H, M), G = MD.G;
  // slab + ceilings by sector: pool hall 40..125 and gymnastics hall 125..190 are double height
  for (const [a1, a2, dh] of [[190, 400, 0], [125, 190, 1]]) { A.sector(deg(a1), deg(a2), 0, 1, SLAB_M, -0.02, 0.1); ceilSector(A, a1, a2, dh ? VOID_H : 3.3, CEIL_M); } ceilSector(A, 40, 125, VOID_H, CEIL_M);
  voidGlass(40, 190);
  // floors
  secF(A, 250, 290, 0, 1, fl.stone, 0.012); secF(A, 290, 330, 0, 1, fl.tile, 0.012); secF(A, 330, 348, 0, 1, fl.wood, 0.012); secF(A, 348, 400, 0, 1, fl.wood, 0.012); secF(A, 348, 375, 0, 0.5, fl.carpet, 0.014); secF(A, 190, 250, 0, 1, fl.wood, 0.012);
  secF(A, 125, 190, 0, 1, std(0x8d9097, 1, 0, { envMapIntensity: 0.15 }), 0.012);                         // gymnastics hall: sprung grey floor under the mats
  // pool hall deck with the basin cut out
  const PC = T(82, 0.5), tdir = [-Math.sin(deg(82)), Math.cos(deg(82))], PL = 17, PW = 6.5, prot = Math.atan2(-tdir[1], tdir[0]), ax = [Math.cos(prot), -Math.sin(prot)], az = [Math.sin(prot), Math.cos(prot)];
  const pc = (u, v) => [PC[0] + ax[0] * u + az[0] * v, PC[1] + ax[1] * u + az[1] * v], hole = [pc(-PL / 2, -PW / 2), pc(PL / 2, -PW / 2), pc(PL / 2, PW / 2), pc(-PL / 2, PW / 2)];
  floorHole(A, 40, 125, 0, 1, new THREE.MeshStandardMaterial({ color: 0xe3ddd0, roughness: 0.4, envMapIntensity: 0.5 }), hole); floorHole(A, 40, 125, 0, 1, SLAB_M, hole, -0.02);
  const poolG = new THREE.Group(); poolG.position.set(PC[0], 0, PC[1]); poolG.rotation.y = prot; A.g.add(poolG);
  const tileTex = canvasTex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "#5ec6d6"); gr.addColorStop(1, "#1f8ba6"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; for (let i = 0; i <= 16; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, h); g.moveTo(0, i * 16); g.lineTo(w, i * 16); g.stroke(); } });
  const poolFloorM = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.3 }), poolWallM = std(0x4aaec2, 0.3);
  const DEPTH = 1.5; const mkBox = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.receiveShadow = true; poolG.add(m); return m; };
  mkBox(PL, 0.05, PW, poolFloorM, 0, -DEPTH, 0); for (const s of [-1, 1]) { mkBox(PL, DEPTH, 0.1, poolWallM, 0, -DEPTH / 2, s * (PW / 2)); mkBox(0.1, DEPTH, PW, poolWallM, s * (PL / 2), -DEPTH / 2, 0); mkBox(PL + 0.5, 0.06, 0.28, std(0xcfd2d4, 0.35, 0.8), 0, -0.03, s * (PW / 2 + 0.14)); mkBox(0.28, 0.06, PW, std(0xcfd2d4, 0.35, 0.8), s * (PL / 2 + 0.14), -0.03, 0); }
  // caustics (moving light pattern on the pool floor) + animated water: two ripple layers with sky reflections
  const causticTex = canvasTex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2; for (let k = 0; k < 40; k++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); } }); causticTex.wrapS = causticTex.wrapT = THREE.RepeatWrapping; causticTex.repeat.set(5, 2);
  const caustic = new THREE.Mesh(new THREE.PlaneGeometry(PL, PW), new THREE.MeshBasicMaterial({ map: causticTex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); caustic.rotation.x = -Math.PI / 2; caustic.position.y = -DEPTH + 0.03; poolG.add(caustic);
  const bump = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#808080"; g.fillRect(0, 0, w, h); for (let i = 0; i < 220; i++) { const x = Math.random() * w, y = Math.random() * h, r = 5 + Math.random() * 22, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.4)"); gr.addColorStop(1, "rgba(128,128,128,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); } }); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; const bump2 = bump.clone(); bump2.needsUpdate = true; bump2.repeat.set(3, 1.4); bump.repeat.set(4, 1.8);
  const waterA = new THREE.MeshPhysicalMaterial({ color: 0x1b93b0, roughness: 0.04, metalness: 0.0, transparent: true, opacity: 0.62, bumpMap: bump, bumpScale: 0.6, emissive: 0x2fd2ff, emissiveIntensity: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.8, depthWrite: false });
  const waterB = new THREE.MeshStandardMaterial({ color: 0x7fe0f0, roughness: 0.05, transparent: true, opacity: 0.18, bumpMap: bump2, bumpScale: 0.8, depthWrite: false, envMapIntensity: 1.5 });
  const w1 = new THREE.Mesh(new THREE.PlaneGeometry(PL, PW), waterA), w2 = new THREE.Mesh(new THREE.PlaneGeometry(PL, PW), waterB); for (const [m, y] of [[w1, -0.09], [w2, -0.085]]) { m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = 3; poolG.add(m); }
  const uwMat = new THREE.MeshBasicMaterial({ color: 0x7ff3ff }), uwI = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 10, 8), uwMat, 16), m4 = new THREE.Matrix4(); for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { m4.setPosition(-PL / 2 + 1 + i * 2.2, -0.8, s * (PW / 2 - 0.08)); uwI.setMatrixAt(i * 2 + (s > 0 ? 1 : 0), m4); } poolG.add(uwI);
  const poolLights = [new THREE.PointLight(0x35d9ff, 0, 10, 2), new THREE.PointLight(0x35d9ff, 0, 10, 2)]; poolLights.forEach((l, i) => { l.position.set((i ? 1 : -1) * PL * 0.25, -0.6, 0); poolG.add(l); });
  // cove light strips around the pool hall ceiling + linear ceiling lights (pool light group)
  const coveMat = new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffc27a, emissiveIntensity: 0.15 }); const coveG = new THREE.Group(); A.g.add(coveG); { const pts = []; for (let i = 0; i <= 28; i++) pts.push(T(40 + (85 * i) / 28, 0.97, 0.25)); for (let i = 0; i < pts.length - 1; i++) { const [x, z] = pts[i], [x2, z2] = pts[i + 1], L = Math.hypot(x2 - x, z2 - z), th = Math.atan2(-(z2 - z), x2 - x); const b = new THREE.Mesh(new THREE.BoxGeometry(L, 0.06, 0.12), coveMat); b.position.set((x + x2) / 2, VOID_H - 0.5, (z + z2) / 2); b.rotation.y = th; coveG.add(b); } for (let k = 0; k < 10; k++) { const a = 48 + k * 7.5, p = T(a, 0.3), q = T(a, 0.9), L = Math.hypot(q[0] - p[0], q[1] - p[1]), b = new THREE.Mesh(new THREE.BoxGeometry(L, 0.05, 0.1), coveMat); b.position.set((p[0] + q[0]) / 2, VOID_H - 0.04, (p[1] + q[1]) / 2); b.rotation.y = Math.atan2(-(q[1] - p[1]), q[0] - p[0]); coveG.add(b); } }
  // pool hall furniture: loungers along the glass, seating, plants, feature wall
  for (let i = 0; i < 9; i++) { const a = 48 + i * 8, [x, z] = T(a, 0.9); MD.poolLounger(x, z, faceIn(a) + Math.PI); }
  for (let i = 0; i < 4; i++) { const a = 52 + i * 18, [x, z] = T(a, 0.8); A.table(x, z, 0.7, 0.7, { round: true, top: M.stoneDark }); }
  [[60, 0.12], [105, 0.12], [118, 0.6], [44, 0.6]].forEach(([a, t]) => { const [x, z] = T(a, t); A.plant(x, z, 1.2, 2.0); });
  // ---- gymnastics hall (double height)
  const gh = [[132, 0.55, 5, 3.2], [150, 0.55, 5, 3.2], [168, 0.55, 5, 3.2], [140, 0.25, 4, 2.6], [160, 0.25, 4, 2.6], [180, 0.4, 4, 2.4]];
  gh.forEach(([a, t, w, d], i) => { const [x, z] = T(a, t); MD.mat(x, z, w, d, faceIn(a) + (i % 2 ? 0.3 : 0), i % 2 ? MD.G.blueMat : MD.G.greyMat); });
  [[137, 0.8], [166, 0.8]].forEach(([a, t]) => { const [x, z] = T(a, t); MD.rings(x, z, faceIn(a), 6.9); });
  { const [x, z] = T(152, 0.88); MD.pullups(x, z, face(152) + Math.PI / 2 * 0); } { const [x, z] = T(184, 0.82); MD.pullups(x, z, face(184) + Math.PI); } { const [x, z] = T(128, 0.2); MD.plyo(x, z, faceIn(128)); } { const [x, z] = T(176, 0.2); MD.kettlebells(x, z, faceIn(176)); } { const [x, z] = T(188, 0.38); MD.ballRack(x, z, faceIn(188)); }
  // ---- mobility lounge (190-250): stretching mats + juice bar
  for (let i = 0; i < 4; i++) { const a = 198 + i * 11, [x, z] = T(a, 0.62); MD.mat(x, z, 1.8, 0.7, faceIn(a), i % 2 ? MD.G.greyMat : MD.G.blueMat); }
  { const [x, z] = T(226, 0.9); A.sofa(x, z, faceIn(226) + Math.PI, 2.2, M.cream); A.coffee(...T(226, 0.76), 0.9, 0.55); A.plant(...T(205, 0.95), 1.1, 1.8); A.plant(...T(246, 0.9), 1.1, 1.8); { const [bx, bz] = T(236, 0.28); A.reception(bx, bz, faceIn(236) + Math.PI, 2.6); } }
  // ---- reception (250-290) + lifts on the core
  { const [x, z] = T(270, 0.45); A.reception(x, z, faceIn(270) + Math.PI, 3.6, {}); const [sx, sz] = T(256, 0.8); A.sofa(sx, sz, faceIn(256) + Math.PI, 2.2, M.cream); const [tx, tz] = T(284, 0.8); A.sofa(tx, tz, faceIn(284) + Math.PI, 2.2, M.cream); A.plant(...T(252, 0.95), 1.2, 1.9); A.plant(...T(288, 0.95), 1.2, 1.9); }
  const lifts = []; for (const a of [258, 266, 274, 282]) { const [x, z] = O.pt(deg(a), O.coreR(deg(a)) + 0.12), ry = face(a), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; A.walls.add(g); const mk = (px) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.3, 0.05), M.steel); m.position.set(px, 1.15, 0.03); g.add(m); return m; }; lifts.push({ a: mk(-0.28), b: mk(0.28), k: 0, t: 0 }); }
  A.liftOpen = (on) => lifts.forEach((l) => (l.t = on ? 1 : 0));
  // ---- changing rooms (290-330): lockers, benches, showers; separated by radial walls with doors
  A.radial(deg(290) === 0 ? 0 : 290 * Math.PI / 180, 0.02, 1, { doors: [{ s: 6, w: 1.2, swing: 1, name: "Changing rooms entrance", glass: false }] });
  A.radial(310 * Math.PI / 180, 0.02, 1, {});
  A.radial(330 * Math.PI / 180, 0.02, 1, { doors: [{ s: 6, w: 1.2, swing: -1, name: "Spa entrance", glass: true }] });
  for (const [a0, nm] of [[290, "M"], [310, "W"]]) { for (const t of [0.3, 0.62]) { const a = a0 + 10, [x, z] = T(a, t); MD.lockers(x, z, face(a) + Math.PI, 5); } for (let i = 0; i < 2; i++) { const a = a0 + 8 + i * 8, [x, z] = T(a, 0.5); MD.bench2(x, z, face(a) + Math.PI / 2, 1.8); } for (let i = 0; i < 3; i++) { const a = a0 + 5 + i * 5.5, [x, z] = T(a, 0.92); A.shower(x, z, face(a) + Math.PI, 1.0, 1.0); } }
  // ---- spa (330-400): reception, 4 treatment rooms (outer ring), relaxation lounge, sauna, steam
  { const [x, z] = T(339, 0.5); A.reception(x, z, faceIn(339) + Math.PI, 2.4); A.plant(...T(334, 0.9), 1.2, 1.9); }
  const trAngles = [350, 363, 376, 389];
  trAngles.forEach((a, i) => { const [x, z] = T(a + 6.5, 0.78); MD.massage(x, z, faceIn(a) + Math.PI / 2 + 0.2); A.radial(a * Math.PI / 180, 0.5, 1, {}); const p = T(a, 0.5), q = T(a + 13, 0.5), L = Math.hypot(q[0] - p[0], q[1] - p[1]); A.wallA(p[0], p[1], q[0], q[1], { doors: [{ s: L / 2, w: 0.9, swing: 1, name: `Treatment room ${i + 1} door` }] }); });
  A.radial(402 * Math.PI / 180, 0.5, 1, {}); A.radial(350 * Math.PI / 180, 0.02, 0.5, {});
  for (let i = 0; i < 3; i++) { const a = 354 + i * 6, [x, z] = T(a, 0.3); MD.lounger(x, z, faceIn(a) + Math.PI, i % 2 ? MD.G.velvet : MD.G.velvet2); } A.plant(...T(379, 0.55), 1.1, 1.7); A.plant(...T(356, 0.5), 1.0, 1.5);
  { const [x, z] = T(383, 0.2); MD.sauna(x, z, face(383), 3.0, 2.5); const [sx, sz] = T(399, 0.2); MD.steam(sx, sz, face(398), 2.4, 2.2); }
  // ---- rooms with lights (points inside the sector)
  const gridPts = (a1, a2, t1, t2, na, nt) => { const out = []; for (let i = 0; i < na; i++) for (let j = 0; j < nt; j++) { const a = a1 + ((a2 - a1) * (i + 0.5)) / na, t = t1 + ((t2 - t1) * (j + 0.5)) / nt, p = T(a, t); out.push([p[0], p[1], 0]); } return out; };
  const R10 = [["rec", "Reception + lifts", 250, 290, 0.1, 0.95, 3, 3], ["chg", "Changing rooms", 290, 330, 0.1, 0.95, 5, 3], ["spa", "Spa + treatment", 330, 400, 0.1, 0.95, 8, 3], ["mob", "Mobility lounge", 190, 250, 0.1, 0.95, 6, 3], ["pool", "Pool hall", 40, 125, 0.1, 0.95, 8, 3], ["gym10", "Gymnastics hall", 125, 190, 0.1, 0.95, 6, 3]];
  R10.forEach(([k, n, a1, a2, t1, t2, na, nt]) => A.roomPts(k, n, gridPts(a1, a2, t1, t2, na, nt), { round: true, ceilH: k === "pool" || k === "gym10" ? VOID_H : 3.3, inten: 6, range: k === "pool" || k === "gym10" ? 22 : 14 }));
  // ================================================================= LEVEL 11 (gym, cardio, rim)
  const B = L11, MB = createModels(B, H, M);
  const solid = [[190, 250], [250, 400]]; // level 11 has floor everywhere except the two voids and the stair opening
  for (const [a1, a2] of [[190, 214], [232, 400]]) { B.sector(deg(a1), deg(a2), 0, 1, SLAB_M, -0.02, 0.1); ceilSector(B, a1, a2, 3.3, CEIL_M); }
  // rim walkway around the voids: floor ring t 0.80..1 over 40-190 and glass balustrade on its inner edge
  B.sector(deg(40), deg(190), 0.82, 1, SLAB_M, -0.02, 0.1); B.sector(deg(40), deg(190), 0.82, 1, fl.wood, 0.012); ceilSector(B, 40, 190, 3.3, CEIL_M);
  const bal = (a1, a2, t) => { const n = Math.ceil((a2 - a1) / 3); for (let i = 0; i < n; i++) { const p = T(a1 + ((a2 - a1) * i) / n, t), q = T(a1 + ((a2 - a1) * (i + 1)) / n, t), L = Math.hypot(q[0] - p[0], q[1] - p[1]), th = Math.atan2(-(q[1] - p[1]), q[0] - p[0]); const g = new THREE.Mesh(new THREE.BoxGeometry(L, 1.0, 0.03), M.glass); g.position.set((p[0] + q[0]) / 2, 0.55, (p[1] + q[1]) / 2); g.rotation.y = th; B.glassG.add(g); const r = new THREE.Mesh(new THREE.BoxGeometry(L, 0.05, 0.07), M.brass); r.position.set((p[0] + q[0]) / 2, 1.07, (p[1] + q[1]) / 2); r.rotation.y = th; B.walls.add(r); } };
  bal(40, 190, 0.82);
  // gym floors
  secF(B, 250, 400, 0, 1, fl.rubber, 0.012); secF(B, 190, 214, 0, 1, fl.rubber, 0.012); secF(B, 232, 250, 0, 1, fl.rubber, 0.012); secF(B, 330, 400, 0.3, 1, fl.wood, 0.013);
  // mirror wall on the core
  for (let a = 252; a < 396; a += 12) { const p = O.pt(deg(a), O.coreR(deg(a)) + 0.22), q = O.pt(deg(a + 12), O.coreR(deg(a + 12)) + 0.22); MB.mirror(p[0], p[1], q[0], q[1]); }
  // weightlifting zone 252-330: racks, platforms, benches, dumbbells, cables, leg presses, machines
  [258, 276, 294, 312].forEach((a, i) => { const [x, z] = T(a, 0.2); MB.squatRack(x, z, faceIn(a)); const [px, pz] = T(a, 0.58); MB.platform(px, pz, faceIn(a)); });
  [[267, 0.4], [303, 0.4]].forEach(([a, t]) => { const [x, z] = T(a, t); MB.bench(x, z, faceIn(a) + Math.PI / 2); const [bx, bz] = T(a + 4, t); MB.bench(bx, bz, faceIn(a) + Math.PI / 2); });
  [[254, 0.78], [270, 0.8], [286, 0.8]].forEach(([a, t]) => { const [x, z] = T(a, t); MB.dumbbells(x, z, face(a) + Math.PI); });
  { const [x, z] = T(300, 0.82); MB.cable(x, z, face(300) + Math.PI); const [cx, cz] = T(322, 0.82); MB.cable(cx, cz, face(322) + Math.PI); }
  [[316, 0.45], [324, 0.45]].forEach(([a, t]) => { const [x, z] = T(a, t); MB.legPress(x, z, faceIn(a)); });
  ["Chest press", "Lat pulldown", "Shoulder press", "Seated row", "Leg extension", "Leg curl"].forEach((n, i) => { const a = 192 + i * 3.6, [x, z] = T(206 + i * 0.001, 0.2); });
  [[194, 0.3], [200, 0.55], [206, 0.3], [212, 0.55], [236, 0.3], [242, 0.55]].forEach(([a, t], i) => { const [x, z] = T(a, t); MB.machine(x, z, faceIn(a), ["Chest press", "Lat pulldown", "Shoulder press", "Seated row", "Leg extension", "Leg curl"][i]); });
  // cardio rim 330-400: treadmills + bikes + rowers facing the glass
  for (let i = 0; i < 8; i++) { const a = 334 + i * 3.4, [x, z] = T(a, 0.88); MB.treadmill(x, z, face(a)); }
  for (let i = 0; i < 6; i++) { const a = 336 + i * 4.4, [x, z] = T(a, 0.64); MB.bike(x, z, face(a)); }
  for (let i = 0; i < 4; i++) { const a = 358 + i * 9, [x, z] = T(a, 0.34); MB.rower(x, z, faceIn(a)); }
  for (let i = 0; i < 3; i++) { const a = 5 + i * 9, [x, z] = T(a, 0.55); MB.mat(x, z, 1.8, 0.7, faceIn(a)); const [px, pz] = T(a, 0.9); }
  { const [x, z] = T(240, 0.45); MB.kettlebells(x, z, faceIn(240)); const [bx, bz] = T(246, 0.8); MB.ballRack(bx, bz, faceIn(246)); }
  // functional rim 40-190: pull-up rigs along the walkway
  [[60, 0.91], [95, 0.91], [140, 0.91]].forEach(([a, t]) => { const [x, z] = T(a, t); MB.pullups(x, z, face(a) + Math.PI + Math.PI / 2 * 0); });
  // stair opening handrail + stair (24 steps rising 4 m toward the glass)
  { const stair = new THREE.Group(); A.g.add(stair); const a0 = 223, p0 = T(a0, 0.12), p1 = T(a0, 0.86), dx = p1[0] - p0[0], dz = p1[1] - p0[1], Ls = Math.hypot(dx, dz), th = Math.atan2(-dz, dx), n = 24; for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(Ls / n + 0.02, 0.12, 1.8), M.wood); const u = (i + 0.5) / n; m.position.set(p0[0] + dx * u, (i + 1) * (H1 / n) - 0.06, p0[1] + dz * u); m.rotation.y = th; stair.add(m); } stair.position.y = 0; A.stair = stair; }
  const R11 = [["w11", "Weightlifting gym", 190, 330, 0.1, 0.95, 8, 3], ["c11", "Cardio + functional", 330, 400, 0.1, 0.95, 6, 3], ["r11", "Rim walkway + functional", 40, 190, 0.84, 0.98, 10, 1]];
  R11.forEach(([k, n, a1, a2, t1, t2, na, nt]) => B.roomPts(k, n, gridPts(a1, a2, t1, t2, na, nt), { round: true, inten: 6.5, range: 16 }));
  // ---- finishing: merge furniture, picking records, lights, animation
  root.updateMatrixWorld(true); [A, B].forEach((F) => F.items.forEach((it) => it.box.setFromObject(it.g)));
  // ---- wall finishes by zone (replaces the plain white partitions): each zone gets its own palette
  {
    const wm = (c, r = 0.7, e = 0.2) => new THREE.MeshStandardMaterial({ color: c, roughness: r, envMapIntensity: e });
    const P10 = [[40, 125, wm(0xa9c9cc, 0.55)], [125, 190, wm(0x6b727c, 0.8, 0.12)], [190, 250, wm(0xb88e66, 0.55, 0.25)], [250, 290, wm(0xd9c8a6, 0.85)], [290, 330, wm(0x9db3a6, 0.5)], [330, 400, wm(0xa07a5e, 0.75, 0.15)]];
    const P11 = [[190, 330, wm(0x3d424a, 0.8, 0.1)], [330, 400, wm(0x5d6b73, 0.7)], [40, 190, wm(0xa59885, 0.8)]];
    const pick = (P, deg0) => { for (const [a1, a2, m] of P) { const d = ((deg0 - a1) % 360 + 360) % 360; if (d <= a2 - a1) return m; } return null; };
    const v = new THREE.Vector3();
    [[A, P10], [B, P11]].forEach(([F, P]) => F.walls.traverse((m) => { if (!m.isMesh || m.material !== M.wall) return; m.getWorldPosition(v); const ang = ((Math.atan2(v.z - O.OZ, v.x - O.OX) * 180) / Math.PI + 360) % 360, mat = pick(P, ang); if (mat) m.material = mat; }));
    CEIL_M.color.set(0xeee7da);
  }
  [A, B].forEach((F) => { F.mergeStatic(F.furn); F.mergeStatic(F.walls); F.finish(); });
  const lvl = { L10: A, L11: B };
  const all = (fn) => [A, B].forEach(fn);
  const api = { pool: { c: PC, rot: prot, L: PL, W: PW }, g: root, L10: A, L11: B, O, items: [...A.items, ...B.items], poolG, poolLights, setLevels: (v) => { A.g.visible = v !== 11; B.g.visible = v !== 10; } };
  api.setLevels(0); A.g.visible = true; B.g.visible = true;
  api.doors = [...A.doors, ...B.doors]; api.doorMeshes = [...A.doorMeshes, ...B.doorMeshes]; api.setDoors = (o) => api.doors.forEach((d) => (d.target = o ? 1 : 0));
  api.rooms = { ...A.rooms, ...B.rooms }; api.lightsOn = { ...A.lightsOn }; api.setLight = (k, on) => { (A.rooms[k] ? A : B).setLight(k, on); api.lightsOn[k] = on; }; api.setAllLights = (on) => { Object.keys(api.rooms).forEach((k) => api.setLight(k, on)); };
  api.poolLightsOn = false; api.setPoolLights = (on) => { api.poolLightsOn = on; uwMat.color.set(on ? 0xbffcff : 0x7ff3ff); poolLights.forEach((l) => (l.intensity = on ? 6 : 0)); coveMat.emissiveIntensity = on ? 2.2 : 0.15; waterA.emissiveIntensity = on ? 0.6 : 0.05; };
  api.update = (dt, t, anim = true) => { all((F) => F.updateDoors(dt)); lifts.forEach((l) => { l.k += (l.t - l.k) * Math.min(1, dt * 3); l.a.position.x = -0.28 - l.k * 0.5; l.b.position.x = 0.28 + l.k * 0.5; }); if (anim) { bump.offset.set((t * 0.015) % 1, (t * 0.01) % 1); bump2.offset.set((-t * 0.011) % 1, (t * 0.017) % 1); causticTex.offset.set((t * 0.03) % 1, (t * 0.02) % 1); } };
  api.check = () => [...A.check().map((s) => "L10 " + s), ...B.check().map((s) => "L11 " + s)];
  api.fade = (op) => all((F) => F.fade(op)); api.levels = { A, B };
  return api;
}
