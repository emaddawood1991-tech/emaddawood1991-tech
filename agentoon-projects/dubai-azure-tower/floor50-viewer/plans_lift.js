import * as THREE from "three";

// Lift cabin interior used for the ride up to the residences. Cabin: 2.0 m wide (x), 2.4 m deep (z), 2.6 m high.
// Doors on the +z side. Placed far from the rest of the scene and lit by its own lights.
export function buildLift(H) {
  const { box, rbox, cyl, canvasTex, std } = H;
  const g = new THREE.Group(); g.position.set(400, 0, 0);
  const bronze = std(0xb08a4a, 0.28, 1), dark = std(0x2b2523, 0.55), steel = std(0xc9ced4, 0.25, 1), floorM = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.18 });
  const mirror = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.05 });
  const lightM = new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffe2b0, emissiveIntensity: 2.4 });
  const W = 2.0, D = 2.4, Ht = 2.6;
  box(g, W + 0.2, 0.1, D + 0.2, floorM, 0, -0.1, 0); box(g, W, 0.02, D, floorM, 0, 0, 0);
  box(g, W, 0.1, D, dark, 0, Ht, 0);                                   // ceiling
  box(g, 1.6, 0.03, 1.6, lightM, 0, Ht - 0.02, 0);                     // light panel
  // walls: bronze wainscot + dark wood + mirror
  box(g, 0.06, Ht, D, dark, -W / 2, 0, 0); box(g, 0.06, Ht, D, dark, W / 2, 0, 0); box(g, W, Ht, 0.06, dark, 0, 0, -D / 2);
  for (const sx of [-1, 1]) { box(g, 0.02, 0.9, D - 0.2, bronze, sx * (W / 2 - 0.04), 0.05, 0); box(g, 0.02, 0.05, D - 0.1, bronze, sx * (W / 2 - 0.04), 1.0, 0); box(g, 0.05, 0.05, 1.8, steel, sx * (W / 2 - 0.1), 0.95, 0).position.x = sx * (W / 2 - 0.12); }
  const mir = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.5, 1.3), mirror); mir.position.set(0, 1.45, -D / 2 + 0.035); g.add(mir);
  box(g, W - 0.4, 0.9, 0.02, bronze, 0, 0.05, -D / 2 + 0.035); box(g, 0.04, 1.3, 0.03, bronze, -(W - 0.5) / 2, 0.8, -D / 2 + 0.035); box(g, 0.04, 1.3, 0.03, bronze, (W - 0.5) / 2, 0.8, -D / 2 + 0.035);
  // front: door frame, two sliding leaves, display above, panel on the right
  box(g, W, 0.35, 0.1, dark, 0, Ht - 0.35, D / 2); box(g, 0.2, Ht, 0.1, dark, -W / 2 + 0.1, 0, D / 2); box(g, 0.45, Ht, 0.1, dark, W / 2 - 0.225, 0, D / 2);
  const dw = (W - 0.65) / 2;
  const leafA = box(g, dw, 2.2, 0.05, steel, -0.1 - dw / 2 + 0.0, 0, D / 2 - 0.02), leafB = box(g, dw, 2.2, 0.05, steel, -0.1 + dw / 2, 0, D / 2 - 0.02);
  leafA.userData.x0 = leafA.position.x; leafB.userData.x0 = leafB.position.x;
  const beyond = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#f2e6d2"); gr.addColorStop(1, "#c9b896"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(60, 40, 136, 200); }), toneMapped: false })); beyond.position.set(0, 1.2, D / 2 + 0.6); g.add(beyond);
  // floor display
  const dc = document.createElement("canvas"); dc.width = 256; dc.height = 96; const dctx = dc.getContext("2d"), dtex = new THREE.CanvasTexture(dc); dtex.colorSpace = THREE.SRGBColorSpace;
  const dspl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshBasicMaterial({ map: dtex, toneMapped: false })); dspl.position.set(-0.1, 2.35, D / 2 - 0.055); dspl.rotation.y = Math.PI; g.add(dspl);
  // call panel (right of the door, inside): floor buttons
  const pnl = box(g, 0.28, 1.0, 0.04, steel, W / 2 - 0.22, 0.65, D / 2 - 0.1); pnl.rotation.y = 0;
  const bt = []; for (let i = 0; i < 10; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffb347, emissiveIntensity: i === 9 ? 1.6 : 0 })); b.rotation.x = Math.PI / 2; b.position.set(W / 2 - 0.22 + (i % 2 ? 0.06 : -0.06), 1.05 - Math.floor(i / 2) * 0.1, D / 2 - 0.135); g.add(b); bt.push(b); }
  // ceiling lights
  const pl = new THREE.PointLight(0xffe7c4, 6, 7, 2); pl.position.set(0, 2.3, 0); g.add(pl);
  const L = { g, pl, leafA, leafB, dw, doorK: 0, doorTarget: 0, lastKey: "" };
  L.setDisplay = (floor, dir, label) => { const key = `${floor}|${dir}|${label}`; if (key === L.lastKey) return; L.lastKey = key; dctx.fillStyle = "#050a10"; dctx.fillRect(0, 0, 256, 96); dctx.fillStyle = "#ffb347"; dctx.font = "bold 54px monospace"; dctx.textBaseline = "middle"; dctx.textAlign = "center"; dctx.fillText(String(floor), 148, 52); dctx.font = "bold 40px sans-serif"; dctx.fillText(dir > 0 ? "▲" : dir < 0 ? "▼" : "●", 60, 50); dctx.font = "13px monospace"; dctx.fillStyle = "#8aa"; dctx.fillText(label || "", 150, 86); dtex.needsUpdate = true; };
  L.setDoors = (open) => (L.doorTarget = open ? 1 : 0);
  L.update = (dt) => { L.doorK += (L.doorTarget - L.doorK) * Math.min(1, dt * 2.6); const s = L.doorK * (dw - 0.02); leafA.position.x = leafA.userData.x0 - s; leafB.position.x = leafB.userData.x0 + s; };
  L.setDisplay(1, 0, "LOBBY");
  // camera (inside, near the back wall, looking at the doors)
  L.cam = { p: [400 + 0.35, 1.6, -0.85], t: [400 - 0.1, 1.45, 1.2] };
  return L;
}
