import * as THREE from "three";

// Arrival garden, grand entrance, water features and landscape lighting for the street side of the tower (z < 0).
// Conceptual layout (not a surveyed site). Everything is instanced or merged per material; see LAYOUT for collision data.
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function buildLandscape({ rnd, canvasTex, drive, makeCar }) {
  const group = new THREE.Group(); group.name = "landscape";
  const R = (a, b) => a + (b - a) * rnd(), pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const tex = (w, h, fn) => { const t = canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
  const std = (c, r = 0.7, m = 0, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...o });
  const LAYOUT = { paths: [], water: [], solids: [], keepouts: [], crossings: [] };

  // ---------------------------------------------------------------- textures + materials
  const paveTex = tex(256, 256, (g, w, h) => { g.fillStyle = "#e1d8c6"; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = `hsl(36,${14 + rnd() * 8}%,${80 + rnd() * 8}%)`; g.fillRect(i * 64 + 1.5, j * 64 + 1.5, 61, 61); } for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(120,100,70,${rnd() * 0.1})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); } });
  const plazaTex = tex(512, 512, (g, w, h) => { g.fillStyle = "#e6dccb"; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = `hsl(38,${12 + rnd() * 8}%,${82 + rnd() * 7}%)`; g.fillRect(i * 64 + 1.5, j * 64 + 1.5, 61, 61); } g.strokeStyle = "#b08a4a"; g.lineWidth = 3; for (const y of [64, 448]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } for (const x of [192, 320]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } });
  const grassTex = tex(256, 256, (g, w, h) => { g.fillStyle = "#4f7d3a"; g.fillRect(0, 0, w, h); for (let i = 0; i < 5200; i++) { g.fillStyle = `hsla(${88 + rnd() * 30},${38 + rnd() * 22}%,${22 + rnd() * 20}%,.55)`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 2 + rnd() * 3); } });
  const waterBump = tex(256, 256, (g, w, h) => { g.fillStyle = "#808080"; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { const x = rnd() * w, y = rnd() * h, r = 6 + rnd() * 26, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(128,128,128,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); } });
  const leafTex = (() => { const t = canvasTex(256, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = "#35592c"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); for (let x = 6; x < w - 6; x += 5) { const len = (h / 2 - 2) * Math.sin(Math.PI * Math.min(1, x / w * 1.1 + 0.06)); g.strokeStyle = `hsl(${96 + rnd() * 18},${48 + rnd() * 14}%,${26 + rnd() * 14}%)`; g.lineWidth = 2.2; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x, h / 2); g.lineTo(x + 8, h / 2 + s * len); g.stroke(); } } }); return t; })();
  paveTex.wrapS = paveTex.wrapT = plazaTex.wrapS = plazaTex.wrapT = waterBump.wrapS = waterBump.wrapT = THREE.RepeatWrapping;
  const M = {
    stone: std(0xffffff, 0.6, 0, { map: paveTex }), plaza: std(0xffffff, 0.5, 0, { map: plazaTex }), grass: std(0xffffff, 1, 0, { map: grassTex }), coping: std(0xd9d0be, 0.55), kerb: std(0xbdb6a8, 0.8),
    bronze: std(0xb08a4a, 0.3, 1), steel: std(0xc4c9d0, 0.18, 1), teak: std(0x9a6b3e, 0.6), dark: std(0x2b2f36, 0.3, 0.5), white: std(0xf3f3ef, 0.6), cushion: std(0xe8e0d0, 0.9), trunk: std(0x7a6247, 0.95), foliage: std(0xffffff, 0.85), bush: std(0xffffff, 0.9), flower: std(0xffffff, 0.7),
    leaf: std(0xffffff, 0.8, 0, { map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide }), poolTile: std(0x2fa3b4, 0.3),
    water: std(0x0e6f86, 0.06, 0.1, { transparent: true, opacity: 0.86, bumpMap: waterBump, bumpScale: 0.5, emissive: 0x38d9ff, emissiveIntensity: 0, envMapIntensity: 1.6 }),
    led: new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffc27a, emissiveIntensity: 0.15, roughness: 0.4 }), glow: new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffd9a0, emissiveIntensity: 0.1, roughness: 0.4 }),
    sign: new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.5 }), uw: new THREE.MeshBasicMaterial({ color: 0x7ff3ff }),
  };
  M.sign.emissiveMap = M.sign.map = tex(1024, 96, (g, w, h) => { g.fillStyle = "#14161a"; g.fillRect(0, 0, w, h); g.fillStyle = "#e3c48a"; g.font = "600 56px Georgia,serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("D U B A I   A Z U R E   T O W E R", w / 2, h / 2 + 3); g.strokeStyle = "#b08a4a"; g.lineWidth = 3; g.strokeRect(4, 4, w - 8, h - 8); }); M.sign.emissiveMap.wrapS = M.sign.emissiveMap.wrapT = THREE.ClampToEdgeWrapping;
  [M.sign.map].forEach((t) => { t.repeat.set(1, 1); });

  // ---------------------------------------------------------------- geometry helpers
  const mx = new THREE.Matrix4(), qq = new THREE.Quaternion(), UP = V(0, 1, 0), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  const T = (x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) => mx.clone().compose(v1.set(x, y, z), qq.setFromAxisAngle(UP, ry), v2.set(sx, sy, sz));
  const scaleUV = (g, su, sv) => { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * su, a.getY(i) * sv); return g; };
  const batches = new Map();
  const addB = (mat, geo, m) => { let b = batches.get(mat); if (!b) batches.set(mat, (b = [])); const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m); b.push(g); };
  const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 20);
  const bx = (mat, w, h, d, x, y, z, ry = 0) => addB(mat, BOX, T(x, y + h / 2, z, ry, w, h, d));
  const cy = (mat, r, h, x, y, z) => addB(mat, CYL, T(x, y + h / 2, z, 0, r, h, r));
  function flush() {
    for (const [mat, list] of batches) { let n = 0; list.forEach((g) => (n += g.attributes.position.count)); const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0; list.forEach((g) => { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) U.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; });
      const G = new THREE.BufferGeometry(); G.setAttribute("position", new THREE.BufferAttribute(P, 3)); G.setAttribute("normal", new THREE.BufferAttribute(N, 3)); G.setAttribute("uv", new THREE.BufferAttribute(U, 2)); const m = new THREE.Mesh(G, mat); m.castShadow = true; m.receiveShadow = true; group.add(m); }
    batches.clear();
  }
  const ribbonB = () => ({ pos: [], uv: [], idx: [], add(pts, w, y = 0.1, tile = 4) { const n = pts.length, b0 = this.pos.length / 3; let L = 0; for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n - 1, i + 1)], tx = c.x - a.x, tz = c.z - a.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l; if (i) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); const yy = pts[i].y !== undefined && pts[i].y > 0.2 ? pts[i].y : y; this.pos.push(pts[i].x - nx * w / 2, yy, pts[i].z - nz * w / 2, pts[i].x + nx * w / 2, yy, pts[i].z + nz * w / 2); this.uv.push(0, L / tile, w / tile, L / tile); } for (let i = 0; i < n - 1; i++) { const a = b0 + i * 2; this.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }, mesh(mat) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2)); g.setIndex(this.idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m; } });
  const poly = (pts, hole) => { const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))); if (hole) { const h = new THREE.Path(hole.map(([x, z]) => new THREE.Vector2(x, -z))); s.holes.push(h); } const g = new THREE.ShapeGeometry(s); const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, g.attributes.position.getX(i) / 6, g.attributes.position.getY(i) / 6); const m = new THREE.Mesh(g, M.grass); m.rotation.x = -Math.PI / 2; m.position.y = 0.08; m.receiveShadow = true; group.add(m); return pts; };
  const inPoly = (x, z, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, zi] = p[i], [xj, zj] = p[j]; if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
  const blob = (cx, cz, rx, rz, n = 40) => Array.from({ length: n }, (_, i) => { const a = (i / n) * 6.2832, k = 1 + 0.12 * Math.sin(a * 3 + cx) + 0.07 * Math.sin(a * 5 + cz); return [cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k]; });

  // ---------------------------------------------------------------- grand entrance (z -44 .. -24): plaza, canopy, columns, sign, pools
  const plaza = new THREE.Mesh(scaleUV(new THREE.BoxGeometry(44, 0.14, 13), 3, 1.6), M.plaza); plaza.position.set(0, 0.4, -30.5); plaza.receiveShadow = true; group.add(plaza);
  bx(M.dark, 38, 0.5, 14, 0, 6.95, -37); bx(M.bronze, 38.4, 0.9, 0.35, 0, 7.45, -44.1); bx(M.bronze, 0.35, 0.9, 14, -19.1, 7.45, -37); bx(M.bronze, 0.35, 0.9, 14, 19.1, 7.45, -37); bx(M.bronze, 38, 0.12, 0.2, 0, 6.85, -43.8);
  for (const x of [-17, -9, 9, 17]) { cy(M.stone, 0.34, 6.6, x, 0.47, -30.8); cy(M.bronze, 0.42, 0.18, x, 0.47, -30.8); cy(M.bronze, 0.4, 0.15, x, 6.8, -30.8); LAYOUT.solids.push({ t: "circle", x, z: -30.8, r: 0.45 }); }
  const signM = new THREE.Mesh(new THREE.PlaneGeometry(26, 1.12), M.sign); signM.position.set(0, 7.45, -44.32); signM.rotation.y = Math.PI; group.add(signM);
  const downs = new THREE.InstancedMesh(new THREE.CircleGeometry(0.22, 18), M.glow, 36); { let i = 0; for (const z of [-41.5, -37, -32.5]) for (let k = 0; k < 12; k++) { mx.compose(v1.set(-16.5 + k * 3, 6.69, z), qq.setFromAxisAngle(V(1, 0, 0), Math.PI / 2), v2.set(1, 1, 1)); downs.setMatrixAt(i++, mx); } } group.add(downs);
  // water: reflecting pools flanking the walkway, a central canal and a fountain basin
  const waters = [], uwSpots = [];
  const rectPool = (x1, z1, x2, z2, y0 = 0.47) => { const w = x2 - x1, d = z2 - z1, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, hh = 0.5; for (const [a, b, c, e] of [[cx, z1 - 0.15, w + 0.6, 0.3], [cx, z2 + 0.15, w + 0.6, 0.3], [x1 - 0.15, cz, 0.3, d], [x2 + 0.15, cz, 0.3, d]]) { bx(M.coping, c, hh, e, a, y0, b); } bx(M.poolTile, w, 0.04, d, cx, y0 + 0.05, cz); bx(M.led, w, 0.03, 0.08, cx, y0 + hh - 0.1, z1 + 0.06); bx(M.led, w, 0.03, 0.08, cx, y0 + hh - 0.1, z2 - 0.06); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.water); m.rotation.x = -Math.PI / 2; m.position.set(cx, y0 + hh - 0.14, cz); group.add(m); waters.push(m); for (let i = 0; i < Math.max(2, Math.round(w / 3)); i++) uwSpots.push([x1 + ((i + 0.5) * w) / Math.max(2, Math.round(w / 3)), y0 + 0.16, cz]); LAYOUT.water.push({ t: "rect", x1: x1 - 0.3, z1: z1 - 0.3, x2: x2 + 0.3, z2: z2 + 0.3 }); };
  rectPool(6, -36.2, 16, -32.2); rectPool(-16, -36.2, -6, -32.2);
  rectPool(-3.2, -88, 3.2, -58, 0.08);   // reflecting canal on the main axis
  const basinR = 9, BC = [0, -99];
  { const wall = new THREE.CylinderGeometry(basinR, basinR, 0.55, 56, 1, true), rim = new THREE.RingGeometry(basinR - 0.55, basinR + 0.3, 56); addB(M.coping, wall, T(BC[0], 0.08 + 0.275, BC[1])); const rr = rim.clone(); rr.rotateX(-Math.PI / 2); addB(M.coping, rr, T(BC[0], 0.08 + 0.55, BC[1])); const fl = new THREE.CircleGeometry(basinR - 0.5, 56); fl.rotateX(-Math.PI / 2); addB(M.poolTile, fl, T(BC[0], 0.13, BC[1]));
    const wm = new THREE.Mesh(new THREE.CircleGeometry(basinR - 0.5, 56), M.water); wm.rotation.x = -Math.PI / 2; wm.position.set(BC[0], 0.5, BC[1]); group.add(wm); waters.push(wm); LAYOUT.water.push({ t: "circle", x: BC[0], z: BC[1], r: basinR + 0.3 }); for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283; uwSpots.push([BC[0] + Math.cos(a) * 6.5, 0.22, BC[1] + Math.sin(a) * 6.5]); } cy(M.steel, 0.5, 0.5, BC[0], 0.13, BC[1]); }
  const uwI = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 10, 8), M.uw, uwSpots.length); uwSpots.forEach((p, i) => { mx.compose(v1.set(...p), qq.identity(), v2.set(1, 1, 1)); uwI.setMatrixAt(i, mx); }); group.add(uwI);
  // fountain jets (cheap point particles; disabled on Low)
  const JETS = []; { JETS.push({ x: BC[0], y: 0.55, z: BC[1], h: 7, sp: 0.2, n: 70 }); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; JETS.push({ x: BC[0] + Math.cos(a) * 5, y: 0.55, z: BC[1] + Math.sin(a) * 5, h: 3.4, sp: 1.6, n: 18, dx: -Math.cos(a), dz: -Math.sin(a) }); } for (const px of [11, -11]) for (let k = 0; k < 5; k++) JETS.push({ x: px + (k - 2) * 1.8, y: 0.95, z: -34.2, h: 1.1, sp: 0.5, n: 10, dx: 0, dz: 0.4 }); }
  const NJ = JETS.reduce((s, j) => s + j.n, 0), jetPos = new Float32Array(NJ * 3), jetGeo = new THREE.BufferGeometry(); jetGeo.setAttribute("position", new THREE.BufferAttribute(jetPos, 3));
  const jetPts = new THREE.Points(jetGeo, new THREE.PointsMaterial({ color: 0xe6fbff, size: 0.3, map: (() => { const t = canvasTex(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }); return t; })(), transparent: true, opacity: 0.85, depthWrite: false })); jetPts.frustumCulled = false; group.add(jetPts);

  // ---------------------------------------------------------------- driveway: kerbs, stone drop-off bay, crossings
  const dpts = (u0, u1, off = 0, n = 90) => Array.from({ length: n + 1 }, (_, i) => { const u = u0 + ((u1 - u0) * i) / n, p = drive.getPointAt(u), t = drive.getTangentAt(u), l = Math.hypot(t.x, t.z) || 1; return V(p.x - (t.z / l) * off, p.y, p.z + (t.x / l) * off); });
  { const kb = ribbonB(); kb.add(dpts(0, 1, 5.3, 160), 0.45, 0.1, 2); kb.add(dpts(0, 1, -5.3, 160), 0.45, 0.1, 2); kb.pos.forEach((v, i) => { if (i % 3 === 1) kb.pos[i] += 0.2; }); const km = kb.mesh(M.kerb); km.castShadow = true; group.add(km);
    const bay = ribbonB(); bay.add(dpts(0.41, 0.59, 0, 20), 10.2, 0.1, 4); bay.pos.forEach((v, i) => { if (i % 3 === 1) bay.pos[i] += 0.03; }); group.add(bay.mesh(M.stone)); }
  const zebraAt = (xTarget) => { let bu = 0, bd = 1e9; for (let i = 0; i <= 400; i++) { const u = i / 400, p = drive.getPointAt(u); if (p.z > -100 && Math.abs(p.x - xTarget) < bd) { bd = Math.abs(p.x - xTarget); bu = u; } } const p = drive.getPointAt(bu), t = drive.getTangentAt(bu), l = Math.hypot(t.x, t.z), tx = t.x / l, tz = t.z / l, nx = -tz, nz = tx, ry = Math.atan2(-nz, nx); for (let k = -2; k <= 2; k++) bx(M.white, 9.6, 0.03, 0.5, p.x + tx * k * 1.0, p.y + 0.05, p.z + tz * k * 1.0, ry); LAYOUT.crossings.push({ x: p.x, z: p.z }); return p; };
  const crossW = zebraAt(-13), crossE = zebraAt(13);
  // coast-road crossings and sidewalks (z -160..-140 road)
  for (const x of [-30, 30]) for (let k = -2; k <= 2; k++) bx(M.white, 0.5, 0.03, 19.4, x + k * 1.0, 0.09, -150);
  for (const [a, b] of [[-150, 82], [102, 150]]) { bx(M.stone, b - a, 0.18, 4, (a + b) / 2, 0, -137.5); bx(M.kerb, b - a, 0.22, 0.3, (a + b) / 2, 0, -139.9); }
  bx(M.stone, 300, 0.18, 4, 0, 0, -162.5); bx(M.kerb, 300, 0.22, 0.3, 0, 0, -160.1);

  // ---------------------------------------------------------------- paths (curved stone) + lit edges
  const PATHS = [
    { w: 4, pts: [[-30, -137], [-36, -116], [-27, -92], [-19, -72], [-13.5, -57], [-13.5, -47]] }, { w: 4, pts: [[30, -137], [36, -116], [27, -92], [19, -72], [13.5, -57], [13.5, -47]] },
    { w: 3, pts: [[-13, -99], [-30, -93], [-44, -84], [-50, -78]], loopTo: 1 }, { w: 3, pts: [[13, -99], [30, -94], [44, -88], [52, -84]] },
    { w: 2.6, pts: [[-50, -78], [-60, -112], [-56, -135]] }, { w: 2.6, pts: [[52, -84], [62, -112], [58, -135]] },
  ];
  const ringPts = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * 6.283; return [BC[0] + Math.cos(a) * 14, BC[1] + Math.sin(a) * 14]; }); PATHS.push({ w: 3, pts: ringPts, closed: true });
  // flank gardens loops
  PATHS.push({ w: 2.6, pts: [[132, -134], [150, -112], [162, -90], [150, -66], [136, -52]] }, { w: 2.6, pts: [[-132, -134], [-150, -112], [-162, -90], [-150, -66], [-136, -52]] });
  const pathB = ribbonB(), edgeB = ribbonB(), samples = [], bollards = [];
  PATHS.forEach((P) => { const curve = new THREE.CatmullRomCurve3(P.pts.map(([x, z]) => V(x, 0, z)), !!P.closed, "centripetal"), n = Math.max(8, Math.round(curve.getLength() / 1.4)), pts = curve.getSpacedPoints(n).map((p) => V(p.x, 0, p.z)); pathB.add(pts, P.w, 0.1, 4);
    for (const s of [-1, 1]) { const off = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n, i + 1)], tx = c.x - a.x, tz = c.z - a.z, l = Math.hypot(tx, tz) || 1; return V(p.x - (tz / l) * s * (P.w / 2 + 0.05), 0, p.z + (tx / l) * s * (P.w / 2 + 0.05)); }); edgeB.add(off, 0.12, 0.115, 2); }
    pts.forEach((p, i) => { samples.push([p.x, p.z, P.w / 2]); if (i % 6 === 3) { const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n, i + 1)], l = Math.hypot(c.x - a.x, c.z - a.z) || 1, s = (i / 6) % 2 ? 1 : -1; bollards.push([p.x - ((c.z - a.z) / l) * s * (P.w / 2 + 0.7), p.z + ((c.x - a.x) / l) * s * (P.w / 2 + 0.7)]); } });
    LAYOUT.paths.push({ w: P.w, pts: pts.filter((_, i) => i % 3 === 0).map((p) => [+p.x.toFixed(1), +p.z.toFixed(1)]) }); });
  group.add(pathB.mesh(M.stone)); { const em = edgeB.mesh(M.led); em.receiveShadow = false; group.add(em); }

  // ---------------------------------------------------------------- lawns (island under the driveway arch + flank gardens), exclusion zones
  const rampRect = [82, -170, 102, -94];
  const A1 = dpts(0, 1, 8.5, 120), A2 = dpts(0, 1, -8.5, 120), dirIn = A1.map((p, i) => { const q = A2[i]; const c = q.z < p.z ? q : p; return [c.x, Math.max(-132, c.z)]; });
  const island = poly([...dirIn, [125, -132], [-125, -132]], [[82, -131], [102, -131], [102, -94], [82, -94]].map(([x, z]) => [x, z]));
  const flankE = blob(160, -88, 30, 46), flankW = blob(-160, -88, 30, 46); poly(flankE); poly(flankW);
  const KEEP = [[-60, -97, 7], [-92, -45, 7], [-82, -108, 5], [112, -138, 5], [-50, -78, 11], [52, -84, 12], [0, -99, 11.5], [0, -73, 5.5]];
  const free = (x, z, clr = 0) => { if (!(inPoly(x, z, island) || inPoly(x, z, flankE) || inPoly(x, z, flankW))) return false; if (x > rampRect[0] - 2 && x < rampRect[2] + 2 && z > rampRect[1] && z < rampRect[3] + 2) return false; if (Math.abs(x) < 4.5 && z > -90 && z < -56) return false; for (const [kx, kz, kr] of KEEP) if (Math.hypot(x - kx, z - kz) < kr + clr) return false; for (const s of samples) if (Math.hypot(x - s[0], z - s[1]) < s[2] + 0.9 + clr) return false; return true; };
  KEEP.forEach(([x, z, r]) => LAYOUT.keepouts.push({ t: "circle", x, z, r })); LAYOUT.keepouts.push({ t: "rect", x1: rampRect[0], z1: rampRect[1], x2: rampRect[2], z2: rampRect[3] });
  const spots = (n, clr, sep, region, tries = 4000) => { const out = []; let t = 0; while (out.length < n && t++ < tries) { const [x0, x1, z0, z1] = region || [-170, 195, -132, -50], x = R(x0, x1), z = R(z0, z1); if (!free(x, z, clr)) continue; if (out.some(([a, b]) => Math.hypot(a - x, b - z) < sep)) continue; out.push([x, z]); } return out; };

  // ---------------------------------------------------------------- plants (instanced)
  const jitterGeo = (g, a) => { const p = g.attributes.position, nr = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const l = Math.hypot(p.getX(i), p.getY(i), p.getZ(i)) || 1; nr[i * 3] = p.getX(i) / l; nr[i * 3 + 1] = p.getY(i) / l; nr[i * 3 + 2] = p.getZ(i) / l; const k = 1 + (Math.sin(p.getX(i) * 7.3 + p.getY(i) * 3.1) + Math.cos(p.getZ(i) * 6.1)) * a; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } g.setAttribute("normal", new THREE.BufferAttribute(nr, 3)); return g; };   // sphere normals = smooth shading on the jittered blobs
  const mergeG = (list) => { let n = 0; list.forEach((g) => (n += g.attributes.position.count)); const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0; list.forEach((g) => { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) U.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; }); const G = new THREE.BufferGeometry(); G.setAttribute("position", new THREE.BufferAttribute(P, 3)); G.setAttribute("normal", new THREE.BufferAttribute(N, 3)); G.setAttribute("uv", new THREE.BufferAttribute(U, 2)); return G; };
  const inst = (geo, mat, n, shadow = true) => { const m = new THREE.InstancedMesh(geo, mat, Math.max(1, n)); m.castShadow = shadow; m.receiveShadow = true; m.count = n; m.frustumCulled = false; group.add(m); return m; };
  const setM = (m, i, x, y, z, ry, sx, sy, sz, tilt = 0, tdir = 0) => { qq.setFromEuler(new THREE.Euler(Math.sin(tdir) * tilt, ry, Math.cos(tdir) * tilt, "YXZ")); mx.compose(v1.set(x, y, z), qq, v2.set(sx, sy, sz)); m.setMatrixAt(i, mx); };
  const col = (c) => new THREE.Color(c);
  const GREENS = ["#2f6b32", "#3e7d3a", "#4b8a3d", "#355f2c", "#5a8f45"].map(col), BUSH = ["#2c5e30", "#3a7036", "#486f2e", "#6b8a3c", "#3d6a46"].map(col), FLOW = ["#e8567a", "#f4c542", "#f6f0e4", "#e98b3a", "#a06ad6"].map(col);
  // date palms: two trunk/frond variants, near/far frond detail swapped by camera distance
  const frondGeo = (count, seg, L, top, seedK) => { const pos = [], uv = [], idx = [], nrm = []; for (let f = 0; f < count; f++) { const a = (f / count) * 6.2832 + Math.sin(f * 12.9 + seedK) * 0.25, ca = Math.cos(a), sa = Math.sin(a), len = L * (0.8 + 0.3 * Math.abs(Math.sin(f * 7.7 + seedK))), up = 0.5 + 0.7 * Math.abs(Math.sin(f * 3.3 + seedK)), b0 = pos.length / 3; for (let s = 0; s <= seg; s++) { const t = s / seg, r = t * len, y = top[1] + up * Math.sin(t * 2.0) - (0.9 + 1.7 * (0.5 + 0.5 * Math.sin(f * 5.1 + seedK))) * t * t * 1.6, hw = 0.62 * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.05))); const px = top[0] + ca * r, pz = sa * r; pos.push(px - sa * hw, y, pz + ca * hw, px + sa * hw, y, pz - ca * hw); uv.push(t, 0, t, 1); nrm.push(0, 1, 0, 0, 1, 0); } for (let s = 0; s < seg; s++) { const i = b0 + s * 2; idx.push(i, i + 1, i + 3, i, i + 3, i + 2); } } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx); return g; };
  const palmV = [0, 1].map((v) => { const H = 8.8 + v * 1.6, bend = v ? 0.45 : -0.3, tg = new THREE.CylinderGeometry(0.2, 0.36, H, 8, 9); tg.translate(0, H / 2, 0); const p = tg.attributes.position; for (let i = 0; i < p.count; i++) { const k = p.getY(i) / H; p.setX(i, p.getX(i) + bend * k * k * 1.4); } tg.computeVertexNormals(); const top = [bend * 1.4, H]; return { trunk: tg, near: frondGeo(16, 6, 3.7, top, v * 3.1), far: frondGeo(8, 3, 3.7, top, v * 3.1) }; });
  const palmList = []; const addPalm = (x, z, s) => palmList.push({ x, z, s: s || R(0.75, 1.5), ry: R(0, 6.28), v: Math.floor(rnd() * 2), tilt: R(0, 0.09), td: R(0, 6.28) });
  { const ringN = 10; for (let i = 0; i < ringN; i++) { const a = (i / ringN) * 6.283 + 0.2; const x = BC[0] + Math.cos(a) * 21, z = BC[1] + Math.sin(a) * 21; if (free(x, z, 0)) addPalm(x, z, R(1.0, 1.35)); } spots(26, 1.2, 9).forEach(([x, z]) => addPalm(x, z)); spots(16, 1.2, 9, [128, 195, -125, -50]).forEach(([x, z]) => addPalm(x, z)); spots(16, 1.2, 9, [-195, -128, -125, -50]).forEach(([x, z]) => addPalm(x, z)); for (const x of [-48, -36, 36, 48]) addPalm(x, -141.5, R(0.9, 1.2)); }
  const palmMeshes = palmV.map((P) => ({ trunk: inst(P.trunk, M.trunk, palmList.length), near: inst(P.near, M.leaf, palmList.length, false), far: inst(P.far, M.leaf, palmList.length, false) }));
  let lastLOD = -9;
  const lodPalms = (cam, force) => { const now = performance.now(); if (!force && now - lastLOD < 500) return; lastLOD = now;
    const tcnt = [0, 0], ncnt = [0, 0], fcnt = [0, 0]; palmList.forEach((p, idx) => { if (idx >= Math.ceil(palmList.length * density)) return; const PM = palmMeshes[p.v], dd = Math.hypot(p.x - cam.x, p.z - cam.z) + Math.abs(cam.y) * 0.3, near = dd < 110; setM(PM.trunk, tcnt[p.v]++, p.x, 0.08, p.z, p.ry, p.s, p.s, p.s, p.tilt, p.td); if (near) setM(PM.near, ncnt[p.v]++, p.x, 0.08, p.z, p.ry, p.s, p.s, p.s, p.tilt, p.td); else setM(PM.far, fcnt[p.v]++, p.x, 0.08, p.z, p.ry, p.s, p.s, p.s, p.tilt, p.td); }); palmMeshes.forEach((PM, v) => { PM.trunk.count = tcnt[v]; PM.near.count = ncnt[v]; PM.far.count = fcnt[v]; [PM.trunk, PM.near, PM.far].forEach((m) => (m.instanceMatrix.needsUpdate = true)); }); };
  // shade trees: three canopy shapes (ghaf / neem style: broad umbrella crowns)
  const canopyGeo = (k) => { const blobs = [], n = 4 + k; for (let i = 0; i < n; i++) { const a = (i / n) * 6.28 + k, r = i ? 1.7 + 0.4 * k : 0, g = new THREE.IcosahedronGeometry(1.5 + 0.35 * Math.sin(i * 2.1 + k), 1); jitterGeo(g, 0.1); g.scale(1.25, 0.72, 1.25); g.translate(Math.cos(a) * r, 4.6 + 0.35 * Math.sin(i + k), Math.sin(a) * r); blobs.push(g); } return mergeG(blobs); };
  const trunkT = new THREE.CylinderGeometry(0.2, 0.34, 5, 8); trunkT.translate(0, 2.5, 0);
  const treeList = []; spots(24, 3.5, 13).forEach(([x, z]) => treeList.push({ x, z, k: treeList.length % 3 })); spots(10, 3.5, 13, [128, 195, -125, -50]).concat(spots(10, 3.5, 13, [-195, -128, -125, -50])).forEach(([x, z]) => treeList.push({ x, z, k: treeList.length % 3 }));
  const trees = [0, 1, 2].map((k) => { const mine = treeList.filter((t) => t.k === k), T1 = inst(trunkT, M.trunk, mine.length), C1 = inst(canopyGeo(k), M.foliage, mine.length); mine.forEach((t, i) => { const s = R(0.85, 1.4); setM(T1, i, t.x, 0.08, t.z, R(0, 6.28), s, s, s); setM(C1, i, t.x, 0.08, t.z, R(0, 6.28), s * R(0.9, 1.15), s, s * R(0.9, 1.15)); C1.setColorAt(i, pick(GREENS)); }); return { T1, C1, n: mine.length }; });
  // shrubs (hedges, path edges, planters) and flower beds
  const bushG = jitterGeo(new THREE.IcosahedronGeometry(1, 1), 0.14), flowG = new THREE.IcosahedronGeometry(0.13, 0);
  const shrubPos = []; for (let x = -148; x <= 148; x += 2.3) { if (Math.abs(Math.abs(x) - 30) < 3.5 || (x > 76 && x < 108)) continue; shrubPos.push([x, -134.3 + R(-0.3, 0.3), R(0.9, 1.3)]); }
  samples.forEach((s, i) => { if (i % 5 === 2 && rnd() < 0.55) { const a = R(0, 6.28), d = s[2] + R(1.4, 2.6), x = s[0] + Math.cos(a) * d, z = s[1] + Math.sin(a) * d; if (free(x, z, -0.5)) shrubPos.push([x, z, R(0.6, 1.2)]); } });
  for (const px of [-22, 22]) for (const pz of [-30, -25.5]) { bx(M.coping, 3.4, 0.75, 1.0, px, 0.47, pz); shrubPos.push([px - 0.8, pz, 0.62], [px + 0.8, pz, 0.62]); LAYOUT.solids.push({ t: "rect", x1: px - 1.8, z1: pz - 0.6, x2: px + 1.8, z2: pz + 0.6 }); }
  const shrubs = inst(bushG, M.bush, shrubPos.length); shrubPos.forEach(([x, z, s], i) => { const onPlaza = Math.abs(x) < 24 && z > -32, y = onPlaza ? 1.15 : 0.08; setM(shrubs, i, x, y + 0.3 * s, z, R(0, 6.28), s * R(0.9, 1.3), s * R(0.55, 0.85), s * R(0.9, 1.3)); shrubs.setColorAt(i, pick(BUSH)); });
  const bedList = []; { const centers = spots(15, 3.5, 7); centers.forEach(([cx, cz], b) => { const base = FLOW[b % FLOW.length], rr = R(2, 3.2); for (let i = 0; i < 46; i++) { const a = R(0, 6.28), d = Math.sqrt(rnd()) * rr; bedList.push([cx + Math.cos(a) * d, cz + Math.sin(a) * d * 0.7, base]); } }); }
  const flowers = inst(flowG, M.flower, bedList.length, false); bedList.forEach(([x, z, c], i) => { setM(flowers, i, x, 0.2 + R(0, 0.15), z, 0, R(0.8, 1.4), R(0.8, 1.4), R(0.8, 1.4)); flowers.setColorAt(i, c.clone().offsetHSL(R(-0.02, 0.02), 0, R(-0.06, 0.06))); });
  [shrubs, flowers, ...trees.map((t) => t.C1)].forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  const totals = { shrubs: shrubPos.length, flowers: bedList.length, trees: trees.map((t) => t.n) };

  // ---------------------------------------------------------------- seating, pergola lounge, sculpture, planters
  const bench = (x, z, ry) => { bx(M.teak, 1.9, 0.08, 0.5, x, 0.45, z, ry); const c = Math.cos(ry), s = Math.sin(ry); for (const k of [-0.75, 0.75]) bx(M.dark, 0.08, 0.45, 0.45, x + c * k, 0.0, z - s * k, ry); bx(M.teak, 1.9, 0.4, 0.06, x - s * 0.22, 0.55, z - c * 0.22, ry); LAYOUT.solids.push({ t: "circle", x, z, r: 1.1 }); };
  { let k = 0; for (const s of samples) { if (k++ % 26 !== 11) continue; const x = s[0], z = s[1]; const a = Math.atan2(z - BC[1], x - BC[0]); const bxz = [x + 3, z], ok = free(bxz[0], bxz[1], -1.5) || free(x - 3, z, -1.5); if (!ok) continue; const px = free(x + 3, z, -1.5) ? x + 3 : x - 3; bench(px, z, px > x ? -Math.PI / 2 : Math.PI / 2); } }
  // sculpture plaza (west) with a twisted steel column echoing the tower, ringed by benches
  { const [sx, sz] = [-50, -78]; const disc = new THREE.CircleGeometry(9, 40); disc.rotateX(-Math.PI / 2); scaleUV(disc, 3, 3); addB(M.stone, disc, T(sx, 0.11, sz)); cy(M.coping, 2.3, 0.45, sx, 0.11, sz); for (let i = 0; i < 18; i++) { const s = 1 - i * 0.022; addB(M.steel, BOX, T(sx, 0.56 + i * 0.4 + 0.18, sz, i * 0.2, 1.9 * s, 0.34, 1.0 * s)); } for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283 + 0.5; bench(sx + Math.cos(a) * 6.5, sz + Math.sin(a) * 6.5, -a - Math.PI / 2 + Math.PI); } LAYOUT.solids.push({ t: "circle", x: sx, z: sz, r: 2.6 }); }
  // shaded lounge (east): timber deck, bronze pergola with slatted roof, sofas, table, lanterns
  { const [px, pz] = [52, -84]; bx(M.teak, 12, 0.14, 9, px, 0.08, pz); for (const [dx, dz] of [[-5.4, -4], [5.4, -4], [-5.4, 4], [5.4, 4]]) cy(M.bronze, 0.14, 3.4, px + dx, 0.2, pz + dz); for (let i = 0; i < 16; i++) bx(M.teak, 0.16, 0.12, 9.6, px - 5.7 + i * 0.76, 3.6, pz); for (const dz of [-4, 4]) bx(M.bronze, 12, 0.16, 0.2, px, 3.48, pz + dz);
    for (const [dx, dz, ry] of [[-2.2, -1.2, 0], [-2.2, 1.6, Math.PI]]) { bx(M.cushion, 2.6, 0.45, 0.9, px + dx, 0.22, pz + dz, 0); bx(M.cushion, 2.6, 0.5, 0.22, px + dx, 0.5, pz + dz + (ry ? 0.36 : -0.36)); } bx(M.stone, 1.6, 0.4, 0.9, px - 2.2, 0.22, pz + 0.2); bx(M.cushion, 0.9, 0.4, 0.9, px + 2.4, 0.22, pz - 0.4, 0.6); bx(M.cushion, 0.9, 0.4, 0.9, px + 2.4, 0.22, pz + 1.4, -0.6); for (const [dx, dz] of [[-5.4, -4], [5.4, 4]]) cy(M.glow, 0.2, 0.5, px + dx, 0.2, pz + dz + 0.6); LAYOUT.solids.push({ t: "rect", x1: px - 6, z1: pz - 4.5, x2: px + 6, z2: pz + 4.5 }); }
  // bollard path lights (instanced), tree up-lights and street poles
  const bollG = new THREE.CylinderGeometry(0.1, 0.12, 0.8, 10), bollCap = new THREE.SphereGeometry(0.13, 10, 8), bollI = inst(bollG, M.dark, bollards.length, false), capI = inst(bollCap, M.glow, bollards.length, false);
  bollards.forEach(([x, z], i) => { setM(bollI, i, x, 0.4 + 0.08, z, 0, 1, 1, 1); setM(capI, i, x, 0.9, z, 0, 1, 1, 1); }); [bollI, capI].forEach((m) => (m.instanceMatrix.needsUpdate = true));
  const upG = new THREE.CylinderGeometry(0.12, 0.16, 0.14, 8), upSpots = [...palmList.slice(0, 40).map((p) => [p.x + 0.9, p.z]), ...treeList.slice(0, 20).map((t) => [t.x + 1.1, t.z])], upI = inst(upG, M.glow, upSpots.length, false); upSpots.forEach(([x, z], i) => setM(upI, i, x, 0.12, z, 0, 1, 1, 1)); upI.instanceMatrix.needsUpdate = true;
  const poleG = (() => { const a = new THREE.CylinderGeometry(0.09, 0.14, 8.5, 8); a.translate(0, 4.25, 0); const b = new THREE.BoxGeometry(0.09, 0.09, 2.4); b.translate(0, 8.4, 1.0); return mergeG([a.toNonIndexed(), b.toNonIndexed()]); })(), headG = new THREE.BoxGeometry(0.4, 0.12, 0.8); headG.translate(0, 8.3, 2.0);
  const poleSpots = []; for (let x = -144; x <= 144; x += 36) if (Math.abs(x - 92) > 12) poleSpots.push([x, -136.4, Math.PI]); const poleI = inst(poleG, M.dark, poleSpots.length, false), headI = inst(headG, M.glow, poleSpots.length, false); poleSpots.forEach(([x, z, ry], i) => { setM(poleI, i, x, 0.3, z, ry, 1, 1, 1); setM(headI, i, x, 0.3, z, ry, 1, 1, 1); });
  flush();

  // ---------------------------------------------------------------- traffic: two cars on the coast road (not on the arrival loop)
  const cars = []; if (makeCar) { [[-154, 0, 1, 7.5, 40], [-146, 3, -1, 6.5, -60]].forEach(([z, ci, dir, sp, x0]) => { const c = makeCar(ci); c.position.set(x0, 0.06, z); c.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; group.add(c); cars.push({ c, dir, sp, z }); }); }

  // ---------------------------------------------------------------- state: density, night, update
  let density = 1, anim = true;
  const API = { group, LAYOUT, totals, jets: NJ };
  API.setDensity = (d, animate) => { density = d; anim = animate; shrubs.count = Math.ceil(totals.shrubs * Math.min(1, d)); flowers.count = Math.ceil(totals.flowers * Math.min(1, d)); trees.forEach((t) => (t.C1.count = t.T1.count = Math.ceil(t.n * Math.min(1, 0.5 + d * 0.5)))); jetPts.visible = animate; lodPalms({ x: 0, y: 50, z: -150 }, true); };
  API.setNight = (k) => { M.led.emissiveIntensity = 0.15 + 1.9 * k; M.glow.emissiveIntensity = 0.1 + 2.6 * k; M.sign.emissiveIntensity = 0.5 + 1.5 * k; M.water.emissiveIntensity = 0.5 * k; M.uw.color.set(k > 0.3 ? 0xbffcff : 0x7ff3ff); };
  // camera / walkthrough collision query (trunks, canopies, shrubs, benches, pools, columns): true when the point is inside something solid
  API.blocked = (x, y, z, pad = 0.4) => {
    for (const p of palmList) { const dx = x - p.x, dz = z - p.z; if (dx * dx + dz * dz < (0.5 * p.s + pad) ** 2 && y < 12 * p.s) return true; }
    for (const t of treeList) { const dx = x - t.x, dz = z - t.z, d2 = dx * dx + dz * dz; if (d2 < (0.5 + pad) ** 2 && y < 5.5) return true; if (d2 < (3.6 + pad) ** 2 && y > 3.2 && y < 7.4) return true; }
    for (const [sx, sz, ss] of shrubPos) { const dx = x - sx, dz = z - sz; if (dx * dx + dz * dz < (1.2 * ss + pad) ** 2 && y < 1.6 * ss + 0.5) return true; }
    for (const o of LAYOUT.solids) { if (o.t === "circle" ? Math.hypot(x - o.x, z - o.z) < o.r + pad : x > o.x1 - pad && x < o.x2 + pad && z > o.z1 - pad && z < o.z2 + pad) if (y < 4) return true; }
    for (const w of LAYOUT.water) { if (y < 1.4 && (w.t === "circle" ? Math.hypot(x - w.x, z - w.z) < w.r : x > w.x1 && x < w.x2 && z > w.z1 && z < w.z2)) return true; }
    return false;
  };
  API.update = (now, cam, dt) => {
    lodPalms(cam, false); if (!anim) return;
    waterBump.offset.set((now * 0.012) % 1, (now * 0.008) % 1);
    let i = 0; JETS.forEach((j) => { for (let k = 0; k < j.n; k++) { const u = (now * 0.55 + k / j.n + j.x * 0.13) % 1, h = j.h * 4 * u * (1 - u), r = j.sp * u * 0.5; jetPos[i * 3] = j.x + (j.dx || 0) * j.sp * u + Math.sin(k * 2.4) * r * 0.25; jetPos[i * 3 + 1] = j.y + h; jetPos[i * 3 + 2] = j.z + (j.dz || 0) * j.sp * u + Math.cos(k * 2.4) * r * 0.25; i++; } }); jetGeo.attributes.position.needsUpdate = true;
    cars.forEach((c) => { c.c.position.x += c.dir * c.sp * dt; if (c.c.position.x > 230) c.c.position.x = -230; if (c.c.position.x < -230) c.c.position.x = 230; });
  };
  return API;
}
