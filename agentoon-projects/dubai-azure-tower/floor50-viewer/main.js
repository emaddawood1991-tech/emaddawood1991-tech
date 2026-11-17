import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createTower, ringPoint, TP, floorZ, topZ, floorOfY, zoneOf } from "./tower.js";
import { buildExtras } from "./extras.js";
import { BURJ_PHOTO, BURJ_CREDIT } from "./assets.js";
import { buildOffice } from "./plans_office.js";
import { buildApts, TERRACE_D } from "./plans_apts.js";
import { buildPent, PENT_TERRACE_D } from "./plans_pent.js";
import { validateFloor, validateStack, neighbourReport } from "./geomcheck.js";
import { createEngView } from "./engview.js";
import { buildBuilding, validateEngineering, SHAFT, PLANT, SYSTEMS, SUB, describeNode, describeEdge } from "./building.js";
import { getTowerFloorFootprint, makeOutline, OX as PLAN_OX, OZ as PLAN_OZ } from "./outline.js";
import { buildLift } from "./plans_lift.js";
import { createQuality, createMetrics, TIERS } from "./quality.js";
import { buildEnvironment } from "./environment.js";
import { buildLandscape } from "./landscape.js";
import { makeRig } from "./camrig.js";
import { buildWellness } from "./wellness.js";
import { buildSky } from "./sky.js";
const Q = createQuality();

// Floor 50 plan: X 0..28 (west->east), Z 0..20 (core/back wall -> Gulf-facing glass). Y up, metres.
const W = 28, D = 20, WALL_H = 3.6, CEIL_Y = 3.2, VOID_Y = 3.45;

const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: Q.antialias, preserveDrawingBuffer: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, Q.cfg.dpr));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer);
const roomEnvTex = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environment = roomEnvTex;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 30000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.minDistance = 2;
controls.maxDistance = 90;

