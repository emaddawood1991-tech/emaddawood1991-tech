// Spec-driven Three.js scene builder for Agentoon.ai. Loaded by scene.html inside headless Chromium.
// Exposes window.__ready and window.__render(t) so render.mjs can render deterministic frames.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

try {
  const params = new URLSearchParams(location.search);
  const W = +params.get('w') || 720;
  const H = +params.get('h') || 1280;
  const spec = await (await fetch('/spec.json')).json();

  // ---- deterministic random numbers
  let seed = ((spec.seed ?? 1) >>> 0) || 1;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const rad = (d) => (d * Math.PI) / 180;
  const lerp = (a, b, t) => a + (b - a) * t;
  const EASE = {
    linear: (t) => t,
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  };

  // ---- renderer
  const canvas = document.getElementById('c');
  canvas.width = W;
  canvas.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = spec.sky?.exposure ?? 0.55;

  const scene = new THREE.Scene();

  // ---- sky, sun, reflections
  const S = spec.sky ?? {};
  const sunDir = new THREE.Vector3().setFromSphericalCoords(1, Math.PI / 2 - rad(S.sun_elevation ?? 28), rad(S.sun_azimuth ?? 140));
  const sky = new Sky();
  sky.scale.setScalar(450000);
  const u = sky.material.uniforms;
  u.turbidity.value = S.turbidity ?? 5;
  u.rayleigh.value = S.rayleigh ?? 1.5;
  u.mieCoefficient.value = 0.005;
  u.mieDirectionalG.value = 0.8;
  u.sunPosition.value.copy(sunDir);
  scene.add(sky);

  const envScene = new THREE.Scene();
  const sky2 = new Sky();
  sky2.scale.setScalar(450000);
  for (const k of Object.keys(u)) sky2.material.uniforms[k].value = u[k].value;
  envScene.add(sky2);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene).texture;

  scene.fog = new THREE.FogExp2(S.fog_color ?? '#cfe0ee', S.fog_density ?? 0.0022);

  const sun = new THREE.DirectionalLight('#fff1dc', S.sun_intensity ?? 3.2);
  sun.position.copy(sunDir).multiplyScalar(120);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const ext = spec.shadow_extent ?? 55;
  Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 300 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.06;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight('#bcd8ff', '#7a8a5a', 0.55));

  // ---- helpers
  const MAT = {
    plaster: new THREE.MeshStandardMaterial({ color: '#efece6', roughness: 0.85 }),
    plaster2: new THREE.MeshStandardMaterial({ color: '#cfc9bd', roughness: 0.9 }),
    dark: new THREE.MeshStandardMaterial({ color: '#2a2b2f', roughness: 0.55, metalness: 0.3 }),
    roof: new THREE.MeshStandardMaterial({ color: '#3a3b40', roughness: 0.7 }),
    wood: new THREE.MeshStandardMaterial({ color: '#9a6a3f', roughness: 0.6 }),
    deck: new THREE.MeshStandardMaterial({ color: '#b08a5c', roughness: 0.65 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#25404d', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55, envMapIntensity: 1.3 }),
    water: new THREE.MeshPhysicalMaterial({ color: '#12a6d8', roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.88, envMapIntensity: 1.8, clearcoat: 1 }),
    tile: new THREE.MeshStandardMaterial({ color: '#7fd3e6', roughness: 0.3 }),
    coping: new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.5 }),
    asphalt: new THREE.MeshStandardMaterial({ color: '#4a4b52', roughness: 0.95 }),
    paving: new THREE.MeshStandardMaterial({ color: '#c9c3b8', roughness: 0.85 }),
    trunk: new THREE.MeshStandardMaterial({ color: '#5a3f27', roughness: 0.9 }),
    lamp: new THREE.MeshStandardMaterial({ color: '#fff2cf', emissive: '#ffcf8a', emissiveIntensity: 1.6 }),
    sofa: new THREE.MeshStandardMaterial({ color: '#8a8f99', roughness: 0.9 }),
    oak: new THREE.MeshStandardMaterial({ color: '#b98d5e', roughness: 0.5 }),
  };
  const shadowed = (m) => ((m.castShadow = true), (m.receiveShadow = true), m);
  const box = (parent, w, h, d, mat, x, y, z) => {
    const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  function grassTexture(base, repeat) {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 14000; i++) {
      g.fillStyle = `hsl(${88 + rnd() * 28},${30 + rnd() * 22}%,${26 + rnd() * 20}%)`;
      g.fillRect(rnd() * 512, rnd() * 512, 2 + rnd() * 2, 2 + rnd() * 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }

  // ---- ground
  const G = spec.ground ?? {};
  const ground = shadowed(new THREE.Mesh(new THREE.PlaneGeometry(G.size ?? 600, G.size ?? 600), new THREE.MeshStandardMaterial({ map: grassTexture(G.color ?? '#6b8a48', (G.size ?? 600) / 10), roughness: 1 })));
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  scene.add(ground);
  if (G.plot) {
    const plot = shadowed(new THREE.Mesh(new THREE.PlaneGeometry(G.plot.w, G.plot.d), new THREE.MeshStandardMaterial({ map: grassTexture(G.plot.color ?? '#7da24f', G.plot.w / 8), roughness: 1 })));
    plot.rotation.x = -Math.PI / 2;
    plot.position.y = 0.02;
    plot.castShadow = false;
    scene.add(plot);
  }

  // ---- distant hills for depth at the horizon
  if (spec.hills !== false) {
    for (let i = 0; i < 18; i++) {
      const a = rnd() * Math.PI * 2, r = 200 + rnd() * 90, sc = 40 + rnd() * 55;
      const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.29 + rnd() * 0.05, 0.25, 0.3 + rnd() * 0.08), roughness: 1 }));
      hill.scale.set(sc, 8 + rnd() * 16, sc * (0.6 + rnd() * 0.6));
      hill.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      hill.rotation.y = rnd() * 3;
      scene.add(hill);
    }
  }

  // ---- paths (driveway, walkways)
  const blockers = []; // [x, z, radius] keep trees away from buildings, pool and paths
  for (const p of spec.paths ?? []) {
    const mat = p.material === 'paving' ? MAT.paving : MAT.asphalt;
    for (let i = 0; i < p.points.length - 1; i++) {
      const [x0, z0] = p.points[i];
      const [x1, z1] = p.points[i + 1];
      const len = Math.hypot(x1 - x0, z1 - z0);
      const seg = box(scene, p.width ?? 4, 0.05, len + (p.width ?? 4) * 0.5, mat, (x0 + x1) / 2, 0.045, (z0 + z1) / 2);
      seg.rotation.y = Math.atan2(x1 - x0, z1 - z0);
      seg.castShadow = false;
      for (let s = 0; s <= len; s += 2) blockers.push([lerp(x0, x1, s / len), lerp(z0, z1, s / len), (p.width ?? 4) / 2 + 1.5]);
    }
  }

  // ---- villa
  function villa(b) {
    const g = new THREE.Group();
    g.position.set(b.x ?? 0, 0, b.z ?? 0);
    g.rotation.y = rad(b.rotation ?? 0);
    const w = b.w ?? 16, d = b.d ?? 11, fh = b.floor_height ?? 3.2;
    box(g, w + 1.4, 0.35, d + 1.4, MAT.plaster2, 0, 0.175, 0); // plinth
    // ground floor: glass volume, columns, interior hints, louvres
    const y1 = 0.35 + fh / 2;
    box(g, w - 0.6, fh, d - 0.6, MAT.glass, 0, y1, 0).castShadow = false;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.4, fh, 0.4, MAT.plaster, sx * (w / 2 - 0.3), y1, sz * (d / 2 - 0.3));
    for (let i = 1; i < 4; i++) box(g, 0.08, fh, 0.08, MAT.dark, -w / 2 + 0.3 + (i * (w - 0.6)) / 4, y1, d / 2 - 0.32);
    box(g, 3.4, 0.45, 1.0, MAT.sofa, -w * 0.2, 0.6, 0.5);
    box(g, 3.4, 0.9, 0.25, MAT.sofa, -w * 0.2, 0.85, -0.1);
    box(g, 2.6, 0.95, 1.1, MAT.plaster, w * 0.2, 0.83, -1.0);
    box(g, 0.5, 0.5, 0.5, MAT.lamp, w * 0.2, 3.2, -1.0);
    for (let i = 0; i < 9; i++) box(g, 0.1, fh - 0.4, 0.22, MAT.wood, w * 0.05 + i * 0.32, y1, d / 2 + 0.25);
    box(g, 1.3, 2.5, 0.12, MAT.dark, -w * 0.38, 0.35 + 1.25, d / 2 - 0.2); // front door
    // slab between floors, cantilevered upper volume, roof
    const yS = 0.35 + fh + 0.15;
    box(g, w + 1.6, 0.3, d + 1.6, MAT.plaster, 0, yS, 0);
    const uw = w * 0.72, ud = d * 0.92, ux = w * 0.17, uh = fh * 0.95, yU = yS + 0.15 + uh / 2;
    box(g, uw, uh, ud, MAT.plaster, ux, yU, 0);
    for (const sz of [-1, 1]) {
      box(g, uw * 0.86, 1.5, 0.08, MAT.glass, ux, yU + 0.1, sz * (ud / 2 + 0.03)).castShadow = false;
      box(g, uw * 0.86 + 0.12, 0.08, 0.12, MAT.dark, ux, yU + 0.89, sz * (ud / 2 + 0.04));
      box(g, uw * 0.86 + 0.12, 0.08, 0.12, MAT.dark, ux, yU - 0.69, sz * (ud / 2 + 0.04));
    }
    box(g, 0.08, 1.5, ud * 0.7, MAT.glass, ux + uw / 2 + 0.03, yU + 0.1, 0).castShadow = false;
    const yR = yS + 0.15 + uh + 0.17;
    box(g, uw + 1.6, 0.34, ud + 1.6, MAT.roof, ux, yR, 0);
    // terrace on the lower roof with glass railing
    const tx = -w / 2 + (w / 2 - uw / 2 + ux) / 2 - 0.4;
    box(g, w * 0.26, 0.05, d * 0.9, MAT.deck, -w * 0.36, yS + 0.18, 0);
    box(g, 0.05, 1.0, d * 0.9, MAT.glass, -w / 2 - 0.7, yS + 0.65, 0).castShadow = false;
    box(g, 0.06, 0.06, d * 0.9, MAT.dark, -w / 2 - 0.7, yS + 1.15, 0);
    scene.add(g);
    blockers.push([b.x ?? 0, b.z ?? 0, Math.hypot(w, d) / 2 + 3]);
    return g;
  }
  for (const b of spec.buildings ?? []) villa(b);

  // ---- pool with deck
  if (spec.pool) {
    const { x, z, w, d } = spec.pool;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    box(g, w + 5, 0.07, d + 5, MAT.deck, 0, 0.065, 0);
    box(g, w + 0.7, 0.1, d + 0.7, MAT.coping, 0, 0.1, 0);
    box(g, w, 0.04, d, MAT.tile, 0, 0.11, 0);
    box(g, w - 0.05, 0.03, d - 0.05, MAT.water, 0, 0.14, 0).castShadow = false;
    for (let i = 0; i < 3; i++) {
      box(g, 0.7, 0.3, 1.9, MAT.coping, (w / 2 + 1.9), 0.3, -d / 2 + 1.2 + i * 2.1);
    }
    const pole = box(g, 0.06, 2.4, 0.06, MAT.dark, w / 2 + 3.6, 1.3, 0);
    const top = shadowed(new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.5, 12), MAT.plaster));
    top.position.set(w / 2 + 3.6, 2.5, 0);
    g.add(top);
    scene.add(g);
    blockers.push([x, z, Math.max(w, d) / 2 + 4]);
  }

  // ---- trees and palms
  const sway = [];
  function foliageMat() {
    return new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.27 + rnd() * 0.06, 0.55, 0.12 + rnd() * 0.08), roughness: 0.85 });
  }
  function roundTree(x, z, s) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const trunk = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.3 * s, 2.8 * s, 8), MAT.trunk));
    trunk.position.y = 1.4 * s;
    g.add(trunk);
    const crown = new THREE.Group();
    crown.position.y = 2.6 * s;
    for (const [dx, dy, dz, r] of [[0, 1.5, 0, 1.9], [1, 0.9, 0.4, 1.3], [-0.9, 1.0, -0.5, 1.4], [0.2, 2.3, 0.2, 1.2]]) {
      const m = shadowed(new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), foliageMat()));
      m.position.set(dx * s, dy * s, dz * s);
      m.scale.y = 0.9;
      crown.add(m);
    }
    g.add(crown);
    sway.push([crown, rnd() * 6.28]);
    scene.add(g);
  }
  function pineTree(x, z, s) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const trunk = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.22 * s, 1.6 * s, 6), MAT.trunk));
    trunk.position.y = 0.8 * s;
    g.add(trunk);
    const crown = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const m = shadowed(new THREE.Mesh(new THREE.ConeGeometry((2.0 - i * 0.5) * s, 2.6 * s, 9), foliageMat()));
      m.position.y = (2.3 + i * 1.5) * s;
      crown.add(m);
    }
    g.add(crown);
    sway.push([crown, rnd() * 6.28]);
    scene.add(g);
  }
  function palm(x, z, s) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rnd() * 6.28;
    let px = 0, py = 0;
    for (let i = 0; i < 6; i++) {
      const seg = shadowed(new THREE.Mesh(new THREE.CylinderGeometry((0.13 - i * 0.008) * s, (0.15 - i * 0.008) * s, 1.0 * s, 7), MAT.trunk));
      seg.position.set(px, py + 0.5 * s, 0);
      seg.rotation.z = -0.05 * i;
      g.add(seg);
      px += Math.sin(0.05 * i) * 0.5 * s * 0.4;
      py += 0.97 * s;
    }
    const crown = new THREE.Group();
    crown.position.set(px, py, 0);
    const lm = foliageMat();
    lm.side = THREE.DoubleSide;
    for (let i = 0; i < 9; i++) {
      const leaf = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.3 * s, 3.2 * s, 4), lm));
      leaf.scale.z = 0.12;
      const piv = new THREE.Group();
      piv.rotation.y = (i / 9) * Math.PI * 2;
      leaf.position.set(0, 0, 0);
      leaf.rotation.x = Math.PI / 2 + 0.5;
      leaf.position.z = 1.4 * s;
      leaf.position.y = -0.25 * s;
      piv.add(leaf);
      crown.add(piv);
    }
    g.add(crown);
    sway.push([crown, rnd() * 6.28]);
    scene.add(g);
  }
  const T = spec.trees ?? {};
  const area = T.area ?? { x: [-35, 35], z: [-25, 25] };
  let placed = 0, tries = 0;
  const types = T.types ?? ['round', 'round', 'pine', 'palm'];
  while (placed < (T.count ?? 0) && tries++ < 4000) {
    const x = lerp(area.x[0], area.x[1], rnd());
    const z = lerp(area.z[0], area.z[1], rnd());
    if (blockers.some(([bx, bz, r]) => Math.hypot(x - bx, z - bz) < r)) continue;
    const kind = types[Math.floor(rnd() * types.length)];
    const s = 0.8 + rnd() * 0.6;
    (kind === 'palm' ? palm : kind === 'pine' ? pineTree : roundTree)(x, z, s);
    blockers.push([x, z, 2.5]);
    placed++;
  }

  // ---- camera
  const C = spec.camera ?? {};
  const camera = new THREE.PerspectiveCamera(C.fov ?? 35, W / H, 0.5, 1e6);
  const keys = C.keys;
  const ease = EASE[C.ease ?? 'inOutSine'] ?? EASE.inOutSine;
  const orbitPos = (o) => new THREE.Vector3(o.center[0] + o.radius * Math.sin(rad(o.azimuth)), o.height, o.center[2] + o.radius * Math.cos(rad(o.azimuth)));
  function poseAt(t) {
    let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1].t) i++;
    const a = keys[i], b = keys[i + 1];
    const u = ease(Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))));
    let pos, target;
    if (a.orbit && b.orbit) {
      const o = {
        center: a.orbit.center.map((v, k) => lerp(v, b.orbit.center[k], u)),
        radius: lerp(a.orbit.radius, b.orbit.radius, u),
        azimuth: lerp(a.orbit.azimuth, b.orbit.azimuth, u),
        height: lerp(a.orbit.height, b.orbit.height, u),
      };
      pos = orbitPos(o);
      target = new THREE.Vector3(...o.center);
    } else {
      const pa = a.orbit ? orbitPos(a.orbit) : new THREE.Vector3(...a.pos);
      const pb = b.orbit ? orbitPos(b.orbit) : new THREE.Vector3(...b.pos);
      const ta = new THREE.Vector3(...(a.orbit ? a.orbit.center : a.target));
      const tb = new THREE.Vector3(...(b.orbit ? b.orbit.center : b.target));
      pos = pa.lerp(pb, u);
      target = ta.lerp(tb, u);
    }
    return { pos, target, fov: lerp(a.fov ?? C.fov ?? 35, b.fov ?? C.fov ?? 35, u) };
  }

  window.__render = (t) => {
    const p = poseAt(t);
    camera.position.copy(p.pos);
    camera.lookAt(p.target);
    camera.fov = p.fov;
    camera.updateProjectionMatrix();
    for (const [grp, ph] of sway) grp.rotation.z = Math.sin(t * 1.4 + ph) * 0.012;
    renderer.render(scene, camera);
  };
  window.__info = { trees: placed, duration: spec.duration ?? keys[keys.length - 1].t, fps: spec.fps ?? 24, name: spec.name ?? 'scene' };
  window.__render(0);
  window.__ready = true;
} catch (e) {
  window.__error = String(e && e.stack ? e.stack : e);
}
