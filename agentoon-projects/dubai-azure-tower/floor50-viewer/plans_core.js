import * as THREE from "three";

// Plan kit: a "floor" is built from explicit walls, doors, floor patches and furniture helpers.
// Plan coordinates: x east, z toward the sea (glass at z = D), y up. Every furniture piece registers a footprint
// so check() can report overlaps and furniture standing inside walls.
export function createKit(H) {
  const { box, rbox, cyl, sph, local, MAT, std, canvasTex, oakTex, marbleTex, rnd, plant, lamp, pillow, art, artTex } = H;
  const bronzeC = 0xc9a25a;
  const M = {
    wall: std(0xf2eee7, 0.9), core: std(0xaaa7a0, 0.95), frame: std(bronzeC, 0.3, 1), door: std(0xf3efe8, 0.45), handle: std(bronzeC, 0.3, 1),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe6f2, roughness: 0.03, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }),
    frostGlass: new THREE.MeshPhysicalMaterial({ color: 0xe6eef2, roughness: 0.5, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }),
    carpet: std(0x4d535c, 1), carpetWarm: std(0x8a7f72, 1), vinyl: std(0xeef1f3, 0.35), stone: new THREE.MeshStandardMaterial({ map: marbleTex([0.18, 0.18]), roughness: 0.12 }),
    stoneDark: new THREE.MeshStandardMaterial({ map: marbleTex([0.18, 0.18], "#2b2a2c", "rgba(200,190,170,"), roughness: 0.15 }), wood: new THREE.MeshStandardMaterial({ map: oakTex([0.22, 0.22]), roughness: 0.5 }), tile: std(0xdde5e9, 0.2),
    steel: std(0xb9bec6, 0.3, 1), black: std(0x15161a, 0.4, 0.3), white: std(0xf7f6f3, 0.4), screen: std(0x06080c, 0.15, 0.5), blue: std(0x3a5e8c, 0.8), sage: std(0x8d9b88, 1), cream: std(0xe9e0d0, 1), grey: std(0x8b8d92, 1), navy: std(0x27364b, 1), rust: std(0xb0674a, 1), walnut: std(0x4a2f1d, 0.45), lac: std(0xf5f3ef, 0.35), leather: std(0x6f4529, 0.5), brass: std(bronzeC, 0.28, 1),
    water: new THREE.MeshStandardMaterial({ color: 0x3fc0d8, roughness: 0.05, transparent: true, opacity: 0.62, emissive: 0x00b7d4, emissiveIntensity: 0, depthWrite: false }),
    leaf: std(0x3f6b3a, 0.8), leaf2: std(0x5d8a4f, 0.8), led: new THREE.MeshStandardMaterial({ color: 0x35d9ff, emissive: 0x35d9ff, emissiveIntensity: 1.6 }),
  };
  const ledGreen = new THREE.MeshStandardMaterial({ color: 0x35ff7a, emissive: 0x35ff7a, emissiveIntensity: 1.4 });
  const corners = (cx, cz, w, d, rot) => { const c = Math.cos(rot), s = Math.sin(rot); return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([u, v]) => [cx + u * c + v * s, cz - u * s + v * c]); };
  const inPoly = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if (zi > p[1] !== zj > p[1] && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) c = !c; } return c; };
  const overlapFrac = (A, B) => { let n = 0, t = 0; const [a0, a1, a2, a3] = A; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const u = (i + 0.5) / 8, v = (j + 0.5) / 8; const p = [a0[0] + (a1[0] - a0[0]) * u + (a3[0] - a0[0]) * v, a0[1] + (a1[1] - a0[1]) * u + (a3[1] - a0[1]) * v]; t++; if (inPoly(p, B)) n++; } return n / t; };

  function floor(name, W, D, opt = {}) {
    const WALL_H = opt.wallH || 3.6, CEIL = opt.ceilH || 3.2;
    const g = new THREE.Group(); g.name = name;
    const F = { name, W, D, g, walls: new THREE.Group(), glassG: new THREE.Group(), furn: new THREE.Group(), ceil: new THREE.Group(), deco: new THREE.Group(), floorG: new THREE.Group(), doors: [], doorMeshes: [], lights: [], labels: [], reg: [], wallRects: [], M, WALL_H, CEIL, indicators: [], liftDoors: [], dyn: [] };
    [F.floorG, F.walls, F.glassG, F.furn, F.ceil, F.deco].forEach((x) => g.add(x));
    // ------------------------------------------------ slab + floor finishes
    if (!opt.noSlab) box(F.floorG, W + 0.6, 0.4, D + 0.3, std(0xb9b6b0, 0.95), W / 2, -0.4, D / 2 - 0.05);
    F.patch = (x1, z1, x2, z2, mat, y = 0.012) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), mat); m.rotation.x = -Math.PI / 2; m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); m.receiveShadow = true; const uv = m.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x2 - x1), uv.getY(i) * (z2 - z1)); F.floorG.add(m); return m; };
    // ------------------------------------------------ walls (explicit segments, doors cut openings)
    F.wall = (x1, z1, x2, z2, o = {}) => {
      const t = o.t || 0.15, h = o.h || WALL_H, horiz = Math.abs(z1 - z2) < 1e-6, a = horiz ? Math.min(x1, x2) : Math.min(z1, z2), len = horiz ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
      const mat = o.mat || (o.glass ? M.glass : M.wall), grp = o.glass ? F.glassG : F.walls;
      const seg = (s, e, y0, hh, material = mat, gr = grp) => { if (e - s < 0.005 || hh < 0.005) return; const c = a + (s + e) / 2, l = e - s; const m = horiz ? box(gr, l, hh, t, material, c, y0, z1) : box(gr, t, hh, l, material, x1, y0, c); m.receiveShadow = true; if (!o.glass || material !== M.glass) m.castShadow = true; };
      const addRect = (s, e) => { if (e - s > 0.005 && !o.glass) F.wallRects.push(horiz ? { x1: a + s, z1: z1 - t / 2, x2: a + e, z2: z1 + t / 2 } : { x1: x1 - t / 2, z1: a + s, x2: x1 + t / 2, z2: a + e }); };
      let cur = 0;
      [...(o.doors || [])].sort((p, q) => p.c - q.c).forEach((d) => {
        const s = d.c - d.w / 2 - a, e = d.c + d.w / 2 - a, dh = d.h || 2.3;
        if (o.glass) { seg(cur, s, 0, h); seg(s, e, dh, h - dh); } else { seg(cur, s, 0, h); seg(s, e, dh, h - dh); addRect(cur, s); }
        if (o.glass) { for (const p of [s, e]) seg(p - 0.04, p + 0.04, 0, dh, M.frame, F.walls); seg(s, e, dh - 0.06, 0.06, M.frame, F.walls); }
        if (d.leaf !== false) F.addDoor(horiz ? "x" : "z", horiz ? z1 : x1, d.c, d.w, d.swing || 1, d.name || "Door", o.glass || d.glass);
        cur = e;
      });
      seg(cur, len, 0, h); addRect(cur, len);
      if (o.glass) { // frame rails
        const rail = (y, hh) => { const m = horiz ? box(F.walls, len, hh, t + 0.04, M.frame, a + len / 2, y, z1) : box(F.walls, t + 0.04, hh, len, M.frame, x1, y, a + len / 2); }; rail(0, 0.06); rail(h - 0.06, 0.06);
        const n = Math.max(1, Math.round(len / 2.4)); for (let i = 0; i <= n; i++) { const p = a + (len * i) / n; if (horiz ? box(F.walls, 0.06, h, t + 0.04, M.frame, p, 0, z1) : box(F.walls, t + 0.04, h, 0.06, M.frame, x1, 0, p)) { /* mullion */ } }
      }
    };
    F.addDoor = (axis, fixed, c, w, swing, name, glassLeaf) => {
      const pivot = new THREE.Group(), lm = glassLeaf ? M.glass : M.door;
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(axis === "x" ? w - 0.04 : 0.045, 2.1, axis === "x" ? 0.045 : w - 0.04), lm); leaf.castShadow = !glassLeaf;
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 10), M.handle);
      if (axis === "x") { pivot.position.set(c - w / 2 + 0.02, 0, fixed); leaf.position.set(w / 2 - 0.02, 1.05, 0); h.position.set(w - 0.15, 1.0, 0.045); h.rotation.x = Math.PI / 2; }
      else { pivot.position.set(fixed, 0, c - w / 2 + 0.02); leaf.position.set(0, 1.05, w / 2 - 0.02); h.position.set(0.045, 1.0, w - 0.15); h.rotation.z = Math.PI / 2; }
      pivot.add(leaf, h); F.walls.add(pivot); const d = { pivot, cur: 0, target: 0, dir: swing * Math.PI * 0.5 * 0.94, name }; F.doors.push(d); leaf.userData.door = d; h.userData.door = d; F.doorMeshes.push(leaf, h);
      // swing arc clearance footprint (kept free of furniture)
      const sw = axis === "x" ? { x1: c - w / 2, z1: fixed + (swing > 0 ? -w : 0), x2: c + w / 2, z2: fixed + (swing > 0 ? 0 : w) } : { x1: fixed + (swing > 0 ? 0 : -w), z1: c - w / 2, x2: fixed + (swing > 0 ? w : 0), z2: c + w / 2 };
      F.doorSwings = F.doorSwings || []; F.doorSwings.push({ ...sw, name });
    };
    F.updateDoors = (dt) => { F.doors.forEach((d) => { d.cur += (d.target - d.cur) * Math.min(1, dt * 6); d.pivot.rotation.y = (d.base || 0) + d.cur * d.dir; }); };
    F.setDoors = (open) => F.doors.forEach((d) => (d.target = open ? 1 : 0));
    // ------------------------------------------------ lights
    // rooms: emissive ceiling panels + one point light, switched together
    F.rooms = {}; F.lightsOn = {};
    if (!opt.noSlab) box(F.ceil, W, 0.06, D, std(0xf4f2ee, 0.95), W / 2, CEIL, D / 2);   // ceiling plate (shown with the "Ceiling" toggle)
    F.room = (key, name, x1, z1, x2, z2, o = {}) => {
      const mat = new THREE.MeshStandardMaterial({ color: 0xb8b2a8, emissive: 0xffd9a0, emissiveIntensity: 0.03, roughness: 0.4 });
      const pl = new THREE.PointLight(0xffd8a8, 0, o.range || 13, 2); pl.position.set((x1 + x2) / 2, CEIL - 0.45, (z1 + z2) / 2); g.add(pl);
      const nx = Math.max(1, Math.round((x2 - x1) / (o.pitch || 3))), nz = Math.max(1, Math.round((z2 - z1) / (o.pitch || 3)));
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const x = x1 + ((i + 0.5) * (x2 - x1)) / nx, z = z1 + ((j + 0.5) * (z2 - z1)) / nz; if (o.round) cyl(F.ceil, 0.09, 0.09, 0.02, mat, x, CEIL - 0.03, z, 16); else box(F.ceil, 0.6, 0.02, 0.6, mat, x, CEIL - 0.03, z); }
      F.rooms[key] = { key, name, mat, pl, base: o.inten || 7, x1, z1, x2, z2 }; F.lightsOn[key] = false; return F.rooms[key];
    };
    F.pointOK = true;
    F.setLight = (key, on) => { const r = F.rooms[key]; if (!r) return; F.lightsOn[key] = on; r.mat.emissiveIntensity = on ? 2.2 : 0.03; r.mat.color.set(on ? 0xfff1d6 : 0xb8b2a8); r.pl.intensity = on && F.pointOK ? r.base : 0; };
    F.setPointOK = (v) => { F.pointOK = v; Object.keys(F.rooms).forEach((k) => F.setLight(k, !!F.lightsOn[k])); };
    F.setAllLights = (on) => Object.keys(F.rooms).forEach((k) => F.setLight(k, on));
    F.roomAt = (x, z) => Object.values(F.rooms).find((r) => x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2);
    F.slab = (x1, z1, x2, z2) => box(F.floorG, x2 - x1, 0.4, z2 - z1, std(0xb9b6b0, 0.95), (x1 + x2) / 2, -0.4, (z1 + z2) / 2);
    // ------------------------------------------------ footprints + checks
    F.fp = (tag, cx, cz, w, d, rot = 0, o = {}) => { F.reg.push({ tag, pts: corners(cx, cz, w, d, rot), soft: !!o.soft, wall: !!o.wall, cx, cz }); };
    F.check = () => {
      const issues = [];
      for (let i = 0; i < F.reg.length; i++) for (let j = i + 1; j < F.reg.length; j++) { const A = F.reg[i], B = F.reg[j]; if (A.soft || B.soft) continue; if (Math.hypot(A.cx - B.cx, A.cz - B.cz) > 8) continue; const f = Math.max(overlapFrac(A.pts, B.pts), overlapFrac(B.pts, A.pts)); if (f > 0.12) issues.push(`overlap ${A.tag} / ${B.tag} @${A.cx.toFixed(1)},${A.cz.toFixed(1)} (${Math.round(f * 100)}%)`); }
      F.reg.forEach((A) => { if (A.wall) return; F.wallRects.forEach((w) => { const poly = w.pts || [[w.x1, w.z1], [w.x2, w.z1], [w.x2, w.z2], [w.x1, w.z2]]; const f = overlapFrac(A.pts, poly); if (f > 0.06) issues.push(`in-wall ${A.tag} @${A.cx.toFixed(1)},${A.cz.toFixed(1)} (${Math.round(f * 100)}%)`); }); if (F.insideFn ? !F.insideFn(A.cx, A.cz) : (A.cx < 0.1 || A.cx > W - 0.1 || A.cz < 0.1 || A.cz > (F.extentD || D) + 0.1)) issues.push(`outside ${A.tag} @${A.cx.toFixed(1)},${A.cz.toFixed(1)}`); });
      (F.doorSwings || []).forEach((s) => { const poly = [[s.x1, s.z1], [s.x2, s.z1], [s.x2, s.z2], [s.x1, s.z2]]; F.reg.forEach((A) => { if (A.soft || A.wall) return; const f = overlapFrac(A.pts, poly); if (f > 0.25) issues.push(`door-swing blocked by ${A.tag} (${s.name})`); }); });
      return issues;
    };
    // ------------------------------------------------ furniture (front of every piece faces local +z; rot = rotation.y)
    const L = (x, z, rot) => local(F.furn, x, z, rot);
    F.plant = (x, z, s = 1, tall = 1.6) => { plant(F.furn, x, z, s, tall); F.fp("plant", x, z, 0.6 * s, 0.6 * s, 0, { soft: false }); };
    F.rug = (x, z, w, d, mat, rot = 0) => { const r = rbox(F.furn, w, 0.02, d, 0.01, mat, x, 0.012, z, rot); F.fp("rug", x, z, w, d, rot, { soft: true }); return r; };
    F.chair = (x, z, rot = 0, mat = M.navy, o = {}) => { const c = L(x, z, rot); rbox(c, 0.5, 0.08, 0.48, 0.03, mat, 0, 0.44, 0); rbox(c, 0.5, 0.5, 0.07, 0.03, mat, 0, 0.5, -0.24).rotation.x = -0.12; for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) cyl(c, 0.014, 0.02, 0.45, M.brass, dx, 0, dz, 8); F.fp(o.tag || "chair", x, z, 0.5, 0.5, rot, { soft: o.soft !== false }); };
    F.task = (x, z, rot = 0, mat = M.black) => { const c = L(x, z, rot); cyl(c, 0.28, 0.28, 0.07, mat, 0, 0.46, 0, 20); rbox(c, 0.5, 0.5, 0.08, 0.04, mat, 0, 0.55, -0.26).rotation.x = -0.1; cyl(c, 0.03, 0.03, 0.4, M.steel, 0, 0.05, 0, 8); cyl(c, 0.3, 0.3, 0.03, M.steel, 0, 0.02, 0, 5); F.fp("chair", x, z, 0.55, 0.55, rot, { soft: true }); };
    F.desk = (x, z, rot = 0, o = {}) => { const w = o.w || 1.6, d = o.d || 0.8, c = L(x, z, rot), top = o.top || M.white; box(c, w, 0.04, d, top, 0, 0.72, 0); for (const sx of [-1, 1]) box(c, 0.05, 0.72, d - 0.1, M.steel, sx * (w / 2 - 0.05), 0, 0); if (o.ped) box(c, 0.42, 0.55, d - 0.12, M.lac, w / 2 - 0.3, 0.17, 0);
      const n = o.mon === undefined ? 1 : o.mon; for (let i = 0; i < n; i++) { const mx = n === 1 ? 0 : (i - (n - 1) / 2) * ((w - 0.7) / Math.max(1, n - 1)); box(c, 0.5, 0.3, 0.03, o.glow || M.screen, mx, 0.92, -d / 2 + 0.2); box(c, 0.04, 0.18, 0.04, M.steel, mx, 0.76, -d / 2 + 0.2); box(c, 0.2, 0.01, 0.14, M.steel, mx, 0.76, -d / 2 + 0.22); if (o.dual) box(c, 0.5, 0.3, 0.03, o.glow || M.screen, mx, 1.24, -d / 2 + 0.2); }
      if (o.kb !== false) box(c, 0.4, 0.015, 0.14, M.black, 0, 0.76, 0.1); F.fp("desk", x, z, w, d, rot);
      if (o.chair !== false) { const cx = x + Math.sin(rot) * (d / 2 + 0.45), cz = z + Math.cos(rot) * (d / 2 + 0.45); F.task(cx, cz, rot + Math.PI); } };
    F.table = (x, z, w, d, o = {}) => { const rot = o.rot || 0, c = L(x, z, rot), top = o.top || M.walnut; if (o.round) { cyl(c, w / 2, w / 2, 0.05, top, 0, 0.7, 0, 40); cyl(c, 0.08, 0.08, 0.7, M.brass, 0, 0, 0, 12); cyl(c, w * 0.18, w * 0.18, 0.03, M.brass, 0, 0, 0, 24); F.fp("table", x, z, w, w, rot); } else { rbox(c, w, 0.05, d, 0.02, top, 0, 0.7, 0); for (const sx of [-1, 1]) box(c, 0.08, 0.7, d * 0.7, M.brass, sx * (w / 2 - 0.4), 0, 0); F.fp("table", x, z, w, d, rot); } };
    F.chairsAround = (x, z, w, d, n, rot = 0, mat = M.navy, o = {}) => { const c = Math.cos(rot), s = Math.sin(rot); const pos = (u, v) => [x + u * c + v * s, z - u * s + v * c]; const per = Math.max(1, Math.floor(n / 2)); for (let i = 0; i < per; i++) { const u = ((i + 0.5) / per - 0.5) * (w - 0.6); const [ax, az] = pos(u, -(d / 2 + 0.3)); F.chair(ax, az, rot, mat, { tag: "mt-chair" }); const [bx, bz] = pos(u, d / 2 + 0.3); F.chair(bx, bz, rot + Math.PI, mat, { tag: "mt-chair" }); } if (o.ends) { const [ex, ez] = pos(-(w / 2 + 0.3), 0); F.chair(ex, ez, rot + Math.PI / 2, mat, { tag: "mt-chair" }); const [fx, fz] = pos(w / 2 + 0.3, 0); F.chair(fx, fz, rot - Math.PI / 2, mat, { tag: "mt-chair" }); } };
    F.sofa = (x, z, rot, len = 2.2, mat = M.grey) => { const s = L(x, z, rot); rbox(s, len, 0.26, 0.95, 0.05, M.grey, 0, 0.06, 0); const n = Math.max(2, Math.round(len / 0.75)); for (let i = 0; i < n; i++) rbox(s, len / n - 0.04, 0.18, 0.84, 0.07, mat, -len / 2 + (i + 0.5) * (len / n), 0.32, 0.03); for (let i = 0; i < n; i++) { const b = rbox(s, len / n - 0.05, 0.46, 0.2, 0.08, mat, -len / 2 + (i + 0.5) * (len / n), 0.5, -0.36); b.rotation.x = -0.14; } rbox(s, 0.22, 0.55, 0.95, 0.08, M.grey, -len / 2 - 0.02, 0.06, 0); rbox(s, 0.22, 0.55, 0.95, 0.08, M.grey, len / 2 + 0.02, 0.06, 0); F.fp("sofa", x, z, len + 0.3, 0.95, rot); };
    F.armchair = (x, z, rot, mat = M.sage) => { const a = L(x, z, rot); rbox(a, 0.85, 0.3, 0.8, 0.1, mat, 0, 0.14, 0); rbox(a, 0.72, 0.16, 0.66, 0.08, M.cream, 0, 0.42, 0.04); rbox(a, 0.85, 0.5, 0.2, 0.1, mat, 0, 0.44, -0.32); for (const sx of [-0.3, 0.3]) cyl(a, 0.03, 0.03, 0.14, M.brass, sx, 0, -0.28, 8); F.fp("armchair", x, z, 0.85, 0.8, rot); };
    F.coffee = (x, z, w = 1.1, d = 0.6, round = false) => { if (round) { cyl(F.furn, w / 2, w / 2, 0.04, M.stoneDark, x, 0.36, z, 36); cyl(F.furn, 0.18, 0.22, 0.34, M.brass, x, 0.02, z, 20); F.fp("coffee", x, z, w, w, 0); } else { rbox(F.furn, w, 0.04, d, 0.015, M.stoneDark, x, 0.36, z, 0); for (const sx of [-1, 1]) box(F.furn, 0.04, 0.34, d - 0.1, M.brass, x + sx * (w / 2 - 0.1), 0.02, z); F.fp("coffee", x, z, w, d, 0); } };
    F.side = (x, z, withLamp = true) => { cyl(F.furn, 0.24, 0.24, 0.04, M.stoneDark, x, 0.5, z, 24); cyl(F.furn, 0.03, 0.03, 0.5, M.brass, x, 0, z, 8); if (withLamp) lamp(F.furn, x, 0.54, z, 0.9); F.fp("side", x, z, 0.5, 0.5, 0); };
    F.reception = (x, z, rot, len = 3.4, o = {}) => { const c = L(x, z, rot), dep = 0.9; rbox(c, len, 1.0, dep, 0.03, o.body || M.walnut, 0, 0, 0); rbox(c, len + 0.1, 0.06, dep + 0.12, 0.02, M.stone, 0, 1.0, 0); box(c, len - 0.2, 0.6, 0.03, o.body || M.walnut, 0, 0.45, -dep / 2 - 0.2); box(c, len, 0.74, 0.5, M.black, 0, 0, -dep / 2 - 0.7, 0).visible = false; box(c, 0.9, 0.02, 0.3, M.screen, -len / 4, 1.07, -0.1); box(c, 0.04, 0.4, 0.04, M.steel, -len / 4, 1.07, -0.1); box(c, 0.6, 0.35, 0.03, M.screen, -len / 4, 1.2, -0.12); F.fp("reception", x, z, len + 0.1, dep + 0.12, rot); if (o.logo) { const t = new THREE.Mesh(new THREE.PlaneGeometry(len * 0.6, 0.32), new THREE.MeshBasicMaterial({ map: o.logo })); t.position.set(0, 0.5, dep / 2 + 0.01); c.add(t); } };
    F.cabinet = (x, z, rot, w = 1.2, h = 1.0, d = 0.45, mat = M.lac, o = {}) => { const c = L(x, z, rot); rbox(c, w, h, d, 0.02, mat, 0, o.y || 0, 0); for (let i = 1; i < Math.round(w / 0.6); i++) box(c, 0.012, h - 0.1, 0.01, M.black, -w / 2 + i * 0.6, (o.y || 0) + 0.05, d / 2 + 0.002); F.fp(o.tag || "cabinet", x, z, w, d, rot, { wall: o.wall }); };
    F.tall = (x, z, rot, w = 1.2, d = 0.6, h = 2.4, mat = M.walnut, o = {}) => { const c = L(x, z, rot); box(c, w, h, d, mat, 0, 0, 0); const n = Math.max(1, Math.round(w / 0.6)); for (let i = 1; i < n; i++) box(c, 0.012, h - 0.1, 0.01, M.black, -w / 2 + i * (w / n), 0.05, d / 2 + 0.002); for (let i = 0; i < n; i++) box(c, 0.02, 0.5, 0.02, M.brass, -w / 2 + (i + 0.5) * (w / n) + 0.08, 1.0, d / 2 + 0.02); F.fp(o.tag || "wardrobe", x, z, w, d, rot); };
    F.screen = (x, y, z, rot, w, h, tex, o = {}) => { const g2 = local(F.furn, x, z, rot); box(g2, w + 0.06, h + 0.06, 0.04, M.black, 0, y - 0.03, 0); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), tex ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) : new THREE.MeshStandardMaterial({ color: 0x090c12, roughness: 0.2, metalness: 0.5 })); m.position.set(0, y + h / 2 - 0.03 + 0.03, 0.025); g2.add(m); F.fp(o.tag || "screen", x, z, w, 0.1, rot, { wall: true, soft: true }); };
    F.sign = (txt, x, y, z, rot, w, h, bg = "#14202e", fg = "#f2e3c6", fs = 44) => { const t = canvasTex(512, Math.round(512 * h / w), (c, ww, hh) => { c.fillStyle = bg; c.fillRect(0, 0, ww, hh); c.fillStyle = fg; c.font = `600 ${fs}px Georgia,serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, ww / 2, hh / 2); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(x, y, z); m.rotation.y = rot; F.deco.add(m); return t; };
    F.bed = (x, z, rot, size = "king", o = {}) => { const wd = size === "king" ? 1.9 : size === "queen" ? 1.6 : 1.0, ln = 2.1, b = L(x, z, rot), fab = o.fab || M.cream, head = o.head || M.sage;
      rbox(b, wd + 0.2, 0.3, ln + 0.1, 0.04, M.walnut, 0, 0.05, 0.05); rbox(b, wd, 0.26, ln, 0.1, M.white, 0, 0.35, 0.05); rbox(b, wd + 0.05, 0.06, ln * 0.62, 0.03, fab, 0, 0.6, 0.45); rbox(b, wd + 0.06, 0.04, 0.5, 0.02, o.runner || M.rust, 0, 0.64, 0.75);
      rbox(b, wd + 0.5, 1.3, 0.14, 0.05, head, 0, 0.1, -ln / 2 - 0.05); const n = size === "single" ? 1 : 2; for (let i = 0; i < n; i++) { const px = n === 1 ? 0 : (i - 0.5) * (wd * 0.52); const p = rbox(b, 0.62, 0.15, 0.4, 0.06, M.white, px, 0.62, -ln / 2 + 0.35); }
      F.fp("bed", x, z, wd + 0.2, ln + 0.1, rot); };
    F.bedside = (x, z, rot) => { const c = L(x, z, rot); rbox(c, 0.5, 0.5, 0.42, 0.03, M.walnut, 0, 0.05, 0); lamp(c, 0, 0.58, 0, 1.0); F.fp("bedside", x, z, 0.5, 0.42, rot); };
    F.tv = (x, z, rot, w = 1.4, floorUnit = true) => { const c = L(x, z, rot); if (floorUnit) { rbox(c, w + 0.5, 0.45, 0.4, 0.03, M.walnut, 0, 0.1, 0); } box(c, w, w * 0.56, 0.04, M.screen, 0, 0.95, -0.12); F.fp("tv-unit", x, z, w + 0.5, 0.4, rot); };
    F.rack = (x, z, rot) => { const c = L(x, z, rot); box(c, 0.6, 2.0, 1.0, M.black, 0, 0, 0); for (let i = 0; i < 12; i++) { box(c, 0.5, 0.05, 0.02, M.steel, 0, 0.2 + i * 0.15, 0.51); const led = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.01), i % 3 === 0 ? ledGreen : M.led); led.position.set(0.2, 0.25 + i * 0.15, 0.52); c.add(led); } F.fp("rack", x, z, 0.6, 1.0, rot); };
    F.wcSet = (x, z, rot) => { const c = L(x, z, rot); rbox(c, 0.4, 0.4, 0.62, 0.15, M.white, 0, 0, 0.0); rbox(c, 0.38, 0.55, 0.18, 0.04, M.white, 0, 0.35, -0.3); F.fp("wc", x, z, 0.45, 0.7, rot); };
    F.basin = (x, z, rot, w = 0.9) => { const c = L(x, z, rot); rbox(c, w, 0.55, 0.5, 0.02, M.lac, 0, 0.3, 0); box(c, w + 0.04, 0.04, 0.54, M.stoneDark, 0, 0.85, 0); cyl(c, 0.2, 0.18, 0.08, M.white, 0, 0.88, 0.0, 28); cyl(c, 0.012, 0.012, 0.28, M.steel, 0, 0.9, -0.2, 8); F.fp("basin", x, z, w, 0.54, rot); };
    F.mirror = (x, y, z, rot, w, h) => { const c = local(F.furn, x, z, rot); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.04 })); m.position.set(0, y, 0.02); c.add(m); const fr = box(c, w + 0.05, h + 0.05, 0.02, M.brass, 0, y - h / 2 - 0.025, 0); fr.material = M.brass; F.fp("mirror", x, z, w, 0.05, rot, { wall: true, soft: true }); };
    F.shower = (x, z, rot, w = 1.0, d = 1.0) => { const c = L(x, z, rot); box(c, w, 0.04, d, M.stoneDark, 0, 0, 0); box(c, w, 2.1, 0.03, M.glass, 0, 0.02, d / 2); box(c, 0.03, 2.1, d, M.glass, w / 2, 0.02, 0); cyl(c, 0.14, 0.14, 0.02, M.steel, 0, 2.05, -d / 2 + 0.2, 20); F.fp("shower", x, z, w, d, rot); };
    F.tub = (x, z, rot) => { const c = L(x, z, rot); rbox(c, 1.7, 0.6, 0.8, 0.28, M.white, 0, 0, 0); rbox(c, 1.45, 0.05, 0.58, 0.2, M.water, 0, 0.52, 0); F.fp("tub", x, z, 1.7, 0.8, rot); };
    F.kitchenRun = (x, z, rot, len, o = {}) => { const c = L(x, z, rot), body = o.body || M.lac; box(c, len, 0.85, 0.62, body, 0, 0.1, 0); box(c, len + 0.04, 0.04, 0.66, M.stone, 0, 0.95, 0); box(c, len, 0.02, 0.5, M.walnut, 0, 0.0, 0.0).visible = false; for (let i = 1; i < Math.round(len / 0.6); i++) box(c, 0.012, 0.8, 0.01, M.black, -len / 2 + i * 0.6, 0.12, 0.315); if (o.wallCab) box(c, len, 0.7, 0.34, M.walnut, 0, 1.55, -0.14); if (o.hob !== undefined) { box(c, 0.8, 0.02, 0.5, M.black, o.hob, 0.99, 0); box(c, 0.8, 0.05, 0.5, M.steel, o.hob, 1.9, -0.1).material = M.steel; } if (o.sink !== undefined) { box(c, 0.7, 0.02, 0.42, M.steel, o.sink, 0.99, 0); cyl(c, 0.018, 0.018, 0.3, M.steel, o.sink, 1.0, -0.2, 8); } F.fp(o.tag || "kitchen", x, z, len, 0.66, rot); };
    F.island = (x, z, rot, len = 2.8, wd = 1.0) => { const c = L(x, z, rot); box(c, len, 0.9, wd, M.walnut, 0, 0.05, 0); box(c, len + 0.1, 0.05, wd + 0.1, M.stone, 0, 0.95, 0); box(c, 0.05, 0.95, wd + 0.1, M.stone, len / 2 + 0.03, 0, 0); box(c, 0.05, 0.95, wd + 0.1, M.stone, -len / 2 - 0.03, 0, 0); F.fp("island", x, z, len + 0.2, wd + 0.1, rot); };
    F.stool = (x, z) => { cyl(F.furn, 0.19, 0.19, 0.06, M.leather, x, 0.62, z, 24); cyl(F.furn, 0.02, 0.02, 0.62, M.brass, x, 0, z, 8); cyl(F.furn, 0.22, 0.22, 0.02, M.brass, x, 0, z, 24); F.fp("stool", x, z, 0.4, 0.4, 0, { soft: true }); };
    F.fridge = (x, z, rot) => { const c = L(x, z, rot); rbox(c, 0.7, 1.9, 0.7, 0.02, M.steel, 0, 0.05, 0); box(c, 0.012, 1.2, 0.01, M.black, 0, 0.4, 0.36); F.fp("fridge", x, z, 0.7, 0.7, rot); };
    F.pendant = (x, z, y = 2.3, r = 0.5, mat) => { cyl(F.ceil, 0.006, 0.006, CEIL - y, M.brass, x, y, z, 6); const s = new THREE.Mesh(new THREE.SphereGeometry(r * 0.5, 20, 14), mat); s.position.set(x, y, z); F.ceil.add(s); };
    F.curtains = (x1, x2, z, zoneMat) => { const n = Math.max(2, Math.round((x2 - x1) / 0.5)); for (let i = 0; i < n; i++) { const m = box(F.deco, (x2 - x1) / n, 3.2, 0.03, M.white, x1 + ((i + 0.5) * (x2 - x1)) / n, 0.02, z); m.material = new THREE.MeshStandardMaterial({ color: 0xf6f2ea, roughness: 1, transparent: true, opacity: 0.5, side: THREE.DoubleSide }); } };
    // ------------------------------------------------ raised glass pool + equipment
    F.pools = [];
    F.pool = (cx0, cz0, L, Wd, o = {}) => {
      const rotP = o.rot || 0, wcx = cx0, wcz = cz0, cx = rotP ? 0 : cx0, cz = rotP ? 0 : cz0;   // rotated pools are built at the origin, then turned and moved
      const PG = new THREE.Group(); g.add(PG); const SYS = new THREE.Group(); SYS.visible = false; PG.add(SYS);
      const WD = 1.1, GH = 1.25, conc = std(0xb7b4ad, 0.9), glassP = new THREE.MeshPhysicalMaterial({ color: 0xbfeaf5, roughness: 0.03, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
      const x0 = cx - L / 2, x1 = cx + L / 2, z0 = cz - Wd / 2, z1 = cz + Wd / 2, wm = M.water.clone();
      box(PG, L + 0.8, 0.3, Wd + 0.8, conc, cx, 0, cz);
      box(PG, L - 0.1, 0.02, Wd - 0.1, M.tile, cx, 0.3, cz);
      const w3 = box(PG, L, WD, Wd, wm, cx, 0.32, cz); w3.renderOrder = 2; w3.castShadow = false;
      for (const [x, z, w, d] of [[cx, z0, L, 0.06], [x0, cz, 0.06, Wd], [x1, cz, 0.06, Wd]]) box(PG, w, GH, d, glassP, x, 0.3, z);
      box(PG, L, GH - 0.35, 0.04, glassP, cx, 0.3, z1); box(PG, L, 0.14, 0.4, conc, cx, 0.2, z1 + 0.28);
      box(PG, L + 0.2, 0.05, 0.1, M.brass, cx, 0.3 + GH, z0 - 0.02);
      const leds = []; for (let i = 0; i < Math.max(2, Math.round(L / 2.2)); i++) for (const z of [z0 + 0.15, z1 - 0.15]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0x7ff3ff })); b.position.set(x0 + ((i + 0.5) * L) / Math.max(2, Math.round(L / 2.2)), 0.42, z); PG.add(b); leds.push(b); }
      const lights = [x0 + L * 0.3, x0 + L * 0.7].map((x) => { const p = new THREE.PointLight(0x35d9ff, 0, 7, 2); p.position.set(x, 0.8, cz); PG.add(p); return p; });
      // equipment (shown by the "Pool systems" toggle): cabinet to the side, buried balance tank, pipes
      const side = o.side || -1, ex = side < 0 ? x0 - 1.0 : x1 + 1.0, lab = [];
      const pm = (c) => std(c, 0.4, 0.3), pipeM = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, emissive: c, emissiveIntensity: 0.25 });
      const cab = box(SYS, 1.1, 0.9, 0.7, new THREE.MeshStandardMaterial({ color: 0xd9dde2, roughness: 0.5, transparent: true, opacity: 0.35, depthWrite: false }), ex, 0, cz - 0.6);
      cyl(SYS, 0.28, 0.28, 0.8, pm(0x6b8fb3), ex - 0.3, 0.02, cz - 0.6, 20); cyl(SYS, 0.17, 0.17, 0.45, pm(0x2a7fd0), ex + 0.25, 0.02, cz - 0.6, 16); box(SYS, 0.35, 0.3, 0.3, pm(0xb9bec6), ex + 0.3, 0.55, cz - 0.6); cyl(SYS, 0.1, 0.1, 0.5, pm(0x9b59d6), ex - 0.05, 0.02, cz - 0.3, 12);
      cyl(SYS, 0.45, 0.45, 0.5, pm(0x39b5c9), ex, -0.45, cz + 0.8, 24);   // balance tank
      const pipes = [[[ex - 0.3, 0.2, cz - 0.6], [ex - 0.3, 0.2, cz + 0.8]], [[ex, 0.1, cz + 0.8], [x0 + 0.1, 0.1, cz + 0.8], [x0 + 0.1, 0.5, cz + 0.4]], [[ex + 0.25, 0.1, cz - 0.6], [ex + 0.25, 0.1, z0 - 0.35], [x0 + 0.4, 0.1, z0 - 0.35]]];
      pipes.forEach((pts, k) => { for (let i = 1; i < pts.length; i++) { const a = new THREE.Vector3(...pts[i - 1]), b = new THREE.Vector3(...pts[i]), m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, a.distanceTo(b), 8), pipeM(k === 2 ? 0xff8a3a : 0x35d9ff)); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); SYS.add(m); } });
      lab.push({ p: [ex - 0.3, 1.05, cz - 0.6], t: "Sand filter", c: "#6b8fb3" }, { p: [ex + 0.25, 0.8, cz - 0.6], t: "Circulation pump", c: "#2a7fd0" }, { p: [ex + 0.3, 1.0, cz - 0.6], t: "Heat pump", c: "#ff8a3a" }, { p: [ex - 0.05, 0.8, cz - 0.3], t: "UV + chlorine unit", c: "#9b59d6" }, { p: [ex, -0.1, cz + 0.8], t: "Balance tank (under deck)", c: "#39b5c9" }, { p: [x0 + 0.2, 0.7, cz + 0.4], t: "Return jets", c: "#35d9ff" }, { p: [x0 + 0.5, 0.1, z0 - 0.35], t: "Overflow + main drain", c: "#ff8a3a" });
      const conc3 = +((L + 0.8) * (Wd + 0.8) * 0.3 + L * 0.5 * 0.2 + (2 * (L + Wd)) * 0.12 * 0.25).toFixed(1), vol = L * Wd * WD;
      const info = { name: o.name || "Pool", L, W: Wd, depth: WD, volume: vol, concrete: conc3, rebarT: +(conc3 * 0.11).toFixed(1), weightT: Math.round(vol + conc3 * 2.4), glassThk: "3 × 19 mm laminated, low-iron" };
      const P = { group: PG, SYS, info, labels: lab, leds, lights, setNight: (k) => { lights.forEach((l) => (l.intensity = k * 5)); leds.forEach((b) => b.material.color.set(k > 0.3 ? 0xbffcff : 0x7ff3ff)); wm.emissiveIntensity = k * 1.6; wm.opacity = 0.62 - 0.1 * k; } };
      if (rotP) { PG.position.set(wcx, 0, wcz); PG.rotation.y = rotP; const cs = Math.cos(rotP), sn = Math.sin(rotP); lab.forEach((l) => { const [x, y, z] = l.p; l.p = [wcx + x * cs + z * sn, y, wcz - x * sn + z * cs]; }); F.fp("pool", wcx, wcz, L + 0.8, Wd + 0.8, rotP); }
      F.pools.push(P); return P;
    };
    F.couch = (x, z, rot) => { const c = L(x, z, rot); box(c, 0.7, 0.55, 1.9, M.white, 0, 0.1, 0); rbox(c, 0.66, 0.1, 1.8, 0.04, M.blue, 0, 0.65, 0); cyl(c, 0.04, 0.04, 0.1, M.steel, 0, 0, 0, 8); box(c, 0.6, 0.1, 0.3, M.white, 0, 0.75, -0.75); F.fp("couch", x, z, 0.7, 1.9, rot); };
    // ------------------------------------------------ angled walls (radial / chord partitions) with optional hinged doors
    F.wallA = (x1, z1, x2, z2, o = {}) => {
      const t = o.t || 0.15, h = o.h || WALL_H, L2 = Math.hypot(x2 - x1, z2 - z1), ux = (x2 - x1) / L2, uz = (z2 - z1) / L2, th = Math.atan2(-uz, ux), mat = o.mat || (o.glass ? M.glass : M.wall), grp = o.glass ? F.glassG : F.walls;
      const piece = (s, e, y0, hh, m = mat, gr = grp) => { if (e - s < 0.01 || hh < 0.01) return; const c = (s + e) / 2; box(gr, e - s, hh, t, m, x1 + ux * c, y0, z1 + uz * c, th); };
      const rect = (s, e) => { if (e - s < 0.01 || o.glass) return; const hw = t / 2, nx = -uz, nz = ux, a = [x1 + ux * s + nx * hw, z1 + uz * s + nz * hw], b = [x1 + ux * e + nx * hw, z1 + uz * e + nz * hw], c = [x1 + ux * e - nx * hw, z1 + uz * e - nz * hw], d = [x1 + ux * s - nx * hw, z1 + uz * s - nz * hw]; F.wallRects.push({ pts: [a, b, c, d] }); };
      let cur = 0; [...(o.doors || [])].sort((p, q) => p.s - q.s).forEach((d) => {
        const s0 = d.s - d.w / 2, e0 = d.s + d.w / 2, dh = d.h || 2.3; piece(cur, s0, 0, h); piece(s0, e0, dh, h - dh); rect(cur, s0);
        if (d.leaf !== false) { const pv = new THREE.Group(); pv.position.set(x1 + ux * s0, 0, z1 + uz * s0); pv.rotation.y = th; const leaf = new THREE.Mesh(new THREE.BoxGeometry(d.w - 0.04, 2.1, 0.045), d.glass ? M.glass : M.door); leaf.position.set(d.w / 2 - 0.02, 1.05, 0); leaf.castShadow = !d.glass; leaf.userData.keep = true; pv.add(leaf); F.walls.add(pv); const dd = { pivot: pv, cur: 0, target: 0, base: th, dir: (d.swing || 1) * Math.PI * 0.5 * 0.94, name: d.name || "Door" }; F.doors.push(dd); leaf.userData.door = dd; F.doorMeshes.push(leaf); }
        cur = e0; });
      piece(cur, L2, 0, h); rect(cur, L2);
    };
    // merge every static mesh of a group into one mesh per material (huge draw-call saving); keep = meshes flagged userData.keep stay separate
    F.mergeStatic = (grp) => {
      grp.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(grp.matrixWorld).invert(), by = new Map(), drop = [];
      grp.traverse((m) => { if (!m.isMesh || m.userData.keep || m.isInstancedMesh || Array.isArray(m.material)) return; const gm = m.geometry; if (!gm.attributes.position || !gm.attributes.normal) return; const g2 = (gm.index ? gm.toNonIndexed() : gm.clone()); if (!g2.attributes.uv) g2.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g2.attributes.position.count * 2), 2)); g2.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld)); const key = m.material; if (!by.has(key)) by.set(key, []); by.get(key).push(g2); drop.push(m); });
      drop.forEach((m) => m.parent && m.parent.remove(m));
      for (const [mat, list] of by) { let n = 0; list.forEach((g2) => (n += g2.attributes.position.count)); const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0; list.forEach((g2) => { P.set(g2.attributes.position.array, o * 3); N.set(g2.attributes.normal.array, o * 3); U.set(g2.attributes.uv.array, o * 2); o += g2.attributes.position.count; g2.dispose(); }); const G = new THREE.BufferGeometry(); G.setAttribute("position", new THREE.BufferAttribute(P, 3)); G.setAttribute("normal", new THREE.BufferAttribute(N, 3)); G.setAttribute("uv", new THREE.BufferAttribute(U, 2)); const mm = new THREE.Mesh(G, mat); mm.castShadow = !mat.transparent; mm.receiveShadow = true; grp.add(mm); }
      return by.size;
    };
    F.finish = () => { g.traverse((m) => { if (m.isMesh && !m.material.transparent) m.castShadow = true; }); };
    F.fade = (op) => { [F.walls].forEach((gr) => gr.traverse((m) => { if (!m.isMesh) return; const mt = m.material; if (mt.userData.o0 === undefined) { mt.userData.o0 = mt.opacity; mt.userData.t0 = mt.transparent; mt.userData.d0 = mt.depthWrite; } mt.transparent = op < 1 || mt.userData.t0; mt.opacity = op < 1 ? Math.min(mt.userData.o0, op) : mt.userData.o0; mt.depthWrite = op < 1 ? false : mt.userData.d0; mt.needsUpdate = true; })); };
    return F;
  }
  return { floor, M, corners };
}