// ---------------------------------------------------------------- textures
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const rnd = (() => { let s = 12345; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const oakTex = (r) => canvasTex(1024, 1024, (g, w, h) => {
  const rows = 8, ph = h / rows;
  for (let r0 = 0; r0 < rows; r0++) {
    let x = -rnd() * 300;
    while (x < w) {
      const len = 260 + rnd() * 340, l = 58 + rnd() * 9;
      g.fillStyle = `hsl(${28 + rnd() * 5},${38 + rnd() * 8}%,${l}%)`;
      g.fillRect(x, r0 * ph, len, ph - 1.5);
      for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(80,50,25,${0.04 + rnd() * 0.06})`; g.beginPath(); const yy = r0 * ph + rnd() * ph; g.moveTo(x, yy); g.lineTo(x + len, yy + (rnd() - .5) * 3); g.stroke(); }
      g.fillStyle = "rgba(40,25,10,.35)"; g.fillRect(x + len - 1.5, r0 * ph, 1.5, ph);
      x += len;
    }
  }
}, r);
const marbleTex = (r, base = "#ece8e1", vein = "rgba(120,115,110,") => canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 42; i++) {
    g.strokeStyle = vein + (0.05 + rnd() * 0.16) + ")"; g.lineWidth = 0.6 + rnd() * 2.4; g.beginPath();
    let x = rnd() * w, y = rnd() * h; g.moveTo(x, y);
    for (let k = 0; k < 14; k++) { x += (rnd() - 0.2) * 120; y += (rnd() - 0.5) * 120; g.lineTo(x, y); }
    g.stroke();
  }
}, r);
const artTex = (a, b, c2) => canvasTex(256, 320, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = c2; g.beginPath(); g.arc(w * .62, h * .4, w * .24, 0, 7); g.fill();
  g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(0, h * .68, w, h * .32);
});

// ---------------------------------------------------------------- materials
const std = (color, rough = 0.6, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const MAT = {
  plaster: std(0xf1ede6, 0.9), plasterWarm: std(0xe9dfd0, 0.9),
  oak: std(0xffffff, 0.5, 0, { map: oakTex([3, 2.2]) }),
  marble: std(0xffffff, 0.14, 0, { map: marbleTex([2, 2]) }),
  marbleDark: std(0xffffff, 0.16, 0, { map: marbleTex([1, 1], "#2b2a2c", "rgba(200,190,170,") }),
  slab: std(0xb9b6b0, 0.95),
  fabric: std(0xe6dccb, 1), fabricGrey: std(0x8f8b86, 1), fabricNavy: std(0x28364a, 1), fabricSage: std(0x8b9a86, 1), fabricRust: std(0xb0674a, 1),
  leather: std(0x7a4a2e, 0.5), walnut: std(0x4a2f1d, 0.45), whiteLac: std(0xf5f3ef, 0.35), black: std(0x16171a, 0.4, 0.3),
  brass: std(0xc9a25a, 0.28, 1), steel: std(0xb6bbc2, 0.3, 1), chrome: std(0xdfe4ea, 0.12, 1),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe6f5, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
  glassTint: new THREE.MeshPhysicalMaterial({ color: 0x9fc4dd, roughness: 0.02, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }),
  porcelain: std(0xfbfbfa, 0.18), leaf: std(0x3f6b3a, 0.8), leaf2: std(0x5d8a4f, 0.8), soil: std(0x3b2a1f, 1), pot: std(0xd8d2c8, 0.7),
  linen: std(0xf4f1ea, 1), linenGrey: std(0xcfcac2, 1), rug: std(0xdad2c4, 1), rugDark: std(0x4b5663, 1),
  light: new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd9a0, emissiveIntensity: 2.2, roughness: 0.4 }),
  tv: std(0x050506, 0.15, 0.6), water: new THREE.MeshStandardMaterial({ color: 0x4fa6c9, roughness: 0.05, transparent: true, opacity: 0.85 }),
  deck: std(0x8a6a4a, 0.7), concrete: std(0x9a9892, 0.95),
};
const wallMat = MAT.plaster;

// ---------------------------------------------------------------- groups
const G = { struct: new THREE.Group(), walls: new THREE.Group(), furn: new THREE.Group(), ceil: new THREE.Group(), elec: new THREE.Group(), water: new THREE.Group(), sewer: new THREE.Group(), fire: new THREE.Group(), ac: new THREE.Group() };
Object.values(G).forEach((g) => scene.add(g));

// ---------------------------------------------------------------- builders
function addTo(g, m, x, y, z, ry = 0, shadow = true) { m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = shadow; m.receiveShadow = true; g.add(m); return m; }
function rbox(g, w, h, d, r, mat, x, y, z, ry = 0) { return addTo(g, new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), mat), x, y + h / 2, z, ry); }
function box(g, w, h, d, mat, x, y, z, ry = 0, shadow = true) { return addTo(g, new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), x, y + h / 2, z, ry, shadow); }
function cyl(g, rt, rb, h, mat, x, y, z, seg = 32) { return addTo(g, new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat), x, y + h / 2, z); }
function sph(g, r, mat, x, y, z, sx = 1, sy = 1, sz = 1) { const m = addTo(g, new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat), x, y, z); m.scale.set(sx, sy, sz); return m; }
function local(g, x, z, ry) { const o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o); return o; }

// ---------------------------------------------------------------- structure: slab, terrace, floors
box(G.struct, W + 0.6, 0.4, D + 0.3, MAT.slab, W / 2, -0.4, D / 2 - 0.05);
box(G.struct, W + 0.6, 0.4, 5.2, MAT.concrete, W / 2, -0.4, D + 2.5);
const floorOak = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), MAT.oak);
function floorPatch(x1, z1, x2, z2, mat) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), mat);
  m.rotation.x = -Math.PI / 2; m.position.set((x1 + x2) / 2, 0.012 + (mat === stoneFloor ? 0.004 : 0), (z1 + z2) / 2); m.receiveShadow = true;
  const uv = m.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x2 - x1) / 4, uv.getY(i) * (z2 - z1) / 4);
  G.struct.add(m);
}
const stoneFloor = new THREE.MeshStandardMaterial({ map: marbleTex([1, 1]), roughness: 0.12 });
const oakFloor = new THREE.MeshStandardMaterial({ map: oakTex([1, 1]), roughness: 0.5 });
floorPatch(0, 0, W, D, oakFloor);
floorPatch(0, 0, 8, 6, stoneFloor); floorPatch(8, 2.2, 10, 7, stoneFloor); floorPatch(10, 0, 17, 7, stoneFloor);
floorPatch(17, 0, 28, 7, stoneFloor); floorPatch(22, 7, 28, 13, stoneFloor);
// terrace deck with pool
const deckMat = new THREE.MeshStandardMaterial({ map: oakTex([1, 1]), roughness: 0.7, color: 0xb9a58a });
{ const m = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.6, 5.2), deckMat); m.rotation.x = -Math.PI / 2; m.position.set(W / 2, 0.012, D + 2.6); m.receiveShadow = true; G.struct.add(m); }
box(G.struct, W + 0.6, 1.15, 0.05, MAT.glass, W / 2, 0, D + 5.1, 0, false); // balustrade
box(G.struct, W + 0.6, 0.05, 0.1, MAT.brass, W / 2, 1.15, D + 5.1);

// ---------------------------------------------------------------- walls
function wall(x1, z1, x2, z2, t = 0.2, doors = [], h = WALL_H) {
  const horiz = Math.abs(z1 - z2) < 1e-6, len = horiz ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
  const a = horiz ? Math.min(x1, x2) : Math.min(z1, z2);
  const seg = (s, e, y0, hh) => {
    if (e - s < 0.01 || hh < 0.01) return;
    const c = a + (s + e) / 2, l = e - s;
    if (horiz) box(G.walls, l, hh, t, wallMat, c, y0, z1); else box(G.walls, t, hh, l, wallMat, x1, y0, c);
  };
  let cur = 0;
  [...doors].sort((p, q) => p.c - q.c).forEach((d) => {
    const s = d.c - d.w / 2 - a, e = d.c + d.w / 2 - a, dh = d.h || 2.4;
    seg(cur, s, 0, h); seg(s, e, dh, h - dh); cur = e;
  });
  seg(cur, len, 0, h);
}
// exterior (core back wall, west, east); the Gulf side is a glazed curtain wall
wall(0, 0, W, 0, 0.3); wall(0, 0, 0, D, 0.3); wall(W, 0, W, D, 0.3);
// glass curtain wall with bronze mullions
box(G.struct, 11, WALL_H, 0.04, MAT.glassTint, 5.5, 0, D, 0, false); box(G.struct, 11, WALL_H, 0.04, MAT.glassTint, 22.5, 0, D, 0, false);
for (let i = 0; i <= 14; i++) box(G.struct, 0.1, WALL_H, 0.16, MAT.brass, i * 2, 0, D);
box(G.struct, W, 0.14, 0.2, MAT.brass, W / 2, 0, D); box(G.struct, W, 0.14, 0.2, MAT.brass, W / 2, WALL_H - 0.14, D);
// partitions
wall(8, 0, 8, D, 0.3, [{ c: 15, w: 1.0 }]);                 // master suite east wall
wall(0, 6, 8, 6, 0.2, [{ c: 4, w: 0.9 }]);                  // bath / walk-in
wall(0, 10, 8, 10, 0.2, [{ c: 4, w: 1.0 }]);                // walk-in / bedroom
wall(10, 0, 10, 7, 0.2, [{ c: 5, w: 0.8 }]);                // foyer / powder
wall(8, 2.2, 10, 2.2, 0.2); wall(8, 7, 10, 7, 0.2);          // riser | powder | living
wall(17, 0, 17, 7, 0.2, [{ c: 4.5, w: 2.4 }]);              // foyer / kitchen
wall(25, 0, 25, 7, 0.2, [{ c: 3.5, w: 0.9 }]);              // kitchen / laundry
wall(22, 7, 28, 7, 0.3);                                     // wet wall guest bath | laundry
wall(22, 7, 22, 20, 0.2, [{ c: 16.5, w: 1.0 }]);            // guest suite west wall
wall(22, 13, 28, 13, 0.2, [{ c: 25, w: 0.9 }]);             // ensuite | bedroom
// riser shafts (enclosed service shafts)
box(G.walls, 1.8, 0.0001, 0.0001, wallMat, 0, 0, 0, 0, false);

// ceiling (toggle)
box(G.ceil, W, 0.1, D, MAT.plaster, W / 2, CEIL_Y, D / 2, 0, true);
for (const [x, z] of [[2, 14], [6, 14], [2, 17.5], [6, 17.5], [4, 8], [2.5, 2.5], [5.5, 2.5], [9, 5], [12.5, 3.5], [15, 3.5], [11.5, 14], [15.5, 14], [19.5, 14], [12, 10.5], [16, 10.5], [19, 10.5], [19, 3.2], [21.5, 3.2], [23.6, 4], [26.7, 4], [25, 10], [25, 16.5], [27, 18.5], [14, 18], [20, 18], [9, 12], [9, 17]])
  cyl(G.ceil, 0.1, 0.1, 0.02, MAT.light, x, CEIL_Y - 0.03, z, 20);

// ---------------------------------------------------------------- lighting
scene.add(new THREE.HemisphereLight(0xdcecff, 0x8a7a66, 0.55));
const sun = new THREE.DirectionalLight(0xfff0d8, 2.6);
sun.position.set(40, 38, 70); sun.target.position.set(W / 2, 0, D / 2);
sun.castShadow = Q.cfg.shadows; sun.shadow.mapSize.set(Q.cfg.shadowMap, Q.cfg.shadowMap);
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 5, far: 160 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const pointLights = [];
const warm = (x, y, z, i = 22, d = 12) => { const p = new THREE.PointLight(0xffd3a0, i, d, 2); p.position.set(x, y, z); scene.add(p); pointLights.push({ p, base: i, x, z }); return p; };
[[14.5, 3, 15], [14.5, 3, 9.5], [4, 3, 15], [4, 3, 3], [4, 3, 8], [19.5, 3, 3.5], [25, 3, 16.5], [25, 3, 10], [13.5, 3, 3.5], [26.5, 3, 3.5]].forEach(([x, y, z]) => warm(x, y, z));

// ---------------------------------------------------------------- furniture: helpers
function plant(g, x, z, s = 1, tall = 1.6) {
  cyl(g, 0.26 * s, 0.2 * s, 0.5 * s, MAT.pot, x, 0, z, 24); cyl(g, 0.24 * s, 0.24 * s, 0.02, MAT.soil, x, 0.5 * s, z, 16);
  cyl(g, 0.02 * s, 0.03 * s, tall * s, MAT.walnut, x, 0.5 * s, z, 8);
  for (let i = 0; i < 12; i++) { const a = i * 2.4, h = (0.55 + (i / 12) * tall) * s; sph(g, 0.2 * s, i % 2 ? MAT.leaf : MAT.leaf2, x + Math.cos(a) * 0.22 * s, 0.4 * s + h, z + Math.sin(a) * 0.22 * s, 1, 0.55, 1.3).rotation.z = Math.cos(a) * 0.5; }
}
function art(g, w, h, x, y, z, ry, tex) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })); addTo(g, m, x, y, z, ry, false); box(g, w + 0.06, h + 0.06, 0.03, MAT.brass, x, y - h / 2 - 0.03, z, ry, false).translateZ(-0.02); return m; }
function chair(g, x, z, ry, fab = MAT.fabricGrey) {
  const c = local(g, x, z, ry);
  rbox(c, 0.5, 0.08, 0.48, 0.03, fab, 0, 0.44, 0);
  rbox(c, 0.5, 0.5, 0.07, 0.03, fab, 0, 0.5, -0.24).rotation.x = -0.12;
  for (const [dx, dz] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) { const l = cyl(c, 0.014, 0.02, 0.45, MAT.brass, dx, 0, dz, 10); }
}
function lamp(g, x, y, z, s = 1) { cyl(g, 0.045 * s, 0.05 * s, 0.03, MAT.brass, x, y, z, 16); cyl(g, 0.01, 0.01, 0.3 * s, MAT.brass, x, y + 0.03, z, 8); const sh = cyl(g, 0.12 * s, 0.17 * s, 0.2 * s, MAT.light, x, y + 0.3 * s, z, 20); sh.castShadow = false; }
function pillow(g, x, y, z, ry, mat, w = 0.42) { const p = rbox(g, w, w * 0.9, 0.12, 0.05, mat, x, y, z, ry); return p; }
function curtain(g, x, z, h = 3.1) { for (let i = 0; i < 8; i++) box(g, 0.1, h, 0.03, MAT.linen, x + i * 0.1, 0.02, z, 0, false).material = new THREE.MeshStandardMaterial({ color: 0xf6f2ea, roughness: 1, transparent: true, opacity: 0.55, side: THREE.DoubleSide }); }

// ---------------------------------------------------------------- furniture: living (open plan, sea facing)
{
  const g = G.furn;
  // area rug + L-shaped sofa facing the TV wall (east), view to the Gulf on the left
  rbox(g, 6.2, 0.02, 4.6, 0.01, MAT.rug, 16.2, 0.012, 15.2);
  box(g, 3.9, 0.012, 2.6, MAT.rugDark, 16.4, 0.032, 15.2, 0, false);
  const s = local(g, 15.0, 15.0, Math.PI / 2);   // sofa group: faces +X
  const SW = 3.6;
  rbox(s, SW, 0.26, 1.0, 0.06, MAT.fabricGrey, 0, 0.06, 0);                      // plinth
  for (let i = 0; i < 3; i++) rbox(s, SW / 3 - 0.04, 0.2, 0.9, 0.08, MAT.fabric, -SW / 3 + i * (SW / 3), 0.32, 0.02);   // seat cushions
  for (let i = 0; i < 3; i++) { const b = rbox(s, SW / 3 - 0.05, 0.5, 0.22, 0.09, MAT.fabric, -SW / 3 + i * (SW / 3), 0.5, -0.38); b.rotation.x = -0.14; }
  rbox(s, 0.28, 0.58, 1.0, 0.1, MAT.fabricGrey, -SW / 2 - 0.1, 0.06, 0); rbox(s, 0.28, 0.58, 1.0, 0.1, MAT.fabricGrey, SW / 2 + 0.1, 0.06, 0);
  rbox(s, 0.14, 0.9, 1.0, 0.04, MAT.fabricGrey, 0, 0.06, -0.52);
  const ch = local(g, 17.9, 17.8, Math.PI * 1.2);   // chaise return
  rbox(ch, 1.0, 0.26, 2.0, 0.06, MAT.fabricGrey, 0, 0.06, 0); rbox(ch, 0.9, 0.2, 1.9, 0.08, MAT.fabric, 0, 0.32, 0);
  pillow(g, 14.55, 0.52, 13.8, Math.PI / 2 + 0.2, MAT.fabricNavy); pillow(g, 14.55, 0.52, 16.3, Math.PI / 2 - 0.25, MAT.fabricRust); pillow(g, 14.62, 0.5, 15.0, Math.PI / 2, MAT.fabricSage, 0.5);
  // coffee tables: marble round + brass nesting
  cyl(g, 0.55, 0.55, 0.05, MAT.marble, 17.3, 0.33, 15.2, 48); cyl(g, 0.5, 0.5, 0.3, MAT.brass, 17.3, 0.02, 15.2, 40).scale.set(0.6, 1, 0.6);
  cyl(g, 0.36, 0.36, 0.04, MAT.marbleDark, 17.95, 0.22, 14.55, 40); cyl(g, 0.22, 0.22, 0.2, MAT.brass, 17.95, 0.02, 14.55, 32);
  box(g, 0.28, 0.03, 0.2, MAT.black, 17.2, 0.38, 15.1, 0.3); // books
  // armchairs (curved bouclé), side table with lamp
  for (const [x, z, ry] of [[19.2, 12.4, Math.PI * 0.85], [20.0, 13.0, Math.PI * 1.05]]) {
    const a = local(g, x, z, ry);
    rbox(a, 0.9, 0.3, 0.85, 0.12, MAT.fabricSage, 0, 0.14, 0); rbox(a, 0.78, 0.18, 0.7, 0.09, MAT.fabric, 0, 0.42, 0.04); rbox(a, 0.9, 0.55, 0.22, 0.11, MAT.fabricSage, 0, 0.44, -0.34);
    cyl(a, 0.03, 0.03, 0.14, MAT.brass, -0.3, 0, -0.3, 8); cyl(a, 0.03, 0.03, 0.14, MAT.brass, 0.3, 0, -0.3, 8);
  }
  cyl(g, 0.28, 0.28, 0.04, MAT.marble, 19.55, 0.5, 12.0, 32); cyl(g, 0.04, 0.04, 0.5, MAT.brass, 19.55, 0, 12.0, 12); lamp(g, 19.55, 0.54, 12.0, 1.1);
  // floor lamp arc
  cyl(g, 0.2, 0.22, 0.03, MAT.black, 12.0, 0, 18.3, 24); cyl(g, 0.012, 0.012, 1.9, MAT.brass, 12.0, 0.03, 18.3, 8); sph(g, 0.2, MAT.light, 12.55, 1.95, 18.3);
  // media wall: floating walnut unit + TV on the guest suite wall (x=22)
  rbox(g, 0.42, 0.45, 3.4, 0.03, MAT.walnut, 21.7, 0.35, 16.0); box(g, 0.04, 1.0, 2.0, MAT.tv, 21.86, 1.1, 16.0); box(g, 0.05, 2.7, 3.8, MAT.walnut, 21.88, 0.2, 16.0, 0, false).material = MAT.walnut;
  rbox(g, 0.3, 0.04, 3.3, 0.01, MAT.light, 21.7, 0.1, 16.0).material = new THREE.MeshStandardMaterial({ color: 0xffe3b8, emissive: 0xffc27a, emissiveIntensity: 1.6 });
  // dining: oval walnut table, 8 chairs, linear pendant
  const dx = 13.4, dz = 9.9;
  cyl(g, 1.55, 1.55, 0.05, MAT.walnut, dx, 0.72, dz, 64).scale.set(1, 1, 0.52);
  cyl(g, 0.28, 0.4, 0.72, MAT.brass, dx - 0.5, 0, dz, 24); cyl(g, 0.28, 0.4, 0.72, MAT.brass, dx + 0.5, 0, dz, 24);
  for (let i = 0; i < 4; i++) { chair(g, dx - 1.05 + i * 0.7, dz - 0.72, Math.PI, MAT.fabricNavy); chair(g, dx - 1.05 + i * 0.7, dz + 0.72, 0, MAT.fabricNavy); }
  chair(g, dx - 1.75, dz, -Math.PI / 2, MAT.leather); chair(g, dx + 1.75, dz, Math.PI / 2, MAT.leather);
  cyl(g, 0.12, 0.1, 0.22, MAT.porcelain, dx, 0.77, dz - 0.1, 20); for (let k = 0; k < 3; k++) cyl(g, 0.008, 0.008, 0.38, MAT.brass, dx + (k - 1) * 0.05, 0.99, dz - 0.1, 6);
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; sph(g, 0.1, MAT.light, dx + Math.cos(a) * 0.9, 2.2 + Math.sin(k * 1.7) * 0.25, dz + Math.sin(a) * 0.35); cyl(g, 0.004, 0.004, 1.0, MAT.brass, dx + Math.cos(a) * 0.9, 2.3 + Math.sin(k * 1.7) * 0.25, dz + Math.sin(a) * 0.35, 4); }
  cyl(g, 0.5, 0.5, 0.03, MAT.brass, dx, 3.15, dz, 32);
  // sideboard + art
  rbox(g, 2.4, 0.75, 0.45, 0.03, MAT.walnut, 12.6, 0.1, 7.4); for (const px of [11.8, 13.0]) box(g, 0.02, 0.5, 0.01, MAT.brass, px, 0.25, 7.64);
  art(g, 1.1, 1.4, 12.6, 1.95, 7.18, 0, artTex("#e8d5b5", "#b8875a", "#f4efe6"));
  art(g, 1.0, 1.3, 11.1, 1.95, 7.18, 0, artTex("#2b4a6b", "#1b2b44", "#d9b46a"));
  plant(g, 10.8, 19.2, 1.5, 2.1); plant(g, 21.2, 19.4, 1.2, 1.7); plant(g, 8.6, 12.5, 1.2, 1.6);
  curtain(g, 10.2, 19.7); curtain(g, 20.6, 19.7);
  // reading corner
  const rc = local(g, 9.6, 17.6, Math.PI * 0.4); rbox(rc, 0.85, 0.35, 0.85, 0.15, MAT.leather, 0, 0.12, 0); rbox(rc, 0.85, 0.5, 0.2, 0.1, MAT.leather, 0, 0.4, -0.35);
  // foyer: console, mirror, bench, vase
  rbox(g, 1.8, 0.8, 0.4, 0.03, MAT.marbleDark, 13.6, 0.1, 6.8); box(g, 1.7, 0.03, 0.34, MAT.brass, 13.6, 0.1, 6.8); cyl(g, 0.1, 0.07, 0.3, MAT.porcelain, 13.1, 0.9, 6.8, 20);
  { const m = new THREE.Mesh(new THREE.CircleGeometry(0.62, 48), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.03 })); addTo(g, m, 13.6, 1.75, 6.88, Math.PI, false); const r = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.025, 12, 48), MAT.brass); addTo(g, r, 13.6, 1.75, 6.86, 0, false); }
  plant(g, 16.3, 1.0, 1.0, 1.4);
  // lift doors (core)
  for (let i = 0; i < 2; i++) { box(g, 1.1, 2.3, 0.04, MAT.steel, 12.0 + i * 1.5, 0, 0.12, 0, false); }
}
// ---------------------------------------------------------------- furniture: kitchen
{
  const g = G.furn;
  // run along the back wall z=0: tall units, hob + sink
  box(g, 7.6, 0.85, 0.62, MAT.whiteLac, 21.2, 0.1, 0.45); box(g, 7.7, 0.04, 0.66, MAT.marble, 21.2, 0.95, 0.46);
  box(g, 7.6, 0.02, 0.5, MAT.walnut, 21.2, 0.0, 0.45, 0, false);
  for (let i = 0; i < 9; i++) box(g, 0.012, 0.8, 0.01, MAT.black, 17.6 + i * 0.84 + 0.0, 0.12, 0.77, 0, false);
  for (let i = 0; i < 6; i++) box(g, 0.5, 0.03, 0.01, MAT.brass, 17.9 + i * 1.25, 0.8, 0.77, 0, false);
  box(g, 7.6, 0.7, 0.34, MAT.walnut, 21.2, 1.75, 0.3); // wall cabinets
  box(g, 7.6, 0.02, 0.36, MAT.black, 21.2, 1.75, 0.3, 0, false);
  rbox(g, 0.62, 2.1, 0.7, 0.02, MAT.steel, 18.2, 0.05, 0.5); box(g, 0.01, 1.6, 0.01, MAT.black, 18.18, 0.3, 0.86, 0, false);        // fridge
  box(g, 0.9, 0.02, 0.5, MAT.black, 23.3, 0.99, 0.5); for (let i = 0; i < 4; i++) cyl(g, 0.07, 0.07, 0.02, MAT.steel, 23.0 + (i % 2) * 0.35, 1.0, 0.38 + Math.floor(i / 2) * 0.28, 24);
  rbox(g, 0.9, 0.12, 0.5, 0.02, MAT.steel, 23.3, 1.58, 0.35); cyl(g, 0.14, 0.2, 0.7, MAT.steel, 23.3, 1.7, 0.3, 4).rotation.y = Math.PI / 4;
  box(g, 0.75, 0.02, 0.42, MAT.steel, 20.5, 0.99, 0.5); cyl(g, 0.02, 0.02, 0.35, MAT.chrome, 20.5, 1.0, 0.2, 10); box(g, 0.02, 0.02, 0.2, MAT.chrome, 20.5, 1.33, 0.28);  // sink + tap
  // island with waterfall marble, stools
  box(g, 3.6, 0.9, 1.0, MAT.walnut, 20.4, 0.05, 3.9); box(g, 3.8, 0.05, 1.2, MAT.marble, 20.4, 0.95, 3.9); box(g, 0.05, 0.95, 1.2, MAT.marble, 22.3, 0.0, 3.9); box(g, 0.05, 0.95, 1.2, MAT.marble, 18.5, 0.0, 3.9);
  for (let i = 0; i < 3; i++) { const s = local(g, 19.6 + i * 0.85, 4.75, Math.PI); cyl(s, 0.19, 0.19, 0.06, MAT.leather, 0, 0.62, 0, 24); cyl(s, 0.02, 0.02, 0.62, MAT.brass, 0, 0, 0, 8); cyl(s, 0.17, 0.17, 0.02, MAT.brass, 0, 0.3, 0, 24); cyl(s, 0.22, 0.22, 0.02, MAT.brass, 0, 0, 0, 24); }
  for (let k = 0; k < 3; k++) { cyl(g, 0.012, 0.012, 1.0, MAT.brass, 19.6 + k * 0.95, 2.2, 3.9, 6); sph(g, 0.13, MAT.light, 19.6 + k * 0.95, 2.1, 3.9); }
  // fruit bowl
  cyl(g, 0.2, 0.1, 0.1, MAT.porcelain, 21.0, 1.0, 3.9, 24); for (let i = 0; i < 5; i++) sph(g, 0.065, i % 2 ? MAT.leaf2 : MAT.fabricRust, 21.0 + Math.cos(i * 1.3) * 0.08, 1.14, 3.9 + Math.sin(i * 1.3) * 0.08);
}
// ---------------------------------------------------------------- furniture: master suite
{
  const g = G.furn;
  const bx = 4.0, bz = 14.2;
  rbox(g, 3.2, 1.45, 0.16, 0.06, MAT.fabricSage, bx, 0.15, 10.35);                                   // tall headboard
  rbox(g, 2.1, 0.38, 2.3, 0.04, MAT.walnut, bx, 0.05, 11.45); rbox(g, 2.0, 0.28, 2.2, 0.1, MAT.linen, bx, 0.42, 11.5);
  rbox(g, 2.05, 0.1, 1.2, 0.05, MAT.linenGrey, bx, 0.62, 12.3);   // folded duvet
  rbox(g, 2.1, 0.04, 0.55, 0.02, MAT.fabricRust, bx, 0.66, 12.6);  // runner
  for (const k of [-0.5, 0.5]) { pillow(g, bx + k, 0.7, 10.7, 0.1 * k, MAT.linen, 0.62); pillow(g, bx + k * 0.9, 0.78, 10.85, -0.15 * k, MAT.fabricSage, 0.48); }
  pillow(g, bx, 0.72, 11.2, 0, MAT.fabricRust, 0.4);
  for (const sx of [-1, 1]) { rbox(g, 0.5, 0.5, 0.42, 0.03, MAT.walnut, bx + sx * 1.95, 0.05, 10.62); lamp(g, bx + sx * 1.95, 0.58, 10.62, 1.0); }
  rbox(g, 1.8, 0.4, 0.5, 0.06, MAT.leather, bx, 0.05, 13.0 + 0.1);   // bench
  rbox(g, 2.8, 0.025, 3.4, 0.01, MAT.rugDark, bx, 0.012, 12.8);
  rbox(g, 1.0, 0.45, 1.0, 0.1, MAT.fabricSage, 1.0, 0.05, 18.0); rbox(g, 1.0, 0.6, 0.2, 0.1, MAT.fabricSage, 1.0, 0.4, 18.4); cyl(g, 0.28, 0.28, 0.04, MAT.marble, 2.0, 0.45, 18.6, 32); cyl(g, 0.03, 0.03, 0.45, MAT.brass, 2.0, 0, 18.6, 8);
  art(g, 1.7, 0.8, bx, 2.35, 10.13, 0, artTex("#d4c3a8", "#8e7a62", "#f1ece1"));
  curtain(g, 2.0, 19.7); curtain(g, 6.0, 19.7); plant(g, 7.5, 19.3, 1.0, 1.4);
  // walk-in wardrobe
  for (const [x, z, w, d, ry] of [[0.3, 7.9, 0.6, 3.6, 0], [4.0, 6.35, 7.0, 0.5, 0]]) box(g, w, 2.4, d, MAT.walnut, x, 0.05, z, ry);
  box(g, 1.6, 0.8, 0.9, MAT.whiteLac, 3.6, 0.05, 8.1); box(g, 1.7, 0.04, 1.0, MAT.marble, 3.6, 0.85, 8.1);
}
// ---------------------------------------------------------------- master bath
{
  const g = G.furn;
  rbox(g, 3.6, 0.55, 0.62, 0.02, MAT.walnut, 3.2, 0.3, 0.45); box(g, 3.8, 0.05, 0.66, MAT.marbleDark, 3.2, 0.85, 0.47);
  for (const x of [2.3, 4.1]) { cyl(g, 0.22, 0.2, 0.09, MAT.porcelain, x, 0.9, 0.45, 32); cyl(g, 0.014, 0.014, 0.3, MAT.brass, x, 0.9, 0.13, 8); }
  for (const x of [2.3, 4.1]) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.03 })); addTo(g, m, x, 1.65, 0.17, 0, false); const r = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.015, 8, 40), MAT.brass); addTo(g, r, x, 1.65, 0.18, 0, false); }
  // WC
  rbox(g, 0.4, 0.4, 0.62, 0.15, MAT.porcelain, 6.9, 0.0, 0.7); rbox(g, 0.38, 0.55, 0.18, 0.04, MAT.porcelain, 6.9, 0.35, 0.22); cyl(g, 0.04, 0.04, 0.02, MAT.chrome, 6.9, 0.9, 0.22, 12);
  // freestanding tub
  const t = local(g, 4.9, 3.9, 0.2);
  rbox(t, 1.8, 0.58, 0.85, 0.3, MAT.porcelain, 0, 0.0, 0); rbox(t, 1.5, 0.06, 0.58, 0.2, MAT.water, 0, 0.5, 0);
  cyl(t, 0.04, 0.04, 0.9, MAT.chrome, 1.05, 0, 0.0, 12);
  // shower enclosure (west wall)
  box(g, 0.04, 2.2, 2.4, MAT.glass, 1.45, 0, 4.7, 0, false); box(g, 1.4, 0.04, 0.04, MAT.glass, 0.75, 0, 5.9, 0, false); box(g, 0.02, 0.03, 2.4, MAT.brass, 1.45, 2.2, 4.7);
  box(g, 1.4, 0.03, 2.4, MAT.marbleDark, 0.75, 0.0, 4.7, 0, false); cyl(g, 0.17, 0.17, 0.02, MAT.chrome, 0.5, 2.15, 4.4, 24);
  // towel rail, stool, plant
  for (let i = 0; i < 4; i++) cyl(g, 0.012, 0.012, 0.55, MAT.brass, 0.1 + 0.0, 0.5 + i * 0.22, 1.2, 8).rotation.x = Math.PI / 2;
  for (let i = 0; i < 2; i++) box(g, 0.45, 0.03, 0.3, MAT.linen, 6.0 + i * 0.6, 0.5, 2.8 - 0.0, 0, false);
}
// ---------------------------------------------------------------- powder room + guest suite + laundry
{
  const g = G.furn;
  rbox(g, 0.38, 0.4, 0.58, 0.15, MAT.porcelain, 9.0, 0.0, 2.65); rbox(g, 0.36, 0.5, 0.16, 0.04, MAT.porcelain, 9.0, 0.35, 2.32);
  rbox(g, 0.7, 0.14, 0.4, 0.05, MAT.porcelain, 9.0, 0.88, 6.75); rbox(g, 0.62, 0.7, 0.3, 0.03, MAT.walnut, 9.0, 0.15, 6.78);
  // guest bedroom
  rbox(g, 1.6, 0.36, 2.1, 0.04, MAT.walnut, 25.0, 0.05, 17.8); rbox(g, 1.5, 0.26, 2.0, 0.1, MAT.linen, 25.0, 0.4, 17.8); rbox(g, 1.6, 0.9, 0.12, 0.05, MAT.fabricNavy, 25.0, 0.1, 18.9);
  for (const k of [-0.38, 0.38]) pillow(g, 25.0 + k, 0.7, 18.7, 0, MAT.linen, 0.5);
  rbox(g, 1.5, 0.12, 1.0, 0.05, MAT.fabricRust, 25.0, 0.62, 17.3);
  rbox(g, 0.45, 0.45, 0.4, 0.03, MAT.walnut, 23.6, 0.05, 18.7); lamp(g, 23.6, 0.5, 18.7, 0.9); rbox(g, 0.45, 0.45, 0.4, 0.03, MAT.walnut, 26.4, 0.05, 18.7); lamp(g, 26.4, 0.5, 18.7, 0.9);
  box(g, 0.6, 2.4, 3.0, MAT.walnut, 27.65, 0.05, 15.2); curtain(g, 24.5, 19.7); plant(g, 22.7, 19.3, 0.9, 1.3);
  // guest ensuite
  rbox(g, 0.4, 0.4, 0.6, 0.15, MAT.porcelain, 27.2, 0.0, 7.6); rbox(g, 0.38, 0.55, 0.18, 0.04, MAT.porcelain, 27.2, 0.35, 7.25);
  rbox(g, 1.0, 0.12, 0.45, 0.05, MAT.porcelain, 24.0, 0.86, 7.3); rbox(g, 0.9, 0.6, 0.36, 0.03, MAT.walnut, 24.0, 0.2, 7.32);
  box(g, 0.04, 2.2, 1.7, MAT.glass, 23.9, 0, 12.1, 0, false); box(g, 1.6, 0.04, 0.04, MAT.glass, 23.0, 0, 11.4, 0, false);
  // laundry
  rbox(g, 0.62, 0.85, 0.62, 0.03, MAT.whiteLac, 25.8, 0, 0.5); cyl(g, 0.22, 0.22, 0.02, MAT.tv, 25.8, 0.55, 0.82, 24).rotation.x = Math.PI / 2;
  rbox(g, 0.62, 0.85, 0.62, 0.03, MAT.whiteLac, 25.8, 0, 1.3);
  cyl(g, 0.32, 0.32, 1.4, MAT.steel, 27.1, 0, 2.7, 32);      // hot-water cylinder
  rbox(g, 0.7, 0.5, 0.5, 0.03, MAT.porcelain, 27.55, 0.5, 5.7);
}
// ---------------------------------------------------------------- terrace: loungers, plants
{
  const g = G.furn;
  for (const x of [6, 8.2, 10.4]) { rbox(g, 0.8, 0.12, 2.0, 0.05, MAT.linen, x, 0.35, D + 2.2); box(g, 0.05, 0.35, 0.05, MAT.brass, x - 0.35, 0, D + 1.4, 0, false); box(g, 0.05, 0.35, 0.05, MAT.brass, x + 0.35, 0, D + 3.0, 0, false); rbox(g, 0.8, 0.12, 0.6, 0.05, MAT.linen, x, 0.55, D + 1.45).rotation.x = -0.5; }
  plant(g, 2, D + 4.4, 1.3, 1.8); plant(g, 27, D + 4.4, 1.3, 1.8);
  const t = local(g, 13.5, D + 3.1, 0); cyl(t, 0.5, 0.5, 0.04, MAT.marbleDark, 0, 0.5, 0, 32); cyl(t, 0.05, 0.05, 0.5, MAT.brass, 0, 0, 0, 10); for (const a of [0, 2.1, 4.2]) chair(t, Math.cos(a) * 0.9, Math.sin(a) * 0.9, -a - Math.PI / 2, MAT.fabricSage);
}

// ---------------------------------------------------------------- rooms, per-room lights
const ROOMS = { living: "Living + dining", kitchen: "Kitchen", foyer: "Foyer", master: "Master bedroom", mbath: "Master bath + walk-in", guest: "Guest suite", service: "Laundry + powder", terrace: "Terrace" };
function roomOf(x, z) {
  if (z > D) return "terrace";
  if (x < 8) return z >= 10 ? "master" : "mbath";
  if (x < 10 && z < 7.2) return "service";
  if (x >= 25 && z < 7) return "service";
  if (z < 7 && x < 17) return "foyer";
  if (z < 7) return "kitchen";
  if (x >= 22) return "guest";
  return "living";
}
const LM = {}, roomLights = {};
Object.keys(ROOMS).forEach((k) => { LM[k] = MAT.light.clone(); roomLights[k] = []; });
[G.furn, G.ceil].forEach((g) => g.traverse((m) => { if (m.isMesh && m.material === MAT.light) { const p = new THREE.Vector3(); m.getWorldPosition(p); m.material = LM[roomOf(p.x, p.z)]; } }));
pointLights.forEach((o) => roomLights[roomOf(o.x, o.z)].push(o));

// ---------------------------------------------------------------- doors (click a door to open / close it)
const doorMat = std(0xf3efe8, 0.45), doorBrass = MAT.brass.clone();
const doors = [], doorMeshes = [];
function door(axis, fixed, c, w, swing, name) {
  const pivot = new THREE.Group(); const leaf = new THREE.Mesh(new THREE.BoxGeometry(axis === "x" ? w - 0.04 : 0.045, 2.1, axis === "x" ? 0.045 : w - 0.04), doorMat);
  leaf.castShadow = true; leaf.receiveShadow = true;
  const h = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 10), doorBrass); h.rotation.z = Math.PI / 2;
  if (axis === "x") { pivot.position.set(c - w / 2 + 0.02, 0, fixed); leaf.position.set(w / 2 - 0.02, 1.05, 0); h.position.set(w - 0.15, 1.0, 0.045); h.rotation.set(Math.PI / 2, 0, 0); }
  else { pivot.position.set(fixed, 0, c - w / 2 + 0.02); leaf.position.set(0, 1.05, w / 2 - 0.02); h.position.set(0.045, 1.0, w - 0.15); h.rotation.set(0, 0, Math.PI / 2); }
  pivot.add(leaf, h); G.walls.add(pivot);
  const d = { pivot, cur: 0, target: 0, dir: swing * Math.PI * 0.5 * 0.94, name }; doors.push(d); leaf.userData.door = d; h.userData.door = d; doorMeshes.push(leaf, h);
  return d;
}
door("z", 8, 15, 1.0, -1, "Master bedroom door"); door("x", 10, 4, 1.0, 1, "Walk-in door"); door("x", 6, 4, 0.9, 1, "Master bath door");
door("z", 10, 5, 0.8, -1, "Powder room door"); door("z", 25, 3.5, 0.9, 1, "Laundry door"); door("z", 22, 16.5, 1.0, 1, "Guest suite door"); door("x", 13, 25, 0.9, 1, "Ensuite door");
// terrace sliding doors in the glass wall (x 11..17)
const slide = [];
{
  const gm = MAT.glassTint.clone(); const frame = MAT.brass.clone();
  for (const [x0, zOff, run] of [[12.5, 0.07, 3.0], [15.5, -0.07, 0.0]]) {
    const gp = new THREE.Group(); const gl = new THREE.Mesh(new THREE.BoxGeometry(2.9, 3.4, 0.03), gm); gl.position.y = 1.7; gp.add(gl);
    for (const [px, py, sx, sy] of [[-1.45, 1.7, 0.06, 3.4], [1.45, 1.7, 0.06, 3.4], [0, 0.03, 2.9, 0.06], [0, 3.37, 2.9, 0.06]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, 0.06), frame); f.position.set(px, py, 0); gp.add(f); }
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.04), frame); hd.position.set(x0 < 14 ? 1.3 : -1.3, 1.1, 0.06); gp.add(hd);
    gp.position.set(x0, 0, D + zOff); G.struct.add(gp); slide.push({ gp, x0, run, cur: 0 }); gl.userData.slide = true; doorMeshes.push(gl);
  }
}
let slideTarget = 0;
const toggleSlide = () => { slideTarget = slideTarget ? 0 : 1; };
function updateDoors() { doors.forEach((d) => { d.cur += (d.target - d.cur) * 0.12; d.pivot.rotation.y = d.cur * d.dir; }); slide.forEach((s) => { s.cur += (slideTarget - s.cur) * 0.1; s.gp.position.x = s.x0 + s.run * s.cur; }); }

// ---------------------------------------------------------------- outside: Dubai coast near the Burj Al Arab, sky, sun, moon
const GROUND = -201;   // street level is 201 m below floor 50
const OUT = new THREE.Group(); scene.add(OUT);
const skyUniforms = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sun: { value: new THREE.Vector3(0, 1, 0) }, glow: { value: new THREE.Color() }, glowK: { value: 0 }, cloud: { value: new THREE.Color(0xffffff) }, cloudK: { value: 0.3 }, t: { value: 0 } };
const dome = new THREE.Mesh(new THREE.SphereGeometry(14000, 32, 20), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUniforms,
  vertexShader: "varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
  fragmentShader: "uniform vec3 top,hor,bot,glow,sun,cloud; uniform float glowK,cloudK,t; varying vec3 vd; float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); } float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); } float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*vn(p); p*=2.03; a*=0.5; } return s; } void main(){ float y = vd.y; vec3 c = y > 0.0 ? mix(hor, top, pow(y, 0.5)) : mix(hor, bot, pow(-y, 0.4)); float s = max(dot(normalize(vd), normalize(sun)), 0.0); c += glow * (pow(s, 6.0) * 0.55 + pow(s, 60.0) * 0.6) * glowK; if (y > 0.0) { vec2 cu = vd.xz / (y + 0.22) * 1.3 + vec2(t * 0.004, t * 0.0015); float n = fbm(cu); float cl = smoothstep(0.5, 0.82, n) * smoothstep(0.0, 0.22, y) * cloudK; c = mix(c, cloud * (0.85 + 0.35 * pow(s, 3.0)), cl); } gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}" }));
dome.renderOrder = -10; scene.add(dome);
// image-based lighting from the actual sky (tower/exterior views): glass and metal reflect the real time-of-day sky
const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(dome.geometry, dome.material));
let skyEnvRT = null, skyEnvKey = "";
function refreshSkyEnv(force) {
  if (state.mode !== "tower") { scene.environment = roomEnvTex; return; }
  const key = Math.round(hourNow / 0.3) + ":" + Math.round(storm * 4);
  if (force || key !== skyEnvKey || !skyEnvRT) { skyEnvKey = key; const rt = pm.fromScene(envScene, 0.02, 1, 30000); if (skyEnvRT) skyEnvRT.dispose(); skyEnvRT = rt; }
  scene.environment = skyEnvRT.texture;
}
const starGeo = new THREE.BufferGeometry(); { const a = new Float32Array(900 * 3); for (let i = 0; i < 900; i++) { const u = Math.random() * 2 - 1, t = Math.random() * 6.283, r = Math.sqrt(1 - u * u); a.set([r * Math.cos(t) * 13000, Math.abs(u) * 13000 * 0.95 + 300, r * Math.sin(t) * 13000], i * 3); } starGeo.setAttribute("position", new THREE.BufferAttribute(a, 3)); }
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 30, sizeAttenuation: true, transparent: true, fog: false, depthWrite: false })); scene.add(stars);
const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(260, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1c9, fog: false })); scene.add(sunDisc);
const moonDisc = new THREE.Mesh(new THREE.SphereGeometry(190, 16, 12), new THREE.MeshBasicMaterial({ color: 0xdfe7ff, fog: false })); scene.add(moonDisc);
scene.fog = new THREE.FogExp2(0xcfe0ee, 0.00035);

const ENV = buildEnvironment({ rnd, GROUND, canvasTex }); OUT.add(ENV.group);
const seaMat = new THREE.MeshStandardMaterial({ color: 0x1f7fa6, roughness: 0.14, metalness: 0.1 });
{ const sh = new THREE.Shape(); sh.moveTo(-30000, -30000); sh.lineTo(30000, -30000); sh.lineTo(30000, 30000); sh.lineTo(-30000, 30000); sh.closePath(); const hole = new THREE.Path(); hole.moveTo(101, 87); hole.lineTo(111, 87); hole.lineTo(111, 127); hole.lineTo(101, 127); hole.closePath(); sh.holes.push(hole); const sea = new THREE.Mesh(new THREE.ShapeGeometry(sh), seaMat); sea.rotation.x = -Math.PI / 2; sea.position.set(0, GROUND - 0.5, 0); OUT.add(sea); }   // same ramp-cut hole as the land
const sandMat = std(0xcdb48a, 1, 0, { map: ENV.sand }); { const sh = new THREE.Shape(); sh.moveTo(-4500, -3000); sh.lineTo(4500, -3000); sh.lineTo(4500, 3000); sh.lineTo(-4500, 3000); sh.closePath(); const hole = new THREE.Path(); hole.moveTo(101.5, -2583); hole.lineTo(110.5, -2583); hole.lineTo(110.5, -2543); hole.lineTo(101.5, -2543); hole.closePath(); sh.holes.push(hole); const land = new THREE.Mesh(new THREE.ShapeGeometry(sh), sandMat); land.rotation.x = -Math.PI / 2; land.position.set(0, GROUND, 330 - 3000); OUT.add(land); }   // hole = the open ramp cut to the car park
const roadMat = std(0x2c2f35, 0.9, 0, { map: ENV.asphalt }); for (const [x, z, w, d] of [[0, 120, 5000, 22], [0, 250, 5000, 14], [-200, -1200, 16, 3000], [500, -1200, 16, 3000]]) { const rg = new THREE.PlaneGeometry(w, d); rg.attributes.uv.array.forEach((v, i, a) => (a[i] = v * (i % 2 ? d : w) / 10)); const r = new THREE.Mesh(rg, roadMat); r.rotation.x = -Math.PI / 2; r.position.set(x, GROUND + 0.3, z); OUT.add(r); }
// window textures for towers (colour + lit-window emissive mask)
const winColor = canvasTex(128, 256, (g, w, h) => { g.fillStyle = "#53697f"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { g.fillStyle = `rgba(20,40,60,${0.25 + rnd() * 0.3})`; g.fillRect(x + 1, y + 1, 6, 5); } }, [1, 1]);
const winMask = (() => { const t = canvasTex(128, 256, (g, w, h) => { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) if (rnd() > 0.45) { g.fillStyle = rnd() > 0.5 ? "#ffd9a0" : "#bcd8ff"; g.fillRect(x + 1, y + 1, 6, 5); } }, [1, 1]); return t; })();
const cityMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: winColor, roughness: 0.35, metalness: 0.4, emissive: 0xffffff, emissiveMap: winMask, emissiveIntensity: 0 });
{ // skyline east/west of the site + low-rise beachfront
  for (let i = 0; i < 70; i++) { const w = 22 + rnd() * 30, h = 90 + rnd() * rnd() * 330, x = -1500 + rnd() * 700, z = 90 + rnd() * 200; const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * (0.8 + rnd() * 0.5)), cityMat); b.position.set(x, GROUND + h / 2, z); OUT.add(b); }
  for (let i = 0; i < 90; i++) { const w = 20 + rnd() * 40, h = 8 + rnd() * 24, x = -1500 + rnd() * 3500, z = 140 + rnd() * 160; const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 20 + rnd() * 20), cityMat); b.position.set(x, GROUND + h / 2, z); OUT.add(b); }
  const own = new THREE.Mesh(new THREE.BoxGeometry(W, -GROUND - 0.5, D), cityMat); own.position.set(W / 2, GROUND / 2 - 0.25, D / 2); OUT.add(own); OUT.userData.own = own;   // the tower body below floor 50
}
ENV.addDistrict(cityMat);
const burjMat = new THREE.MeshStandardMaterial({ color: 0xf3f3f1, roughness: 0.45, side: THREE.DoubleSide, emissive: 0x2c64ff, emissiveIntensity: 0 });
{ // stylised Burj Al Arab on its island (visual reference only, not a surveyed model)
  const b = new THREE.Group(); b.position.set(-560, GROUND, 610); OUT.add(b);
  const isl = new THREE.Mesh(new THREE.CylinderGeometry(120, 130, 6, 40), sandMat); isl.position.y = 0; b.add(isl);
  const sail = new THREE.Mesh(new THREE.CylinderGeometry(34, 70, 200, 48, 1, true, 0.4, 3.0), burjMat); sail.position.set(0, 103, 0); b.add(sail);
  const sail2 = new THREE.Mesh(new THREE.CylinderGeometry(26, 58, 190, 48, 1, true, 0.5, 2.7), burjMat); sail2.position.set(0, 98, 0); sail2.scale.set(0.82, 1, 0.82); b.add(sail2);
  const mast = new THREE.Mesh(new THREE.BoxGeometry(5, 205, 5), burjMat); mast.position.set(-62 * Math.cos(0.4) * -1 + 0, 104, 62 * Math.sin(0.4)); mast.position.set(Math.cos(0.4) * 62, 104, Math.sin(0.4) * 62); b.add(mast);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(3.5, 55, 8), burjMat); spire.position.set(Math.cos(0.4) * 62, 232, Math.sin(0.4) * 62); b.add(spire);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(150, 4, 8), std(0x888b90, 0.8)); deck.position.set(80, 3, -170); deck.rotation.y = 0.2; b.add(deck);
  b.rotation.y = -0.5;
}

// ---------------------------------------------------------------- time of day
const sunDir = new THREE.Vector3();
const cl = (v, a, b) => Math.max(a, Math.min(b, v)); const sm = (a, b, v) => { const t = cl((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const C = (h) => new THREE.Color(h);
const FOCUS = new THREE.Vector3(W / 2, 0, D / 2);
let towerAPI = null, extrasAPI = null, planAPI = null, storm = 0, nightK = 0;
const moonLight = new THREE.DirectionalLight(0x8fa8ff, 0); moonLight.target.position.set(W / 2, 0, D / 2); scene.add(moonLight, moonLight.target);
const hemi = scene.children.find((o) => o.isHemisphereLight);
let hourNow = 15.5;
function setTime(h) {
  hourNow = h; const th = ((h - 6) / 12) * Math.PI;
  sunDir.set(Math.cos(th), Math.sin(th) * 0.8, 0.15 - Math.sin(th) * 0.45).normalize();
  const e = sunDir.y, day = sm(-0.06, 0.26, e) * (1 - 0.6 * storm), warmK = Math.exp(-Math.pow(e / 0.2, 2)) * (e > -0.22 ? 1 : 0) * (1 - storm);
  skyUniforms.top.value.copy(C(0x08122b).lerp(C(0x4f8fd0), day)).lerp(C(0x5d4a7a), warmK * 0.35);
  skyUniforms.hor.value.copy(C(0x141f38).lerp(C(0xcfe2f1), day)).lerp(C(0xff9b5e), warmK * 0.75);
  skyUniforms.bot.value.copy(C(0x0b1220).lerp(C(0x9fb6c6), day));
  const blueK = Math.exp(-(((e + 0.115) / 0.09) ** 2)) * (1 - storm); skyUniforms.top.value.lerp(C(0x24528f), blueK * 0.9); skyUniforms.hor.value.lerp(C(0x8a88bd), blueK * 0.55); skyUniforms.bot.value.lerp(C(0x1b2a4a), blueK * 0.6);
  skyUniforms.top.value.lerp(C(0x2b313c), storm * 0.85); skyUniforms.hor.value.lerp(C(0x56606d), storm * 0.8); skyUniforms.bot.value.lerp(C(0x3a414c), storm * 0.7);
  skyUniforms.cloud.value.copy(C(0xffffff).lerp(C(0xff9f78), warmK * 0.55)).lerp(C(0x232a3a), 1 - day).lerp(C(0x5a626c), storm * 0.8); skyUniforms.cloudK.value = (0.22 + 0.55 * storm) * (0.35 + 0.65 * day) + 0.1; skyUniforms.sun.value.copy(sunDir); skyUniforms.glow.value.copy(C(0xffa763)); skyUniforms.glowK.value = cl(e + 0.2, 0, 1) * (0.4 + warmK * 0.8);
  scene.fog.color.copy(skyUniforms.hor.value); scene.fog.density = state.mep ? 0 : 0.00035;
  sun.position.copy(sunDir).multiplyScalar(90).add(FOCUS); sun.target.position.copy(FOCUS); sun.color.copy(C(0xff9248).lerp(C(0xfff1da), cl(e / 0.55, 0, 1)));
  sun.intensity = 2.8 * day * (0.35 + 0.65 * cl(e / 0.4, 0, 1)) + 0.0001;
  moonLight.position.set(FOCUS.x - sunDir.x * 80, -sunDir.y * 80 + 5, FOCUS.z - sunDir.z * 80); moonLight.intensity = 0.55 * (1 - day) * sm(0.02, 0.25, -e);
  hemi.intensity = 0.07 + 0.55 * day + 0.55 * blueK + 0.2 * warmK * (1 - day) + (state.mode === "park" ? 0.9 : state.mode === "lift" ? 0.45 : 0); hemi.color.copy(C(0x6f86c6).lerp(C(0xdcecff), day));
  scene.environmentIntensity = state.mep || state.mode === "park" ? 0.9 : state.mode === "lift" ? 0.55 : (0.09 + 0.46 * day + 0.45 * blueK + 0.12 * warmK) * (state.mode === "tower" ? 1.25 : 1); renderer.toneMappingExposure = 1.0 + 0.25 * (1 - day);
  sunDisc.position.copy(sunDir).multiplyScalar(9000); sunDisc.visible = e > -0.03; sunDisc.material.color.copy(C(0xffcf8a).lerp(C(0xfff6dc), cl(e / 0.5, 0, 1)));
  moonDisc.position.copy(sunDir).multiplyScalar(-9000); moonDisc.visible = -e > 0.05 && day < 0.6;
  stars.material.opacity = cl(1 - day * 1.6, 0, 0.95); stars.visible = stars.material.opacity > 0.02;
  seaMat.color.copy(C(0x061a2c).lerp(C(0x1f86ad), day)).lerp(C(0xb86a48), warmK * 0.35);
  sandMat.color.copy(C(0x2a2a30).lerp(C(0xcdb48a), day)); roadMat.color.copy(C(0x14161a).lerp(C(0x2c2f35), day));
  cityMat.emissiveIntensity = 1.5 * (1 - day); cityMat.color.copy(C(0x6d7b8a).lerp(C(0xffffff), day)); burjMat.emissiveIntensity = 1.4 * (1 - day); burjMat.color.copy(C(0x9aa3b8).lerp(C(0xf3f3f1), day));
  nightK = cl(1 - day * 1.4, 0, 1); towerAPI && towerAPI.setNight(nightK); extrasAPI && extrasAPI.setPoolNight(nightK); planAPI && planAPI.night(nightK); ENV.setNight(nightK); LAND.setNight(nightK); refreshSkyEnv(false);
  document.getElementById("tlabel") && (document.getElementById("tlabel").textContent = `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60) % 60).padStart(2, "0")}  ${day > 0.6 ? "day" : day < 0.05 ? "night" : e > 0 && h < 12 ? "sunrise" : "sunset"}`);
  document.getElementById("tslider") && (document.getElementById("tslider").value = String(h));
  if (state.lightsAuto) { const on = day < 0.35; Object.keys(lightsOn).forEach((k) => (lightsOn[k] = on)); applyLights(); syncLightButtons(); planAPI && planAPI.lights(on); }
}
const lightsOn = {}; Object.keys(ROOMS).forEach((k) => (lightsOn[k] = false));
function applyLights() { Object.keys(ROOMS).forEach((k) => { const on = lightsOn[k], inMode = k === "lobby" ? state.mode === "lobby" : state.mode === "floor"; LM[k].emissiveIntensity = on ? 2.2 : 0.03; LM[k].color.set(on ? 0xfff1d6 : 0xb8b2a8); roomLights[k].forEach((o) => (o.p.intensity = on && inMode && Q.cfg.pointLights ? o.base : 0)); }); }

// ---------------------------------------------------------------- utilities (illustrative routing)
const COL = { elecL: 0xffd21f, elecP: 0xff8a1f, elecH: 0xff4a3a, cold: 0x2f86ff, hot: 0xff3b30, soil: 0x9a4d10, waste: 0xb5bd2a, vent: 0xd3dae0 };
const flows = [];   // {pts, len, mesh-offset, dir}
function polyLen(pts) { let l = 0; for (let i = 1; i < pts.length; i++) l += pts[i].distanceTo(pts[i - 1]); return l; }
function pipe(group, color, r0, raw, opts = {}) {
  const r = r0 * 2.8;
  const pts = raw.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.15, emissive: color, emissiveIntensity: 0.4 });
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], len = a.distanceTo(b); if (len < 1e-4) continue;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = false; group.add(m);
    if (i < pts.length - 1) { const j = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 12, 10), mat); j.position.copy(b); group.add(j); }
  }
  if (!opts.noflow) flows.push({ group, pts, len: polyLen(pts), color, r, dir: opts.dir ?? 1, speed: opts.speed ?? 0.9 });
  return pts;
}
function part(group, geo, mat, x, y, z, rot) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (rot) m.rotation.set(...rot); group.add(m); return m; }
const dotMat = (c) => new THREE.MeshBasicMaterial({ color: c });

// ---- ELECTRICITY: ceiling-void trunking, drops in the walls, plates on the wall faces
{
  const g = G.elec, Y = VOID_Y;
  const metal = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.4 });
  // distribution boards
  part(g, new THREE.BoxGeometry(0.5, 0.7, 0.14), metal(0xc9d0d8), 9.0, 1.5, 0.15); part(g, new THREE.BoxGeometry(0.4, 0.6, 0.14), metal(0xc9d0d8), 27.2, 1.5, 0.15);
  part(g, new THREE.BoxGeometry(0.44, 0.02, 0.01), metal(0xffd21f), 9.0, 1.78, 0.23);
  // trunk: board -> spine at z=8.2
  const spine = [[9.0, 1.2, 0.3], [9.0, Y, 0.3], [9.0, Y, 8.2]];
  pipe(g, COL.elecH, 0.045, spine, { speed: 1.4 });
  pipe(g, COL.elecH, 0.045, [[9.0, Y, 8.2], [4.0, Y, 8.2]], { speed: 1.4 });
  pipe(g, COL.elecH, 0.045, [[9.0, Y, 8.2], [24.5, Y, 8.2]], { speed: 1.4 });
  pipe(g, COL.elecH, 0.045, [[27.2, 1.2, 0.3], [27.2, Y, 0.3], [27.2, Y, 5.0], [24.5, Y, 8.2]], { speed: 1.4 });
  const J = { mb: [4, 11.2], wic: [4, 8.2], bath: [4, 8.2], pw: [9, 8.2], foy: [13.5, 8.2], liv: [15.5, 8.2], kit: [20.5, 8.2], gb: [24.5, 8.2], lau: [27.2, 5.0] };
  const run = (j, x, z, h, color, r = 0.014) => { const [jx, jz] = J[j]; const pts = [[jx, Y, jz], [x, Y, jz], [x, Y, z], [x, h, z]]; const clean = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1] || p[2] !== pts[i - 1][2]); pipe(g, color, r, clean, { speed: 1.1 }); };
  // lighting circuit (yellow): downlight feeds in the void
  const lights = [["mb", 2, 13.5], ["mb", 6, 13.5], ["mb", 2, 17.5], ["mb", 6, 17.5], ["wic", 4, 8.0], ["bath", 2.5, 2.5], ["bath", 5.5, 2.5], ["pw", 9, 5], ["foy", 12.5, 3.5], ["foy", 15, 3.5], ["liv", 11.5, 14], ["liv", 15.5, 14], ["liv", 19.5, 14], ["liv", 12, 10.5], ["liv", 16, 10.5], ["liv", 19, 10.5], ["kit", 19, 3.2], ["kit", 21.5, 3.2], ["lau", 26.7, 4], ["gb", 25, 10], ["gb", 25, 16.5], ["gb", 27, 18.5], ["liv", 14, 18], ["liv", 20, 18]];
  lights.forEach(([j, x, z]) => { run(j, x, z, CEIL_Y, COL.elecL); part(g, new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16), new THREE.MeshBasicMaterial({ color: COL.elecL }), x, CEIL_Y + 0.02, z); });
  // switches (1.2 m) and sockets (0.3 / 1.1 m): [junction, x, z, normal, height, kind]
  const pts = [
    ["mb", 7.85, 14, [-1, 0], 1.2, "sw"], ["mb", 1.7, 10.1, [0, 1], 0.55, "so"], ["mb", 6.3, 10.1, [0, 1], 0.55, "so"], ["mb", 0.15, 17.5, [1, 0], 0.3, "so"], ["mb", 7.85, 17.5, [-1, 0], 0.3, "so"],
    ["bath", 3.2, 0.15, [0, 1], 1.1, "so"], ["bath", 0.15, 2.0, [1, 0], 0.4, "so"], ["bath", 3.6, 5.85, [0, -1], 1.2, "sw"], ["wic", 0.15, 8.0, [1, 0], 0.3, "so"],
    ["pw", 9.9, 6.0, [-1, 0], 0.3, "so"], ["pw", 9.9, 4.9, [-1, 0], 1.2, "sw"],
    ["foy", 10.1, 6.0, [1, 0], 1.2, "sw"], ["foy", 16.9, 5.0, [-1, 0], 0.3, "so"], ["foy", 14.2, 6.9, [0, -1], 0.3, "so"],
    ["liv", 21.9, 14.8, [-1, 0], 0.3, "so"], ["liv", 21.9, 17.2, [-1, 0], 0.3, "so"], ["liv", 21.9, 16.0, [-1, 0], 1.0, "so"], ["liv", 12.0, 7.1, [0, 1], 0.3, "so"], ["liv", 14.5, 7.1, [0, 1], 0.3, "so"], ["liv", 9.9, 12.0, [1, 0], 1.2, "sw"],
    ["kit", 19.0, 0.15, [0, 1], 1.15, "so"], ["kit", 20.8, 0.15, [0, 1], 1.15, "so"], ["kit", 22.4, 0.15, [0, 1], 1.15, "so"], ["kit", 17.1, 3.0, [1, 0], 1.2, "sw"], ["kit", 20.4, 3.2, [0, 1], 0.3, "so"],
    ["lau", 27.85, 3.0, [-1, 0], 0.3, "so"], ["lau", 25.1, 2.9, [1, 0], 1.2, "sw"], ["lau", 26.0, 0.15, [0, 1], 0.3, "so"],
    ["gb", 22.15, 14.5, [1, 0], 1.2, "sw"], ["gb", 23.6, 19.0, [0, -1], 0.55, "so"], ["gb", 26.4, 19.0, [0, -1], 0.55, "so"], ["gb", 27.85, 14.5, [-1, 0], 0.3, "so"], ["gb", 25.5, 7.2, [0, 1], 1.1, "so"], ["gb", 24.0, 12.9, [0, 1], 1.2, "sw"],
  ];
  pts.forEach(([j, x, z, n, h, k]) => {
    const kind = k === "sw" ? COL.elecL : COL.elecP; run(j, x, z, h, kind);
    const plate = part(g, new THREE.BoxGeometry(0.09, 0.09, 0.012), new THREE.MeshStandardMaterial({ color: k === "sw" ? 0xfff3b0 : 0xffffff, roughness: 0.5 }), x + n[0] * 0.01, h, z + n[1] * 0.01);
    plate.rotation.y = Math.atan2(n[0], n[1]);
    part(g, new THREE.BoxGeometry(0.04, 0.04, 0.016), new THREE.MeshBasicMaterial({ color: kind }), x + n[0] * 0.012, h, z + n[1] * 0.012).rotation.y = plate.rotation.y;
  });
  // AC cassettes (dedicated heavy circuit, red) + hob/oven/washer/dryer dedicated lines
  const acs = [["mb", 4, 15.5], ["liv", 15.5, 15], ["liv", 14, 10], ["gb", 25, 16.5], ["kit", 20.5, 2.5]];
  acs.forEach(([j, x, z]) => { run(j, x, z, CEIL_Y, COL.elecH, 0.022); part(g, new THREE.BoxGeometry(0.7, 0.14, 0.7), new THREE.MeshStandardMaterial({ color: 0xe9edf2, roughness: 0.4 }), x, CEIL_Y - 0.05, z); });
  [["kit", 23.3, 0.3, 0.9], ["kit", 21.5, 0.3, 0.6], ["lau", 25.9, 0.45, 0.4], ["lau", 25.9, 1.3, 0.4]].forEach(([j, x, z, h]) => run(j, x, z, h, COL.elecH, 0.022));
  // low-voltage / smart-home hub in the foyer
  part(g, new THREE.BoxGeometry(0.4, 0.3, 0.1), new THREE.MeshStandardMaterial({ color: 0x2c8cff }), 15.0, 2.0, 0.2);
}

// ---- WATER: cold (blue) + hot (red). Risers R1 (x 8..10) and R2 (x 26.4..28), wall cavities and floor screed
{
  const g = G.water;
  const riser = (x, z, c) => { pipe(g, c, 0.035, [[x, -0.6, z], [x, 4.4, z]], { dir: 1, speed: 1.5 }); };
  riser(8.55, 0.55, COL.cold); riser(9.35, 0.55, COL.hot); riser(26.95, 0.55, COL.cold); riser(27.6, 0.55, COL.hot);
  const valve = (x, y, z, c) => { const v = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshStandardMaterial({ color: c, metalness: 0.7, roughness: 0.25 })); v.position.set(x, y, z); g.add(v); };
  const feed = (c, y0, path, up) => { const pts = path.map(([x, z]) => [x, y0, z]); const last = path[path.length - 1]; pts.push([last[0], up, last[1]]); pipe(g, c, 0.017, pts, { dir: 1, speed: 0.9 }); valve(last[0], up, last[1], c); };
  const C = COL.cold, H = COL.hot;
  // master bath (back wall z=0 cavity, west wall x=0 cavity, floor screed to the tub)
  feed(C, 0.3, [[8.55, 0.55], [8.55, 0.0], [6.9, 0.0]], 0.5);                    // WC cistern
  feed(C, 0.3, [[8.55, 0.55], [8.55, 0.0], [4.1, 0.0]], 0.95); feed(H, 0.45, [[9.35, 0.55], [9.35, 0.0], [4.1, 0.0]], 0.95);
  feed(C, 0.3, [[4.1, 0.0], [2.3, 0.0]], 0.95); feed(H, 0.45, [[4.1, 0.0], [2.3, 0.0]], 0.95);
  feed(C, 0.3, [[2.3, 0.0], [0.0, 0.0], [0.0, 4.4]], 1.1); feed(H, 0.45, [[2.3, 0.0], [0.0, 0.0], [0.0, 4.4]], 1.1);
  pipe(g, C, 0.017, [[0.0, 1.1, 4.4], [0.0, 2.1, 4.4], [0.35, 2.1, 4.4]], { dir: 1 }); pipe(g, H, 0.017, [[0.0, 1.1, 4.5], [0.0, 2.1, 4.5], [0.35, 2.1, 4.5]], { dir: 1 });
  pipe(g, C, 0.017, [[4.1, 0.1, 0.0], [5.9, 0.1, 0.0], [5.9, 0.1, 3.9], [5.95, 0.9, 3.9]], { dir: 1 }); pipe(g, H, 0.017, [[4.1, 0.14, 0.04], [6.0, 0.14, 0.04], [6.0, 0.14, 3.95], [6.05, 0.9, 3.95]], { dir: 1 });   // tub filler
  // powder room
  feed(C, 0.3, [[8.55, 0.55], [8.55, 1.6], [9.0, 2.2]], 0.5);
  feed(C, 0.3, [[8.55, 0.55], [9.9, 0.55], [9.9, 6.75], [9.0, 7.0]], 0.95); feed(H, 0.45, [[9.35, 0.55], [9.9, 0.7], [9.9, 6.75], [9.0, 7.0]], 0.95);
  // hot-water cylinder (laundry) feeds hot riser; cold into it
  pipe(g, C, 0.02, [[26.95, 0.3, 0.55], [26.95, 0.3, 2.7], [27.1, 0.3, 2.7]], { dir: 1 }); pipe(g, H, 0.02, [[27.1, 1.4, 2.7], [27.6, 1.4, 2.7], [27.6, 1.4, 0.55]], { dir: -1 });
  // kitchen (back wall run from R2)
  feed(C, 0.3, [[26.95, 0.55], [26.95, 0.0], [20.5, 0.0]], 0.95); feed(H, 0.45, [[27.6, 0.55], [27.6, 0.0], [20.5, 0.0]], 0.95);
  feed(C, 0.3, [[22.0, 0.0], [22.0, 0.0]], 0.6); feed(C, 0.3, [[20.5, 0.0], [18.2, 0.0]], 0.9);   // dishwasher, fridge water
  // laundry: washer + tub sink
  feed(C, 0.3, [[26.95, 0.0], [26.0, 0.0]], 0.95); feed(H, 0.45, [[27.6, 0.0], [26.0, 0.0]], 0.95);
  feed(C, 0.3, [[27.6, 0.55], [28.0, 0.55], [28.0, 5.7]], 0.9); feed(H, 0.45, [[27.6, 0.55], [28.0, 0.55], [28.0, 5.7]], 0.9);
  // guest ensuite along the wet wall z=7 and the guest suite wall x=22
  feed(C, 0.3, [[28.0, 5.7], [28.0, 7.0], [27.2, 7.0]], 0.5);
  feed(C, 0.3, [[28.0, 5.7], [28.0, 7.0], [24.0, 7.0]], 0.95); feed(H, 0.45, [[28.0, 5.7], [28.0, 7.0], [24.0, 7.0]], 0.95);
  feed(C, 0.3, [[24.0, 7.0], [22.0, 7.0], [22.0, 12.2]], 1.1); feed(H, 0.45, [[24.0, 7.0], [22.0, 7.0], [22.0, 12.2]], 1.1);
  part(g, new THREE.CylinderGeometry(0.34, 0.34, 1.42, 24), new THREE.MeshStandardMaterial({ color: COL.hot, transparent: true, opacity: 0.28, emissive: COL.hot, emissiveIntensity: 0.2 }), 27.1, 0.71, 2.7);
}

// ---- SEWAGE: drains in the floor build-up with 2% fall to the soil stacks; vent stacks to the roof
{
  const g = G.sewer;
  const S1 = [9.0, 1.15], S2 = [27.15, 1.0];
  const soil = (c, r, pts) => pipe(g, c, r, pts, { dir: 1, speed: 0.8 });
  const stack = (s) => { pipe(g, COL.soil, 0.075, [[s[0], -1.0, s[1]], [s[0], 4.4, s[1]]], { dir: -1, speed: 1.3 }); pipe(g, COL.vent, 0.03, [[s[0] + 0.25, 1.0, s[1]], [s[0] + 0.25, 4.8, s[1]]], { noflow: true }); };
  stack(S1); stack(S2);
  const drain = (color, r, from, path, stack0, floorTrap = true) => {
    // from: [x, z, yTop] fixture outlet; path: [[x,z],...] ending at the stack
    const out = []; let L = 0; let prev = [from[0], from[1]];
    out.push([from[0], from[2], from[1]]);
    const y0 = -0.14; out.push([from[0], y0, from[1]]);
    path.forEach(([x, z], i) => { L += Math.hypot(x - prev[0], z - prev[1]); prev = [x, z]; out.push([x, y0 - 0.02 * L, z]); });
    soil(color, r, out);
    if (floorTrap) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 20), new THREE.MeshStandardMaterial({ color: 0x555a60, metalness: 0.8, roughness: 0.3 })); t.position.set(from[0], 0.015, from[1]); g.add(t); }
  };
  // master bath -> S1
  drain(COL.soil, 0.055, [6.9, 0.55, 0.25], [[7.9, 0.55], [8.0, 1.15], [9.0, 1.15]], S1, false);
  drain(COL.waste, 0.032, [2.3, 0.55, 0.0], [[2.3, 1.15], [9.0, 1.15]], S1, false); drain(COL.waste, 0.032, [4.1, 0.55, 0.0], [[4.1, 1.15], [9.0, 1.15]], S1, false);
  drain(COL.waste, 0.04, [0.8, 4.4, 0.0], [[0.8, 1.3], [9.0, 1.3]], S1); drain(COL.waste, 0.04, [4.6, 3.9, 0.0], [[4.6, 1.3], [9.0, 1.3]], S1);
  // powder -> S1
  drain(COL.soil, 0.055, [9.0, 2.55, 0.2], [[9.0, 1.15]], S1, false); drain(COL.waste, 0.032, [9.0, 6.95, 0.35], [[9.35, 6.95], [9.35, 1.15], [9.0, 1.15]], S1, false);
  // kitchen, laundry, guest bath -> S2
  drain(COL.waste, 0.04, [20.5, 0.4, 0.8], [[20.5, 0.45], [27.15, 0.45], S2], S2, false); drain(COL.waste, 0.032, [22.0, 0.45, 0.4], [[22.0, 0.45]], S2, false);
  drain(COL.waste, 0.04, [25.8, 0.5, 0.0], [[26.3, 0.5], [27.15, 0.5]], S2); drain(COL.waste, 0.032, [27.55, 5.7, 0.5], [[27.55, 1.0]], S2, false);
  drain(COL.soil, 0.055, [27.2, 7.55, 0.2], [[27.9, 7.55], [27.9, 1.0], [27.15, 1.0]], S2, false); drain(COL.waste, 0.032, [24.0, 7.3, 0.4], [[24.0, 7.3], [26.5, 7.3], [26.5, 1.0], [27.15, 1.0]], S2, false);
  drain(COL.waste, 0.04, [23.2, 12.2, 0.0], [[23.2, 8.0], [28.0, 8.0], [28.0, 1.0], [27.15, 1.0]], S2);
  // inspection chambers
  for (const [x, z] of [[9.0, 1.15], [27.15, 1.0]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 20), new THREE.MeshStandardMaterial({ color: 0x3a3f46, metalness: 0.7 })); c.position.set(x, 0.03, z + 0.5); g.add(c); }
}

// ---- FIRE SAFETY: wet riser, sprinkler network, detectors, alarm panel, call points, sounders
const fireHeads = [], fireDetectors = [], fireStrobes = [];
{
  const g = G.fire, Y = 3.38, FIRE = 0xe5242b;
  const red = new THREE.MeshStandardMaterial({ color: 0xd8232a, roughness: 0.4, emissive: 0x7a0c10, emissiveIntensity: 0.5 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.4 });
  const chromeM = new THREE.MeshStandardMaterial({ color: 0xd9dde2, roughness: 0.2, metalness: 1 });
  pipe(g, FIRE, 0.04, [[9.65, -0.6, 1.9], [9.65, 4.4, 1.9]], { dir: 1, speed: 1.4 });
  part(g, new THREE.BoxGeometry(0.26, 0.34, 0.26), red, 9.65, 2.5, 1.9); part(g, new THREE.SphereGeometry(0.09, 14, 10), chromeM, 9.9, 2.5, 1.9);
  pipe(g, FIRE, 0.032, [[9.65, Y, 1.9], [9.65, Y, 8.8]], { speed: 1.2 }); pipe(g, FIRE, 0.032, [[9.65, Y, 8.8], [0.6, Y, 8.8]], { speed: 1.2 }); pipe(g, FIRE, 0.032, [[9.65, Y, 8.8], [27.4, Y, 8.8]], { speed: 1.2 });
  const grid = (x1, z1, x2, z2) => { const nx = Math.max(1, Math.round((x2 - x1) / 3.4)), nz = Math.max(1, Math.round((z2 - z1) / 3.4)), o = []; for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) o.push([x1 + ((i + 0.5) * (x2 - x1)) / nx, z1 + ((j + 0.5) * (z2 - z1)) / nz]); return o; };
  const zones = [[0.3, 10.3, 7.7, 19.7], [0.3, 6.3, 7.7, 9.7], [0.3, 0.3, 7.7, 5.7], [8.3, 2.5, 9.7, 6.7], [10.3, 0.3, 16.7, 6.7], [17.3, 0.3, 24.7, 6.7], [25.3, 0.3, 27.7, 6.7], [22.3, 7.3, 27.7, 12.7], [22.3, 13.3, 27.7, 19.7], [10.3, 7.3, 21.7, 19.7]];
  zones.forEach((z) => grid(...z).forEach(([x, zz]) => {
    pipe(g, FIRE, 0.014, [[x, Y, 8.8], [x, Y, zz], [x, 3.17, zz]], { noflow: true });
    part(g, new THREE.CylinderGeometry(0.014, 0.014, 0.09, 8), chromeM, x, 3.12, zz); part(g, new THREE.CylinderGeometry(0.04, 0.04, 0.006, 16), chromeM, x, 3.07, zz);
    const bulb = part(g, new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff1a1a, emissiveIntensity: 0.8 }), x, 3.09, zz); fireHeads.push({ x, z: zz, bulb });
  }));
  // detectors on a signal loop (magenta) back to the alarm panel
  const LOOP = 0xd946d9, Y2 = 3.3;
  const dets = [["smoke", 4, 15], ["smoke", 4, 8], ["smoke", 4, 3], ["smoke", 9, 4.5], ["smoke", 13.5, 3.5], ["heat", 20.5, 3.6], ["smoke", 13, 13], ["smoke", 18, 13], ["smoke", 25, 16.5], ["smoke", 25, 10], ["smoke", 26.6, 3.5]];
  pipe(g, LOOP, 0.012, [[16.88, 1.5, 2.0], [16.88, Y2, 2.0], [16.88, Y2, 9.3]], { dir: -1, speed: 1.6 }); pipe(g, LOOP, 0.012, [[0.8, Y2, 9.3], [27.2, Y2, 9.3]], { dir: -1, speed: 1.6 });
  dets.forEach(([k, x, z]) => {
    pipe(g, LOOP, 0.008, [[x, Y2, 9.3], [x, Y2, z], [x, 3.18, z]], { dir: -1, speed: 1.6 });
    const body = part(g, new THREE.CylinderGeometry(0.075, 0.08, 0.04, 20), k === "heat" ? new THREE.MeshStandardMaterial({ color: 0xffa23a }) : white, x, 3.16, z);
    const led = part(g, new THREE.SphereGeometry(0.014, 8, 6), new THREE.MeshStandardMaterial({ color: 0x2cff6a, emissive: 0x2cff6a, emissiveIntensity: 1.5 }), x + 0.04, 3.135, z); fireDetectors.push({ x, z, led, kind: k });
  });
  // fire alarm control panel on the foyer wall, hose reel cabinet, extinguishers, exit sign
  part(g, new THREE.BoxGeometry(0.12, 0.6, 0.46), red, 16.92, 1.5, 2.0); part(g, new THREE.BoxGeometry(0.02, 0.22, 0.3), new THREE.MeshStandardMaterial({ color: 0x35ff7a, emissive: 0x35ff7a, emissiveIntensity: 1.2 }), 16.85, 1.58, 2.0);
  part(g, new THREE.BoxGeometry(0.22, 0.8, 0.8), red, 15.6, 1.2, 0.2).rotation.y = Math.PI / 2; part(g, new THREE.TorusGeometry(0.22, 0.04, 8, 24), chromeM, 15.6, 1.2, 0.32);
  [[16.82, 6.4], [24.8, 5.0], [27.7, 6.4]].forEach(([x, z]) => { part(g, new THREE.CylinderGeometry(0.075, 0.075, 0.45, 14), red, x, 0.35, z); part(g, new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), chromeM, x, 0.62, z); });
  part(g, new THREE.BoxGeometry(0.45, 0.16, 0.05), new THREE.MeshStandardMaterial({ color: 0x20c060, emissive: 0x20c060, emissiveIntensity: 1.1 }), 13.4, 2.6, 0.16);
  // manual call points (break-glass)
  [[10.12, 1.4, 6.3, 1.5708], [16.92, 1.4, 3.3, 1.5708], [7.84, 1.4, 12.4, -1.5708], [22.14, 1.4, 14.8, 1.5708], [27.84, 1.4, 4.8, -1.5708]].forEach(([x, y, z, ry]) => { const m = part(g, new THREE.BoxGeometry(0.03, 0.09, 0.09), red, x, y, z); part(g, new THREE.BoxGeometry(0.01, 0.05, 0.05), white, x + (ry > 0 ? 0.02 : -0.02), y, z); });
  // sounder + strobe beacons
  [[13.5, 6.4], [16, 10.5], [6, 13], [25, 15], [21, 5.2], [4, 3.5]].forEach(([x, z]) => { const m = part(g, new THREE.CylinderGeometry(0.09, 0.09, 0.07, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff3b2f, emissiveIntensity: 0.15 }), x, 3.12, z); fireStrobes.push({ m, x, z }); });
}

// ---- AIR-CONDITIONING: chilled-water fan-coil units, ducts, diffusers, thermostats, condensate drains
{
  const g = G.ac, Y = 3.34, SUP = 0x25d9e8, RET = 0xff9f1c, DR = 0x4cd964, WIRE = 0xb47cff;
  const flowOnly = (color, r, raw, dir, speed) => { const pts = raw.map((p) => new THREE.Vector3(...p)); flows.push({ group: g, pts, len: polyLen(pts), color, r, dir, speed }); };
  pipe(g, SUP, 0.045, [[9.55, -0.6, 0.85], [9.55, 4.4, 0.85]], { dir: 1, speed: 1.2 }); pipe(g, RET, 0.045, [[9.85, -0.6, 0.85], [9.85, 4.4, 0.85]], { dir: -1, speed: 1.2 });
  pipe(g, SUP, 0.04, [[9.55, Y, 0.85], [9.55, Y, 9.45], [0.8, Y, 9.45]], { dir: 1 }); pipe(g, SUP, 0.04, [[9.55, Y, 9.45], [27.2, Y, 9.45]], { dir: 1 });
  pipe(g, RET, 0.04, [[9.85, Y + 0.07, 0.85], [9.85, Y + 0.07, 9.65], [0.8, Y + 0.07, 9.65]], { dir: -1 }); pipe(g, RET, 0.04, [[9.85, Y + 0.07, 9.65], [27.2, Y + 0.07, 9.65]], { dir: -1 });
  const fcuMat = new THREE.MeshStandardMaterial({ color: 0xdfe5ea, roughness: 0.4, metalness: 0.2 }), ductMat = new THREE.MeshStandardMaterial({ color: 0x9fb4c8, roughness: 0.5, metalness: 0.4, transparent: true, opacity: 0.9 });
  const grill = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, emissive: SUP, emissiveIntensity: 0.25 });
  const fcus = [[4, 15.5, "mb"], [13, 11.5, "lv"], [16, 16.5, "ls"], [20.5, 2.6, "k"], [13.5, 3.4, "f"], [25, 16.5, "g"], [4, 3.2, "b"]];
  const duct = (a, b) => { const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz); const m = part(g, new THREE.BoxGeometry(dx ? len : 0.3, 0.2, dz ? len : 0.3), ductMat, (a[0] + b[0]) / 2, 3.07, (a[2] + b[2]) / 2); return m; };
  const stackFor = (x) => (x < 14 ? [9.0, 1.15] : [27.15, 1.0]);
  fcus.forEach(([fx, fz], i) => {
    part(g, new THREE.BoxGeometry(1.0, 0.26, 0.65), fcuMat, fx, 3.0 + 0.13 + 0.0, fz);
    pipe(g, SUP, 0.02, [[fx - 0.2, Y, 9.45], [fx - 0.2, Y, fz], [fx - 0.2, 3.2, fz]], { dir: 1, speed: 0.9 }); pipe(g, RET, 0.02, [[fx + 0.2, Y + 0.07, 9.65], [fx + 0.2, Y + 0.07, fz], [fx + 0.2, 3.2, fz]], { dir: -1, speed: 0.9 });
    [-1, 1].forEach((s) => { const dx = fx + s * 1.7; duct([fx + s * 0.5, 0, fz], [dx, 0, fz]); part(g, new THREE.BoxGeometry(0.6, 0.025, 0.6), grill, dx, 3.185, fz); flowOnly(0xbfeeff, 0.025, [[fx + s * 0.5, 3.07, fz], [dx, 3.07, fz], [dx, 3.17, fz]], 1, 1.3); });
    duct([fx, 0, fz + 0.33], [fx, 0, fz + 1.2]); part(g, new THREE.BoxGeometry(0.9, 0.025, 0.28), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: RET, emissiveIntensity: 0.25 }), fx, 3.185, fz + 1.2);
    flowOnly(0xffd9a0, 0.025, [[fx, 3.17, fz + 1.2], [fx, 3.07, fz + 1.2], [fx, 3.07, fz + 0.33]], 1, 1.1);
    const [sx, sz] = stackFor(fx); pipe(g, DR, 0.014, [[fx - 0.4, 3.0, fz], [sx, 3.0, fz], [sx, 3.0, sz]], { dir: 1, speed: 0.7 });
  });
  [[7.85, 1.5, 12, 1], [21.9, 1.5, 12.5, 1], [21.9, 1.5, 19.0, 1], [24.9, 1.5, 5.5, 1], [16.9, 1.5, 4.5, 1], [22.15, 1.5, 18.6, -1], [7.85, 1.5, 2.0, 1]].forEach(([x, y, z], i) => {
    part(g, new THREE.BoxGeometry(0.03, 0.1, 0.1), white2(), x, y, z); part(g, new THREE.BoxGeometry(0.01, 0.04, 0.06), new THREE.MeshBasicMaterial({ color: SUP }), x + (x < 14 && x > 8 ? 0.02 : 0.0), y, z);
    pipe(g, WIRE, 0.008, [[x, y, z], [x, 3.46, z], [fcus[Math.min(i, fcus.length - 1)][0], 3.46, fcus[Math.min(i, fcus.length - 1)][1]], [fcus[Math.min(i, fcus.length - 1)][0], 3.26, fcus[Math.min(i, fcus.length - 1)][1]]], { dir: -1, speed: 1.5 });
  });
  function white2() { return new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.4 }); }
}

// ---------------------------------------------------------------- the real tower (exact port of the Blender model) + lobby interior
const tower = createTower({ rnd });
towerAPI = tower; scene.add(tower.root);
const TERR = []; tower.root.traverse((o) => { const p = o.isMesh && o.geometry.parameters; if (p && p.radialSegments === 64 && p.height === 5.5 && (p.radiusTop === 50 || p.radiusTop === 66)) TERR.push(o); });
const LOBBY = new THREE.Group(); scene.add(LOBBY); LOBBY.visible = false;
ROOMS.lobby = "Lobby"; LM.lobby = MAT.light.clone(); roomLights.lobby = []; lightsOn.lobby = false;
{
  const g = LOBBY, w3 = (p) => new THREE.Vector3(-p.x, p.z, p.y), lp = (z, th, o = 0) => w3(ringPoint(z, th, o));
  const poly = (z, off) => Array.from({ length: 144 }, (_, i) => lp(z, (2 * Math.PI * i) / 144, off));
  const lobbyFloorMat = new THREE.MeshStandardMaterial({ map: marbleTex([0.2, 0.2]), roughness: 0.07, metalness: 0.08, envMapIntensity: 1.2 });
  const shapeMesh = (z, off, mat, flip) => { const pts = poly(z, off), s = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, -p.z))); const gm = new THREE.ShapeGeometry(s); gm.rotateX(-Math.PI / 2); const m = new THREE.Mesh(gm, mat); m.position.y = z; if (flip) m.rotation.x = Math.PI; m.receiveShadow = true; g.add(m); return m; };
  // floor + ceiling as a fan from the tower axis (the outline is star-shaped, so a fan never mis-triangulates, unlike the earlier polygon fill)
  const fanMesh = (z, off, mat) => { const pts = poly(z, off), n = pts.length, pos = [0, z, 0]; pts.forEach((p) => pos.push(p.x, z, p.z)); const idx = []; for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + ((i + 1) % n)); const gm = new THREE.BufferGeometry(); gm.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); gm.setIndex(idx); gm.computeVertexNormals(); const uv = []; for (let i = 0; i < pos.length; i += 3) uv.push(pos[i] / 5, pos[i + 2] / 5); gm.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); const m = new THREE.Mesh(gm, mat); m.receiveShadow = true; g.add(m); return m; };
  const floorM = fanMesh(0.03, -0.1, lobbyFloorMat); floorM.material.side = THREE.DoubleSide; const ceilM = fanMesh(9.04, -0.1, new THREE.MeshStandardMaterial({ color: 0xf3efe8, roughness: 0.9, side: THREE.DoubleSide }));
  // marble inlay rings
  for (const r of [10.5, 17.5]) { const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.12, 96), new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 1, roughness: 0.25 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.045; g.add(m); }
  // central lift core, clad in dark marble with bronze fins and three lift portals
  // the structural core on its TRUE outline for floor 1 (three wings, radius 6.1-11.4 m), clad in dark marble; stops just under the ceiling (a full-height core was coplanar with it and flickered)
  const CORE1 = makeOutline(1), cAt = (adeg, off = 0) => { const r = CORE1.coreR(adeg * Math.PI / 180) + off; return [Math.cos(adeg * Math.PI / 180) * r, Math.sin(adeg * Math.PI / 180) * r]; };
  { const N = 180, pts = Array.from({ length: N }, (_, i) => cAt((i / N) * 360)), pos = [], idx = [], cap = [0, 8.96, 0]; pts.forEach(([x, z]) => pos.push(x, 0, z, x, 8.96, z)); for (let i = 0; i < N; i++) { const j = (i + 1) % N; idx.push(i * 2, j * 2, i * 2 + 1, i * 2 + 1, j * 2, j * 2 + 1); }
    const gm = new THREE.BufferGeometry(); gm.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); gm.setIndex(idx); gm.computeVertexNormals(); const side = new THREE.Mesh(gm, new THREE.MeshStandardMaterial({ color: MAT.marbleDark.color, roughness: 0.25, metalness: 0.1, map: MAT.marbleDark.map || null, side: THREE.DoubleSide })); side.userData.core = true; g.add(side);
    const cp = [0, 8.96, 0]; pts.forEach(([x, z]) => cp.push(x, 8.96, z)); const ci = []; for (let i = 0; i < N; i++) ci.push(0, 1 + i, 1 + ((i + 1) % N)); const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(cp, 3)); cg.setIndex(ci); cg.computeVertexNormals(); const capM = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: 0x2a2523, roughness: 0.6, side: THREE.DoubleSide })); capM.userData.core = true; g.add(capM); }
  for (let i = 0; i < 72; i++) { const A = (i / 72) * 360, [x, z] = cAt(A, 0.16), m = box(g, 0.18, 9, 0.4, MAT.brass, x, 0, z, -(A * Math.PI / 180) + Math.PI / 2); m.userData.core = true; }
  for (const A of [0, 120, 240]) { const [x, z] = cAt(A, 0.12), m = box(g, 4.4, 0.35, 0.2, new THREE.MeshStandardMaterial({ color: 0xffe3b8, emissive: 0xffc27a, emissiveIntensity: 1.5 }), x, 2.9, z, -(A * Math.PI / 180) + Math.PI / 2); m.material = LM.lobby; m.userData.core = true; }
  // curved reception desk on the entrance (south) side
  for (let k = 0; k < 11; k++) { const a = (-150 + k * 12) * Math.PI / 180, R = 13.2, x = Math.cos(a) * R, z = Math.sin(a) * R, rot = -(a + Math.PI / 2); box(g, 2.7, 1.12 + 0.002 * k, 0.9, MAT.marbleDark, x, 0, z, rot); box(g, 2.9, 0.06, 1.15, MAT.marble, x, 1.17 + 0.004 * k, z, rot); }
  { const m = new THREE.Mesh(new THREE.TorusGeometry(13.2, 0.04, 8, 90, 2.1), LM.lobby); m.rotation.x = Math.PI / 2; m.rotation.z = -150 * Math.PI / 180; m.position.y = 0.3; g.add(m); }
  for (let k = 0; k < 4; k++) { const A = -120 + k * 20, a = A * Math.PI / 180, rot = Math.PI / 2 - a, [bx, bz] = cAt(A, 0.12), [px, pz] = cAt(A, 0.24); const fr = box(g, 1.5, 2.5, 0.22, MAT.brass, bx, 0.9, bz, rot); fr.userData.core = true; const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.1), new THREE.MeshStandardMaterial({ map: artTex(["#e8d5b5", "#2b4a6b", "#c9a25a", "#7a8f6a"][k], "#1c2b3a", "#f4efe6"), roughness: 0.6 })); pic.position.set(px + Math.cos(a) * 0.1, 2.1, pz + Math.sin(a) * 0.1); pic.rotation.y = rot; pic.userData.core = true; g.add(pic); }
  // lounge groups on the sea (north) side
  const lounge = (cx, cz, ry, mat) => { const s = local(g, cx, cz, ry); rbox(s, 3.4, 0.28, 1.0, 0.06, MAT.fabricGrey, 0, 0.06, 0); for (let i = 0; i < 3; i++) rbox(s, 1.06, 0.2, 0.92, 0.08, mat, -1.12 + i * 1.12, 0.32, 0.02); for (let i = 0; i < 3; i++) { const b = rbox(s, 1.06, 0.5, 0.22, 0.09, mat, -1.12 + i * 1.12, 0.5, -0.4); b.rotation.x = -0.14; } rbox(s, 0.26, 0.6, 1.0, 0.1, MAT.fabricGrey, -1.82, 0.06, 0); rbox(s, 0.26, 0.6, 1.0, 0.1, MAT.fabricGrey, 1.82, 0.06, 0); };
  for (const [a, mat] of [[62, MAT.fabric], [90, MAT.fabricSage], [118, MAT.fabric]]) { const r = 16.4, ar = a * Math.PI / 180, cx = Math.cos(ar) * r, cz = Math.sin(ar) * r; lounge(cx, cz, -(ar - Math.PI / 2) + Math.PI, mat); const ix = Math.cos(ar) * (r - 2.7), iz = Math.sin(ar) * (r - 2.7); cyl(g, 0.6, 0.6, 0.05, MAT.marble, ix, 0.33, iz, 40); cyl(g, 0.22, 0.34, 0.33, MAT.brass, ix, 0.0, iz, 24); rbox(g, 4.4, 0.025, 3.2, 0.01, MAT.rug, ix, 0.035, iz, -(ar - Math.PI / 2)); }
  for (const a of [28, 152, 208, 332]) { const ar = a * Math.PI / 180; plant(g, Math.cos(ar) * 20, Math.sin(ar) * 20, 1.8, 2.8); }
  // chandelier above the lounge: tiers of glowing globes
  for (let k = 0; k < 28; k++) for (let lvl = 0; lvl < 4; lvl++) { const a = (k / 28) * 6.283 + lvl * 0.2, r = 1.4 + lvl * 0.75; const s = sph(g, 0.1, MAT.light, Math.cos(a) * r, 7.4 - lvl * 0.95, 16 + Math.sin(a) * r); s.material = LM.lobby; }
  cyl(g, 0.04, 0.04, 2.0, MAT.brass, 0, 7.0, 16, 8); cyl(g, 0.6, 0.6, 0.06, MAT.brass, 0, 8.95, 16, 24);
  // ceiling cove light ring + downlights
  { const pts = poly(8.88, -1.2); const geo = new THREE.BufferGeometry().setFromPoints(pts); const l = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color: 0xffd9a0 })); g.add(l); for (let i = 0; i < 144; i += 4) { const p = pts[i]; const m = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.14), LM.lobby); m.position.set(p.x, 8.9, p.z); m.lookAt(0, 8.9, 0); g.add(m); } }
  for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 10 + ring * 6; i++) { const a = (i / (10 + ring * 6)) * 6.283, r = 9.5 + ring * 5; const m = cyl(g, 0.12, 0.12, 0.03, LM.lobby, Math.cos(a) * r, 8.9, Math.sin(a) * r, 16); }
  [[0, 3, -12], [0, 3, 14], [13, 3, 0], [-13, 3, 0], [0, 3, 0], [-10, 3, 16], [10, 3, 16], [-12, 3, -10], [12, 3, -10]].forEach(([x, y, z]) => { const p = warm(x, 6.5, z, 70, 22); roomLights.lobby.push(pointLights[pointLights.length - 1]); });
  // entrance side: bronze door frame and a welcome mat
  box(g, 7.4, 0.01, 3.4, new THREE.MeshStandardMaterial({ color: 0x4b3a2a, roughness: 1 }), 0, 0.03, -21.4);
}
const lobbyPick = tower.skinMesh;
const PHOTO = new THREE.Group(); scene.add(PHOTO); PHOTO.visible = false;
{ const tex = new THREE.TextureLoader().load(BURJ_PHOTO); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const D2 = 1100, Wp = 1560, Hp = Wp * (1068 / 1600); const m = new THREE.Mesh(new THREE.PlaneGeometry(Wp, Hp), new THREE.MeshBasicMaterial({ map: tex, fog: false, toneMapped: false, depthWrite: false })); m.rotation.y = Math.PI; m.position.set(14, 0.022 * Hp, 10 + D2); m.renderOrder = -5; PHOTO.add(m); }
const X = buildExtras({ rnd, TP, topZ, floorZ, canvasTex }); extrasAPI = X; [X.STREET, X.PARK, X.ELEV, X.POOLG, X.CROWD].forEach((g) => { g.visible = false; scene.add(g); });
const LAND = buildLandscape({ rnd, canvasTex, drive: X.driveCurve, makeCar: X.makeCar }); X.STREET.add(LAND.group);
// ---- floor 12 offices, floor 50 apartments, lift ride cabin
const KH = { box, rbox, cyl, sph, local, MAT, std, canvasTex, oakTex, marbleTex, rnd, plant, lamp, pillow, art, artTex };
const OFFICE = buildOffice(KH), APTS = buildApts(KH), PENT = buildPent(KH), LIFT = buildLift(KH);
[OFFICE, APTS, PENT].forEach((P) => { scene.add(P.g); P.g.visible = false; }); scene.add(LIFT.g); LIFT.g.visible = false;
const PLANS = { office: OFFICE, apts: APTS, pent: PENT };
planAPI = { night: (k) => { APTS.setNight(k); PENT.setNight(k); WELL && WELL.setPoolLights(k > 0.3 || WELL.poolManual); }, lights: (on) => { OFFICE.setAllLights(on); APTS.setAllLights(on); PENT.setAllLights(on); WELL && WELL.setAllLights(on); SKY && SKY.setAllLights(on); syncPlanButtons(); } };
// ---- amenity floors (wellness 10/11, sky restaurant 45): built the first time they are visited (lazy loading)
let WELL = null, SKY = null;
const addLabels = (mode, list) => list.forEach(([l, p, t, c]) => { const o = { l, M: [mode], p, t, c }; o.el = document.createElement("div"); o.el.className = "lbl"; o.el.textContent = t; o.el.style.setProperty("--c", c); document.getElementById("labels").appendChild(o.el); o.v = new THREE.Vector3(...p); LABELS.push(o); });
function ensureAmenity(m) {
  if (m === "wellness" && !WELL) { WELL = buildWellness(KH); WELL.g.visible = false; scene.add(WELL.g); WELL.poolManual = false; const T = (a, t, y) => { const q = WELL.O.polar(a * Math.PI / 180, t); return [q[0], y, q[1]]; };
    addLabels("wellness", [["names", T(270, 0.5, 3.9), "Reception + lifts", "#ffffff"], ["names", T(310, 0.5, 3.9), "Changing rooms", "#cfd3d8"], ["names", T(365, 0.55, 3.9), "Spa: treatment, sauna, steam", "#e3c48a"], ["names", T(82, 0.5, 7.2), "Indoor pool hall (double height)", "#7fe9ff"], ["names", T(158, 0.5, 7.2), "Gymnastics hall (double height)", "#8f9bff"], ["names", T(220, 0.5, 3.9), "Mobility lounge", "#ffffff"], ["names", T(290, 0.5, 7.9), "Weightlifting gym (level 11)", "#ffb347"], ["names", T(365, 0.7, 7.9), "Cardio (level 11)", "#ffb347"]]);
    buildPlanLightButtons(WELL, "lightbtnsW"); if (!Q.cfg.pointLights) { WELL.L10.setPointOK(false); WELL.L11.setPointOK(false); } }
  if (m === "sky" && !SKY) { SKY = buildSky(KH); SKY.g.visible = false; scene.add(SKY.g); const T = (a, t, y) => { const q = SKY.O.polar(a * Math.PI / 180, t); return [q[0], y, q[1]]; };
    addLabels("sky", [["names", T(130, 0.5, 3.9), "Main restaurant", "#ffffff"], ["names", T(219, 0.5, 3.9), "Café", "#e3c48a"], ["names", T(251, 0.5, 3.9), "VIP dining", "#ffb347"], ["names", T(45, 0.6, 3.9), "Host + lifts", "#ffffff"], ["names", T(280, 0.5, 3.9), "Restrooms", "#cfd3d8"], ["names", T(345, 0.5, 3.9), "Kitchen, prep, dish, storage", "#9aa6b8"]]);
    buildPlanLightButtons(SKY, "lightbtnsS"); if (!Q.cfg.pointLights) SKY.F.setPointOK(false); }
  if (state.lightsAuto) planAPI.lights(nightK > 0.3);
}
const AV = { // camera presets, computed from each floor's real outline (level 10 eye 1.7 m, level 11 eye 5.7 m)
  W: (a, t, y) => { const q = WELL.O.polar(a * Math.PI / 180, t); return [q[0], y, q[1]]; }, S: (a, t, y) => { const q = SKY.O.polar(a * Math.PI / 180, t); return [q[0], y, q[1]]; },
  well(n) { const P = this.W, V = { over: [[27, 44, 74], [27, 2, 27]], plan: [[27, 86, 27.1], [27, 0, 27]], gym: [P(236, 0.92, 5.9), P(300, 0.35, 4.9)], weights: [P(258, 0.62, 5.7), P(278, 0.2, 5.3)], gymnastics: [P(190, 0.9, 2.0), P(150, 0.45, 2.2)], spa: [P(334, 0.82, 1.8), P(342, 0.5, 1.4)], treat: [P(352, 0.55, 1.7), P(357.5, 0.78, 1.0)], pool: [P(124, 0.92, 1.9), P(70, 0.5, 0.2)], arrive: [P(270, 0.75, 1.7), P(270, 0, 1.5)] }; return V[n]; },
  sky(n) { const P = this.S, V = { over: [[27, 40, 70], [27, 0, 27]], plan: [[27, 80, 27.1], [27, 0, 27]], main: [P(66, 0.45, 1.9), P(125, 0.9, 1.4)], cafe: [P(197, 0.9, 1.8), P(222, 0.3, 1.3)], vip: [P(251, 0.14, 1.7), P(251, 0.62, 0.9)], pano: [P(98, 0.5, 1.7), (() => { const q = SKY.O.pt(133 * Math.PI / 180, SKY.O.edgeR(133 * Math.PI / 180) + 80); return [q[0], 6, q[1]]; })()], arrive: [P(47, 0.85, 1.7), P(47, 0, 1.5)] }; return V[n]; },
};
// lobby extras: security gates, flowers, welcome sign
{ const g = LOBBY; for (const x of [-2.6, 2.6]) { box(g, 0.25, 1.0, 1.6, MAT.brass, x, 0, -19.2); box(g, 0.05, 1.5, 0.9, MAT.glassTint, x * 0.55, 0, -19.2); }
  for (const x of [-7, 7]) { cyl(g, 0.35, 0.3, 0.9, MAT.whiteLac, x, 0, -18.5, 20); for (let k = 0; k < 9; k++) sph(g, 0.24, k % 2 ? MAT.leaf2 : MAT.fabricRust, x + Math.cos(k * 2) * 0.28, 1.25 + (k % 3) * 0.2, -18.5 + Math.sin(k * 2) * 0.28); }
  const wt = canvasTex(512, 96, (c, w, h) => { c.fillStyle = "rgba(0,0,0,0)"; c.fillRect(0, 0, w, h); c.fillStyle = "#f2e3c6"; c.font = "600 54px Georgia,serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("W E L C O M E", w / 2, h / 2); });
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 1.0), new THREE.MeshBasicMaterial({ map: wt, transparent: true })); sg.position.set(0, 3.9, -14.9); sg.rotation.y = Math.PI; g.add(sg); for (const x of [-2.4, 2.4]) { cyl(g, 0.02, 0.02, 4.6, MAT.brass, x, 4.4, -14.9, 6); } box(g, 5.7, 0.08, 0.1, MAT.brass, 0, 4.4, -14.93); box(g, 5.7, 0.08, 0.1, MAT.brass, 0, 3.4, -14.93); }

// ---------------------------------------------------------------- flow dots
const dots = new THREE.Group(); scene.add(dots);
flows.forEach((f) => {
  const n = Math.max(2, Math.round(f.len / 1.3));
  f.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(Math.max(0.03, f.r * 1.3), 8, 6), dotMat(0xffffff), n);
  f.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  const c = new THREE.Color(f.color).lerp(new THREE.Color(0xffffff), 0.55); for (let i = 0; i < n; i++) f.mesh.setColorAt(i, c);
  f.n = n; f.off = Math.random(); f.cum = [0]; for (let i = 1; i < f.pts.length; i++) f.cum.push(f.cum[i - 1] + f.pts[i].distanceTo(f.pts[i - 1]));
  dots.add(f.mesh); f.layer = f.group;
});
const tmpM = new THREE.Matrix4(), tmpV = new THREE.Vector3();
function updateFlow(t) {
  flows.forEach((f) => {
    if (!f.layer.visible) { f.mesh.visible = false; return; }
    f.mesh.visible = true;
    for (let i = 0; i < f.n; i++) {
      let u = ((i / f.n) + f.off + (state.flow ? t * f.speed * 0.22 / Math.max(1, f.len / 4) * f.dir : 0)) % 1; if (u < 0) u += 1;
      const d = u * f.len; let k = 1; while (k < f.cum.length - 1 && f.cum[k] < d) k++;
      const a = f.pts[k - 1], b = f.pts[k], seg = f.cum[k] - f.cum[k - 1] || 1, s = (d - f.cum[k - 1]) / seg;
      tmpV.copy(a).lerp(b, Math.min(1, Math.max(0, s))); tmpM.makeTranslation(tmpV.x, tmpV.y, tmpV.z); f.mesh.setMatrixAt(i, tmpM);
    }
    f.mesh.instanceMatrix.needsUpdate = true;
  });
}

// ---------------------------------------------------------------- fire demo particles
const circleTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
const FIREPT = new THREE.Vector3(23.3, 1.0, 0.5);
const flame = { n: 140, pos: new Float32Array(140 * 3), ph: Array.from({ length: 140 }, () => Math.random()) };
const flameGeo = new THREE.BufferGeometry(); flameGeo.setAttribute("position", new THREE.BufferAttribute(flame.pos, 3));
const flamePts = new THREE.Points(flameGeo, new THREE.PointsMaterial({ map: circleTex, color: 0xff8a1f, size: 0.5, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })); flamePts.visible = false; scene.add(flamePts);
const smokeN = 120, smokePos = new Float32Array(smokeN * 3), smokeGeo = new THREE.BufferGeometry(); smokeGeo.setAttribute("position", new THREE.BufferAttribute(smokePos, 3));
const smokePts = new THREE.Points(smokeGeo, new THREE.PointsMaterial({ map: circleTex, color: 0x555555, size: 1.1, transparent: true, opacity: 0.35, depthWrite: false })); smokePts.visible = false; scene.add(smokePts);
const demo = { on: false, t0: 0, heads: [], water: null };
const BANNER = [[0, "1  Fire starts on the hob: heat and smoke rise to the ceiling"], [2.5, "2  Smoke / heat detector sees it and signals the fire alarm panel (FACP)"], [4.5, "3  Panel sounds the sounders + strobes and alerts the building control room"], [6.5, "4  Heat melts the glass bulb of the nearest sprinklers: water sprays on the fire"], [9, "5  Water flow switch tells the panel; the fire brigade is called. Doors can be closed to contain smoke"]];
function startDemo() {
  demo.on = true; demo.t0 = performance.now() / 1000;
  state.fire = true; state.elec = state.water = state.sewer = state.ac = false; state.ceil = false; goView("fire"); apply();
  const near = fireHeads.map((h) => ({ h, d: Math.hypot(h.x - FIREPT.x, h.z - FIREPT.z) })).sort((a, b) => a.d - b.d).slice(0, 3).map((o) => o.h);
  demo.heads = near; const n = near.length * 70; const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3), life = new Float32Array(n);
  for (let i = 0; i < n; i++) life[i] = Math.random();
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  if (demo.water) scene.remove(demo.water);
  demo.water = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x8fd6ff, size: 0.07, transparent: true, opacity: 0.9, depthWrite: false })); demo.water.userData = { pos, vel, life }; demo.water.visible = false; scene.add(demo.water);
  document.getElementById("banner").style.display = "block"; document.getElementById("fireDemo").setAttribute("aria-pressed", "true");
}
function stopDemo() {
  demo.on = false; flamePts.visible = false; smokePts.visible = false; if (demo.water) demo.water.visible = false;
  fireDetectors.forEach((d) => { d.led.material.color.set(0x2cff6a); d.led.material.emissive.set(0x2cff6a); });
  fireStrobes.forEach((s) => (s.m.material.emissiveIntensity = 0.15)); fireHeads.forEach((h) => h.bulb.material.color.set(0xff2a2a));
  document.getElementById("banner").style.display = "none"; document.getElementById("fireDemo").setAttribute("aria-pressed", "false");
}
function updateDemo(t) {
  if (!demo.on) return; const e = t - demo.t0;
  flamePts.visible = true; smokePts.visible = e > 0.5; const fp = flame.pos;
  for (let i = 0; i < flame.n; i++) { const p = (flame.ph[i] + t * (0.9 + (i % 5) * 0.08)) % 1; fp[i * 3] = FIREPT.x + Math.sin(i * 12.9 + t * 3) * 0.28 * (1 - p); fp[i * 3 + 1] = FIREPT.y + p * 1.3; fp[i * 3 + 2] = FIREPT.z + Math.cos(i * 7.7 + t * 2.4) * 0.22 * (1 - p); }
  flameGeo.attributes.position.needsUpdate = true;
  for (let i = 0; i < smokeN; i++) { const p = ((i / smokeN) + t * 0.05 * (1 + (i % 3) * 0.3)) % 1, sp = Math.min(1, e / 6); smokePos[i * 3] = FIREPT.x + (p - 0.5) * 7 * sp + Math.sin(i) * 0.4; smokePos[i * 3 + 1] = 2.2 + Math.sin(i * 3.1) * 0.5 + p * 0.9; smokePos[i * 3 + 2] = FIREPT.z + 1.2 + p * 4 * sp; }
  smokeGeo.attributes.position.needsUpdate = true;
  const det = e > 2.5, strobe = e > 4.5, spr = e > 6.5;
  fireDetectors.forEach((d) => { const near = Math.hypot(d.x - FIREPT.x, d.z - FIREPT.z) < 7; const on = det && near && Math.floor(t * 4) % 2 === 0; d.led.material.color.set(det && near ? (on ? 0xff2020 : 0x550000) : 0x2cff6a); d.led.material.emissive.set(det && near ? (on ? 0xff2020 : 0x330000) : 0x2cff6a); });
  fireStrobes.forEach((s) => (s.m.material.emissiveIntensity = strobe ? (Math.floor(t * 6) % 2 ? 3 : 0.1) : 0.15));
  demo.heads.forEach((h) => h.bulb.material.color.set(spr ? 0x222222 : 0xff2a2a));
  if (demo.water) {
    demo.water.visible = spr; const { pos, vel, life } = demo.water.userData; const dt = 0.016;
    for (let i = 0; i < life.length; i++) {
      const h = demo.heads[Math.floor(i / 70)]; life[i] += dt * 0.9;
      if (life[i] >= 1) { life[i] = 0; pos[i * 3] = h.x; pos[i * 3 + 1] = 3.07; pos[i * 3 + 2] = h.z; const a = Math.random() * 6.283, s = 0.6 + Math.random() * 1.4; vel[i * 3] = Math.cos(a) * s; vel[i * 3 + 1] = -0.3; vel[i * 3 + 2] = Math.sin(a) * s; }
      vel[i * 3 + 1] -= 9.8 * dt; pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] = Math.max(0.02, pos[i * 3 + 1] + vel[i * 3 + 1] * dt); pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
    }
    demo.water.geometry.attributes.position.needsUpdate = true;
  }
  let msg = BANNER[0][1]; BANNER.forEach(([s, m]) => { if (e >= s) msg = m; }); document.getElementById("banner").textContent = msg;
}

// ---------------------------------------------------------------- state / UI
const state = { mode: "tower", furn: true, elec: false, water: false, sewer: false, fire: false, ac: false, xray: false, ceil: false, flow: true, mep: false, lightsAuto: true, struct: false, rebar: false, found: false, glass: false, rain: false, xrayT: false, grades: true, site: true, selFloor: 50, strike: false, elev: false, pair: false, pfire: false, pcars: true, poolsys: false, photo: false, names: true, sensors: false, blinds: false, level: 0, item: null };
state.eng = { sys: null, systems: [], floor: null, interior: false };
const DESC = {
  none: { t: "Furnished floor 49", p: "A sky penthouse level: open living, dining and kitchen facing the Gulf, master suite with walk-in and bath, guest suite, powder room, laundry and a terrace with plunge pool. The view looks toward the Burj Al Arab and the Jumeirah coast.", li: ["Time of day: drag the slider (sun rises in the east, sets in the west)", "Lights: switch rooms on or off; they come on by themselves at night", "Doors: click a door in the 3D view to open or close it", "Systems: electricity, water, sewage, fire safety, air-conditioning"] },
  elec: { t: "Electricity", c: "#ffc21a", p: "Power enters at the distribution boards in the two service risers, runs in trunking above the ceiling, then drops inside the walls to each switch and socket.", li: ["Yellow: lighting circuit, switches at 1.2 m", "Orange: socket circuits (0.3 m, 1.1 m in kitchen/bath)", "Red: dedicated heavy circuits (AC, hob, oven, washer)", "Blue box: smart-home / data hub in the foyer"] },
  water: { t: "Water", c: "#3d8bff", p: "Cold (blue) and hot (red) rise in the risers, run through wall cavities and the floor build-up, and rise to every tap, shower, cistern and appliance.", li: ["Hot-water cylinder in the laundry feeds the hot riser", "Round valves sit at each fixture for isolation", "Moving dots show the flow direction"] },
  sewer: { t: "Sewage", c: "#b07a3c", p: "Every fixture drains into the floor build-up with a 2% fall to a vertical soil stack in each riser. The stack continues down to the building drain; vent pipes go to the roof.", li: ["Brown: soil (toilets)", "Olive: waste (basins, showers, tub, sink, washer)", "Grey discs: floor traps and inspection points", "Pale thin pipe: ventilation stack"] },
  fire: { t: "Fire safety", c: "#ff4a4f", p: "Detectors sense smoke or heat and tell the fire alarm panel. The panel sounds alarms and calls the control room. Heat bursts a sprinkler bulb and water from the wet riser puts out the fire.", li: ["Wet fire riser + floor control valve with flow switch", "Sprinkler heads (red glass bulb) on red pipes above the ceiling", "Smoke detectors (white), heat detector over the kitchen (orange), magenta signal loop to the panel", "Fire alarm control panel (FACP), manual call points, sounder + strobe", "Hose reel cabinet, extinguishers, green exit sign", "Press 'Fire demo' to see it work in the kitchen"] },
  photo: { t: "Real Burj Al Arab view", c: "#f2c98a", p: "The window view is a real photograph of the Burj Al Arab at sunset, placed on the horizon beyond the terrace. Look out of the glass toward the sea. Everything inside is still the 3D model.", li: ["Time is set to sunset to match the photo", "Press the button again to return to the 3D Dubai view", "" + BURJ_CREDIT] },
  pool: { t: "Glass swimming pool", c: "#7fe9ff", p: "A raised pool with three glass walls and an infinity edge on the sea side. It sits on a reinforced-concrete trough carried by beams that run back to the core. At night its glass tiles and underwater LEDs light up.", li: ["Water is pulled from the main drain and the overflow channel into a balance tank", "A pump pushes it through the filters, the heat pump and the UV / chlorine unit, then back through the return jets", "Make-up water tops up the tank; the glass is laminated low-iron glass", "Use the time slider to see the pool at night"] },
  ac: { t: "Air-conditioning", c: "#25d9e8", p: "Chilled water from the tower's central plant rises in the risers to a fan-coil unit (FCU) above the ceiling in each zone. The FCU cools the air and blows it through ducts to ceiling diffusers; room air returns through a grille.", li: ["Cyan pipes: chilled-water supply; orange: return", "Grey boxes: fan-coil units, with supply ducts to diffusers", "Green: condensate drain into the soil stack", "Purple: thermostat wiring to each FCU", "No outdoor unit on this floor: the plant is central"] },
};
const gradeHex = (c) => "#" + c.toString(16).padStart(6, "0");
const GRT = `<table>${tower.GRADES.map((g) => `<tr><td><span class="sw" style="background:${gradeHex(g.col)}"></span>${g.name}</td><td>floors ${g.from}–${g.to}</td></tr>`).join("")}</table>`;
const DT = {
  none: { t: "The building", p: "50 floors: a 205 m glass shaft plus a 32 m crown and 28 m spire. A tri-lobed plan that tapers and twists 96° with 72 bronze fins and curved balconies on floors 22–46. Hover the glass to find a floor and click to select it.", li: ["Click floor 12 for the offices, 49 for the sky penthouse, 50 for the three apartments", "Click the bottom glass (or the Lobby button) to enter the lobby", "Turn on Concrete, Iron, Foundation or Glass layers to look inside", "Try the Rain test and the Thunder strike", "Zones: lobby (1), offices (2–20), residences (21–46), penthouses (47–50). Floor 50 = three apartments, each with its own glass pool"] },
  struct: { t: "Concrete", c: "#b9bdc4", p: "A buttressed reinforced-concrete core (three wings, like a Y) carries the wind loads and holds the lifts, stairs and risers. 18 perimeter columns follow the twist, and every floor is a post-tensioned flat slab. Two steel outrigger levels tie the core to the columns.", li: ["Concrete is stronger (higher grade) at the base and lighter at the top", "Steel outrigger + belt trusses (blue) at floors 20 and 35", "Gulf-coast mix: sulphate-resisting cement with fly-ash or slag, low permeability, thick cover over the iron", "Colours show the grade by height (toggle in Display)"] , extra: GRT },
  rebar: { t: "Iron (reinforcing steel)", c: "#ff7a2a", p: "Concrete is strong when pressed but weak when pulled, so it is reinforced with ribbed steel bars (orange). Dense vertical bars and ties sit inside the core walls and columns; each slab has a top and bottom mesh; the raft has a heavy double mat.", li: ["Select any floor to see its slab mat (two layers of bars)", "Ties (hoops) every floor keep the vertical bars from buckling", "Near the sea, bars get extra cover and corrosion protection", "The same steel also forms the lightning cage (see Thunder strike)"] },
  found: { t: "Foundation", c: "#9aa0a8", p: "A thick reinforced-concrete raft sits on deep bored piles that carry the whole weight into the ground. Pour cooling and low-heat cement stop the thick raft from cracking while it cures.", li: ["Raft about 4 m thick", "About 150 piles, 1.5 m wide, 46 m deep (concept numbers)", "Ground is made see-through so you can look under it"] },
  glass: { t: "Glass layers", c: "#6fb8ff", p: "The tower wears a unitized glass wall. The exploded panel in front of floor 50 shows its layers. The outer lite, the sealed cavity and the laminated inner lite keep the sun, the rain and the wind out.", li: ["1  Outer 8 mm tempered glass with a blue low-E coating (cuts heat)", "2  16 mm argon-filled cavity, sealed with a warm-edge spacer", "3  Inner 6+6 mm laminated glass: a PVB film holds it together if hit", "Bronze aluminium frame: rain-screen with drained, pressure-equalised joints and EPDM seals", "Gaps at each slab edge are fire-stopped"] },
  rain: { t: "Rain test", c: "#35d4ff", p: "Rain runs down the glass and fins and is caught at the slab-edge drain channel on every floor (cyan lines), then flows down inside the wall. The sealed joints stop water getting in; roof and podium drains lead to storm-water tanks.", li: ["Glass is slightly hydrophobic so water sheets off", "Pressure-equalised joints: wind cannot push rain through", "Balcony slabs fall away from the glass"] },
  elev: { t: "Elevators", c: "#ffd36a", p: "Five lift shafts run inside the concrete core: two express lifts, two mid-rise lifts and one service / fire-fighting lift that also serves the car park. Cars are shown at real speed with their live speed and floor.", li: ["Express A + B: 8 m/s, lobby to floor 50 in about 33 s", "Mid-rise: 6 m/s · Service + fire-fighting: 4 m/s (goes down to the car park)", "Ropes run to the machine room at the top; a counterweight (grey) moves the other way", "Safety: overspeed governor, brakes on the rails, buffers in the pit, battery lowering in a power cut", "Destination dispatch groups passengers going to the same floors"] },
  strike: { t: "Thunder strike", c: "#9aa8ff", p: "Lightning hits the highest metal point (the spire tip). The building is a Faraday cage: the current runs down dedicated conductors bonded to the steel and rebar, not through the rooms, and goes into the earth.", li: ["Air terminal: the spire tip", "Crown ring shares the current between 6 down conductors", "Green boxes: surge protectors on each floor's electrical board", "Earth ring and foundation piles spread the current into the ground", "Press the button again to reset"] },
};
const infoEl = document.getElementById("info");
function floorCard(f) { const g = tower.GRADES.find((x) => f >= x.from && f <= x.to); const y = f === 1 ? "0–9 m" : `${floorZ(f).toFixed(0)}–${(floorZ(f) + TP.floorH).toFixed(0)} m`; return `<h2>Floor ${f} · ${zoneOf(f)}</h2><p>Height ${y}. Structure here: concrete ${g.name}${[20, 21, 35, 36].includes(f) ? "; steel outrigger level nearby" : ""}.${f === 50 ? " Press 'Go to this floor' to enter the three sky apartments." : f === 49 ? " Press 'Go to this floor' to enter the sky penthouse." : f === 12 ? " Press 'Go to this floor' to enter the office floor." : f === 1 ? " Press 'Go to this floor' to enter the lobby." : " This demo has furnished interiors for floors 1, 12, 49 and 50."}</p>`; }
const poolFacts = () => { const i = extrasAPI.poolInfo; return `<table><tr><td>Size</td><td>${i.L} × ${i.W.toFixed(1)} m, ${i.depth} m deep</td></tr><tr><td>Water</td><td>about ${i.volume.toFixed(0)} m³ (${(i.volume * 1000).toFixed(0)} litres)</td></tr><tr><td>Glass</td><td>${i.glassThk}</td></tr><tr><td>Concrete</td><td>about ${i.concrete} m³ (slab, kerb, beams)</td></tr><tr><td>Rebar</td><td>about ${i.rebarT} t (≈110 kg per m³)</td></tr><tr><td>Load</td><td>about ${i.weightT} t on the floor beams</td></tr></table>`; };
const officeInfo = () => { const ft = OFFICE.P.O.area(); return `<h2>Floor 12 · Office floor</h2><p>A multi-tenant floor on the tower's <b>true twisted outline</b> for floor 12 (plate ${Math.round(ft.plate)} m², ${Math.round(ft.net)} m² around the core). The lift lobby and building reception face the entrance side; a corridor ring follows the core to four tenants and the business lounge, each about 60° of the plate.</p>${kvTable(OFFICE.tenants.map((t) => [t[0], t[1] + " · " + t[3]]))}<ul>${OFFICE.tenants.map((t) => `<li><b>${t[0]}</b>: ${t[2]}</li>`).join("")}<li>Four lifts: A, B express to floor 50 (8 m/s); C, D serve the office floors</li><li>Click any door to open or close it; the light buttons switch every room</li><li>'Show behind the walls' reveals electricity, water, sewage, fire safety, air-con, sensors and window blinds (routing is illustrative)</li></ul>${CONCEPT}${mepInfo()}`; };
const aptsInfo = () => { const U = APTS.units, ft = APTS.P.O.area(); return `<h2>Floor 50 · Three sky residences</h2><p>The last floor holds <b>3 apartments</b> around a private lift lobby on the south (entrance) side, laid out on the tower's <b>true twisted outline</b> for floor 50 (plate ${Math.round(ft.plate)} m², ${Math.round(ft.net)} m² around the core): a 3-bedroom (west and north-west), a 1-bedroom (south) and a 2-bedroom (east). Each has its own terrace and glass pool projecting about ${TERRACE_D} m beyond the glass line (approved architectural projections).</p>${kvTable(U.map((u) => [u.name.replace(" residence", ""), `${u.area} · ${u.baths} bath${u.baths > 1 ? "s" : ""} · terrace ${u.terrace} · pool ${u.pool.info.L} × ${u.pool.info.W.toFixed(1)} m`]))}<ul><li>The residents' lifts open into a private lobby: one door to the 3-bedroom, one to the 2-bedroom and one to the 1-bedroom</li><li>Rooms sit in three bands: service (kitchen, baths, dressing) beside the core, a hall ring, then bedrooms and living rooms at the glass</li><li>Press 'Pool systems' to see tank, pump, filter, heat pump and UV unit of each pool</li><li>Slide the time to night to see the pools glow</li><li>'Show behind the walls' reveals electricity, water, sewage, fire safety, air-con, sensors and window blinds (routing is illustrative)</li></ul>${CONCEPT}${mepInfo()}${state.poolsys ? `<h2 style="color:#7fe9ff">Pool facts</h2>${U.map((u) => `<h2 style="font-size:13px">${u.name}</h2>` + poolTable(u.pool.info)).join("")}` : ""}`; };
const PD = { elec: ["Electricity", "#ffc21a", "Power enters at the distribution boards in the core risers, runs in ceiling trunking to each room, then drops inside the walls to sockets (orange) and switches (yellow)."], water: ["Water", "#3d8bff", "Cold (blue) and hot (red) pipes rise in the core, run in the floor build-up and rise to every basin, shower, tub, WC and kitchen sink, each with an isolation valve."], sewer: ["Sewage", "#b07a3c", "Every fixture drains with a 2% fall to a vertical soil stack in the core (brown = toilets, olive = basins, showers, sinks). A vent pipe goes to the roof."], fire: ["Fire safety", "#ff4a4f", "Wet fire riser and floor valve feed red sprinkler pipes above the ceiling; heads (red bulbs) in every room, smoke detectors (white), manual call points and green exit signs at the doors, an alarm panel and hose reel at each riser."], ac: ["Air-conditioning", "#25d9e8", "Chilled water (cyan supply, orange return) from the central plant feeds a fan-coil unit above each room's ceiling; ducts blow cool air through diffusers and the room air returns through a grille. Thermostats are on the walls, condensate drains to the stack."], sensors: ["Sensors", "#b47cff", "Presence sensors (purple domes) switch lights and AC, CO₂ + temperature sensors (teal) watch air quality, blue discs are water-leak sensors at the wet fixtures, orange contacts watch terrace and window doors, and card readers (cyan) sit at the tenant entrances."], blinds: ["Windows + blinds", "#f2c98a", "The floor-to-ceiling glass is a double-glazed low-E unit (8 mm tempered + 16 mm argon cavity + 6+6 mm laminated) in bronze frames with hinged glass doors. Roller blinds (shown at 70%) cut glare and heat."] };
const mepInfo = () => ["elec", "water", "sewer", "fire", "ac", "sensors", "blinds"].filter((k) => state[k]).map((k) => `<h2 style="color:${PD[k][1]}">${PD[k][0]}</h2><p>${PD[k][2]}</p>`).join("");
const CONCEPT = `<p style="color:#ffb347;font-size:12px">Conceptual visualization: structural and building-services feasibility (floor openings, pool loads, sauna/steam services, kitchen exhaust, suspended equipment) is not verified.</p>`;
const wellInfo = () => `<h2>Floors 10 + 11 · Azure Wellness &amp; Fitness Club</h2><p>A two-level club built on the tower's real twisting outline (plate about 1,565 m², about 1,377 m² around the core). Level 10 holds reception, changing rooms, the spa, a double-height pool hall and a double-height gymnastics hall; level 11 holds the weightlifting gym and cardio, wrapped around the two voids behind a glass balustrade.</p>${kvTable([["Gym (level 11)", "6 squat racks + platforms, benches, 3 dumbbell racks, 2 cable stations, leg presses, 6 machines"], ["Cardio", "8 treadmills, 6 bikes, 4 rowers"], ["Gymnastics hall", "mats, rings rigs, pull-up rigs, plyo boxes (8 m clear height)"], ["Spa", "reception, 4 treatment rooms, relaxation lounge, sauna, steam"], ["Pool", "17 × 6.5 m, 1.5 m deep, caustics + animated water"]])}<ul><li>Click a piece of equipment for its details; click doors to open them</li><li>Level buttons show level 10, level 11 or both</li><li>The two double-height voids need part of the floor 11 slab removed: needs structural approval</li></ul>${CONCEPT}${state.item ? `<h2 style="color:#ffb347">${state.item.name}</h2><p>${state.item.info}</p>` : ""}`;
const skyInfo = () => `<h2>Floor 45 · Azure Sky Restaurant &amp; Café</h2><p>About 660 m² of a net 739 m² on the real outline: main restaurant (about 90 seats), café, VIP room, host, restrooms and a back-of-house kitchen with prep, dishwashing and storage beside the core and service lift.</p><ul><li>Panoramic glass faces the sea and the Burj Al Arab direction; use the time buttons for sunset and night</li><li>Click tables, counters and kitchen equipment for details; click doors to open them</li><li>'Decorative lights' switches pendants and cove lighting</li></ul>${CONCEPT}${state.item ? `<h2 style="color:#ffb347">${state.item.name}</h2><p>${state.item.info}</p>` : ""}`;
const poolTable = (i) => `<table><tr><td>Size</td><td>${i.L} × ${i.W.toFixed(1)} m, ${i.depth} m deep</td></tr><tr><td>Water</td><td>about ${i.volume.toFixed(0)} m³</td></tr><tr><td>Concrete</td><td>about ${i.concrete} m³ · rebar about ${i.rebarT} t</td></tr><tr><td>Load</td><td>about ${i.weightT} t on the floor beams</td></tr></table>`;
const kvTable = (rows) => `<table>${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("")}</table>`;
function parkInfo() { return `<h2>Underground car park</h2><p>Three levels (B1–B3) under the tower and plaza, about 200 × 170 m, with roughly 1,300 bays. The street drops into a ramp at the east side, runs down past B1 and B2 to B3, and everyone reaches the lobby by the core lifts and stairs.</p><ul><li>Turn on Air flow to see fresh air come in and exhaust go out</li><li>Turn on Fire + sensors to see sprinklers, detectors and CO sensors</li><li>Press 'Car-park fire demo' to see the system react</li></ul>${state.pair ? `<h2 style="color:#39b3ff">Air flow</h2><p>Four supply shafts (blue) bring fresh air in at the plaza edge and feed ducts at every level. Jet fans keep air moving along the aisles. Four exhaust shafts (orange) with roof fans push car fumes out. CO sensors speed the fans up when fumes build up.</p>` : ""}${state.pfire ? `<h2 style="color:#ff4a4f">Fire + sensors</h2><p>Sprinklers (red heads on red pipes) cover every aisle, smoke and heat detectors (white) watch the ceiling, green sensors read carbon monoxide, and alarm strobes and hose reels sit at the lift lobby and stairs. In a fire, the jet fans push smoke toward the exhaust shafts.</p>` : ""}`; }
function renderInfo() {
  let h = "";
  if (state.mode === "park") h = parkInfo(); else if (state.mode === "office") h = officeInfo(); else if (state.mode === "apts") h = aptsInfo(); else if (state.mode === "pent") h = pentInfo(); else if (state.mode === "wellness") h = wellInfo(); else if (state.mode === "sky") h = skyInfo(); else if (state.mode === "lift") h = ""; else if (state.mode === "floor") { const keys = [...LAYERS.filter((k) => state[k]), ...(state.poolsys ? ["pool"] : []), ...(state.photo ? ["photo"] : [])]; const render = (k) => `<h2${DESC[k].c ? ` style="color:${DESC[k].c}"` : ""}>${DESC[k].t}</h2><p>${DESC[k].p}</p><ul>${DESC[k].li.map((x) => `<li>${x}</li>`).join("")}</ul>${k === "pool" ? poolFacts() : ""}`; h = keys.length ? keys.map(render).join("") : render("none"); }
  else if (state.mode === "lobby") h = `<h2>Lobby</h2><p>A double-height (9 m) arrival hall inside the tower's ground ring: marble floor with bronze inlay, a dark-marble lift core with bronze fins, a curved reception desk, three lounges facing the Gulf and a tiered chandelier.</p><ul><li>The glass wall is the same lobby glazing as the exterior</li><li>Use the time slider to see it by day and by night</li><li>Switch the lobby lights from the left panel</li></ul>`;
  else { const keys = ["struct", "rebar", "found", "glass", "rain", "elev"].filter((k) => state[k]); if (state.strike) keys.push("strike"); const r = (k) => `<h2${DT[k].c ? ` style="color:${DT[k].c}"` : ""}>${DT[k].t}</h2><p>${DT[k].p}</p><ul>${DT[k].li.map((x) => `<li>${x}</li>`).join("")}</ul>${DT[k].extra || ""}`; h = (keys.length ? keys.map(r).join("") : r("none")) + (state.selFloor ? floorCard(state.selFloor) : ""); }
  infoEl.innerHTML = h + `<span class="tag">fictional concept</span><span class="tag">illustrative details</span>`;
}
const SPIRE = new THREE.Vector3(0, tower.TOP + TP.crown + TP.spire, 0), w3b = (p) => new THREE.Vector3(-p.x, p.z, p.y);
const LABELS = [
  { l: "elec", p: [9, 1.9, 0.3], t: "Main distribution board", c: "#ffc21a" }, { l: "elec", p: [27.2, 1.9, 0.3], t: "Sub-board", c: "#ffc21a" }, { l: "elec", p: [15, 2.3, 0.2], t: "Smart-home hub", c: "#2c8cff" }, { l: "elec", p: [20.5, 3.4, 8.2], t: "Ceiling trunking", c: "#ff4a3a" },
  { l: "water", p: [9, 4.4, 0.55], t: "Cold + hot risers", c: "#3d8bff" }, { l: "water", p: [27.1, 1.6, 2.7], t: "Hot-water cylinder", c: "#ff3b30" }, { l: "water", p: [4.1, 1.0, 0.0], t: "Basin taps", c: "#3d8bff" }, { l: "water", p: [20.5, 1.1, 0.0], t: "Kitchen sink", c: "#3d8bff" }, { l: "water", p: [22, 1.2, 12.2], t: "Guest shower", c: "#3d8bff" },
  { l: "sewer", p: [9.0, 4.4, 1.15], t: "Soil stack 1 → building drain", c: "#b07a3c" }, { l: "sewer", p: [27.15, 4.4, 1.0], t: "Soil stack 2 → building drain", c: "#b07a3c" }, { l: "sewer", p: [10.3, 4.9, 1.15], t: "Vent to roof", c: "#d3dae0" }, { l: "sewer", p: [6.9, -0.1, 0.5], t: "WC drain", c: "#b07a3c" }, { l: "sewer", p: [20.5, -0.12, 0.45], t: "Kitchen waste (2% fall)", c: "#a3a83a" },
  { l: "fire", p: [9.65, 4.4, 1.9], t: "Wet fire riser", c: "#ff4a4f" }, { l: "fire", p: [9.65, 2.8, 1.9], t: "Floor valve + flow switch", c: "#ff4a4f" }, { l: "fire", p: [16, 3.1, 13.5], t: "Sprinkler head", c: "#ff4a4f" }, { l: "fire", p: [13.5, 3.25, 3.5], t: "Smoke detector", c: "#ffffff" }, { l: "fire", p: [20.5, 3.25, 3.6], t: "Heat detector", c: "#ffa23a" },
  { l: "fire", p: [16.9, 2.0, 2.0], t: "Fire alarm panel (FACP)", c: "#35ff7a" }, { l: "fire", p: [7.84, 1.6, 12.4], t: "Manual call point", c: "#ff4a4f" }, { l: "fire", p: [13.5, 3.25, 6.4], t: "Sounder + strobe", c: "#ff4a4f" }, { l: "fire", p: [15.6, 1.8, 0.3], t: "Hose reel", c: "#ff4a4f" }, { l: "fire", p: [13.4, 2.85, 0.16], t: "Exit sign", c: "#20c060" }, { l: "fire", p: [24.8, 0.9, 5.0], t: "Fire extinguisher", c: "#ff4a4f" },
  { l: "ac", p: [16, 3.5, 16.5], t: "Fan-coil unit (FCU)", c: "#25d9e8" }, { l: "ac", p: [17.7, 3.35, 16.5], t: "Supply air diffuser", c: "#25d9e8" }, { l: "ac", p: [16, 3.35, 17.7], t: "Return air grille", c: "#ff9f1c" }, { l: "ac", p: [9.55, 4.4, 0.85], t: "Chilled-water supply", c: "#25d9e8" }, { l: "ac", p: [9.85, 4.1, 0.85], t: "Chilled-water return", c: "#ff9f1c" }, { l: "ac", p: [21.9, 1.7, 19.0], t: "Thermostat", c: "#b47cff" }, { l: "ac", p: [18, 3.2, 3], t: "Condensate drain → soil stack", c: "#4cd964" },
  // whole building
  { l: "struct", T: 1, p: [9, 40, 0], t: "Concrete core C80 (base grade)", c: "#cfd3d8" }, { l: "struct", T: 1, p: [9, 118, 0], t: "Core C70 → C60", c: "#cfd3d8" }, { l: "struct", T: 1, p: [8, 235, 0], t: "Core C50 (top)", c: "#cfd3d8" },
  { l: "struct", T: 1, p: w3b(ringPoint(floorZ(28) + 2, 1.1, -2.4)).toArray(), t: "Perimeter column", c: "#cfd3d8" }, { l: "struct", T: 1, p: w3b(ringPoint(floorZ(35) + 4, 2.2, -2.4)).toArray(), t: "Steel outrigger + belt truss", c: "#5aa0ff" }, { l: "struct", T: 1, p: w3b(ringPoint(floorZ(24) + 4, 4.0, -0.4)).toArray(), t: "Post-tensioned slab 300 mm", c: "#cfd3d8" },
  { l: "rebar", T: 1, p: [-7, 80, 7], t: "Rebar in core wall", c: "#ff7a2a" }, { l: "rebar", T: 1, p: w3b(ringPoint(floorZ(15) + 2, 5.0, -2.4)).toArray(), t: "Column cage + ties", c: "#ff7a2a" }, { l: "found", T: 1, p: [0, -2, 14], t: "Raft ~4 m thick", c: "#cfd3d8" }, { l: "found", T: 1, p: [12, -28, 8], t: "Bored piles 1.5 m × 46 m", c: "#cfd3d8" },
  { l: "strike", T: 1, p: SPIRE.toArray(), t: "Air terminal (spire tip)", c: "#ffe86a" }, { l: "strike", T: 1, p: [0, tower.TOP + 6, 0], t: "Crown ring", c: "#ffd84a" }, { l: "strike", T: 1, p: w3b(ringPoint(floorZ(26), 2.4, -2.4)).toArray(), t: "Down conductor (6)", c: "#fff2a8" }, { l: "strike", T: 1, p: [3.6, floorZ(30) + 2, 1.2], t: "Surge protector on every floor", c: "#35ff7a" }, { l: "strike", T: 1, p: [20, -1.4, 22], t: "Earth ring + piles", c: "#ffd84a" },
];
tower.facLabels.forEach((o) => LABELS.push({ l: "glass", T: 1, p: o.p.toArray(), t: o.t, c: "#9fd0ff" }));
LABELS.push({ l: "elev", M: ["tower", "park"], p: [0, 210.5, 0], t: "Machine room + overspeed governor", c: "#ffd36a" }, { l: "elev", M: ["tower", "park"], p: [0, -11.5, 0], t: "Pit + buffers", c: "#ffd36a" }, { l: "elev", M: ["tower", "park"], p: [3.9, 120, 0.6], t: "Counterweight", c: "#c9ced4" });
[[-60, 2, -97, "pair", "Fresh air in (supply shaft)", "#39b3ff"], [40, 2, 67, "pair", "Fresh air in (supply shaft)", "#39b3ff"], [-92, 8, -45, "pair", "Exhaust out: fumes + smoke (roof fan)", "#ff9a3a"], [102, 8, 62, "pair", "Exhaust out (roof fan)", "#ff9a3a"], [-30, -4.4, -26, "pair", "Jet fans move air along the aisle", "#39b3ff"], [0, -7.3, -26, "pair", "Supply duct (blue) · Exhaust duct (orange)", "#39b3ff"],
 [-48, -3.9, -26, "pfire", "CO sensor", "#35ff7a"], [-33, -4.0, -29, "pfire", "Sprinkler head", "#ff4a4f"], [-20, -3.9, -26, "pfire", "Smoke detector", "#ffffff"], [17, -2.4, 10, "pfire", "Alarm strobe + call point", "#ff4a4f"], [-17, -2.2, -10, "pfire", "Hose reel", "#ff4a4f"], [0, -2.0, 15.2, "pfire", "Fire-rated lift lobby door", "#ff4a4f"], [-60, -3.0, -74, "pcars", "Parking bays 2.6 × 5 m", "#e8eef5"], [92, -2, -100, "pcars", "Ramp 8% down to B3", "#e8eef5"], [92, 4, -124, "pcars", "Car park entrance", "#e8eef5"]].forEach(([x, y, z, l, t, c]) => LABELS.push({ l, M: ["park"], p: [x, y, z], t, c }));
(extrasAPI.poolLabels || []).forEach((o) => LABELS.push({ l: "poolsys", M: ["floor"], p: o.p, t: o.t, c: o.c }));
APTS.pools.forEach((P) => P.labels.forEach((o) => LABELS.push({ l: "poolsys", M: ["apts"], p: o.p, t: o.t, c: o.c }))); PENT.pools.forEach((P) => P.labels.forEach((o) => LABELS.push({ l: "poolsys", M: ["pent"], p: o.p, t: o.t, c: o.c })));
{ const OP = OFFICE.P, lp = (a, t) => { const [x, z] = OP.at(a, t); return [x, 3.95, z]; };
  [[lp(210, 0.7), "Medical center · CareFirst", "#2f8f6a"], [lp(150, 0.7), "IT company · NimbusTech", "#6ec8ff"], [lp(330, 0.7), "Trading office · Azure Trading Co.", "#e2c27a"], [lp(30, 0.7), "Real estate · Marina Realty", "#c98b5f"], [lp(90, 0.7), "Business lounge", "#ffffff"], [lp(270, 0.12), "Lifts A–D (express to floor 50)", "#ffd36a"], [lp(270, 0.7), "Building reception", "#ffffff"], [lp(330, 0.08), "Corridor ring + core", "#cfd3d8"]].forEach(([p, t, c]) => LABELS.push({ l: "names", M: ["office"], p, t, c })); }
{ const AP = APTS.P, lp = (a, t, y, d) => { const [x, z] = d === undefined ? AP.at(a, t) : AP.eat(a, d); return [x, y, z]; }, U = APTS.units;
  [[lp(160, 0.74, 3.95), `3-BEDROOM · ${U[0].area} + ${U[0].terrace} terrace`, "#e3c48a"], [lp(270, 0.7, 3.95), `1-BEDROOM · ${U[1].area} + ${U[1].terrace} terrace`, "#7fe9ff"], [lp(15, 0.7, 3.95), `2-BEDROOM · ${U[2].area} + ${U[2].terrace} terrace`, "#8f9bff"], [lp(270, 0.2, 3.95), "Private lift lobby", "#ffffff"], [lp(270, 0.02, 3.95), "Lifts + risers (core)", "#cfd3d8"], [lp(120, 0.2, 3.95), "Bathrooms + dressing (service band)", "#9aa6b8"],
    [lp(155, 0, 1.9, 1.95), "3BR glass pool 8.5 × 2.0 m", "#7fe9ff"], [lp(270, 0, 1.9, 1.95), "1BR glass pool 5.5 × 2.0 m", "#7fe9ff"], [lp(355, 0, 1.9, 1.95), "2BR glass pool 7 × 2.0 m", "#7fe9ff"]].forEach(([p, t, c]) => LABELS.push({ l: "names", M: ["apts"], p, t, c })); }
[["office", OFFICE], ["apts", APTS], ["pent", PENT]].forEach(([m, P]) => P.mepLabels.forEach((o) => LABELS.push({ l: o.l, M: [m], p: o.p, t: o.t, c: o.c })));
const labelBox = document.getElementById("labels");
LABELS.forEach((o) => { o.el = document.createElement("div"); o.el.className = "lbl"; o.el.textContent = o.t; o.el.style.setProperty("--c", o.c); labelBox.appendChild(o.el); o.v = new THREE.Vector3(...o.p); });
LABELS.push({ l: "rain", T: 1, p: [0, 0, 0], t: "", c: "#fff", el: document.createElement("div"), v: new THREE.Vector3() });

function setMat(group, fn) { group.traverse((m) => { if (m.isMesh) fn(m); }); }
const fadeCache = new Map();
function fade(group, op) { setMat(group, (m) => { const mats = Array.isArray(m.material) ? m.material : [m.material]; mats.forEach((mt) => { if (!fadeCache.has(mt)) fadeCache.set(mt, { t: mt.transparent, o: mt.opacity, w: mt.depthWrite }); const s = fadeCache.get(mt); mt.transparent = op < 1 || s.t; mt.opacity = op < 1 ? Math.min(s.o, op) : s.o; mt.depthWrite = op < 1 ? false : s.w; mt.needsUpdate = true; }); }); }
const LAYERS = ["elec", "water", "sewer", "fire", "ac"];
const anyMep = () => LAYERS.some((k) => state[k]);
let strikeStorm = 0; const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 9); renderer.localClippingEnabled = true;
function placeOut() {   // outside world (sea, skyline, Burj) placed for the floor we are on
  const m = state.mode, own = OUT.userData.own; let pos, dims = null;
  if (m === "office") pos = [13, 201 - floorZ(12), 17];
  else if (m === "apts") pos = [13, 201 - floorZ(50), 17]; else if (m === "pent") pos = [13, 201 - floorZ(49), 17];
  else if (m === "floor") { pos = [0, 0, 0]; dims = [W, D, 201]; }
  else if (m === "wellness") pos = [13, 201 - floorZ(10), 17];
  else if (m === "sky") pos = [13, 201 - floorZ(45), 17];
  else pos = [-14, 201, -10];
  OUT.position.set(...pos); own.visible = !!dims;
  if (dims) { const [pw, pd, e] = dims; own.scale.set(pw / W, (e - 0.5) / 200.5, pd / D); own.position.set(pw / 2 - pos[0], (-0.5 - e) / 2 - pos[1], pd / 2 - pos[2]); }
}
function apply() {
  const fl = state.mode === "floor", tw = state.mode === "tower", lb = state.mode === "lobby";
  document.body.dataset.mode = state.mode;
  const mep = (fl || state.mode === "office" || state.mode === "apts" || state.mode === "pent") && anyMep(); state.mep = mep; const xr = state.xray || mep;
  G.struct.visible = fl; G.walls.visible = fl; G.furn.visible = fl && (state.furn || mep); fade(G.furn, mep ? 0.08 : 1);
  [oakFloor, stoneFloor, deckMat].forEach((m) => { m.color.setScalar(mep ? 0.3 : 1); m.transparent = mep; m.opacity = mep ? 0.16 : 1; m.depthWrite = !mep; m.needsUpdate = true; });
  G.ceil.visible = fl && state.ceil; LAYERS.forEach((k) => (G[k].visible = fl && state[k]));
  fade(G.walls, xr ? 0.07 : 1); wallMat.depthWrite = !xr;
  G.struct.children.forEach((m) => { if (m.isMesh && (m.material === MAT.slab || m.material === MAT.concrete)) { m.material.transparent = mep; m.material.opacity = mep ? 0.1 : 1; m.material.depthWrite = !mep; m.material.needsUpdate = true; } });
  const strikeOn = state.strike;
  const pk = state.mode === "park"; tower.root.visible = tw || lb || pk; tower.G.skin.visible = true; X.STREET.visible = tw || lb || pk; X.CROWD.visible = tw || lb; X.PARK.visible = pk || (tw && state.found); X.air.visible = state.pair; X.fire.visible = state.pfire; X.PARK.userData.cars.forEach((m) => (m.visible = state.pcars)); X.ELEV.visible = (tw && state.elev) || pk; X.POOLG.visible = fl; X.poolSys.visible = fl && state.poolsys; renderer.clippingPlanes = pk ? [clipPlane] : [];
  tower.G.struct.visible = (tw && (state.struct || strikeOn)) || pk; tower.G.rebar.visible = tw && state.rebar; tower.G.found.visible = (tw && (state.found || strikeOn)) || pk; tower.G.raftRebar.visible = state.rebar; tower.G.facade.visible = tw && state.glass; tower.G.rain.visible = tw && state.rain; tower.G.site.visible = (tw || lb) && state.site && !state.found;
  tower.setGradeColors(state.grades); tower.setXray(tw && (state.xrayT || state.struct || state.rebar || state.found || strikeOn || state.elev)); tower.setWet(state.rain && tw);
  tower.clouds.visible = tw; tower.showSlabRebar(tw && state.rebar ? state.selFloor : 0);
  LOBBY.visible = lb;
  const of = state.mode === "office", ap = state.mode === "apts", pt = state.mode === "pent", lf = state.mode === "lift";
  OFFICE.g.visible = of; APTS.g.visible = ap; PENT.g.visible = pt; LIFT.g.visible = lf;
  { const wl = state.mode === "wellness", sk = state.mode === "sky"; if (WELL) { WELL.g.visible = wl; if (wl) { WELL.setLevels(state.level); WELL.L10.furn.visible = WELL.L11.furn.visible = state.furn; WELL.fade(state.xray ? 0.07 : 1); WELL.L10.ceil.visible = WELL.L11.ceil.visible = state.ceil; } } if (SKY) { SKY.g.visible = sk; if (sk) { SKY.furn.visible = state.furn; SKY.fade(state.xray ? 0.07 : 1); SKY.ceil.visible = state.ceil; } } }
  [[OFFICE, of], [APTS, ap], [PENT, pt]].forEach(([P, on]) => { P.mepOn = on; if (!on) return; P.furn.visible = state.furn || mep; fade(P.furn, mep ? 0.08 : 1); fade(P.floorG, mep ? 0.12 : 1); P.ceil.visible = state.ceil; P.fade(xr ? 0.07 : 1); LAYERS.forEach((k) => P.setMepLayer(k, state[k])); P.setMepLayer("sensors", state.sensors); P.setMepLayer("blinds", state.blinds); }); APTS.pools.forEach((P) => (P.SYS.visible = ap && state.poolsys)); PENT.pools.forEach((P) => (P.SYS.visible = pt && state.poolsys));
  geoApply(); intApply(tw);
  storm = Math.max(tw && state.rain ? 0.35 : 0, strikeStorm);
  const under = (tw && state.found) || pk; [sandMat, roadMat, seaMat].forEach((m) => { m.transparent = under; m.opacity = under ? 0.2 : 1; m.depthWrite = !under; m.needsUpdate = true; });
  scene.background = mep || pk || lf ? new THREE.Color(lf ? 0x090a0d : 0x10151c) : null; dome.visible = !mep && !pk && !lf; OUT.visible = !mep && !lf && !(fl && state.photo); PHOTO.visible = fl && state.photo; placeOut();
  scene.fog.density = mep || pk ? 0 : 0.00035; if (tw) scene.fog.density = 0.00022;
  setTime(hourNow);
  document.querySelectorAll("[data-layer]").forEach((b) => b.setAttribute("aria-pressed", String(!!state[b.dataset.layer])));
  document.querySelectorAll("[data-geo]").forEach((b) => b.setAttribute("aria-pressed", String(!!state.geo)));
  document.querySelectorAll("[data-t]").forEach((b) => b.setAttribute("aria-pressed", String(!!state[b.dataset.t])));
  document.querySelectorAll("#nav [data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));
  document.getElementById("allmep").setAttribute("aria-pressed", String(LAYERS.every((k) => state[k])));
  document.getElementById("lobbyLights").setAttribute("aria-pressed", String(!!lightsOn.lobby));
  renderInfo();
}
// ---------------- floor-50 controls (unchanged behaviour)
document.querySelectorAll("[data-layer]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.layer; const was = anyMep(); state[k] = !state[k]; if (k === "photo" && state.photo) { setTime(17.6); goView("photo"); } if (!was && anyMep()) goMep(); if (k === "fire" && !state.fire && demo.on) stopDemo(); apply(); }));
function goMep() { if (state.mode === "office") tweenTo([20, 46, 16], [20, 0, 14]); else if (state.mode === "apts" || state.mode === "pent") tweenTo([27, 46, 27.2], [27, 0, 27]); else goView("mep"); }
const allMep = () => { const on = !LAYERS.every((k) => state[k]); const was = anyMep(); LAYERS.forEach((k) => (state[k] = on)); state.sensors = on; if (!was && on) goMep(); apply(); };
document.getElementById("allmep").addEventListener("click", allMep); ["allmepO", "allmepA", "allmepP"].forEach((id) => document.getElementById(id).addEventListener("click", allMep));
document.getElementById("fireDemo").addEventListener("click", () => (demo.on ? (stopDemo(), apply()) : startDemo()));
const tsl = document.getElementById("tslider"); tsl.addEventListener("input", () => setTime(parseFloat(tsl.value)));
document.querySelectorAll("[data-time]").forEach((b) => b.addEventListener("click", () => setTime(parseFloat(b.dataset.time))));
document.querySelectorAll("[data-scene]").forEach((b) => b.addEventListener("click", () => { setTime(parseFloat(b.dataset.scene)); document.querySelectorAll("[data-scene]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }));
const lbox = document.getElementById("lightbtns");
Object.entries(ROOMS).filter(([k]) => k !== "lobby").forEach(([k, name]) => { const b = document.createElement("button"); b.textContent = name; b.dataset.room = k; b.setAttribute("aria-pressed", "false"); b.addEventListener("click", () => { state.lightsAuto = false; lightsOn[k] = !lightsOn[k]; applyLights(); syncLightButtons(); }); lbox.appendChild(b); });
function syncLightButtons() { lbox.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(!!lightsOn[b.dataset.room]))); const lb = document.getElementById("lobbyLights"); lb && lb.setAttribute("aria-pressed", String(!!lightsOn.lobby)); }
document.getElementById("lightsOn").addEventListener("click", () => { state.lightsAuto = false; Object.keys(lightsOn).forEach((k) => (lightsOn[k] = true)); applyLights(); syncLightButtons(); });
document.getElementById("lightsOff").addEventListener("click", () => { state.lightsAuto = false; Object.keys(lightsOn).forEach((k) => (lightsOn[k] = false)); applyLights(); syncLightButtons(); });
document.getElementById("lightsAuto").addEventListener("click", () => { state.lightsAuto = true; setTime(hourNow); });
document.getElementById("lobbyAuto").addEventListener("click", () => { state.lightsAuto = true; setTime(hourNow); });
document.getElementById("lobbyLights").addEventListener("click", () => { state.lightsAuto = false; lightsOn.lobby = !lightsOn.lobby; applyLights(); syncLightButtons(); });
document.getElementById("doorsOpen").addEventListener("click", () => { doors.forEach((d) => (d.target = 1)); slideTarget = 1; });
document.getElementById("doorsClose").addEventListener("click", () => { doors.forEach((d) => (d.target = 0)); slideTarget = 0; });
document.getElementById("slideDoor").addEventListener("click", toggleSlide);
// ---------------- whole-building controls
document.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.t; state[k] = !state[k]; if ((k === "struct" || k === "rebar") && state[k]) goViewT("struct"); if (k === "found" && state.found) goViewT("under"); if (k === "glass" && state.glass) goViewT("facade"); if (k === "rain" && state.rain) goViewT("podium"); apply(); }));
const slider = document.getElementById("floorSlider"), flabel = document.getElementById("flabel");
function selectFloor(f, move) { state.selFloor = f; slider.value = String(f); flabel.textContent = `Floor ${f}`; tower.highlight(f); tower.showSlabRebar(state.mode === "tower" && state.rebar ? f : 0); renderInfo(); if (move) { const y = f === 1 ? 4 : floorZ(f) + 2; tweenTo([110 + y * 0.12, y + 25, 190 + y * 0.35], [0, y, 0]); } }
slider.addEventListener("input", () => selectFloor(parseInt(slider.value, 10), true));
const FLOOR_MODE = { 1: "lobby", 10: "wellness", 11: "wellness", 12: "office", 45: "sky", 49: "pent", 50: "apts" };
const goToFloor = (f) => { selectFloor(f, false); if (FLOOR_MODE[f]) setMode(FLOOR_MODE[f]); else selectFloor(f, true); };
document.getElementById("floorGo").addEventListener("click", () => goToFloor(parseInt(slider.value, 10)));
document.getElementById("goLobby").addEventListener("click", () => setMode("lobby")); document.getElementById("goF50").addEventListener("click", () => setMode("apts")); document.getElementById("goF49").addEventListener("click", () => setMode("pent")); document.getElementById("goF12").addEventListener("click", () => setMode("office"));
document.querySelectorAll("#nav [data-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
// audio
let actx = null;
let thunderSound = function (delay) { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const sr = actx.sampleRate, mk = (dur, fn) => { const b = actx.createBuffer(1, Math.floor(dur * sr), sr), d = b.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { last = (last + 0.03 * (Math.random() * 2 - 1)) / 1.03; d[i] = fn(i / sr, last); } return b; };
  const crack = actx.createBufferSource(); crack.buffer = mk(0.35, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 14)); const hp = actx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900; const g1 = actx.createGain(); g1.gain.value = 0.7; crack.connect(hp).connect(g1).connect(actx.destination); crack.start(actx.currentTime + delay);
  const roll = actx.createBufferSource(); roll.buffer = mk(4.6, (t, l) => l * 6 * Math.exp(-t * 0.8) * (1 + 0.5 * Math.sin(t * 9))); const lp = actx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380; const g2 = actx.createGain(); g2.gain.value = 1.0; roll.connect(lp).connect(g2).connect(actx.destination); roll.start(actx.currentTime + delay + 0.25); } catch (e) { /* audio is optional */ } };
const bannerEl = document.getElementById("banner"), flashEl = document.getElementById("flash");
function startStrike() { state.strike = true; strikeStorm = 0.9; state.rebar = state.rebar; tower.startStrike(); thunderSound(0.9); goViewT("strike"); bannerEl.className = "t"; bannerEl.style.display = "block"; bannerEl.textContent = tower.steps[0][1]; document.getElementById("strikeBtn").setAttribute("aria-pressed", "true"); apply(); }
function stopStrike() { state.strike = false; strikeStorm = 0; tower.stopStrike(); bannerEl.style.display = "none"; bannerEl.className = ""; flashEl.style.opacity = "0"; document.getElementById("strikeBtn").setAttribute("aria-pressed", "false"); apply(); }
document.getElementById("strikeBtn").addEventListener("click", () => (state.strike ? stopStrike() : startStrike()));
// pick floors by clicking the glass
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(); let down = null; const hoverEl = document.getElementById("hover");
canvas.addEventListener("pointerdown", (e) => (down = [e.clientX, e.clientY]));
function pickFloor(e) { mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera); const h = ray.intersectObjects([tower.skinMesh, tower.lobbyGlass], false)[0]; return h ? floorOfY(h.point.y) : null; }
canvas.addEventListener("pointerup", (e) => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  if (state.mode === "tower") { if (ENGV && ENGV.group.visible) { mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera); showEngCard(ENGV.pick(ray)); return; } const f = pickFloor(e); if (f) { selectFloor(f, false); if (FLOOR_MODE[f]) setMode(FLOOR_MODE[f]); } return; }
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera);
  const AM = state.mode === "wellness" ? WELL : state.mode === "sky" ? SKY : null; const dm = AM ? AM.doorMeshes : state.mode === "office" ? OFFICE.doorMeshes : state.mode === "apts" ? APTS.doorMeshes : state.mode === "pent" ? PENT.doorMeshes : doorMeshes; const hit = ray.intersectObjects(dm, false)[0];
  if (!hit && AM) { let best = null, bd = 1e9; const tmp = new THREE.Vector3(); AM.items.forEach((it) => { if (ray.ray.intersectBox(it.box, tmp)) { const d = tmp.distanceTo(camera.position); if (d < bd) { bd = d; best = it; } } }); state.item = best; renderItem(); return; }
  if (!hit) return; if (hit.object.userData.slide) toggleSlide(); else { const d = hit.object.userData.door; d.target = d.target ? 0 : 1; }
});
canvas.addEventListener("pointermove", (e) => {
  if (state.mode === "tower") { const f = pickFloor(e); if (f) { tower.highlight(f); hoverEl.style.display = "block"; hoverEl.style.left = e.clientX + 14 + "px"; hoverEl.style.top = e.clientY + 14 + "px"; hoverEl.textContent = `Floor ${f} · ${zoneOf(f)}${FLOOR_MODE[f] ? " — click to enter" : " — click to select"}`; canvas.style.cursor = "pointer"; } else { tower.highlight(state.selFloor); hoverEl.style.display = "none"; canvas.style.cursor = "grab"; } return; }
  hoverEl.style.display = "none"; mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera); { const dm = state.mode === "office" ? OFFICE.doorMeshes : state.mode === "apts" ? APTS.doorMeshes : state.mode === "pent" ? PENT.doorMeshes : state.mode === "floor" ? doorMeshes : []; canvas.style.cursor = dm.length && ray.intersectObjects(dm, false).length ? "pointer" : "grab"; }
});

