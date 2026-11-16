import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { FontLoader, Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { clamp, easeInOutCubic, easeOutCubic, rng, speedRamp } from "./math";

/** /agentoon-3d-motion: real 3D (three.js + @react-three/fiber via @remotion/three), software-GL safe (no HDR env maps, no network at render time). */
const useAsync = <T,>(load: () => Promise<T>, deps: unknown[]): T | null => {
  const [v, setV] = useState<T | null>(null); const [h] = useState(() => delayRender("three-asset"));
  useEffect(() => { let on = true; load().then((r) => { if (on) { setV(r); /* let React + R3F commit and draw before the frame is captured */ requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => continueRender(h), 60))); } }).catch((e) => { console.log("ASSETFAIL", String(e)); continueRender(h); }); return () => { on = false; }; /* eslint-disable-next-line */ }, deps);
  return v;
};
const loadTex = (url: string) => new Promise<THREE.Texture>((res, rej) => new THREE.TextureLoader().load(staticFile(url), (tx) => { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; res(tx); }, undefined, rej));
const useTextures = (urls: string[]) => useAsync(() => Promise.all(urls.map(loadTex)), [urls.join("|")]);

const Lights: React.FC<{ key1?: string; rim?: string; fill?: string }> = ({ key1 = "#ffffff", rim = "#C8F031", fill = "#35F2FF" }) => (
  <>
    <ambientLight intensity={0.55} />
    <directionalLight position={[4, 6, 7]} intensity={2.6} color={key1} />
    <directionalLight position={[-6, 2, -5]} intensity={2.2} color={rim} />
    <pointLight position={[0, -3, 4]} intensity={30} color={fill} distance={14} />
  </>
);

/** extrudes the REAL logo SVG into 3D geometry (one mesh per filled path, keeping the logo's own colours) and rotates it with cinematic lighting. */
export const Logo3D: React.FC<{ svg: string; width?: number; height?: number; depth?: number; spin?: number; bg?: string }> = ({ svg, width = 1080, height = 1920, depth = 26, spin = 0.045, bg = "transparent" }) => {
  const frame = useCurrentFrame(); const group = useAsync(async () => {
    const txt = await (await fetch(staticFile(svg))).text(); const data = new SVGLoader().parse(txt); const g = new THREE.Group();
    let layer = 0; data.paths.forEach((p) => { const st = p.userData?.style;  const fill = st?.fill;
      if (st?.stroke && st.stroke !== "none") { const smat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setStyle(st.stroke), roughness: 0.3, metalness: 0.2, side: THREE.DoubleSide }); p.subPaths.forEach((sp) => { const pts = sp.getPoints();
        if (pts.length <= 3) { const A = pts[0], B = pts[pts.length - 1], w = (st.strokeWidth ?? 10) / 2, L = Math.hypot(B.x - A.x, B.y - A.y), ang = Math.atan2(B.y - A.y, B.x - A.x);
          const sh = new THREE.Shape(); sh.moveTo(0, -w); sh.lineTo(L, -w); sh.absarc(L, 0, w, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(0, w); sh.absarc(0, 0, w, Math.PI / 2, Math.PI * 1.5, false);
          const cg = new THREE.ExtrudeGeometry(sh, { depth: 14, bevelEnabled: false, curveSegments: 16 }); const cm = new THREE.Mesh(cg, smat); cm.position.set(A.x, A.y, layer * depth * 0.7 + depth); cm.rotation.z = ang; g.add(cm);
          const cm2 = new THREE.Mesh(cg, smat); cm2.position.set(A.x, A.y, layer * depth * 0.7 - 14); cm2.rotation.z = ang; g.add(cm2); return; }
        const geo = SVGLoader.pointsToStroke(pts, st); if (!geo) return; for (let j = 0; j < 8; j++) { const m = new THREE.Mesh(geo, smat); m.position.z = layer * depth * 0.7 + depth + j * 3.2; g.add(m); } for (let j = 0; j < 8; j++) { const m = new THREE.Mesh(geo, smat); m.position.z = layer * depth * 0.7 - 1 - j * 3.2; g.add(m); } }); }
      if (!fill || fill === "none") { layer++; return; } const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setStyle(fill), roughness: 0.32, metalness: 0.25, side: THREE.DoubleSide }); SVGLoader.createShapes(p).forEach((s) => { const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 3, bevelSize: 2.5, bevelSegments: 3, curveSegments: 18 }); const m = new THREE.Mesh(geo, mat); m.position.z = layer * depth * 0.7; g.add(m); }); layer++; });
    const box = new THREE.Box3().setFromObject(g); const c = box.getCenter(new THREE.Vector3()); const sz = box.getSize(new THREE.Vector3()); const k = 2.5 / Math.max(sz.x, sz.y); g.children.forEach((m) => m.position.sub(c)); g.scale.set(k, -k, k); return g;
  }, [svg]);
  const p = easeOutCubic(clamp(frame / 24)); const ry = frame * spin * Math.PI + (1 - p) * -2.4; const rx = Math.sin(frame / 38) * 0.18;
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 9], fov: 35 }} style={{ background: bg }}>
      <Lights />
      {group && <group rotation={[rx, ry, 0]} scale={0.65 + 0.35 * p} position={[0, Math.sin(frame / 30) * 0.12, 0]}><primitive object={group} /></group>}
    </ThreeCanvas>
  );
};

