import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CrossLayer} from '../../components/FMCCinematicTransition';
import {CamRig, projectPoint} from '../../components/FMCAnatomyOverlay';
import {GuideLine, InfoChip, LeaderLabel, ss, win} from '../../components/FMCMedicalHighlight';
import {FMCArabicTitle} from '../../components/FMCArabicTitle';
import {NORMAL_SPINE, SpineModel, spineLevels} from '../../components/Medical3D/SpineModel';
import type {SpineCtx} from '../../compositions/SpineEarlyDetection';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const SCOL = {...NORMAL_SPINE, scoliosis: 1};

export const Backdrop3D: React.FC = () => <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #31404f 0%, #121820 78%)'}} />;
export const Lights: React.FC<{side: 'lateral' | 'posterior'}> = ({side}) => (
  <>
    <hemisphereLight args={['#dfe9f2', '#40372c', 0.75]} />
    <directionalLight position={side === 'lateral' ? [-80, 50, 40] : [30, 50, -90]} intensity={2.4} color="#fff1dc" />
    <directionalLight position={side === 'lateral' ? [60, -10, 60] : [-40, -10, 60]} intensity={0.9} color="#9cc7e6" />
  </>
);

/** Scene 3 (scoliosis, ~9.8–15 s): real radiograph with a midline reference, then a larger 3D posterior spine that bends sideways. */
export const ScoliosisExplanation: React.FC<{c: SpineCtx}> = ({c}) => {
  const f = useCurrentFrame();
  const {an, x1, sp3d, sec, layout, width, height} = c;
  const end = an.from + an.duration + 4;
  const k = clamp((f - x1) / (sp3d - x1 + 14));
  // radiograph geometry (image px 1760×3350 displayed 1700 px tall)
  const IMG_H = 1700, IMG_W = (1760 / 3350) * IMG_H;
  // ---- 3D ----
  const t3 = clamp((f - sp3d) / (end - sp3d));
  const dist = 262 - 118 * ss(t3);
  const orbit = (f - sp3d) * 0.0016;
  const camPos: [number, number, number] = [Math.sin(orbit) * dist * 0.28, 0, -dist * Math.cos(orbit * 0.5)];
  const look: [number, number, number] = [0, -4 + 9 * ss(t3), 0];
  const scol = ss(clamp((f - sp3d - sec(0.5)) / sec(1.8)));
  const params = {...NORMAL_SPINE, scoliosis: scol};
  const lv = spineLevels(SCOL);
  const mid = lv[12].pos;
  const W = (i: number) => lv[i].pos.clone().sub(mid);
  const cam = {pos: camPos, look, fov: 30};
  const axisTop = projectPoint(W(23).setX(0), cam), axisBot = projectPoint(W(0).setX(0), cam);
  const apex = projectPoint(W(7), cam);
  return (
    <>
      {/* radiograph */}
      <CrossLayer from={x1} dur={sp3d - x1 + 14} fade={14}>
        <Backdrop3D />
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{position: 'relative', width: IMG_W, height: IMG_H, transform: `scale(${1.02 + 0.1 * ss(k)}) translateY(${(0.5 - ss(k)) * 130}px)`, boxShadow: '0 20px 80px rgba(0,0,0,0.55)', borderRadius: 6, overflow: 'hidden'}}>
            <Img src={staticFile('medical/scoliosis_xray_pd_crop.png')} style={{width: '100%', height: '100%', filter: 'contrast(1.08) brightness(0.96)'}} />
            <svg viewBox="0 0 1760 3350" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: win(f, x1 + 16, sp3d + 4, 14, 12)}}>
              {/* midline reference between the top and bottom visible vertebrae (a plain chord; no angle is claimed) */}
              <line x1={860} y1={60} x2={820} y2={3240} stroke="#4FE6DA" strokeWidth={7} strokeDasharray="34 26" strokeLinecap="round" opacity={0.9} />
            </svg>
          </div>
        </AbsoluteFill>
        <InfoChip text="انحناء جانبي" from={x1 + 22} to={sp3d + 6} x={540} y={1330} />
      </CrossLayer>
      {/* 3D */}
      <CrossLayer from={sp3d} dur={end - sp3d} fade={14}>
        <Backdrop3D />
        <ThreeCanvas width={width} height={height} camera={{fov: 30, position: camPos, near: 1, far: 800}} gl={{antialias: true, alpha: true}}>
          <CamRig pos={camPos} look={look} />
          <Lights side="posterior" />
          <SpineModel {...params} highlight="curve" highlightAmount={0.65 * scol} />
        </ThreeCanvas>
        <GuideLine p0={axisTop} p1={axisBot} from={sp3d + sec(0.2)} to={end} dashed draw={26} />
        <LeaderLabel text="انحناء جانبي" at={apex} label={[apex[0] + (scol > 0.1 ? 250 : 230), apex[1] - 70]} from={sp3d + sec(1.2)} to={end} />
        <LeaderLabel text="المحور المرجعي" at={[axisTop[0], axisTop[1] + 150]} label={[axisTop[0] - 250, axisTop[1] + 80]} from={sp3d + sec(0.7)} to={end - 12} />
      </CrossLayer>
      <FMCArabicTitle text="الجنف (انحراف العمود الفقري)" highlight="الجنف" from={x1 + 2} dur={end - x1 - 2} top={layout.safe.top - 20} left={layout.safe.left} right={layout.safe.right} />
    </>
  );
};