// camera presets
const fa = tower.facAnchor;
const VIEWS = {
  over: [[14, 25, 48], [14, 0, 7]], mep: [[14, 29, 33], [14, 0.3, 8]], plan: [[14, 46, 11], [14, 0, 10.9]], living: [[10.5, 1.7, 7.8], [18, 1.1, 16]], kitchen: [[18.2, 2.0, 6.6], [22, 0.9, 1.5]],
  bed: [[7.2, 2.2, 17.2], [3.2, 0.9, 11]], bath: [[7.4, 2.1, 5.4], [3, 0.7, 1.5]], dubai: [[15.5, 1.75, 16.8], [-9.6, -7.0, 46.7]], terrace: [[17, 1.9, 23.2], [-7.2, -7.8, 53.5]], fire: [[19.5, 6.2, 13.5], [22.8, 1.0, 2.0]], poolday: [[14, 2.4, 27.5], [20, 0.5, 22.6]], photo: [[15.5, 1.75, 16.8], [14.5, 1.0, 60]], poolin: [[11.5, 1.7, 18.2], [19.5, 0.7, 22.7]], poolsys: [[22, 3.2, 28.5], [26, 0.2, 22.8]],
};
const VT = { arrival: [[-72, 10, -122], [0, 7, -36]], drive: [[130, 55, -200], [0, 8, -60]], elev: [[-45, 70, -70], [0, 70, 0]], over: [[-150, 140, -340], [0, 125, 0]], struct: [[-70, 115, -135], [0, 112, 0]], crown: [[58, 238, 88], [0, 238, 0]], f50: [[70, 208, 112], [0, 201, 0]], podium: [[90, 26, 130], [0, 14, 0]], under: [[100, -26, 105], [0, -22, 0]], strike: [[170, 135, 340], [0, 135, 0]],
  facade: [fa.c.clone().addScaledVector(fa.nv, 25).add(new THREE.Vector3(0, 0.4, 0)).toArray(), fa.c.clone().addScaledVector(fa.nv, 9).toArray()] };
