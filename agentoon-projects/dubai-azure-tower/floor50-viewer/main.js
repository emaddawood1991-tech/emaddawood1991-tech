import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createTower, ringPoint, TP, floorZ, topZ, floorOfY, zoneOf } from "./tower.js";
import { buildExtras } from "./extras.js";

// Floor 50 plan: X 0..28 (west->east), Z 0..20 (core/back wall -> Gulf-facing glass). Y up, metres.
const W = 28, D = 20, WALL_H = 3.6, CEIL_Y = 3.2, VOID_Y = 3.45;

const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
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
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
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
const skyUniforms = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sun: { value: new THREE.Vector3(0, 1, 0) }, glow: { value: new THREE.Color() }, glowK: { value: 0 } };
const dome = new THREE.Mesh(new THREE.SphereGeometry(14000, 32, 20), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUniforms,
  vertexShader: "varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
  fragmentShader: "uniform vec3 top,hor,bot,glow,sun; uniform float glowK; varying vec3 vd; void main(){ float y = vd.y; vec3 c = y > 0.0 ? mix(hor, top, pow(y, 0.5)) : mix(hor, bot, pow(-y, 0.4)); float s = max(dot(normalize(vd), normalize(sun)), 0.0); c += glow * (pow(s, 6.0) * 0.55 + pow(s, 60.0) * 0.6) * glowK; gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}" }));
dome.renderOrder = -10; scene.add(dome);
const starGeo = new THREE.BufferGeometry(); { const a = new Float32Array(900 * 3); for (let i = 0; i < 900; i++) { const u = Math.random() * 2 - 1, t = Math.random() * 6.283, r = Math.sqrt(1 - u * u); a.set([r * Math.cos(t) * 13000, Math.abs(u) * 13000 * 0.95 + 300, r * Math.sin(t) * 13000], i * 3); } starGeo.setAttribute("position", new THREE.BufferAttribute(a, 3)); }
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 30, sizeAttenuation: true, transparent: true, fog: false, depthWrite: false })); scene.add(stars);
const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(260, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1c9, fog: false })); scene.add(sunDisc);
const moonDisc = new THREE.Mesh(new THREE.SphereGeometry(190, 16, 12), new THREE.MeshBasicMaterial({ color: 0xdfe7ff, fog: false })); scene.add(moonDisc);
scene.fog = new THREE.FogExp2(0xcfe0ee, 0.00035);

