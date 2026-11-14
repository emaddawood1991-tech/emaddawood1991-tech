import * as THREE from "three";
import { createKit } from "./plans_core.js";

// Floor 12 - a multi-tenant office floor: Medical center, IT company, Trading office, Real-estate agency.
// Plan: x 0..40 (west->east), z 0..28 (back -> Gulf-facing glass). Core x14..26 z0..9, lift lobby z9..15, lounge z15..28.
export function buildOffice(H) {
  const { box, rbox, cyl, canvasTex, plant, lamp } = H;
  const kit = createKit(H), M = kit.M, F = kit.floor("office", 40, 28, { wallH: 3.6, ceilH: 3.2 });
  const T = (w, h, fn) => canvasTex(w, h, (c, ww, hh) => fn(c, ww, hh));
  const tex = {
    ticker: T(512, 256, (c, w, h) => { c.fillStyle = "#04121c"; c.fillRect(0, 0, w, h); for (let r = 0; r < 9; r++) { c.fillStyle = r % 3 ? "#1ec27a" : "#ff5a4f"; c.font = "bold 20px monospace"; c.fillText(["BRENT 84.2 +0.8%", "GOLD 2412 +0.3%", "EURUSD 1.082", "DFM IDX 4318 +0.4%", "BTC 67 210 -1.1%", "NASDAQ 17 640", "USDAED 3.6725", "SILVER 29.1 +0.6%", "S&P 5 478 +0.2%"][r], 14, 28 + r * 26); } c.strokeStyle = "#2ad"; c.beginPath(); c.moveTo(300, 200); for (let i = 0; i < 12; i++) c.lineTo(300 + i * 17, 200 - Math.sin(i * 0.9) * 40 - i * 5); c.stroke(); }),
    chart: T(512, 256, (c, w, h) => { c.fillStyle = "#06101a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#1ec27a"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 200); for (let i = 1; i < 30; i++) c.lineTo(i * 17, 190 - Math.abs(Math.sin(i * 0.5)) * 60 - i * 3); c.stroke(); c.strokeStyle = "#ff5a4f"; c.beginPath(); c.moveTo(0, 150); for (let i = 1; i < 30; i++) c.lineTo(i * 17, 140 + Math.sin(i * 0.7) * 30); c.stroke(); }),
    listing: T(512, 288, (c, w, h) => { c.fillStyle = "#f4efe6"; c.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { c.fillStyle = ["#7aa6c2", "#c9a25a", "#8da38a", "#b97a5f"][i]; c.fillRect(14 + (i % 2) * 248, 14 + Math.floor(i / 2) * 136, 236, 90); c.fillStyle = "#222"; c.font = "bold 16px sans-serif"; c.fillText(["Marina 2BR  AED 2.4M", "Palm villa  AED 9.8M", "Downtown 1BR  AED 1.6M", "JBR studio  AED 0.9M"][i], 14 + (i % 2) * 248, 126 + Math.floor(i / 2) * 136); } }),
    xray: T(256, 256, (c, w, h) => { c.fillStyle = "#06121c"; c.fillRect(0, 0, w, h); c.strokeStyle = "#cfe8ff"; c.lineWidth = 6; c.beginPath(); c.arc(128, 90, 52, 0, 7); c.stroke(); c.beginPath(); c.moveTo(128, 142); c.lineTo(128, 240); c.moveTo(70, 170); c.lineTo(186, 170); c.stroke(); }),
    cross: T(256, 256, (c, w, h) => { c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, h); c.fillStyle = "#2f8f6a"; c.fillRect(100, 40, 56, 176); c.fillRect(40, 100, 176, 56); }),
  };
  const board = (txt, x, y, z, rot, w, h, bg, fg, fs) => { const t = canvasTex(512, Math.max(64, Math.round(512 * h / w)), (c, ww, hh) => { c.fillStyle = bg; c.fillRect(0, 0, ww, hh); c.fillStyle = fg; c.font = `600 ${fs || 44}px Georgia,serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, ww / 2, hh / 2); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(x, y, z); m.rotation.y = rot; F.deco.add(m); return m; };

  // ---------------------------------------------------------------- floors
  F.patch(14, 9, 26, 15, M.stone); F.patch(14, 15, 26, 28, M.wood);
  F.patch(0, 0, 14, 14, M.vinyl); F.patch(0, 14, 14, 28, M.carpet); F.patch(26, 0, 40, 14, M.carpet); F.patch(26, 14, 40, 28, M.carpetWarm);
  F.patch(14, 0, 26, 9, M.core);

  // ---------------------------------------------------------------- shell + core
  // Gulf-facing curtain wall (full width) and inland glass for the medical suite
  F.wall(0, 28, 40, 28, { glass: true, t: 0.1 }); F.wall(0, 0, 14, 0, { glass: true, t: 0.1 }); F.wall(26, 0, 40, 0, { t: 0.2 }); F.wall(0, 0, 0, 28, { t: 0.2 }); F.wall(40, 0, 40, 28, { t: 0.2 });
  // core: solid block with four lift doors on the lobby face
  F.wall(14, 0, 14, 9, { t: 0.3, mat: M.core }); F.wall(26, 0, 26, 9, { t: 0.3, mat: M.core }); F.wall(14, 9, 26, 9, { t: 0.3, mat: M.core });
  box(F.walls, 11.4, 3.6, 0.2, M.core, 20, 0, 8.7);
  const LIFTX = [16.1, 18.7, 21.3, 23.9];
  LIFTX.forEach((x, i) => { const a = box(F.walls, 0.6, 2.3, 0.05, M.steel, x - 0.3, 0, 8.93), b = box(F.walls, 0.6, 2.3, 0.05, M.steel, x + 0.3, 0, 8.93); F.liftDoors.push({ a, b, ax: x - 0.3, bx: x + 0.3, cur: 0, target: 0 }); box(F.walls, 1.5, 0.12, 0.06, M.brass, x, 2.4, 8.92); box(F.walls, 1.6, 0.04, 0.05, M.brass, x, 2.3, 8.93);
    const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.14), new THREE.MeshBasicMaterial({ map: canvasTex(128, 48, (c, w, h) => { c.fillStyle = "#050a10"; c.fillRect(0, 0, w, h); c.fillStyle = "#ffb347"; c.font = "bold 34px monospace"; c.textBaseline = "middle"; c.textAlign = "center"; c.fillText("▲ 12", w / 2, h / 2); }), toneMapped: false })); disp.position.set(x, 2.58, 8.89); disp.rotation.y = 0; F.walls.add(disp);
    box(F.walls, 0.1, 0.22, 0.05, M.steel, x + 1.05, 1.0, 8.92); F.fp("call-" + i, x + 1.05, 8.9, 0.1, 0.05, 0, { wall: true, soft: true }); });
  board("LIFTS A · B  EXPRESS 12 → 50     LIFTS C · D  OFFICE FLOORS 2–20", 20, 3.05, 8.88, 0, 8.6, 0.5, "#14202e", "#f2e3c6", 28);
  // service door + stair on the core (decor)
  F.wall(14, 15, 14, 28, { t: 0.2, doors: [{ c: 23.6, w: 1.2, swing: -1, name: "IT company entrance", glass: true }] });

  // ---------------------------------------------------------------- tenant partitions (explicit segments, doors cut openings)
  // west wall x=14 z0..28 : medical entrance (z=11.8) ; IT entrance in the z>15 part above
  F.wall(14, 9, 14, 15, { t: 0.2, doors: [{ c: 11.8, w: 1.4, swing: -1, name: "Medical center entrance", glass: true }] });
  F.wall(26, 9, 26, 15, { t: 0.2, doors: [{ c: 11.8, w: 1.4, swing: 1, name: "Trading office entrance", glass: true }] });
  F.wall(26, 15, 26, 28, { t: 0.2, doors: [{ c: 21.0, w: 1.4, swing: 1, name: "Real-estate agency entrance", glass: true }] });
  F.wall(0, 14, 14, 14, { t: 0.2 }); F.wall(26, 14, 40, 14, { t: 0.2 });
  // ---- medical center (x0..14 z0..14)
  F.wall(0, 5, 14, 5, { t: 0.15, doors: [{ c: 2.3, w: 0.95, swing: 1, name: "Consultation 1 door" }, { c: 7.0, w: 0.95, swing: 1, name: "Consultation 2 door" }, { c: 11.7, w: 0.95, swing: 1, name: "Treatment room door" }] });
  F.wall(4.67, 0, 4.67, 5, { t: 0.15 }); F.wall(9.33, 0, 9.33, 5, { t: 0.15 });
  F.wall(0, 7, 14, 7, { t: 0.15, doors: [{ c: 2.6, w: 0.95, swing: -1, name: "Imaging room door" }, { c: 8.0, w: 2.0, leaf: false }] });
  F.wall(5.5, 7, 5.5, 14, { t: 0.15 });
  // ---- IT company (x0..14 z14..28)
  F.wall(0, 20, 4.5, 20, { glass: true, t: 0.1 }); F.wall(4.5, 14, 4.5, 28, { glass: true, t: 0.1, doors: [{ c: 17.4, w: 0.95, swing: -1, name: "Server room door", glass: true }, { c: 24.2, w: 0.95, swing: -1, name: "Manager office door", glass: true }] });
  F.wall(9.5, 20.5, 14, 20.5, { glass: true, t: 0.1, doors: [{ c: 11.7, w: 1.0, swing: 1, name: "Meeting room door", glass: true }] }); F.wall(9.5, 14, 9.5, 20.5, { glass: true, t: 0.1 });
  // ---- trading office (x26..40 z0..14)
  F.wall(34, 11.2, 40, 11.2, { glass: true, t: 0.1, doors: [{ c: 36.2, w: 0.95, swing: 1, name: "Trading meeting room door", glass: true }] }); F.wall(34, 11.2, 34, 14, { glass: true, t: 0.1 });
  // ---- real estate (x26..40 z14..28)

  // ---------------------------------------------------------------- rooms (lights)
  const R = {};
  [["med_rec", "Medical · reception", 5.5, 7, 14, 14], ["med_c1", "Medical · consult 1", 0, 0, 4.67, 5], ["med_c2", "Medical · consult 2", 4.67, 0, 9.33, 5], ["med_tr", "Medical · treatment", 9.33, 0, 14, 5], ["med_cor", "Medical · corridor", 0, 5, 14, 7], ["med_img", "Medical · imaging", 0, 7, 5.5, 14],
    ["it_srv", "IT · server room", 0, 14, 4.5, 20], ["it_mgr", "IT · manager", 0, 20, 4.5, 28], ["it_mt", "IT · meeting", 9.5, 14, 14, 20.5], ["it_open", "IT · open plan", 4.5, 14, 14, 28],
    ["tr_floor", "Trading · floor", 26, 0, 40, 11.2], ["tr_mt", "Trading · meeting", 34, 11.2, 40, 14], ["tr_rec", "Trading · reception", 26, 11.2, 34, 14],
    ["re_main", "Real estate · agency", 26, 14, 40, 28], ["lob", "Lift lobby", 14, 9, 26, 15], ["lng", "Business lounge", 14, 15, 26, 28]].forEach(([k, n, x1, z1, x2, z2]) => { R[k] = F.room(k, n, x1, z1, x2, z2, { inten: k === "lng" || k === "re_main" || k === "it_open" ? 9 : 6, range: 14 }); });
  const rm = (k) => R[k];

  // ---------------------------------------------------------------- MEDICAL CENTER
  {
    // reception (x5.5..14 z7..14): entrance door at x=14 z=11.8
    F.reception(7.3, 11.3, Math.PI / 2, 2.6);
    F.cabinet(5.85, 8.2, Math.PI / 2, 1.2, 1.9, 0.4, M.walnut, { tag: "records" });
    F.sofa(13.1, 8.7, -Math.PI / 2, 2.2, M.blue); F.coffee(11.7, 8.7, 0.9, 0.55); F.armchair(9.6, 9.2, Math.PI, M.blue);
    F.plant(13.3, 13.3, 1.0, 1.4); F.plant(6.5, 13.4, 0.9, 1.2); F.side(11.2, 13.35, true);
    box(F.deco, 0.02, 0.9, 0.9, M.white, 13.95, 1.3, 10.2); const cr = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: tex.cross, toneMapped: false })); cr.position.set(5.6, 2.2, 11.3); cr.rotation.y = Math.PI / 2; F.deco.add(cr);
    // consultation rooms: desk on the side wall, patient chairs, couch, basin
    const consult = (x1, x2, mirror) => { const s = mirror ? -1 : 1, wx = mirror ? x2 : x1, dx = wx + s * 0.62;
      F.desk(dx, 2.0, mirror ? -Math.PI / 2 : Math.PI / 2, { w: 1.4, d: 0.7, mon: 1, chair: false }); F.task(wx + s * 1.45, 2.0, mirror ? Math.PI / 2 : -Math.PI / 2, M.navy); F.chair(wx + s * 2.2, 1.35, mirror ? Math.PI / 2 : -Math.PI / 2, M.blue); F.chair(wx + s * 2.2, 2.65, mirror ? Math.PI / 2 : -Math.PI / 2, M.blue);
      F.couch((x1 + x2) / 2 + s * 0.45, 3.6, 0); F.basin(mirror ? x1 + 0.7 : x2 - 0.7, 0.4, 0, 0.8); F.cabinet(mirror ? x1 + 0.4 : x2 - 0.4, 4.3, Math.PI, 0.6, 1.8, 0.4, M.lac, { tag: "med-cab" }); };
    consult(0, 4.67, false); consult(4.67, 9.33, true);
    // treatment room
    F.couch(11.6, 2.4, 0); F.cabinet(13.5, 2.0, -Math.PI / 2, 2.4, 1.0, 0.45, M.lac, { tag: "treat-cab" }); F.basin(10.3, 0.4, 0, 0.8); F.armchair(9.95, 4.1, Math.PI, M.sage);
    // imaging: table, ceiling tube arm, control desk with window
    { const t = F.furn; box(t, 0.8, 0.6, 2.2, M.white, 2.9, 0, 10.4); rbox(t, 0.7, 0.08, 2.1, 0.04, M.blue, 2.9, 0.6, 10.4); F.fp("xray-table", 2.9, 10.4, 0.8, 2.2, 0); box(t, 0.14, 2.4, 0.14, M.steel, 2.9, 0, 9.0); box(t, 0.9, 0.18, 0.3, M.steel, 2.9, 2.0, 9.0); F.fp("xray-col", 2.9, 9.0, 0.3, 0.3, 0, { soft: true });
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshBasicMaterial({ map: tex.xray, toneMapped: false })); w.position.set(0.1, 1.5, 12.2); w.rotation.y = Math.PI / 2; F.deco.add(w); F.desk(1.0, 13.0, Math.PI, { w: 1.5, d: 0.7, mon: 2, chair: false }); F.task(1.0, 12.2, Math.PI); }
    box(F.deco, 0.15, 2.3, 1.1, M.black, 5.45, 0, 11.7).visible = false;
    board("CAREFIRST MEDICAL CENTER", 13.94, 2.55, 11.8, -Math.PI / 2, 2.6, 0.45, "#f3f8f6", "#1f7a63", 30);
  }
  // ---------------------------------------------------------------- IT COMPANY
  {
    // server room: two rack rows (hot/cold aisle) + cooling unit + UPS
    for (let i = 0; i < 5; i++) F.rack(1.0, 15.0 + i * 0.7, Math.PI / 2);
    for (let i = 0; i < 4; i++) F.rack(2.9, 15.0 + i * 0.7, -Math.PI / 2);
    F.cabinet(2.0, 19.35, Math.PI, 1.0, 1.9, 0.7, M.white, { tag: "crac" }); F.cabinet(3.95, 14.7, 0, 0.6, 1.4, 0.8, M.black, { tag: "ups" });
    // manager office: desk facing the Gulf, sofa, bookcase
    F.desk(2.3, 26.2, Math.PI, { w: 1.8, d: 0.9, mon: 2, chair: false }); F.task(2.3, 25.2, 0, M.leather); F.chair(2.3, 27.2, Math.PI, M.leather); F.sofa(0.9, 22.4, Math.PI / 2, 2.0, M.grey); F.coffee(2.0, 22.4, 0.9, 0.5);
    F.tall(2.5, 20.45, 0, 1.8, 0.4, 2.2, M.walnut, { tag: "shelf" }); F.plant(3.9, 27.3, 0.9, 1.3);
    // meeting room
    F.table(11.8, 17.4, 2.6, 1.1, { top: M.walnut }); F.chairsAround(11.8, 17.4, 2.6, 1.1, 6, 0, M.navy);
    F.screen(13.93, 1.05, 17.4, -Math.PI / 2, 1.8, 1.0, tex.chart);
    // open plan: three four-person pods, each desk with dual screens
    const pod = (cx, cz) => { for (const sx of [-0.75, 0.75]) { F.desk(cx + sx, cz - 1.05, 0, { w: 1.4, d: 0.7, mon: 1, dual: false, chair: false }); F.task(cx + sx, cz - 0.25, Math.PI, M.black); F.desk(cx + sx, cz + 1.05, Math.PI, { w: 1.4, d: 0.7, mon: 1, chair: false }); F.task(cx + sx, cz + 0.25, 0, M.black); } };
    pod(7.1, 17.2); pod(7.4, 24.4); pod(10.9, 24.4);
    // breakout: kitchenette on the glass, bar table
    F.kitchenRun(7.2, 27.55, Math.PI, 3.0, { hob: undefined, sink: 0.6 }); F.fridge(9.2, 27.4, Math.PI); F.plant(13.3, 27.2, 1.0, 1.5);
    board("NIMBUSTECH · IT & CLOUD", 13.94, 2.55, 22.0, -Math.PI / 2, 2.6, 0.45, "#0e1b2a", "#6ec8ff", 32);
  }
  // ---------------------------------------------------------------- TRADING OFFICE
  {
    for (const x of [29.5, 33.0, 36.5]) F.screen(x, 1.05, 0.12, 0, 3.0, 1.45, tex.ticker);
    // three rows of three-seat trading desks, four screens each (two high x two across)
    for (const z of [3.3, 6.0, 8.7]) for (const x of [29.3, 32.8, 36.3]) { F.desk(x, z, 0, { w: 3.0, d: 0.9, mon: 3, dual: true, chair: false, glow: new THREE.MeshBasicMaterial({ map: tex.chart, toneMapped: false }) }); for (const k of [-1, 0, 1]) F.task(x + k * 0.95, z + 0.9, Math.PI, M.black); }
    // glass meeting room
    F.table(37.0, 12.65, 2.2, 0.9, { top: M.walnut }); F.chair(35.9, 11.75, 0, M.navy); F.chair(38.1, 11.75, 0, M.navy); F.chair(35.9, 13.55, Math.PI, M.navy); F.chair(38.1, 13.55, Math.PI, M.navy);
    // reception nook
    F.reception(30.0, 13.0, Math.PI, 2.0); F.armchair(27.5, 13.2, Math.PI, M.rust); F.side(28.7, 13.45, false); F.plant(39.3, 0.7, 1.0, 1.6); F.cabinet(39.5, 9.5, -Math.PI / 2, 2.0, 1.0, 0.5, M.black, { tag: "net" });
    board("AZURE TRADING CO.", 26.07, 2.55, 11.8, Math.PI / 2, 2.6, 0.45, "#10161f", "#e2c27a", 32);
  }
  // ---------------------------------------------------------------- REAL-ESTATE AGENCY
  {
    F.reception(31.0, 21.0, -Math.PI / 2, 2.6); F.sofa(27.2, 17.2, Math.PI / 2, 2.2, M.cream); F.coffee(28.7, 17.2, 0.9, 0.55); F.plant(27.0, 26.8, 1.0, 1.6);
    const pod = (cx, cz) => { for (const sx of [-0.75, 0.75]) { F.desk(cx + sx, cz - 1.05, 0, { w: 1.4, d: 0.7, mon: 1, chair: false }); F.task(cx + sx, cz - 0.25, Math.PI, M.grey); F.desk(cx + sx, cz + 1.05, Math.PI, { w: 1.4, d: 0.7, mon: 1, chair: false }); F.task(cx + sx, cz + 0.25, 0, M.grey); } };
    pod(34.6, 17.6); pod(38.0, 17.6);
    // scale-model table: miniature twisting tower on a plinth
    F.table(35.8, 24.3, 2.6, 1.3, { top: M.white }); { const m = F.furn, bx = 35.8, bz = 24.3; for (let i = 0; i < 20; i++) { const s = rbox(m, 0.34 - i * 0.008, 0.045, 0.3 - i * 0.006, 0.01, M.blue, bx, 0.74 + i * 0.045, bz, i * 0.12); s.castShadow = false; } for (const [dx, dz, h] of [[-0.9, 0.0, 0.3], [-0.6, 0.35, 0.22], [0.8, -0.25, 0.28], [0.5, 0.3, 0.18], [1.0, 0.2, 0.2]]) box(m, 0.2, h, 0.2, M.cream, bx + dx, 0.72, bz + dz); }
    for (const [x, z, rr] of [[34.5, 22.9, Math.PI], [37.1, 22.9, Math.PI], [34.5, 25.7, 0], [37.1, 25.7, 0]]) F.chair(x, z, rr, M.cream);
    F.table(31.5, 25.0, 1.1, 1.1, { round: true, top: M.white }); F.chair(31.5, 24.1, 0, M.rust); F.chair(31.5, 25.9, Math.PI, M.rust); F.chair(30.6, 25.0, -Math.PI / 2, M.rust); F.chair(32.4, 25.0, Math.PI / 2, M.rust);
    F.screen(39.93, 1.05, 21.0, -Math.PI / 2, 1.9, 1.07, tex.listing); F.screen(39.93, 1.05, 23.5, -Math.PI / 2, 1.9, 1.07, tex.listing);
    F.cabinet(33.0, 14.5, 0, 1.6, 0.9, 0.4, M.walnut, { tag: "brochures" });
    board("MARINA REALTY · PROPERTY ADVISORS", 26.07, 2.55, 21.0, Math.PI / 2, 3.0, 0.45, "#f4efe6", "#7a4d2b", 24);
  }
  // ---------------------------------------------------------------- lift lobby + business lounge
  F.plant(14.9, 10.2, 1.1, 1.8); F.plant(25.1, 10.2, 1.1, 1.8);
  F.rug(20, 21.5, 7.0, 4.6, M.cream);
  F.sofa(18.2, 18.2, 0, 2.6, M.grey); F.sofa(21.8, 18.2, 0, 2.6, M.grey); F.coffee(20, 20.0, 1.4, 0.8); F.armchair(16.2, 21.7, Math.PI / 2, M.sage); F.armchair(23.8, 21.7, -Math.PI / 2, M.sage); F.side(15.4, 19.6); F.side(24.6, 19.6);
  F.table(20, 25.2, 1.2, 1.2, { round: true, top: M.walnut }); [[19.2, 25.2, -Math.PI / 2], [20.8, 25.2, Math.PI / 2]].forEach(([x, z, r]) => F.chair(x, z, r, M.rust)); F.plant(15.2, 27.2, 1.1, 1.8); F.plant(24.8, 27.2, 1.1, 1.8);
  F.cabinet(20, 15.3, Math.PI, 3.2, 0.9, 0.45, M.walnut, { tag: "console" });
  board("FLOOR 12 · BUSINESS LOUNGE", 20, 2.6, 14.95, 0, 3.4, 0.4, "#14202e", "#f2e3c6", 28);
  board("FLOOR 12", 20, 2.95, 9.18, 0, 1.8, 0.3, "#14202e", "#f2e3c6", 40);

  F.finish();
  // lift doors open / close (animated)
  F.liftOpen = (on) => F.liftDoors.forEach((d) => (d.target = on ? 1 : 0));
  F.update = (dt) => { F.updateDoors(dt); F.liftDoors.forEach((d) => { d.cur += (d.target - d.cur) * Math.min(1, dt * 3); d.a.position.x = d.ax - d.cur * 0.55; d.b.position.x = d.bx + d.cur * 0.55; }); };
  F.roomsList = Object.values(F.rooms);
  F.tenants = [["Medical center", "CareFirst Medical Center", "reception, 2 consulting rooms, treatment room, imaging (X-ray)", "190 m²"], ["IT company", "NimbusTech IT & Cloud", "server room, manager office, glass meeting room, open-plan pods, kitchenette", "190 m²"], ["Trading office", "Azure Trading Co.", "trading floor with screen wall, 9 trading desks, glass meeting room, reception", "190 m²"], ["Real-estate agency", "Marina Realty", "reception, 4 agent desks, scale-model table, listing screens, client lounge", "190 m²"]];
  return F;
}