const VP = { cut: [[170, 120, -210], [5, -6, -12]], ramp: [[150, 30, -190], [92, -4, -105]], b2: [[-62, -5.0, -44], [25, -6.8, -24]], lift: [[0, -1.5, -34], [0, -5, 0]], air: [[-120, 20, -120], [-60, -6, -30]] };
const VL = { entrance: [[0, 1.7, -21], [0, 3, 8]], desk: [[7, 1.9, -20], [-2, 1.2, -12.8]], lounge: [[-17, 1.8, -3], [2, 2.0, 15]], sea: [[-9, 1.7, 12], [25, 14, 60]], top: [[0, 52, 0.1], [0, 0, 0]] };
const VO = (() => { const OP = OFFICE.P, A = (a, t, y, u = 0, v = 0) => { const [x, z] = OP.at(a, t, u, v); return [x, y, z]; };
  return { over: [[27, 44, 84], [27, 0, 27]], plan: [[27, 72, 27.1], [27, 0, 27]], med: [A(190, 0.5, 1.7), A(215, 0.75, 1.0)], it: [A(125, 0.4, 1.7), A(160, 0.5, 1.0)], trade: [A(304, 0.4, 1.7), A(335, 0.55, 1.0)], re: [A(4, 0.45, 1.7), A(40, 0.65, 1.0)], lounge: [A(65, 0.8, 1.7), A(100, 0.5, 1.2)], arrive: [A(270, 0.2, 1.7), A(270, 0.7, 1.5)] }; })();
