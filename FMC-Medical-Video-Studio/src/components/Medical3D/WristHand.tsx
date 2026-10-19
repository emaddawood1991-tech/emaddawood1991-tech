import React, {useMemo} from 'react';
import * as THREE from 'three';

/**
 * SIMPLIFIED EDUCATIONAL right-hand / wrist model (palmar view), built procedurally. Not CT-derived and not patient-specific; the video says so.
 * Units ≈ centimetres. +Y = toward the fingertips, wrist crease at y = 0, forearm toward −Y. +Z = palmar side (toward the viewer),
 * thumb on +X (radial side), little finger on −X (ulnar side).
 *
 * Layers (all independently fadeable): skin · bones · flexor tendons · transverse carpal ligament · median nerve · splint.
 * Anatomical points the model respects (checked against standard descriptions; clinician review still required):
 *  - the carpal tunnel is the arch between the carpal bones (floor) and the transverse carpal ligament (roof);
 *  - 9 flexor tendons (4 FDS, 4 FDP, FPL) + the median nerve pass through it; the nerve lies superficial (just under the ligament), radial side;
 *  - the median nerve gives sensation to the thumb, index, middle and the thumb-side half of the ring finger — never the little finger;
 *  - the palmar cutaneous branch leaves BEFORE the tunnel, so the palm/thenar skin is not highlighted as a carpal-tunnel zone;
 *  - compression is mild: the nerve narrows under the ligament (≈ 40 %) with a slight swelling just proximal to it. No gross deformation.
 */

export type WristState = {
  skin: number; bones: number; tendons: number; ligament: number; nerve: number;
  /** 0..1 amber tint + narrowing of the median nerve under the ligament */
  compression: number;
  /** 0..1 soft turquoise highlight of the nerve (and, with `sensory`, of its finger territory) */
  nerveGlow: number;
  /** 0..1 turquoise highlight of the median-nerve sensory zone on the skin (thumb, index, middle, thumb-side ring) */
  sensory: number;
  /** optional per-finger weights (thumb/index/middle/ring) multiplied into `sensory`, for a progressive reveal */
  zones?: Partial<Record<'thumb' | 'index' | 'middle' | 'ring', number>>;
  /** 0..1 amount of subtle tingling sparkle on that zone */
  tingle: number;
  /** 0..1 splint presence (slides on at 0 → 1) */
  splint: number;
  /** wrist flexion (rad). 0 = neutral. Positive bends the hand toward the palm */
  flex: number;
  time: number;
};
export const defaultWristState = (): WristState => ({skin: 0, bones: 1, tendons: 1, ligament: 1, nerve: 1, compression: 0, nerveGlow: 0, sensory: 0, tingle: 0, splint: 0, flex: 0, time: 0});

// ---------------------------------------------------------------- geometry data
type P2 = [number, number];
const BONE = '#E9E1D0', TENDON = '#F7F1E4', LIG = '#E7C3B4', NERVE = '#F8D95A', NERVE_HOT = '#F0A12E', SKIN = '#DDAE92', TEAL = '#2FD1C5';