/** 3D extruded text (three.js TextGeometry with the bundled typeface font) with spring-in rotation. */
export const Title3DMesh: React.FC<{ text: string; width?: number; height?: number; color?: string; side?: string; size?: number }> = ({ text, width = 1080, height = 1920, color = "#C8F031", side = "#5b6e12", size = 1 }) => {
  const frame = useCurrentFrame(); const font = useAsync(async () => new FontLoader().parse(await (await fetch(staticFile("fonts/helvetiker_bold.typeface.json"))).json()) as Font, []);
  const geo = useMemo(() => { if (!font) return null; const g = new TextGeometry(text, { font, size, depth: 0.45 * size, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 }); g.center(); return g; }, [font, text, size]);
  const p = easeOutCubic(clamp(frame / 28));
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 8], fov: 35 }}>
      <Lights />
      {geo && <mesh geometry={geo} rotation={[(1 - p) * 1.2 + Math.sin(frame / 30) * 0.08, (1 - p) * -1.6 + Math.sin(frame / 40) * 0.3, 0]} position={[0, 0, (1 - p) * -4]}><meshStandardMaterial attach="material-0" color={color} roughness={0.3} metalness={0.2} /><meshStandardMaterial attach="material-1" color={side} roughness={0.5} /></mesh>}
    </ThreeCanvas>
  );
};

export type Panel = { src: string; pos: [number, number, number]; rot?: [number, number, number]; w?: number; label?: string };
const CameraPath: React.FC<{ curve: THREE.CatmullRomCurve3; u: number; look: number }> = ({ curve, u, look }) => {
  const { camera, invalidate } = useThree();
  useLayoutEffect(() => { const p = curve.getPointAt(clamp(u)); const l = curve.getPointAt(clamp(u + look)); camera.position.copy(p); camera.lookAt(l); camera.updateMatrixWorld(); invalidate(); });
  return null;
};
const PanelMesh: React.FC<{ p: Panel; i: number; frame: number; tex: THREE.Texture | null }> = ({ p, i, frame, tex }) => {
  const w = p.w ?? 3.6, h = w * 0.625; const bob = Math.sin(frame / 24 + i * 1.7) * 0.12;
  return (
    <group position={[p.pos[0], p.pos[1] + bob, p.pos[2]]} rotation={p.rot ?? [0, 0, 0]}>
      <mesh position={[0, 0, -0.06]}><boxGeometry args={[w + 0.18, h + 0.18, 0.08]} /><meshStandardMaterial color="#C8F031" roughness={0.4} metalness={0.3} emissive="#334400" /></mesh>
      <mesh><planeGeometry args={[w, h]} />{tex ? <meshBasicMaterial key="tex" map={tex} toneMapped={false} /> : <meshBasicMaterial key="ph" color="#222733" />}</mesh>
    </group>
  );
};

/** camera fly-through: the camera travels a Catmull-Rom path through floating interface panels (real screenshots), with fog depth, rim lighting and an eased/ramped speed. */
export const FlyThrough: React.FC<{ panels: Panel[]; path: [number, number, number][]; start?: number; dur?: number; width?: number; height?: number; ramp?: { f: number; t: number }[] }> = ({ panels, path, start = 0, dur = 100, width = 1080, height = 1920, ramp }) => {
  const frame = useCurrentFrame(); const texs = useTextures(panels.map((q) => q.src)); const curve = useMemo(() => new THREE.CatmullRomCurve3(path.map((q) => new THREE.Vector3(...q)), false, "catmullrom", 0.5), [path]);
  const u = ramp ? speedRamp(frame, ramp) / ramp[ramp.length - 1].t : easeInOutCubic(clamp((frame - start) / dur)) * 0.94;
  const stars = useMemo(() => { const r = rng(3); return new Float32Array(Array.from({ length: 900 }, () => (r() - 0.5) * 40)); }, []);
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: path[0], fov: 62, near: 0.1, far: 80 }}>
      <color attach="background" args={["#07080C"]} /><fog attach="fog" args={["#07080C", 7, 30]} />
      <Lights />
      <CameraPath curve={curve} u={u} look={0.035} />
      <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[stars, 3]} /></bufferGeometry><pointsMaterial size={0.07} color="#9fe8ff" sizeAttenuation /></points>
      {panels.map((p, i) => <PanelMesh key={i} p={p} i={i} frame={frame} tex={texs ? texs[i] : null} />)}
    </ThreeCanvas>
  );
};

const CameraOrbit: React.FC<{ angle: number; radius: number; height: number }> = ({ angle, radius, height }) => {
  const { camera, invalidate } = useThree();
  useLayoutEffect(() => { camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(); invalidate(); });
  return null;
};
/** /agentoon-3d-showcase: static logo -> rotating 3D logo with a cinematic camera ORBIT, floating interface panels (real screenshots) circling it at different depths, fog depth
 *  and dynamic coloured lights that sweep around. `svg` is the real logo file; panels are screenshots. Everything derives from the frame. */