const VA = (() => { const AP = APTS.P, A = (a, t, y, u = 0, v = 0) => { const [x, z] = AP.at(a, t, u, v); return [x, y, z]; }, E = (a, d, y) => { const [x, z] = AP.edge(a, d); return [x, y, z]; };
  return { over: [[27, 36, 80], [27, 0, 27]], plan: [[27, 62, 27.1], [27, 0, 27]], br3: [A(229, 0.86, 1.7), A(186, 0.55, 1.0)], br2: [A(313, 0.88, 1.7), A(350, 0.5, 1.0)], br1: [A(240, 0.86, 1.7), A(274, 0.5, 1.0)], lobby: [A(300, 0.3, 1.65), A(254, 0.05, 1.5)], pools: [[27, 8, 77], [27, 0.6, 27]], p3: [E(205, 12, 2.6), E(155, 1.95, 0.7)], p2: [E(300, 12, 2.6), E(355, 1.95, 0.7)], p1: [E(215, 12, 2.6), E(270, 1.95, 0.7)], arrive: [A(300, 0.3, 1.65), A(268, 0.05, 1.5)] }; })();
const VH = (() => { const PP = PENT.P, A = (a, t, y, u = 0, v = 0) => { const [x, z] = PP.at(a, t, u, v); return [x, y, z]; }, E = (a, d, y) => { const [x, z] = PP.edge(a, d); return [x, y, z]; };
  return { over: [[27, 36, 80], [27, 0, 27]], plan: [[27, 62, 27.1], [27, 0, 27]], living: [A(348, 0.7, 1.75), A(30, 0.55, 1.0)], kitchen: [A(297, 0.85, 1.7), A(333, 0.55, 1.0)], master: [A(100, 0.6, 1.75), A(160, 0.65, 1.0)], guest: [A(184, 0.55, 1.7), A(216, 0.7, 1.0)], lounge: [A(247, 0.2, 1.7), A(225, 0.75, 1.0)], foyer: [A(287, 0.45, 1.7), A(255, 0.7, 1.3)], pool: [E(330, 12, 2.8), E(30, 1.95, 0.7)], arrive: [A(287, 0.25, 1.65), A(262, 0.05, 1.5)] }; })();
