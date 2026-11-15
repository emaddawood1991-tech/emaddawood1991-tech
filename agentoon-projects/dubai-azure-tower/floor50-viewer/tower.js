import * as THREE from "three";

// Exact port of architecture/tower_params.json + build_tower.py (Blender: Z up, +Y = sea).
// Three.js world = (x, y, z) <- (-bx, bz, by): a proper rotation, so the twist keeps its handedness and the sea is +Z.
export const TP = { floors: 50, lobby: 9.0, floorH: 4.0, R: 24.0, taper: 0.36, lobeAmp: 0.15, lobes: 3, twist: 96, twistExp: 1.15, pts: 144, fins: 72, balc: [22, 46], span: 30, depth: 2.6, crown: 32.0, spire: 28.0 };
export const floorZ = (f) => (f <= 1 ? 0 : TP.lobby + (f - 2) * TP.floorH);
export const topZ = () => floorZ(TP.floors) + TP.floorH;
const hf = (z) => Math.max(0, Math.min(1, z / topZ()));
const radiusAt = (z) => TP.R * (1 - TP.taper * hf(z));
const twistAt = (z) => (TP.twist * Math.PI / 180) * Math.pow(hf(z), TP.twistExp);
// Blender-space point {x,y,z}
export function ringPoint(z, theta, offset = 0) {
  const h = hf(z), lobe = 1 + TP.lobeAmp * Math.cos(TP.lobes * theta) * (1 - 0.35 * h), a = theta + twistAt(z), r = radiusAt(z) * lobe + offset;
  return { x: r * Math.cos(a), y: r * Math.sin(a), z };
}
function ringNormal(z, theta) {
  const p1 = ringPoint(z, theta - 0.01), p2 = ringPoint(z, theta + 0.01), p = ringPoint(z, theta);
  let tx = p2.x - p1.x, ty = p2.y - p1.y; const l = Math.hypot(tx, ty); tx /= l; ty /= l;
  let nx = ty, ny = -tx; if (nx * p.x + ny * p.y < 0) { nx = -nx; ny = -ny; } return { x: nx, y: ny };
}
const w3 = (p) => new THREE.Vector3(-p.x, p.z, p.y);
const thetaI = (i) => (2 * Math.PI * i) / TP.pts;
export const ringLevels = () => { const zs = [0, TP.lobby]; for (let f = 2; f <= TP.floors; f++) zs.push(floorZ(f) + TP.floorH); return zs; };
function crownPoint(s, theta, offset = 0) {
  const top = topZ(), base = ringPoint(top, theta), k = 1 - 0.46 * Math.pow(s, 1.4), a = Math.atan2(base.y, base.x) + (18 * Math.PI / 180) * s, r = Math.hypot(base.x, base.y) * k + offset;
  return { x: r * Math.cos(a), y: r * Math.sin(a), z: top + TP.crown * s };
}
export const floorOfY = (y) => (y < TP.lobby ? 1 : Math.min(TP.floors, 2 + Math.floor((y - TP.lobby) / TP.floorH)));
export const zoneOf = (f) => (f === 1 ? "Double-height lobby" : f <= 20 ? "Offices" : f <= 46 ? "Residences" : "Penthouses");

// ---------- geometry helpers
function loft(rings, uvScale) {
  const n = rings[0].length, pos = [], uv = [], idx = [];
  rings.forEach((r) => r.forEach((p) => { const v = w3(p); pos.push(v.x, v.y, v.z); }));
  if (uvScale) rings.forEach((r) => r.forEach((p, i) => uv.push(i / n, p.z / uvScale)));
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < n; i++) { const j = (i + 1) % n, a = k * n + i, b = k * n + j, c = (k + 1) * n + j, d = (k + 1) * n + i; idx.push(a, b, c, a, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); if (uv.length) g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// closed plate (fan caps + side) between two heights, star-shaped around the vertical axis
function plate(z0, z1, ringFn) {
  const n = TP.pts, pos = [], idx = [];
  const rb = [], rt = []; for (let i = 0; i < n; i++) { rb.push(ringFn(z0, thetaI(i))); rt.push(ringFn(z1, thetaI(i))); }
  [...rb, ...rt].forEach((p) => { const v = w3(p); pos.push(v.x, v.y, v.z); });
  const cb = w3({ x: 0, y: 0, z: z0 }), ct = w3({ x: 0, y: 0, z: z1 }); pos.push(cb.x, cb.y, cb.z, ct.x, ct.y, ct.z); const CB = 2 * n, CT = 2 * n + 1;
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(i, j, i + n, j, j + n, i + n, CT, i + n, j + n, CB, j, i); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function canvasTex(w, h, draw, rep) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; }
const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);