export const Showcase3D: React.FC<{ svg: string; panels: string[]; width?: number; height?: number; depth?: number; start?: number }> = ({ svg, panels, width = 1080, height = 1920, depth = 26, start = 0 }) => {
  const frame = useCurrentFrame(); const f = Math.max(0, frame - start); const texs = useTextures(panels);
  const group = useAsync(async () => {
    const txt = await (await fetch(staticFile(svg))).text(); const data = new SVGLoader().parse(txt); const g = new THREE.Group(); let layer = 0;
    data.paths.forEach((p) => { const st = p.userData?.style;  const fill = st?.fill;
      if (st?.stroke && st.stroke !== "none") { const smat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setStyle(st.stroke), roughness: 0.3, metalness: 0.2, side: THREE.DoubleSide }); p.subPaths.forEach((sp) => { const pts = sp.getPoints();
        if (pts.length <= 3) { const A = pts[0], B = pts[pts.length - 1], w = (st.strokeWidth ?? 10) / 2, L = Math.hypot(B.x - A.x, B.y - A.y), ang = Math.atan2(B.y - A.y, B.x - A.x);
          const sh = new THREE.Shape(); sh.moveTo(0, -w); sh.lineTo(L, -w); sh.absarc(L, 0, w, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(0, w); sh.absarc(0, 0, w, Math.PI / 2, Math.PI * 1.5, false);
          const cg = new THREE.ExtrudeGeometry(sh, { depth: 14, bevelEnabled: false, curveSegments: 16 }); const cm = new THREE.Mesh(cg, smat); cm.position.set(A.x, A.y, layer * depth * 0.7 + depth); cm.rotation.z = ang; g.add(cm);
          const cm2 = new THREE.Mesh(cg, smat); cm2.position.set(A.x, A.y, layer * depth * 0.7 - 14); cm2.rotation.z = ang; g.add(cm2); return; }
        const geo = SVGLoader.pointsToStroke(pts, st); if (!geo) return; for (let j = 0; j < 8; j++) { const m = new THREE.Mesh(geo, smat); m.position.z = layer * depth * 0.7 + depth + j * 3.2; g.add(m); } for (let j = 0; j < 8; j++) { const m = new THREE.Mesh(geo, smat); m.position.z = layer * depth * 0.7 - 1 - j * 3.2; g.add(m); } }); }
      if (!fill || fill === "none") { layer++; return; }
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setStyle(fill), roughness: 0.32, metalness: 0.25, side: THREE.DoubleSide });
      SVGLoader.createShapes(p).forEach((s) => { const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 3, bevelSize: 2.5, bevelSegments: 3, curveSegments: 18 }); const m = new THREE.Mesh(geo, mat); m.position.z = layer * depth * 0.7; g.add(m); }); layer++; });
    const box = new THREE.Box3().setFromObject(g); const c = box.getCenter(new THREE.Vector3()); const sz = box.getSize(new THREE.Vector3()); const k = 2.4 / Math.max(sz.x, sz.y); g.children.forEach((m) => m.position.sub(c)); g.scale.set(k, -k, k); return g;
  }, [svg]);
  const spin = Math.sin(f * 0.052) * 1.05, angle = f * 0.012 - 0.2, rise = Math.min(1, f / 24); const La = f / 22;
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 1, 9], fov: 38 }}>
      <color attach="background" args={["#07080C"]} /><fog attach="fog" args={["#07080C", 8, 26]} />
      <ambientLight intensity={0.45} />
      <pointLight position={[Math.sin(La) * 6, 3, Math.cos(La) * 6]} intensity={90} color="#C8F031" distance={22} />
      <pointLight position={[Math.cos(La * 0.8) * -6, -2, Math.sin(La * 0.8) * 5]} intensity={80} color="#35F2FF" distance={22} />
      <directionalLight position={[3, 6, 5]} intensity={1.8} />
      <CameraOrbit angle={angle} radius={9 - 1.2 * rise} height={1.2 + Math.sin(f / 30) * 0.8} />
      {group && <group rotation={[Math.sin(f / 40) * 0.12, spin, 0]} scale={0.5 + 0.5 * easeOutCubic(rise)}><primitive object={group} /></group>}
      {texs && texs.map((tx, i) => { const a = f * 0.028 + (i * Math.PI * 2) / texs.length, r = 4.2 + (i % 2) * 1.0; return <group key={i} position={[Math.cos(a) * r, Math.sin(f / 26 + i) * 0.35 + (i % 2 ? 1.2 : -1.0), Math.sin(a) * r]} rotation={[0, angle, 0]}><mesh position={[0, 0, -0.04]}><boxGeometry args={[2.34, 1.54, 0.05]} /><meshStandardMaterial color="#C8F031" emissive="#334400" /></mesh><mesh><planeGeometry args={[2.2, 1.375]} /><meshBasicMaterial map={tx} toneMapped={false} /></mesh></group>; })}
    </ThreeCanvas>
  );
};
