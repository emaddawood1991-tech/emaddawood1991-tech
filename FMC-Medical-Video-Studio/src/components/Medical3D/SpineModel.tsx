import React, {useMemo} from 'react';
import * as THREE from 'three';

/**
 * Educational full-spine model (C1–L5 + sacrum): vertebral bodies, discs, arches, spinous and transverse processes.
 * Sagittal curves (cervical/lumbar lordosis, thoracic kyphosis) and a coronal scoliosis curve are parametric, so the same
 * model shows a normal spine, increased thoracic kyphosis and a mild lateral curve. Simplified teaching model — never a patient.
 * Units: 1 = 1 cm. Anterior = +z, up = +y, patient's left = +x (seen from behind).
 */
export type SpineParams = {
  kyphosis: number; // thoracic kyphosis, degrees (normal ≈ 35, increased ≈ 62)
  lordosisL: number; // lumbar lordosis, degrees
  lordosisC: number; // cervical lordosis, degrees
  scoliosis: number; // 0..1 : lateral curve amount (1 ≈ Cobb 28°)
  highlight?: 'thoracic' | 'curve' | 'none';
  highlightAmount?: number; // 0..1
  opacity?: number;
};

export const NORMAL_SPINE: SpineParams = {kyphosis: 38, lordosisL: 45, lordosisC: 30, scoliosis: 0};

type Level = {name: string; w: number; h: number; d: number; spin: number; trans: number};
// bottom → top
const LEVELS: Level[] = [
  ...['L5', 'L4', 'L3', 'L2', 'L1'].map((name, i) => ({name, w: 4.7 - i * 0.12, h: 2.9 - i * 0.04, d: 3.4 - i * 0.05, spin: 2.2, trans: 3.0})),
  ...['T12', 'T11', 'T10', 'T9', 'T8', 'T7', 'T6', 'T5', 'T4', 'T3', 'T2', 'T1'].map((name, i) => ({name, w: 4.1 - i * 0.16, h: 2.4 - i * 0.03, d: 3.0 - i * 0.07, spin: 3.3, trans: 2.4})),
  ...['C7', 'C6', 'C5', 'C4', 'C3', 'C2'].map((name, i) => ({name, w: 2.6 - i * 0.07, h: 1.55, d: 2.0 - i * 0.05, spin: 1.9, trans: 1.7})),
  {name: 'C1', w: 3.0, h: 1.0, d: 2.4, spin: 0.8, trans: 2.4},
];
const DISC = 0.62;

export const spineLevels = (p: SpineParams) => {
  // heading φ (rad, + = leaning anterior); walk up from L5
  const Ll = (p.lordosisL * Math.PI) / 180, K = (p.kyphosis * Math.PI) / 180, Lc = (p.lordosisC * Math.PI) / 180;
  // first pass: heading increments only, then choose the start inclination that puts C1 above the sacrum (plumb line)
  let ph = 0, sz = 0, sy = 0;
  LEVELS.forEach((lv, i) => {
    const seg = lv.h + DISC;
    sz += seg * Math.sin(ph); sy += seg * Math.cos(ph);
    if (i < 4) ph -= Ll / 5; else if (i < 16) ph += K / 12; else ph -= Lc / 7;
  });
  let phi = -Math.atan2(sz, sy);
  let x = 0, y = 0, z = 0;
  const out: {level: Level; pos: THREE.Vector3; phi: number; psi: number; rotY: number; idx: number}[] = [];
  // coronal curve (T5–L2), sinusoid
  const iT5 = LEVELS.findIndex((l) => l.name === 'T5'), iL3 = 2; // L3
  const curveSpan = Math.max(1, iT5 - iL3);
  LEVELS.forEach((lv, i) => {
    const seg = lv.h + DISC;
    const t = (i - iL3) / curveSpan; // 0 at L3 → 1 at T5
    const inCurve = t >= 0 && t <= 1;
    const A = 2.6 * p.scoliosis;
    const dx = inCurve ? A * Math.sin(Math.PI * t) : 0;
    const slope = inCurve ? (A * Math.PI * Math.cos(Math.PI * t)) / (curveSpan * seg) : 0;
    const psi = Math.atan(slope);
    out.push({level: lv, pos: new THREE.Vector3(x + dx, y, z), phi, psi, rotY: -psi * 0.5, idx: i});
    // advance
    if (i < 4) phi -= Ll / 5;
    else if (i < 16) phi += K / 12;
    else phi -= Lc / 7;
    y += seg * Math.cos(phi);
    z += seg * Math.sin(phi);
    x += 0;
  });
  return out;
};