document.querySelectorAll("[data-geo]").forEach((b) => b.addEventListener("click", () => { state.geo = !state.geo; apply(); }));
document.querySelectorAll("[data-geox]").forEach((b) => b.addEventListener("click", () => geoExterior(parseInt(b.dataset.geox, 10))));
document.querySelectorAll("[data-hv]").forEach((b) => b.addEventListener("click", () => { tweenTo(...VH[b.dataset.hv], 1100); }));
const pentInfo = () => { const ft = PENT.P.O.area(), A = PENT.areas, pl = PENT.pools[0].info; return `<h2>Floor 49 · The Sky Penthouse</h2><p>One full-floor residence on the tower's <b>true twisted outline</b> for floor 49 (plate ${Math.round(ft.plate)} m², ${A.total} m² around the core). Private lifts open into a foyer; the kitchen, living and dining rooms, master suite, guest suite and family lounge wrap the core, with terraces and a glass pool projecting about ${PENT_TERRACE_D} m beyond the glass (approved architectural projections).</p>${kvTable([["Living + dining + reading", `${A.living} m²`], ["Master suite", `${A.master} m² (bedroom, walk-in, bath)`], ["Guest suite + lounge", "bedroom, ensuite, family lounge / study"], ["Kitchen + service", "kitchen with island, laundry, powder room"], ["Terraces", `${A.terrace} m² · glass pool ${pl.L} × ${pl.W.toFixed(1)} m`]])}<ul><li>Click a door to open it; slide the time to night to see the pool glow</li><li>'Show behind the walls' reveals electricity, water, sewage, fire safety, air-con, sensors and blinds (routing is illustrative)</li></ul>${CONCEPT}${mepInfo()}${state.poolsys ? `<h2 style="color:#7fe9ff">Pool facts</h2>` + poolTable(pl) : ""}`; };

// ---------------------------------------------------------------- architectural debug mode (temporary tool): footprint, slab edge, core, units, violations
const GEOD = new Map();
function geoOverlay(P, f, units) {
  if (GEOD.has(P)) return GEOD.get(P);
  const O = P.O || P.outline, z = floorZ(f) + 1.5, g = new THREE.Group(); g.visible = false; g.renderOrder = 999;
  const mk = (pts, color, y = 0.09, loop = true) => { const geo = new THREE.BufferGeometry().setFromPoints(pts.map(([x, zz]) => new THREE.Vector3(x, y, zz))); const l = loop ? new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true })) : new THREE.Line(geo, new THREE.LineBasicMaterial({ color, depthTest: false })); l.renderOrder = 999; g.add(l); return l; };
  const ext = Array.from({ length: 360 }, (_, i) => { const p = ringPoint(z, (i / 360) * Math.PI * 2); return [PLAN_OX - p.x, PLAN_OZ + p.y]; });
  mk(ext, 0xff2a2a, 0.12); mk(O.ring(240, O.edgeR, 0.12), 0xffe14d, 0.1); mk(O.ring(180, O.coreR, 0), 0x35e6ff, 0.1);          // red = real tower facade, yellow = interior glass line, cyan = core
  const cols = [0x7dff6a, 0xff9b3d, 0xc084ff, 0x6aa8ff, 0xff6ad5, 0xffd36a]; let ci = 0;
  Object.entries(P.unitPolys || {}).forEach(([n, polys]) => { const c = cols[ci++ % cols.length]; polys.forEach((p) => mk(p, c, 0.11)); });                // apartment / zone boundaries
  (P.terraces || []).forEach((t) => { const pts = []; for (let i = 0; i <= 40; i++) pts.push(P.P.edge(t.a1 + (t.span * i) / 40, t.depth)); mk(pts, 0x66ccff, 0.11, false); });  // approved projections
  const res = validateFloor(P, f), bad = new THREE.MeshBasicMaterial({ color: 0xff2bd6, depthTest: false, transparent: true, opacity: 0.85 });
  res.issues.forEach((i) => { if (i.pts) mk(i.pts, 0xff2bd6, 0.5); const m2 = i.detail.match(/@(-?[\d.]+),(-?[\d.]+)/); if (m2) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.4, 10), bad); p.position.set(+m2[1], 1.7, +m2[2]); p.renderOrder = 1000; g.add(p); } });
  g.userData.result = res; P.g.add(g); GEOD.set(P, g); return g;
}
const geoTargets = () => [[APTS, 50, APTS], [PENT, 49, PENT]];
function geoApply() { geoTargets().forEach(([P, f]) => { const g = geoOverlay(P, f); g.visible = !!state.geo; }); if (SKY) geoOverlay(SKY.F, 45).visible = false; }

