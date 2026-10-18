import React, {useMemo} from 'react';
import * as THREE from 'three';

/**
 * SIMPLIFIED EDUCATIONAL lumbar spine (L1–L5 + sacrum), built procedurally.
 * It is a teaching schematic: proportions are approximate and it is NOT a
 * patient-specific or CT-derived model. The UI always labels it as such.
 * To use a verified anatomical model instead, drop a .glb in assets/anatomy
 * and render it through <GLBModel/>.
 *
 * Axes: +Y up (head), +Z anterior (front of body), -Z posterior, X = body's left/right.
 */

const BONE = '#E6DFCF';
const DISC = '#6FB3D6';
const NUCLEUS = '#BFE9F2';
const NERVE = '#F4E9B8';
const ALERT = '#F2A33A';

export const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5'] as const;
const PITCH = 4.0; // vertebra-to-vertebra spacing
// Lordosis: apex anterior around L3, L5 tilted forward-down.
const Z_OFFSET = [-0.2, 0.5, 0.9, 0.7, -0.1];
const TILT = [0.1, 0.05, -0.02, -0.12, -0.28]; // rotation about X (rad)
const BODY_W = [4.4, 4.6, 4.9, 5.2, 5.4];
const BODY_D = [3.2, 3.3, 3.4, 3.5, 3.6];
const BODY_H = 2.7;
const DISC_H = [1.0, 1.1, 1.2, 1.3, 1.4];

const kidney = (w: number, d: number, inflate = 1) => {
  const s = new THREE.Shape();
  const n = 56;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a), sn = Math.sin(a);
    const x = (w / 2) * Math.sign(c) * Math.abs(c) ** 0.72 * inflate;
    let z = (d / 2) * Math.sign(sn) * Math.abs(sn) ** 0.72 * inflate; // +z anterior
    if (sn < 0) z += d * 0.16 * Math.exp(-((x / (w * 0.28)) ** 2)); // posterior concavity
    // shape-y is -z_world after rotateX(-90°)
    if (i === 0) s.moveTo(x, -z); else s.lineTo(x, -z);
  }
  s.closePath();
  return s;
};

const extrudeY = (shape: THREE.Shape, h: number, bevel: number) => {
  const g = new THREE.ExtrudeGeometry(shape, {depth: h - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 20});
  g.rotateX(-Math.PI / 2);
  g.translate(0, -(h - bevel * 2) / 2, 0);
  return g;
};

const limb = (a: THREE.Vector3, b: THREE.Vector3, r1: number, r2: number) => {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(r2, r1, len, 18, 1); // top radius r2 at +Y, bottom r1 at -Y
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
};

