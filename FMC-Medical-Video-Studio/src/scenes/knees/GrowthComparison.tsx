import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {CrossLayer} from '../../components/FMCCinematicTransition';
import {CamRig, projectPoint} from '../../components/FMCAnatomyOverlay';
import {GuideLine, ss, win} from '../../components/FMCMedicalHighlight';
import {FMCArabicTitle} from '../../components/FMCArabicTitle';
import {ALIGN, LowerLimbModel} from '../../components/Medical3D/LowerLimbModel';
import {FONT_AR} from '../../styles/theme';
import {Backdrop, LimbLights} from './AlignmentScenes';
import type {KneeCtx} from '../../compositions/KneeAlignmentEpisode';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const STATES = [
  {al: ALIGN.bow, label: ['الطفولة', 'المبكرة'], x: -24},
  {al: ALIGN.knock, label: ['بعد ذلك', 'بسنوات'], x: 0},
  {al: ALIGN.typical, label: ['نحو الاستقامة', 'المعتادة'], x: 24},
];

/** Scene 4: three simplified, rigid-bone alignment states for different ages, lit in turn (a general tendency, never a fixed schedule). */
export const GrowthComparison: React.FC<{c: KneeCtx}> = ({c}) => {
  const f = useCurrentFrame();
  const {tr, sec, layout, width, height} = c;
  const end = tr.from + tr.duration + 4;
  const dist = 296 - 12 * ss(clamp((f - tr.from) / sec(6)));
  const cy = -35;
  const camPos: [number, number, number] = [0, cy, dist];
  const look: [number, number, number] = [0, cy, 0];
  const cam = {pos: camPos, look, fov: 30};
  const span = (end - tr.from - sec(1.2)) / 3;
  const act = (i: number) => win(f, tr.from + sec(0.8) + i * span, tr.from + sec(0.8) + (i + 1) * span + (i === 2 ? 40 : 6), 14, 10);
  const px = STATES.map((s) => projectPoint(new THREE.Vector3(s.x, -50, 0), cam));
  return (
    <>
      <CrossLayer from={tr.from} dur={end - tr.from} fade={14}>
        <Backdrop />
        <ThreeCanvas width={width} height={height} camera={{fov: 30, position: camPos, near: 1, far: 800}} gl={{antialias: true, alpha: true}}>
          <CamRig pos={camPos} look={look} />
          <LimbLights />
          {STATES.map((s, i) => (
            <group key={i} position={[s.x, 0, 0]}><LowerLimbModel align={s.al} pelvis={false} soft={0.7} highlight={0.45 * act(i)} /></group>
          ))}
        </ThreeCanvas>
        {/* progression line + labels */}
        <GuideLine p0={[px[2][0], 1222]} p1={[px[0][0], 1222]} from={tr.from + sec(0.5)} to={end} draw={sec(2)} width={3} />
        {STATES.map((s, i) => {
          const a = act(i);
          return (
            <div key={i} style={{position: 'absolute', left: px[i][0], top: 1262, transform: 'translateX(-50%)', opacity: 0.45 + 0.55 * a, textAlign: 'center'}}>
              <div style={{width: 14, height: 14, borderRadius: 7, background: a > 0.5 ? '#4FE6DA' : 'rgba(255,255,255,0.45)', margin: '-44px auto 16px', boxShadow: a > 0.5 ? '0 0 0 6px rgba(79,230,218,0.25)' : 'none'}} />
              <div dir="rtl" style={{fontFamily: FONT_AR, fontSize: 38, fontWeight: 700, color: '#fff', lineHeight: 1.25}}>{s.label[0]}<br />{s.label[1]}</div>
            </div>
          );
        })}
        <div dir="rtl" style={{position: 'absolute', left: layout.safe.left, right: layout.safe.right, top: 392, textAlign: 'center', fontFamily: FONT_AR, fontSize: 40, fontWeight: 500, color: '#E8EEF3', opacity: win(f, tr.from + sec(1.4), end, 18, 12)}}>تختلف استقامة الساقين بحسب العمر.</div>
      </CrossLayer>
      <FMCArabicTitle text="تغيرات طبيعية خلال النمو" highlight="طبيعية" from={tr.from + 4} dur={end - tr.from - 4} top={layout.safe.top - 40} left={layout.safe.left} right={layout.safe.right} />
      {void AbsoluteFill}
    </>
  );
};