const FINGERS = {
  thumb:  {cmc: [2.3, 0.8] as P2, joints: [[4.5, 4.4], [5.9, 6.8], [6.8, 8.9]] as P2[], r: [0.55, 0.5, 0.42]},
  index:  {cmc: [1.3, 2.3] as P2, joints: [[1.9, 9.1], [2.4, 13.0], [2.65, 15.3], [2.85, 17.2]] as P2[], r: [0.5, 0.42, 0.36, 0.3]},
  middle: {cmc: [0.1, 2.4] as P2, joints: [[0.3, 9.6], [0.35, 14.0], [0.37, 16.7], [0.38, 18.7]] as P2[], r: [0.5, 0.43, 0.37, 0.3]},
  ring:   {cmc: [-1.1, 2.2] as P2, joints: [[-1.35, 9.0], [-1.7, 13.0], [-1.85, 15.5], [-1.95, 17.4]] as P2[], r: [0.48, 0.4, 0.34, 0.28]},
  pinky:  {cmc: [-2.0, 1.9] as P2, joints: [[-2.9, 7.6], [-3.35, 10.7], [-3.55, 12.6], [-3.7, 14.1]] as P2[], r: [0.44, 0.34, 0.3, 0.25]},
};
type FingerKey = keyof typeof FINGERS;
const FK: FingerKey[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Smooth flexion about the wrist: points distal to the wrist rotate about X, with a soft transition across the carpus. */
const flexPoint = (p: THREE.Vector3, flex: number) => {
  if (!flex) return p;
  const w = THREE.MathUtils.smoothstep(p.y, -1.6, 2.6);
  const a = flex * w;
  return new THREE.Vector3(p.x, p.y * Math.cos(a) - p.z * Math.sin(a), p.y * Math.sin(a) + p.z * Math.cos(a));
};

const Limb: React.FC<{a: THREE.Vector3; b: THREE.Vector3; r1: number; r2?: number; color: string; opacity?: number; rough?: number; emissive?: string; emissiveIntensity?: number; ends?: boolean}> = ({a, b, r1, r2 = r1, color, opacity = 1, rough = 0.5, emissive, emissiveIntensity = 0, ends = true}) => {
  const {geo, quat, mid} = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    return {geo: new THREE.CylinderGeometry(r2, r1, len, 18, 1), quat: new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), dir.clone().normalize()), mid: a.clone().add(b).multiplyScalar(0.5)};
  }, [a, b, r1, r2]);
  if (opacity < 0.01) return null;
  return (
    <>
      <mesh geometry={geo} position={mid} quaternion={quat}>
        <meshPhysicalMaterial color={color} roughness={rough} transparent={opacity < 0.999} opacity={opacity} depthWrite={opacity > 0.9} emissive={emissive} emissiveIntensity={emissiveIntensity} clearcoat={0.15} />
      </mesh>
      {ends && (
        <>
          <mesh position={a} scale={r1 / Math.max(r1, 0.001)}><sphereGeometry args={[r1, 16, 12]} /><meshPhysicalMaterial color={color} roughness={rough} transparent={opacity < 0.999} opacity={opacity} depthWrite={opacity > 0.9} emissive={emissive} emissiveIntensity={emissiveIntensity} /></mesh>
          <mesh position={b}><sphereGeometry args={[r2, 16, 12]} /><meshPhysicalMaterial color={color} roughness={rough} transparent={opacity < 0.999} opacity={opacity} depthWrite={opacity > 0.9} emissive={emissive} emissiveIntensity={emissiveIntensity} /></mesh>
        </>
      )}
    </>
  );
};