const bone = (op: number, hl: number) => (
  <meshStandardMaterial color={new THREE.Color('#e6d9bf').lerp(new THREE.Color('#f2a33a'), hl * 0.55)} roughness={0.58} metalness={0.02} transparent={op < 1} opacity={op} emissive={new THREE.Color('#f2a33a')} emissiveIntensity={hl * 0.18} />
);

const Vertebra: React.FC<{lv: Level; op: number; hl: number}> = ({lv, op, hl}) => {
  const w = lv.w * 1.3, h = lv.h, d = lv.d * 1.2;
  const thoracic = lv.name.startsWith('T');
  const spinTilt = thoracic ? -0.75 : lv.name.startsWith('L') ? -0.12 : -0.28;
  return (
    <group>
      {/* body */}
      <mesh scale={[w / 2, h / 2, d / 2]} position={[0, h / 2, 0]}>
        <cylinderGeometry args={[1, 0.93, 1.0 * 2 / 2, 32, 1]} />
        {bone(op, hl)}
      </mesh>
      {/* pedicles + laminae: posterior half-ring around the spinal canal */}
      <mesh position={[0, h * 0.58, -d * 0.5]} rotation={[-Math.PI / 2, 0, 0]} scale={[w * 0.44, d * 0.55, h * 0.4]}>
        <torusGeometry args={[1, 0.3, 10, 28, Math.PI]} />
        {bone(op, hl)}
      </mesh>
      {/* spinous process: tapered, angled down in the thoracic region */}
      <mesh position={[0, h * 0.58 + (thoracic ? -0.3 * h : 0), -d * 1.08 - lv.spin * 0.3]} rotation={[Math.PI / 2 + spinTilt * 0.5, 0, 0]} scale={[0.5 * (thoracic ? 0.8 : 1.1), lv.spin * 0.75, 0.5 * (thoracic ? 0.8 : 1.3)]}>
        <coneGeometry args={[1, 1, 10]} />
        {bone(op, hl)}
      </mesh>
      {/* transverse processes */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w * 0.5 + lv.trans * 0.3), h * 0.66, -d * 0.55]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1]}>
          <capsuleGeometry args={[0.32, lv.trans * 0.55, 4, 10]} />
          {bone(op, hl)}
        </mesh>
      ))}
    </group>
  );
};

export const SpineModel: React.FC<SpineParams> = (p) => {
  const op = p.opacity ?? 1;
  const hlAmt = p.highlightAmount ?? 0;
  const lv = useMemo(() => spineLevels(p), [p.kyphosis, p.lordosisL, p.lordosisC, p.scoliosis]);
  // centre the model on its mid-height
  const mid = lv[Math.floor(lv.length / 2)].pos;
  return (
    <group position={[-mid.x, -mid.y, -mid.z]}>
      {/* sacrum wedge */}
      <mesh position={[0, -2.4, 0.2]} rotation={[lv[0].phi - 0.55, 0, 0]} scale={[5.0, 4.8, 3.0]}>
        <coneGeometry args={[0.5, 1, 4]} />
        <meshStandardMaterial color="#dccfb2" roughness={0.6} transparent={op < 1} opacity={op} />
      </mesh>
      {lv.map(({level, pos, phi, psi, rotY, idx}) => {
        const hl = p.highlight === 'thoracic' && level.name.startsWith('T') ? hlAmt : p.highlight === 'curve' && idx >= 2 && idx <= 16 ? hlAmt * 0.8 : 0;
        return (
          <group key={level.name} position={pos}>
            <group rotation={[phi, rotY, -psi]}>
              <Vertebra lv={level} op={op} hl={hl} />
              {/* intervertebral disc above this body */}
              <mesh position={[0, level.h + DISC / 2, 0]} scale={[level.w * 0.49, DISC / 2, level.d * 0.48]}>
                <cylinderGeometry args={[1, 1, 1, 28]} />
                <meshStandardMaterial color="#a9b9c4" roughness={0.5} transparent opacity={0.9 * op} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
};
