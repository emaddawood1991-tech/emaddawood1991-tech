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
    let layer = 0; data.paths.forEach((p) => { const st = p.userData?.style; const fill = st?.fill;
      if (st?.stroke && st.stroke !== "none") { const smat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setStyle(st.stroke), roughness: 0.3, metalness: 0.2, side: THREE.DoubleSide }); p.subPaths.forEach((sp) => { const geo = SVGLoader.pointsToStroke(sp.getPoints(), st); if (!geo) return; for (let j = 0; j < 8; j++) { const m = new THREE.Mesh(geo, smat); m.position.z = layer * depth * 0.7 + depth + j * 3.2; g.add(m); } }); }
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
