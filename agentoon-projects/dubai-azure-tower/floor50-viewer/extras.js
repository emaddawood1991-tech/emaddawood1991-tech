import * as THREE from "three";

// Street + car drive-in, underground parking (air, fire, sensors), elevators, glass pool, lobby people.
// Tower world: centre (0,0), ground y=0, sea +Z, entrance portal south (-Z).  Floor-50 world: x 0..28, z 0..20.
const std = (c, r = 0.6, m = 0, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...x });
const box = (g, w, h, d, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z); m.rotation.y = ry; g.add(m); return m; };
const cyl = (g, rt, rb, h, mat, x, y, z, seg = 20) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y + h / 2, z); g.add(m); return m; };
const lines = (pos, color) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color })); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const sm = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

export function buildExtras(ctx) {
  const { rnd, TP, topZ, floorZ, canvasTex } = ctx;
  const STREET = new THREE.Group(), PARK = new THREE.Group(), ELEV = new THREE.Group(), POOLG = new THREE.Group(), CROWD = new THREE.Group();
  const API = { STREET, PARK, ELEV, POOLG, CROWD, dyn: [], labels: {}, info: {} };
  const FL = [];   // flow-dot systems
  function flow(group, pts, color, dir = 1, speed = 1, n = 0, size = 0.1) { const p = pts.map((a) => (Array.isArray(a) ? V(...a) : a)); const cum = [0]; for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + p[i].distanceTo(p[i - 1])); const len = cum[cum.length - 1], N = n || Math.max(3, Math.round(len / 1.6)); const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(size, 8, 6), new THREE.MeshBasicMaterial({ color }), N); mesh.frustumCulled = false; group.add(mesh); FL.push({ group, p, cum, len, N, mesh, dir, speed, off: rnd() }); }
  const m4 = new THREE.Matrix4(), tv = new THREE.Vector3();
  function updateFlows(t) { FL.forEach((f) => { let vis = true, g = f.group; while (g) { if (!g.visible) { vis = false; break; } g = g.parent; } f.mesh.visible = vis; if (!vis) return; for (let i = 0; i < f.N; i++) { let u = (i / f.N + f.off + t * f.speed * 3 / Math.max(3, f.len) * f.dir) % 1; if (u < 0) u += 1; const d = u * f.len; let k = 1; while (k < f.cum.length - 1 && f.cum[k] < d) k++; const a = f.p[k - 1], b = f.p[k], s = (d - f.cum[k - 1]) / (f.cum[k] - f.cum[k - 1] || 1); tv.copy(a).lerp(b, Math.min(1, Math.max(0, s))); m4.makeTranslation(tv.x, tv.y, tv.z); f.mesh.setMatrixAt(i, m4); } f.mesh.instanceMatrix.needsUpdate = true; }); }
  function tube(g, a, b, r, mat) { const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), mat); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); g.add(m); return m; }
  function pipe(g, pts, r, mat) { const p = pts.map((a) => V(...a)); for (let i = 1; i < p.length; i++) { tube(g, p[i - 1], p[i], r, mat); if (i < p.length - 1) { const j = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat); j.position.copy(p[i]); g.add(j); } } return p; }

  // ================================================================ cars + people
  const carBodyMats = [0x1b1f27, 0xd9d9d6, 0x7d1f26, 0x1e3c6e, 0x8b8f95, 0x2f4f3a, 0xc9a25a, 0x111111];
  const glassM = std(0x1a2330, 0.05, 0.6), tyreM = std(0x0d0d0f, 0.9), lampM = new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xfff3d0, emissiveIntensity: 0, roughness: 0.3 }), tailM = new THREE.MeshStandardMaterial({ color: 0xaa1111, emissive: 0xff1111, emissiveIntensity: 0.1, roughness: 0.3 });
  const carMats = carBodyMats.map((c) => std(c, 0.25, 0.7));
  function makeCar(ci = 0, scale = 1) {
    const g = new THREE.Group(), body = carMats[ci % carMats.length];
    box(g, 1.85, 0.62, 4.5, body, 0, 0.35, 0).scale.set(1, 1, 1);
    const cab = box(g, 1.62, 0.55, 2.3, glassM, 0, 0.95, -0.2); cab.rotation.x = 0;
    box(g, 1.7, 0.05, 2.1, body, 0, 1.5, -0.2);
    for (const [x, z] of [[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.4], [0.9, -1.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 16), tyreM); w.rotation.z = Math.PI / 2; w.position.set(x, 0.34, z); g.add(w); }
    for (const x of [-0.65, 0.65]) { box(g, 0.4, 0.14, 0.05, lampM, x, 0.62, 2.26); box(g, 0.4, 0.12, 0.05, tailM, x, 0.66, -2.26); }
    g.scale.setScalar(scale); return g;
  }
  API.makeCar = makeCar;
  const skins = [0xf1c9a5, 0xc68e63, 0x8d5a3a, 0xe8b894], cloth = [0x2b3a55, 0x7a2e2e, 0x3a5a4a, 0x8a7a5a, 0x4a4a52, 0xb58a3a, 0x20252d];
  function makePerson(c1, c2, staff) {
    const g = new THREE.Group(), body = std(staff ? 0x1e2a44 : c1, 0.8), legM = std(staff ? 0x161c2c : c2, 0.8), skin = std(skins[Math.floor(rnd() * skins.length)], 0.7);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.55, 4, 10), body); torso.position.y = 1.18; g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), skin); head.position.y = 1.72; g.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10, 0, 6.3, 0, 1.4), std(rnd() > 0.5 ? 0x1a1410 : 0x5a3a20, 0.9)); hair.position.y = 1.74; g.add(hair);
    const mkLimb = (r, len, mat, x, y) => { const p = new THREE.Group(); p.position.set(x, y, 0); const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 8), mat); m.position.y = -len / 2 - r; p.add(m); g.add(p); return p; };
    g.userData.legL = mkLimb(0.085, 0.62, legM, -0.09, 0.9); g.userData.legR = mkLimb(0.085, 0.62, legM, 0.09, 0.9);
    g.userData.armL = mkLimb(0.06, 0.5, body, -0.27, 1.5); g.userData.armR = mkLimb(0.06, 0.5, body, 0.27, 1.5);
    if (staff) { const tag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.02), std(0xc9a25a, 0.3, 1)); tag.position.set(0.1, 1.38, 0.2); g.add(tag); }
    g.traverse((m) => { m.castShadow = true; }); return g;
  }
  API.makePerson = makePerson;
  // walkers follow waypoint lists
  const walkers = [];
  function walker(person, pts, speed, opts = {}) { const w = { g: person, pts: pts.map((a) => V(...a)), i: 0, speed, wait: 0, t: 0, loopDelay: opts.loopDelay || 6, startDelay: opts.startDelay || 0, hold: opts.hold || {}, onStep: opts.onStep, state: "delay", clock: 0, hide: opts.hide || {} }; person.visible = false; CROWD.add(person); walkers.push(w); return w; }
  function poseWalk(g, t, moving) { const s = moving ? Math.sin(t * 7) * 0.55 : 0; g.userData.legL.rotation.x = s; g.userData.legR.rotation.x = -s; if (!g.userData.waving) { g.userData.armL.rotation.x = -s * 0.8; g.userData.armR.rotation.x = s * 0.8; } g.position.y = moving ? Math.abs(Math.sin(t * 7)) * 0.03 : 0; }

  // ================================================================ street + car drive-in
  const asphalt = std(0x2a2d33, 0.95, 0, { side: THREE.DoubleSide }), paveM = std(0xcfc8b8, 0.9), lineW = std(0xf3f3ef, 0.6), lineY = std(0xe8c24a, 0.6);
  function ribbon(curve, width, mat, n = 220) { const pos = [], idx = []; for (let i = 0; i <= n; i++) { const t = i / n, p = curve.getPointAt(t), tg = curve.getTangentAt(t), nx = -tg.z, nz = tg.x, l = Math.hypot(nx, nz) || 1; for (const s of [-1, 1]) pos.push(p.x + (nx / l) * s * width / 2, p.y, p.z + (nz / l) * s * width / 2); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m; }
  const road = (g, x, z, w, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), asphalt); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.06, z); g.add(m); return m; };
  road(STREET, 0, -150, 520, 20);
  { const pos = []; for (let x = -250; x < 250; x += 10) pos.push(x, 0.1, -150, x + 5, 0.1, -150); STREET.add(lines(pos, 0xf3f3ef)); const e = []; for (const z of [-140.3, -159.7]) e.push(-260, 0.1, z, 260, 0.1, z); STREET.add(lines(e, 0xf3f3ef)); }
  const driveYf = (x) => 0.47 - 0.41 * sm(58, 112, Math.abs(x));
  const drivePts = [[-125, -150], [-100, -124], [-72, -88], [-40, -54], [0, -42], [40, -54], [72, -88], [100, -124], [125, -150]].map(([x, z]) => V(x, driveYf(x), z));
  const drive = new THREE.CatmullRomCurve3(drivePts, false, "catmullrom", 0.5); STREET.add(ribbon(drive, 10, asphalt));
  { const pos = []; for (let i = 0; i < 160; i += 2) { const a = drive.getPointAt(i / 160), b = drive.getPointAt((i + 1) / 160); pos.push(a.x, a.y + 0.04, a.z, b.x, b.y + 0.04, b.z); } STREET.add(lines(pos, 0xe8c24a)); }
  // pavement + canopy at the drop-off
  box(STREET, 44, 0.12, 13, std(0xd9cdb5, 0.8), 0, 0.4, -30.5); const canopyM = std(0x2b2f36, 0.3, 0.5);
  box(STREET, 38, 0.5, 14, canopyM, 0, 7.2, -37); for (const x of [-17, -6, 6, 17]) cyl(STREET, 0.35, 0.35, 7.2, std(0xc9a25a, 0.3, 1), x, 0.4, -30.8, 16);
  { const strip = new THREE.Mesh(new THREE.BoxGeometry(36, 0.1, 0.3), new THREE.MeshStandardMaterial({ color: 0xffe3b8, emissive: 0xffc27a, emissiveIntensity: 1.2 })); strip.position.set(0, 7.15, -30.2); STREET.add(strip); }
  // approach arrows + sign posts
  { const pos = []; for (const [x, z, dx, dz] of [[-95, -118, 1, 1.2], [-60, -74, 1, 1.1], [60, -74, 1, -1.1]]) { const l = Math.hypot(dx, dz); pos.push(x, 0.2, z, x + (dx / l) * 5, 0.2, z + (dz / l) * 5); } STREET.add(lines(pos, 0x6fd0ff)); }
  const signM = (txt, col) => { const t = canvasTex(256, 96, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.font = "bold 40px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, w / 2, h / 2); }); return new THREE.MeshBasicMaterial({ map: t }); };
  { const s1 = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.2), signM("ARRIVAL ▶", "#1d3b6e")); s1.position.set(-82, 4.6, -108); s1.rotation.y = 0.6; STREET.add(s1); cyl(STREET, 0.12, 0.12, 4, std(0x555a60), -82, 0, -108, 8);
    const s2 = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.2), signM("P  PARKING ▶", "#0f6a3a")); s2.position.set(112, 4.6, -138); s2.rotation.y = -0.4; STREET.add(s2); cyl(STREET, 0.12, 0.12, 4, std(0x555a60), 112, 0, -138, 8); }
  // street lamps
  const lampBulbs = [];
  for (const [x, z] of [[-100, -140], [-50, -140], [0, -140], [50, -140], [100, -140], [-70, -64], [-34, -40], [34, -40], [70, -64]]) { cyl(STREET, 0.08, 0.1, 7, std(0x3a3f46, 0.5, 0.6), x, 0, z, 8); const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffe9bd, emissive: 0xffd38a, emissiveIntensity: 0 })); b.position.set(x, 7.1, z); STREET.add(b); lampBulbs.push(b); }
  // parking ramp mouth east of the plaza
  const rampPts = [V(92, 0.05, -165), V(92, 0.05, -142), V(92, -0.05, -137), V(92, -3.5, -97), V(92, -3.5, -90), V(92, -7.1, -50), V(92, -7.2, -46), V(92, -10.7, -8)];
  const rampCurve = new THREE.CatmullRomCurve3(rampPts, false, "centripetal");
  const rampLane = (() => { const p = []; for (let i = 0; i <= 40; i++) { const q = rampCurve.getPointAt(i / 40); p.push(V(q.x - 2.3, q.y, q.z)); } return new THREE.CatmullRomCurve3(p, false, "centripetal"); })();
  const uAtZ = (curve, z) => { let a = 0, b = 1; for (let i = 0; i < 32; i++) { const m = (a + b) / 2; if (curve.getPointAt(m).z < z) a = m; else b = m; } return (a + b) / 2; };
  const rampAtZ = (z) => rampCurve.getPointAt(uAtZ(rampCurve, z));
  { const rr = ribbon(rampCurve, 9.4, asphalt, 260); STREET.add(rr); API.rampRibbon = rr; }
  // open cut-and-cover ramp: retaining walls, tunnel mouth with height limit, gantry sign, guard booth + boom barrier
  const wallC = std(0x7c7f84, 0.95); let barrier = null, barLive = { ang: 0, target: 0 };
  { for (let z = -137; z < -97; z += 1) { const p = rampAtZ(z + 0.5), h = 0.9 - (p.y - 0.35); for (const x of [87.25, 96.75]) box(STREET, 0.5, h, 1.05, wallC, x, p.y - 0.35, z + 0.5); box(STREET, 0.7, 0.08, 1.05, std(0xc9a25a, 0.3, 1), 87.25, 0.9, z + 0.5); box(STREET, 0.7, 0.08, 1.05, std(0xc9a25a, 0.3, 1), 96.75, 0.9, z + 0.5); }
    box(STREET, 10.8, 2.0, 1.2, wallC, 92, -0.8, -97.5); for (const x of [87.25, 96.75]) box(STREET, 0.5, 3.6, 7, wallC, x, -4.0, -93.5); box(STREET, 9.5, 0.5, 7, wallC, 92, -0.9, -93.5);
    const hl = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 1.3), signM("CAR PARK   MAX 2.1 m", "#0f6a3a")); hl.position.set(92, 0.45, -98.13); hl.rotation.y = Math.PI; STREET.add(hl);
    for (const x of [85.4, 98.6]) cyl(STREET, 0.14, 0.14, 5.4, std(0x555a60, 0.5, 0.6), x, 0, -133, 10); box(STREET, 13.6, 0.3, 0.3, std(0x555a60, 0.5, 0.6), 92, 5.2, -133);
    const gs = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 2.0), signM("P  CAR PARK  ▼", "#0f6a3a")); gs.position.set(92, 4.1, -133.2); gs.rotation.y = Math.PI; STREET.add(gs);
    // island, booth, ticket machine, camera, boom barrier (arm lifts for each car)
    const p0 = rampAtZ(-124), p1 = rampAtZ(-128), p2 = rampAtZ(-120), slope = (p2.y - p1.y) / 8;
    const isl = box(STREET, 1.5, 0.22, 9, std(0x9a9a98, 0.9), 92.1, p0.y - 0.1, -124); isl.rotation.x = -slope;
    box(STREET, 1.3, 2.5, 2.4, std(0xe9e6df, 0.6), 92.15, p0.y + 0.1, -122.5); box(STREET, 1.32, 0.9, 2.0, glassM, 92.15, p0.y + 1.1, -122.5); box(STREET, 1.5, 0.15, 2.6, std(0x2b2f36, 0.5, 0.5), 92.15, p0.y + 2.55, -122.5);
    const guard = makePerson(0, 0, true); guard.position.set(92.15, p0.y + 0.15, -122.5); guard.rotation.y = -Math.PI / 2; CROWD.add(guard); API.guard = guard;
    box(STREET, 0.45, 1.25, 0.35, std(0x2b2f36, 0.5, 0.5), 91.15, p0.y - 0.0, -127.4); box(STREET, 0.3, 0.3, 0.05, new THREE.MeshStandardMaterial({ color: 0x35ff7a, emissive: 0x35ff7a, emissiveIntensity: 1.2 }), 91.15, p0.y + 0.85, -127.62);
    cyl(STREET, 0.06, 0.06, 3.2, std(0x555a60, 0.5, 0.6), 96.5, 0.9, -118, 8); box(STREET, 0.5, 0.25, 0.7, std(0x2b2f36, 0.4, 0.6), 96.5, 4.0, -118);
    const stripes = canvasTex(256, 32, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#d8232a"; g.fillRect((i * w) / 8, 0, w / 8, h); } });
    barrier = new THREE.Group(); barrier.position.set(91.4, p0.y + 1.05, -124); const arm = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.12, 0.12), new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.5 })); arm.position.set(-1.85, 0, 0); barrier.add(arm); STREET.add(barrier); }

  // street trees
  { const tm = std(0x8a6a48), lm = std(0x3f7a3d); for (const [x, z] of [[-120, -134], [-80, -134], [-20, -134], [20, -134], [80, -134], [124, -134], [-60, -164], [60, -164]]) { cyl(STREET, 0.16, 0.22, 4, tm, x, 0, z, 8); const l = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 10), lm); l.position.set(x, 5, z); STREET.add(l); } }
  // moving cars on the loop and down the ramp
  const arrCar = makeCar(3); STREET.add(arrCar);
  const car2 = makeCar(1); STREET.add(car2);
  const rampCar = makeCar(0); STREET.add(rampCar), rampCar.visible = false;
  const parked = []; for (const [x, z, ry, ci] of [[-14, -46.2, 0, 4], [-26, -46.2, 0, 2]]) { }
  const follow = (g, curve, u, flip = 1) => { const p = curve.getPointAt(Math.min(0.9999, Math.max(0, u))), tg = curve.getTangentAt(Math.min(0.9999, Math.max(0, u))).multiplyScalar(flip); g.position.copy(p); g.rotation.set(-Math.asin(Math.max(-0.4, Math.min(0.4, tg.y))) * 0, Math.atan2(tg.x, tg.z), 0); g.rotation.order = "YXZ"; g.rotation.x = -Math.atan2(tg.y, Math.hypot(tg.x, tg.z)); };
  const carState = { t: 0, phase: 0, u: 0, wait: 0, ph2: 0, t2: 0, rampT: 0, rampPhase: 0 };
  const DRIVE_LEN = drive.getLength(), RAMP_LEN = rampCurve.getLength();
  const passengerA = makePerson(0x7a2e2e, 0x20252d), passengerB = makePerson(0x2b3a55, 0x20252d);

  // ================================================================ lobby: people, reception, lift doors
  const lobbyLifts = [];   // {x,z,ang,panels,open,target}
  API.lobbyLifts = lobbyLifts;
  for (const ang of [Math.PI * 1.17, Math.PI * 1.83, Math.PI * 0.5]) { const R = 6.55, x = Math.cos(ang) * R, z = Math.sin(ang) * R, ry = -ang + Math.PI / 2, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; const mat = std(0xb6bbc2, 0.25, 1); const l = box(g, 1.2, 2.5, 0.12, mat, -0.6, 0.05, 0.1), r = box(g, 1.2, 2.5, 0.12, mat, 0.6, 0.05, 0.1); box(g, 2.6, 0.3, 0.2, std(0x2b2f36, 0.4, 0.6), 0, 2.55, 0.1); box(g, 0.08, 2.6, 0.2, std(0xc9a25a, 0.3, 1), -1.3, 0, 0.1); box(g, 0.08, 2.6, 0.2, std(0xc9a25a, 0.3, 1), 1.3, 0, 0.1); CROWD.add(g); lobbyLifts.push({ g, x, z, ang, l, r, open: 0, target: 0 }); }
  // staff at the reception desk
  const staff = [-1.7, 1.7].map((x, i) => { const p = makePerson(0, 0, true); p.position.set(x, 0, -11.6); p.rotation.y = Math.PI; CROWD.add(p); return p; });
  const liftA = lobbyLifts[1], liftB = lobbyLifts[0];
  const guestArrive = (pass) => [[0, 0, -36], [-0.5, 0, -27], [0, 0, -23], [0, 0, -18], [0, 0, -15.0]];
  const toLiftA = [[8.5, 0, -14.5], [12.5, 0, -9.5], [9.6, 0, -5.2], [6.4, 0, -3.9]];
  const outFromLiftB = [[-6.2, 0, -3.8], [-9.6, 0, -5.0], [-12.2, 0, -9.4], [-8, 0, -15.6], [-1, 0, -17.5], [0, 0, -23], [0, 0, -30], [-5, 0, -37]];
  // guest 1: from the car
  const G1 = { person: makePerson(0x7a2e2e, 0x20252d), step: -1, t: 0, wait: 0, path: [], pos: V(0, 0, -40), state: "idle", clock: 0 };
  const G2 = { person: makePerson(0x3a5a4a, 0x20252d), step: -1, t: 0, wait: 0, path: [], pos: V(0, 0, 0), state: "idle", clock: 0 };
  const G3 = { person: makePerson(0xb58a3a, 0x20252d), step: -1, t: 0, wait: 0, path: [], pos: V(0, 0, 0), state: "idle", clock: 0 };
  [G1, G2, G3].forEach((p) => { p.person.visible = false; CROWD.add(p.person); });
  function setPath(P, pts, speed, then) { P.path = pts.map((a) => V(...a)); P.i = 0; P.speed = speed; P.then = then; P.state = "walk"; P.person.visible = true; if (P.path.length) P.person.position.copy(P.path[0]); }
  const guestStepTimes = { clock: 0 };
  function updateWalker(P, dt, t) {
    if (P.state === "walk") { const target = P.path[P.i + 1]; if (!target) { P.state = "done"; P.then && P.then(P); return; } const to = target.clone().sub(P.person.position); const d = to.length(), step = P.speed * dt; if (d <= step) { P.person.position.copy(target); P.i++; } else { to.normalize(); P.person.position.addScaledVector(to, step); P.person.rotation.y = Math.atan2(to.x, to.z); } poseWalk(P.person, t, true); }
    else if (P.state === "wait") { P.wait -= dt; poseWalk(P.person, t, false); if (P.wait <= 0) P.then && P.then(P); }
    else if (P.state === "idle") { poseWalk(P.person, t, false); }
  }
  // reception scripting
  const rec = { greeting: 0 };
  function startGuestCycle() {
    setPath(G1, guestArrive(), 1.25, () => { G1.state = "wait"; G1.wait = 6.5; rec.greeting = 6.5; G1.person.rotation.y = 0; G1.then = () => {
      setPath(G1, [[0, 0, -15.0], ...toLiftA], 1.2, () => { liftA.target = 1; G1.state = "wait"; G1.wait = 2.2; G1.then = () => { setPath(G1, [[6.4, 0, -3.9], [6.55 * Math.cos(liftA.ang), 0, 6.55 * Math.sin(liftA.ang)]], 0.9, () => { G1.person.visible = false; G1.state = "idle"; setTimeout(() => { liftA.target = 0; }, 1500); }); }; }); }; });
  }
  function startExitCycle() {
    liftB.target = 1; setTimeout(() => { setPath(G2, [[6.55 * Math.cos(liftB.ang), 0, 6.55 * Math.sin(liftB.ang)], ...outFromLiftB], 1.2, () => { G2.person.visible = false; G2.state = "idle"; }); setTimeout(() => { liftB.target = 0; }, 1800); }, 1200);
  }
  API.lobbyClock = { next1: 3, next2: 11, next3: 20 };

  // ================================================================ elevators (inside the tower core)
  const shaftDefs = [
    { name: "Express A", x: -2.7, z: 0, y0: -11, y1: 205, vmax: 8.0, col: 0xffd36a, floors: [0, 201, 150, 0, 120, 201] },
    { name: "Express B", x: 2.7, z: 0, y0: -11, y1: 205, vmax: 8.0, col: 0xffb454, floors: [0, 120, 201, 0, 90, 160] },
    { name: "Mid-rise 1", x: 0, z: -2.7, y0: 0, y1: 190, vmax: 6.0, col: 0x9fd6ff, floors: [0, 80, 40, 0, 120, 60] },
    { name: "Mid-rise 2", x: 0, z: 2.7, y0: 0, y1: 190, vmax: 6.0, col: 0x9fd6ff, floors: [0, 50, 100, 0, 150, 30] },
    { name: "Service + fire-fighting", x: 0, z: 0, y0: -11, y1: 205, vmax: 4.0, col: 0xff8c7a, floors: [-11, 0, 60, 0, 120, -11] },
  ];
  const shaftMat = new THREE.LineBasicMaterial({ color: 0x8aa0b8, transparent: true, opacity: 0.55 });
  const cars = [];
  shaftDefs.forEach((s, i) => {
    const h = s.y1 - s.y0, geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.4, h, 2.4)), sh = new THREE.LineSegments(geo, shaftMat); sh.position.set(s.x, s.y0 + h / 2, s.z); ELEV.add(sh);
    const car = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.4, 1.9), new THREE.MeshStandardMaterial({ color: s.col, emissive: s.col, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.5 })); car.castShadow = false; ELEV.add(car);
    const cw = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 0.9), std(0x5a5f66, 0.7, 0.6)); ELEV.add(cw);
    const rope = lines([0, 0, 0, 0, 1, 0], 0xcfd5dc); ELEV.add(rope);
    cars.push({ s, car, cw, rope, y: s.floors[0] + 0, state: "dwell", t0: 0, dwell: 2 + i * 1.3, k: 0, from: 0, to: 0, dur: 0, v: 0, floor: 1, label: null });
  });
  { const machine = box(ELEV, 8, 4, 8, std(0x4a4f57, 0.7, 0.4), 0, 205, 0), pit = box(ELEV, 8, 1.2, 8, std(0x4a4f57, 0.7, 0.4), 0, -12.2, 0); API.machine = machine; }
  const tripDur = (d, vmax, a = 1.2) => (d > (vmax * vmax) / a ? d / vmax + vmax / a : 2 * Math.sqrt(d / a));
  const profile = (t, d, vmax, a = 1.2) => { const dur = tripDur(d, vmax, a), vp = d > (vmax * vmax) / a ? vmax : Math.sqrt(a * d); const ta = vp / a; if (t >= dur) return [d, 0]; if (t < ta) return [0.5 * a * t * t, a * t]; if (t > dur - ta) { const r = dur - t; return [d - 0.5 * a * r * r, a * r]; } return [0.5 * a * ta * ta + vp * (t - ta), vp]; };
  const floorOfYm = (y) => (y < 0 ? 0 : y < 9 ? 1 : Math.min(50, 2 + Math.floor((y - 9) / 4)));
  function updateElev(now) {
    cars.forEach((c) => { if (c.state === "dwell") { if (now - c.t0 > c.dwell) { c.k = (c.k + 1) % c.s.floors.length; c.from = c.y; c.to = Math.min(c.s.y1 - 3, Math.max(c.s.y0, c.s.floors[c.k])); if (Math.abs(c.to - c.from) < 1) { c.t0 = now; c.dwell = 1.5; } else { c.state = "move"; c.t0 = now; c.dur = tripDur(Math.abs(c.to - c.from), c.s.vmax); } } c.v = 0; }
      else { const t = now - c.t0, d = Math.abs(c.to - c.from), [s, v] = profile(t, d, c.s.vmax); c.y = c.from + Math.sign(c.to - c.from) * s; c.v = v; if (t >= c.dur) { c.state = "dwell"; c.t0 = now; c.dwell = 4.5; c.y = c.to; c.v = 0; } }
      c.car.position.set(c.s.x, c.y + 1.2, c.s.z); const cwY = c.s.y0 + (c.s.y1 - c.s.y0) - (c.y - c.s.y0) - 3; c.cw.position.set(c.s.x + 0.95, Math.min(c.s.y1 - 2, Math.max(c.s.y0 + 1, cwY)), c.s.z + 0.55);
      const top = c.s.y1, p = c.rope.geometry.attributes.position; p.setXYZ(0, c.s.x, c.y + 2.4, c.s.z); p.setXYZ(1, c.s.x, top, c.s.z); p.needsUpdate = true; c.floor = floorOfYm(c.y); });
  }
  API.dyn = () => cars.map((c) => ({ pos: V(c.s.x, c.y + 3, c.s.z), text: `${c.s.name} · ${c.v.toFixed(1)} m/s · floor ${c.floor <= 0 ? "B" : c.floor}`, color: "#" + c.s.col.toString(16).padStart(6, "0") }));
  API.elevInfo = shaftDefs.map((s) => ({ name: s.name, vmax: s.vmax, time: Math.round(tripDur(201, s.vmax) * 10) / 10 }));

  // ================================================================ underground parking (3 levels)
  const BX0 = -95, BX1 = 105, BZ0 = -102, BZ1 = 72, LV = [-3.6, -7.2, -10.8], HT = 3.6;
  const concreteP = std(0x8d9096, 0.95, 0, { transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });
  LV.forEach((y, i) => { box(PARK, BX1 - BX0, 0.4, BZ1 - BZ0, concreteP, (BX0 + BX1) / 2, y - 0.4, (BZ0 + BZ1) / 2); const t = canvasTex(256, 64, (g, w, h) => { g.fillStyle = "rgba(0,0,0,0)"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.font = "bold 44px sans-serif"; g.textAlign = "center"; g.fillText(`LEVEL B${i + 1}`, w / 2, 48); }); const lab = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide })); lab.rotation.x = -Math.PI / 2; lab.position.set(-70, y + 0.05, -2); PARK.add(lab); });
  box(PARK, BX1 - BX0 + 2, 0.4, BZ1 - BZ0 + 2, std(0x6b6e74, 0.95, 0, { transparent: true, opacity: 0.18, depthWrite: false }), (BX0 + BX1) / 2, -0.05, (BZ0 + BZ1) / 2);
  // columns on an 8.4 m grid (instanced) + perimeter wall outline
  { const pts = []; for (let x = BX0 + 4.2; x < BX1; x += 8.4) for (let z = BZ0 + 4.2; z < BZ1; z += 8.4) if (!(Math.abs(x) < 18 && Math.abs(z) < 18)) pts.push([x, z]); const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, HT, 0.7), std(0xa9acb2, 0.9), pts.length * 3), m = new THREE.Matrix4(); let n = 0; LV.forEach((y) => pts.forEach(([x, z]) => { m.makeTranslation(x, y + HT / 2 - 0.4, z); inst.setMatrixAt(n++, m); })); PARK.add(inst); PARK.userData.cols = inst; }
  // bays + parked cars (instanced)
  const aisles = [-74, -26, 22], rowsZ = []; aisles.forEach((a) => { rowsZ.push([a - 5.5, a - 1.7]); rowsZ.push([a + 5.5, a + 1.7]); });
  const bayLines = [], carSpots = [];
  LV.forEach((y, li) => rowsZ.forEach(([zr, za]) => { for (let x = BX0 + 6; x < 80; x += 2.6) { const z0 = zr - Math.sign(za - zr) * 0, d = Math.sign(za - zr) * 2.6; bayLines.push(x, y + 0.02, zr - d * 0.0 - Math.sign(za - zr) * 2.6, x, y + 0.02, zr + Math.sign(za - zr) * 2.6); if (rnd() < 0.58) carSpots.push([x + 1.3, y, zr]); } }));
  PARK.add(lines(bayLines, 0xf5f5f0));
  { const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 0.9, 4.3), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.6 }), carSpots.length), cab = new THREE.InstancedMesh(new THREE.BoxGeometry(1.55, 0.5, 2.2), glassM, carSpots.length), m = new THREE.Matrix4(); carSpots.forEach(([x, y, z], i) => { m.makeTranslation(x, y + 0.65, z); body.setMatrixAt(i, m); body.setColorAt(i, new THREE.Color(carBodyMats[i % carBodyMats.length])); m.makeTranslation(x, y + 1.35, z); cab.setMatrixAt(i, m); }); PARK.add(body, cab); PARK.userData.cars = [body, cab]; }
  // ramp slab, core + lift lobby
  { const rp = rampPts.slice(3); const pos = rp.map((p) => p.clone()); const rcurve = new THREE.CatmullRomCurve3(rp, false, "catmullrom", 0.2); PARK.add(ribbon(rcurve, 8, std(0x30343b, 0.9))); API.parkRamp = rcurve; }
  box(PARK, 30, 3.0, 30, std(0x9aa0a8, 0.8, 0, { transparent: true, opacity: 0.25, depthWrite: false }), 0, -3.5, 0);
  // ventilation: supply (blue) + exhaust (orange) shafts, duct runs, jet fans
  const supplyM = std(0x2f9bff, 0.5, 0.2, { transparent: true, opacity: 0.8 }), exhM = std(0xff8a2a, 0.5, 0.2, { transparent: true, opacity: 0.8 }), ductS = std(0x6aa9e8, 0.5, 0.3, { transparent: true, opacity: 0.55 }), ductE = std(0xe69a5a, 0.5, 0.3, { transparent: true, opacity: 0.55 });
  const AIR = new THREE.Group(); PARK.add(AIR); const FIRE = new THREE.Group(); PARK.add(FIRE);
  const supply = [[-60, -97], [40, -97], [-60, 67], [40, 67]], exhaust = [[-92, -45], [-92, 25], [102, 30], [102, 62]];
  supply.forEach(([x, z]) => { box(AIR, 3.2, 3.8 + 11, 3.2, supplyM, x, -11, z); for (let k = 0; k < 6; k++) box(AIR, 3.4, 0.08, 3.4, std(0xdfe9f5, 0.5), x, 2.2 + k * 0.28, z); });
  exhaust.forEach(([x, z]) => { box(AIR, 3.2, 3.8 + 11, 3.2, exhM, x, -11, z); cyl(AIR, 1.4, 1.4, 0.4, std(0x44484f, 0.6, 0.6), x, 3.8, z, 24); for (let k = 0; k < 4; k++) { const b = box(AIR, 3.0, 0.1, 0.25, std(0x2b2f36, 0.5, 0.6), x, 3.9, z - 0.8 + k * 0.55); b.rotation.y = 0; } });
  const dotsAir = (pts, col, dir, size = 0.16) => flow(AIR, pts, col, dir, 1.4, 0, size);
  LV.forEach((y, li) => aisles.forEach((za, ai) => { const yy = y + 2.9; box(AIR, 168, 0.55, 1.1, ductS, -8, yy - 0.3, za - 1.8); box(AIR, 168, 0.55, 1.1, ductE, -8, yy - 0.3, za + 1.8);
    const sx = supply[(ai + li) % supply.length], ex = exhaust[(ai + li) % exhaust.length];
    dotsAir([[sx[0], 2.5, sx[1]], [sx[0], yy, sx[1]], [sx[0], yy, za - 1.8], [78, yy, za - 1.8]], 0x39b3ff, 1); dotsAir([[78, yy, za + 1.8], [-90, yy, za + 1.8], [-90, yy, ex[1]], [ex[0], 6, ex[1]]], 0xff9a3a, 1);
    for (let jx = -70; jx < 70; jx += 38) { const jf = cyl(AIR, 0.28, 0.28, 1.6, std(0x30343b, 0.5, 0.7), jx, yy - 0.8, za, 16); jf.rotation.z = Math.PI / 2; jf.position.y = yy - 0.55; } }));
  // fresh-air arrows (outside)
  const arrows = [];
  supply.forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(2, 5, 16), new THREE.MeshBasicMaterial({ color: 0x39b3ff, transparent: true, opacity: 0.8 })); c.rotation.x = Math.PI; c.position.set(x, 8, z); AIR.add(c); arrows.push({ c, base: 8, dir: -1 }); });
  exhaust.forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(2, 5, 16), new THREE.MeshBasicMaterial({ color: 0xff9a3a, transparent: true, opacity: 0.8 })); c.position.set(x, 10, z); AIR.add(c); arrows.push({ c, base: 10, dir: 1 }); flow(AIR, [[x, 4, z], [x, 18, z]], 0x888888, 1, 1.5, 6, 0.3); });
  // CO sensors (green LED) on columns, smoke/heat detectors, sprinklers, alarms (fire group)
  const sensors = [], coM = new THREE.MeshStandardMaterial({ color: 0x35ff7a, emissive: 0x35ff7a, emissiveIntensity: 1.4 });
  { const coPos = []; LV.forEach((y) => { for (let x = BX0 + 12.6; x < 80; x += 25.2) for (const z of [-50, 0, 46]) { coPos.push([x, y + 1.6, z]); } }); const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.3, 0.12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x35ff7a, emissiveIntensity: 1.2 }), coPos.length), m = new THREE.Matrix4(); coPos.forEach((p, i) => { m.makeTranslation(...p); inst.setMatrixAt(i, m); }); FIRE.add(inst); API.coInst = inst; API.coPos = coPos; }
  { const sp = [], dt = []; LV.forEach((y) => { for (let x = BX0 + 3; x < 80; x += 6) for (const za of aisles) for (const dz of [-3, 3]) sp.push([x, y + 3.3, za + dz]); for (let x = BX0 + 8; x < 80; x += 16) for (const za of aisles) dt.push([x, y + 3.45, za]); }); const si = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 6), std(0xd8232a, 0.4), sp.length), m = new THREE.Matrix4(); sp.forEach((p, i) => { m.makeTranslation(...p); si.setMatrixAt(i, m); }); FIRE.add(si); API.sprinklers = sp;
    const di = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12), std(0xf6f6f6, 0.4), dt.length); dt.forEach((p, i) => { m.makeTranslation(...p); di.setMatrixAt(i, m); }); FIRE.add(di);
    const pos = []; LV.forEach((y) => aisles.forEach((za) => { for (const dz of [-3, 3]) pos.push(BX0 + 3, y + 3.4, za + dz, 78, y + 3.4, za + dz); pos.push(BX0 + 3, y + 3.5, za - 3, BX0 + 3, y + 3.5, za + 3); })); FIRE.add(lines(pos, 0xe5242b)); }
  { const red = std(0xd8232a, 0.4, 0, { emissive: 0x7a0c10, emissiveIntensity: 0.4 }); LV.forEach((y, li) => { box(FIRE, 0.5, 0.7, 0.2, red, 17, y + 1.2, 10); box(FIRE, 0.7, 0.9, 0.3, red, -17, y + 1.0, -10); for (const x of [-60, 20, 60]) { const s = cyl(FIRE, 0.1, 0.1, 0.06, std(0xffffff, 0.3, 0, { emissive: 0xff3b2f, emissiveIntensity: 0.15 }), x, y + 3.35, 4, 16); sensors.push(s); } box(FIRE, 4.2, 2.6, 0.25, red, 0, y + 0.05, 15.2); }); }
  // car-park fire demo
  const FP = V(-18, -7.2, 22 + 5.5), demo = { on: false, t0: 0 };
  const fN = 120, fPos = new Float32Array(fN * 3), fGeo = new THREE.BufferGeometry(); fGeo.setAttribute("position", new THREE.BufferAttribute(fPos, 3));
  const flameTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const flame = new THREE.Points(fGeo, new THREE.PointsMaterial({ map: flameTex, color: 0xff7a1f, size: 1.1, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); flame.visible = false; FIRE.add(flame);
  const sN = 140, sPos = new Float32Array(sN * 3), sGeo = new THREE.BufferGeometry(); sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3)); const smoke = new THREE.Points(sGeo, new THREE.PointsMaterial({ map: flameTex, color: 0x4a4a4a, size: 3.2, transparent: true, opacity: 0.45, depthWrite: false })); smoke.visible = false; FIRE.add(smoke);
  const wN = 150, wPos = new Float32Array(wN * 3), wVel = new Float32Array(wN * 3), wLife = new Float32Array(wN).map(() => Math.random()), wGeo = new THREE.BufferGeometry(); wGeo.setAttribute("position", new THREE.BufferAttribute(wPos, 3)); const water = new THREE.Points(wGeo, new THREE.PointsMaterial({ color: 0x8fd6ff, size: 0.16, transparent: true, depthWrite: false })); water.visible = false; FIRE.add(water);
  const demoHeads = []; const nearest = API.sprinklers.filter((p) => Math.abs(p[1] - (-7.2 + 3.3)) < 0.1).map((p) => ({ p, d: Math.hypot(p[0] - FP.x, p[2] - FP.z) })).sort((a, b) => a.d - b.d).slice(0, 5).map((o) => o.p);
  const PSTEPS = [[0, "1  A car catches fire on level B2: smoke and heat rise to the ceiling"], [2.5, "2  CO / smoke sensors and the heat detector trip and signal the fire panel"], [4.5, "3  Alarm and strobes start; jet fans switch to push the smoke toward the exhaust shafts"], [6.5, "4  The nearest sprinkler heads open and cool the fire; the fire brigade is called"], [9, "5  Smoke is drawn out at the roof exhaust fans; fresh air enters at the low-level supply shafts"]];
  API.startParkDemo = () => { demo.on = true; demo.t0 = performance.now() / 1000; flame.visible = true; };
  API.stopParkDemo = () => { demo.on = false; flame.visible = false; smoke.visible = false; water.visible = false; sensors.forEach((s) => (s.material.emissiveIntensity = 0.15)); };
  API.parkDemoOn = () => demo.on; API.parkFirePoint = FP;
  function updateDemo(now, t) {
    if (!demo.on) return null; const e = now - demo.t0;
    for (let i = 0; i < fN; i++) { const p = (i / fN + t * 0.9) % 1; fPos[i * 3] = FP.x + Math.sin(i * 7.1 + t * 3) * 0.9 * (1 - p); fPos[i * 3 + 1] = FP.y + 0.9 + p * 2.2; fPos[i * 3 + 2] = FP.z + Math.cos(i * 5.3 + t * 2.4) * 0.6 * (1 - p); } fGeo.attributes.position.needsUpdate = true;
    smoke.visible = e > 0.5; const sp = Math.min(1, e / 7); for (let i = 0; i < sN; i++) { const p = (i / sN + t * 0.04) % 1; sPos[i * 3] = FP.x + (p - 0.5) * 36 * sp + Math.sin(i) * 1.5; sPos[i * 3 + 1] = -7.2 + 2.6 + Math.sin(i * 3.1) * 0.5; sPos[i * 3 + 2] = FP.z + Math.cos(i * 1.7) * 9 * sp; } sGeo.attributes.position.needsUpdate = true;
    const det = e > 2.5, strobe = e > 4.5, spr = e > 6.5; sensors.forEach((s) => { s.material.emissiveIntensity = strobe ? (Math.floor(t * 6) % 2 ? 3 : 0.1) : 0.15; });
    water.visible = spr; if (spr) for (let i = 0; i < wN; i++) { const h = nearest[Math.floor(i / 30)]; wLife[i] += 0.016 * 0.9; if (wLife[i] >= 1) { wLife[i] = 0; wPos[i * 3] = h[0]; wPos[i * 3 + 1] = h[1]; wPos[i * 3 + 2] = h[2]; const a = Math.random() * 6.283, s = 0.8 + Math.random() * 1.8; wVel[i * 3] = Math.cos(a) * s; wVel[i * 3 + 1] = -0.3; wVel[i * 3 + 2] = Math.sin(a) * s; } wVel[i * 3 + 1] -= 9.8 * 0.016; wPos[i * 3] += wVel[i * 3] * 0.016; wPos[i * 3 + 1] = Math.max(-10.7, wPos[i * 3 + 1] + wVel[i * 3 + 1] * 0.016); wPos[i * 3 + 2] += wVel[i * 3 + 2] * 0.016; } wGeo.attributes.position.needsUpdate = true;
    API.coInst.material.emissive.set(det ? (Math.floor(t * 4) % 2 ? 0xff2020 : 0x330000) : 0x35ff7a);
    let msg = PSTEPS[0][1]; PSTEPS.forEach(([s, m]) => { if (e >= s) msg = m; }); return msg;
  }
  API.air = AIR; API.fire = FIRE;

  // ================================================================ glass pool on the floor-50 terrace
  const PX0 = 15.0, PX1 = 24.0, PZ0 = 21.4, PZ1 = 24.0, PY0 = 0.3, WD = 1.2, GH = 1.4;   // length 9 m, width 2.6 m, water depth 1.2 m
  const poolGlass = new THREE.MeshPhysicalMaterial({ color: 0xcfeee8, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, transmission: 0 });
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x3fc0d8, roughness: 0.05, transparent: true, opacity: 0.62, emissive: 0x00b7d4, emissiveIntensity: 0, depthWrite: false });
  const concreteM = std(0xb8b6b0, 0.9), tile = std(0x9fe3ea, 0.3, 0.1, { emissive: 0x0aa5bd, emissiveIntensity: 0 });
  const cx = (PX0 + PX1) / 2, cz = (PZ0 + PZ1) / 2, L = PX1 - PX0, Wd = PZ1 - PZ0;
  box(POOLG, L + 0.8, 0.3, Wd + 0.8, concreteM, cx, 0.0, cz);                              // pool base slab
  box(POOLG, L - 0.1, 0.02, Wd - 0.1, tile, cx, PY0 + 0.0, cz);                              // glass-tile floor
  const water3 = box(POOLG, L, WD, Wd, waterMat, cx, PY0 + 0.02, cz); water3.renderOrder = 2;
  for (const [x, z, w, d] of [[cx, PZ0, L, 0.06], [PX0, cz, 0.06, Wd], [PX1, cz, 0.06, Wd]]) box(POOLG, w, GH - PY0 + 0.1, d, poolGlass, x, PY0, z);   // three glass walls
  const edge = box(POOLG, L, GH - 0.15, 0.04, poolGlass, cx, PY0, PZ1); const spill = box(POOLG, L, 0.14, 0.4, concreteM, cx, PY0 - 0.1, PZ1 + 0.28);   // infinity side: low glass + spill channel
  box(POOLG, L + 0.4, 0.06, 0.12, std(0xc9a25a, 0.3, 1), cx, GH + 0.05, PZ0 - 0.04);
  const poolLights = [], pls = [];
  for (const x of [16.5, 19.5, 22.5]) for (const z of [PZ0 + 0.15, PZ1 - 0.15]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0x7ff3ff })); b.position.set(x, PY0 + 0.1, z); POOLG.add(b); pls.push(b); }
  for (const x of [17.2, 21.8]) { const p = new THREE.PointLight(0x35d9ff, 0, 7, 2); p.position.set(x, PY0 + 0.5, cz); POOLG.add(p); poolLights.push(p); }
  API.setPoolNight = (k) => { waterMat.emissiveIntensity = 0.9 * k; tile.emissiveIntensity = 0.8 * k; waterMat.opacity = 0.62 + 0.12 * k; poolLights.forEach((p) => (p.intensity = 26 * k)); pls.forEach((b) => (b.visible = k > 0.2)); };
  // pool systems: structure, plant, pipework
  const SYS = new THREE.Group(); POOLG.add(SYS); API.poolSys = SYS; SYS.visible = false;
  { const beam = std(0x9a9ea5, 0.9, 0, { transparent: true, opacity: 0.7 }); box(SYS, L + 0.8, 0.3, Wd + 0.8, beam, cx, 0.0, cz).material = std(0xb8b6b0, 0.9, 0, { transparent: true, opacity: 0.55 });
    for (const z of [PZ0 - 0.2, PZ1 + 0.2]) box(SYS, L + 0.8, 0.5, 0.5, beam, cx, -0.4, z); for (const x of [PX0 - 0.2, cx, PX1 + 0.2]) box(SYS, 0.5, 0.5, Wd + 0.8, beam, x, -0.4, cz);   // support beams under the slab
    const rb = []; for (let x = PX0 - 0.3; x <= PX1 + 0.3; x += 0.25) rb.push(x, 0.08, PZ0 - 0.35, x, 0.08, PZ1 + 0.35); for (let z = PZ0 - 0.35; z <= PZ1 + 0.35; z += 0.25) rb.push(PX0 - 0.35, 0.16, z, PX1 + 0.35, 0.16, z); SYS.add(lines(rb, 0xff7a2a));
    const cab = std(0x7a5a3a, 0.7, 0, { transparent: true, opacity: 0.25 }); box(SYS, 2.6, 1.7, 3.0, cab, 26.5, 0.0, 22.7);
    const steel = std(0xc9ced4, 0.3, 0.9), blue = std(0x2f86ff, 0.4, 0.2), red = std(0xff3b30, 0.4, 0.2), grey = std(0x6a6f76, 0.6, 0.5);
    const bal = cyl(SYS, 0.55, 0.55, 1.5, steel, 26.6, -0.9, 23.6, 24); bal.rotation.x = 0;   // balance tank (below deck level)
    cyl(SYS, 0.3, 0.3, 1.2, grey, 26.0, 0.05, 21.8, 20); cyl(SYS, 0.3, 0.3, 1.0, std(0x3a7bd5, 0.4, 0.4), 27.0, 0.05, 21.8, 20);   // pumps
    cyl(SYS, 0.45, 0.45, 1.4, std(0xd9a441, 0.5, 0.2), 26.2, 0.05, 23.2, 24); cyl(SYS, 0.45, 0.45, 1.4, std(0xd9a441, 0.5, 0.2), 27.2, 0.05, 23.2, 24);   // filters
    box(SYS, 0.9, 0.7, 0.5, red, 25.6, 0.05, 24.0); box(SYS, 0.45, 0.9, 0.3, std(0x7a46d6, 0.4, 0.2), 26.9, 0.05, 24.2); cyl(SYS, 0.18, 0.18, 0.5, std(0x35ff7a, 0.3, 0.2), 25.5, 0.05, 22.2, 12); // heat-pump, UV unit, dosing
    const pipeM = (c) => std(c, 0.4, 0.3);
    const dr = [[cx, PY0, cz], [cx, -0.3, cz], [25.5, -0.3, cz], [26.6, -0.3, 23.2], [26.6, -0.5, 23.6]];   // main drain -> balance tank
    pipe(SYS, dr, 0.07, pipeM(0x8a6a48)); flow(SYS, dr, 0xb98a5a, 1, 0.9, 6, 0.1);
    const sp = [[26.6, -0.4, 23.6], [26.6, 0.6, 23.6], [26.0, 0.8, 22.4], [26.0, 0.8, 21.8], [26.2, 1.5, 22.9], [27.2, 1.5, 22.9], [27.2, 0.3, 24.2], [26.5, 0.3, 24.4], [25.6, 0.5, 24.2], [25.2, 0.6, 22.4], [24.4, 0.6, 22.4], [24.4, PY0 + 0.55, 22.7]];   // pump -> filter -> UV -> heater -> return inlets
    pipe(SYS, sp, 0.06, pipeM(0x35b8ff)); flow(SYS, sp, 0x7fd6ff, 1, 1.1, 8, 0.09);
    const ret = [[24.4, 0.6, 22.4], [24.4, 0.6, PZ0 - 0.15], [PX0 + 1, 0.6, PZ0 - 0.15]]; pipe(SYS, ret, 0.05, pipeM(0x35b8ff)); flow(SYS, ret, 0x7fd6ff, 1, 1.0, 5, 0.08);
    for (const x of [16.5, 19.5, 22.5]) { const jt = cyl(SYS, 0.07, 0.07, 0.25, std(0x35b8ff, 0.3, 0.5), x, PY0 + 0.45, PZ0 + 0.1, 12); }
    const ovf = [[cx, PY0 - 0.05, PZ1 + 0.28], [26.0, PY0 - 0.05, PZ1 + 0.28], [26.6, -0.3, 23.9]]; pipe(SYS, ovf, 0.06, pipeM(0x4cd964)); flow(SYS, ovf, 0x9affb0, 1, 0.9, 6, 0.08);   // overflow channel -> balance tank
    pipe(SYS, [[28.0, -0.2, 22.2], [26.6, -0.2, 23.2]], 0.03, pipeM(0xffd21f)); }   // make-up water
  const L1 = (x, y, z, t, c) => ({ p: [x, y, z], t, c });
  API.poolLabels = [L1(cx, GH + 0.3, PZ0, "Glass pool: 9 × 2.6 m, water 1.2 m deep", "#7fe9ff"), L1(cx, 0.9, cz, "Water: about 28 m³ (28,000 litres)", "#7fe9ff"), L1(cx, 0.4, PZ1 + 0.4, "Infinity edge + spill channel", "#4cd964"), L1(cx, -0.1, cz + 1.0, "Concrete trough: about 12 m³", "#d0d0d0"), L1(cx, -0.5, PZ0 - 0.2, "Support beams to the core", "#d0d0d0"),
    L1(cx, 0.3, PZ0 - 0.6, "Rebar mesh in the base slab", "#ff9a5a"), L1(26.6, 1.9, 22.7, "Pool plant room", "#ffd36a"), L1(26.2, 1.6, 23.2, "Filters", "#ffd36a"), L1(26.0, 1.4, 21.8, "Circulation pumps", "#7fb4ff"), L1(26.6, -0.1, 23.6, "Balance tank", "#c9ced4"), L1(25.6, 1.0, 24.0, "Heat pump", "#ff6a5a"), L1(25.5, 0.7, 22.2, "UV + chlorine dosing", "#7aff9a"), L1(16.5, PY0 + 0.75, PZ0, "Return jets", "#7fe9ff"), L1(cx, PY0 + 0.15, cz - 0.6, "Underwater LED lights", "#bff6ff"), L1(cx, -0.15, cz, "Main drain", "#c99a6a")];
  API.poolInfo = { L, W: Wd, depth: WD, volume: L * Wd * WD, glassThk: "3 × 19 mm laminated, low-iron", concrete: 12.4, rebarT: 1.4, weightT: Math.round(L * Wd * WD + 12.4 * 2.4) };

  // ================================================================ per-frame
  const rampLen = RAMP_LEN;
  API.update = (now, dt, ctx2) => {
    const t = now; updateFlows(t); updateElev(now);
    arrows.forEach((a) => { const s = 0.8 + 0.3 * Math.sin(t * 3 + a.base); a.c.scale.set(s, 1, s); a.c.position.y = a.base + a.dir * Math.sin(t * 2) * 1.2; });
    const night = ctx2.night, on = night > 0.4; lampBulbs.forEach((b) => (b.material.emissiveIntensity = on ? 2.5 : 0)); lampM.emissiveIntensity = night > 0.35 ? 2.5 : 0; tailM.emissiveIntensity = night > 0.35 ? 1.6 : 0.1;
    // arrival car + passenger (street + lobby)
    const A = arrCar, speed = 7.5;
    if (carState.phase === 0) { carState.t += dt; if (carState.t > 1) { carState.phase = 1; carState.u = 0; } A.visible = false; }
    else if (carState.phase === 1) { A.visible = true; const stop = 0.5, remain = (stop - carState.u) * DRIVE_LEN, v = Math.min(speed, 1.2 + remain * 0.45); carState.u += (Math.max(0.6, v) * dt) / DRIVE_LEN; follow(A, drive, carState.u); if (carState.u >= stop - 0.002) { carState.phase = 2; carState.wait = 0; follow(A, drive, stop); passengerA.visible = false; startGuestCycle(); G1.person.position.set(0, 0, -36); setPath(G1, [[3.6, 0, -40.2], [1.4, 0, -33], [0, 0, -26.5], [0, 0, -23], [0, 0, -15.0]], 1.25, () => { G1.state = "wait"; G1.wait = 6.5; rec.greeting = 6.5; G1.person.rotation.y = 0; G1.then = () => { setPath(G1, [[0, 0, -15.0], ...toLiftA], 1.2, () => { liftA.target = 1; G1.state = "wait"; G1.wait = 2.2; G1.then = () => { setPath(G1, [[6.4, 0, -3.9], [6.55 * Math.cos(liftA.ang), 0, 6.55 * Math.sin(liftA.ang)]], 0.9, () => { G1.person.visible = false; G1.state = "idle"; setTimeout(() => { liftA.target = 0; }, 1500); }); }; }); }; }); } }
    else if (carState.phase === 2) { carState.wait += dt; if (carState.wait > 7) { carState.phase = 3; } }
    else if (carState.phase === 3) { carState.u += (speed * dt) / DRIVE_LEN; follow(A, drive, carState.u); if (carState.u >= 0.995) { carState.phase = 0; carState.t = -4; A.visible = false; } }
    // second car circulates later, third goes down the ramp
    car2.visible = false;
    carState.rampT += dt; const uStop = uAtZ(rampLane, -127.6), uFree = uAtZ(rampLane, -116);
    if (carState.rampPhase === 0 && carState.rampT > 4) { carState.rampPhase = 1; carState.rampU = 0; rampCar.visible = true; }
    if (carState.rampPhase === 1) { const remain = (uStop - carState.rampU) * RAMP_LEN, v = Math.min(6.0, 0.8 + remain * 0.9); carState.rampU += (Math.max(0.5, v) * dt) / RAMP_LEN; follow(rampCar, rampLane, carState.rampU); if (remain < 0.15) { carState.rampPhase = 4; carState.rampT = 0; } }
    if (carState.rampPhase === 4) { barLive.target = carState.rampT > 1.4 ? -1.45 : 0; if (carState.rampT > 2.4) carState.rampPhase = 5; }
    if (carState.rampPhase === 5) { carState.rampU += (4.5 * dt) / RAMP_LEN; follow(rampCar, rampLane, carState.rampU); if (carState.rampU > uFree) barLive.target = 0; if (carState.rampU >= 0.995) { carState.rampPhase = 2; carState.rampT = 0; rampCar.visible = false; } }
    if (carState.rampPhase === 2 && carState.rampT > 14) { carState.rampPhase = 0; carState.rampT = 0; }
    if (barrier) { barLive.ang += (barLive.target - barLive.ang) * Math.min(1, dt * 3.5); barrier.rotation.z = barLive.ang; }
    // lobby: guests + staff + lift doors
    [G1, G2, G3].forEach((p) => updateWalker(p, dt, t));
    API.lobbyClock.next2 -= dt; if (API.lobbyClock.next2 < 0 && G2.state !== "walk") { API.lobbyClock.next2 = 26; startExitCycle(); }
    rec.greeting = Math.max(0, rec.greeting - dt); staff.forEach((s, i) => { s.userData.waving = rec.greeting > 0 && i === 0; poseWalk(s, t, false); if (s.userData.waving) { s.userData.armR.rotation.z = -2.4; s.userData.armR.rotation.x = Math.sin(t * 9) * 0.35; } else { s.userData.armR.rotation.z = 0; } });
    lobbyLifts.forEach((l) => { l.open += (l.target - l.open) * Math.min(1, dt * 2.2); l.l.position.x = -0.6 - 1.15 * l.open; l.r.position.x = 0.6 + 1.15 * l.open; });
    return updateDemo(now, t);
  };
  API.resetArrival = (u0 = 0) => { carState.phase = 1; carState.u = u0; carState.wait = 0; [G1, G2, G3].forEach((p) => { p.person.visible = false; p.state = "idle"; }); lobbyLifts.forEach((l) => (l.target = 0)); };
  API.lobbyPresent = () => true; API.PSTEPS = PSTEPS;
  // journey helper: positions for the camera
  API.rampPoint = (u) => rampCurve.getPointAt(Math.min(0.999, u)); API.drivePoint = (u) => drive.getPointAt(Math.min(0.999, u));
  API.carStopped = () => carState.phase === 2;
  [STREET, PARK, ELEV, CROWD].forEach((g) => g.traverse((m) => { if (m.isMesh) { m.castShadow = false; } }));
  return API;
}
