import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {CrossLayer} from '../../components/FMCCinematicTransition';
import {CamRig, projectPoint} from '../../components/FMCAnatomyOverlay';
import {GuideLine, LeaderLabel, RingMarker, ss} from '../../components/FMCMedicalHighlight';
import {FMCArabicTitle} from '../../components/FMCArabicTitle';
import {NORMAL_SPINE, SpineModel, spineLevels} from '../../components/Medical3D/SpineModel';
import {Backdrop3D, Lights} from './ScoliosisExplanation';
import {useCurrentFrame} from 'remotion';
import type {SpineCtx} from '../../compositions/SpineEarlyDetection';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Scene 4 (kyphosis, ~14.7–22.7 s): lateral comparison. Left = normal curvature; right = increased thoracic kyphosis (grows progressively). */
export const KyphosisComparison: React.FC<{c: SpineCtx}> = ({c}) => {
  const f = useCurrentFrame();
  const {sy, sec, layout, width, height} = c;
  const end = sy.from + sy.duration + 6;
  const t = f - sy.from;
  const dist = 250 - 80 * ss(clamp((t - sec(0.5)) / sec(6)));
  const camPos: [number, number, number] = [-dist, 0, -2 + t * -0.004];
  const look: [number, number, number] = [0, -4 + 8 * ss(clamp((t - sec(0.5)) / sec(6))), 0];
  const kyph = 38 + 30 * ss(clamp((t - sec(2.9)) / sec(2.6)));
  const hl = ss(clamp((t - sec(3.3)) / sec(2.2)));
  const cam = {pos: camPos, look, fov: 30};
  const Z = 11;
  const lvN = spineLevels(NORMAL_SPINE), lvK = spineLevels({...NORMAL_SPINE, kyphosis: kyph});
  const wN = (i: number) => lvN[i].pos.clone().sub(lvN[12].pos).setZ(lvN[i].pos.z - lvN[12].pos.z - Z);
  const wK = (i: number) => lvK[i].pos.clone().sub(lvK[12].pos).setZ(lvK[i].pos.z - lvK[12].pos.z + Z);
  const base = (w: (i: number) => any) => projectPoint(w(0), cam);
  const apexN = projectPoint(wN(10), cam), apexK = projectPoint(wK(10), cam);
  const plumbN = base(wN), plumbK = base(wK);
  const topY = 400, botY = 1390;
  return (
    <>
      <CrossLayer from={sy.from} dur={end - sy.from} fade={14}>
        <Backdrop3D />
        <ThreeCanvas width={width} height={height} camera={{fov: 30, position: camPos, near: 1, far: 800}} gl={{antialias: true, alpha: true}}>
          <CamRig pos={camPos} look={look} />
          <Lights side="lateral" />
          <group position={[0, 0, -Z]}><SpineModel {...NORMAL_SPINE} /></group>
          <group position={[0, 0, Z]}><SpineModel {...NORMAL_SPINE} kyphosis={kyph} highlight="thoracic" highlightAmount={hl * 0.85} /></group>
        </ThreeCanvas>
        {/* plumb references through the lumbosacral base + apex markers (relative comparison only; no numbers) */}
        <GuideLine p0={[plumbN[0], topY]} p1={[plumbN[0], botY]} from={sy.from + sec(1.0)} to={end} dashed draw={26} width={2.5} />
        <GuideLine p0={[plumbK[0], topY]} p1={[plumbK[0], botY]} from={sy.from + sec(1.2)} to={end} dashed draw={26} width={2.5} />
        <GuideLine p0={[plumbN[0], apexN[1]]} p1={apexN} from={sy.from + sec(1.8)} to={end} draw={14} />
        <GuideLine p0={[plumbK[0], apexK[1]]} p1={apexK} from={sy.from + sec(3.4)} to={end} draw={14} />
        <RingMarker x={apexN[0]} y={apexN[1]} r={20} from={sy.from + sec(1.9)} to={end} />
        <RingMarker x={apexK[0]} y={apexK[1]} r={20} from={sy.from + sec(3.5)} to={end} color="#F2A33A" />
        <LeaderLabel text="الانحناء الطبيعي" at={[plumbN[0], 1335]} label={[width * 0.27, 1318]} from={sy.from + sec(1.0)} to={end} size={40} />
        <LeaderLabel text="زيادة التحدب الظهري" at={[plumbK[0], 1335]} label={[width * 0.73, 1318]} from={sy.from + sec(3.0)} to={end} accent="#F2A33A" size={40} />
      </CrossLayer>
      <FMCArabicTitle text="زيادة التحدب الظهري (الحدبة)" highlight="التحدب" from={sy.from + 4} dur={end - sy.from - 4} top={layout.safe.top - 20} left={layout.safe.left} right={layout.safe.right} />
    </>
  );
};
