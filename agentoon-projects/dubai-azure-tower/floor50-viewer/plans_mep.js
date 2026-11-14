import * as THREE from "three";

// Behind-the-wall systems for a plan floor (illustrative routing): electricity, water, sewage, fire, air-con, sensors + window blinds.
// Everything is generated from the plan itself: rooms, fixtures (from the furniture footprints) and the riser positions.
export function addMEP(F, opt) {
  const { risers, blinds = [], ceilY = F.CEIL } = opt, TOP = ceilY + 0.25;
  const G = { elec: new THREE.Group(), water: new THREE.Group(), sewer: new THREE.Group(), fire: new THREE.Group(), ac: new THREE.Group(), sensors: new THREE.Group(), blinds: new THREE.Group() };
  Object.values(G).forEach((g) => { g.visible = false; F.g.add(g); }); F.mep = G; F.mepLabels = [];
  const mats = {}, mt = (c) => (mats[c] = mats[c] || new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.4, roughness: 0.5 }));
  const UP = new THREE.Vector3(0, 1, 0), V = (a) => new THREE.Vector3(...a);
  const seg = (g, a, b, r, c) => { const A = V(a), B = V(b), len = A.distanceTo(B); if (len < 0.01) return; const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mt(c)); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize()); g.add(m); };
  const poly = (g, pts, r, c) => { for (let i = 1; i < pts.length; i++) { seg(g, pts[i - 1], pts[i], r, c); if (i < pts.length - 1) { const s = new THREE.Mesh(new THREE.SphereGeometry(r * 1.15, 8, 6), mt(c)); s.position.set(...pts[i]); g.add(s); } } };
  const bx = (g, w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt(c)); m.position.set(x, y, z); g.add(m); return m; };
  const disc = (g, r, c, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 14), mt(c)); m.position.set(x, y, z); g.add(m); return m; };
  const ball = (g, r, c, x, y, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mt(c)); m.position.set(x, y, z); g.add(m); return m; };
  const lbl = (l, p, t, c) => F.mepLabels.push({ l, p, t, c });
  const near = (x) => risers.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
  const rooms = Object.values(F.rooms).filter((r) => !r.key.startsWith("ter") && r.key !== "lng" || r.key === "lng");
  const fix = (tag) => F.reg.filter((r) => r.tag === tag);
  const COL = { eL: 0xffd21f, eP: 0xff8a1f, eH: 0xff4a3a, cold: 0x2f86ff, hot: 0xff3b30, soil: 0x9a4d10, waste: 0xb5bd2a, fire: 0xff3040, chw: 0x25d9e8, chr: 0xff9f1c, duct: 0xaab4bd, cond: 0x4cd964, sen: 0xb47cff };

  // ------------------------------------------------ risers (vertical shafts)
  risers.forEach((r, i) => {
    const o = (k) => r.x + (i % 2 ? -1 : 1) * 0.12 * k;
    seg(G.water, [o(1), -0.4, r.z], [o(1), TOP + 0.2, r.z], 0.045, COL.cold); seg(G.water, [o(2), -0.4, r.z], [o(2), TOP + 0.2, r.z], 0.04, COL.hot);
    seg(G.sewer, [o(3), -0.5, r.z], [o(3), TOP + 0.2, r.z], 0.11, COL.soil); seg(G.sewer, [o(4.2), -0.5, r.z], [o(4.2), TOP + 0.2, r.z], 0.03, 0xd3dae0);
    seg(G.fire, [o(5), -0.4, r.z], [o(5), TOP + 0.2, r.z], 0.07, COL.fire);
    seg(G.ac, [o(6), -0.4, r.z], [o(6), TOP + 0.2, r.z], 0.06, COL.chw); seg(G.ac, [o(7), -0.4, r.z], [o(7), TOP + 0.2, r.z], 0.06, COL.chr);
    bx(G.elec, 0.5, 0.9, 0.18, 0xffb21f, r.x, 1.5, r.z + 0.5);   // distribution board
    bx(G.fire, 0.4, 0.5, 0.12, 0x35ff7a, r.x - 0.5, 1.5, r.z + 0.5);   // fire alarm panel
    disc(G.fire, 0.22, COL.fire, r.x + 0.6, 1.2, r.z + 0.5).rotation.x = Math.PI / 2;   // hose reel
    seg(G.elec, [r.x, 1.9, r.z + 0.5], [r.x, TOP, r.z + 0.5], 0.05, COL.eH);
  });
  const r0 = risers[0];
  lbl("water", [r0.x, 3.0, r0.z], "Cold + hot water risers", "#3d8bff"); lbl("sewer", [r0.x + 0.4, 2.4, r0.z], "Soil stack → building drain (vent to roof)", "#b07a3c");
  lbl("fire", [r0.x, 3.2, r0.z], "Wet fire riser + floor valve", "#ff4a4f"); lbl("fire", [r0.x - 0.5, 1.9, r0.z + 0.5], "Fire alarm panel (FACP)", "#35ff7a"); lbl("fire", [r0.x + 0.6, 1.5, r0.z + 0.5], "Hose reel", "#ff4a4f");
  lbl("elec", [r0.x, 2.1, r0.z + 0.5], "Distribution board", "#ffc21a"); lbl("ac", [r0.x, 2.6, r0.z], "Chilled-water supply / return", "#25d9e8");

  // ------------------------------------------------ per-room: electricity, fire, AC, sensors
  let nS = 0, nSm = 0;
  rooms.forEach((r, ri) => {
    const cx = (r.x1 + r.x2) / 2, cz = (r.z1 + r.z2) / 2, w = r.x2 - r.x1, d = r.z2 - r.z1, R = near(cx), outside = r.key.startsWith("ter");
    if (outside) return;
    // electricity: ceiling trunking from the board, drops to lights, sockets (orange) and switch (yellow)
    poly(G.elec, [[R.x + 0.1, TOP, R.z + 0.5], [R.x + 0.1, TOP, cz + 0.1], [cx, TOP, cz + 0.1]], 0.03, COL.eL);
    seg(G.elec, [cx, TOP, cz + 0.1], [cx, ceilY - 0.03, cz], 0.02, COL.eL);
    [[r.x1 + 0.14, cz - d * 0.2], [r.x2 - 0.14, cz + d * 0.2], [cx, r.z1 + 0.14]].forEach(([x, z], i) => { bx(G.elec, 0.09, 0.09, 0.03, COL.eP, x, 0.3, z); seg(G.elec, [x, 0.3, z], [x, TOP - 0.05, z], 0.016, COL.eP); if (i === 0) seg(G.elec, [x, TOP - 0.05, z], [R.x + 0.1, TOP - 0.05, z], 0.016, COL.eP); });
    bx(G.elec, 0.08, 0.12, 0.03, COL.eL, r.x2 - 0.14, 1.2, r.z1 + 0.5); seg(G.elec, [r.x2 - 0.14, 1.2, r.z1 + 0.5], [r.x2 - 0.14, TOP, r.z1 + 0.5], 0.014, COL.eL);
    // fire: sprinkler grid (red pipes above ceiling, heads below), smoke detector
    const nx = Math.max(1, Math.round(w / 3.6)), nz = Math.max(1, Math.round(d / 3.6));
    for (let i = 0; i < nx; i++) { const x = r.x1 + ((i + 0.5) * w) / nx; seg(G.fire, [x, TOP + 0.08, r.z1 + 0.15], [x, TOP + 0.08, r.z2 - 0.15], 0.03, COL.fire); for (let j = 0; j < nz; j++) { const z = r.z1 + ((j + 0.5) * d) / nz; seg(G.fire, [x, TOP + 0.08, z], [x, ceilY - 0.06, z], 0.015, COL.fire); ball(G.fire, 0.045, 0xff2030, x, ceilY - 0.08, z); nS++; if (nS === 4) lbl("fire", [x, ceilY - 0.05, z], "Sprinkler head (red bulb)", "#ff4a4f"); } }
    seg(G.fire, [R.x + 0.6, TOP + 0.08, R.z], [R.x + 0.6, TOP + 0.08, cz], 0.04, COL.fire); seg(G.fire, [R.x + 0.6, TOP + 0.08, cz], [r.x1 + w / nx / 2, TOP + 0.08, cz], 0.04, COL.fire);
    disc(G.fire, 0.1, 0xffffff, cx + 0.9, ceilY - 0.04, cz - 0.7); nSm++; if (nSm === 3) lbl("fire", [cx + 0.9, ceilY - 0.04, cz - 0.7], "Smoke detector", "#ffffff");
    // air-con: fan-coil unit above the ceiling, supply duct to two diffusers, return grille, chilled water pipes, thermostat
    const fc = bx(G.ac, Math.min(1.1, w * 0.4), 0.3, 0.6, 0x9aa4ae, cx, TOP - 0.05, cz - 0.5);
    bx(G.ac, Math.min(2.6, w * 0.7), 0.16, 0.22, COL.duct, cx, TOP - 0.1, cz - 0.1);
    [-1, 1].forEach((s) => { const dx = s * Math.min(1.3, w * 0.3); bx(G.ac, 0.45, 0.025, 0.45, COL.chw, cx + dx, ceilY - 0.05, cz - 0.1); seg(G.ac, [cx + dx, TOP - 0.1, cz - 0.1], [cx + dx, ceilY - 0.05, cz - 0.1], 0.07, COL.duct); });
    bx(G.ac, 0.5, 0.025, 0.3, COL.chr, cx, ceilY - 0.05, cz + 0.6);
    poly(G.ac, [[R.x + 0.72, TOP - 0.15, R.z], [R.x + 0.72, TOP - 0.15, cz - 0.5], [cx - 0.3, TOP - 0.15, cz - 0.5]], 0.028, COL.chw); poly(G.ac, [[R.x + 0.84, TOP - 0.2, R.z], [R.x + 0.84, TOP - 0.2, cz - 0.4], [cx - 0.2, TOP - 0.2, cz - 0.4]], 0.028, COL.chr);
    seg(G.ac, [cx + 0.45, TOP - 0.15, cz - 0.5], [R.x + 0.96, TOP - 0.15, cz - 0.5], 0.02, COL.cond);
    bx(G.ac, 0.1, 0.1, 0.03, COL.sen, r.x1 + 0.12, 1.5, cz + d * 0.1); seg(G.ac, [r.x1 + 0.12, 1.5, cz + d * 0.1], [r.x1 + 0.12, TOP - 0.1, cz + d * 0.1], 0.012, COL.sen);
    if (ri === 3) { lbl("ac", [cx, TOP, cz - 0.5], "Fan-coil unit (FCU)", "#25d9e8"); lbl("ac", [cx + Math.min(1.3, w * 0.3), ceilY - 0.05, cz - 0.1], "Supply diffuser", "#25d9e8"); lbl("ac", [cx, ceilY - 0.05, cz + 0.6], "Return grille", "#ff9f1c"); lbl("ac", [r.x1 + 0.12, 1.6, cz + d * 0.1], "Thermostat", "#b47cff"); }
    // sensors: presence (PIR) on the ceiling, CO2 + temperature on the wall
    const pir = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mt(COL.sen)); pir.position.set(cx - 0.8, ceilY - 0.03, cz + 0.8); pir.rotation.x = Math.PI; G.sensors.add(pir);
    bx(G.sensors, 0.1, 0.14, 0.04, 0x35d9c8, r.x2 - 0.12, 1.6, cz - d * 0.15);
    if (ri === 2) { lbl("sensors", [cx - 0.8, ceilY - 0.05, cz + 0.8], "Presence sensor (lights + AC)", "#b47cff"); lbl("sensors", [r.x2 - 0.12, 1.7, cz - d * 0.15], "CO₂ + temperature sensor", "#35d9c8"); }
  });

  // ------------------------------------------------ fixtures: water in, waste out, leak sensors
  const wetTags = [["wc", 0.3, 0, true], ["basin", 0.6, 1, false], ["shower", 1.0, 1, false], ["tub", 0.5, 1, false], ["kitchen", 0.95, 1, false], ["island", 0, 0, false]];
  let wl = 0;
  wetTags.forEach(([tag, h, hot, soil]) => fix(tag).forEach((f) => {
    if (tag === "island") return;
    const R = near(f.cx), x = f.cx, z = f.cz;
    poly(G.water, [[R.x + 0.1, 0.12, R.z + 0.3], [R.x + 0.1, 0.12, z], [x + 0.06, 0.12, z], [x + 0.06, h, z]], 0.02, COL.cold);
    if (hot) poly(G.water, [[R.x + 0.2, 0.16, R.z + 0.3], [R.x + 0.2, 0.16, z + 0.05], [x + 0.14, 0.16, z + 0.05], [x + 0.14, h, z + 0.05]], 0.02, COL.hot);
    ball(G.water, 0.04, 0x9ec8ff, x + 0.06, 0.25, z);
    poly(G.sewer, [[x, -0.12, z], [R.x + 0.4, -0.12, z], [R.x + 0.4, -0.12, R.z + 0.3]], soil ? 0.05 : 0.03, soil ? COL.soil : COL.waste); disc(G.sewer, 0.1, 0xb8bdc4, x, -0.02, z);
    const leak = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), mt(0x3fa9ff)); leak.position.set(x + 0.3, 0.02, z + 0.3); G.sensors.add(leak);
    wl++; if (wl === 2) { lbl("water", [x + 0.06, h + 0.1, z], "Cold (blue) + hot (red) supply", "#3d8bff"); lbl("sewer", [x, -0.1, z], "Floor trap + waste pipe (2% fall)", "#a3a83a"); lbl("sensors", [x + 0.3, 0.1, z + 0.3], "Water-leak sensor", "#3fa9ff"); }
  }));

  // ------------------------------------------------ doors: call points, exit signs, access readers, window contacts
  F.doors.forEach((d) => {
    const p = d.pivot.position, name = d.name || "", ent = /entrance|Service/.test(name), glass = /terrace|entrance/i.test(name);
    if (ent) { bx(G.fire, 0.1, 0.12, 0.04, 0xff2030, p.x + 0.6, 1.3, p.z + 0.5); bx(G.fire, 0.45, 0.18, 0.04, 0x20c060, p.x, 2.55, p.z + 0.5); bx(G.sensors, 0.08, 0.14, 0.03, 0x39d6ff, p.x - 0.4, 1.2, p.z - 0.5); }
    if (/terrace/i.test(name)) { bx(G.sensors, 0.05, 0.05, 0.03, 0xffb347, p.x, 2.2, p.z); }
  });
  const e0 = F.doors.find((d) => /entrance/i.test(d.name || ""));
  if (e0) { const p = e0.pivot.position; lbl("fire", [p.x + 0.6, 1.4, p.z + 0.5], "Manual call point", "#ff4a4f"); lbl("fire", [p.x, 2.7, p.z + 0.5], "Exit sign", "#20c060"); lbl("sensors", [p.x - 0.4, 1.3, p.z - 0.5], "Door access reader", "#39d6ff"); }
  const t0 = F.doors.find((d) => /terrace/i.test(d.name || ""));
  if (t0) { const p = t0.pivot.position; lbl("sensors", [p.x, 2.3, p.z], "Window / door contact sensor", "#ffb347"); }

  // ------------------------------------------------ window blinds (roller, 70% down)
  const blindM = new THREE.MeshStandardMaterial({ color: 0xf1eadb, roughness: 1, transparent: true, opacity: 0.82, side: THREE.DoubleSide });
  blinds.forEach(([x1, z1, x2, z2]) => { const horiz = Math.abs(z1 - z2) < 1e-6, len = horiz ? x2 - x1 : z2 - z1, n = Math.max(1, Math.round(len / 2.4)); for (let i = 0; i < n; i++) { const w = len / n - 0.08, c = (i + 0.5) * (len / n), m = new THREE.Mesh(new THREE.BoxGeometry(horiz ? w : 0.02, 2.4, horiz ? 0.02 : w), blindM); m.position.set(horiz ? x1 + c : x1 + (x1 < 1 ? 0.12 : -0.12), 3.5 - 1.2, horiz ? z1 + (z1 < 1 ? 0.12 : -0.12) : z1 + c); G.blinds.add(m); } });
  F.setMepLayer = (k, on) => { if (G[k]) G[k].visible = on; };
  return G;
}
