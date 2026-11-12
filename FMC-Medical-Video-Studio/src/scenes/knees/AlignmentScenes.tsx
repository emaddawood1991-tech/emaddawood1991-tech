import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {CrossLayer} from '../../components/FMCCinematicTransition';
import {CamRig, projectPoint} from '../../components/FMCAnatomyOverlay';
import {GuideLine, LeaderLabel, RingMarker, ss, win} from '../../components/FMCMedicalHighlight';
import {FMCArabicTitle} from '../../components/FMCArabicTitle';
import {ALIGN, LowerLimbModel, legPoints, lerpAlign} from '../../components/Medical3D/LowerLimbModel';
import {FONT_AR} from '../../styles/theme';
import type {KneeCtx} from '../../compositions/KneeAlignmentEpisode';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const Backdrop: React.FC = () => <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, #33414f 0%, #121820 78%)'}} />;
export const LimbLights: React.FC = () => (
  <>
    <hemisphereLight args={['#e3ecf3', '#40372c', 0.8]} />
    <directionalLight position={[40, 40, 90]} intensity={2.3} color="#fff1dc" />
    <directionalLight position={[-60, -10, 60]} intensity={0.9} color="#9cc7e6" />
  </>
);

const LatinTag: React.FC<{text: string; from: number; to: number; top: number}> = ({text, from, to, top}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 16, 14);
  if (o <= 0.001) return null;
  return <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', opacity: o * 0.95}}><span style={{fontFamily: FONT_AR, fontSize: 36, fontWeight: 600, letterSpacing: 5, color: '#7DF3EA', textTransform: 'uppercase'}}>{text}</span></div>;
};

/** Scenes 2 + 3 share ONE continuous 3D stage so the viewer sees the same limbs swing from "knees together / ankles apart" to "knees apart / ankles together". */
export const KneeAndBowScenes: React.FC<{c: KneeCtx}> = ({c}) => {
  const f = useCurrentFrame();
  const {an, sy, sec, layout, width, height} = c;
  const from = an.from, end = sy.from + sy.duration + 4;
  const swing = ss(clamp((f - (sy.from - sec(0.1))) / sec(1.6)));
  const al = lerpAlign(ALIGN.knock, ALIGN.bow, swing);
  const t = clamp((f - from) / (end - from));
  const dist = 150 - 28 * ss(clamp((f - from) / sec(5)));
  const cy = -37;
  const camPos: [number, number, number] = [Math.sin(t * Math.PI * 2) * 3, cy, dist];
  const look: [number, number, number] = [0, cy, 0];
  const cam = {pos: camPos, look, fov: 30};
  const L = legPoints(al, -1), R = legPoints(al, 1);
  const P = (v: THREE.Vector3) => projectPoint(v, cam);
  const kL = P(L.knee), kR = P(R.knee), aL = P(L.ankle), aR = P(R.ankle);
  const mid = P(new THREE.Vector3(0, -30, 0));
  const isKnock = f < sy.from - sec(0.2);
  const s2 = {a: an.from + sec(1.6), b: sy.from - sec(0.3)};
  const s3 = {a: sy.from + sec(1.9), b: end - 6};
  const bracket = (p: [number, number], q: [number, number], from_: number, to_: number) => <GuideLine p0={p} p1={q} from={from_} to={to_} draw={18} width={4} />;
  return (
    <>
      <CrossLayer from={from} dur={end - from} fade={14}>
        <Backdrop />
        <ThreeCanvas width={width} height={height} camera={{fov: 30, position: camPos, near: 1, far: 800}} gl={{antialias: true, alpha: true}}>
          <CamRig pos={camPos} look={look} />
          <LimbLights />
          <LowerLimbModel align={al} highlight={0.35 * win(f, an.from + sec(2.2), end, 20, 10)} />
        </ThreeCanvas>
        {/* midline reference */}
        <GuideLine p0={[mid[0], 380]} p1={[mid[0], 1390]} from={from + sec(0.8)} to={end} dashed draw={30} width={2.5} />
        {/* scene 2: knees close, ankles apart */}
        <RingMarker x={kL[0]} y={kL[1]} r={26} from={s2.a} to={s2.b} />
        <RingMarker x={kR[0]} y={kR[1]} r={26} from={s2.a} to={s2.b} />
        <RingMarker x={aL[0]} y={aL[1]} r={26} from={s2.a + 14} to={s2.b} />
        <RingMarker x={aR[0]} y={aR[1]} r={26} from={s2.a + 14} to={s2.b} />
        {bracket([aL[0], aL[1] + 80], [aR[0], aR[1] + 80], s2.a + 24, s2.b)}
        <LeaderLabel text="الركبتان متقاربتان" at={kL} label={[230, kL[1] - 150]} from={s2.a} to={s2.b} size={40} />
        <LeaderLabel text="الكاحلان متباعدان" at={[aR[0], aR[1] + 80]} label={[860, aR[1] - 30]} from={s2.a + 24} to={s2.b} size={40} />
        {/* scene 3: knees apart, ankles close */}
        <RingMarker x={kL[0]} y={kL[1]} r={26} from={s3.a} to={s3.b} color="#4FE6DA" />
        <RingMarker x={kR[0]} y={kR[1]} r={26} from={s3.a} to={s3.b} />
        <RingMarker x={aL[0]} y={aL[1]} r={26} from={s3.a + 14} to={s3.b} />
        <RingMarker x={aR[0]} y={aR[1]} r={26} from={s3.a + 14} to={s3.b} />
        {bracket([kL[0], kL[1] - 70], [kR[0], kR[1] - 70], s3.a, s3.b)}
        <LeaderLabel text="الركبتان متباعدتان" at={[kL[0], kL[1] - 70]} label={[250, kL[1] - 190]} from={s3.a} to={s3.b} size={40} />
        <LeaderLabel text="الكاحلان متقاربان" at={aR} label={[860, aR[1] - 30]} from={s3.a + 24} to={s3.b} size={40} />
      </CrossLayer>
      <FMCArabicTitle text="تقارب الركبتين" highlight="تقارب" from={an.from + 4} dur={sy.from - an.from + 2} top={layout.safe.top - 40} left={layout.safe.left} right={layout.safe.right} />
      <LatinTag text="Knock Knees" from={an.from + 16} to={sy.from + 2} top={layout.safe.top + 96} />
      <FMCArabicTitle text="تقوس الساقين" highlight="تقوس" from={sy.from + 6} dur={end - sy.from - 6} top={layout.safe.top - 40} left={layout.safe.left} right={layout.safe.right} />
      <LatinTag text="Bow Legs" from={sy.from + 18} to={end} top={layout.safe.top + 96} />
      {void isKnock}
    </>
  );
};