const seaMat = new THREE.MeshStandardMaterial({ color: 0x1f7fa6, roughness: 0.12, metalness: 0.25 });
{ const sea = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), seaMat); sea.rotation.x = -Math.PI / 2; sea.position.set(0, GROUND - 0.5, 0); OUT.add(sea); }
const sandMat = std(0xcdb48a, 1); { const land = new THREE.Mesh(new THREE.PlaneGeometry(9000, 6000), sandMat); land.rotation.x = -Math.PI / 2; land.position.set(0, GROUND, 330 - 3000); OUT.add(land); }
const roadMat = std(0x2c2f35, 0.9); for (const [x, z, w, d] of [[0, 120, 5000, 22], [0, 250, 5000, 14], [-200, -1200, 16, 3000], [500, -1200, 16, 3000]]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), roadMat); r.rotation.x = -Math.PI / 2; r.position.set(x, GROUND + 0.3, z); OUT.add(r); }
// window textures for towers (colour + lit-window emissive mask)
const winColor = canvasTex(128, 256, (g, w, h) => { g.fillStyle = "#53697f"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { g.fillStyle = `rgba(20,40,60,${0.25 + rnd() * 0.3})`; g.fillRect(x + 1, y + 1, 6, 5); } }, [1, 1]);
const winMask = (() => { const t = canvasTex(128, 256, (g, w, h) => { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) if (rnd() > 0.45) { g.fillStyle = rnd() > 0.5 ? "#ffd9a0" : "#bcd8ff"; g.fillRect(x + 1, y + 1, 6, 5); } }, [1, 1]); return t; })();
const cityMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: winColor, roughness: 0.35, metalness: 0.4, emissive: 0xffffff, emissiveMap: winMask, emissiveIntensity: 0 });
{ // skyline east/west of the site + low-rise beachfront
  for (let i = 0; i < 70; i++) { const w = 22 + rnd() * 30, h = 90 + rnd() * rnd() * 330, x = -1500 + rnd() * 700, z = 90 + rnd() * 200; const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * (0.8 + rnd() * 0.5)), cityMat); b.position.set(x, GROUND + h / 2, z); OUT.add(b); }
  for (let i = 0; i < 90; i++) { const w = 20 + rnd() * 40, h = 8 + rnd() * 24, x = -1500 + rnd() * 3500, z = 140 + rnd() * 160; const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 20 + rnd() * 20), cityMat); b.position.set(x, GROUND + h / 2, z); OUT.add(b); }
  const own = new THREE.Mesh(new THREE.BoxGeometry(W, -GROUND - 0.5, D), cityMat); own.position.set(W / 2, GROUND / 2 - 0.25, D / 2); OUT.add(own); OUT.userData.own = own;   // the tower body below floor 50
}
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
let towerAPI = null, extrasAPI = null, storm = 0, nightK = 0;
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
  skyUniforms.top.value.lerp(C(0x2b313c), storm * 0.85); skyUniforms.hor.value.lerp(C(0x56606d), storm * 0.8); skyUniforms.bot.value.lerp(C(0x3a414c), storm * 0.7);
  skyUniforms.sun.value.copy(sunDir); skyUniforms.glow.value.copy(C(0xffa763)); skyUniforms.glowK.value = cl(e + 0.2, 0, 1) * (0.4 + warmK * 0.8);
  scene.fog.color.copy(skyUniforms.hor.value); scene.fog.density = state.mep ? 0 : 0.00035;
  sun.position.copy(sunDir).multiplyScalar(90).add(FOCUS); sun.target.position.copy(FOCUS); sun.color.copy(C(0xff9248).lerp(C(0xfff1da), cl(e / 0.55, 0, 1)));
  sun.intensity = 2.8 * day * (0.35 + 0.65 * cl(e / 0.4, 0, 1)) + 0.0001;
  moonLight.position.set(FOCUS.x - sunDir.x * 80, -sunDir.y * 80 + 5, FOCUS.z - sunDir.z * 80); moonLight.intensity = 0.55 * (1 - day) * sm(0.02, 0.25, -e);
  hemi.intensity = 0.07 + 0.55 * day + (state.mode === "park" ? 0.9 : 0); hemi.color.copy(C(0x6f86c6).lerp(C(0xdcecff), day));
  scene.environmentIntensity = state.mep || state.mode === "park" ? 0.9 : 0.09 + 0.46 * day; renderer.toneMappingExposure = 1.0 + 0.25 * (1 - day);
  sunDisc.position.copy(sunDir).multiplyScalar(9000); sunDisc.visible = e > -0.03; sunDisc.material.color.copy(C(0xffcf8a).lerp(C(0xfff6dc), cl(e / 0.5, 0, 1)));
  moonDisc.position.copy(sunDir).multiplyScalar(-9000); moonDisc.visible = -e > 0.05 && day < 0.6;
  stars.material.opacity = cl(1 - day * 1.6, 0, 0.95); stars.visible = stars.material.opacity > 0.02;
  seaMat.color.copy(C(0x061a2c).lerp(C(0x1f86ad), day)).lerp(C(0xb86a48), warmK * 0.35);
  sandMat.color.copy(C(0x2a2a30).lerp(C(0xcdb48a), day)); roadMat.color.copy(C(0x14161a).lerp(C(0x2c2f35), day));
  cityMat.emissiveIntensity = 1.5 * (1 - day); cityMat.color.copy(C(0x6d7b8a).lerp(C(0xffffff), day)); burjMat.emissiveIntensity = 1.4 * (1 - day); burjMat.color.copy(C(0x9aa3b8).lerp(C(0xf3f3f1), day));
  nightK = cl(1 - day * 1.4, 0, 1); towerAPI && towerAPI.setNight(nightK); extrasAPI && extrasAPI.setPoolNight(nightK);
  document.getElementById("tlabel") && (document.getElementById("tlabel").textContent = `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60) % 60).padStart(2, "0")}  ${day > 0.6 ? "day" : day < 0.05 ? "night" : e > 0 && h < 12 ? "sunrise" : "sunset"}`);
  document.getElementById("tslider") && (document.getElementById("tslider").value = String(h));
  if (state.lightsAuto) { const on = day < 0.35; Object.keys(lightsOn).forEach((k) => (lightsOn[k] = on)); applyLights(); syncLightButtons(); }
}
const lightsOn = {}; Object.keys(ROOMS).forEach((k) => (lightsOn[k] = false));
function applyLights() { Object.keys(ROOMS).forEach((k) => { const on = lightsOn[k], inMode = k === "lobby" ? state.mode === "lobby" : state.mode === "floor"; LM[k].emissiveIntensity = on ? 2.2 : 0.03; LM[k].color.set(on ? 0xfff1d6 : 0xb8b2a8); roomLights[k].forEach((o) => (o.p.intensity = on && inMode ? o.base : 0)); }); }

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
const LOBBY = new THREE.Group(); scene.add(LOBBY); LOBBY.visible = false;
ROOMS.lobby = "Lobby"; LM.lobby = MAT.light.clone(); roomLights.lobby = []; lightsOn.lobby = false;
{
  const g = LOBBY, w3 = (p) => new THREE.Vector3(-p.x, p.z, p.y), lp = (z, th, o = 0) => w3(ringPoint(z, th, o));
  const poly = (z, off) => Array.from({ length: 144 }, (_, i) => lp(z, (2 * Math.PI * i) / 144, off));
  const lobbyFloorMat = new THREE.MeshStandardMaterial({ map: marbleTex([0.2, 0.2]), roughness: 0.07, metalness: 0.08, envMapIntensity: 1.2 });
  const shapeMesh = (z, off, mat, flip) => { const pts = poly(z, off), s = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, -p.z))); const gm = new THREE.ShapeGeometry(s); gm.rotateX(-Math.PI / 2); const m = new THREE.Mesh(gm, mat); m.position.y = z; if (flip) m.rotation.x = Math.PI; m.receiveShadow = true; g.add(m); return m; };
  shapeMesh(0.03, -0.1, lobbyFloorMat); const ceilM = shapeMesh(9.0, -0.1, new THREE.MeshStandardMaterial({ color: 0xf3efe8, roughness: 0.9, side: THREE.DoubleSide }));
  // marble inlay rings
  for (const r of [10.5, 17.5]) { const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.12, 96), new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 1, roughness: 0.25 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.045; g.add(m); }
  // central lift core, clad in dark marble with bronze fins and three lift portals
  cyl(g, 6.4, 6.4, 9, MAT.marbleDark, 0, 0, 0, 64);
  for (let i = 0; i < 36; i++) { const a = (i / 36) * 6.283; box(g, 0.18, 9, 0.4, MAT.brass, Math.cos(a) * 6.55, 0, Math.sin(a) * 6.55, -a + Math.PI / 2); }
  for (const a of [Math.PI * 0.5, Math.PI * 1.17, Math.PI * 1.83]) { const x = Math.cos(a) * 6.5, z = Math.sin(a) * 6.5; box(g, 4.4, 0.35, 0.2, new THREE.MeshStandardMaterial({ color: 0xffe3b8, emissive: 0xffc27a, emissiveIntensity: 1.5 }), x, 2.9, z, -a + Math.PI / 2).material = LM.lobby; }
  // curved reception desk on the entrance (south) side
  for (let k = 0; k < 11; k++) { const a = (-150 + k * 12) * Math.PI / 180, R = 13.2, x = Math.cos(a) * R, z = Math.sin(a) * R, rot = -(a + Math.PI / 2); box(g, 2.7, 1.12 + 0.002 * k, 0.9, MAT.marbleDark, x, 0, z, rot); box(g, 2.9, 0.06, 1.15, MAT.marble, x, 1.17 + 0.004 * k, z, rot); }
  { const m = new THREE.Mesh(new THREE.TorusGeometry(13.2, 0.04, 8, 90, 2.1), LM.lobby); m.rotation.x = Math.PI / 2; m.rotation.z = -150 * Math.PI / 180; m.position.y = 0.3; g.add(m); }
  const back = local(g, 0, 0, 0); for (let k = 0; k < 5; k++) { const a = (-132 + k * 22) * Math.PI / 180; box(back, 1.2, 2.2, 0.06, new THREE.MeshStandardMaterial({ map: artTex(["#e8d5b5", "#2b4a6b", "#c9a25a", "#7a8f6a", "#d4c3a8"][k], "#1c2b3a", "#f4efe6"), roughness: 0.6 }), Math.cos(a) * 10.4, 1.4, Math.sin(a) * 10.4, -(a + Math.PI / 2)); }
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
const X = buildExtras({ rnd, TP, topZ, floorZ, canvasTex }); extrasAPI = X; [X.STREET, X.PARK, X.ELEV, X.POOLG, X.CROWD].forEach((g) => { g.visible = false; scene.add(g); });
// lobby extras: security gates, flowers, welcome sign
{ const g = LOBBY; for (const x of [-2.6, 2.6]) { box(g, 0.25, 1.0, 1.6, MAT.brass, x, 0, -19.2); box(g, 0.05, 1.5, 0.9, MAT.glassTint, x * 0.55, 0, -19.2); }
  for (const x of [-7, 7]) { cyl(g, 0.35, 0.3, 0.9, MAT.whiteLac, x, 0, -18.5, 20); for (let k = 0; k < 9; k++) sph(g, 0.24, k % 2 ? MAT.leaf2 : MAT.fabricRust, x + Math.cos(k * 2) * 0.28, 1.25 + (k % 3) * 0.2, -18.5 + Math.sin(k * 2) * 0.28); }
  const wt = canvasTex(512, 96, (c, w, h) => { c.fillStyle = "rgba(0,0,0,0)"; c.fillRect(0, 0, w, h); c.fillStyle = "#f2e3c6"; c.font = "600 54px Georgia,serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("W E L C O M E", w / 2, h / 2); });
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 1.0), new THREE.MeshBasicMaterial({ map: wt, transparent: true })); sg.position.set(0, 3.9, -14.9); sg.rotation.y = Math.PI; g.add(sg); }

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
const state = { mode: "tower", furn: true, elec: false, water: false, sewer: false, fire: false, ac: false, xray: false, ceil: false, flow: true, mep: false, lightsAuto: true, struct: false, rebar: false, found: false, glass: false, rain: false, xrayT: false, grades: true, site: true, selFloor: 50, strike: false, elev: false, pair: false, pfire: false, pcars: true, poolsys: false };
const DESC = {
  none: { t: "Furnished floor 50", p: "A sky penthouse level: open living, dining and kitchen facing the Gulf, master suite with walk-in and bath, guest suite, powder room, laundry and a terrace with plunge pool. The view looks toward the Burj Al Arab and the Jumeirah coast.", li: ["Time of day: drag the slider (sun rises in the east, sets in the west)", "Lights: switch rooms on or off; they come on by themselves at night", "Doors: click a door in the 3D view to open or close it", "Systems: electricity, water, sewage, fire safety, air-conditioning"] },
  elec: { t: "Electricity", c: "#ffc21a", p: "Power enters at the distribution boards in the two service risers, runs in trunking above the ceiling, then drops inside the walls to each switch and socket.", li: ["Yellow: lighting circuit, switches at 1.2 m", "Orange: socket circuits (0.3 m, 1.1 m in kitchen/bath)", "Red: dedicated heavy circuits (AC, hob, oven, washer)", "Blue box: smart-home / data hub in the foyer"] },
  water: { t: "Water", c: "#3d8bff", p: "Cold (blue) and hot (red) rise in the risers, run through wall cavities and the floor build-up, and rise to every tap, shower, cistern and appliance.", li: ["Hot-water cylinder in the laundry feeds the hot riser", "Round valves sit at each fixture for isolation", "Moving dots show the flow direction"] },
  sewer: { t: "Sewage", c: "#b07a3c", p: "Every fixture drains into the floor build-up with a 2% fall to a vertical soil stack in each riser. The stack continues down to the building drain; vent pipes go to the roof.", li: ["Brown: soil (toilets)", "Olive: waste (basins, showers, tub, sink, washer)", "Grey discs: floor traps and inspection points", "Pale thin pipe: ventilation stack"] },
  fire: { t: "Fire safety", c: "#ff4a4f", p: "Detectors sense smoke or heat and tell the fire alarm panel. The panel sounds alarms and calls the control room. Heat bursts a sprinkler bulb and water from the wet riser puts out the fire.", li: ["Wet fire riser + floor control valve with flow switch", "Sprinkler heads (red glass bulb) on red pipes above the ceiling", "Smoke detectors (white), heat detector over the kitchen (orange), magenta signal loop to the panel", "Fire alarm control panel (FACP), manual call points, sounder + strobe", "Hose reel cabinet, extinguishers, green exit sign", "Press 'Fire demo' to see it work in the kitchen"] },
  pool: { t: "Glass swimming pool", c: "#7fe9ff", p: "A raised pool with three glass walls and an infinity edge on the sea side. It sits on a reinforced-concrete trough carried by beams that run back to the core. At night its glass tiles and underwater LEDs light up.", li: ["Water is pulled from the main drain and the overflow channel into a balance tank", "A pump pushes it through the filters, the heat pump and the UV / chlorine unit, then back through the return jets", "Make-up water tops up the tank; the glass is laminated low-iron glass", "Use the time slider to see the pool at night"] },
  ac: { t: "Air-conditioning", c: "#25d9e8", p: "Chilled water from the tower's central plant rises in the risers to a fan-coil unit (FCU) above the ceiling in each zone. The FCU cools the air and blows it through ducts to ceiling diffusers; room air returns through a grille.", li: ["Cyan pipes: chilled-water supply; orange: return", "Grey boxes: fan-coil units, with supply ducts to diffusers", "Green: condensate drain into the soil stack", "Purple: thermostat wiring to each FCU", "No outdoor unit on this floor: the plant is central"] },
};
const gradeHex = (c) => "#" + c.toString(16).padStart(6, "0");
const GRT = `<table>${tower.GRADES.map((g) => `<tr><td><span class="sw" style="background:${gradeHex(g.col)}"></span>${g.name}</td><td>floors ${g.from}–${g.to}</td></tr>`).join("")}</table>`;
const DT = {
  none: { t: "The building", p: "50 floors: a 205 m glass shaft plus a 32 m crown and 28 m spire. A tri-lobed plan that tapers and twists 96° with 72 bronze fins and curved balconies on floors 22–46. Hover the glass to find a floor and click to select it.", li: ["Click floor 50 to go up to the penthouse level", "Click the bottom glass (or the Lobby button) to enter the lobby", "Turn on Concrete, Iron, Foundation or Glass layers to look inside", "Try the Rain test and the Thunder strike", "Zones: lobby (1), offices (2–20), residences (21–46), penthouses (47–50)"] },
  struct: { t: "Concrete", c: "#b9bdc4", p: "A buttressed reinforced-concrete core (three wings, like a Y) carries the wind loads and holds the lifts, stairs and risers. 18 perimeter columns follow the twist, and every floor is a post-tensioned flat slab. Two steel outrigger levels tie the core to the columns.", li: ["Concrete is stronger (higher grade) at the base and lighter at the top", "Steel outrigger + belt trusses (blue) at floors 20 and 35", "Gulf-coast mix: sulphate-resisting cement with fly-ash or slag, low permeability, thick cover over the iron", "Colours show the grade by height (toggle in Display)"] , extra: GRT },
  rebar: { t: "Iron (reinforcing steel)", c: "#ff7a2a", p: "Concrete is strong when pressed but weak when pulled, so it is reinforced with ribbed steel bars (orange). Dense vertical bars and ties sit inside the core walls and columns; each slab has a top and bottom mesh; the raft has a heavy double mat.", li: ["Select any floor to see its slab mat (two layers of bars)", "Ties (hoops) every floor keep the vertical bars from buckling", "Near the sea, bars get extra cover and corrosion protection", "The same steel also forms the lightning cage (see Thunder strike)"] },
  found: { t: "Foundation", c: "#9aa0a8", p: "A thick reinforced-concrete raft sits on deep bored piles that carry the whole weight into the ground. Pour cooling and low-heat cement stop the thick raft from cracking while it cures.", li: ["Raft about 4 m thick", "About 150 piles, 1.5 m wide, 46 m deep (concept numbers)", "Ground is made see-through so you can look under it"] },
  glass: { t: "Glass layers", c: "#6fb8ff", p: "The tower wears a unitized glass wall. The exploded panel in front of floor 50 shows its layers. The outer lite, the sealed cavity and the laminated inner lite keep the sun, the rain and the wind out.", li: ["1  Outer 8 mm tempered glass with a blue low-E coating (cuts heat)", "2  16 mm argon-filled cavity, sealed with a warm-edge spacer", "3  Inner 6+6 mm laminated glass: a PVB film holds it together if hit", "Bronze aluminium frame: rain-screen with drained, pressure-equalised joints and EPDM seals", "Gaps at each slab edge are fire-stopped"] },
  rain: { t: "Rain test", c: "#35d4ff", p: "Rain runs down the glass and fins and is caught at the slab-edge drain channel on every floor (cyan lines), then flows down inside the wall. The sealed joints stop water getting in; roof and podium drains lead to storm-water tanks.", li: ["Glass is slightly hydrophobic so water sheets off", "Pressure-equalised joints: wind cannot push rain through", "Balcony slabs fall away from the glass"] },
  elev: { t: "Elevators", c: "#ffd36a", p: "Five lift shafts run inside the concrete core: two express lifts, two mid-rise lifts and one service / fire-fighting lift that also serves the car park. Cars are shown at real speed with their live speed and floor.", li: ["Express A + B: 8 m/s, lobby to floor 50 in about 33 s", "Mid-rise: 6 m/s · Service + fire-fighting: 4 m/s (goes down to the car park)", "Ropes run to the machine room at the top; a counterweight (grey) moves the other way", "Safety: overspeed governor, brakes on the rails, buffers in the pit, battery lowering in a power cut", "Destination dispatch groups passengers going to the same floors"] },
  strike: { t: "Thunder strike", c: "#9aa8ff", p: "Lightning hits the highest metal point (the spire tip). The building is a Faraday cage: the current runs down dedicated conductors bonded to the steel and rebar, not through the rooms, and goes into the earth.", li: ["Air terminal: the spire tip", "Crown ring shares the current between 6 down conductors", "Green boxes: surge protectors on each floor's electrical board", "Earth ring and foundation piles spread the current into the ground", "Press the button again to reset"] },
};
const infoEl = document.getElementById("info");
function floorCard(f) { const g = tower.GRADES.find((x) => f >= x.from && f <= x.to); const y = f === 1 ? "0–9 m" : `${floorZ(f).toFixed(0)}–${(floorZ(f) + TP.floorH).toFixed(0)} m`; return `<h2>Floor ${f} · ${zoneOf(f)}</h2><p>Height ${y}. Structure here: concrete ${g.name}${[20, 21, 35, 36].includes(f) ? "; steel outrigger level nearby" : ""}.${f === 50 ? " Press 'Go to this floor' to enter the furnished level." : f === 1 ? " Press 'Go to this floor' to enter the lobby." : " This demo has furnished interiors only for the lobby and floor 50."}</p>`; }
const poolFacts = () => { const i = extrasAPI.poolInfo; return `<table><tr><td>Size</td><td>${i.L} × ${i.W.toFixed(1)} m, ${i.depth} m deep</td></tr><tr><td>Water</td><td>about ${i.volume.toFixed(0)} m³ (${(i.volume * 1000).toFixed(0)} litres)</td></tr><tr><td>Glass</td><td>${i.glassThk}</td></tr><tr><td>Concrete</td><td>about ${i.concrete} m³ (slab, kerb, beams)</td></tr><tr><td>Rebar</td><td>about ${i.rebarT} t (≈110 kg per m³)</td></tr><tr><td>Load</td><td>about ${i.weightT} t on the floor beams</td></tr></table>`; };
const kvTable = (rows) => `<table>${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("")}</table>`;
function parkInfo() { return `<h2>Underground car park</h2><p>Three levels (B1–B3) under the tower and plaza, about 200 × 170 m, with roughly 1,300 bays. The street drops into a ramp at the east side, runs down past B1 and B2 to B3, and everyone reaches the lobby by the core lifts and stairs.</p><ul><li>Turn on Air flow to see fresh air come in and exhaust go out</li><li>Turn on Fire + sensors to see sprinklers, detectors and CO sensors</li><li>Press 'Car-park fire demo' to see the system react</li></ul>${state.pair ? `<h2 style="color:#39b3ff">Air flow</h2><p>Four supply shafts (blue) bring fresh air in at the plaza edge and feed ducts at every level. Jet fans keep air moving along the aisles. Four exhaust shafts (orange) with roof fans push car fumes out. CO sensors speed the fans up when fumes build up.</p>` : ""}${state.pfire ? `<h2 style="color:#ff4a4f">Fire + sensors</h2><p>Sprinklers (red heads on red pipes) cover every aisle, smoke and heat detectors (white) watch the ceiling, green sensors read carbon monoxide, and alarm strobes and hose reels sit at the lift lobby and stairs. In a fire, the jet fans push smoke toward the exhaust shafts.</p>` : ""}`; }
function renderInfo() {
  let h = "";
  if (state.mode === "park") h = parkInfo(); else if (state.mode === "floor") { const keys = [...LAYERS.filter((k) => state[k]), ...(state.poolsys ? ["pool"] : [])]; const render = (k) => `<h2${DESC[k].c ? ` style="color:${DESC[k].c}"` : ""}>${DESC[k].t}</h2><p>${DESC[k].p}</p><ul>${DESC[k].li.map((x) => `<li>${x}</li>`).join("")}</ul>${k === "pool" ? poolFacts() : ""}`; h = keys.length ? keys.map(render).join("") : render("none"); }
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
const labelBox = document.getElementById("labels");
LABELS.forEach((o) => { o.el = document.createElement("div"); o.el.className = "lbl"; o.el.textContent = o.t; o.el.style.setProperty("--c", o.c); labelBox.appendChild(o.el); o.v = new THREE.Vector3(...o.p); });
LABELS.push({ l: "rain", T: 1, p: [0, 0, 0], t: "", c: "#fff", el: document.createElement("div"), v: new THREE.Vector3() });

function setMat(group, fn) { group.traverse((m) => { if (m.isMesh) fn(m); }); }
const fadeCache = new Map();
function fade(group, op) { setMat(group, (m) => { const mats = Array.isArray(m.material) ? m.material : [m.material]; mats.forEach((mt) => { if (!fadeCache.has(mt)) fadeCache.set(mt, { t: mt.transparent, o: mt.opacity, w: mt.depthWrite }); const s = fadeCache.get(mt); mt.transparent = op < 1 || s.t; mt.opacity = op < 1 ? Math.min(s.o, op) : s.o; mt.depthWrite = op < 1 ? false : s.w; mt.needsUpdate = true; }); }); }
const LAYERS = ["elec", "water", "sewer", "fire", "ac"];
const anyMep = () => LAYERS.some((k) => state[k]);
let strikeStorm = 0; const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 9); renderer.localClippingEnabled = true;
function apply() {
  const fl = state.mode === "floor", tw = state.mode === "tower", lb = state.mode === "lobby";
  document.body.dataset.mode = state.mode;
  const mep = fl && anyMep(); state.mep = mep; const xr = state.xray || mep;
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
  storm = Math.max(tw && state.rain ? 0.35 : 0, strikeStorm);
  const under = (tw && state.found) || pk; [sandMat, roadMat, seaMat].forEach((m) => { m.transparent = under; m.opacity = under ? 0.2 : 1; m.depthWrite = !under; m.needsUpdate = true; });
  scene.background = mep || pk ? new THREE.Color(0x10151c) : null; dome.visible = !mep && !pk; OUT.visible = !mep; OUT.position.set(fl ? 0 : -14, fl ? 0 : 201, fl ? 0 : -10); OUT.userData.own.visible = fl;
  scene.fog.density = mep || pk ? 0 : 0.00035; if (tw) scene.fog.density = 0.00022;
  setTime(hourNow);
  document.querySelectorAll("[data-layer]").forEach((b) => b.setAttribute("aria-pressed", String(!!state[b.dataset.layer])));
  document.querySelectorAll("[data-t]").forEach((b) => b.setAttribute("aria-pressed", String(!!state[b.dataset.t])));
  document.querySelectorAll("#nav [data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));
  document.getElementById("allmep").setAttribute("aria-pressed", String(LAYERS.every((k) => state[k])));
  document.getElementById("lobbyLights").setAttribute("aria-pressed", String(!!lightsOn.lobby));
  renderInfo();
}
// ---------------- floor-50 controls (unchanged behaviour)
document.querySelectorAll("[data-layer]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.layer; const was = anyMep(); state[k] = !state[k]; if (!was && anyMep()) goView("mep"); if (k === "fire" && !state.fire && demo.on) stopDemo(); apply(); }));
document.getElementById("allmep").addEventListener("click", () => { const on = !LAYERS.every((k) => state[k]); const was = anyMep(); LAYERS.forEach((k) => (state[k] = on)); if (!was && on) goView("mep"); apply(); });
document.getElementById("fireDemo").addEventListener("click", () => (demo.on ? (stopDemo(), apply()) : startDemo()));
const tsl = document.getElementById("tslider"); tsl.addEventListener("input", () => setTime(parseFloat(tsl.value)));
document.querySelectorAll("[data-time]").forEach((b) => b.addEventListener("click", () => setTime(parseFloat(b.dataset.time))));
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
const goToFloor = (f) => { selectFloor(f, false); if (f === 50) setMode("floor"); else if (f === 1) setMode("lobby"); else selectFloor(f, true); };
document.getElementById("floorGo").addEventListener("click", () => goToFloor(parseInt(slider.value, 10)));
document.getElementById("goLobby").addEventListener("click", () => setMode("lobby")); document.getElementById("goF50").addEventListener("click", () => setMode("floor"));
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
  if (state.mode === "tower") { const f = pickFloor(e); if (f) { selectFloor(f, false); if (f === 50) setMode("floor"); else if (f === 1) setMode("lobby"); } return; }
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObjects(doorMeshes, false)[0]; if (!hit) return; if (hit.object.userData.slide) toggleSlide(); else { const d = hit.object.userData.door; d.target = d.target ? 0 : 1; }
});
canvas.addEventListener("pointermove", (e) => {
  if (state.mode === "tower") { const f = pickFloor(e); if (f) { tower.highlight(f); hoverEl.style.display = "block"; hoverEl.style.left = e.clientX + 14 + "px"; hoverEl.style.top = e.clientY + 14 + "px"; hoverEl.textContent = `Floor ${f} · ${zoneOf(f)}${f === 50 || f === 1 ? " — click to enter" : " — click to select"}`; canvas.style.cursor = "pointer"; } else { tower.highlight(state.selFloor); hoverEl.style.display = "none"; canvas.style.cursor = "grab"; } return; }
  hoverEl.style.display = "none"; mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera); canvas.style.cursor = state.mode === "floor" && ray.intersectObjects(doorMeshes, false).length ? "pointer" : "grab";
});

