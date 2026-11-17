import * as THREE from "three";

// Renders the building engineering graph (building.js): instanced pipes/cables/ducts, node markers, flow particles, route tracing, fire demonstration.
const MAJOR = new Set(["util", "mv", "mdb", "gen", "tank", "pump", "heater", "ets", "facp", "ftank", "fpump", "ejector", "mh", "sewer", "vent", "dehum", "ahu", "circ", "recall", "pfan", "grease", "oil", "airgap", "load"]);
const LABELED = new Set(["util", "mdb", "gen", "tank", "pump", "heater", "ets", "facp", "ftank", "fpump", "ejector", "sewer", "vent", "dehum", "recall", "pfan", "airgap", "grease", "oil"]);
const SIZE = (k) => (MAJOR.has(k) ? 0.5 : ["fixture", "drain", "head", "lightc", "powerc", "emerg", "smoked", "heatd", "diff", "grille", "fcu", "exh", "hood", "thermo", "humid", "mcp", "sounder", "inlet", "skim", "suction"].includes(k) ? 0.16 : 0.22);

export function createEngView(graph, SYSTEMS, SUB, labelBox) {
  const group = new THREE.Group(); group.name = "engineering"; group.visible = false;
  const nodes = graph.nodes, edges = graph.edges, idx = graph.idx, adjF = new Map(), adjB = new Map();
  edges.forEach((e) => { (adjF.get(e.from) || adjF.set(e.from, []).get(e.from)).push(e); (adjB.get(e.to) || adjB.set(e.to, []).get(e.to)).push(e); });
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true), box = new THREE.BoxGeometry(1, 1, 1), sph = new THREE.SphereGeometry(1, 10, 8);
  const UP = new THREE.Vector3(0, 1, 0), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
  const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d"); const gr = g.createRadialGradient(16, 16, 1, 16, 16, 15); gr.addColorStop(0, "#fff"); gr.addColorStop(0.5, "#fff"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); const t = new THREE.CanvasTexture(c); return t; })();
  let meshes = [], segMap = [], nodeMesh = null, nodeIds = [], flows = null, labels = [], sel = { systems: [], floor: null }, trace = null, speedK = 1, demo = null, extra = null;
  const subColor = (e) => (SUB[e.sys] && SUB[e.sys][e.sub] ? SUB[e.sys][e.sub][0] : 0xffffff);
  const inFloor = (e, f) => { if (f == null) return true; const a = e.f0, b = e.f1; if (a === b) return a === f || (a <= 0 && f <= 1); return a <= f + 1 && b >= f - 1; };
  const nodeIn = (n, f) => { if (f == null) return true; if (n.floor === f || (n.floor <= 0 && f <= 1)) return true; if (n.floor === 51) return f >= 49; return Math.abs(n.floor - f) <= 1 && /tap|fdb|fm|fv|stack|sdamper|pdamp|wtap|louvre/.test(n.kind); };

  function clear() { meshes.forEach((m) => { group.remove(m); m.dispose && m.dispose(); }); meshes = []; segMap = []; if (nodeMesh) { group.remove(nodeMesh); nodeMesh.dispose(); nodeMesh = null; } if (flows) { group.remove(flows.points); flows.points.geometry.dispose(); flows = null; } labels.forEach((l) => l.el.remove()); labels = []; if (extra) { group.remove(extra.g); extra = null; } }

  function build() {
    clear(); const sysSet = new Set(sel.systems), f = sel.floor, K = f == null ? 4 : 1.6, KN = f == null ? 3.2 : 1.3, es = edges.filter((e) => sysSet.has(e.sys) && inFloor(e, f)), ns = nodes.filter((n) => sysSet.has(n.sys) && nodeIn(n, f));
    // segments grouped by (colour, kind)
    const groups = new Map(); es.forEach((e) => { const key = `${subColor(e)}|${e.kind === "duct" ? "d" : "p"}`; (groups.get(key) || groups.set(key, []).get(key)).push(e); });
    groups.forEach((list, key) => { const [c, k] = key.split("|"); let n = 0; list.forEach((e) => (n += e.pts.length - 1)); const mat = new THREE.MeshStandardMaterial({ color: +c, roughness: 0.45, metalness: 0.3, emissive: +c, emissiveIntensity: 0.28, side: THREE.DoubleSide }); const im = new THREE.InstancedMesh(k === "d" ? box : cyl, mat, n); im.instanceMatrix.setUsage(THREE.StaticDrawUsage); const map = []; let i = 0;
      list.forEach((e) => { for (let s = 1; s < e.pts.length; s++) { v1.set(...e.pts[s - 1]); v2.set(...e.pts[s]); v3.subVectors(v2, v1); const len = v3.length(); if (len < 1e-4) { sc.set(0, 0, 0); m4.compose(v1, q.identity(), sc); im.setMatrixAt(i, m4); map.push(e); i++; continue; } q.setFromUnitVectors(UP, v3.normalize()); const mid = v1.clone().add(v2).multiplyScalar(0.5); const r = (e.kind === "duct" ? e.r * 2 : e.r) * K * (f == null && e.r < 0.08 ? 0.6 : 1); sc.set(r, len, r); m4.compose(mid, q, sc); im.setMatrixAt(i, m4); im.setColorAt(i, col.set(0xffffff)); map.push(e); i++; } });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.userData.map = map; group.add(im); meshes.push(im); segMap.push(map); });
    // node markers
    nodeIds = ns.map((n) => n.id); nodeMesh = new THREE.InstancedMesh(sph, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, emissive: 0x222222 }), Math.max(1, ns.length)); nodeMesh.count = ns.length;
    ns.forEach((n, i) => { v1.set(...n.p); const s = SIZE(n.kind) * KN; sc.set(s, s, s); m4.compose(v1, q.identity(), sc); nodeMesh.setMatrixAt(i, m4); nodeMesh.setColorAt(i, col.set(SYSTEMS[n.sys].color)); }); nodeMesh.instanceMatrix.needsUpdate = true; nodeMesh.instanceColor && (nodeMesh.instanceColor.needsUpdate = true); group.add(nodeMesh);
    // labels for the major equipment only
    ns.filter((n) => LABELED.has(n.kind)).forEach((n) => { const el = document.createElement("div"); el.className = "lbl"; el.textContent = n.name; el.style.setProperty("--c", "#" + SYSTEMS[n.sys].color.toString(16).padStart(6, "0")); labelBox.appendChild(el); labels.push({ el, v: new THREE.Vector3(...n.p), n }); });
    buildFlows(es); applyTrace();
  }

  function buildFlows(es) {
    const list = es.filter((e) => e.flow && (!trace || trace.edges.has(e.id))), total = list.reduce((s, e) => s + polyLen(e.pts), 0), spacing = Math.max(1.4, total / 6500), parts = [];
    list.forEach((e) => { const cum = [0]; for (let i = 1; i < e.pts.length; i++) cum.push(cum[i - 1] + Math.hypot(e.pts[i][0] - e.pts[i - 1][0], e.pts[i][1] - e.pts[i - 1][1], e.pts[i][2] - e.pts[i - 1][2])); const L = cum[cum.length - 1]; if (L < 0.05) return; const n = Math.max(1, Math.round(L / spacing)); for (let k = 0; k < n; k++) parts.push({ e, cum, L, s: (k / n) * L, c: subColor(e) }); });
    if (!parts.length) { flows = null; return; }
    const pos = new Float32Array(parts.length * 3), cols = new Float32Array(parts.length * 3); parts.forEach((p, i) => { col.set(p.c).lerp(new THREE.Color(0xffffff), 0.45); cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b; });
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(cols, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: sel.floor == null ? 1.5 : 0.55, map: dot, vertexColors: true, transparent: true, depthWrite: false, depthTest: true, sizeAttenuation: true, alphaTest: 0.05 })); pts.frustumCulled = false; pts.renderOrder = 5; group.add(pts); flows = { points: pts, parts };
  }
  const polyLen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); return s; };
  const posAt = (p, s, out) => { const c = p.cum, pts = p.e.pts; let lo = 0, hi = c.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= s) lo = m; else hi = m; } const t = (s - c[lo]) / Math.max(1e-6, c[hi] - c[lo]); out[0] = pts[lo][0] + (pts[hi][0] - pts[lo][0]) * t; out[1] = pts[lo][1] + (pts[hi][1] - pts[lo][1]) * t; out[2] = pts[lo][2] + (pts[hi][2] - pts[lo][2]) * t; };
  const tmp = [0, 0, 0];
  function update(dt, now) {
    if (flows) { const a = flows.points.geometry.attributes.position; flows.parts.forEach((p, i) => { p.s += p.e.speed * speedK * dt; if (p.s > p.L) p.s -= p.L; posAt(p, p.s, tmp); a.array[i * 3] = tmp[0]; a.array[i * 3 + 1] = tmp[1]; a.array[i * 3 + 2] = tmp[2]; }); a.needsUpdate = true; }
    if (demo) tickDemo(dt, now);
  }
  function placeLabels(camera, w, h) { const v = new THREE.Vector3(); labels.forEach((l) => { v.copy(l.v).project(camera); if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) { l.el.style.display = "none"; return; } l.el.style.display = "block"; l.el.style.left = ((v.x + 1) / 2) * w + "px"; l.el.style.top = ((1 - v.y) / 2) * h + "px"; }); }

  // ---- route tracing: follow a fixture downstream (sewage, alarms) or upstream to its source (power, water, air, fire water)
  const FWD = new Set(["sewer", "fire"]);
  function traceFrom(nodeId) {
    const n = idx.get(nodeId); if (!n) return null; const fwd = FWD.has(n.sys) || (n.sys === "hvac" && /^(exh|hood|fan)$/.test(n.kind)) || n.sys === "smoke" && n.kind === "sdamper" && false, seen = new Set([nodeId]), pathE = new Set(), q2 = [nodeId];
    const adj = fwd ? adjF : adjB; while (q2.length) { const id = q2.shift(); (adj.get(id) || []).forEach((e) => { if (e.sys !== n.sys && !(n.sys === "pool" || e.sys === "pool")) return; const nx = fwd ? e.to : e.from; pathE.add(e.id); if (!seen.has(nx)) { seen.add(nx); q2.push(nx); } }); }
    return { edges: pathE, nodes: seen, forward: fwd, start: nodeId };
  }
  function setTrace(t) { trace = t; applyTrace(); const es = edges.filter((e) => new Set(sel.systems).has(e.sys) && inFloor(e, sel.floor)); if (flows) { group.remove(flows.points); flows.points.geometry.dispose(); flows = null; } buildFlows(es); }
  function applyTrace() { meshes.forEach((im) => { const map = im.userData.map; if (!im.instanceColor) return; for (let i = 0; i < map.length; i++) { const on = !trace || trace.edges.has(map[i].id); col.set(on ? 0xffffff : 0x2a2f38); if (!on) col.multiplyScalar(0.7); im.setColorAt(i, on ? col.set(0xffffff) : col.set(0x3a404b)); } im.instanceColor.needsUpdate = true; }); if (nodeMesh) { nodeIds.forEach((id, i) => { const n = idx.get(id); nodeMesh.setColorAt(i, col.set(!trace || trace.nodes.has(id) ? SYSTEMS[n.sys].color : 0x3a404b)); }); nodeMesh.instanceColor && (nodeMesh.instanceColor.needsUpdate = true); } }

  function pick(ray) {
    const objs = [...meshes, nodeMesh].filter(Boolean); const hits = ray.intersectObjects(objs, false); if (!hits.length) return null; const h = hits[0];
    if (h.object === nodeMesh) return { type: "node", node: idx.get(nodeIds[h.instanceId]) }; const map = h.object.userData.map; return { type: "edge", edge: map[h.instanceId] };
  }

  // ---- fire demonstration (conceptual): fire -> detector -> loop -> panel -> alarms/responses; sprinkler heads open only by local heat
  function demoPlan(floor) {
    const rooms = nodes.filter((n) => n.floor === floor && (n.kind === "smoked" || n.kind === "heatd")); if (!rooms.length) return null;
    const det = rooms[Math.min(rooms.length - 1, Math.floor(rooms.length / 2))], fire = [...det.p]; fire[1] = nodes.find((n) => n.floor === floor)?.p[1] ? floorGuess(det) : det.p[1] - 3;
    const heads = nodes.filter((n) => n.kind === "head" && n.floor === floor).map((n) => ({ n, d: Math.hypot(n.p[0] - det.p[0], n.p[2] - det.p[2]) })).sort((a, b) => a.d - b.d); const opened = heads.filter((h) => h.d < 3.6).slice(0, 2);
    const path = (from, to, sys) => { const prev = new Map([[from, null]]), qq = [from]; while (qq.length) { const id = qq.shift(); if (id === to) break; (adjF.get(id) || []).filter((e) => e.sys === sys).forEach((e) => { if (!prev.has(e.to)) { prev.set(e.to, e); qq.push(e.to); } }); } const out = []; let c = to; while (prev.get(c)) { out.unshift(prev.get(c)); c = prev.get(c).from; } return out; };
    return { det, fire, floor, opened: opened.length ? opened : heads.slice(0, 1), heads, sigPath: path(det.id, "facp", "fire"), waterPaths: (opened.length ? opened : heads.slice(0, 1)).map((h) => path("fpump", h.n.id, "spk")), recallPath: path("facp", "recall", "smoke"), sounders: nodes.filter((n) => n.kind === "sounder" && n.floor === floor), dampers: nodes.filter((n) => (n.id === `sd.${floor}` || n.id === `pd.${floor}`)), fm: idx.get(`fm.${floor}`) };
  }
  const floorGuess = (det) => det.p[1] - 1.9;
  const STEPS = [[0, "1  A fire starts in the highlighted room (simulated, labelled): smoke and heat rise to the ceiling"], [3.2, "2  The detector in that room reaches its threshold and sends a signal (not every detector reacts at once)"], [5.2, "3  The signal travels the floor loop and the alarm riser to the fire alarm control panel"], [8.2, "4  The panel shows the location and drives sounders and beacons on the affected floor"], [10.5, "5  Building responses (conceptual design basis): lifts recalled, smoke dampers close, smoke extract and stair pressurisation start"], [13.5, "6  Only the sprinkler heads next to the fire reach about 68 °C and open; the rest stay closed. The flow switch reports to the panel"], [18, "7  Fire-water flows from the pumps up the riser to that floor's valve and out through the open heads"]];
  function startDemo(floor, onStep, onEnd) { const p = demoPlan(floor); if (!p) return false; stopDemo(); demo = { p, t: 0, t0: performance.now() / 1000, step: -1, onStep, onEnd, ptsF: null, ptsS: null }; const g = new THREE.Group(); g.name = "fireDemo"; const fireM = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0.9 })); fireM.position.set(p.det.p[0], p.det.p[1] - 2.6, p.det.p[2]); g.add(fireM); const smokeN = 160, sp = new Float32Array(smokeN * 3), sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3)); const smoke = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.9, map: dot, color: 0x777777, transparent: true, opacity: 0.55, depthWrite: false })); smoke.frustumCulled = false; g.add(smoke);
    const pulse = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(60 * 3), 3)), new THREE.PointsMaterial({ size: 0.9, map: dot, color: 0xffffff, transparent: true, depthTest: false, depthWrite: false })); pulse.frustumCulled = false; pulse.renderOrder = 20; g.add(pulse); const spray = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(240 * 3), 3)), new THREE.PointsMaterial({ size: 0.28, map: dot, color: 0x66ccff, transparent: true, depthWrite: false })); spray.frustumCulled = false; g.add(spray);
    group.add(g); extra = { g, fireM, smoke, smokeN, pulse, spray }; return true; }
  function stopDemo() { if (extra) { group.remove(extra.g); extra = null; } const was = demo; demo = null; if (was && was.onEnd) was.onEnd(); setNodeStates({}); }
  const flash = new Map();
  function setNodeStates(st) { if (!nodeMesh) return; nodeIds.forEach((id, i) => { const n = idx.get(id), s = st[id]; if (s) nodeMesh.setColorAt(i, col.set(s)); else if (!trace) nodeMesh.setColorAt(i, col.set(SYSTEMS[n.sys].color)); }); nodeMesh.instanceColor && (nodeMesh.instanceColor.needsUpdate = true); }
  const along = (edgesList, s, out, i0) => { let acc = 0; const tot = edgesList.reduce((t, e) => t + polyLen(e.pts), 0) || 1; let want = (s % 1) * tot; for (const e of edgesList) { const L = polyLen(e.pts); if (want <= L) { let a = 0; for (let k = 1; k < e.pts.length; k++) { const d = Math.hypot(e.pts[k][0] - e.pts[k - 1][0], e.pts[k][1] - e.pts[k - 1][1], e.pts[k][2] - e.pts[k - 1][2]); if (want <= a + d) { const t = (want - a) / Math.max(1e-6, d); out[0] = e.pts[k - 1][0] + (e.pts[k][0] - e.pts[k - 1][0]) * t; out[1] = e.pts[k - 1][1] + (e.pts[k][1] - e.pts[k - 1][1]) * t; out[2] = e.pts[k - 1][2] + (e.pts[k][2] - e.pts[k - 1][2]) * t; return true; } a += d; } } want -= L; } return false; };
  function tickDemo(dt, now) {
    const d = demo, p = d.p, e = extra; d.t = d.frozen !== undefined ? d.frozen : performance.now() / 1000 - d.t0; const t = d.t; STEPS.forEach(([ts, txt], i) => { if (t >= ts && d.step < i) { d.step = i; d.onStep && d.onStep(i, txt); } });
    const st = {}; st[p.det.id] = t > 3.2 ? 0xff2020 : null; if (t > 3.2) st[p.det.id] = 0xff2020; if (t > 7.2 && p.fm) st[p.fm.id] = 0xffe14d; if (t > 8) st.facp = (Math.floor(t * 4) % 2) ? 0xff2020 : 0xffffff; if (t > 8.2) p.sounders.forEach((n) => (st[n.id] = (Math.floor(t * 5) % 2) ? 0xff9020 : 0xffffff)); if (t > 10.5) { p.dampers.forEach((n) => (st[n.id] = 0xff7a30)); ["sfan", "pfan", "recall"].forEach((id) => (st[id] = 0x7dff9a)); } if (t > 13.5) p.opened.forEach((h) => (st[h.n.id] = 0xff2020)); if (t > 13.8 && idx.get(`fv.${p.floor}`)) st[`fv.${p.floor}`] = 0x6bd0ff;
    Object.keys(st).forEach((k) => st[k] == null && delete st[k]); setNodeStates(st);
    // fire + smoke
    e.fireM.scale.setScalar(1 + 0.15 * Math.sin(t * 9)); e.fireM.material.opacity = 0.7 + 0.2 * Math.sin(t * 13); const sa = e.smoke.geometry.attributes.position; for (let i = 0; i < e.smokeN; i++) { const ph = ((t * 0.6 + i / e.smokeN) % 1); sa.array[i * 3] = p.det.p[0] + Math.sin(i * 7.3) * (0.4 + ph * 1.2); sa.array[i * 3 + 1] = p.det.p[1] - 2.5 + ph * 2.3; sa.array[i * 3 + 2] = p.det.p[2] + Math.cos(i * 5.1) * (0.4 + ph * 1.2); } sa.needsUpdate = true; e.smoke.visible = t > 0.4;
    // signal pulse: detector -> panel, then panel -> lift controller; water pulse: pumps -> opened head
    const pa = e.pulse.geometry.attributes.position; let n = 0; const o = [0, 0, 0]; const run = (list, t0, dur, cnt) => { if (!list || !list.length || t < t0 || t > t0 + dur + 2) return; const k = (t - t0) / dur; for (let i = 0; i < cnt; i++) { const s = Math.min(1, Math.max(0, k - i * 0.015)); if (along(list, s, o, 0)) { pa.array[n * 3] = o[0]; pa.array[n * 3 + 1] = o[1]; pa.array[n * 3 + 2] = o[2]; n++; } } };
    run(p.sigPath, 5.2, 3.0, 8); run(p.recallPath, 10.5, 3.0, 8); e.pulse.material.color.set(t < 10.5 ? 0xff5ac8 : 0xffb3e6);
    const wa = [0x66ccff]; if (t > 14.5) { p.waterPaths.forEach((wp) => run(wp, 14.5, 6, 10)); e.pulse.material.color.set(t > 14.5 && t < 20.5 ? 0x66ccff : e.pulse.material.color.getHex()); }
    for (let i = n; i < 60; i++) { pa.array[i * 3] = pa.array[i * 3 + 1] = pa.array[i * 3 + 2] = 1e5; } pa.needsUpdate = true;
    // sprinkler spray from the opened heads only
    const spa = e.spray.geometry.attributes.position; let m = 0; if (t > 13.5) p.opened.forEach((h, hi) => { for (let i = 0; i < 70; i++) { const ph = ((t * 1.4 + i / 70) % 1), a = i * 2.4 + hi, r = ph * 1.6; spa.array[m * 3] = h.n.p[0] + Math.cos(a) * r; spa.array[m * 3 + 1] = h.n.p[1] - ph * ph * 2.0; spa.array[m * 3 + 2] = h.n.p[2] + Math.sin(a) * r; m++; } }); for (let i = m; i < 240; i++) { spa.array[i * 3] = spa.array[i * 3 + 1] = spa.array[i * 3 + 2] = 1e5; } spa.needsUpdate = true;
    if (t > 32 && d.frozen === undefined) stopDemo();
  }

  return {
    group, nodesById: idx, show(systems, floor) { sel = { systems, floor }; trace = null; group.visible = systems.length > 0; if (!systems.length) { clear(); return; } build(); }, hide() { sel = { systems: [], floor: null }; group.visible = false; clear(); }, update, placeLabels, pick, traceFrom, setTrace, clearTrace() { setTrace(null); },
    setSpeed(k) { speedK = k; }, demoFocus() { return demo ? demo.p.det.p : null; }, seek(sec, freeze = true) { if (demo) { if (freeze) demo.frozen = sec; else { delete demo.frozen; demo.t0 = performance.now() / 1000 - sec; } } }, startDemo, stopDemo, get demoOn() { return !!demo; }, get sel() { return sel; }, STEPS, count() { return { segments: segMap.reduce((s, m) => s + m.length, 0), nodes: nodeIds.length, particles: flows ? flows.parts.length : 0 }; },
  };
}