// interior of a floor shown in TOWER coordinates (exterior-fit debug view and the engineering explorer's "show floor interior")
function intApply(tw) {
  const plans = [WELL && WELL.g, SKY && SKY.g, OFFICE.g, APTS.g, PENT.g].filter(Boolean); plans.forEach((g) => g.position.set(0, 0, 0));
  const f = state.geoX; if (!tw || !f) return; const g = { 10: WELL && WELL.g, 11: WELL && WELL.g, 12: OFFICE.g, 45: SKY && SKY.g, 49: PENT.g, 50: APTS.g }[f];
  if (f === 1) { LOBBY.visible = true; return; } if (!g) return; g.visible = true; g.position.set(-PLAN_OX, floorZ(f === 11 ? 10 : f), -PLAN_OZ);
  if (f === 10 || f === 11) { WELL.setLevels(f); WELL.L10.furn.visible = WELL.L11.furn.visible = true; WELL.L10.ceil.visible = WELL.L11.ceil.visible = false; } else { const P = { 12: OFFICE, 45: SKY && SKY.F, 49: PENT, 50: APTS }[f]; if (P) { P.furn.visible = true; P.ceil.visible = false; } }
}
function geoExterior(f) {
  const P = f === 50 ? APTS : PENT; state.geoX = f; state.geo = true; state.xrayT = true; state.ceil = false; state.furn = true;
  setMode("tower", () => { state.geoX = f; state.geo = true; state.xrayT = true; apply(); const y = floorZ(f); putCamera([46, y + 22, -62], [0, y - 2, 0]); });
}

// ---------------------------------------------------------------- building engineering graph (lazy)
let ENGG = null;
function engContext() {
  ensureAmenity("wellness"); ensureAmenity("sky");
  const lobbyRooms = [0, 1, 2, 3, 4, 5].map((k) => { const a = (30 + k * 60) * Math.PI / 180; return { id: `1.hall${k}`, key: "hall" + k, name: `Lobby zone ${k + 1}`, x: Math.cos(a) * 16, z: Math.sin(a) * 16, pts: [], ceil: 9.0, type: "public" }; });
  const pods = [175, 355].map((A, i) => { const a = A * Math.PI / 180; return { id: `1.wc${i}`, key: "wc" + i, name: `Lobby washroom ${i + 1}`, x: Math.cos(a) * 18, z: Math.sin(a) * 18, pts: [], ceil: 3.0, type: "wc", a }; });
  const fixtures = []; pods.forEach((p) => { for (let k = 0; k < 2; k++) { const u = (k - 0.5) * 1.2; fixtures.push({ type: "wc", x: p.x - Math.sin(p.a) * u, z: p.z + Math.cos(p.a) * u, tag: "wc", floor: 1 }); fixtures.push({ type: "basin", x: p.x - Math.sin(p.a) * u - Math.cos(p.a) * 1.0, z: p.z + Math.cos(p.a) * u - Math.sin(p.a) * 1.0, tag: "basin", floor: 1 }); } });
  return { floors: [{ f: 1, kind: "lobby", name: "Lobby" }, { f: 10, F: WELL.L10, name: "Wellness" }, { f: 11, F: WELL.L11, name: "Gym" }, { f: 12, F: OFFICE, name: "Offices" }, { f: 45, F: SKY.F, name: "Sky restaurant" }, { f: 49, F: PENT, name: "Penthouse" }, { f: 50, F: APTS, name: "Apartments" }],
    lobby: { rooms: [...lobbyRooms, ...pods], fixtures }, pool: { f: 10, c: WELL.pool.c, rot: WELL.pool.rot, L: WELL.pool.L, W: WELL.pool.W },
    parking: { levels: [-3.6, -7.2, -10.8], aisles: [-74, -26, 22], supply: [[-60, -97], [40, -97], [-60, 67], [40, 67]], exhaust: [[-92, -45], [-92, 25], [102, 30], [102, 62]] } };
}
const engGraph = () => (ENGG = ENGG || buildBuilding(engContext()));

