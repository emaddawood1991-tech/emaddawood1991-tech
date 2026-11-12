import React, {useMemo} from 'react';
import * as THREE from 'three';

/**
 * Educational frontal lower-limb model (pelvis, both femurs, tibiae, fibulae, patellae, foot blocks) for a young child.
 * Alignment is set by the horizontal distance of each knee centre and each ankle centre from the midline, so the bones are
 * rigid segments that simply change direction (no stretching, no morphing). Units: 1 = 1 cm. Patient's right = screen left (seen from the front).
 * Simplified teaching model — never a patient, and the angles are illustrative, not measurements.
 */
export type LimbAlign = {kneeX: number; ankleX: number};

/** Illustrative states (half-distances from the midline, cm). */
export const ALIGN: Record<'typical' | 'knock' | 'bow', LimbAlign> = {
  typical: {kneeX: 3.0, ankleX: 1.6},
  knock: {kneeX: 1.3, ankleX: 5.6},
  bow: {kneeX: 6.4, ankleX: 1.6},
};
export const lerpAlign = (a: LimbAlign, b: LimbAlign, t: number): LimbAlign => ({kneeX: a.kneeX + (b.kneeX - a.kneeX) * t, ankleX: a.ankleX + (b.ankleX - a.ankleX) * t});

export const HIP_X = 5.5, FEMUR = 28, TIBIA = 22.5;
/** Joint centres for one leg (side = +1 patient's left / screen right, −1 patient's right / screen left). */
export const legPoints = (al: LimbAlign, side: 1 | -1) => {
  const hip = new THREE.Vector3(side * HIP_X, 0, 0);
  const kx = Math.min(al.kneeX, HIP_X + FEMUR - 0.1);
  const knee = new THREE.Vector3(side * kx, -Math.sqrt(FEMUR * FEMUR - (HIP_X - kx) ** 2), 0);
  const dx = al.ankleX - kx;
  const ankle = new THREE.Vector3(side * al.ankleX, knee.y - Math.sqrt(Math.max(1, TIBIA * TIBIA - dx * dx)), 0);
  return {hip, knee, ankle};
};

const BONE = '#e8dcc3', CART = '#a8c7d6';
const up = new THREE.Vector3(0, 1, 0);
const quatBetween = (a: THREE.Vector3, b: THREE.Vector3) => new THREE.Quaternion().setFromUnitVectors(up, b.clone().sub(a).normalize());

const Shaft: React.FC<{a: THREE.Vector3; b: THREE.Vector3; r0: number; r1: number; color?: string; opacity?: number}> = ({a, b, r0, r1, color = BONE, opacity = 1}) => {
  const len = a.distanceTo(b);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const q = quatBetween(a, b);
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[r1, r0, len, 28, 1]} />
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.02} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
};

const Ball: React.FC<{p: THREE.Vector3; s: [number, number, number]; color?: string; opacity?: number; rot?: [number, number, number]}> = ({p, s, color = BONE, opacity = 1, rot}) => (
  <mesh position={p} scale={s} rotation={rot}>
    <sphereGeometry args={[1, 28, 20]} />
    <meshStandardMaterial color={color} roughness={0.55} metalness={0.02} transparent={opacity < 1} opacity={opacity} />
  </mesh>
);