/** Tube with a radius profile (0..1 along the path). */
const profileTube = (pts: THREE.Vector3[], radius: (t: number) => number, segs = 80, radial = 14) => {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const frames = curve.computeFrenetFrames(segs, false);
  const pos: number[] = [], idx: number[] = [], nor: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, c = curve.getPointAt(t), r = radius(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2, n = frames.normals[i].clone().multiplyScalar(Math.cos(a)).add(frames.binormals[i].clone().multiplyScalar(Math.sin(a)));
      pos.push(c.x + n.x * r, c.y + n.y * r, c.z + n.z * r); nor.push(n.x, n.y, n.z);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
};

// ---------------------------------------------------------------- the model
export const WristHandModel: React.FC<WristState> = (s) => {
  const f = s.flex;
  const T = (x: number, y: number, z: number) => flexPoint(v3(x, y, z), f);

  // ---- carpal bones (proximal row, distal row): ellipsoids  [x, y, z, rx, ry, rz]
  const carpals: [string, number, number, number, number, number, number][] = [
    ['scaphoid', 1.45, -0.35, 0.15, 1.1, 1.0, 0.75], ['lunate', 0.0, -0.45, 0.1, 0.95, 0.85, 0.75], ['triquetrum', -1.35, -0.2, 0.1, 0.85, 0.75, 0.7], ['pisiform', -2.15, 0.35, 0.55, 0.55, 0.55, 0.5],
    ['trapezium', 2.25, 1.15, 0.2, 0.95, 0.85, 0.7], ['trapezoid', 1.0, 1.7, 0.1, 0.8, 0.7, 0.65], ['capitate', -0.15, 1.7, 0.05, 0.95, 1.0, 0.75], ['hamate', -1.5, 1.45, 0.15, 0.95, 0.85, 0.7],
  ];

  // ---- paths for tendons / nerve (flexed with the hand)
  const fingerAxis = (k: FingerKey) => FINGERS[k].joints;
  const tendonPaths = useMemo(() => {
    const out: THREE.Vector3[][] = [];
    const xs = [-1.35, -0.45, 0.45, 1.35];
    (['pinky', 'ring', 'middle', 'index'] as FingerKey[]).forEach((k, i) => {
      const j = fingerAxis(k);
      const sup = [T(xs[i] * 0.8, -13, 0.55), T(xs[i] * 0.9, -3, 0.62), T(xs[i], 0.9, 0.62), T(xs[i] * 0.9 + j[0][0] * 0.2, 4.5, 0.52), T(j[0][0] * 0.98, j[0][1] - 0.4, 0.62), T(j[1][0], j[1][1], 0.5)];
      const deep = [T(xs[i] * 0.8, -13, 0.3), T(xs[i] * 0.9, -3, 0.36), T(xs[i], 0.9, 0.3), T(xs[i] * 0.9 + j[0][0] * 0.2, 4.5, 0.26), T(j[0][0] * 0.98, j[0][1] - 0.4, 0.4), T(j[1][0], j[1][1], 0.3), T(j[2][0], j[2][1], 0.3), T(j[3][0], j[3][1] - 0.3, 0.3)];
      out.push(sup, deep);
    });
    const t = FINGERS.thumb.joints;
    out.push([T(1.9, -13, 0.4), T(1.9, -3, 0.45), T(2.0, 0.6, 0.45), T(3.2, 2.4, 0.6), T(t[0][0] - 0.2, t[0][1], 0.55), T(t[1][0], t[1][1], 0.45), T(t[2][0], t[2][1] - 0.3, 0.4)]);
    return out;
  }, [f]);

  const comp = s.compression;
  const nerveGeo = useMemo(() => {
    // median nerve: forearm → tunnel (superficial, radial side) → palm; swelling just proximal, narrowing under the ligament
    const pts = [T(0.3, -14, 1.0), T(0.7, -6, 1.1), T(0.9, -1.8, 1.1), T(1.0, 0.2, 1.0), T(1.05, 1.0, 0.98), T(1.15, 2.0, 0.98), T(1.45, 3.1, 0.92)];
    const r = (t: number) => {
      const y = -14 + t * 17.1; // arc ≈ y for this path
      const normal = 0.46;
      const narrow = 1 - 0.4 * comp * Math.exp(-(((y - 1.0) / 1.0) ** 2));
      const swell = 1 + 0.22 * comp * Math.exp(-(((y + 1.8) / 1.1) ** 2));
      return normal * narrow * swell;
    };
    return profileTube(pts, r, 120, 16);
  }, [f, comp]);

  const branchPaths = useMemo(() => {
    const t = FINGERS.thumb.joints, i = FINGERS.index.joints, m = FINGERS.middle.joints, r = FINGERS.ring.joints;
    const z = 0.9;
    return [
      {name: 'thumb-a', pts: [T(1.45, 3.1, z), T(2.6, 4.0, 0.8), T(t[0][0] + 0.3, t[0][1], 0.7), T(t[1][0] + 0.25, t[1][1], 0.62), T(t[2][0] + 0.2, t[2][1], 0.55)], r: [0.2, 0.12]},
      {name: 'thumb-b', pts: [T(1.45, 3.1, z), T(2.2, 4.4, 0.8), T(t[0][0] - 0.3, t[0][1] + 0.2, 0.7), T(t[1][0] - 0.25, t[1][1], 0.62), T(t[2][0] - 0.2, t[2][1], 0.55)], r: [0.17, 0.1]},
      {name: 'index-radial', pts: [T(1.45, 3.1, z), T(1.8, 6.5, 0.9), T(i[0][0] + 0.25, i[0][1] + 0.2, 0.75), T(i[1][0] + 0.2, i[1][1], 0.62), T(i[2][0] + 0.15, i[2][1], 0.55), T(i[3][0] + 0.1, i[3][1] - 0.2, 0.5)], r: [0.17, 0.09]},
      {name: 'index-ulnar', pts: [T(1.45, 3.1, z), T(1.2, 6.5, 0.9), T(i[0][0] - 0.2, i[0][1] + 0.1, 0.75), T(i[1][0] - 0.2, i[1][1], 0.62), T(i[2][0] - 0.15, i[2][1], 0.55), T(i[3][0] - 0.1, i[3][1] - 0.2, 0.5)], r: [0.15, 0.08]},
      {name: 'middle-radial', pts: [T(1.45, 3.1, z), T(0.8, 6.5, 0.9), T(m[0][0] + 0.2, m[0][1] + 0.2, 0.75), T(m[1][0] + 0.2, m[1][1], 0.62), T(m[2][0] + 0.15, m[2][1], 0.55), T(m[3][0] + 0.1, m[3][1] - 0.2, 0.5)], r: [0.15, 0.08]},
      {name: 'middle-ulnar', pts: [T(1.45, 3.1, z), T(0.2, 6.2, 0.9), T(m[0][0] - 0.2, m[0][1] + 0.1, 0.75), T(m[1][0] - 0.2, m[1][1], 0.62), T(m[2][0] - 0.15, m[2][1], 0.55), T(m[3][0] - 0.1, m[3][1] - 0.2, 0.5)], r: [0.14, 0.07]},
      {name: 'ring-radial', pts: [T(1.45, 3.1, z), T(-0.5, 6.0, 0.9), T(r[0][0] + 0.2, r[0][1] + 0.1, 0.72), T(r[1][0] + 0.2, r[1][1], 0.6), T(r[2][0] + 0.15, r[2][1], 0.52), T(r[3][0] + 0.1, r[3][1] - 0.2, 0.48)], r: [0.14, 0.07]},
    ];
  }, [f]);

  const nerveColor = new THREE.Color(NERVE).lerp(new THREE.Color(NERVE_HOT), comp * 0.85);
  const glow = s.nerveGlow;
  const tendonGeos = useMemo(() => tendonPaths.map((p) => profileTube(p, () => 0.2, 60, 10)), [tendonPaths]);
  const branchGeos = useMemo(() => branchPaths.map((b) => profileTube(b.pts, (t) => b.r[0] + (b.r[1] - b.r[0]) * t, 50, 10)), [branchPaths]);

  // ---- transverse carpal ligament: arched band over the carpal tunnel, y 0.15 … 2.05
  const ligGeo = useMemo(() => {
    const sh = new THREE.Shape();
    const n = 28, xs = (i: number) => -2.2 + (i / n) * 4.75;
    const zTop = (x: number) => 1.22 + 0.12 * (1 - (x / 2.4) ** 2), zBot = (x: number) => zTop(x) - 0.3;
    sh.moveTo(xs(0), -zTop(xs(0)));
    for (let i = 1; i <= n; i++) sh.lineTo(xs(i), -zTop(xs(i)));
    for (let i = n; i >= 0; i--) sh.lineTo(xs(i), -zBot(xs(i)));
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, {depth: 1.9, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 8});
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0.15, 0);
    return g;
  }, []);

  const flexGroupMatrix = useMemo(() => new THREE.Matrix4(), []);
  void flexGroupMatrix;

  // ---- skin parts
  const skinOp = s.skin;
  const sens = s.sensory;
  const zw = (k: string) => (s.zones as Record<string, number> | undefined)?.[k] ?? 1;
  const skinMat = (extra?: Partial<THREE.MeshPhysicalMaterialParameters>) => <meshPhysicalMaterial color={SKIN} roughness={0.52} sheen={0.4} sheenColor={new THREE.Color('#ffd9c4')} transparent={skinOp < 0.999} opacity={skinOp} depthWrite={skinOp > 0.9} {...extra} />;
  const handRot = f; // hand skin/bones rotate rigidly about the wrist for display; tendons/nerve are re-routed in JS
  const rotAxis = (children: React.ReactNode) => <group rotation={[handRot, 0, 0]}>{children}</group>;

  const sparkle = (k: FingerKey) => {
    const j = FINGERS[k].joints; const pts: THREE.Vector3[] = [];
    for (let n = 0; n < 7; n++) { const t = n / 6, seg = Math.min(j.length - 2, Math.floor(t * (j.length - 1))); const lt = t * (j.length - 1) - seg; pts.push(v3(j[seg][0] + (j[seg + 1][0] - j[seg][0]) * lt, j[seg][1] + (j[seg + 1][1] - j[seg][1]) * lt, 1.05)); }
    return pts;
  };

  return (
    <group>
      {/* ---------------- forearm bones (fixed) ---------------- */}
      <Limb a={v3(1.35, -16, 0)} b={v3(1.45, -1.9, 0)} r1={1.0} r2={1.35} color={BONE} opacity={s.bones} rough={0.55} />
      <Limb a={v3(-1.7, -16, -0.2)} b={v3(-1.8, -2.2, -0.2)} r1={0.7} r2={0.85} color={BONE} opacity={s.bones} rough={0.55} />

      {/* ---------------- carpal + hand bones (rotate with the hand) ---------------- */}
      {rotAxis(
        <>
          {carpals.map(([n, x, y, z, rx, ry, rz]) => s.bones > 0.01 && (
            <mesh key={n} position={[x, y, z]} scale={[rx, ry, rz]}>
              <sphereGeometry args={[1, 24, 18]} />
              <meshPhysicalMaterial color={BONE} roughness={0.5} clearcoat={0.2} transparent={s.bones < 0.999} opacity={s.bones} depthWrite={s.bones > 0.9} />
            </mesh>
          ))}
          {/* hook of hamate (palmar projection) */}
          {s.bones > 0.01 && <mesh position={[-1.45, 1.15, 0.85]} scale={[0.35, 0.5, 0.45]}><sphereGeometry args={[1, 14, 10]} /><meshPhysicalMaterial color={BONE} roughness={0.5} transparent={s.bones < 0.999} opacity={s.bones} /></mesh>}
          {FK.map((k) => {
            const F = FINGERS[k]; const pts = [v3(F.cmc[0], F.cmc[1], 0), ...F.joints.map((p) => v3(p[0], p[1], 0))];
            return pts.slice(0, -1).map((a, i) => <Limb key={`${k}${i}`} a={a} b={pts[i + 1]} r1={F.r[Math.min(i, F.r.length - 1)] * 0.95} r2={F.r[Math.min(i, F.r.length - 1)] * 0.8} color={BONE} opacity={s.bones} rough={0.5} />);
          })}
        </>,
      )}

      {/* ---------------- flexor tendons (9) ---------------- */}
      {s.tendons > 0.01 && tendonGeos.map((g, i) => (
        <mesh key={i} geometry={g}><meshPhysicalMaterial color={TENDON} roughness={0.5} clearcoat={0.1} transparent={s.tendons < 0.999} opacity={s.tendons} depthWrite={s.tendons > 0.9} /></mesh>
      ))}

      {/* ---------------- median nerve (+ branches) ---------------- */}
      {s.nerve > 0.01 && (
        <>
          <mesh geometry={nerveGeo}><meshPhysicalMaterial color={nerveColor} roughness={0.4} emissive={new THREE.Color(glow > 0 ? '#9ff3ea' : NERVE_HOT)} emissiveIntensity={glow * 0.5 + comp * 0.12} transparent={s.nerve < 0.999} opacity={s.nerve} depthWrite={s.nerve > 0.9} /></mesh>
          {branchGeos.map((g, i) => <mesh key={i} geometry={g}><meshPhysicalMaterial color={nerveColor} roughness={0.4} emissive={new THREE.Color('#9ff3ea')} emissiveIntensity={glow * 0.45} transparent={s.nerve < 0.999} opacity={s.nerve} /></mesh>)}
        </>
      )}

      {/* ---------------- transverse carpal ligament ---------------- */}
      {s.ligament > 0.01 && (
        <mesh geometry={ligGeo}><meshPhysicalMaterial color={LIG} roughness={0.45} clearcoat={0.3} transparent opacity={0.6 * s.ligament} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      )}

      {/* ---------------- skin: forearm, palm, fingers ---------------- */}
      {skinOp > 0.01 && (
        <>
          <mesh position={[0, -8.1, 0.1]} scale={[3.2, 16.4, 2.0]}><cylinderGeometry args={[1, 0.88, 1, 32, 1]} />{skinMat()}</mesh>
          {rotAxis(
            <>
              <mesh position={[-0.05, 4.9, 0.1]} scale={[4.45, 5.5, 1.25]}><sphereGeometry args={[1, 28, 20]} />{skinMat()}</mesh>
              <mesh position={[-0.05, 0.6, 0.1]} scale={[3.7, 2.2, 1.7]}><sphereGeometry args={[1, 24, 18]} />{skinMat()}</mesh>
              <mesh position={[2.9, 2.9, 0.55]} scale={[1.9, 2.4, 1.05]}><sphereGeometry args={[1, 22, 16]} />{skinMat()}</mesh>
              <mesh position={[-2.7, 3.3, 0.4]} scale={[1.2, 2.3, 0.85]}><sphereGeometry args={[1, 20, 14]} />{skinMat()}</mesh>
              {FK.map((k) => {
                const F = FINGERS[k]; const pts = k === 'thumb' ? [v3(F.cmc[0] + 0.7, F.cmc[1] + 1.4, 0.4), ...F.joints.map((p) => v3(p[0], p[1], 0.1))] : F.joints.map((p) => v3(p[0], p[1], 0.1));
                return pts.slice(0, -1).map((a, i) => {
                  const th = k === 'thumb' ? 1.25 : 1, r1 = F.r[Math.min(i, F.r.length - 1)] * 1.95 * th, r2 = F.r[Math.min(i + 1, F.r.length - 1)] * 1.85 * th;
                  return <Limb key={`${k}s${i}`} a={a} b={pts[i + 1]} r1={r1} r2={r2} color={SKIN} opacity={skinOp} rough={0.5} />;
                });
              })}
            </>,
          )}
        </>
      )}

      {/* ---------------- sensory zone (median nerve territory of the fingers) ---------------- */}
      {sens > 0.01 && rotAxis(
        <>
          {(['thumb', 'index', 'middle'] as FingerKey[]).map((k) => {
            const F = FINGERS[k]; const pts = k === 'thumb' ? [v3(F.joints[0][0], F.joints[0][1], 0.1), v3(F.joints[1][0], F.joints[1][1], 0.1), v3(F.joints[2][0], F.joints[2][1], 0.1)] : F.joints.slice(1).map((p) => v3(p[0], p[1], 0.1));
            return pts.slice(0, -1).map((a, i) => <Limb key={`z${k}${i}`} a={a.clone().add(v3(0, 0, 0.1))} b={pts[i + 1].clone().add(v3(0, 0, 0.1))} r1={F.r[Math.min(i + 1, F.r.length - 1)] * 1.95} r2={F.r[Math.min(i + 2, F.r.length - 1)] * 1.85} color={TEAL} opacity={0.5 * sens * zw(k) * (0.75 + 0.25 * Math.sin(s.time * 3 + i))} rough={0.3} emissive={TEAL} emissiveIntensity={0.9 * sens * zw(k)} />);
          })}
          {/* ring finger: THUMB-SIDE (radial) half only */}
          {(() => {
            const F = FINGERS.ring; const j = F.joints.slice(1);
            return j.slice(0, -1).map((a, i) => {
              const b = j[i + 1]; const r = F.r[Math.min(i + 1, 3)] * 1.9;
              const mid: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
              return (
                <mesh key={`zr${i}`} position={[mid[0] + 0.05, mid[1], 0.1]} scale={[1, 1, 1]}>
                  <cylinderGeometry args={[r, r, len, 16, 1, true, 0, Math.PI * 0.55]} />
                  <meshPhysicalMaterial color={TEAL} emissive={TEAL} emissiveIntensity={0.9 * sens * zw('ring')} transparent opacity={0.5 * sens * zw('ring') * (0.75 + 0.25 * Math.sin(s.time * 3 + i))} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>
              );
            });
          })()}
        </>,
      )}
      {s.tingle > 0.01 && rotAxis(
        <>
          {(['thumb', 'index', 'middle'] as FingerKey[]).flatMap((k, ki) => sparkle(k).map((p, n) => {
            const ph = (s.time * 1.6 + n * 0.37 + ki * 0.21) % 1;
            const a = Math.sin(Math.PI * ph);
            return <mesh key={`sp${k}${n}`} visible={zw(k) > 0.05} position={[p.x + 0.55 * Math.sin(n * 7 + ki), p.y, p.z + 0.35 + 0.5 * ph]} scale={0.5 + 0.5 * a}><sphereGeometry args={[0.14, 8, 6]} /><meshBasicMaterial color="#d9fffb" transparent opacity={0.9 * a * s.tingle} depthWrite={false} /></mesh>;
          }))}
        </>,
      )}

      {/* ---------------- volar wrist splint (neutral position) ---------------- */}
      {s.splint > 0.01 && <Splint amount={s.splint} />}
    </group>
  );
};