// ---------------------------------------------------------------- Engineering Explorer (conceptual building services, one shared graph)
let ENGV = null; const engCard = document.createElement("div"); engCard.id = "engCard"; engCard.className = "panel"; engCard.style.display = "none"; document.body.appendChild(engCard);
const engView = () => { if (!ENGV) { ENGV = createEngView(engGraph(), SYSTEMS, SUB, document.getElementById("labels")); scene.add(ENGV.group); } return ENGV; };
const ENG_MODELED = [1, 10, 11, 12, 45, 49, 50];
const hexc = (n) => "#" + n.toString(16).padStart(6, "0");
function engLegend() { const L = document.getElementById("engLegend"), s = state.eng.sys; if (!s) { L.innerHTML = state.struct ? "" : `<p style="color:var(--mute);font-size:12px">Choose a system to see it inside the building.</p>`; return; } const sub = SUB[s]; L.innerHTML = `<p style="font-size:12px;margin:4px 0">${SYSTEMS[s].blurb}</p>` + Object.entries(sub).map(([k, v]) => `<div style="display:flex;gap:6px;align-items:center;font-size:12px"><i style="width:22px;height:5px;border-radius:3px;background:${hexc(v[0])};display:inline-block"></i>${v[1]}</div>`).join("") + `<div style="font-size:12px;margin-top:4px;color:var(--mute)">Moving dots show the direction of flow. Spheres are components: click one for details.</div><div style="font-size:11px;margin-top:4px;color:#ffb347">Conceptual design basis. Not an engineering design; no code compliance is claimed.</div>`; }
function engRefresh() { const e = state.eng; if (!e.sys) { ENGV && ENGV.hide(); engCard.style.display = "none"; } else engView().show(e.systems, e.floor); state.geoX = e.sys && e.interior && e.floor && ENG_MODELED.includes(e.floor) ? e.floor : 0; engLegend(); document.querySelectorAll("[data-eng]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.eng === e.sys || (b.dataset.eng === "arch" && !e.sys && !state.struct) || (b.dataset.eng === "struct" && state.struct && !e.sys)))); document.getElementById("engWhole").setAttribute("aria-pressed", String(e.floor == null)); document.getElementById("engFloor").setAttribute("aria-pressed", String(e.floor != null)); document.getElementById("engInterior").setAttribute("aria-pressed", String(!!e.interior)); document.getElementById("engGlass").setAttribute("aria-pressed", String(!!state.xrayT)); apply(); }
function engCam() { const e = state.eng; if (e.floor == null) tweenTo([210, 150, -250], [0, 98, 0], 1100); else { const y = floorZ(e.floor); tweenTo([27, y + 21, -36], [0, y, 0], 1100); } }
function engSelect(k) {
  const e = state.eng;
  if (k === "arch") { e.sys = null; e.systems = []; state.struct = false; state.xrayT = false; engRefresh(); return; }
  if (k === "struct") { e.sys = null; e.systems = []; state.struct = true; state.xrayT = true; engRefresh(); tweenTo(...VT.struct, 1100); return; }
  state.struct = false; state.xrayT = true; e.sys = k; e.systems = [k]; if (ENGV) ENGV.stopDemo(); engRefresh(); engCam();
}
const engOpen = (k) => setMode("tower", () => engSelect(k || "elec"));
document.getElementById("engNav").addEventListener("click", () => engOpen("elec"));
document.querySelectorAll("[data-eng]").forEach((b) => b.addEventListener("click", () => (state.mode === "tower" ? engSelect(b.dataset.eng) : engOpen(b.dataset.eng))));
document.getElementById("engWhole").addEventListener("click", () => { state.eng.floor = null; state.eng.interior = false; engRefresh(); engCam(); });
document.getElementById("engFloor").addEventListener("click", () => { state.eng.floor = parseInt(document.getElementById("engSlider").value, 10); engRefresh(); engCam(); });
document.getElementById("engSlider").addEventListener("input", (ev) => { document.getElementById("engFlabel").textContent = ev.target.value; if (state.eng.floor != null) { state.eng.floor = parseInt(ev.target.value, 10); engRefresh(); engCam(); } });
document.getElementById("engInterior").addEventListener("click", () => { if (state.eng.floor == null) { state.eng.floor = parseInt(document.getElementById("engSlider").value, 10); } state.eng.interior = !state.eng.interior; engRefresh(); engCam(); });
document.getElementById("engGlass").addEventListener("click", () => { state.xrayT = !state.xrayT; engRefresh(); });
{ let sp = 1; document.getElementById("engSpeed").addEventListener("click", (ev) => { sp = sp === 1 ? 2 : sp === 2 ? 0.5 : 1; engView().setSpeed(sp); ev.currentTarget.textContent = `Flow speed \u00d7${sp}`; }); }
document.getElementById("engFire").addEventListener("click", () => {
  const e = state.eng; if (ENGV && ENGV.demoOn) { ENGV.stopDemo(); return; }
  let f = e.floor != null ? e.floor : parseInt(document.getElementById("engSlider").value, 10); if (!ENG_MODELED.includes(f)) f = 49;
  if (state.mode !== "tower") { setMode("tower", () => document.getElementById("engFire").click()); return; }
  state.struct = false; state.xrayT = true; e.sys = "fire"; e.systems = ["fire", "spk", "smoke"]; e.floor = f; e.interior = true; document.getElementById("engSlider").value = f; document.getElementById("engFlabel").textContent = f; engRefresh(); engCam();
  const bn = document.getElementById("banner"); bn.className = ""; bn.style.display = "block";
  engView().startDemo(f, (i, txt) => { bn.textContent = txt; }, () => { bn.style.display = "none"; document.getElementById("engFire").setAttribute("aria-pressed", "false"); engRefresh(); });
  { const fp = engView().demoFocus(); if (fp) tweenTo([fp[0] + 4.5, fp[1] + 2.6, fp[2] - 6.5], [fp[0], fp[1] - 1.6, fp[2]], 1400); }
  document.getElementById("engFire").setAttribute("aria-pressed", "true");
});
function showEngCard(h) {
  if (!h) { engCard.style.display = "none"; return; } const d = h.type === "node" ? describeNode(h.node) : describeEdge(h.edge), id = h.type === "node" ? h.node.id : h.edge.from, n = h.type === "node" ? h.node : null;
  const fwd = n && (n.sys === "sewer" || n.sys === "fire") || (n && n.sys === "hvac" && /^(exh|hood)$/.test(n.kind)), label = h.type === "node" && n.sys === "sewer" ? "Follow wastewater to the sewer" : fwd ? "Follow the signal / exhaust to its destination" : "Trace back to the source";
  engCard.innerHTML = `<b style="color:var(--gold)">${d.title}</b><div style="font-size:11px;color:var(--mute)">${d.kind} · ${d.system}${d.floor !== undefined && d.floor !== null && d.floor !== 0 ? " · floor " + d.floor : ""}</div><p style="font-size:12.5px;margin:6px 0">${d.purpose}</p>${d.flow ? `<p style="font-size:12px;color:#7fe9ff;margin:4px 0">${d.flow}</p>` : ""}<div class="btns"><button data-trace="${id}">${label}</button><button data-trace="">Clear</button><button data-x>Close</button></div>`; engCard.style.display = "block";
}
engCard.addEventListener("click", (ev) => { const t = ev.target.closest("button"); if (!t) return; if (t.dataset.x !== undefined) { engCard.style.display = "none"; return; } if (t.dataset.trace === undefined) return; if (!t.dataset.trace) { ENGV.clearTrace(); return; } ENGV.setTrace(ENGV.traceFrom(t.dataset.trace)); });
let tween = null;
function tweenTo(p, t, dur = 900) { tween = { t0: performance.now(), dur, p0: camera.position.clone(), t0v: controls.target.clone(), p1: new THREE.Vector3(...p), t1: new THREE.Vector3(...t) }; }
function goView(name) { const [p, t] = VIEWS[name]; tweenTo(p, t); }
function goViewT(name) { const [p, t] = VT[name]; tweenTo(p, t, 1100); }
function goViewP(name) { const [p, t] = VP[name]; tweenTo(p, t, 1100); }
function goViewL(name) { const [p, t] = VL[name]; tweenTo(p, t); }
function putCamera(p, t) { tween = null; camera.position.set(...p); controls.target.set(...t); controls.update(); }
document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => goView(b.dataset.view)));
document.querySelectorAll("[data-tv]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.tv === "under") { state.found = true; apply(); } if (b.dataset.tv === "facade") { state.glass = true; apply(); } goViewT(b.dataset.tv); }));
document.querySelectorAll("[data-pv]").forEach((b) => b.addEventListener("click", () => goViewP(b.dataset.pv)));
document.querySelectorAll("[data-lv]").forEach((b) => b.addEventListener("click", () => goViewL(b.dataset.lv)));

document.querySelectorAll("[data-ov]").forEach((b) => b.addEventListener("click", () => tweenTo(...VO[b.dataset.ov], 1100)));
document.querySelectorAll("[data-av]").forEach((b) => b.addEventListener("click", () => { tweenTo(...VA[b.dataset.av], 1100); }));
function buildPlanLightButtons(P, boxId) { const bx = document.getElementById(boxId); Object.values(P.rooms).forEach((r) => { const b = document.createElement("button"); b.textContent = r.name; b.dataset.room = r.key; b.setAttribute("aria-pressed", "false"); b.addEventListener("click", () => { state.lightsAuto = false; P.setLight(r.key, !P.lightsOn[r.key]); syncPlanButtons(); }); bx.appendChild(b); }); }
function syncPlanButtons() { [["lightbtnsO", OFFICE], ["lightbtnsA", APTS], ["lightbtnsP", PENT], ["lightbtnsW", WELL], ["lightbtnsS", SKY]].forEach(([id, P]) => P && document.querySelectorAll(`#${id} button`).forEach((b) => b.setAttribute("aria-pressed", String(!!P.lightsOn[b.dataset.room])))); [["lightbtnsO", OFFICE], ["lightbtnsA", APTS], ["lightbtnsP", PENT]].forEach(([id, P]) => document.querySelectorAll(`#${id} button`).forEach((b) => b.setAttribute("aria-pressed", String(!!P.lightsOn[b.dataset.room])))); }
buildPlanLightButtons(OFFICE, "lightbtnsO"); buildPlanLightButtons(APTS, "lightbtnsA"); buildPlanLightButtons(PENT, "lightbtnsP");
// ---- amenity floors: controls
{ const itemCard = document.createElement("div"); itemCard.id = "itemCard"; itemCard.className = "panel"; itemCard.style.cssText = "left:50%;bottom:92px;transform:translateX(-50%);max-width:min(460px,90vw);display:none;z-index:6"; document.body.appendChild(itemCard);
  window.renderItem = () => { const it = state.item; if (!it) { itemCard.style.display = "none"; return renderInfo(); } itemCard.innerHTML = `<b style="color:var(--gold)">${it.name}</b><div style="font-size:12.5px;color:#c9d2e0">${it.info}</div>`; itemCard.style.display = "block"; renderInfo(); }; }
document.querySelectorAll("[data-wv]").forEach((b) => b.addEventListener("click", () => { ensureAmenity("wellness"); const n = b.dataset.wv; if (["weights", "gym"].includes(n)) state.level = state.level === 10 ? 0 : state.level; if (["gymnastics", "spa", "treat", "pool"].includes(n)) state.level = state.level === 11 ? 0 : state.level; apply(); tweenTo(...AV.well(n), 1300); }));
document.querySelectorAll("[data-sv]").forEach((b) => b.addEventListener("click", () => { ensureAmenity("sky"); tweenTo(...AV.sky(b.dataset.sv), 1300); }));
document.querySelectorAll("[data-lvl]").forEach((b) => b.addEventListener("click", () => { state.level = parseInt(b.dataset.lvl, 10); document.querySelectorAll("[data-lvl]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); apply(); }));
[["W", () => WELL, "lightsOnW"], ["S", () => SKY, "lightsOnS"]].forEach(([k, get]) => { document.getElementById("lightsOn" + k).addEventListener("click", () => { state.lightsAuto = false; get().setAllLights(true); syncPlanButtons(); }); document.getElementById("lightsOff" + k).addEventListener("click", () => { state.lightsAuto = false; get().setAllLights(false); syncPlanButtons(); }); document.getElementById("lightsAuto" + k).addEventListener("click", () => { state.lightsAuto = true; setTime(hourNow); }); document.getElementById("doorsOpen" + k).addEventListener("click", () => get().setDoors(true)); document.getElementById("doorsClose" + k).addEventListener("click", () => get().setDoors(false)); });
document.getElementById("poolLightsBtn").addEventListener("click", (e) => { WELL.poolManual = !WELL.poolLightsOn; WELL.setPoolLights(WELL.poolManual); e.currentTarget.setAttribute("aria-pressed", String(WELL.poolManual)); });
document.getElementById("decorBtn").addEventListener("click", (e) => { SKY.setDecor(!SKY.decorOn); e.currentTarget.setAttribute("aria-pressed", String(SKY.decorOn)); });
[["liftDoorsW", () => WELL && WELL.L10], ["liftDoorsS", () => SKY]].forEach(([id, get]) => document.getElementById(id).addEventListener("click", (e) => { const P = get(); const on = !(e.currentTarget.getAttribute("aria-pressed") === "true"); P.liftOpen(on); e.currentTarget.setAttribute("aria-pressed", String(on)); }));
{ const rides = [["rideLobby10", 1, 10, "wellness"], ["rideLobby45", 1, 45, "sky"], ["rideO10", 12, 10, "wellness"], ["rideO45", 12, 45, "sky"], ["rideA10", 50, 10, "wellness"], ["rideA45", 50, 45, "sky"], ["rideW12", 10, 12, "office"], ["rideW45", 10, 45, "sky"], ["rideW50", 10, 50, "apts"], ["rideS12", 45, 12, "office"], ["rideS10", 45, 10, "wellness"], ["rideS50", 45, 50, "apts"]]; rides.forEach(([id, f, t, m]) => { const el = document.getElementById(id); if (el) el.addEventListener("click", () => startRide(f, t, m)); }); }
[["O", OFFICE], ["A", APTS], ["P", PENT]].forEach(([k, P]) => { document.getElementById("lightsOn" + k).addEventListener("click", () => { state.lightsAuto = false; P.setAllLights(true); syncPlanButtons(); }); document.getElementById("lightsOff" + k).addEventListener("click", () => { state.lightsAuto = false; P.setAllLights(false); syncPlanButtons(); }); document.getElementById("lightsAuto" + k).addEventListener("click", () => { state.lightsAuto = true; setTime(hourNow); });
  document.getElementById("doorsOpen" + k).addEventListener("click", () => P.setDoors(true)); document.getElementById("doorsClose" + k).addEventListener("click", () => P.setDoors(false));
  document.getElementById("liftDoors" + k).addEventListener("click", (e) => { const on = !P.liftOn; P.liftOpen(on); e.currentTarget.setAttribute("aria-pressed", String(on)); }); });
// ---------------- lift ride: a real-time trip in the cabin (trapezoid speed profile: 1.2 m/s² up to 8 m/s)
const RIDE = { on: false, phase: "", t: 0, from: 12, to: 50, after: "apts", fast: 1, y0: 0, y1: 0, prof: null, v: 0, s: 0 };
const LA = 1.2, LVMAX = 8;
function ridePlan(d) { const ta = LVMAX / LA, da = LVMAX * ta / 2; if (d >= 2 * da) { const tc = (d - 2 * da) / LVMAX; return { T: 2 * ta + tc, ta, tc, d, vmax: LVMAX }; } const tp = Math.sqrt(d / LA); return { T: 2 * tp, ta: tp, tc: 0, d, vmax: LA * tp }; }
function rideAt(pr, t) { t = Math.min(Math.max(t, 0), pr.T); let s, v; if (t < pr.ta) { v = LA * t; s = 0.5 * LA * t * t; } else if (t < pr.ta + pr.tc) { v = pr.vmax; s = 0.5 * LA * pr.ta * pr.ta + pr.vmax * (t - pr.ta); } else { const td = t - pr.ta - pr.tc; v = Math.max(0, pr.vmax - LA * td); s = 0.5 * LA * pr.ta * pr.ta + pr.vmax * pr.tc + pr.vmax * td - 0.5 * LA * td * td; } return { s: Math.min(s, pr.d), v }; }
function startRide(from, to, after) {
  if (RIDE.on) return; if (tour.on) return;
  Object.assign(RIDE, { on: true, from, to, after, y0: floorZ(from), y1: floorZ(to), phase: "close", t: 0, fast: 1, v: 0, s: 0 }); RIDE.prof = ridePlan(Math.abs(RIDE.y1 - RIDE.y0));
  document.getElementById("liftFast").setAttribute("aria-pressed", "false"); document.getElementById("liftNote").textContent = "real time";
  LIFT.doorK = 1; LIFT.doorTarget = 1; LIFT.setDisplay(from, 0, zoneOf(from).toUpperCase()); setMode("lift");
}
function endRide() { RIDE.phase = "arrive"; setMode(RIDE.after, () => { RIDE.on = false; RIDE.phase = ""; const P = PLANS[RIDE.after]; if (P) { const v = RIDE.after === "apts" ? VA.arrive : RIDE.after === "pent" ? VH.arrive : VO.arrive; putCamera(...v); P.liftOpen(true); } else if (RIDE.after === "wellness" && WELL) { putCamera(...AV.well("arrive")); WELL.L10.liftOpen(true); } else if (RIDE.after === "sky" && SKY) { putCamera(...AV.sky("arrive")); SKY.liftOpen(true); } }); }
const hudEls = { fl: document.getElementById("liftFloor"), z: document.getElementById("liftZone"), d: document.getElementById("liftDir"), b: document.getElementById("liftBar"), sp: document.getElementById("liftSpeed"), alt: document.getElementById("liftAlt") };
function liftUpdate(dt) {
  LIFT.update(dt); if (!RIDE.on || state.mode !== "lift") return;
  const dir = Math.sign(RIDE.y1 - RIDE.y0) || 1, k = RIDE.fast;
  if (RIDE.phase === "close") { RIDE.t += dt; if (RIDE.t > 0.8) LIFT.setDoors(false); if (RIDE.t > 2.2) { RIDE.phase = "run"; RIDE.t = 0; } }
  else if (RIDE.phase === "run") { RIDE.t += dt * k; const r = rideAt(RIDE.prof, RIDE.t); RIDE.s = r.s; RIDE.v = r.v; if (RIDE.t >= RIDE.prof.T) { RIDE.phase = "open"; RIDE.t = 0; RIDE.v = 0; LIFT.setDoors(true); } }
  else if (RIDE.phase === "open") { RIDE.t += dt; if (RIDE.t > 2.4) endRide(); }
  const y = RIDE.y0 + dir * RIDE.s, f = Math.max(1, Math.min(50, RIDE.phase === "open" ? RIDE.to : floorOfY(y + 0.01)));
  hudEls.fl.textContent = f; hudEls.z.textContent = zoneOf(f); hudEls.d.textContent = RIDE.phase === "run" ? (dir > 0 ? "▲" : "▼") : "●"; hudEls.b.style.width = (RIDE.prof.d ? (RIDE.s / RIDE.prof.d) * 100 : 0) + "%"; hudEls.sp.textContent = RIDE.v.toFixed(1); hudEls.alt.textContent = Math.round(y);
  LIFT.setDisplay(f, RIDE.phase === "run" ? dir : 0, zoneOf(f).toUpperCase());
}
function liftCamera() { const c = LIFT.cam, tt = performance.now() / 1000, sh = RIDE.phase === "run" ? (RIDE.v / LVMAX) * 0.004 : 0, k = RIDE.phase === "open" ? Math.min(1, RIDE.t / 2.4) : 0; camera.position.set(c.p[0] + Math.sin(tt * 31) * sh, c.p[1] + Math.sin(tt * 47) * sh, c.p[2] + 1.15 * k); camera.lookAt(c.t[0], c.t[1], c.t[2]); }
document.getElementById("liftFast").addEventListener("click", (e) => { RIDE.fast = RIDE.fast === 1 ? 3 : 1; e.currentTarget.setAttribute("aria-pressed", String(RIDE.fast > 1)); document.getElementById("liftNote").textContent = RIDE.fast > 1 ? "fast-forward x3" : "real time"; });
document.getElementById("liftSkip").addEventListener("click", () => { if (RIDE.on && RIDE.phase !== "arrive") { RIDE.phase = "open"; RIDE.t = 2.3; RIDE.s = RIDE.prof.d; LIFT.setDoors(true); } });
document.getElementById("rideO50").addEventListener("click", () => startRide(12, 50, "apts")); document.getElementById("rideOLobby").addEventListener("click", () => startRide(12, 1, "lobby"));
[["rideP12", 12, "office"], ["rideP45", 45, "sky"], ["rideP10", 10, "wellness"], ["ridePLobby", 1, "lobby"], ["rideP50", 50, "apts"]].forEach(([id, t, m]) => document.getElementById(id).addEventListener("click", () => startRide(49, t, m))); document.getElementById("rideA12").addEventListener("click", () => startRide(50, 12, "office")); document.getElementById("rideALobby").addEventListener("click", () => startRide(50, 1, "lobby")); document.getElementById("rideAUp").addEventListener("click", () => startRide(1, 50, "apts"));
document.getElementById("rideLobby").addEventListener("click", () => startRide(1, 50, "apts"));
document.getElementById("goPark").addEventListener("click", () => setMode("park")); document.getElementById("goLobbyP").addEventListener("click", () => setMode("lobby"));
document.getElementById("parkDemo").addEventListener("click", () => { if (X.parkDemoOn()) { X.stopParkDemo(); bannerEl.style.display = "none"; document.getElementById("parkDemo").setAttribute("aria-pressed", "false"); } else { state.pfire = true; state.pair = true; apply(); X.startParkDemo(); goViewP("b2"); document.getElementById("parkDemo").setAttribute("aria-pressed", "true"); } });
const fadeEl = document.getElementById("fade");
let shadowWanted = false;
function setMode(m, cb) {
  if (m === state.mode) { if (!state.geoX || m !== "tower") state.geoX = 0; cb && cb(); return; }
  state.geoX = 0; if (ENGV) { state.eng.sys = null; state.eng.systems = []; state.eng.floor = null; state.eng.interior = false; ENGV.stopDemo(); ENGV.hide(); engCard.style.display = "none"; }
  fadeEl.style.opacity = "1";
  setTimeout(() => {
    if (state.strike) stopStrike(); if (demo.on) stopDemo();
    state.mode = m;
    if (m === "floor") { FOCUS.set(W / 2, 0, D / 2); controls.maxDistance = 90; controls.maxPolarAngle = Math.PI / 2 - 0.02; putCamera(...VIEWS.over); }
    else if (m === "lobby") { FOCUS.set(0, 0, 0); controls.maxDistance = 120; controls.maxPolarAngle = Math.PI / 2 - 0.02; putCamera(...VL.entrance); }
    else if (m === "park") { FOCUS.set(0, -5, 0); controls.maxDistance = 700; controls.maxPolarAngle = Math.PI - 0.05; putCamera(...VP.cut); }
    else if (m === "office") { FOCUS.set(27, 0, 27); controls.maxDistance = 110; controls.maxPolarAngle = Math.PI / 2 - 0.02; putCamera(...VO.over); }
    else if (m === "apts") { FOCUS.set(27, 0, 27); controls.maxDistance = 100; controls.maxPolarAngle = Math.PI / 2 - 0.02; putCamera(...VA.over); }
    else if (m === "pent") { FOCUS.set(27, 0, 27); controls.maxDistance = 100; controls.maxPolarAngle = Math.PI / 2 - 0.02; putCamera(...VH.over); }
    else if (m === "wellness") { ensureAmenity("wellness"); FOCUS.set(27, 0, 27); controls.maxDistance = 80; controls.maxPolarAngle = Math.PI / 2 - 0.02; putCamera(...AV.well("over")); WELL.g.visible = true; }
    else if (m === "sky") { ensureAmenity("sky"); FOCUS.set(27, 0, 27); controls.maxDistance = 75; controls.maxPolarAngle = Math.PI / 2 - 0.02; putCamera(...AV.sky("over")); SKY.g.visible = true; }
    else if (m === "lift") { FOCUS.set(400, 0, 0); controls.maxDistance = 20; controls.maxPolarAngle = Math.PI; putCamera(LIFT.cam.p, LIFT.cam.t); }
    else { FOCUS.set(0, 100, 0); controls.maxDistance = 1400; controls.maxPolarAngle = Math.PI - 0.05; putCamera(...VT.over); }
    shadowWanted = m === "floor" || m === "lobby" || m === "office" || m === "apts" || m === "pent" || m === "wellness" || m === "sky"; sun.castShadow = shadowWanted && Q.cfg.shadows; Object.assign(sun.shadow.camera, m === "office" || m === "apts" || m === "wellness" || m === "sky" ? { left: -34, right: 34, top: 34, bottom: -34 } : { left: -26, right: 26, top: 26, bottom: -26 }); sun.shadow.camera.updateProjectionMatrix(); camera.near = m === "tower" ? 1.0 : m === "park" ? 0.3 : m === "lift" ? 0.05 : 0.1; camera.updateProjectionMatrix(); if (X.parkDemoOn()) X.stopParkDemo(); moonLight.target.position.copy(FOCUS);
    Object.keys(lightsOn).forEach((k) => (lightsOn[k] = lightsOn[k])); applyLights(); syncLightButtons(); apply(); tower.highlight(m === "tower" ? state.selFloor : 0);
    fadeEl.style.opacity = "0"; cb && cb();
  }, 300);
}

// ---------------------------------------------------------------- cinematic tour (+ optional recording to WebM)
const audio = { ctx: null, master: null, dest: null, music: null };
function ensureAudio() {
  if (audio.ctx) return audio; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return audio;
  audio.ctx = new AC(); audio.master = audio.ctx.createGain(); audio.master.gain.value = 0.9; audio.master.connect(audio.ctx.destination);
  try { audio.dest = audio.ctx.createMediaStreamDestination(); audio.master.connect(audio.dest); } catch (e) { audio.dest = null; } return audio;
}
function startMusic() {
  const a = ensureAudio(); if (!a.ctx || a.music) return; const ctx = a.ctx, out = ctx.createGain(); out.gain.value = 0; out.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 3); out.connect(a.master);
  const chords = [[50, 57, 62, 66, 69], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [45, 52, 57, 61, 64]], f = (n) => 440 * Math.pow(2, (n - 69) / 12), voices = [];
  chords[0].forEach((n, i) => { for (const det of [-6, 6]) { const o = ctx.createOscillator(); o.type = i % 2 ? "triangle" : "sine"; o.frequency.value = f(n); o.detune.value = det; const g = ctx.createGain(); g.gain.value = 0.07; o.connect(g).connect(out); o.start(); voices.push({ o, i }); } });
  let step = 0; const timer = setInterval(() => { step++; const c = chords[Math.floor(step / 8) % chords.length]; voices.forEach((v) => v.o.frequency.setTargetAtTime(f(c[v.i]), ctx.currentTime, 1.6));
    const bell = ctx.createOscillator(), bg = ctx.createGain(); bell.type = "sine"; bell.frequency.value = f(c[2 + (step % 3)] + 12); bg.gain.setValueAtTime(0.0001, ctx.currentTime); bg.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.02); bg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.4); bell.connect(bg).connect(out); bell.start(); bell.stop(ctx.currentTime + 2.6); }, 1875);
  a.music = { out, voices, timer };
}
function stopMusic() { const a = audio; if (!a.music) return; const m = a.music; m.out.gain.cancelScheduledValues(a.ctx.currentTime); m.out.gain.setTargetAtTime(0, a.ctx.currentTime, 0.6); clearInterval(m.timer); setTimeout(() => m.voices.forEach((v) => v.o.stop()), 2500); a.music = null; }
// thunder now goes through the master bus so it is recorded too
thunderSound = function (delay) { try { const a = ensureAudio(), ctx = a.ctx, sr = ctx.sampleRate, mk = (dur, fn) => { const b = ctx.createBuffer(1, Math.floor(dur * sr), sr), d = b.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { last = (last + 0.03 * (Math.random() * 2 - 1)) / 1.03; d[i] = fn(i / sr, last); } return b; };
  const crack = ctx.createBufferSource(); crack.buffer = mk(0.35, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 14)); const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900; const g1 = ctx.createGain(); g1.gain.value = 0.7; crack.connect(hp).connect(g1).connect(a.master); crack.start(ctx.currentTime + delay);
  const roll = ctx.createBufferSource(); roll.buffer = mk(4.6, (t, l) => l * 6 * Math.exp(-t * 0.8) * (1 + 0.5 * Math.sin(t * 9))); const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380; const g2 = ctx.createGain(); g2.gain.value = 1.0; roll.connect(lp).connect(g2).connect(a.master); roll.start(ctx.currentTime + delay + 0.25); } catch (e) { /* audio is optional */ } };

const capEl = document.getElementById("cap"), titleEl = document.getElementById("titleCard"), stopTourBtn = document.getElementById("stopTour");
const tour = { on: false, t0: 0, i: 0, orbit: null, tAnim: null, rec: null, chunks: [] };
const TL = (k) => Object.assign(state, { struct: false, rebar: false, found: false, glass: false, rain: false, xrayT: false }, k);
const showCap = (t) => { capEl.textContent = t; capEl.style.opacity = "1"; };
const showTitle = (a, b) => { titleEl.innerHTML = `<div class="t1">${a}</div><div class="t2">${b}</div>`; titleEl.style.opacity = "1"; };
const hideTitle = () => { titleEl.style.opacity = "0"; };
const STEPS_T = [
  [0, () => { TL({}); setMode("tower"); setTime(17.4); tour.orbit = { r: 330, y: 150, ty: 125, a0: -2.2, spd: 0.055 }; showTitle("DUBAI AZURE TOWER", "A conceptual architectural vision"); capEl.style.opacity = "0"; apply(); }],
  [6.5, () => { hideTitle(); showCap("Fifty floors. One continuous twist."); }],
  [14, () => { tour.orbit = null; goViewT("crown"); showCap("An illuminated crown and a 28 m spire"); }],
  [20, () => { tour.tAnim = { from: 17.6, to: 22.2, t0: performance.now() / 1000, dur: 6 }; tour.orbit = { r: 300, y: 150, ty: 130, a0: 0.2, spd: -0.06 }; showCap("By night the glass becomes light"); }],
  [28, () => { tour.orbit = null; tour.tAnim = { from: 22.2, to: 15.2, t0: performance.now() / 1000, dur: 3 }; TL({ struct: true }); apply(); goViewT("struct"); showCap("Inside: a buttressed concrete core, 18 columns, post-tensioned slabs"); }],
  [35, () => { TL({ struct: true, rebar: true }); selectFloor(30, false); apply(); tweenTo([-42, 96, -62], [0, 90, 0], 2200); showCap("Every concrete element is reinforced with steel bars"); }],
  [42, () => { TL({ found: true }); apply(); goViewT("under"); showCap("A raft on deep piles carries the weight into the ground"); }],
  [49, () => { TL({ glass: true }); apply(); goViewT("facade"); showCap("Four layers of glass keep the sun, rain and wind out"); }],
  [56, () => { TL({ rain: true }); apply(); goViewT("podium"); showCap("Rain is caught at every floor and drained away"); }],
  [62, () => { TL({}); apply(); startStrike(); showCap("Lightning is carried safely to the ground"); capEl.style.opacity = "0"; }],
  [73, () => { stopStrike(); TL({}); setTime(19.6); setMode("lobby"); showCap("The lobby: a double-height welcome"); }],
  [79, () => { goViewL("lounge"); showCap("Lounges look out over the Gulf"); }],
  [85, () => { setMode("pent"); setTime(19.2); showCap("Floor 49: the sky penthouse"); }],
  [91, () => { goView("living"); showCap("Open living, dining and kitchen"); }],
  [97, () => { state.photo = true; apply(); setTime(17.6); goView("photo"); showCap("And beyond the glass: the real Burj Al Arab at sunset"); }],
  [104, () => { capEl.style.opacity = "0"; showTitle("DUBAI AZURE TOWER", "Fictional concept · not approved · not built · not for sale"); }],
  [110, () => stopTour(true)],
];
function startTour(record, steps, opts = {}) {
  if (tour.on) return; tour.steps = steps || STEPS_T; tour.on = true; tour.t0 = performance.now() / 1000; tour.i = 0; tour.orbit = null; tour.tAnim = null;
  controls.enabled = false; document.querySelectorAll(".panel,#hide").forEach((p) => (p.style.display = "none")); stopTourBtn.style.display = "block"; state.lightsAuto = true;
  if (!opts.silent) { ensureAudio(); if (audio.ctx.state === "suspended") audio.ctx.resume(); startMusic(); }
  if (record && window.MediaRecorder) { try { const vs = canvas.captureStream(30), tracks = [...vs.getVideoTracks(), ...(audio.dest ? audio.dest.stream.getAudioTracks() : [])], mt = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)); tour.chunks = []; tour.rec = new MediaRecorder(new MediaStream(tracks), { mimeType: mt, videoBitsPerSecond: 9000000 }); tour.rec.ondataavailable = (e) => e.data.size && tour.chunks.push(e.data); tour.rec.onstop = () => { const blob = new Blob(tour.chunks, { type: "video/webm" }), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Dubai_Azure_Tower_Tour.webm"; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 1000); }; tour.rec.start(1000); } catch (e) { tour.rec = null; } }
}
function stopTour(finished) {
  if (!tour.on) return; tour.on = false; tour.orbit = null; tour.tAnim = null; tour.cam = null; camera.near = state.mode === "tower" ? 1.0 : 0.1; camera.updateProjectionMatrix(); stopMusic();
  if (tour.rec && tour.rec.state !== "inactive") tour.rec.stop(); tour.rec = null;
  if (state.strike) stopStrike(); hideTitle(); capEl.style.opacity = "0"; stopTourBtn.style.display = "none"; controls.enabled = true;
  document.querySelectorAll(".panel,#hide").forEach((p) => (p.style.display = "")); hideBtn.setAttribute("aria-pressed", "false"); TL({}); state.photo = false; state.elev = false; state.pair = false; state.pfire = false; if (X.parkDemoOn()) X.stopParkDemo(); bannerEl.style.display = "none"; apply(); if (state.mode !== "tower") setMode("tower");
}
function tourUpdate(now) {
  if (!tour.on) return false; const e = now - tour.t0;
  while (tour.i < tour.steps.length && e >= tour.steps[tour.i][0]) { tour.steps[tour.i][1](); tour.i++; }
  if (tour.cam) { const c = tour.cam, r = c.rig.at(now - c.t0); camera.position.copy(r.pos); controls.target.copy(r.tgt); camera.lookAt(r.tgt); }
  if (tour.orbit && !tween) { const o = tour.orbit, a = o.a0 + o.spd * e; camera.position.set(Math.cos(a) * o.r, o.y, Math.sin(a) * o.r); controls.target.set(0, o.ty, 0); camera.lookAt(controls.target); }
  if (tour.tAnim) { const k = Math.min(1, (now - tour.tAnim.t0) / tour.tAnim.dur); setTime(tour.tAnim.from + (tour.tAnim.to - tour.tAnim.from) * (k * k * (3 - 2 * k))); if (k >= 1) tour.tAnim = null; }
  return true;
}
// ---- Luxury Arrival Experience: one continuous exterior camera rig, then a fade into the lobby and a second rig
const LOBBY_PT = new THREE.Vector3(0, 2, -24);
const dpose = (u, off, y) => { const p = X.driveCurve.getPointAt(u), t = X.driveCurve.getTangentAt(u), l = Math.hypot(t.x, t.z); return [p.x - (t.z / l) * off, y, p.z + (t.x / l) * off]; };
const LUX_EXT = makeRig([
  [0, [-235, 150, -335], [0, 35, -70]], [8, [-150, 105, -255], [0, 45, -70]], [16, [-72, 34, -170], [0, 45, -40]], [24, [-30, 3.0, -147], [0, 75, -15]], [28, [-26, 9.0, -124], [0, 40, -15]], [32, [-26, 8.6, -112], [0, 3, -100]], [38, [-14, 4.2, -106], [0, 3.5, -99]],
  [44, [9, 2.8, -90], [0, 3.8, -99]], [48, [3, 3.0, -74], [-20, 1.8, -52]], [53, [-2, 2.8, -60], [-30, 1.8, -52]], [58, [-3, 2.6, -53], [-6, 1.8, -42]], [64, [-4, 2.4, -50], [0, 6, -24]], [70, [-3, 2.0, -38], [0, 5, -24]], [76, [0, 1.75, -30], [0, 2.2, -18]], [80, [0, 1.7, -25.5], [0, 2.2, -12]]]);
const LUX_INT = makeRig([[0, [0, 1.7, -21], [0, 3, 8]], [5, [0, 1.75, -16], [0, 3.5, 8]], [10, [-5, 2.4, -12], [0, 4, 6]], [14, [-7, 2.8, -9], [2, 4.5, 8]]]);
const startCam = (rig) => { tour.cam = { rig, t0: performance.now() / 1000 }; };
const LUXURY = [
  [0, () => { TL({}); state.elev = false; setMode("tower"); setTime(17.4); camera.near = 0.3; camera.updateProjectionMatrix(); X.resetArrival(0.2); startCam(LUX_EXT); tour.tAnim = { from: 17.4, to: 19.1, t0: performance.now() / 1000, dur: 84 }; showTitle("LUXURY ARRIVAL", "Dubai Azure Tower · a fictional concept"); capEl.style.opacity = "0"; apply(); }],
  [6, () => { hideTitle(); showCap("A tower set in a landscaped garden"); }], [17, () => showCap("Approaching the entrance gardens")], [25, () => showCap("A low angle reveals the facade in the evening light")], [33, () => showCap("Gliding over palms, lawns and stone paths")],
  [43, () => showCap("The reflecting fountain")], [51, () => showCap("Along the arrival driveway")], [63, () => showCap("The grand entrance")], [76, () => showCap("Through the glass doors")],
  [81, () => { tour.cam = null; setMode("lobby", () => { camera.near = 0.1; camera.updateProjectionMatrix(); startCam(LUX_INT); showCap("The double-height lobby"); }); }],
  [96, () => { capEl.style.opacity = "0"; showTitle("DUBAI AZURE TOWER", "Fictional concept · not approved · not built · not for sale"); }], [101, () => stopTour(true)],
];
document.getElementById("luxBtn").addEventListener("click", () => startTour(false, LUXURY, { silent: true }));
// ---- Amenities tour: wellness club (gym, weights, gymnastics, spa, pool) then the sky restaurant (main, café, sunset). Silent, continuous camera rigs.
function amenSteps() {
  ensureAmenity("wellness"); ensureAmenity("sky"); const W = AV.W, S = AV.S, cut = (fn) => { fadeEl.style.opacity = "1"; setTimeout(() => { fn(); fadeEl.style.opacity = "0"; }, 320); };
  const R = { gym: makeRig([[0, W(238, 0.93, 5.9), W(300, 0.35, 5.0)], [8, W(252, 0.8, 5.9), W(292, 0.3, 5.2)]]), weights: makeRig([[0, W(256, 0.62, 5.7), W(280, 0.2, 5.3)], [8, W(268, 0.5, 5.6), W(300, 0.25, 5.2)]]), gymn: makeRig([[0, W(190, 0.92, 2.0), W(150, 0.45, 2.2)], [10, W(165, 0.9, 2.2), W(135, 0.4, 3.6)]]), spa: makeRig([[0, W(334, 0.82, 1.8), W(342, 0.5, 1.4)], [6, W(352, 0.5, 1.7), W(364, 0.3, 1.2)], [11, W(370, 0.4, 1.7), W(386, 0.2, 1.2)]]), pool: makeRig([[0, W(124, 0.92, 1.9), W(80, 0.5, 0.4)], [10, W(100, 0.95, 1.6), W(62, 0.4, 1.8)]]),
    main: makeRig([[0, S(66, 0.45, 1.9), S(125, 0.9, 1.4)], [9, S(90, 0.5, 1.8), S(150, 0.9, 1.6)]]), cafe: makeRig([[0, S(197, 0.9, 1.8), S(222, 0.3, 1.3)], [8, S(208, 0.62, 1.6), S(226, 0.3, 1.3)]]), sunset: makeRig([[0, S(100, 0.4, 1.5), S(133, 1.5, 2.2)], [10, S(120, 0.55, 1.5), S(140, 1.5, 2.6)]]) };
  return [
    [0, () => { TL({}); state.level = 0; setMode("wellness", () => { camera.near = 0.1; camera.updateProjectionMatrix(); startCam(R.gym); }); setTime(15.6); apply(); capEl.style.opacity = "0"; showTitle("AMENITY FLOORS", "Wellness club and sky restaurant · conceptual"); }],
    [5, () => { hideTitle(); showCap("A luxury gym overview"); }], [10, () => cut(() => { startCam(R.weights); showCap("The weightlifting area: racks, platforms, cables"); })],
    [20, () => cut(() => { state.level = 0; startCam(R.gymn); showCap("The gymnastics and functional zone"); })], [31, () => cut(() => { startCam(R.spa); showCap("The spa: treatment rooms, sauna and steam"); })],
    [44, () => cut(() => { startCam(R.pool); setTime(18.2); showCap("The indoor swimming pool"); })],
    [56, () => { showCap(""); setMode("sky", () => { startCam(R.main); setTime(17.3); showCap("The panoramic sky restaurant"); }); }],
    [67, () => cut(() => { startCam(R.cafe); showCap("The luxury café"); })], [77, () => cut(() => { startCam(R.sunset); tour.tAnim = { from: 17.3, to: 18.6, t0: performance.now() / 1000, dur: 12 }; showCap("Dining at sunset"); })],
    [90, () => { capEl.style.opacity = "0"; showTitle("DUBAI AZURE TOWER", "Fictional concept · amenity floors are conceptual visualizations"); }], [95, () => stopTour(true)],
  ];
}
document.getElementById("amenBtn").addEventListener("click", () => { if (tour.on) return; startTour(false, amenSteps(), { silent: true }); });
const JOURNEY = [
  [0, () => { TL({}); setMode("tower"); setTime(18.4); X.resetArrival(0.27); tweenTo(...VT.arrival, 1200); showTitle("A GUEST ARRIVES", "From the street to the lift"); capEl.style.opacity = "0"; apply(); }],
  [4, () => { hideTitle(); showCap("A street curves up to the covered arrival"); }],
  [13, () => { tweenTo([-16, 2.4, -50], [0, 1.6, -33], 2500); showCap("The car stops at the porte-cochère and the guest steps out"); }],
  [22, () => { setMode("lobby"); setTime(18.6); showCap("Through the doors into the double-height lobby"); }],
  [28, () => { tweenTo([9, 2.0, -19], [0, 1.5, -12.5], 2000); showCap("The receptionist welcomes the guest"); }],
  [37, () => { tweenTo([-2, 1.8, -10], [6, 1.5, -3.6], 2000); showCap("Then it is a short walk to the lifts"); }],
  [45, () => { setMode("tower"); TL({}); state.elev = true; apply(); goViewT("elev"); showCap("Express lifts reach the residences on floor 50 at 8 m per second"); }],
  [55, () => { state.elev = false; setMode("park"); state.pair = true; state.pfire = true; apply(); showCap("Below ground: three levels of parking, reached by a ramp from the street"); }],
  [62, () => { goViewP("ramp"); showCap("Cars drive down the ramp to levels B1 to B3"); }],
  [69, () => { goViewP("air"); showCap("Fresh air comes in, fumes go out, and sensors watch for fire"); }],
  [77, () => { state.pair = false; apply(); X.startParkDemo(); goViewP("b2"); showCap("If a car catches fire, sprinklers and smoke extraction take over"); }],
  [86, () => { X.stopParkDemo(); bannerEl.style.display = "none"; capEl.style.opacity = "0"; showTitle("DUBAI AZURE TOWER", "Fictional concept · not approved · not built · not for sale"); }],
  [91, () => stopTour(true)],
];
document.getElementById("journeyBtn").addEventListener("click", () => startTour(false, JOURNEY));
document.getElementById("tourBtn").addEventListener("click", () => startTour(false));
document.getElementById("recBtn").addEventListener("click", () => startTour(true));
stopTourBtn.addEventListener("click", () => stopTour(false));
addEventListener("keydown", (e) => { if (e.key === "Escape") stopTour(false); });


// ---------------------------------------------------------------- graphics quality + metrics (see quality.js)
const METRICS = createMetrics(renderer, Q, () => state.mode);
function applyTier() {
  const c = Q.cfg; renderer.setPixelRatio(Math.min(devicePixelRatio, c.dpr)); resize();
  if (sun.shadow.mapSize.x !== c.shadowMap) { sun.shadow.mapSize.set(c.shadowMap, c.shadowMap); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  LAND.setDensity(c.landscape, c.water); sun.castShadow = shadowWanted && c.shadows; OFFICE.setPointOK(c.pointLights); APTS.setPointOK(c.pointLights); PENT.setPointOK(c.pointLights); applyLights();
  const sel = document.getElementById("gfx"); if (sel) { sel.value = Q.pref; sel.options[0].textContent = `Auto (${TIERS[Q.pref === "auto" ? Q.tier : Q.tier].label})`; }
  Q.fadeUntil = performance.now() + 2500;
}
Q.toast = (t) => { const el = document.getElementById("toast"); if (!el) return; el.textContent = t; el.style.opacity = "1"; clearTimeout(Q.tt); Q.tt = setTimeout(() => (el.style.opacity = "0"), 5000); };
Q.onChange(applyTier);
{ const sel = document.getElementById("gfx"); if (sel) { [...sel.options].forEach((o) => { if (o.value === "ultra" && !Q.dev.ultraOK) { o.disabled = true; o.textContent = "Ultra (not supported on this device)"; } }); sel.addEventListener("change", () => Q.set(sel.value)); } }
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();

const dynEls = Array.from({ length: 5 }, () => { const d = document.createElement("div"); d.className = "lbl"; labelBox.appendChild(d); return d; });
const clock = new THREE.Clock(); const v = new THREE.Vector3(); let lastNow = performance.now() / 1000;
function frame() {
  const t = clock.getElapsedTime(), now = performance.now() / 1000, dt = Math.min(0.1, now - lastNow); lastNow = now;
  skyUniforms.t.value = t;
  if (ENGV && ENGV.group.visible) { ENGV.update(dt, now); ENGV.placeLabels(camera, innerWidth, innerHeight); }
  if (tween) { const k = Math.min(1, (performance.now() - tween.t0) / tween.dur), e = k * k * (3 - 2 * k); camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0v, tween.t1, e); if (k >= 1) tween = null; }
  const touring = tourUpdate(now); if (state.mode === "lift") liftCamera(); else if (!touring) controls.update(); else if (!tour.orbit || tween) camera.lookAt(controls.target); if (state.mode === "floor") { updateFlow(t); updateDoors(); updateDemo(now); } if (state.mode === "office") OFFICE.update(dt); if (state.mode === "apts") APTS.update(dt); if (state.mode === "pent") PENT.update(dt); if (state.mode === "wellness" && WELL) { WELL.update(dt, now, Q.cfg.water); const cy = camera.position.y; if (!state.mep) { WELL.L10.ceil.visible = state.ceil || cy < 7.7; WELL.L11.ceil.visible = state.ceil || (cy >= 3.9 && cy < 7.7); } } if (state.mode === "sky" && SKY) { SKY.update(dt); if (!state.mep) SKY.ceil.visible = state.ceil || camera.position.y < 3.6; } liftUpdate(dt);
  if (state.mode === "tower" || state.mode === "lobby") LAND.update(now, camera.position, dt);
  // ceilings: shown automatically when the camera is inside a room below the ceiling (so lights never float against the sky), hidden for top-down views
  if (TERR) { const hide = state.mode === "lobby" && camera.position.y > 11 && Math.hypot(camera.position.x, camera.position.z) < 60; for (const m of TERR) m.visible = !hide; }
  if (!state.mep) { const cy = camera.position.y; if (state.mode === "office") OFFICE.ceil.visible = state.ceil || cy < 3.45; else if (state.mode === "apts") APTS.ceil.visible = state.ceil || cy < 3.55; else if (state.mode === "pent") PENT.ceil.visible = state.ceil || cy < 3.55; else if (state.mode === "floor") G.ceil.visible = state.ceil || (cy < 3.45 && camera.position.x > 0 && camera.position.x < W && camera.position.z > 0 && camera.position.z < D); }
  if (state.mode === "tower") LOBBY.visible = !tour.orbit && camera.position.distanceTo(LOBBY_PT) < 80;   // see into the lobby through the glass when close to the entrance
  const xmsg = X.update(now, dt, { night: nightK }); if (xmsg && state.mode === "park") { bannerEl.className = ""; bannerEl.style.display = "block"; bannerEl.textContent = xmsg; }
  const dl = (state.elev && (state.mode === "tower" || state.mode === "park")) ? X.dyn() : []; dynEls.forEach((el, i) => { const o = dl[i]; if (!o) { el.style.display = "none"; return; } v.copy(o.pos).project(camera); if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) { el.style.display = "none"; return; } el.style.display = "block"; el.textContent = o.text; el.style.setProperty("--c", o.color); el.style.left = ((v.x + 1) / 2) * innerWidth + "px"; el.style.top = ((1 - v.y) / 2) * innerHeight + "px"; });
  const sr = tower.update(now, dt); if (sr) { flashEl.style.opacity = String(sr.flash * 0.85); bannerEl.textContent = sr.step; }
  LABELS.forEach((o) => { const on = state[o.l] && !(o.l === "names" && state.mep) && (o.M || (o.T ? ["tower"] : ["floor"])).includes(state.mode); if (!on || !o.t) { o.el.style.display = "none"; return; } v.copy(o.v).project(camera); if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) { o.el.style.display = "none"; return; } o.el.style.display = "block"; o.el.style.left = ((v.x + 1) / 2) * innerWidth + "px"; o.el.style.top = ((1 - v.y) / 2) * innerHeight + "px"; });
  renderer.render(scene, camera); Q.frame(performance.now()); METRICS.update(); requestAnimationFrame(frame);
}
const panels = [...document.querySelectorAll(".panel")]; const hideBtn = document.getElementById("hide");
function togglePanels() { const on = hideBtn.getAttribute("aria-pressed") !== "true"; hideBtn.setAttribute("aria-pressed", String(on)); panels.forEach((p) => (p.style.display = on ? "none" : "")); }
hideBtn.addEventListener("click", togglePanels); addEventListener("keydown", (e) => { if (e.key === "h" || e.key === "H") togglePanels(); });
// start in the whole-building view
controls.maxDistance = 1400; controls.maxPolarAngle = Math.PI - 0.05; FOCUS.set(0, 100, 0); sun.castShadow = false; shadowWanted = false; camera.near = 1.0; camera.updateProjectionMatrix(); putCamera(...VT.over);
setTime(15.5); applyLights(); syncLightButtons(); apply(); tower.highlight(50); frame(); applyTier();

window.__f50 = { ENG: { view: () => ENGV, graph: engGraph, validate: () => validateEngineering(engGraph(), engContext()), SHAFT, PLANT }, GEOM: { validateFloor, validateStack, neighbourReport, getTowerFloorFootprint, run: () => { ensureAmenity("wellness"); ensureAmenity("sky"); const floors = { 12: validateFloor(OFFICE, 12), 49: validateFloor(PENT, 49), 50: validateFloor(APTS, 50), 10: validateFloor(WELL.L10, 10), 11: validateFloor(WELL.L11, 10), 45: validateFloor(SKY.F, 45) }; const lobbyIssues = []; { const cl = makeOutline(1); LOBBY.updateMatrixWorld(true); LOBBY.traverse((o) => { if (!o.isMesh || o.userData.core || /Torus|Ring/.test(o.geometry.type)) return; const g2 = o.geometry; g2.computeBoundingBox(); const bb = g2.boundingBox.clone().applyMatrix4(o.matrixWorld), c = bb.getCenter(new THREE.Vector3()); if (bb.max.y < 0.1 || bb.min.y > 8.9 || (bb.max.x - bb.min.x) > 30) return; const r = Math.hypot(c.x, c.z), a = Math.atan2(c.z, c.x); if (r < cl.coreR(a) - 0.15) lobbyIssues.push({ type: "inside-core", tag: o.geometry.type, detail: `@${(c.x + 27).toFixed(1)},${(c.z + 27).toFixed(1)} r=${r.toFixed(1)} < core ${cl.coreR(a).toFixed(1)}` }); }); } floors.lobby = { floor: 1, name: "lobby", issues: lobbyIssues, stats: { coreMin: 6.1 } }; return { floors, stack: validateStack(), neighbours: { 49: neighbourReport(49), 50: neighbourReport(50) } }; } }, VH, getWELL: () => WELL, getSKY: () => SKY, ensureAmenity, AV, LUX_EXT, LUX_INT, LUXURY, LAND, renderer, Q, sun, scene, ENV, refreshSkyEnv, metrics: () => METRICS.get(), OFFICE, APTS, PENT, LIFT, RIDE, startRide, VO, VA, PHOTO, startTour, stopTour, tour, state, apply, goView, goViewT, goViewL, camera, controls, setTime, lightsOn, applyLights, doors, startDemo, stopDemo, toggleSlide, syncLightButtons, setMode, selectFloor, startStrike, stopStrike, tower, putCamera, VT, VL, VIEWS };
