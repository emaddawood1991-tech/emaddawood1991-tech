import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

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
const SKY = canvasTex(8, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6f9fcf'); gr.addColorStop(0.55, '#cfe0ee'); gr.addColorStop(1, '#efe3d0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
scene.background = SKY;
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
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
const G = { struct: new THREE.Group(), walls: new THREE.Group(), furn: new THREE.Group(), ceil: new THREE.Group(), elec: new THREE.Group(), water: new THREE.Group(), sewer: new THREE.Group() };
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
box(G.struct, 9, 0.5, 2.6, MAT.marbleDark, 19.5, -0.45, D + 2.4); // plunge pool basin
box(G.struct, 8.6, 0.02, 2.2, MAT.water, 19.5, -0.04, D + 2.4, 0, false);
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
box(G.struct, W, WALL_H, 0.04, MAT.glassTint, W / 2, 0, D, 0, false);
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
const warm = (x, y, z, i = 22, d = 12) => { const p = new THREE.PointLight(0xffd3a0, i, d, 2); p.position.set(x, y, z); scene.add(p); return p; };
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

// ---------------------------------------------------------------- state / UI
const state = { furn: true, elec: false, water: false, sewer: false, xray: false, ceil: false, flow: true };
const DESC = {
  none: { t: "Furnished floor 50", p: "A sky penthouse level: open living, dining and kitchen facing the Gulf, master suite with walk-in and bath, guest suite, powder room, laundry and a terrace with plunge pool.", li: ["Turn on a utility to see what sits behind the walls", "Walls ghost automatically and furniture dims"] },
  elec: { t: "Electricity", c: "#ffc21a", p: "Power enters at the distribution boards in the two service risers, runs in trunking above the ceiling, then drops inside the walls to each switch and socket.", li: ["Yellow: lighting circuit, switches at 1.2 m", "Orange: socket circuits (0.3 m, 1.1 m in kitchen/bath)", "Red: dedicated heavy circuits (AC, hob, oven, washer)", "Blue box: smart-home / data hub in the foyer", "Dots show the direction of supply"] },
  water: { t: "Water", c: "#3d8bff", p: "Cold (blue) and hot (red) rise in the risers, run through wall cavities and the floor build-up, and rise to every tap, shower, cistern and appliance.", li: ["Hot-water cylinder in the laundry feeds the hot riser", "Round valves sit at each fixture for isolation", "Run direction is shown by the moving dots"] },
  sewer: { t: "Sewage", c: "#b07a3c", p: "Every fixture drains into the floor build-up with a 2% fall to a vertical soil stack in each riser. The stack continues down to the building drain; vent pipes go to the roof.", li: ["Brown: soil (toilets)", "Olive: waste (basins, showers, tub, sink, washer)", "Grey discs: floor traps and inspection points", "Pale thin pipe: ventilation stack"] },
};
const LABELS = [
  { l: "elec", p: [9, 1.9, 0.3], t: "Main distribution board", c: "#ffc21a" }, { l: "elec", p: [27.2, 1.9, 0.3], t: "Sub-board", c: "#ffc21a" }, { l: "elec", p: [15, 2.3, 0.2], t: "Smart-home hub", c: "#2c8cff" }, { l: "elec", p: [20.5, 3.4, 8.2], t: "Ceiling trunking", c: "#ff4a3a" },
  { l: "water", p: [9, 4.4, 0.55], t: "Cold + hot risers", c: "#3d8bff" }, { l: "water", p: [27.1, 1.6, 2.7], t: "Hot-water cylinder", c: "#ff3b30" }, { l: "water", p: [4.1, 1.0, 0.0], t: "Basin taps", c: "#3d8bff" }, { l: "water", p: [20.5, 1.1, 0.0], t: "Kitchen sink", c: "#3d8bff" }, { l: "water", p: [22, 1.2, 12.2], t: "Guest shower", c: "#3d8bff" },
  { l: "sewer", p: [9.0, 4.4, 1.15], t: "Soil stack 1 → building drain", c: "#b07a3c" }, { l: "sewer", p: [27.15, 4.4, 1.0], t: "Soil stack 2 → building drain", c: "#b07a3c" }, { l: "sewer", p: [10.3, 4.9, 1.15], t: "Vent to roof", c: "#d3dae0" }, { l: "sewer", p: [6.9, -0.1, 0.5], t: "WC drain", c: "#b07a3c" }, { l: "sewer", p: [20.5, -0.12, 0.45], t: "Kitchen waste (2% fall)", c: "#a3a83a" },
];
const labelBox = document.getElementById("labels");
LABELS.forEach((o) => { o.el = document.createElement("div"); o.el.className = "lbl"; o.el.textContent = o.t; o.el.style.setProperty("--c", o.c); labelBox.appendChild(o.el); o.v = new THREE.Vector3(...o.p); });

function setMat(group, fn) { group.traverse((m) => { if (m.isMesh) fn(m); }); }
const fadeCache = new Map();
function fade(group, op) {
  setMat(group, (m) => {
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    mats.forEach((mt) => { if (!fadeCache.has(mt)) fadeCache.set(mt, { t: mt.transparent, o: mt.opacity, w: mt.depthWrite }); const s = fadeCache.get(mt); mt.transparent = op < 1 || s.t; mt.opacity = op < 1 ? Math.min(s.o, op) : s.o; mt.depthWrite = op < 1 ? false : s.w; mt.needsUpdate = true; });
  });
}
const anyMep = () => state.elec || state.water || state.sewer;
function apply() {
  const mep = anyMep(); const xr = state.xray || mep;
  G.furn.visible = state.furn || mep; fade(G.furn, mep ? 0.08 : 1); [oakFloor, stoneFloor, deckMat].forEach((m) => { m.color.setScalar(mep ? 0.3 : 1); m.transparent = mep; m.opacity = mep ? 0.16 : 1; m.depthWrite = !mep; m.needsUpdate = true; }); if (!state.furn && !mep) G.furn.visible = false;
  scene.background = mep ? new THREE.Color(0x10151c) : SKY; scene.environmentIntensity = mep ? 0.9 : 0.55;
  G.ceil.visible = state.ceil; G.elec.visible = state.elec; G.water.visible = state.water; G.sewer.visible = state.sewer;
  fade(G.walls, xr ? 0.07 : 1); wallMat.depthWrite = !xr; fade(G.struct.children.length ? new THREE.Group() : G.struct, 1);
  // make the slab see-through when sewage is shown, so the drains below the floor can be seen
  G.struct.children.forEach((m) => { if (m.isMesh && (m.material === MAT.slab || m.material === MAT.concrete)) { m.material.transparent = mep; m.material.opacity = mep ? 0.1 : 1; m.material.depthWrite = !mep; m.material.needsUpdate = true; } });
  document.querySelectorAll("[data-layer]").forEach((b) => b.setAttribute("aria-pressed", String(!!state[b.dataset.layer])));
  document.getElementById("allmep").setAttribute("aria-pressed", String(state.elec && state.water && state.sewer));
  const keys = ["elec", "water", "sewer"].filter((k) => state[k]);
  const info = document.getElementById("info");
  if (!keys.length) info.innerHTML = `<h2>${DESC.none.t}</h2><p>${DESC.none.p}</p><ul>${DESC.none.li.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  else info.innerHTML = keys.map((k) => `<h2 style="color:${DESC[k].c}">${DESC[k].t}</h2><p>${DESC[k].p}</p><ul>${DESC[k].li.map((x) => `<li>${x}</li>`).join("")}</ul>`).join("");
  info.innerHTML += `<span class="tag">fictional concept</span><span class="tag">illustrative routing</span>`;
}
document.querySelectorAll("[data-layer]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.layer; const was = anyMep(); state[k] = !state[k]; if (!was && anyMep()) goView("mep"); apply(); }));
document.getElementById("allmep").addEventListener("click", () => { const on = !(state.elec && state.water && state.sewer); const was = anyMep(); state.elec = state.water = state.sewer = on; if (!was && on) goView("mep"); apply(); });

// camera presets
const VIEWS = {
  over: [[14, 25, 48], [14, 0, 7]], mep: [[14, 29, 33], [14, 0.3, 8]], plan: [[14, 46, 11], [14, 0, 10.9]], living: [[10.5, 1.7, 7.8], [18, 1.1, 16]], kitchen: [[18.2, 2.0, 6.6], [22, 0.9, 1.5]],
  bed: [[7.2, 2.2, 17.2], [3.2, 0.9, 11]], bath: [[7.4, 2.1, 5.4], [3, 0.7, 1.5]],
};
let tween = null;
function goView(name) { const [p, t] = VIEWS[name]; tween = { t0: performance.now(), dur: 900, p0: camera.position.clone(), t0v: controls.target.clone(), p1: new THREE.Vector3(...p), t1: new THREE.Vector3(...t) }; }
document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => goView(b.dataset.view)));
camera.position.set(...VIEWS.over[0]); controls.target.set(...VIEWS.over[1]); controls.update();

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();

const clock = new THREE.Clock(); const v = new THREE.Vector3();
function frame() {
  const t = clock.getElapsedTime();
  if (tween) { const k = Math.min(1, (performance.now() - tween.t0) / tween.dur), e = k * k * (3 - 2 * k); camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0v, tween.t1, e); if (k >= 1) tween = null; }
  controls.update(); updateFlow(t);
  LABELS.forEach((o) => { const on = state[o.l]; if (!on) { o.el.style.display = "none"; return; } v.copy(o.v).project(camera); if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) { o.el.style.display = "none"; return; } o.el.style.display = "block"; o.el.style.left = ((v.x + 1) / 2) * innerWidth + "px"; o.el.style.top = ((1 - v.y) / 2) * innerHeight + "px"; });
  renderer.render(scene, camera); requestAnimationFrame(frame);
}
const panels = [...document.querySelectorAll(".panel")]; const hideBtn = document.getElementById("hide");
function togglePanels() { const on = hideBtn.getAttribute("aria-pressed") !== "true"; hideBtn.setAttribute("aria-pressed", String(on)); panels.forEach((p) => (p.style.display = on ? "none" : "")); }
hideBtn.addEventListener("click", togglePanels); addEventListener("keydown", (e) => { if (e.key === "h" || e.key === "H") togglePanels(); });
apply(); frame();
// hooks for automated checks
window.__f50 = { state, apply, goView, camera, controls };