// ---------------------------------------------------------------- splint
const Splint: React.FC<{amount: number}> = ({amount}) => {
  const lift = (1 - amount) * 7; // slides in from the palmar side
  const op = Math.min(1, amount * 1.6);
  const SPL = '#28537F', EDGE = '#dfe9f2', STRAP = '#f4f6f8';
  const shell = (r: number, h: number, y: number, sx: number, sz: number, theta: number, x = 0) => (
    <mesh position={[x, y, 0.15]} rotation={[0, 0, 0]} scale={[sx, 1, sz]}>
      <cylinderGeometry args={[r, r, h, 36, 1, true, -theta / 2, theta]} />
      <meshPhysicalMaterial color={SPL} roughness={0.7} side={THREE.DoubleSide} transparent opacity={op} />
    </mesh>
  );
  return (
    <group position={[0, 0, lift]}>
      {/* forearm shell (palmar half) and palm shell */}
      {shell(1, 11.5, -6.3, 3.6, 2.4, Math.PI * 1.05)}
      {shell(1, 6.9, 3.4, 4.1, 1.75, Math.PI * 0.8, -0.8)}
      {/* rigid palmar stay */}
      <mesh position={[0, -1.5, 2.5]}><boxGeometry args={[1.2, 12.5, 0.16]} /><meshStandardMaterial color="#c8d2dc" metalness={0.6} roughness={0.35} transparent opacity={op} /></mesh>
      {/* edge binding */}
      <mesh position={[0, -12, 0.15]} scale={[3.6, 1, 2.4]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1, 0.035, 8, 40, Math.PI * 1.05]} /><meshStandardMaterial color={EDGE} transparent opacity={op} /></mesh>
      {/* three hook-and-loop straps (wrap around forearm and wrist) */}
      {[-9.4, -5.6, -1.6].map((y, i) => (
        <mesh key={i} position={[0, y, 0.1]} rotation={[Math.PI / 2, 0, 0]} scale={[3.68, 2.48, 1]}>
          <torusGeometry args={[1, 0.2, 6, 44]} />
          <meshStandardMaterial color={STRAP} roughness={0.8} transparent opacity={op} />
        </mesh>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- axial cross-section (schematic), facing +Z, palmar side up
export const AxialSection: React.FC<{compression: number; arrows: number; opacity: number; time: number}> = ({compression, arrows, opacity, time}) => {
  const bones: [number, number, number, number][] = [[2.4, 0.05, 0.85, 0.75], [1.0, -0.95, 0.8, 0.7], [-0.3, -1.15, 0.9, 0.75], [-1.7, -0.55, 0.85, 0.75]]; // trapezium, trapezoid, capitate, hamate
  const tend: [number, number][] = [[-1.2, 0.35], [-0.5, 0.45], [0.2, 0.4], [0.85, 0.3], [-1.0, -0.2], [-0.35, -0.15], [0.3, -0.2], [0.9, -0.3], [1.55, -0.05]];
  const nerveW = 0.5 * (1 + 0.1 * compression), nerveH = 0.34 * (1 - 0.45 * compression);
  const nc = new THREE.Color(NERVE).lerp(new THREE.Color(NERVE_HOT), compression * 0.85);
  const M = (c: string, o = 1, extra: object = {}) => <meshPhysicalMaterial color={c} roughness={0.45} transparent opacity={o * opacity} depthWrite={opacity > 0.9} {...extra} />;
  return (
    <group>
      {/* slab backing */}
      <mesh position={[0.3, -0.1, -0.5]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[4.1, 4.1, 0.5, 64]} /><meshPhysicalMaterial color="#0f2742" roughness={0.6} transparent opacity={0.88 * opacity} /></mesh>
      <group rotation={[Math.PI / 2, 0, 0]} />
      {/* carpal bones */}
      {bones.map(([x, y, rx, ry], i) => <mesh key={i} position={[x, y, 0]} scale={[rx, ry, 0.45]}><sphereGeometry args={[1, 28, 20]} />{M(BONE)}</mesh>)}
      <mesh position={[-1.95, 0.3, 0.1]} scale={[0.25, 0.45, 0.35]}><sphereGeometry args={[1, 12, 10]} />{M(BONE)}</mesh>
      {/* transverse carpal ligament (roof) */}
      <mesh position={[0.2, 1.2, 0.1]} scale={[2.45, 0.2, 0.45]}><sphereGeometry args={[1, 32, 12]} />{M(LIG, 0.92)}</mesh>
      {/* flexor tendons */}
      {tend.map(([x, y], i) => <mesh key={i} position={[x, y, 0.08]} scale={[0.27, 0.27, 0.4]}><sphereGeometry args={[1, 14, 10]} />{M(TENDON)}</mesh>)}
      {/* median nerve (superficial, radial side) — flattened when compressed */}
      <mesh position={[1.35, 0.82, 0.12]} scale={[nerveW, nerveH, 0.45]}><sphereGeometry args={[1, 24, 16]} />{M(nc.getStyle(), 1, {emissive: new THREE.Color('#9ff3ea'), emissiveIntensity: 0.4})}</mesh>
      {/* gentle pressure arrows from the ligament onto the nerve (only while compression is shown) */}
      {arrows > 0.01 && [0.75, 1.35, 1.95].map((x, i) => (
        <group key={i} position={[x, 1.75 + 0.1 * Math.sin(time * 3 + i), 0.2]} rotation={[0, 0, Math.PI]}>
          <mesh position={[0, 0.18, 0]}><coneGeometry args={[0.13, 0.34, 12]} /><meshBasicMaterial color="#F0A12E" transparent opacity={0.85 * arrows * opacity} depthWrite={false} /></mesh>
          <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.04, 0.04, 0.42, 8]} /><meshBasicMaterial color="#F0A12E" transparent opacity={0.85 * arrows * opacity} depthWrite={false} /></mesh>
        </group>
      ))}
    </group>
  );
};

/** Local anchor points for Arabic callouts (model space). */
export const WRIST_ANCHORS = {
  carpalBones: [-0.2, -0.45, 0.4] as [number, number, number],
  tunnel: [0.1, 1.0, 0.7] as [number, number, number],
  ligament: [-1.9, 1.0, 1.2] as [number, number, number],
  nerve: [1.05, 0.9, 1.05] as [number, number, number],
  nerveForearm: [0.7, -6, 1.15] as [number, number, number],
  tendons: [-0.8, -6, 0.65] as [number, number, number],
  wristCentre: [0, 0.4, 0.5] as [number, number, number],
  thumbTip: [6.8, 8.9, 0.6] as [number, number, number],
  indexTip: [2.85, 17.2, 0.6] as [number, number, number],
  middleTip: [0.38, 18.7, 0.6] as [number, number, number],
  ringTip: [-1.95, 17.4, 0.6] as [number, number, number],
  pinkyTip: [-3.7, 14.1, 0.6] as [number, number, number],
};