// camera presets
const fa = tower.facAnchor;
const VIEWS = {
  over: [[14, 25, 48], [14, 0, 7]], mep: [[14, 29, 33], [14, 0.3, 8]], plan: [[14, 46, 11], [14, 0, 10.9]], living: [[10.5, 1.7, 7.8], [18, 1.1, 16]], kitchen: [[18.2, 2.0, 6.6], [22, 0.9, 1.5]],
  bed: [[7.2, 2.2, 17.2], [3.2, 0.9, 11]], bath: [[7.4, 2.1, 5.4], [3, 0.7, 1.5]], dubai: [[15.5, 1.75, 16.8], [-290, -105, 380]], terrace: [[17, 1.9, 23.2], [-300, -125, 420]], fire: [[19.5, 6.2, 13.5], [22.8, 1.0, 2.0]], poolday: [[14, 2.4, 27.5], [20, 0.5, 22.6]], poolin: [[11.5, 1.7, 18.2], [19.5, 0.7, 22.7]], poolsys: [[22, 3.2, 28.5], [26, 0.2, 22.8]],
};
const VT = { arrival: [[-72, 10, -122], [0, 7, -36]], drive: [[130, 55, -200], [0, 8, -60]], elev: [[-45, 70, -70], [0, 70, 0]], over: [[-150, 140, -340], [0, 125, 0]], struct: [[-70, 115, -135], [0, 112, 0]], crown: [[58, 238, 88], [0, 238, 0]], f50: [[70, 208, 112], [0, 201, 0]], podium: [[90, 26, 130], [0, 14, 0]], under: [[100, -26, 105], [0, -22, 0]], strike: [[170, 135, 340], [0, 135, 0]],
  facade: [fa.c.clone().addScaledVector(fa.nv, 25).add(new THREE.Vector3(0, 0.4, 0)).toArray(), fa.c.clone().addScaledVector(fa.nv, 9).toArray()] };
