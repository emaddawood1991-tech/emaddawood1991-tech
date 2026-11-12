import React, {useMemo} from 'react';
import * as THREE from 'three';

/**
 * Lumbar spine + sacrum + pelvis + nerve-root / sciatic-nerve overlay for a PHOTOGRAPHED back view.
 * Pixel space (1 unit = 1 px of the 1080×1920 frame, y UP): the parent supplies an orthographic camera, and `calib` places the
 * model on the person's body. Colours follow the brief: off-white bone, warm-yellow nerve, orange irritated region, red radiating pain.
 * Simplified teaching illustration — never a patient scan.
 */
export type Calib = {x0: number; levelsY: number[]; sacrumY: number; pelvisY: number; hipDX: number; hipY: number; px: number};

/** Calibration for stock clip Pexels 8313064 (static back view; y values are screen px, y DOWN). */
export const CALIB_8313064: Calib = {x0: 702, levelsY: [1085, 1140, 1195, 1250, 1305], sacrumY: 1395, pelvisY: 1265, hipDX: 112, hipY: 1500, px: 12.5};

export type OverlayState = {
  bones: number; // 0..1 reveal of vertebrae/pelvis
  nerves: number; // 0..1 yellow nerve roots + sciatic nerve (drawn progressively)
  orange: number; // 0..1 irritated root region (L5 on the affected side)
  red: number; // 0..1 red radiating pain drawn along the leg (progressive)
  pulse: number; // time (s) for gentle pulsing
  dim?: number; // 0..1 how strongly the unaffected side is dimmed
  calm?: number; // 0..1 the red/orange pain marking retreats (relief section)
};

const BONE = '#efe6d2', DISC = '#a9bdca', YEL = '#F6C945', ORA = '#F28C28', RED = '#E5322D';
const H = 1920;
const Y = (y: number) => H - y; // screen-y (down) → world-y (up)

const tubeProgress = (geo: THREE.TubeGeometry, p: number) => {
  const per = (geo.parameters.radialSegments ?? 8) * 6;
  const segs = geo.parameters.tubularSegments ?? 1;
  const count = Math.round(Math.max(0, Math.min(1, p)) * segs) * per;
  geo.setDrawRange(0, count);
};

const Nerve: React.FC<{pts: THREE.Vector3[]; r: number; color: string; progress: number; opacity?: number; glow?: number; from?: number; to?: number}> = ({pts, r, color, progress, opacity = 1, glow = 0, from = 0, to = 1}) => {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    const all = curve.getPoints(140);
    const a = Math.floor(from * (all.length - 1)), b = Math.max(a + 3, Math.floor(to * (all.length - 1)));
    const sub = new THREE.CatmullRomCurve3(all.slice(a, b + 1));
    return new THREE.TubeGeometry(sub, 90, r, 10, false);
  }, [pts, r, from, to]);
  tubeProgress(geo, progress);
  const ggeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    const all = curve.getPoints(140);
    const a = Math.floor(from * (all.length - 1)), b = Math.max(a + 3, Math.floor(to * (all.length - 1)));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(all.slice(a, b + 1)), 90, r * 2.6, 10, false);
  }, [pts, r, from, to]);
  tubeProgress(ggeo, progress);
  return (
    <group>
      {glow > 0.01 ? (
        <mesh geometry={ggeo} renderOrder={5}><meshBasicMaterial color={color} transparent opacity={0.22 * glow * opacity} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      ) : null}
      <mesh geometry={geo} renderOrder={6}><meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} /></mesh>
    </group>
  );
};