const Leg: React.FC<{al: LimbAlign; side: 1 | -1; soft: number; hl: number}> = ({al, side, soft, hl}) => {
  const {hip, knee, ankle} = useMemo(() => legPoints(al, side), [al.kneeX, al.ankleX, side]);
  const fa = knee.clone().sub(hip).normalize(), ta = ankle.clone().sub(knee).normalize();
  const fAng = Math.atan2(fa.x, -fa.y), tAng = Math.atan2(ta.x, -ta.y); // lean of each segment from vertical (about z)
  const col = new THREE.Color(BONE).lerp(new THREE.Color('#f2a33a'), hl * 0.5);
  const kc = col.getStyle();
  const fib0 = knee.clone().add(new THREE.Vector3(side * 2.2, -3.2, -0.6)), fib1 = ankle.clone().add(new THREE.Vector3(side * 1.9, 1.6, -0.6));
  return (
    <group>
      {/* soft-tissue silhouette (very faint) so the contact/gap between the knees reads */}
      {soft > 0.01 ? (
        <>
          <Shaft a={hip.clone().add(new THREE.Vector3(side * 0.3, 1.5, 0))} b={knee.clone().add(new THREE.Vector3(0, 0.6, 0))} r0={6.4} r1={4.5} color="#d9a98d" opacity={0.3 * soft} />
          <Ball p={knee.clone()} s={[4.6, 3.3, 4.2]} color="#d9a98d" opacity={0.3 * soft} />
          <Shaft a={knee.clone().add(new THREE.Vector3(0, -0.6, 0))} b={ankle.clone().add(new THREE.Vector3(0, 0.8, 0))} r0={4.5} r1={2.8} color="#d9a98d" opacity={0.3 * soft} />
          <Ball p={knee.clone().lerp(ankle, 0.28).add(new THREE.Vector3(-side * 0.2, 0, -0.6))} s={[4.7, 6.2, 4.4]} color="#d9a98d" opacity={0.22 * soft} />
        </>
      ) : null}
      {/* femur */}
      <Ball p={hip.clone().add(new THREE.Vector3(-side * 0.6, 0.6, 0))} s={[2.9, 2.9, 2.9]} />
      <Shaft a={hip.clone().add(new THREE.Vector3(-side * 0.2, 0, 0))} b={knee.clone().add(new THREE.Vector3(0, 1.8, 0))} r0={2.1} r1={1.5} color={kc} />
      <Ball p={knee.clone().add(new THREE.Vector3(side * 1.9, 0.6, 0))} s={[1.9, 2.0, 2.0]} color={kc} />
      <Ball p={knee.clone().add(new THREE.Vector3(-side * 1.9, 0.6, 0))} s={[1.9, 2.0, 2.0]} color={kc} />
      {/* joint space / cartilage */}
      <Ball p={knee.clone().add(new THREE.Vector3(0, -0.9, 0))} s={[4.6, 0.55, 2.3]} color={CART} opacity={0.85} rot={[0, 0, (fAng + tAng) * 0.5]} />
      {/* patella */}
      <Ball p={knee.clone().add(new THREE.Vector3(0, 0.9, 2.6))} s={[1.5, 1.7, 0.75]} color="#efe5cf" />
      {/* tibia + fibula */}
      <Ball p={knee.clone().add(new THREE.Vector3(0, -1.6, 0))} s={[3.2, 0.9, 2.2]} color={kc} rot={[0, 0, tAng]} />
      <Shaft a={knee.clone().add(new THREE.Vector3(0, -1.8, 0))} b={ankle.clone().add(new THREE.Vector3(0, 1.0, 0))} r0={1.55} r1={1.1} color={kc} />
      <Shaft a={fib0} b={fib1} r0={0.55} r1={0.5} />
      <Ball p={ankle.clone().add(new THREE.Vector3(-side * 1.1, 0.2, 0))} s={[1.2, 1.5, 1.2]} />
      <Ball p={ankle.clone().add(new THREE.Vector3(side * 1.9, 0.5, -0.4))} s={[1.0, 1.4, 1.0]} />
      {/* foot block */}
      <Ball p={ankle.clone().add(new THREE.Vector3(0, -2.6, 2.2))} s={[2.6, 1.4, 5.2]} color="#e0d3b8" />
      <group rotation={[0, 0, 0]} />
    </group>
  );
};

export const LowerLimbModel: React.FC<{align: LimbAlign; soft?: number; highlight?: number; pelvis?: boolean}> = ({align, soft = 1, highlight = 0, pelvis = true}) => (
  <group>
    {pelvis ? (
      <group>
        <Ball p={new THREE.Vector3(-6.8, 5.2, -0.5)} s={[6.2, 6.8, 1.9]} rot={[0, 0.35, -0.22]} color="#e0d3b8" />
        <Ball p={new THREE.Vector3(6.8, 5.2, -0.5)} s={[6.2, 6.8, 1.9]} rot={[0, -0.35, 0.22]} color="#e0d3b8" />
        <Ball p={new THREE.Vector3(0, 3.6, -1.6)} s={[3.0, 4.6, 1.6]} color="#d6c8aa" />
      </group>
    ) : null}
    <Leg al={align} side={-1} soft={soft} hl={highlight} />
    <Leg al={align} side={1} soft={soft} hl={highlight} />
  </group>
);