const VP = { cut: [[170, 120, -210], [5, -6, -12]], ramp: [[150, 30, -190], [92, -4, -105]], b2: [[-62, -5.0, -44], [25, -6.8, -24]], lift: [[0, -1.5, -34], [0, -5, 0]], air: [[-120, 20, -120], [-60, -6, -30]] };
const VL = { entrance: [[0, 1.7, -21], [0, 3, 8]], desk: [[7, 1.9, -20], [-2, 1.2, -12.8]], lounge: [[-17, 1.8, -3], [2, 2.0, 15]], sea: [[-9, 1.7, 12], [25, 14, 60]], top: [[0, 52, 0.1], [0, 0, 0]] };
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

document.getElementById("goPark").addEventListener("click", () => setMode("park")); document.getElementById("goLobbyP").addEventListener("click", () => setMode("lobby"));
document.getElementById("parkDemo").addEventListener("click", () => { if (X.parkDemoOn()) { X.stopParkDemo(); bannerEl.style.display = "none"; document.getElementById("parkDemo").setAttribute("aria-pressed", "false"); } else { state.pfire = true; state.pair = true; apply(); X.startParkDemo(); goViewP("b2"); document.getElementById("parkDemo").setAttribute("aria-pressed", "true"); } });
const fadeEl = document.getElementById("fade");
function setMode(m) {
  if (m === state.mode) return;
  fadeEl.style.opacity = "1";
  setTimeout(() => {
    if (state.strike) stopStrike(); if (demo.on) stopDemo();
    state.mode = m;
    if (m === "floor") { FOCUS.set(W / 2, 0, D / 2); controls.maxDistance = 90; controls.maxPolarAngle = Math.PI / 2 - 0.02; putCamera(...VIEWS.over); }
    else if (m === "lobby") { FOCUS.set(0, 0, 0); controls.maxDistance = 120; controls.maxPolarAngle = Math.PI / 2 - 0.02; putCamera(...VL.entrance); }
    else if (m === "park") { FOCUS.set(0, -5, 0); controls.maxDistance = 700; controls.maxPolarAngle = Math.PI - 0.05; putCamera(...VP.cut); }
    else { FOCUS.set(0, 100, 0); controls.maxDistance = 1400; controls.maxPolarAngle = Math.PI - 0.05; putCamera(...VT.over); }
    sun.castShadow = m === "floor" || m === "lobby"; if (X.parkDemoOn()) X.stopParkDemo(); moonLight.target.position.copy(FOCUS);
    Object.keys(lightsOn).forEach((k) => (lightsOn[k] = lightsOn[k])); applyLights(); syncLightButtons(); apply(); tower.highlight(m === "tower" ? state.selFloor : 0);
    fadeEl.style.opacity = "0";
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
  [85, () => { setMode("floor"); setTime(19.2); showCap("Floor 50: the sky penthouse"); }],
  [91, () => { goView("living"); showCap("Open living, dining and kitchen"); }],
  [97, () => { goView("dubai"); tour.tAnim = { from: 19.2, to: 21.6, t0: performance.now() / 1000, dur: 6 }; showCap("And the lights of Dubai beyond"); }],
  [104, () => { capEl.style.opacity = "0"; showTitle("DUBAI AZURE TOWER", "Fictional concept · not approved · not built · not for sale"); }],
  [110, () => stopTour(true)],
];
function startTour(record, steps) {
  if (tour.on) return; tour.steps = steps || STEPS_T; tour.on = true; tour.t0 = performance.now() / 1000; tour.i = 0; tour.orbit = null; tour.tAnim = null;
  controls.enabled = false; document.querySelectorAll(".panel,#hide").forEach((p) => (p.style.display = "none")); stopTourBtn.style.display = "block"; state.lightsAuto = true;
  ensureAudio(); if (audio.ctx.state === "suspended") audio.ctx.resume(); startMusic();
  if (record && window.MediaRecorder) { try { const vs = canvas.captureStream(30), tracks = [...vs.getVideoTracks(), ...(audio.dest ? audio.dest.stream.getAudioTracks() : [])], mt = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)); tour.chunks = []; tour.rec = new MediaRecorder(new MediaStream(tracks), { mimeType: mt, videoBitsPerSecond: 9000000 }); tour.rec.ondataavailable = (e) => e.data.size && tour.chunks.push(e.data); tour.rec.onstop = () => { const blob = new Blob(tour.chunks, { type: "video/webm" }), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Dubai_Azure_Tower_Tour.webm"; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 1000); }; tour.rec.start(1000); } catch (e) { tour.rec = null; } }
}
function stopTour(finished) {
  if (!tour.on) return; tour.on = false; tour.orbit = null; tour.tAnim = null; stopMusic();
  if (tour.rec && tour.rec.state !== "inactive") tour.rec.stop(); tour.rec = null;
  if (state.strike) stopStrike(); hideTitle(); capEl.style.opacity = "0"; stopTourBtn.style.display = "none"; controls.enabled = true;
  document.querySelectorAll(".panel,#hide").forEach((p) => (p.style.display = "")); hideBtn.setAttribute("aria-pressed", "false"); TL({}); state.elev = false; state.pair = false; state.pfire = false; if (X.parkDemoOn()) X.stopParkDemo(); bannerEl.style.display = "none"; apply(); if (state.mode !== "tower") setMode("tower");
}
function tourUpdate(now) {
  if (!tour.on) return false; const e = now - tour.t0;
  while (tour.i < tour.steps.length && e >= tour.steps[tour.i][0]) { tour.steps[tour.i][1](); tour.i++; }
  if (tour.orbit && !tween) { const o = tour.orbit, a = o.a0 + o.spd * e; camera.position.set(Math.cos(a) * o.r, o.y, Math.sin(a) * o.r); controls.target.set(0, o.ty, 0); camera.lookAt(controls.target); }
  if (tour.tAnim) { const k = Math.min(1, (now - tour.tAnim.t0) / tour.tAnim.dur); setTime(tour.tAnim.from + (tour.tAnim.to - tour.tAnim.from) * (k * k * (3 - 2 * k))); if (k >= 1) tour.tAnim = null; }
  return true;
}
const JOURNEY = [
  [0, () => { TL({}); setMode("tower"); setTime(18.4); X.resetArrival(0.27); tweenTo(...VT.arrival, 1200); showTitle("A GUEST ARRIVES", "From the street to the lift"); capEl.style.opacity = "0"; apply(); }],
  [4, () => { hideTitle(); showCap("A street curves up to the covered arrival"); }],
  [13, () => { tweenTo([-16, 2.4, -50], [0, 1.6, -33], 2500); showCap("The car stops at the porte-cochère and the guest steps out"); }],
  [22, () => { setMode("lobby"); setTime(18.6); showCap("Through the doors into the double-height lobby"); }],
  [28, () => { tweenTo([9, 2.0, -19], [0, 1.5, -12.5], 2000); showCap("The receptionist welcomes the guest"); }],
  [37, () => { tweenTo([-2, 1.8, -10], [6, 1.5, -3.6], 2000); showCap("Then it is a short walk to the lifts"); }],
  [45, () => { setMode("tower"); TL({}); state.elev = true; apply(); goViewT("elev"); showCap("Express lifts reach floor 50 at 8 m per second"); }],
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

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();

const dynEls = Array.from({ length: 5 }, () => { const d = document.createElement("div"); d.className = "lbl"; labelBox.appendChild(d); return d; });
const clock = new THREE.Clock(); const v = new THREE.Vector3(); let lastNow = performance.now() / 1000;
function frame() {
  const t = clock.getElapsedTime(), now = performance.now() / 1000, dt = Math.min(0.1, now - lastNow); lastNow = now;
  if (tween) { const k = Math.min(1, (performance.now() - tween.t0) / tween.dur), e = k * k * (3 - 2 * k); camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0v, tween.t1, e); if (k >= 1) tween = null; }
  const touring = tourUpdate(now); if (!touring) controls.update(); if (state.mode === "floor") { updateFlow(t); updateDoors(); updateDemo(now); }
  const xmsg = X.update(now, dt, { night: nightK }); if (xmsg && state.mode === "park") { bannerEl.className = ""; bannerEl.style.display = "block"; bannerEl.textContent = xmsg; }
  const dl = (state.elev && (state.mode === "tower" || state.mode === "park")) ? X.dyn() : []; dynEls.forEach((el, i) => { const o = dl[i]; if (!o) { el.style.display = "none"; return; } v.copy(o.pos).project(camera); if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) { el.style.display = "none"; return; } el.style.display = "block"; el.textContent = o.text; el.style.setProperty("--c", o.color); el.style.left = ((v.x + 1) / 2) * innerWidth + "px"; el.style.top = ((1 - v.y) / 2) * innerHeight + "px"; });
  const sr = tower.update(now, dt); if (sr) { flashEl.style.opacity = String(sr.flash * 0.85); bannerEl.textContent = sr.step; }
  LABELS.forEach((o) => { const on = state[o.l] && (o.M || (o.T ? ["tower"] : ["floor"])).includes(state.mode); if (!on || !o.t) { o.el.style.display = "none"; return; } v.copy(o.v).project(camera); if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) { o.el.style.display = "none"; return; } o.el.style.display = "block"; o.el.style.left = ((v.x + 1) / 2) * innerWidth + "px"; o.el.style.top = ((1 - v.y) / 2) * innerHeight + "px"; });
  renderer.render(scene, camera); requestAnimationFrame(frame);
}
const panels = [...document.querySelectorAll(".panel")]; const hideBtn = document.getElementById("hide");
function togglePanels() { const on = hideBtn.getAttribute("aria-pressed") !== "true"; hideBtn.setAttribute("aria-pressed", String(on)); panels.forEach((p) => (p.style.display = on ? "none" : "")); }
hideBtn.addEventListener("click", togglePanels); addEventListener("keydown", (e) => { if (e.key === "h" || e.key === "H") togglePanels(); });
// start in the whole-building view
controls.maxDistance = 1400; controls.maxPolarAngle = Math.PI - 0.05; FOCUS.set(0, 100, 0); sun.castShadow = false; putCamera(...VT.over);
setTime(15.5); applyLights(); syncLightButtons(); apply(); tower.highlight(50); frame();
window.__f50 = { startTour, stopTour, tour, state, apply, goView, goViewT, goViewL, camera, controls, setTime, lightsOn, applyLights, doors, startDemo, stopDemo, toggleSlide, syncLightButtons, setMode, selectFloor, startStrike, stopStrike, tower, putCamera, VT, VL, VIEWS };