const merge = (geos: THREE.BufferGeometry[]) => {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  let total = 0;
  parts.forEach((p) => (total += p.getAttribute('position').count));
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  let o = 0;
  parts.forEach((p) => {
    pos.set(p.getAttribute('position').array as Float32Array, o * 3);
    nor.set(p.getAttribute('normal').array as Float32Array, o * 3);
    o += p.getAttribute('position').count;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
};

const buildVertebra = (i: number) => {
  const w = BODY_W[i], d = BODY_D[i];
  const parts: THREE.BufferGeometry[] = [];
  parts.push(extrudeY(kidney(w, d), BODY_H, 0.28));
  const back = -d / 2 + 0.1;
  const canalZ = back - 1.15;
  for (const sx of [-1, 1]) {
    // pedicles: body -> arch
    parts.push(limb(new THREE.Vector3(sx * w * 0.3, 0.25, back + 0.2), new THREE.Vector3(sx * 1.55, 0.25, canalZ), 0.5, 0.45));
    // laminae sweeping to the midline
    parts.push(limb(new THREE.Vector3(sx * 1.55, 0.3, canalZ), new THREE.Vector3(sx * 0.35, 0.35, canalZ - 1.35), 0.42, 0.5));
    // transverse processes
    parts.push(limb(new THREE.Vector3(sx * 1.6, 0.25, canalZ + 0.2), new THREE.Vector3(sx * (w * 0.5 + 1.7), 0.3, canalZ + 0.4), 0.42, 0.26));
    // superior / inferior articular processes
    parts.push(limb(new THREE.Vector3(sx * 1.45, 0.9, canalZ - 0.3), new THREE.Vector3(sx * 1.55, 2.0, canalZ - 0.2), 0.36, 0.3));
    parts.push(limb(new THREE.Vector3(sx * 1.1, -0.9, canalZ - 1.0), new THREE.Vector3(sx * 1.2, -2.0, canalZ - 0.9), 0.34, 0.3));
  }
  // spinous process
  parts.push(limb(new THREE.Vector3(0, 0.35, canalZ - 1.3), new THREE.Vector3(0, -0.5, canalZ - 3.5), 0.52, 0.36));
  return {geometry: merge(parts), canalZ, back};
};

export type LumbarProps = {
  /** 0..1 how much the L4–L5 disc material protrudes (illustrative). */
  bulge?: number;
  /** 0..1 intensity of the pain-region highlight. */
  glow?: number;
  /** 0..1 highlight on the nerve root. */
  nerveGlow?: number;
  /** flexion(+)/extension(-) in radians applied progressively down the spine. */
  flexion?: number;
  /** 0..1 paraspinal / core stabiliser highlight. */
  muscleGlow?: number;
  showMuscles?: boolean;
  boneOpacity?: number;
  time?: number; // seconds, for pulsing
};

export const LumbarSpine: React.FC<LumbarProps> = ({bulge = 0, glow = 0, nerveGlow = 0, flexion = 0, muscleGlow = 0, showMuscles = false, boneOpacity = 1, time = 0}) => {
  const verts = useMemo(() => LEVELS.map((_, i) => buildVertebra(i)), []);
  const discs = useMemo(() => LEVELS.slice(0, 5).map((_, i) => ({outer: extrudeY(kidney(BODY_W[i] * 1.03, BODY_D[i] * 1.0), DISC_H[i], 0.18), nucleus: extrudeY(kidney(BODY_W[i] * 0.55, BODY_D[i] * 0.5), DISC_H[i] * 0.7, 0.1)})), []);
  const sacrum = useMemo(() => {
    const g = extrudeY(kidney(5.8, 3.4), 4.6, 0.4);
    return g;
  }, []);

  // vertebra pose (center y, z, tilt incl. flexion)
  const pose = LEVELS.map((_, i) => ({y: -i * PITCH, z: Z_OFFSET[i], rx: TILT[i] + flexion * (i + 1) * 0.07}));
  const pulse = 0.55 + 0.45 * Math.sin(time * 4);

  const boneMat = (
    <meshPhysicalMaterial color={BONE} roughness={0.5} metalness={0.02} clearcoat={0.25} clearcoatRoughness={0.6} transparent={boneOpacity < 1} opacity={boneOpacity} />
  );

  const L45 = 3; // disc index between L4 (3) and L5 (4)
  const canalZ = (i: number) => verts[i].canalZ;

  // nerve bundle (cauda equina-like) inside the canal, plus one root exiting on the patient's right
  const roots = useMemo(() => {
    const lines: THREE.TubeGeometry[] = [];
    for (let k = 0; k < 7; k++) {
      const off = (k - 3) * 0.16;
      const pts = [];
      for (let i = 0; i <= 5; i++) {
        const yy = -i * PITCH + 1.5;
        const zz = (Z_OFFSET[Math.min(i, 4)] ?? 0) + (-3.2 / 2 + 0.1 - 1.15) + Math.sin(i + k) * 0.05;
        pts.push(new THREE.Vector3(off + Math.sin(i * 1.3 + k) * 0.05, yy, zz));
      }
      lines.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.07, 8));
    }
    return lines;
  }, []);

  const exitRoot = useMemo(() => {
    const zc = Z_OFFSET[3] + (-BODY_D[3] / 2 + 0.1 - 1.15);
    const y0 = -3 * PITCH - PITCH * 0.55;
    const pts = [
      new THREE.Vector3(0.35, y0 + 3.2, zc),
      new THREE.Vector3(1.1, y0 + 0.6, zc + 0.15),
      new THREE.Vector3(2.4, y0 - 0.9, zc + 0.55),
      new THREE.Vector3(4.2, y0 - 2.8, zc + 0.9),
      new THREE.Vector3(5.8, y0 - 5.4, zc + 1.2),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.16, 10);
  }, []);

  const bulgeCenter = (() => {
    const i = L45;
    const y = -i * PITCH - PITCH / 2 - 0.1;
    return new THREE.Vector3(1.5, y, Z_OFFSET[i] + (-BODY_D[i] / 2) + 0.1 + (Z_OFFSET[i + 1] - Z_OFFSET[i]) / 2);
  })();

  return (
    <group position={[0, 8, 0]}>
      {verts.map((v, i) => (
        <group key={LEVELS[i]} position={[0, pose[i].y, pose[i].z]} rotation={[pose[i].rx, 0, 0]}>
          <mesh geometry={v.geometry}>{boneMat}</mesh>
        </group>
      ))}

      {/* intervertebral discs */}
      {discs.map((d, i) => {
        const y = -i * PITCH - PITCH / 2;
        const zMid = (Z_OFFSET[i] + (Z_OFFSET[i + 1] ?? Z_OFFSET[i] - 0.3)) / 2;
        const rx = (pose[i].rx + (pose[i + 1]?.rx ?? pose[i].rx - 0.1)) / 2;
        const hot = i === L45 ? glow : 0;
        return (
          <group key={i} position={[0, y, zMid]} rotation={[rx, 0, 0]}>
            <mesh geometry={d.outer}>
              <meshPhysicalMaterial color={DISC} roughness={0.35} transparent opacity={0.88} emissive={ALERT} emissiveIntensity={hot * 0.55 * pulse} />
            </mesh>
            <mesh geometry={d.nucleus}>
              <meshStandardMaterial color={NUCLEUS} emissive={NUCLEUS} emissiveIntensity={0.25} roughness={0.2} />
            </mesh>
          </group>
        );
      })}

      {/* sacrum */}
      <group position={[0, -5 * PITCH - 0.1, -1.0]} rotation={[-0.62, 0, 0]}>
        <mesh geometry={sacrum}>{boneMat}</mesh>
      </group>

      {/* nerve bundle */}
      {roots.map((g, k) => (
        <mesh key={k} geometry={g}>
          <meshStandardMaterial color={NERVE} emissive={NERVE} emissiveIntensity={0.18} roughness={0.4} />
        </mesh>
      ))}
      <mesh geometry={exitRoot}>
        <meshStandardMaterial color={nerveGlow > 0 ? ALERT : NERVE} emissive={nerveGlow > 0 ? ALERT : NERVE} emissiveIntensity={0.2 + nerveGlow * 0.7 * pulse} roughness={0.4} />
      </mesh>

      {/* illustrative disc protrusion */}
      {bulge > 0 && (
        <mesh position={bulgeCenter} scale={[0.85 * bulge, 0.62 * bulge, 0.8 * bulge]}>
          <sphereGeometry args={[1.0, 28, 20]} />
          <meshPhysicalMaterial color={DISC} emissive={ALERT} emissiveIntensity={0.35 + 0.4 * pulse * glow} roughness={0.3} transparent opacity={0.95} />
        </mesh>
      )}

      {/* simplified paraspinal muscle bands */}
      {showMuscles &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * 3.0, -2 * PITCH - 1, -4.8]} scale={[1, 1, 0.7]}>
            <capsuleGeometry args={[1.25, 3.0 * PITCH, 10, 24]} />
            <meshPhysicalMaterial color="#B5504A" transparent opacity={0.34 + muscleGlow * 0.12} emissive="#00A6A6" emissiveIntensity={muscleGlow * 0.7 * pulse} roughness={0.7} />
          </mesh>
        ))}
    </group>
  );
};

/** Approximate world position of the L4–L5 disc centre (for camera targeting). */
export const L45_FOCUS: [number, number, number] = [0, 8 - 3 * PITCH - PITCH / 2, -1.2];
export const SPINE_CENTER: [number, number, number] = [0, 8 - 2.6 * PITCH, -1.6];

/** World-space anchors for HUD callouts (match the constants above). */
export const ANCHORS = {
  vertebraL3: [0, 8 - 2 * PITCH, Z_OFFSET[2] + BODY_D[2] / 2] as [number, number, number],
  discL2L3: [0, 8 - 1 * PITCH - PITCH / 2, 0.75 + BODY_D[1] / 2] as [number, number, number],
  discL4L5: [1.5, 8 - 3 * PITCH - PITCH / 2 - 0.1, -1.55] as [number, number, number],
  nerveRoot: [2.4, 8 - 3 * PITCH - PITCH * 0.55 - 0.9, -3.0] as [number, number, number],
  sacrum: [0, 8 - 5 * PITCH - 0.1, 0.6] as [number, number, number],
  muscle: [3.0, 8 - 2 * PITCH - 1, -5.6] as [number, number, number],
};