export function createTower(ctx) {
  const rnd = ctx.rnd, root = new THREE.Group(); root.name = "TOWER";
  const G = { skin: new THREE.Group(), struct: new THREE.Group(), rebar: new THREE.Group(), found: new THREE.Group(), facade: new THREE.Group(), rain: new THREE.Group(), light: new THREE.Group(), site: new THREE.Group(), pick: new THREE.Group() };
  Object.values(G).forEach((g) => root.add(g));
  const zs = ringLevels(), TOP = topZ(), N = TP.pts;
  const rp = (z, th, o = 0) => ringPoint(z, th, o);

  // ---- window texture (colour + lit-window mask)
  const CELLS_X = 72, CELLS_Y = 51, CW = 24;
  // colour map: glass panes with a sky-like gradient and per-pane tint, bronze mullions + transoms, darker spandrel at each slab
  const winColor = canvasTex(CELLS_X * CW, CELLS_Y * CW, (g, w, h) => {
    const tints = [[30, 92, 130], [26, 80, 118], [38, 104, 140], [22, 70, 104], [44, 96, 112]];
    for (let cy = 0; cy < CELLS_Y; cy++) for (let cx = 0; cx < CELLS_X; cx++) {
      const x = cx * CW, y = cy * CW, t = tints[Math.floor(rnd() * tints.length)], gr = g.createLinearGradient(0, y, 0, y + CW * 0.76);
      gr.addColorStop(0, `rgb(${t[0] + 40},${t[1] + 46},${t[2] + 48})`); gr.addColorStop(1, `rgb(${t[0]},${t[1]},${t[2]})`); g.fillStyle = gr; g.fillRect(x, y, CW, CW * 0.78);
      g.fillStyle = "#2b2f36"; g.fillRect(x, y + CW * 0.78, CW, CW * 0.22);                      // spandrel (slab zone)
      g.fillStyle = "#a07a45"; g.fillRect(x, y, 2, CW); g.fillRect(x, y, CW, 2); g.fillRect(x, y + CW * 0.78, CW, 2);   // mullion, transom, sill
    }
  });
  // roughness (G) + metalness (B) map: glass is smooth and non-metal, frames are rougher bronze metal
  const winORM = canvasTex(CELLS_X * CW, CELLS_Y * CW, (g, w, h) => { g.fillStyle = "rgb(255,10,26)"; g.fillRect(0, 0, w, h); for (let cy = 0; cy < CELLS_Y; cy++) for (let cx = 0; cx < CELLS_X; cx++) { const x = cx * CW, y = cy * CW; g.fillStyle = "rgb(255,120,150)"; g.fillRect(x, y + CW * 0.78, CW, CW * 0.22); g.fillStyle = "rgb(255,95,255)"; g.fillRect(x, y, 2, CW); g.fillRect(x, y, CW, 2); g.fillRect(x, y + CW * 0.78, CW, 2); } }); winORM.colorSpace = THREE.NoColorSpace;
  const winMask = canvasTex(CELLS_X * CW, CELLS_Y * CW, (g, w, h) => { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); for (let cy = 0; cy < CELLS_Y; cy++) for (let cx = 0; cx < CELLS_X; cx++) if (rnd() > 0.3) { g.fillStyle = rnd() > 0.5 ? "#ffd9a0" : "#ffe9c4"; g.fillRect(cx * CW + 3, cy * CW + 3, CW - 5, CW * 0.74 - 4); } });
  const skinMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: winColor, roughnessMap: winORM, metalnessMap: winORM, roughness: 1, metalness: 1, envMapIntensity: 2.0, emissive: 0xffffff, emissiveMap: winMask, emissiveIntensity: 0, clearcoat: 0.6, clearcoatRoughness: 0.05, side: THREE.DoubleSide });
  const lobbyGlassMat = new THREE.MeshPhysicalMaterial({ color: lin(0.75, 0.88, 0.95), roughness: 0.03, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  const bronze = new THREE.MeshStandardMaterial({ color: lin(0.78, 0.58, 0.36), roughness: 0.3, metalness: 1 });
  const stone = new THREE.MeshStandardMaterial({ color: lin(0.82, 0.77, 0.67), roughness: 0.55 });
  const stoneLight = new THREE.MeshStandardMaterial({ color: lin(0.9, 0.88, 0.82), roughness: 0.45 });
  const balcGlass = new THREE.MeshPhysicalMaterial({ color: lin(0.8, 0.92, 1), roughness: 0.03, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
  const crownMat = new THREE.MeshStandardMaterial({ color: lin(0.55, 0.88, 1), roughness: 0.15, metalness: 0.4, emissive: lin(0.55, 0.88, 1), emissiveIntensity: 0.35 });
  const finMat = new THREE.MeshStandardMaterial({ color: bronze.color, roughness: 0.3, metalness: 1, side: THREE.DoubleSide, emissive: 0xffb060, emissiveIntensity: 0 });
  const bandMat = new THREE.MeshStandardMaterial({ color: stoneLight.color, roughness: 0.45, side: THREE.DoubleSide, emissive: 0xffe2b0, emissiveIntensity: 0 });
  const mats = [skinMat, lobbyGlassMat, balcGlass];

  // ---- skin: lobby glass, tower glass, slab edge bands, fins, balconies, crown, base, portal
  const skinMesh = new THREE.Mesh(loft(zs.slice(1).map((z) => Array.from({ length: N }, (_, i) => rp(z, thetaI(i)))), TOP), skinMat); G.skin.add(skinMesh);
  const lobbyGlass = new THREE.Mesh(loft(zs.slice(0, 2).map((z) => Array.from({ length: N }, (_, i) => rp(z, thetaI(i))))), lobbyGlassMat); G.skin.add(lobbyGlass);
  { // slab edge bands
    const rings = [], bandPos = [], bandIdx = []; let base = 0;
    for (let k = 1; k < zs.length; k++) for (const z of [zs[k], zs[k] + 0.55]) rings.push(Array.from({ length: N }, (_, i) => rp(z, thetaI(i), 0.38)));
    const pos = []; rings.forEach((r) => r.forEach((p) => { const v = w3(p); pos.push(v.x, v.y, v.z); }));
    for (let b = 0; b < rings.length; b += 2) for (let i = 0; i < N; i++) { const j = (i + 1) % N, a = b * N + i, bb = b * N + j, c = (b + 1) * N + j, d = (b + 1) * N + i; bandIdx.push(a, bb, c, a, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(bandIdx); g.computeVertexNormals(); G.skin.add(new THREE.Mesh(g, bandMat));
  }
  { // 72 bronze fins following the twist
    const pos = [], idx = []; const FS = N / TP.fins;
    for (let fi = 0; fi < TP.fins; fi++) {
      const th = thetaI(fi * FS), rings = [];
      for (const z of zs.slice(1)) {
        const p = rp(z, th), n = ringNormal(z, th), t = { x: -n.y, y: n.x }, h = hf(z), depth = 0.55 + 0.5 * (1 - h), w = 0.16;
        rings.push([[p.x - t.x * w + n.x * 0.02, p.y - t.y * w + n.y * 0.02], [p.x + t.x * w + n.x * 0.02, p.y + t.y * w + n.y * 0.02], [p.x + t.x * w + n.x * depth, p.y + t.y * w + n.y * depth], [p.x - t.x * w + n.x * depth, p.y - t.y * w + n.y * depth]].map(([x, y]) => ({ x, y, z })));
      }
      const b0 = pos.length / 3; rings.forEach((r) => r.forEach((p) => { const v = w3(p); pos.push(v.x, v.y, v.z); }));
      for (let k = 0; k < rings.length - 1; k++) for (const [a, b] of [[1, 2], [2, 3], [3, 0]]) idx.push(b0 + k * 4 + a, b0 + k * 4 + b, b0 + (k + 1) * 4 + b, b0 + k * 4 + a, b0 + (k + 1) * 4 + b, b0 + (k + 1) * 4 + a);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); G.skin.add(new THREE.Mesh(g, finMat));
  }
  { // curved balconies on floors 22..46
    const span = (TP.span * Math.PI) / 180, segs = 12, pos = [], idx = [], gp = [], gi = [];
    for (let f = TP.balc[0]; f <= TP.balc[1]; f++) {
      const z0 = floorZ(f), top = z0 + 0.06, bot = z0 - 0.3;
      for (let lobe = 0; lobe < TP.lobes; lobe++) {
        const tc = (2 * Math.PI * lobe) / TP.lobes, base = pos.length / 3;
        for (let s = 0; s <= segs; s++) {
          const u = s / segs, th = tc - span / 2 + span * u, ext = TP.depth * Math.pow(Math.sin(Math.PI * u), 0.55), pin = rp(z0, th, -0.05), pout = rp(z0, th, ext);
          for (const [p, z] of [[pin, top], [pin, bot], [pout, top], [pout, bot]]) { const v = w3({ x: p.x, y: p.y, z }); pos.push(v.x, v.y, v.z); }
        }
        for (let s = 0; s < segs; s++) { const a = base + s * 4, b = base + (s + 1) * 4; idx.push(a, a + 2, b + 2, a, b + 2, b, a + 1, b + 1, b + 3, a + 1, b + 3, a + 3, a + 2, a + 3, b + 3, a + 2, b + 3, b + 2);
          const A = rp(z0, tc - span / 2 + span * (s / segs), TP.depth * Math.pow(Math.sin(Math.PI * (s / segs)), 0.55) - 0.08), B = rp(z0, tc - span / 2 + span * ((s + 1) / segs), TP.depth * Math.pow(Math.sin(Math.PI * ((s + 1) / segs)), 0.55) - 0.08);
          const g0 = gp.length / 3; for (const [p, z] of [[A, top], [B, top], [B, top + 1.15], [A, top + 1.15]]) { const v = w3({ x: p.x, y: p.y, z }); gp.push(v.x, v.y, v.z); } gi.push(g0, g0 + 1, g0 + 2, g0, g0 + 2, g0 + 3); }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); G.skin.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: stone.color, roughness: 0.55, side: THREE.DoubleSide })));
    const g2 = new THREE.BufferGeometry(); g2.setAttribute("position", new THREE.Float32BufferAttribute(gp, 3)); g2.setIndex(gi); g2.computeVertexNormals(); G.skin.add(new THREE.Mesh(g2, balcGlass));
  }
  { // illuminated crown, ribs, light bands, spire
    const S = 12, rings = Array.from({ length: S + 1 }, (_, s) => Array.from({ length: N }, (_, i) => crownPoint(s / S, thetaI(i)))); G.skin.add(new THREE.Mesh(loft(rings, TOP + TP.crown), crownMat));
    const pos = [], idx = []; const FS = (N / TP.fins) * 2;
    for (let fi = 0; fi < TP.fins / 2; fi++) {
      const i = fi * FS, rs = [];
      for (let s = 0; s <= S; s++) { const u = s / S, p = crownPoint(u, thetaI(i)), n = ringNormal(TOP, thetaI(i)), t = { x: -n.y, y: n.x }; rs.push([[p.x - t.x * 0.14, p.y - t.y * 0.14], [p.x + t.x * 0.14, p.y + t.y * 0.14], [p.x + t.x * 0.14 + n.x * 0.9 * (1 - u), p.y + t.y * 0.14 + n.y * 0.9 * (1 - u)], [p.x - t.x * 0.14 + n.x * 0.9 * (1 - u), p.y - t.y * 0.14 + n.y * 0.9 * (1 - u)]].map(([x, y]) => ({ x, y, z: p.z }))); }
      const b0 = pos.length / 3; rs.forEach((r) => r.forEach((p) => { const v = w3(p); pos.push(v.x, v.y, v.z); }));
      for (let k = 0; k < rs.length - 1; k++) for (const [a, b] of [[1, 2], [2, 3], [3, 0]]) idx.push(b0 + k * 4 + a, b0 + k * 4 + b, b0 + (k + 1) * 4 + b, b0 + k * 4 + a, b0 + (k + 1) * 4 + b, b0 + (k + 1) * 4 + a);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); G.skin.add(new THREE.Mesh(g, finMat));
    for (const s of [0.25, 0.5, 0.75]) { const r1 = Array.from({ length: N }, (_, i) => crownPoint(s, thetaI(i), 0.25)), r2 = r1.map((p) => ({ ...p, z: p.z + 0.5 })); G.skin.add(new THREE.Mesh(loft([r1, r2]), crownMat)); }
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 1.1, TP.spire + 2, 16), crownMat); spire.position.set(0, TOP + TP.crown - 2 + (TP.spire + 2) / 2, 0); G.skin.add(spire);
  }
  { // base plinth + entrance portal (south side)
    const ring = Array.from({ length: N }, (_, i) => rp(0, thetaI(i), 0.6)), ring2 = ring.map((p) => ({ ...p, z: 0.5 })); G.skin.add(new THREE.Mesh(loft([ring, ring2]), new THREE.MeshStandardMaterial({ color: stone.color, roughness: 0.55, side: THREE.DoubleSide })));
    const p = rp(0, 1.5 * Math.PI, 0.25), c = w3(p);
    for (const dx of [-3.4, 3.4]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8.6, 0.7), new THREE.MeshStandardMaterial({ color: bronze.color, roughness: 0.3, metalness: 1 })); m.position.set(c.x - dx, 4.3, c.z); G.skin.add(m); }
    const l = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.7, 0.8), new THREE.MeshStandardMaterial({ color: bronze.color, roughness: 0.3, metalness: 1 })); l.position.set(c.x, 8.25, c.z); G.skin.add(l);
  }
  G.skin.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
  G.pick.add(skinMesh.clone()); G.pick.visible = false;

  // ---- site: arrival plaza, podium terraces, palms
  { const mk = (r, h, y, col) => {
      // the two raised terraces are opened on the street side so the arrival plaza meets the lobby at ground level
      const cut = r < 80, mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.8, side: THREE.DoubleSide });
      const m = new THREE.Mesh(cut ? new THREE.CylinderGeometry(r, r, h, 64, 1, false, Math.PI + 0.5, Math.PI * 2 - 1.0) : new THREE.CylinderGeometry(r, r, h, 64), mat); m.position.set(0, y + h / 2, 0); m.scale.set(1.0, 1, 0.82);
      if (cut) for (const th of [Math.PI + 0.5, Math.PI - 0.5]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(r, h), mat); p.position.set((Math.sin(th) * r) / 2, 0, (Math.cos(th) * r) / 2); p.rotation.y = th - Math.PI / 2; m.add(p); }
      G.site.add(m); return m; };
    mk(86, 0.4, 0.0, 0xcfc2a8); mk(66, 5.5, 0, 0xd9cdb5).position.y = 2.75 - 0.6; mk(50, 5.5, 5.5, 0xe0d5bf).position.y = 5.5 + 2.75 - 0.6;
    const palmG = new THREE.Group(); const trunk = new THREE.CylinderGeometry(0.22, 0.32, 7, 7), leaf = new THREE.ConeGeometry(0.5, 4.4, 4), tm = new THREE.MeshStandardMaterial({ color: 0x8a6a48 }), lm = new THREE.MeshStandardMaterial({ color: 0x3f7a3d });
    for (let i = 0; i < 70; i++) { const a = rnd() * 6.283, r = 52 + rnd() * 30; if (Math.sin(a) < -0.45) continue; const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.82, y0 = r < 66 ? (r < 50 ? 11 : 5.5) : 0.4; const t = new THREE.Mesh(trunk, tm); t.position.set(x, y0 + 3.5, z); const g = new THREE.Group(); for (let k = 0; k < 7; k++) { const l = new THREE.Mesh(leaf, lm); l.position.set(0, 0, 2); l.rotation.x = Math.PI / 2 + 0.5; const pv = new THREE.Group(); pv.add(l); pv.rotation.y = (k / 7) * 6.283; g.add(pv); } g.position.set(x, y0 + 7, z); palmG.add(t, g); }
    G.site.add(palmG); }

  // ---- structure: concrete core, columns, slabs, outriggers (colour by concrete grade)
  const GRADES = [{ name: "C80", from: 1, to: 15, col: 0x4b4f55 }, { name: "C70", from: 16, to: 30, col: 0x6f737a }, { name: "C60", from: 31, to: 45, col: 0x9a9ea5 }, { name: "C50", from: 46, to: 50, col: 0xc9ccd1 }];
  const gradeOf = (f) => GRADES.find((g) => f >= g.from && f <= g.to) || GRADES[3];
  const concMats = GRADES.map((g) => new THREE.MeshStandardMaterial({ color: g.col, roughness: 0.9, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  const coreRing = (z, th) => { const h = hf(z), r = 0.29 * radiusAt(z) * (1 + 0.52 * Math.max(0, Math.cos(3 * th)) + 0.12 * Math.cos(3 * th)), a = th + twistAt(z); return { x: r * Math.cos(a), y: r * Math.sin(a), z }; };
  const zFloor = (f) => (f === 1 ? 0 : floorZ(f)), zTopFloor = (f) => (f === 1 ? TP.lobby : floorZ(f) + TP.floorH);
  GRADES.forEach((g, gi) => { const zl = []; for (let f = g.from; f <= g.to; f++) { if (f === g.from) { if (gi === 0) zl.push(-15.2); zl.push(zFloor(f)); } zl.push(zTopFloor(f)); } const m = new THREE.Mesh(loft(zl.map((z) => Array.from({ length: N }, (_, i) => coreRing(z, thetaI(i))))), concMats[gi]); m.userData.grade = gi; G.struct.add(m); });
  const slabGeo = []; { const pos = [], idx = []; for (let f = 1; f <= TP.floors; f++) { const zt = zTopFloor(f); const g = plate(zt - 0.3, zt, (z, th) => rp(z, th, -0.4)); const p = g.attributes.position, ix = g.index.array, b0 = pos.length / 3; for (let i = 0; i < p.count; i++) pos.push(p.getX(i), p.getY(i), p.getZ(i)); for (let i = 0; i < ix.length; i++) idx.push(ix[i] + b0); } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const slabMesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xb7b3aa, roughness: 0.9, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false })); G.struct.add(slabMesh); }
  const NCOL = 18, COLZ = [];
  { const inst = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, transparent: true, opacity: 0.9 }), NCOL * TP.floors); let n = 0; const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), m4 = new THREE.Matrix4();
    for (let j = 0; j < NCOL; j++) { const th = (2 * Math.PI * (j + 0.5)) / NCOL; for (let f = 1; f <= TP.floors; f++) { const a = w3(rp(zFloor(f), th, -2.4)), b = w3(rp(zTopFloor(f), th, -2.4)); const mid = a.clone().add(b).multiplyScalar(0.5), dir = b.clone().sub(a), len = dir.length(); q.setFromUnitVectors(up, dir.normalize()); const r = 1.15 - 0.55 * (f / TP.floors); m4.compose(mid, q, new THREE.Vector3(r, len, r)); inst.setMatrixAt(n, m4); inst.setColorAt(n, new THREE.Color(gradeOf(f).col)); n++; } }
    G.struct.add(inst); }
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x2f6fb5, roughness: 0.4, metalness: 0.85 });
  const tube = (a, b, r, mat, g) => { const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mat); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(m); return m; };
  const OUTR = [20, 35];
  OUTR.forEach((f) => { const z0 = zFloor(f), z1 = zTopFloor(f + 1); for (let w = 0; w < 3; w++) { const th = (2 * Math.PI * w) / 3; const ca = w3(coreRing(z0, th)), cb = w3(coreRing(z1, th)), pa = w3(rp(z0, th, -2.4)), pb = w3(rp(z1, th, -2.4)); tube(ca, pb, 0.35, steelMat, G.struct); tube(cb, pa, 0.35, steelMat, G.struct); tube(ca, pa, 0.4, steelMat, G.struct); tube(cb, pb, 0.4, steelMat, G.struct); }
    for (let i = 0; i < NCOL; i++) { const th0 = (2 * Math.PI * (i + 0.5)) / NCOL, th1 = (2 * Math.PI * (((i + 1) % NCOL) + 0.5)) / NCOL; tube(w3(rp(z0, th0, -2.4)), w3(rp(z0, th1 + (i === NCOL - 1 ? 2 * Math.PI : 0), -2.4)), 0.3, steelMat, G.struct); } });

  // ---- foundation: lobed piled raft + piles
  const concFound = new THREE.MeshStandardMaterial({ color: 0x777a80, roughness: 0.95, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  const raft = new THREE.Mesh(plate(-15.2, -11.2, (z, th) => rp(0, th, 7)), concFound); G.found.add(raft);
  { const poly = Array.from({ length: N }, (_, i) => { const p = rp(0, thetaI(i), 5.5); return [p.x, p.y]; }), inside = (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
    const pts = []; for (let x = -36; x <= 36; x += 5) for (let y = -36; y <= 36; y += 5) if (inside(x, y)) pts.push([x, y]);
    const inst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.75, 0.75, 46, 12), new THREE.MeshStandardMaterial({ color: 0x8d9097, roughness: 0.9 }), pts.length); const m4 = new THREE.Matrix4(); pts.forEach(([x, y], i) => { const v = w3({ x, y, z: -15.2 - 23 }); m4.makeTranslation(v.x, v.y, v.z); inst.setMatrixAt(i, m4); }); G.found.add(inst); G.pileInst = inst; G.pileCount = pts.length; }

  // ---- rebar (iron): core wall bars + hoops, column cages, slab mats for the selected floor
  const rebarCol = 0xff7a2a;
  const rebarLines = (() => { const pos = [];
    const polyline = (pts) => { for (let i = 1; i < pts.length; i++) pos.push(pts[i - 1].x, pts[i - 1].y, pts[i - 1].z, pts[i].x, pts[i].y, pts[i].z); };
    for (let i = 0; i < N; i += 2) for (const off of [0, 0.35]) { const pts = [-15, 0, ...zs.slice(1)].map((z) => { const p = coreRing(z, thetaI(i)); const c = rp(z, 0, 0); const k = 1 - off / Math.max(1, Math.hypot(p.x, p.y)); return w3({ x: p.x * k, y: p.y * k, z }); }); polyline(pts); }
    for (let j = 0; j < NCOL; j++) { const th = (2 * Math.PI * (j + 0.5)) / NCOL; for (const [dx, dy] of [[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]]) polyline([-15, 0, ...zs.slice(1)].map((z) => { const p = rp(z, th, -2.4), v = w3({ x: p.x, y: p.y, z }); return new THREE.Vector3(v.x + dx, v.y, v.z + dy); })); }
    for (let f = 1; f <= TP.floors; f += 1) { const z = zFloor(f) + 1.5; for (let i = 0; i < N; i += 3) { const a = w3(coreRing(z, thetaI(i))), b = w3(coreRing(z, thetaI(i + 3))); pos.push(a.x, a.y, a.z, b.x, b.y, b.z); } for (let j = 0; j < NCOL; j++) { const th = (2 * Math.PI * (j + 0.5)) / NCOL, p = w3(rp(z, th, -2.4)); for (let k = 0; k < 8; k++) { const a0 = (k / 8) * 6.283, a1 = ((k + 1) / 8) * 6.283; pos.push(p.x + Math.cos(a0) * 0.85, p.y, p.z + Math.sin(a0) * 0.85, p.x + Math.cos(a1) * 0.85, p.y, p.z + Math.sin(a1) * 0.85); } } }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: rebarCol })); })();
  G.rebar.add(rebarLines);
  // raft + pile cages
  { const pos = []; for (let x = -30; x <= 30; x += 1.8) for (const y of [-14.6, -11.8]) { const a = w3({ x, y: -32, z: y }), b = w3({ x, y: 32, z: y }); pos.push(a.x, a.y, a.z, b.x, b.y, b.z); } for (let z = -30; z <= 30; z += 1.8) for (const y of [-14.6, -11.8]) { const a = w3({ x: -32, y: z, z: y }), b = w3({ x: 32, y: z, z: y }); pos.push(a.x, a.y, a.z, b.x, b.y, b.z); } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: rebarCol })); G.found.add(l); G.raftRebar = l; }
  let slabRebar = null;
  function showSlabRebar(f) {
    if (slabRebar) { G.rebar.remove(slabRebar); slabRebar.geometry.dispose(); slabRebar = null; } if (!f) return;
    const z = zTopFloor(f), poly = Array.from({ length: N }, (_, i) => { const p = rp(z, thetaI(i), -0.5); return [p.x, p.y]; }), inside = (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
    const pos = []; for (const [zz, dir] of [[z - 0.22, 0], [z - 0.06, 1]]) for (let a = -30; a <= 30; a += 0.4) for (let b = -30; b < 30; b += 0.6) { const x0 = dir ? a : b, y0 = dir ? b : a, x1 = dir ? a : b + 0.6, y1 = dir ? b + 0.6 : a; if (inside(x0, y0) && inside(x1, y1)) { const p = w3({ x: x0, y: y0, z: zz }), q = w3({ x: x1, y: y1, z: zz }); pos.push(p.x, p.y, p.z, q.x, q.y, q.z); } }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); slabRebar = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffb02a })); G.rebar.add(slabRebar);
  }

  // ---- floor highlight band
  const hiCache = new Map(); const hiMat = new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
  const hiMesh = new THREE.Mesh(new THREE.BufferGeometry(), hiMat); hiMesh.visible = false; root.add(hiMesh);
  function highlight(f) { if (!f) { hiMesh.visible = false; return; } if (!hiCache.has(f)) { const z0 = zFloor(f), z1 = zTopFloor(f); hiCache.set(f, loft([z0, z1].map((z) => Array.from({ length: N }, (_, i) => rp(z, thetaI(i), 0.7))))); } hiMesh.geometry = hiCache.get(f); hiMesh.visible = true; }

  // ---- facade glass cutaway (exploded layers) at floor 50, sea side
  const FAC = { f: 50, th: Math.PI / 2 };
  const facAnchor = (() => { const z = floorZ(FAC.f) + 1.2, p = rp(z, FAC.th), n = ringNormal(z, FAC.th), c = w3(p), nv = new THREE.Vector3(-n.x, 0, n.y).normalize(), tv = new THREE.Vector3(-(-n.y), 0, n.x).normalize(); return { c, nv, tv }; })();
  const facLabels = [];
  { const { c, nv } = facAnchor, g = G.facade, base = c.clone().addScaledVector(nv, 9); const yaw = Math.atan2(nv.x, nv.z); g.position.copy(base); g.rotation.y = yaw;
    const L = (w, h, d, col, op, x, y, z, metal) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshPhysicalMaterial({ color: col, transparent: op < 1, opacity: op, roughness: metal ? 0.3 : 0.05, metalness: metal ? 1 : 0, side: THREE.DoubleSide })); m.position.set(x, y, z); g.add(m); return m; };
    const H = 4.0, Wd = 2.5, X = [-7.2, -3.6, 0, 3.6, 7.2];
    L(Wd, H, 0.32, 0x3a86c8, 0.7, X[0], 0, 0);                                   // 1 outer lite (thick for readability)
    L(Wd, H, 0.12, 0xdfeeff, 0.35, X[1] - 0.45, 0, 0); L(Wd, H, 0.12, 0xdfeeff, 0.35, X[1] + 0.45, 0, 0);   // 2 two panes enclosing the argon cavity
    for (const s of [-1, 1]) L(0.1, H, 0.9, 0xb8c0c8, 1, X[1] + s * (Wd / 2 - 0.05), 0, 0, true);               // warm-edge spacer
    L(Wd, H, 0.14, 0xcfe8ff, 0.45, X[2] - 0.3, 0, 0); L(Wd, H, 0.05, 0xffe08a, 0.95, X[2], 0, 0); L(Wd, H, 0.14, 0xcfe8ff, 0.45, X[2] + 0.3, 0, 0);   // 3 laminated pair with PVB film
    for (const [w, h, x, y] of [[0.2, H, -Wd / 2, 0], [0.2, H, Wd / 2, 0], [Wd, 0.2, 0, H / 2], [Wd, 0.2, 0, -H / 2]]) L(w, h, 0.9, bronze.color, 1, X[3] + x, y, 0, true);    // frame
    L(Wd, 0.5, 1.8, 0xcfc4ae, 1, X[4], -H / 2 + 0.25, 0); L(Wd, 0.2, 1.8, 0xff6a3a, 1, X[4], -H / 2 + 0.6, 0);   // slab edge + fire-stop
    const mk = (t, x, y, z) => { const v = new THREE.Vector3(x, y, z); g.localToWorld(v); facLabels.push({ t, p: v }); };
    mk("1  Outer lite 8 mm, low-E blue coating", X[0], H / 2 + 0.4, 0); mk("2  Two panes + 16 mm argon cavity + spacer", X[1], -H / 2 - 0.5, 0); mk("3  Inner lite 6+6 mm laminated (PVB film)", X[2], H / 2 + 0.4, 0); mk("Bronze frame: drained, pressure-equalised, EPDM seals", X[3], -H / 2 - 0.5, 0); mk("Slab edge + fire-stop", X[4], H / 2 + 0.4, 0);
    g.visible = true; }
  G.facade.visible = false;

  // ---- rain
  const RAIN_N = 7000, rainPos = new Float32Array(RAIN_N * 6), rainVel = new Float32Array(RAIN_N);
  for (let i = 0; i < RAIN_N; i++) { const x = (rnd() - 0.5) * 520, z = (rnd() - 0.5) * 520, y = rnd() * 460; rainPos.set([x, y, z, x - 1.4, y + 9, z - 0.8], i * 6); rainVel[i] = 90 + rnd() * 40; }
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xaecbff, transparent: true, opacity: 0.55 })); rain.frustumCulled = false; G.rain.add(rain);
  const drain = new THREE.Group(); for (let k = 1; k < zs.length; k += 1) { const pts = Array.from({ length: N }, (_, i) => w3(rp(zs[k], thetaI(i), 0.45))); const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x35d4ff })); drain.add(l); } G.rain.add(drain);
  G.rain.visible = false;

  // ---- lightning protection + strike effect
  const NDC = 6, conductorPaths = [];
  for (let j = 0; j < NDC; j++) { const th = (2 * Math.PI * (j * 3 + 0.5)) / NCOL; const pts = [w3(crownPoint(0.1, th, -2.0))]; for (let k = zs.length - 1; k >= 0; k--) pts.push(w3(rp(zs[k], th, -2.4))); pts.push(w3(rp(0, th, -2.4)).setY(-11)); const ring = w3(rp(0, th, 8)); pts.push(new THREE.Vector3(ring.x, -1.4, ring.z)); conductorPaths.push(pts); }
  const spireTip = new THREE.Vector3(0, TOP + TP.crown + TP.spire, 0), spireBase = new THREE.Vector3(0, TOP + 2, 0);
  const axisPath = [spireTip, new THREE.Vector3(0, TOP + TP.crown - 4, 0), spireBase, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -11, 0)];
  const lightMat = new THREE.LineBasicMaterial({ color: 0x66d0ff }), ringMat = new THREE.LineBasicMaterial({ color: 0xffd84a });
  const conductors = conductorPaths.map((pts) => { const geo = new THREE.BufferGeometry().setFromPoints(pts); const l = new THREE.Line(geo, lightMat); G.light.add(l); return { pts, line: l, len: pts.reduce((s, p, i) => (i ? s + p.distanceTo(pts[i - 1]) : 0), 0) }; });
  const axisLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(axisPath), lightMat); G.light.add(axisLine);
  const crownRing = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: N }, (_, i) => w3(crownPoint(0.1, thetaI(i), -2.0)))), ringMat); G.light.add(crownRing);
  const earthRing = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: N }, (_, i) => { const p = w3(rp(0, thetaI(i), 8)); return new THREE.Vector3(p.x, -1.4, p.z); })), ringMat); G.light.add(earthRing);
  for (let i = 0; i < 12; i++) { const p = w3(rp(0, thetaI(i * 12), 8)); G.light.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(p.x, -1.4, p.z), new THREE.Vector3(p.x, -9, p.z)]), ringMat)); }
  const air = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe86a })); air.position.copy(spireTip); G.light.add(air);
  const spdPos = [10, 20, 30, 40, 50].map((f) => ({ f, p: w3({ x: 0, y: 0, z: zFloor(f) + 2 }).add(new THREE.Vector3(2.2, 0, 1.2)) }));
  const spdMeshes = spdPos.map((o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.5), new THREE.MeshStandardMaterial({ color: 0x35ff7a, emissive: 0x35ff7a, emissiveIntensity: 0.6 })); m.position.copy(o.p); G.light.add(m); return m; });
  const pulses = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: NDC * 4 + 4 }, () => new THREE.Vector3())), new THREE.PointsMaterial({ color: 0xffffff, size: 9, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); pulses.frustumCulled = false; G.light.add(pulses);
  const boltMat = new THREE.LineBasicMaterial({ color: 0xe6e2ff, transparent: true }); const bolt = new THREE.LineSegments(new THREE.BufferGeometry(), boltMat); bolt.frustumCulled = false; G.light.add(bolt);
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 64), new THREE.MeshBasicMaterial({ color: 0xffd84a, transparent: true, side: THREE.DoubleSide })); ripple.rotation.x = -Math.PI / 2; ripple.position.y = 0.3; ripple.visible = false; G.light.add(ripple);
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(4200, 4200), new THREE.MeshBasicMaterial({ map: canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#222a36"; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 60); const x = rnd() * w, y = rnd() * h, r = 20 + rnd() * 60; g.save(); g.translate(x, y); g.scale(1, 0.55); const gg = g.createRadialGradient(0, 0, 0, 0, 0, r); gg.addColorStop(0, `rgba(${40 + rnd() * 30},${48 + rnd() * 30},${60 + rnd() * 30},.55)`); gg.addColorStop(1, "rgba(30,36,48,0)"); g.fillStyle = gg; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.restore(); } }), transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  clouds.rotation.x = -Math.PI / 2; clouds.position.y = 760; root.add(clouds);
  G.light.visible = false;
  const STRIKE = { on: false, t0: 0, seed: 0, boltPts: [] };
  function makeBolt() { const pts = []; let p = new THREE.Vector3(55, 760, 25); const target = spireTip.clone(); const segs = 34; for (let i = 0; i < segs; i++) { const t = (i + 1) / segs, np = p.clone().lerp(target, 1 / (segs - i)); np.x += (rnd() - 0.5) * 26 * (1 - t); np.z += (rnd() - 0.5) * 26 * (1 - t); pts.push(p.clone(), np.clone()); if (rnd() < 0.16 && i < segs - 6) { let bp = np.clone(); for (let k = 0; k < 5; k++) { const bn = bp.clone().add(new THREE.Vector3((rnd() - 0.5) * 50, -26 - rnd() * 22, (rnd() - 0.5) * 50)); pts.push(bp.clone(), bn.clone()); bp = bn; } } p = np; } bolt.geometry.setFromPoints(pts); }
  const STEPS = [[0, "1  Lightning strikes the air terminal (the metal spire tip), the highest point"], [1.1, "2  Current runs down the spire axis and into the crown ring, which shares it between the 6 down conductors"], [2.6, "3  Down conductors follow the steel and rebar frame (a Faraday cage), so nothing passes through the living spaces"], [4.4, "4  Surge protectors (green) on each floor's electrical board clamp the surge: lights, lifts and screens stay safe"], [6.2, "5  The current ends in the earth ring and foundation piles and spreads safely into the ground"]];
  const API = { lobbyGlass, G, root, steps: STEPS, strike: STRIKE, facLabels, facAnchor, conductors, spdPos, spireTip, TOP, GRADES, skinMat, mats, lobbyGlassMat, skinMesh, clouds, showSlabRebar, highlight };
  API.startStrike = () => { STRIKE.on = true; STRIKE.t0 = performance.now() / 1000; G.light.visible = true; makeBolt(); bolt.visible = true; ripple.visible = false; };
  API.stopStrike = () => { STRIKE.on = false; G.light.visible = false; clouds.material.opacity = 0; spdMeshes.forEach((m) => (m.material.emissiveIntensity = 0.6)); G.pileInst.material.emissive = new THREE.Color(0); };
  API.update = (now, dt, st) => {
    if (G.rain.visible) { const a = rainGeo.attributes.position; for (let i = 0; i < RAIN_N; i++) { const o = i * 6; let y = rainPos[o + 1] - rainVel[i] * dt; if (y < 0) y += 460; const dy = y - rainPos[o + 1]; rainPos[o + 1] += dy; rainPos[o + 4] += dy; rainPos[o] -= dt * 14; rainPos[o + 3] -= dt * 14; if (rainPos[o] < -260) { rainPos[o] += 520; rainPos[o + 3] += 520; } } a.needsUpdate = true; }
    if (!STRIKE.on) return null; const e = Math.max(0, now - STRIKE.t0), flash = e < 0.06 ? 0.3 : e < 0.2 ? 0 : e < 0.3 ? 1 : e < 0.6 ? Math.max(0, 1 - (e - 0.3) * 3) : 0;
    clouds.material.opacity = Math.min(0.95, e * 1.5); bolt.visible = e < 0.75; boltMat.opacity = e < 0.3 ? 0.6 + 0.4 * Math.sin(e * 80) ** 2 : Math.max(0, 1 - (e - 0.3) * 2.4); if (e > 0.12 && e < 0.14) makeBolt();
    const prog = Math.min(1, Math.max(0, (e - 1.0) / 3.4)), P = pulses.geometry.attributes.position; let k = 0;
    conductors.forEach((c) => { for (let s = 0; s < 4; s++) { const u = Math.min(1, Math.max(0, prog * 1.2 - s * 0.05)); const d = u * c.len; let acc = 0, i = 1; for (; i < c.pts.length - 1; i++) { const l = c.pts[i].distanceTo(c.pts[i - 1]); if (acc + l >= d) break; acc += l; } const a = c.pts[i - 1], b = c.pts[i], l = a.distanceTo(b) || 1, p = a.clone().lerp(b, Math.min(1, (d - acc) / l)); P.setXYZ(k++, p.x, p.y, p.z); } c.line.visible = true; c.line.material.color.set(prog > 0 ? 0xfff2a8 : 0x66d0ff); });
    const ap = Math.min(1, Math.max(0, (e - 0.8) / 0.6)); const ay = TOP + TP.crown + TP.spire - ap * (TP.crown + TP.spire + 4); for (let s = 0; s < 4; s++) { P.setXYZ(k++, 0, Math.max(-4, ay - s * 8), 0); } P.needsUpdate = true;
    spdMeshes.forEach((m, i) => { const y = spdPos[i].p.y, reach = TOP * (1 - prog) + 0, hit = prog > 0 && y > TOP * (1 - prog * 1.15); m.material.emissiveIntensity = hit ? 4 + 2 * Math.sin(e * 30) : 0.6; m.material.color.set(hit ? 0xffffff : 0x35ff7a); });
    if (prog >= 1) { const r = Math.min(1, (e - 4.4) / 1.8); ripple.visible = true; const s = 10 + r * 70; ripple.scale.set(s, s, s); ripple.material.opacity = Math.max(0, 1 - r); G.pileInst.material.emissive = new THREE.Color(0x3bd8ff).multiplyScalar(Math.max(0, 1 - Math.abs(r - 0.4) * 2)); }
    return { flash, step: STEPS.filter(([t]) => e >= t).pop()[1], done: e > 9 };
  };
  API.setNight = (nightK) => { finMat.emissiveIntensity = 0.09 * nightK; bandMat.emissiveIntensity = 0.14 * nightK; skinMat.emissiveIntensity = 1.5 * nightK; crownMat.emissiveIntensity = 0.35 + 1.3 * nightK; };
  API.setWet = (wet) => { skinMat.roughness = wet ? 0.45 : 1; skinMat.clearcoat = wet ? 1 : 0.6; };
  API.setXray = (on) => { skinMat.transparent = on; skinMat.opacity = on ? 0.1 : 1; skinMat.depthWrite = !on; skinMat.needsUpdate = true;
    G.skin.children.forEach((m) => { if (!m.isMesh || m === lobbyGlass || m === skinMesh) return; const mt = m.material; if (mt === balcGlass || mt === crownMat) return; if (mt.userData.o === undefined) mt.userData.o = mt.opacity; mt.transparent = on || mt.userData.t; mt.opacity = on ? 0.12 : mt.userData.o; mt.depthWrite = !on; mt.needsUpdate = true; }); };
  API.setGradeColors = (on) => { G.struct.children.forEach((m) => { if (m.userData && m.userData.grade !== undefined) m.material.color.set(on ? GRADES[m.userData.grade].col : 0x8a8d92); }); };
  return API;
}
