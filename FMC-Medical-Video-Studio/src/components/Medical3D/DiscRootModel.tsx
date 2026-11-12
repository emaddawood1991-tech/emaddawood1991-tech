import React, {useMemo} from 'react';
import * as THREE from 'three';

/**
 * Illustrative L4–L5 segment seen from behind-left: two vertebral bodies, the intervertebral disc with a posterolateral bulge,
 * the dural sac, the exiting L4 root and the traversing L5 root. `irritation` (0..1) shows ONE plausible example of a bulging
 * disc contacting the L5 root (orange tint, red contact point). Not every sciatica case has this cause. Units: cm.
 */
const BONE = '#efe6d2', DISCC = '#b4c4cf', YEL = '#F6C945', ORA = '#F28C28', RED = '#E5322D', SAC = '#c9d6df';

const Tube: React.FC<{pts: [number, number, number][]; r: number | ((t: number) => number); color: string; opacity?: number; progress?: number}> = ({pts, r, color, opacity = 1, progress = 1}) => {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const g = new THREE.TubeGeometry(curve, 80, typeof r === 'number' ? r : 0.3, 14, false);
    if (typeof r === 'function') {
      // variable radius: scale vertices around the curve axis
      const pos = g.attributes.position as THREE.BufferAttribute;
      const segs = 80, rad = 14;
      for (let i = 0; i <= segs; i++) {
        const c = curve.getPointAt(i / segs);
        const k = (r as (t: number) => number)(i / segs) / 0.3;
        for (let j = 0; j <= rad; j++) {
          const idx = i * (rad + 1) + j;
          const v = new THREE.Vector3().fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c);
          pos.setXYZ(idx, v.x, v.y, v.z);
        }
      }
      pos.needsUpdate = true; g.computeVertexNormals();
    }
    return g;
  }, [pts, typeof r === 'number' ? r : 0]);
  const per = 14 * 6;
  geo.setDrawRange(0, Math.round(Math.max(0, Math.min(1, progress)) * 80) * per);
  return <mesh geometry={geo}><meshStandardMaterial color={color} roughness={0.45} emissive={color} emissiveIntensity={0.25} transparent={opacity < 1} opacity={opacity} /></mesh>;
};

export const DiscRootModel: React.FC<{irritation: number; time: number; reveal?: number}> = ({irritation, time, reveal = 1}) => {
  const pulse = 1 + 0.08 * Math.sin(time * 3.2);
  const bodyCol = BONE;
  const L5root: [number, number, number][] = [[0.5, 1.6, -2.7], [0.9, 0.2, -2.55], [1.35, -0.6, -2.45], [2.1, -2.6, -2.2], [3.2, -4.6, -1.7], [5.0, -6.8, -0.9], [7.0, -8.6, -0.2]];
  const L4root: [number, number, number][] = [[0.5, 5.2, -2.8], [1.8, 4.6, -2.4], [3.6, 3.6, -1.7], [5.6, 2.2, -0.9], [7.6, 0.6, -0.1]];
  const bulge = irritation;
  return (
    <group>
      {/* dural sac */}
      <mesh position={[0, 0, -2.8]}><cylinderGeometry args={[0.95, 0.95, 18, 28]} /><meshStandardMaterial color={SAC} roughness={0.5} transparent opacity={0.55 * reveal} /></mesh>
      {/* vertebral bodies */}
      {[3.4, -3.4].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh scale={[2.7, 1, 2.2]}><cylinderGeometry args={[1, 0.96, 2.9, 40]} /><meshStandardMaterial color={bodyCol} roughness={0.55} transparent opacity={reveal} /></mesh>
          {/* pedicles + arch */}
          {[-1, 1].map((s) => <mesh key={s} position={[s * 1.4, 0.2, -2.1]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.5, 0.5, 1.8, 14]} /><meshStandardMaterial color={bodyCol} roughness={0.55} transparent opacity={reveal} /></mesh>)}
          <mesh position={[0, 0.2, -3.4]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 1]}><torusGeometry args={[1.7, 0.42, 12, 28, Math.PI]} /><meshStandardMaterial color={bodyCol} roughness={0.55} transparent opacity={reveal} /></mesh>
          <mesh position={[0, 0.1, -5.6]} rotation={[Math.PI / 2 - 0.2, 0, 0]}><coneGeometry args={[0.55, 2.4, 14]} /><meshStandardMaterial color={bodyCol} roughness={0.55} transparent opacity={reveal} /></mesh>
        </group>
      ))}
      {/* disc */}
      <mesh position={[0, 0, 0]} scale={[2.55, 1, 2.1]}><cylinderGeometry args={[1, 1, 1.1, 40]} /><meshStandardMaterial color={new THREE.Color(DISCC).lerp(new THREE.Color(ORA), 0.35 * bulge)} roughness={0.5} /></mesh>
      {/* posterolateral bulge (one illustrative example) */}
      <mesh position={[1.6, 0, -1.6 - 0.3 * bulge]} scale={[1.0 + 0.35 * bulge, 0.5 + 0.12 * bulge, 0.62 + 0.38 * bulge]}>
        <sphereGeometry args={[1, 32, 20]} />
        <meshStandardMaterial color={new THREE.Color(DISCC).lerp(new THREE.Color(ORA), 0.7 * bulge)} roughness={0.5} emissive={ORA} emissiveIntensity={0.22 * bulge} />
      </mesh>
      {/* nerve roots */}
      <Tube pts={L4root} r={(t) => 0.3 - 0.06 * t} color={YEL} progress={reveal} />
      <Tube pts={L5root} r={(t) => (t > 0.18 && t < 0.4 ? 0.3 - 0.1 * bulge : 0.3 - 0.07 * t)} color={bulge > 0.5 ? new THREE.Color(YEL).lerp(new THREE.Color(ORA), 0.5 * bulge).getStyle() : YEL} progress={reveal} />
      {/* contact: orange halo + red point */}
      {bulge > 0.02 ? (
        <>
          <mesh position={[1.1, -0.35, -2.5]} scale={[1.5 * pulse, 1.3 * pulse, 1.2 * pulse]}><sphereGeometry args={[0.9, 24, 16]} /><meshBasicMaterial color={ORA} transparent opacity={0.28 * bulge} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
          <mesh position={[1.1, -0.35, -2.5]} scale={[0.55 * pulse, 0.55 * pulse, 0.55 * pulse]}><sphereGeometry args={[0.9, 24, 16]} /><meshBasicMaterial color={RED} transparent opacity={0.6 * bulge} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
        </>
      ) : null}
    </group>
  );
};

/** Anchor points (world) for labels. */
export const DISC_ANCHORS = {disc: new THREE.Vector3(-1.2, 0, 1.0), root: new THREE.Vector3(2.1, -2.6, -2.2), contact: new THREE.Vector3(1.1, -0.35, -2.5), sac: new THREE.Vector3(0, 4.5, -2.8), body: new THREE.Vector3(-2.4, 3.4, 0.4)};
