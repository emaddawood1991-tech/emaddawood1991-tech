import * as THREE from "three";
import { createKit } from "./plans_core.js";

// Floor 50 - three sky residences around a private lift lobby: 3-bedroom (west), 1-bedroom (centre), 2-bedroom (east).
// Plan: x 0..34 (west->east), z 0..20 (core side -> Gulf glass), terraces z 20..26.5, each with its own raised glass pool.
export function buildApts(H) {
  const { box, rbox, cyl, canvasTex, art, artTex } = H;
  const kit = createKit(H), M = kit.M, F = kit.floor("apts", 34, 20, { wallH: 3.6, ceilH: 3.3 });
  F.slab(0, 20, 34, 26.5);
  const board = (txt, x, y, z, rot, w, h, bg, fg, fs) => { const t = canvasTex(512, Math.max(64, Math.round(512 * h / w)), (c, ww, hh) => { c.fillStyle = bg; c.fillRect(0, 0, ww, hh); c.fillStyle = fg; c.font = `600 ${fs || 44}px Georgia,serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, ww / 2, hh / 2); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(x, y, z); m.rotation.y = rot; F.deco.add(m); return m; };
  const frame = (x, y, z, rot, w, h, a, b, c2) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: artTex(a, b, c2), toneMapped: false })); m.position.set(x, y, z); m.rotation.y = rot; F.deco.add(m); };

  // ---------------------------------------------------------------- floors
  const deck = new THREE.MeshStandardMaterial({ color: 0xb9a58a, roughness: 0.7, map: M.wood.map });
  F.patch(0, 0, 14, 20, M.wood); F.patch(14, 0, 24, 9, M.stone); F.patch(14, 9, 24, 20, M.wood); F.patch(24, 7, 34, 20, M.wood); F.patch(24, 0, 34, 7, M.core);
  F.patch(0, 5.5, 14, 7.5, M.stone); F.patch(0, 20, 34, 26.5, deck, 0.02);
  // wet-room tiles
  F.patch(6.3, 7.5, 12, 12.5, M.stoneDark, 0.02); F.patch(29, 18, 34, 20, M.stoneDark, 0.02); F.patch(14, 10, 17, 14.5, M.stoneDark, 0.02);

  // ---------------------------------------------------------------- shell: Gulf glass, west/east glass, solid core side
  F.wall(0, 20, 34, 20, { glass: true, t: 0.1, doors: [{ c: 4.0, w: 1.4, swing: -1, name: "3BR terrace door", glass: true }, { c: 10.0, w: 1.4, swing: -1, name: "3BR terrace door 2", glass: true }, { c: 19.0, w: 1.4, swing: -1, name: "1BR terrace door", glass: true }, { c: 26.5, w: 1.4, swing: -1, name: "2BR terrace door", glass: true }] });
  F.wall(0, 0, 0, 20, { glass: true, t: 0.1 }); F.wall(34, 0, 34, 20, { glass: true, t: 0.1 }); F.wall(0, 0, 14, 0, { glass: true, t: 0.1 }); F.wall(24, 0, 34, 0, { t: 0.2 });
  // terrace: low glass balustrade, frosted dividers
  F.wall(0, 26.5, 34, 26.5, { glass: true, t: 0.05, h: 1.15 }); F.wall(0, 20, 0, 26.5, { glass: true, t: 0.05, h: 1.15 }); F.wall(34, 20, 34, 26.5, { glass: true, t: 0.05, h: 1.15 });
  F.wall(14, 20, 14, 26.5, { glass: true, mat: M.frostGlass, t: 0.06, h: 1.9 }); F.wall(24, 20, 24, 26.5, { glass: true, mat: M.frostGlass, t: 0.06, h: 1.9 });

  // ---------------------------------------------------------------- core (lifts + stairs) and private lobby
  F.wall(14, 0, 14, 4.5, { t: 0.3, mat: M.core }); F.wall(24, 0, 24, 4.5, { t: 0.3, mat: M.core }); F.wall(14, 4.5, 24, 4.5, { t: 0.3, mat: M.core }); F.wall(14, 0, 24, 0, { t: 0.3, mat: M.core });
  const LIFTX = [16.0, 18.0, 20.0, 22.0];
  LIFTX.forEach((x, i) => { const a = box(F.walls, 0.55, 2.3, 0.05, M.steel, x - 0.275, 0, 4.36), b = box(F.walls, 0.55, 2.3, 0.05, M.steel, x + 0.275, 0, 4.36); F.liftDoors.push({ a, b, ax: x - 0.275, bx: x + 0.275, cur: 0, target: 0 }); box(F.walls, 1.4, 0.12, 0.06, M.brass, x, 2.4, 4.35);
    box(F.walls, 0.1, 0.22, 0.05, M.steel, x + 0.9, 1.0, 4.36); F.fp("call" + i, x + 0.9, 4.37, 0.1, 0.05, 0, { wall: true, soft: true }); });
  board("RESIDENTIAL LIFTS · EXPRESS", 19, 2.9, 4.33, 0, 5.4, 0.36, "#14202e", "#f2e3c6", 26);
  board("FLOOR 50", 19, 3.25, 4.33, 0, 1.8, 0.3, "#14202e", "#f2e3c6", 40);
  // lobby: three doors, one per residence + service
  F.wall(24, 4.5, 24, 7, { t: 0.2, doors: [{ c: 5.7, w: 1.0, swing: 1, name: "Service door" }] });
  F.wall(14, 9, 24, 9, { t: 0.2, doors: [{ c: 19.0, w: 1.1, swing: -1, name: "1-bedroom entrance" }] });
  F.wall(24, 7, 24, 20, { t: 0.2, doors: [{ c: 8.2, w: 1.2, swing: 1, name: "2-bedroom entrance" }] });
  F.wall(14, 9, 14, 20, { t: 0.2 });
  // the 3BR front door sits in x=14 between z 4.5..9 (replaces the plain wall above)
  F.wall(14, 4.5, 14, 9, { t: 0.2, doors: [{ c: 6.7, w: 1.3, swing: -1, name: "3-bedroom entrance" }] });
  // service strip x24..34 z0..7
  F.wall(24, 7, 34, 7, { t: 0.2 }); F.wall(34, 0, 34, 7, { t: 0.2 });

  // ---------------------------------------------------------------- 3-BEDROOM (x0..14, z0..20)
  F.wall(0, 5.5, 14, 5.5, { t: 0.15, doors: [{ c: 5.0, w: 0.95, swing: 1, name: "3BR bedroom 2 door" }, { c: 9.2, w: 0.95, swing: 1, name: "3BR bedroom 3 door" }] }); F.wall(7, 0, 7, 5.5, { t: 0.15 });
  F.wall(0, 7.5, 12, 7.5, { t: 0.15, doors: [{ c: 3.5, w: 1.0, swing: -1, name: "3BR master door" }, { c: 10.8, w: 0.9, swing: -1, name: "3BR guest bath door" }] });
  F.wall(6.3, 7.5, 6.3, 12.5, { t: 0.15, doors: [{ c: 8.9, w: 0.9, swing: 1, name: "3BR master bath door" }] }); F.wall(9.5, 7.5, 9.5, 12.5, { t: 0.15 }); F.wall(12, 7.5, 12, 12.5, { t: 0.15 });
  F.wall(0, 12.5, 12, 12.5, { t: 0.15 });
  // ---------------------------------------------------------------- 1-BEDROOM (x14..24, z9..20)
  F.wall(14, 10, 17, 10, { t: 0.15 }); F.wall(17, 10, 17, 14.5, { t: 0.15 }); F.wall(14, 14.5, 19, 14.5, { t: 0.15, doors: [{ c: 15.5, w: 0.9, swing: 1, name: "1BR bath door" }] });
  F.wall(19, 14.5, 19, 20, { t: 0.15, doors: [{ c: 16.0, w: 0.95, swing: -1, name: "1BR bedroom door" }] });
  // ---------------------------------------------------------------- 2-BEDROOM (x24..34, z7..20)
  F.wall(29, 7, 29, 20, { t: 0.15, doors: [{ c: 9.0, w: 0.95, swing: 1, name: "2BR bedroom 2 door" }, { c: 14.2, w: 0.95, swing: 1, name: "2BR master door" }] });
  F.wall(29, 13, 34, 13, { t: 0.15 }); F.wall(29, 18, 34, 18, { t: 0.15, doors: [{ c: 30.5, w: 0.85, swing: -1, name: "2BR master bath door" }] });

  // ---------------------------------------------------------------- lights
  const R = [["b2", "3BR · bedroom 2", 0, 0, 7, 5.5], ["b3", "3BR · bedroom 3", 7, 0, 14, 5.5], ["cor", "3BR · hall", 0, 5.5, 14, 7.5], ["mas", "3BR · master suite", 0, 7.5, 6.3, 12.5], ["mba", "3BR · master bath", 6.3, 7.5, 9.5, 12.5], ["gba", "3BR · guest bath", 9.5, 7.5, 12, 12.5], ["liv3", "3BR · living / dining / kitchen", 0, 12.5, 14, 20],
    ["lob", "Private lobby", 14, 4.5, 24, 9], ["liv1", "1BR · living / kitchen", 17, 10, 24, 20], ["bd1", "1BR · bedroom", 14, 14.5, 19, 20], ["ba1", "1BR · bath", 14, 10, 17, 14.5],
    ["liv2", "2BR · living / kitchen", 24, 7, 29, 20], ["bd2", "2BR · bedroom 2", 29, 7, 34, 13], ["mas2", "2BR · master bedroom", 29, 13, 34, 18], ["mba2", "2BR · master bath", 29, 18, 34, 20],
    ["ter3", "3BR · terrace", 0, 20, 14, 26.5], ["ter1", "1BR · terrace", 14, 20, 24, 26.5], ["ter2", "2BR · terrace", 24, 20, 34, 26.5]];
  R.forEach(([k, n, x1, z1, x2, z2]) => F.room(k, n, x1, z1, x2, z2, { round: true, pitch: 2.8, inten: k.startsWith("ter") ? 5 : 6.5, range: 14 }));

  // helpers --------------------------------------------------------------
  const sunbed = (x, z, rot) => { const b = F.furn; const c = F.furn; const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; c.add(g); rbox(g, 0.75, 0.14, 2.0, 0.05, M.cream, 0, 0.2, 0); const back = rbox(g, 0.75, 0.14, 0.7, 0.05, M.cream, 0, 0.35, -0.75); back.rotation.x = 0.55; for (const sx of [-0.3, 0.3]) for (const sz of [-0.9, 0.9]) cyl(g, 0.02, 0.02, 0.2, M.brass, sx, 0, sz, 6); F.fp("sunbed", x, z, 0.75, 2.0, rot); };
  const planter = (x, z, w = 1.2) => { box(F.furn, w, 0.55, 0.45, M.stoneDark, x, 0, z); F.plant(x, z, 0.8, 1.2); };
  const poolFp = (P, cx, cz, L, Wd) => F.fp("pool", cx, cz, L + 0.8, Wd + 0.8, 0);
  const bathRoom = null;

  // ================================================================ 3-BEDROOM FURNITURE
  F.bed(4.8, 2.7, -Math.PI / 2, "queen"); F.bedside(6.5, 1.5, -Math.PI / 2); F.bedside(6.5, 3.9, -Math.PI / 2); F.tall(1.6, 5.15, Math.PI, 2.4, 0.6, 2.4, M.walnut); F.rug(3.6, 2.7, 2.6, 2.2, M.cream); F.armchair(1.0, 1.0, 0.8, M.sage); F.side(1.0, 2.2, true);
  F.bed(9.3, 2.7, Math.PI / 2, "queen"); F.bedside(7.5, 1.5, Math.PI / 2); F.bedside(7.5, 3.9, Math.PI / 2); F.tall(11.0, 5.15, Math.PI, 2.4, 0.6, 2.4, M.walnut); F.rug(10.0, 2.7, 2.6, 2.2, M.cream); F.desk(12.9, 2.2, -Math.PI / 2, { w: 1.4, d: 0.65, mon: 1, chair: true });
  // hall
  F.cabinet(11.5, 6.65, Math.PI, 1.2, 0.8, 0.35, M.walnut, { tag: "hall-console" }); frame(7.0, 1.7, 7.42, Math.PI, 1.2, 0.9, "#c9a25a", "#2a3f5e", "#f2e3c6");
  // master suite: bed against the south wall (z=12.5), wardrobe on the west wall, bench, armchair
  F.bed(3.15, 10.4, Math.PI, "king"); F.bedside(1.7, 12.1, Math.PI); F.bedside(4.6, 12.1, Math.PI); F.rug(3.15, 9.3, 3.0, 2.6, M.cream); F.armchair(5.5, 8.4, Math.PI * 0.9, M.sage);
  // master bath (x6.3..9.5): tub, shower, double vanity, WC
  F.tub(7.15, 10.2, Math.PI / 2); F.shower(8.8, 8.3, 0, 1.0, 1.0); F.basin(7.0, 12.1, Math.PI, 0.9); F.basin(8.3, 12.1, Math.PI, 0.9); F.wcSet(9.05, 10.5, -Math.PI / 2); F.mirror(7.65, 1.45, 12.4, Math.PI, 2.2, 0.9);
  // guest bath (x9.5..12)
  F.shower(11.4, 11.8, 0, 1.0, 1.0); F.basin(9.85, 10.2, Math.PI / 2, 0.8); F.wcSet(11.575, 10.2, -Math.PI / 2);
  // living / dining / kitchen (z12.5..20)
  F.kitchenRun(2.8, 12.9, 0, 5.0, { wallCab: true, hob: 3.2, sink: 1.0 }); F.fridge(6.0, 12.95, 0); F.island(3.0, 14.9, 0, 2.8, 1.0); F.stool(2.1, 15.75); F.stool(3.0, 15.75); F.stool(3.9, 15.75);
  F.table(9.0, 15.0, 2.6, 1.1, { top: M.walnut }); F.chairsAround(9.0, 15.0, 2.6, 1.1, 6, 0, M.cream, { ends: true });
  F.sofa(4.2, 17.9, 0, 3.0, M.grey); F.coffee(4.2, 19.1, 1.2, 0.6); F.armchair(1.3, 18.6, Math.PI / 2, M.sage); F.armchair(7.0, 18.8, -Math.PI / 2, M.rust); F.rug(4.2, 18.5, 4.2, 2.6, M.cream); F.side(0.6, 17.4, true);
  F.tv(11.6, 17.5, -Math.PI / 2, 1.4, true); F.sofa(9.6, 18.0, Math.PI / 2, 2.0, M.cream); F.plant(0.5, 19.3, 1.0, 1.6); F.plant(13.4, 13.2, 1.0, 1.6);
  frame(0.1, 1.8, 16.8, Math.PI / 2, 1.0, 1.4, "#274c5e", "#e0c28f", "#f2e3c6");
  // terrace 3BR
  F.pool(7.0, 23.2, 9.0, 2.4, { side: -1, name: "3-bedroom pool" }); poolFp(null, 7.0, 23.2, 9.0, 2.4);
  sunbed(2.6, 21.0, Math.PI / 2); sunbed(12.0, 21.0, Math.PI / 2); sunbed(4.2, 25.6, Math.PI / 2); sunbed(9.8, 25.6, Math.PI / 2); planter(13.0, 26.0, 1.0); F.table(7.0, 25.8, 0.0001, 0.0001, { round: true });
  // ================================================================ 1-BEDROOM FURNITURE
  F.bed(15.4, 17.2, Math.PI / 2, "queen"); F.bedside(14.5, 15.6, Math.PI / 2); F.bedside(14.5, 18.8, Math.PI / 2); F.tall(18.0, 14.85, 0, 1.5, 0.6, 2.4, M.walnut); F.rug(17.0, 17.2, 2.6, 2.2, M.cream); F.armchair(18.2, 19.3, Math.PI, M.sage);
  F.shower(14.7, 10.7, 0, 1.0, 1.0); F.basin(16.5, 12.3, -Math.PI / 2, 0.8); F.wcSet(14.45, 12.4, Math.PI / 2); F.mirror(16.9, 1.4, 12.3, -Math.PI / 2, 0.8, 0.8);
  F.cabinet(21.8, 9.3, 0, 1.4, 0.9, 0.4, M.walnut, { tag: "foyer-console" }); F.kitchenRun(23.55, 12.0, Math.PI / 2, 3.2, { wallCab: true, hob: 0.0, sink: -1.0 }); F.fridge(23.55, 14.0, Math.PI / 2);
  F.table(20.6, 12.6, 1.2, 1.2, { round: true }); F.chair(20.6, 11.7, 0, M.cream); F.chair(20.6, 13.5, Math.PI, M.cream); F.chair(19.7, 12.6, -Math.PI / 2, M.cream); F.chair(21.5, 12.6, Math.PI / 2, M.cream);
  F.sofa(20.3, 17.4, Math.PI / 2, 2.4, M.grey); F.coffee(21.9, 17.4, 0.9, 0.9, true); F.tv(23.65, 17.4, -Math.PI / 2, 1.3, true); F.armchair(22.2, 19.3, Math.PI, M.rust); F.rug(21.4, 17.4, 3.4, 2.8, M.cream); F.plant(23.5, 9.7, 0.9, 1.4);
  F.pool(19.0, 23.2, 6.0, 2.2, { side: -1, name: "1-bedroom pool" }); poolFp(null, 19.0, 23.2, 6.0, 2.2);
  sunbed(15.8, 25.6, Math.PI / 2); sunbed(21.0, 25.6, Math.PI / 2); sunbed(16.5, 21.0, Math.PI / 2); sunbed(22.0, 21.0, Math.PI / 2); planter(23.0, 26.0, 1.0);
  // ================================================================ 2-BEDROOM FURNITURE
  F.bed(31.5, 8.3, 0, "queen"); F.bedside(30.1, 7.5, 0); F.bedside(32.9, 7.5, 0); F.tall(29.4, 11.4, Math.PI / 2, 2.2, 0.6, 2.4, M.walnut); F.armchair(33.2, 11.7, -Math.PI / 2, M.sage); F.rug(31.5, 9.1, 2.6, 2.4, M.cream);
  F.bed(31.5, 14.3, 0, "king"); F.bedside(29.9, 13.5, 0); F.bedside(33.1, 13.5, 0); F.tall(29.4, 16.5, Math.PI / 2, 2.2, 0.6, 2.4, M.walnut); F.sofa(31.5, 16.7, Math.PI, 1.4, M.grey); F.rug(31.5, 15.2, 3.0, 2.6, M.cream);
  F.shower(29.9, 19.2, 0, 1.0, 1.0); F.basin(31.6, 18.45, 0, 0.9); F.wcSet(32.8, 18.45, 0); F.tub(33.0, 19.45, 0);
  F.cabinet(26.5, 7.4, 0, 1.4, 0.9, 0.4, M.walnut, { tag: "foyer-console2" }); F.kitchenRun(24.45, 11.9, Math.PI / 2, 3.2, { wallCab: true, hob: 0.0, sink: -1.0 }); F.fridge(24.5, 13.9, Math.PI / 2); F.island(26.7, 11.9, Math.PI / 2, 2.2, 1.0); F.stool(28.0, 11.3); F.stool(28.0, 12.5);
  F.table(26.5, 15.6, 2.0, 1.0, { top: M.walnut, rot: Math.PI / 2 }); F.chairsAround(26.5, 15.6, 2.0, 1.0, 4, Math.PI / 2, M.cream);
  F.sofa(26.6, 17.9, 0, 2.4, M.grey); F.coffee(26.6, 19.1, 1.0, 0.5); F.armchair(24.9, 18.9, Math.PI / 2, M.rust); F.armchair(28.4, 18.9, -Math.PI / 2, M.sage); F.plant(24.5, 9.3, 0.9, 1.4);
  F.pool(29.5, 23.2, 7.0, 2.4, { side: -1, name: "2-bedroom pool" }); poolFp(null, 29.5, 23.2, 7.0, 2.4);
  sunbed(29.0, 21.0, Math.PI / 2); sunbed(32.4, 21.0, Math.PI / 2); sunbed(27.0, 25.6, Math.PI / 2); sunbed(30.8, 25.6, Math.PI / 2); planter(33.0, 26.0, 1.0);
  // lobby
  F.sofa(19, 8.4, Math.PI, 2.2, M.cream); F.plant(14.9, 5.2, 1.1, 1.8); F.plant(23.1, 5.2, 1.1, 1.8); F.table(16.2, 7.5, 0.7, 0.7, { round: true }); F.table(21.8, 7.5, 0.7, 0.7, { round: true });
  frame(14.1, 1.9, 6.7, Math.PI / 2, 1.0, 1.4, "#274c5e", "#e0c28f", "#f2e3c6");
  board("SKY RESIDENCES · FLOOR 50", 19, 2.6, 8.92, Math.PI, 3.6, 0.4, "#14202e", "#f2e3c6", 28);
  board("3 BEDROOM", 14.07, 2.7, 6.7, Math.PI / 2, 1.6, 0.28, "#f2e3c6", "#14202e", 36); board("2 BEDROOM", 23.93, 2.7, 8.2, -Math.PI / 2, 1.6, 0.28, "#f2e3c6", "#14202e", 36); board("1 BEDROOM", 19, 2.7, 9.07, 0, 1.6, 0.28, "#f2e3c6", "#14202e", 36);
  board("SERVICE", 23.93, 2.5, 5.7, -Math.PI / 2, 1.0, 0.24, "#555a62", "#eee", 30);

  F.extentD = 26.5;
  F.finish();
  F.liftOpen = (on) => F.liftDoors.forEach((d) => (d.target = on ? 1 : 0));
  F.update = (dt) => { F.updateDoors(dt); F.liftDoors.forEach((d) => { d.cur += (d.target - d.cur) * Math.min(1, dt * 3); d.a.position.x = d.ax - d.cur * 0.5; d.b.position.x = d.bx + d.cur * 0.5; }); };
  F.setNight = (k) => F.pools.forEach((p) => p.setNight(k));
  F.units = [{ name: "3-bedroom residence", beds: 3, baths: 3, area: "280 m²", terrace: "91 m²", pool: F.pools[0] }, { name: "1-bedroom residence", beds: 1, baths: 1, area: "110 m²", terrace: "65 m²", pool: F.pools[1] }, { name: "2-bedroom residence", beds: 2, baths: 2, area: "130 m²", terrace: "65 m²", pool: F.pools[2] }];
  return F;
}
