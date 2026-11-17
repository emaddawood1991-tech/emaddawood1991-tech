import * as THREE from "three";
import { createKit } from "./plans_core.js";
import { addMEP } from "./plans_mep.js";
import { makeOutline, buildShell, deg } from "./outline.js";
import { polarKit } from "./plans_polar.js";

// Floor 12 - multi-tenant office floor on the TRUE tower outline (outline.js): Medical center, IT company, Trading office, Real-estate agency,
// business lounge, lift lobby + reception. Rooms hug the core corridor ring (t 0..0.15); offices sit at t 0.15..1. Conceptual layout.
export function buildOffice(H) {
  const { box, rbox, cyl, canvasTex, plant, lamp } = H;
  const O = makeOutline(12), kit = createKit(H), M = kit.M, F = kit.floor("office", 56, 56, { noSlab: true, wallH: 3.6, ceilH: 3.2 });
  buildShell(F, O, H, { M, noGlass: true }); F.O = O;
  const P = polarKit(F, O, M), { face, faceIn, at } = P, sec = P.sec, TC = 0.15;
  const T = (w, h, fn) => canvasTex(w, h, (c, ww, hh) => fn(c, ww, hh));
  const tex = {
    ticker: T(512, 256, (c, w, h) => { c.fillStyle = "#04121c"; c.fillRect(0, 0, w, h); for (let r = 0; r < 9; r++) { c.fillStyle = r % 3 ? "#1ec27a" : "#ff5a4f"; c.font = "bold 20px monospace"; c.fillText(["BRENT 84.2 +0.8%", "GOLD 2412 +0.3%", "EURUSD 1.082", "DFM IDX 4318 +0.4%", "BTC 67 210 -1.1%", "NASDAQ 17 640", "USDAED 3.6725", "SILVER 29.1 +0.6%", "S&P 5 478 +0.2%"][r], 14, 28 + r * 26); } c.strokeStyle = "#2ad"; c.beginPath(); c.moveTo(300, 200); for (let i = 0; i < 12; i++) c.lineTo(300 + i * 17, 200 - Math.sin(i * 0.9) * 40 - i * 5); c.stroke(); }),
    chart: T(512, 256, (c, w, h) => { c.fillStyle = "#06101a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#1ec27a"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 200); for (let i = 1; i < 30; i++) c.lineTo(i * 17, 190 - Math.abs(Math.sin(i * 0.5)) * 60 - i * 3); c.stroke(); c.strokeStyle = "#ff5a4f"; c.beginPath(); c.moveTo(0, 150); for (let i = 1; i < 30; i++) c.lineTo(i * 17, 140 + Math.sin(i * 0.7) * 30); c.stroke(); }),
    listing: T(512, 288, (c, w, h) => { c.fillStyle = "#f4efe6"; c.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { c.fillStyle = ["#7aa6c2", "#c9a25a", "#8da38a", "#b97a5f"][i]; c.fillRect(14 + (i % 2) * 248, 14 + Math.floor(i / 2) * 136, 236, 90); c.fillStyle = "#222"; c.font = "bold 16px sans-serif"; c.fillText(["Marina 2BR  AED 2.4M", "Palm villa  AED 9.8M", "Downtown 1BR  AED 1.6M", "JBR studio  AED 0.9M"][i], 14 + (i % 2) * 248, 126 + Math.floor(i / 2) * 136); } }),
    xray: T(256, 256, (c, w, h) => { c.fillStyle = "#06121c"; c.fillRect(0, 0, w, h); c.strokeStyle = "#cfe8ff"; c.lineWidth = 6; c.beginPath(); c.arc(128, 90, 52, 0, 7); c.stroke(); c.beginPath(); c.moveTo(128, 142); c.lineTo(128, 240); c.moveTo(70, 170); c.lineTo(186, 170); c.stroke(); }),
    cross: T(256, 256, (c, w, h) => { c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, h); c.fillStyle = "#2f8f6a"; c.fillRect(100, 40, 56, 176); c.fillRect(40, 100, 176, 56); }),
  };
  const board = (txt, x, y, z, rot, w, h, bg, fg, fs) => { const t = canvasTex(512, Math.max(64, Math.round(512 * h / w)), (c, ww, hh) => { c.fillStyle = bg; c.fillRect(0, 0, ww, hh); c.fillStyle = fg; c.font = `600 ${fs || 44}px Georgia,serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, ww / 2, hh / 2); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(x, y, z); m.rotation.y = rot; F.deco.add(m); return m; };

  // ---------------------------------------------------------------- slab, floors, walls
  F.sector(0, Math.PI * 2, 0, 1, new THREE.MeshStandardMaterial({ color: 0xb9b6b0, roughness: 0.95, side: THREE.DoubleSide }), -0.02, 0.1);
  const fm = (m, e = 0.35) => { const c = m.clone(); c.envMapIntensity = e; return c; };
  sec(240, 300, 0, 1, fm(M.stone, 0.45)); sec(300, 600, 0, TC, fm(M.stone, 0.45)); sec(60, 120, TC, 1, fm(M.wood, 0.3)); sec(180, 240, TC, 1, fm(M.vinyl)); sec(120, 180, TC, 1, fm(M.carpet, 0.1)); sec(300, 360, TC, 1, fm(M.carpet, 0.1)); sec(360, 420, TC, 1, fm(M.carpetWarm, 0.1));
  P.glassArc(0, 360, -0.12, []);
  const PW = { t: 0.2 };
  P.arc(300, 600, TC, { t: 0.2, mat: M.core }, [{ a: 330, w: 1.4, swing: -1, name: "Trading office entrance", glass: true }, { a: 390, w: 1.4, swing: 1, name: "Real-estate agency entrance", glass: true }, { a: 450, w: 1.6, swing: -1, name: "Business lounge entrance", glass: true }, { a: 510, w: 1.4, swing: 1, name: "IT company entrance", glass: true }, { a: 570, w: 1.4, swing: -1, name: "Medical center entrance", glass: true }]);
  [240, 300, 360, 420, 480, 540].forEach((a) => P.radial(a, TC, 1, PW));            // lobby walls + tenant party walls (the corridor ring stays open into the lobby)
  const LIFTA = [252, 264, 276, 288], lifts = [];
  LIFTA.forEach((a, i) => { const [x, z] = O.pt(deg(a), O.coreR(deg(a)) + 0.12), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face(a); F.walls.add(g); const mk = (px) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.3, 0.05), M.steel); m.position.set(px, 1.15, 0.03); g.add(m); return m; }; box(g, 1.5, 0.12, 0.06, M.brass, 0, 2.4, 0.04); box(g, 0.1, 0.22, 0.05, M.steel, 1.0, 1.0, 0.03);
    const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.14), new THREE.MeshBasicMaterial({ map: canvasTex(128, 48, (c, w, h) => { c.fillStyle = "#050a10"; c.fillRect(0, 0, w, h); c.fillStyle = "#ffb347"; c.font = "bold 34px monospace"; c.textBaseline = "middle"; c.textAlign = "center"; c.fillText("▲ 12", w / 2, h / 2); }), toneMapped: false })); disp.position.set(0, 2.58, 0.06); g.add(disp);
    lifts.push({ a: mk(-0.3), b: mk(0.3), k: 0, t: 0 }); F.fp("lift" + i, x, z, 1.5, 0.4, face(a), { wall: true, soft: true }); });
  { const [sx, sz] = at(270, 0, 0, 0.16); board("LIFTS A · B  EXPRESS 12 → 50     LIFTS C · D  OFFICE FLOORS 2–20", sx, 3.05, sz, face(270), 7.5, 0.5, "#14202e", "#f2e3c6", 28); board("FLOOR 12", ...[sx, 3.5, sz].slice(0, 3), face(270), 1.8, 0.3, "#14202e", "#f2e3c6", 40); }

  // tenants ------------------------------------------------------------------------------------------------------------------------------------
  // medical center 180-240: reception + waiting (inner), 4 clinical rooms (outer)
  P.arc(180, 240, 0.55, {}, [{ a: 187.5, w: 0.95, swing: 1, name: "Consultation 1 door" }, { a: 202.5, w: 0.95, swing: 1, name: "Consultation 2 door" }, { a: 217.5, w: 0.95, swing: 1, name: "Treatment room door" }, { a: 232.5, w: 0.95, swing: 1, name: "Imaging room door" }]);
  [195, 210, 225].forEach((a) => P.radial(a, 0.55, 1, { t: 0.15 }));
  // IT company 120-180: server room, manager, meeting (outer glass boxes), open plan (inner)
  P.arc(120, 180, 0.55, { glass: true, t: 0.1 }, [{ a: 130, w: 0.95, swing: 1, name: "Server room door", glass: true }, { a: 150, w: 0.95, swing: 1, name: "Manager office door", glass: true }, { a: 170, w: 1.0, swing: 1, name: "Meeting room door", glass: true }]);
  [140, 160].forEach((a) => P.radial(a, 0.55, 1, { glass: true, t: 0.1 }));
  // trading office 300-360: glass meeting room at the end
  P.arc(345, 360, 0.55, { glass: true, t: 0.1 }, [{ a: 352.5, w: 0.95, swing: 1, name: "Trading meeting room door", glass: true }]); P.radial(345, 0.55, 1, { glass: true, t: 0.1 });

  // lights ----------------------------------------------------------------------------------------------------------------------------------------
  [["med_rec", "Medical · reception", 182, 238, 0.2, 0.5, 5, 2], ["med_c1", "Medical · consult 1", 181, 194, 0.6, 0.96, 1, 2], ["med_c2", "Medical · consult 2", 196, 209, 0.6, 0.96, 1, 2], ["med_tr", "Medical · treatment", 211, 224, 0.6, 0.96, 1, 2], ["med_img", "Medical · imaging", 226, 239, 0.6, 0.96, 1, 2],
    ["it_open", "IT · open plan", 122, 178, 0.2, 0.5, 5, 2], ["it_srv", "IT · server room", 121, 139, 0.6, 0.96, 1, 2], ["it_mgr", "IT · manager", 141, 159, 0.6, 0.96, 2, 2], ["it_mt", "IT · meeting", 161, 179, 0.6, 0.96, 2, 2],
    ["tr_floor", "Trading · floor", 302, 343, 0.2, 0.96, 5, 3], ["tr_mt", "Trading · meeting", 346, 359, 0.6, 0.96, 1, 2], ["tr_rec", "Trading · reception", 346, 359, 0.2, 0.5, 1, 2],
    ["re_main", "Real estate · agency", 2, 58, 0.2, 0.96, 6, 3], ["lob", "Lift lobby", 242, 298, 0.05, 0.28, 6, 1], ["rec", "Building reception", 242, 298, 0.35, 0.96, 5, 3], ["lng", "Business lounge", 62, 118, 0.2, 0.96, 6, 3], ["cor", "Corridor ring", 302, 598, 0.05, 0.12, 24, 1]].forEach(([k, n, a1, a2, t1, t2, na, nt]) => P.room(k, n, a1, a2, t1, t2, na, nt, k === "lng" || k === "re_main" || k === "it_open" ? 9 : 6, 14));

  // MEDICAL CENTER ---------------------------------------------------------------------------------------------------------------------------
  F.reception(...at(210, 0.34, 0, 0), face(210) + Math.PI, 3.0); F.cabinet(...at(190, 0.2, 0, 0.4), face(190), 1.2, 1.9, 0.4, M.walnut, { tag: "records" });
  F.sofa(...at(222, 0.45, 0, 0), faceIn(222), 2.4, M.blue); F.coffee(...at(222, 0.36, 0, 0), 0.9, 0.55, true); F.armchair(...at(235, 0.4, 0, 0), faceIn(235) + 0.6, M.blue); F.plant(...at(184, 0.45, 0, 0), 0.9, 1.3); F.plant(...at(237, 0.25, 0, 0), 0.9, 1.3);
  [[187.5, 1], [202.5, 2]].forEach(([a, n]) => { F.desk(...at(a - 3, 0.75, 0, 0), face(a) + Math.PI / 2, { w: 1.4, d: 0.7, mon: 1, chair: false }); F.task(...at(a - 3, 0.75, 1.1, 0), face(a) - Math.PI / 2, M.navy); F.couch(...at(a + 3, 0.8, 0, 0), face(a)); F.basin(...at(a + 5.2, 0.62, 0, 0), face(a), 0.7); });
  F.couch(...at(217.5, 0.8, 0, 0), face(217.5)); F.cabinet(...at(213, 0.9, 0, 0), face(213), 1.4, 1.0, 0.45, M.lac, { tag: "treat-cab" }); F.armchair(...at(222, 0.9, 0, 0), faceIn(222), M.sage);
  { const [x, z] = at(232.5, 0.82, 0, 0), t = F.furn; box(t, 0.8, 0.6, 2.2, M.white, x, 0, z, face(232.5)); rbox(t, 0.7, 0.08, 2.1, 0.04, M.blue, x, 0.6, z, face(232.5)); F.fp("xray-table", x, z, 0.8, 2.2, face(232.5)); }
  board("CAREFIRST MEDICAL CENTER", ...[...at(210, TC, 0, 0.12)].reduce((r, v, i) => (i === 0 ? [v, 2.55] : [...r, v]), []), face(210), 2.8, 0.45, "#f3f8f6", "#1f7a63", 30);
  // IT COMPANY -------------------------------------------------------------------------------------------------------------------------------
  for (let i = 0; i < 4; i++) F.rack(...at(130 - 4.5 + i * 3, 0.85, 0, 0), face(130)); F.cabinet(...at(124, 0.75, 0, 0), face(124), 1.0, 1.9, 0.7, M.white, { tag: "crac" });
  F.desk(...at(150, 0.85, 0, 0), faceIn(150), { w: 1.8, d: 0.9, mon: 2, chair: false }); F.task(...at(150, 0.78, 0, 0), face(150), M.leather); F.sofa(...at(144, 0.62, 0, 0), face(144), 2.0, M.grey); F.tall(...at(157, 0.62, 0, 0), face(157), 1.8, 0.4, 2.2, M.walnut, { tag: "shelf" });
  F.table(...at(170, 0.78, 0, 0), 2.6, 1.1, { top: M.walnut, rot: face(170) }); F.chairsAround(...at(170, 0.78, 0, 0), 2.6, 1.1, 6, face(170), M.navy);
  [[128, 0.3], [128, 0.45], [146, 0.3], [146, 0.45], [164, 0.3], [164, 0.45]].forEach(([a, t]) => { for (const du of [-0.75, 0.75]) { F.desk(...at(a, t, du, 0), face(a), { w: 1.4, d: 0.7, mon: 1, chair: false }); F.task(...at(a, t, du, 0.85), faceIn(a), M.black); } });
  F.kitchenRun(...at(168, 0.18, 0, 0.55), face(168), 2.4, { hob: undefined, sink: 0.6 }); F.fridge(...at(175.5, 0.18, 0, 0.55), face(175.5)); F.plant(...at(178, 0.45, 0, 0), 1.0, 1.5);
  board("NIMBUSTECH · IT & CLOUD", ...[...at(150, TC, 0, 0.12)].reduce((r, v, i) => (i === 0 ? [v, 2.55] : [...r, v]), []), face(150), 2.8, 0.45, "#0e1b2a", "#6ec8ff", 32);
  // TRADING OFFICE ----------------------------------------------------------------------------------------------------------------------------
  [310, 322, 334].forEach((a) => F.screen(...[...at(a, TC, 0, 0.1)].reduce((r, v, i) => (i === 0 ? [v, 1.05] : [...r, v]), []), face(a), 3.0, 1.45, tex.ticker));
  [[0.34, [309, 321, 333]], [0.5, [309, 321, 333]], [0.66, [309, 321, 333]]].forEach(([t, as]) => as.forEach((a) => { F.desk(...at(a, t, 0, 0), face(a), { w: 3.0, d: 0.9, mon: 3, dual: true, chair: false, glow: new THREE.MeshBasicMaterial({ map: tex.chart, toneMapped: false }) }); for (const k of [-1, 0, 1]) F.task(...at(a, t, k * 0.95, 0.9), faceIn(a), M.black); }));
  F.table(...at(352.5, 0.8, 0, 0), 2.2, 0.9, { top: M.walnut, rot: face(352.5) }); F.reception(...at(341, 0.24, 0, 0), faceIn(341), 1.8); F.armchair(...at(349, 0.3, 0, 0), faceIn(349), M.rust); F.plant(...at(302, 0.9, 0, 0), 1.0, 1.6);
  board("AZURE TRADING CO.", ...[...at(330, TC, 0, 0.12)].reduce((r, v, i) => (i === 0 ? [v, 2.55] : [...r, v]), []), face(330), 2.8, 0.45, "#10161f", "#e2c27a", 32);
  // REAL-ESTATE AGENCY ------------------------------------------------------------------------------------------------------------------------
  F.reception(...at(30, 0.3, 0, 0), faceIn(30), 2.6); F.sofa(...at(8, 0.3, 0, 0), faceIn(8), 2.2, M.cream); F.coffee(...at(8, 0.4, 0, 0), 0.9, 0.55, true); F.plant(...at(3, 0.9, 0, 0), 1.0, 1.6);
  [[48, 0.35], [48, 0.55], [22, 0.62]].forEach(([a, t]) => { for (const du of [-0.75, 0.75]) { F.desk(...at(a, t, du, 0), face(a), { w: 1.4, d: 0.7, mon: 1, chair: false }); F.task(...at(a, t, du, 0.85), faceIn(a), M.grey); } });
  F.table(...at(38, 0.8, 0, 0), 2.6, 1.3, { top: M.white, rot: face(38) }); { const [bx, bz] = at(38, 0.8, 0, 0); for (let i = 0; i < 20; i++) { const sb = rbox(F.furn, 0.34 - i * 0.008, 0.045, 0.3 - i * 0.006, 0.01, M.blue, bx, 0.74 + i * 0.045, bz, i * 0.12); sb.castShadow = false; } }
  [[-1.0, -0.9], [1.0, -0.9], [-1.0, 0.9], [1.0, 0.9]].forEach(([du, dv], i) => F.chair(...at(38, 0.8, du * 1.3, dv * 1.4), dv < 0 ? face(38) : faceIn(38), M.cream));
  F.screen(...[...at(55, TC, 0, 0.1)].reduce((r, v, i) => (i === 0 ? [v, 1.05] : [...r, v]), []), face(55), 1.9, 1.07, tex.listing); F.cabinet(...at(19, 0.2, 0, 0.3), face(19), 1.6, 0.9, 0.4, M.walnut, { tag: "brochures" });
  board("MARINA REALTY · PROPERTY ADVISORS", ...[...at(390 % 360, TC, 0, 0.12)].reduce((r, v, i) => (i === 0 ? [v, 2.55] : [...r, v]), []), face(30), 3.0, 0.45, "#f4efe6", "#7a4d2b", 24);
  // LOUNGE + RECEPTION ----------------------------------------------------------------------------------------------------------------------
  F.rug(...at(90, 0.55, 0, 0), 7.0, 4.6, M.cream, face(90)); F.sofa(...at(82, 0.48, 0, 0), face(82), 2.6, M.grey); F.sofa(...at(98, 0.48, 0, 0), face(98), 2.6, M.grey); F.coffee(...at(90, 0.58, 0, 0), 1.4, 0.8, true); F.armchair(...at(76, 0.62, 0, 0), faceIn(76) + 0.6, M.sage); F.armchair(...at(104, 0.62, 0, 0), faceIn(104) - 0.6, M.sage);
  F.table(...at(90, 0.82, 0, 0), 1.2, 1.2, { round: true, top: M.walnut }); F.chair(...at(90, 0.82, -0.8, 0), faceIn(90) - Math.PI / 2, M.rust); F.chair(...at(90, 0.82, 0.8, 0), faceIn(90) + Math.PI / 2, M.rust); F.plant(...at(66, 0.9, 0, 0), 1.1, 1.8); F.plant(...at(114, 0.9, 0, 0), 1.1, 1.8); F.cabinet(...at(90, 0.2, 0, 0.3), face(90), 3.2, 0.9, 0.45, M.walnut, { tag: "console" });
  F.reception(...at(270, 0.6, 0, 0), face(270) + Math.PI, 3.4); F.sofa(...at(250, 0.55, 0, 0), faceIn(250), 2.2, M.grey); F.sofa(...at(290, 0.55, 0, 0), faceIn(290), 2.2, M.grey); F.plant(...at(244, 0.9, 0, 0), 1.1, 1.8); F.plant(...at(296, 0.9, 0, 0), 1.1, 1.8); F.plant(...at(246, 0.2, 0, 0), 1.0, 1.7); F.plant(...at(294, 0.2, 0, 0), 1.0, 1.7);
  board("FLOOR 12 · BUSINESS LOUNGE", ...[...at(90, TC, 0, 0.12)].reduce((r, v, i) => (i === 0 ? [v, 2.6] : [...r, v]), []), face(90), 3.4, 0.4, "#14202e", "#f2e3c6", 28);

  F.finish();
  Object.values(F.rooms).forEach((r) => { if (!r.pts) return; const xs = r.pts.map((p) => p[0]), zs = r.pts.map((p) => p[1]); r.x1 = Math.min(...xs) - 0.3; r.x2 = Math.max(...xs) + 0.3; r.z1 = Math.min(...zs) - 0.3; r.z2 = Math.max(...zs) + 0.3; });
  addMEP(F, { risers: [{ x: at(236, 0.1)[0], z: at(236, 0.1)[1] }, { x: at(304, 0.1)[0], z: at(304, 0.1)[1] }], blinds: [] });
  { const bm = new THREE.MeshStandardMaterial({ color: 0xd9d2c3, roughness: 0.9, side: THREE.DoubleSide }); for (let a = 0; a < 360; a += 3) { const p = P.edge(a, -0.3), q = P.edge(a + 3, -0.3), L = Math.hypot(q[0] - p[0], q[1] - p[1]), m = new THREE.Mesh(new THREE.BoxGeometry(L - 0.08, 2.4, 0.02), bm); m.position.set((p[0] + q[0]) / 2, F.WALL_H - 1.25, (p[1] + q[1]) / 2); m.rotation.y = Math.atan2(-(q[1] - p[1]), q[0] - p[0]); F.mep.blinds.add(m); } }
  F.liftOn = false; F.liftOpen = (on) => { F.liftOn = on; lifts.forEach((l) => (l.t = on ? 1 : 0)); };
  F.update = (dt) => { F.updateDoors(dt); lifts.forEach((l) => { l.k += (l.t - l.k) * Math.min(1, dt * 3); l.a.position.x = -0.3 - l.k * 0.55; l.b.position.x = 0.3 + l.k * 0.55; }); };
  F.roomsList = Object.values(F.rooms);
  F.unitPolys = { lobby: [P.sectorPts(240, 300, 0.02, 1)], trading: [P.sectorPts(300, 360, 0.15, 1)], realestate: [P.sectorPts(0, 60, 0.15, 1)], lounge: [P.sectorPts(60, 120, 0.15, 1)], it: [P.sectorPts(120, 180, 0.15, 1)], medical: [P.sectorPts(180, 240, 0.15, 1)], corridor: [P.sectorPts(300, 600, 0.02, 0.15)] };
  F.liftPts = LIFTA.map((a) => { const [x, z] = O.pt(deg(a), O.coreR(deg(a)) + 0.12); return { name: "lift " + a, x, z }; });
  F.P = P; const ar = (a1, a2) => Math.round(P.sectorArea(a1, a2, 0.15, 1)) + " m²";
  F.tenants = [["Medical center", "CareFirst Medical Center", "reception, 2 consulting rooms, treatment room, imaging (X-ray)", ar(180, 240)], ["IT company", "NimbusTech IT & Cloud", "server room, manager office, glass meeting room, open-plan pods, kitchenette", ar(120, 180)], ["Trading office", "Azure Trading Co.", "trading floor with screen wall, 9 trading desks, glass meeting room, reception", ar(300, 360)], ["Real-estate agency", "Marina Realty", "reception, desks, scale-model table, listing screens", ar(0, 60)]];
  return F;
}
