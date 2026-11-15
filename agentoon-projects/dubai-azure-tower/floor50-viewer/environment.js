import * as THREE from "three";

// Dubai-inspired surroundings, added to the "outside world" group (illustrative, not a real location):
// textured asphalt / sand / pavement, road markings, sidewalks, and instanced palms + street lights along the coast road.
// Everything is instanced or a few long meshes, so the whole set costs under 12 draw calls.
export function buildEnvironment({ rnd, GROUND, canvasTex }) {
  const group = new THREE.Group(); group.name = "environment";
  const tex = (w, h, fn, rep) => { const t = canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); return t; };
  const speckle = (base, n, spread, a) => (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const v = Math.floor(128 + (rnd() - 0.5) * spread); g.fillStyle = `rgba(${v},${v},${v},${a})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); } };
  const asphalt = tex(256, 256, speckle("#ffffff", 5200, 90, 0.35)), sand = tex(256, 256, (g, w, h) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); for (let i = 0; i < 4200; i++) { const v = Math.floor(215 + (rnd() - 0.5) * 60); g.fillStyle = `rgba(${v},${v - 6},${v - 22},0.5)`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 1.5); } for (let i = 0; i < 9; i++) { g.strokeStyle = "rgba(190,165,120,.18)"; g.lineWidth = 2; g.beginPath(); const y = rnd() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 14, w * 0.6, y - 14, w, y + 6); g.stroke(); } });
  const paving = tex(128, 128, (g, w, h) => { g.fillStyle = "#e4dccd"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(120,105,85,.55)"; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); } for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(110,95,75,${rnd() * 0.12})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); } });
  const dash = tex(64, 8, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "#f3f3ef"; g.fillRect(0, 0, w * 0.5, h); });
  sand.repeat.set(1 / 16, 1 / 16); asphalt.anisotropy = 8; sand.anisotropy = 8;

  // sidewalks + kerbs + dashed centre lines along the coast roads (local z = 120 and 250, running east-west)
  const walkMat = new THREE.MeshStandardMaterial({ map: paving, roughness: 0.85 }), kerbMat = new THREE.MeshStandardMaterial({ color: 0xbdb6a8, roughness: 0.8 });
  const dashMat = new THREE.MeshStandardMaterial({ map: dash, alphaTest: 0.5, roughness: 0.6 });
  const ROADS = [{ z: 120, d: 22 }, { z: 250, d: 14 }], L = 5000;
  ROADS.forEach(({ z, d }) => {
    for (const s of [-1, 1]) {
      const zc = z + s * (d / 2 + 2.5); const w = new THREE.Mesh(new THREE.BoxGeometry(L, 0.3, 5), walkMat); w.position.set(0, GROUND + 0.45, zc); w.geometry.attributes.uv.array.forEach((v, i, a) => (a[i] = v * (i % 2 ? 1 : L / 5))); group.add(w);
      const k = new THREE.Mesh(new THREE.BoxGeometry(L, 0.34, 0.3), kerbMat); k.position.set(0, GROUND + 0.47, z + s * (d / 2 + 0.15)); group.add(k);
    }
    const dm = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.3), dashMat); dm.rotation.x = -Math.PI / 2; dm.position.set(0, GROUND + 0.34, z); dm.geometry.attributes.uv.array.forEach((v, i, a) => (a[i] = i % 2 ? v : v * (L / 6))); group.add(dm);
  });

  // ---- palms (instanced): tapered trunk + drooping fronds
  const fronds = (() => { const pos = [], idx = []; const FR = 9, SEG = 5; for (let f = 0; f < FR; f++) { const a = (f / FR) * Math.PI * 2 + rnd() * 0.3, ca = Math.cos(a), sa = Math.sin(a), Lf = 3.4 + rnd() * 0.8; const base = pos.length / 3; for (let s = 0; s <= SEG; s++) { const t = s / SEG, r = t * Lf, y = 9 + 1.3 * Math.sin(t * 1.9) - 1.9 * t * t, hw = 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08)) + 0.03; const px = ca * r, pz = sa * r; pos.push(px - sa * hw, y, pz + ca * hw, px + sa * hw, y, pz - ca * hw); } for (let s = 0; s < SEG; s++) { const i = base + s * 2; idx.push(i, i + 1, i + 3, i, i + 3, i + 2); } } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; })();
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.34, 9.2, 7); trunkGeo.translate(0, 4.6, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a6247, roughness: 0.95 }), frondMat = new THREE.MeshStandardMaterial({ color: 0x3f7a3a, roughness: 0.8, side: THREE.DoubleSide });
  const palmSpots = []; for (let x = -720; x <= 720; x += 34) { palmSpots.push([x + (rnd() - 0.5) * 8, 120 + 11 + 4.3], [x + 17 + (rnd() - 0.5) * 8, 120 - 11 - 4.3]); } for (let x = -600; x <= 600; x += 60) palmSpots.push([x + (rnd() - 0.5) * 12, 290 + (rnd() - 0.5) * 10]);
  const palmsT = new THREE.InstancedMesh(trunkGeo, trunkMat, palmSpots.length), palmsF = new THREE.InstancedMesh(fronds, frondMat, palmSpots.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  palmSpots.forEach(([x, z], i) => { const s = 0.8 + rnd() * 0.5; q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 6.28); sc.set(s, s * (0.9 + rnd() * 0.3), s); ps.set(x, GROUND + 0.45, z); m4.compose(ps, q, sc); palmsT.setMatrixAt(i, m4); palmsF.setMatrixAt(i, m4); });
  group.add(palmsT, palmsF);

  // ---- street lights (instanced): pole + arm, emissive heads that switch on at night
  const poleGeo = (() => { const a = new THREE.CylinderGeometry(0.1, 0.16, 11, 8); a.translate(0, 5.5, 0); const b = new THREE.BoxGeometry(0.1, 0.1, 3.2); b.translate(0, 11, 1.4); const pa = a.attributes.position, pb = b.attributes.position, pos = new Float32Array((pa.count + pb.count) * 3); pos.set(pa.array, 0); pos.set(pb.array, pa.count * 3); const ia = a.index.array, ib = b.index.array, idx = new Uint32Array(ia.length + ib.length); idx.set(ia, 0); ib.forEach((v, i) => (idx[ia.length + i] = v + pa.count)); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals(); return g; })();
  const headGeo = new THREE.BoxGeometry(0.5, 0.14, 1.0); headGeo.translate(0, 10.9, 2.7);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4f57, roughness: 0.5, metalness: 0.7 }), headMat = new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffd9a0, emissiveIntensity: 0, roughness: 0.4 });
  const lampSpots = []; for (let x = -800; x <= 800; x += 45) { lampSpots.push([x, 120 + 11 + 0.9, Math.PI]); lampSpots.push([x + 22, 120 - 11 - 0.9, 0]); }
  const poles = new THREE.InstancedMesh(poleGeo, poleMat, lampSpots.length), heads = new THREE.InstancedMesh(headGeo, headMat, lampSpots.length), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
  lampSpots.forEach(([x, z, ry], i) => { q.setFromAxisAngle(up, ry); ps.set(x, GROUND + 0.45, z); m4.compose(ps, q, one); poles.setMatrixAt(i, m4); heads.setMatrixAt(i, m4); });
  group.add(poles, heads);
  [palmsT, palmsF, poles, heads].forEach((m) => { m.frustumCulled = false; });   // instances span kilometres; one bounding box would cull wrongly

  return { group, asphalt, sand, setNight: (k) => { headMat.emissiveIntensity = 2.6 * k; }, stats: { palms: palmSpots.length, lamps: lampSpots.length } };
}