export const SciaticaOverlay: React.FC<{st: OverlayState; calib?: Calib; side?: 1 | -1}> = ({st, calib = CALIB_8313064, side = 1}) => {
  const c = calib, S = c.px;
  const calm = st.calm ?? 0;
  const dimOther = 1 - 0.55 * (st.dim ?? 1);
  st = {...st, red: st.red * (1 - calm), orange: st.orange * (1 - 0.92 * calm)};
  const bo = st.bones;
  // ---- vertebral levels (L1..L5) ----
  const lev = c.levelsY.map((y, i) => ({y, w: (4.0 + i * 0.16) * S, h: 2.9 * S, name: `L${i + 1}`}));
  // nerve paths for one side (sgn = +1 screen right, −1 screen left); built in world coordinates (y up)
  const path = (sgn: number) => {
    const x0 = c.x0, hx = x0 + sgn * c.hipDX;
    const root = (ly: number, spread: number) => [new THREE.Vector3(x0 + sgn * 6, Y(ly), 6), new THREE.Vector3(x0 + sgn * (spread * 0.6), Y(ly + 22), 8), new THREE.Vector3(x0 + sgn * (spread + 26), Y(ly + 70), 10)];
    return {
      L4: root(c.levelsY[3], 30), L5: root(c.levelsY[4], 38), S1: root(c.sacrumY - 60, 46), S2: root(c.sacrumY - 10, 52),
      sciatic: [
        new THREE.Vector3(x0 + sgn * 74, Y(c.sacrumY - 10), 10), new THREE.Vector3(hx + sgn * 6, Y(c.hipY - 20), 12), new THREE.Vector3(hx + sgn * 2, Y(c.hipY + 110), 12),
        new THREE.Vector3(hx - sgn * 2, Y(c.hipY + 260), 12), new THREE.Vector3(hx - sgn * 6, Y(c.hipY + 420), 12), new THREE.Vector3(hx - sgn * 8, Y(c.hipY + 520), 12),
      ],
    };
  };
  const A = useMemo(() => path(side), [side]);
  const B = useMemo(() => path(-side as 1 | -1), [side]);
  const pul = 1 + 0.07 * Math.sin(st.pulse * 3.2);
  const x0 = c.x0;
  return (
    <group>
      {/* ---------- pelvis & sacrum ---------- */}
      <group>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[x0 + s * 100, Y(c.pelvisY + 52), 2]} rotation={[0, 0, s * 0.42]} scale={[86, 74, 6]}>
            <sphereGeometry args={[1, 32, 20]} />
            <meshStandardMaterial color={BONE} roughness={0.6} transparent opacity={0.5 * bo * (s === side ? 1 : dimOther)} depthWrite={false} />
          </mesh>
        ))}
        <mesh position={[x0, Y(c.sacrumY - 8), 4]} scale={[58, 104, 9]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.5, 1, 4]} />
          <meshStandardMaterial color="#e2d4b5" roughness={0.6} transparent opacity={0.85 * bo} depthWrite={false} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={`h${s}`} position={[x0 + s * c.hipDX, Y(c.hipY - 40), 2]} scale={[24, 24, 10]}>
            <sphereGeometry args={[1, 24, 18]} />
            <meshStandardMaterial color={BONE} roughness={0.55} transparent opacity={0.6 * bo * (s === side ? 1 : dimOther)} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {/* ---------- lumbar vertebrae + discs ---------- */}
      {lev.map((v, i) => {
        const isL5S1 = false;
        const hot = i === 4 ? st.orange : 0; // L5 level (traversing L5 root, illustrative)
        const col = new THREE.Color(BONE).lerp(new THREE.Color(ORA), hot * 0.45);
        return (
          <group key={v.name} position={[x0, Y(v.y), 6]}>
            <mesh scale={[v.w / 2, v.h / 2, 7]}><sphereGeometry args={[1, 28, 16]} /><meshStandardMaterial color={col} roughness={0.55} transparent opacity={0.55 * bo} depthWrite={false} /></mesh>
            {/* laminae/arch (visible from behind) */}
            <mesh position={[0, 0, 9]} scale={[v.w * 0.42, v.h * 0.34, 5]}><sphereGeometry args={[1, 24, 14]} /><meshStandardMaterial color={col} roughness={0.55} transparent opacity={0.9 * bo} depthWrite={false} /></mesh>
            {/* spinous process */}
            <mesh position={[0, -2, 14]} scale={[5.5, v.h * 0.46, 6]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color={col} roughness={0.55} transparent opacity={0.95 * bo} depthWrite={false} /></mesh>
            {/* transverse processes */}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * (v.w / 2 + 16), 4, 8]} scale={[20, 5.5, 4]}><sphereGeometry args={[1, 14, 10]} /><meshStandardMaterial color={col} roughness={0.55} transparent opacity={0.85 * bo * (s === side ? 1 : dimOther)} depthWrite={false} /></mesh>
            ))}
            {/* disc below this body */}
            {i < 4 ? (
              <mesh position={[0, -(v.h / 2 + 8.2), 4]} scale={[v.w * 0.47, 8.5, 6]}>
                <sphereGeometry args={[1, 24, 12]} />
                <meshStandardMaterial color={i === 3 ? new THREE.Color(DISC).lerp(new THREE.Color(ORA), st.orange * 0.7) : DISC} roughness={0.5} transparent opacity={0.8 * bo} depthWrite={false} />
              </mesh>
            ) : null}
            {void isL5S1}
          </group>
        );
      })}
      {/* ---------- nerve roots + sciatic nerve ---------- */}
      {(['L4', 'L5', 'S1', 'S2'] as const).map((k, i) => (
        <group key={k}>
          <Nerve pts={A[k]} r={2.7} color={YEL} progress={Math.min(1, st.nerves * 2.2 - i * 0.18)} glow={st.nerves} opacity={0.95} />
          <Nerve pts={B[k]} r={2.4} color={YEL} progress={Math.min(1, st.nerves * 2.2 - i * 0.18)} opacity={0.95 * dimOther} />
        </group>
      ))}
      <Nerve pts={A.sciatic} r={6.2 * (st.red > 0.02 ? pul : 1)} color={YEL} progress={Math.min(1, Math.max(0, st.nerves * 2 - 0.55))} glow={st.nerves} opacity={0.95} />
      <Nerve pts={B.sciatic} r={5.6} color={YEL} progress={Math.min(1, Math.max(0, st.nerves * 2 - 0.55))} opacity={0.95 * dimOther} />
      {/* ---------- irritated root (orange) and radiating pain (red) ---------- */}
      {st.orange > 0.02 ? (
        <mesh position={[x0 + side * 44, Y(c.levelsY[4] + 30), 16]} scale={[34 * pul, 26 * pul, 8]} renderOrder={8}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshBasicMaterial color={ORA} transparent opacity={0.55 * st.orange} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ) : null}
      {st.red > 0.02 ? (
        <>
          <Nerve pts={A.sciatic} r={7.4 * pul} color={RED} progress={st.red} glow={1} opacity={0.78} />
          <Nerve pts={A.L5} r={4.6} color={ORA} progress={Math.min(1, st.red * 3)} glow={1} opacity={0.9} />
          <mesh position={[x0 + side * 108, Y(c.hipY - 10), 18]} scale={[46 * pul, 44 * pul, 8]} renderOrder={9}>
            <sphereGeometry args={[1, 24, 16]} />
            <meshBasicMaterial color={RED} transparent opacity={0.32 * Math.min(1, st.red * 2)} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </>
      ) : null}
    </group>
  );
};

/** Screen-space anchors (y DOWN) on the calibrated body for labels. */
export const anchors = (c: Calib = CALIB_8313064, side: 1 | -1 = 1) => ({
  lowerBack: [c.x0 + side * 30, c.levelsY[3] + 6] as [number, number],
  buttock: [c.x0 + side * c.hipDX, c.hipY - 30] as [number, number],
  thigh: [c.x0 + side * c.hipDX, c.hipY + 190] as [number, number],
  leg: [c.x0 + side * c.hipDX - side * 8, c.hipY + 400] as [number, number],
  roots: [c.x0 + side * 46, c.sacrumY - 40] as [number, number],
});

/** Pixel-exact overlay camera: a distant perspective camera (fov chosen so that 1 world unit = 1 px at z = 0) — behaves like an orthographic overlay. */
export const OVERLAY_CAM = {fov: (2 * Math.atan(960 / 2400) * 180) / Math.PI, position: [540, 960, 2400] as [number, number, number], near: 10, far: 6000};
