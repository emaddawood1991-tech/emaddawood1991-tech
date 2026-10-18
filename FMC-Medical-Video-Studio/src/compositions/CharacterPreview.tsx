import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {BG_GRADIENT} from '../styles/theme';
import {NarrationAudio} from '../lib/audioPolicy';
import {loadFonts} from '../styles/fonts';
import {HUDBackdrop} from '../components/MedicalHUD';
import {Doctor} from '../components/Doctor/Doctor';
import {A, evaluate, type Clip, type Perf} from '../components/Doctor/engine';
import {HAND} from '../components/Doctor/skeleton';
import {sampleCamera, type CamKey} from '../components/Medical3D';
import {ArabicText} from '../components/ArabicTitles';
import {LogoBug} from '../components/FMCBranding';
import {armIK} from '../components/Doctor/skeleton';
import * as T from 'three';

const ss = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
const KEYS: CamKey[] = [
  {f: 0, pos: [0, 1.15, 4.6], target: [0, 0.95, 0], fov: 34},
  {f: 200, pos: [0, 1.15, 4.6], target: [0, 0.95, 0], fov: 34},
  {f: 250, pos: [0.0, 1.5, 2.2], target: [0, 1.5, 0], fov: 32},
  {f: 285, pos: [0.0, 1.35, 3.1], target: [0, 1.3, 0], fov: 34},
  {f: 340, pos: [0.0, 1.35, 3.1], target: [0, 1.3, 0], fov: 34},
];

export type PreviewProps = {visemes: {o: number[]; w: number[]} | null};

/** 11-second character reel: front → 360° turn → hand shapes → expressions → close-up lip-sync → wave. */
export const CharacterPreview: React.FC<PreviewProps> = ({visemes}) => {
  loadFonts();
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const perf: Perf = useMemo(() => {
    const clips: Clip[] = [];
    clips.push(A.lookAtCamera(0, 330));
    clips.push({name: 'turntable', start: 50, end: 200, inF: 1, outF: 1, body: (t) => ({root: {yaw: Math.PI * 2 * ss(t / 138)}})});
    // hand shapes on the left hand (open → point → fist) while he turns back to the camera
    const shape = (name: string, s: number, e: number, h: typeof HAND.open): Clip => ({name, start: s, end: e, inF: 10, outF: 10, arms: {L: () => armIK('L', new T.Vector3(0.27, 0.12, 0.28), new T.Vector3(0.35, -0.5, -0.6), [-0.3, -1.0, 0.2], h)}});
    clips.push(shape('open', 196, 224, HAND.open), shape('point', 224, 252, HAND.point), shape('fist', 252, 280, HAND.fist));
    clips.push(A.react(196, 250, 'happy'), A.react(250, 290, 'concerned'));
    clips.push(A.wave(290, 340, 'R'));
    return {
      clips, walk: null, restX: 0, restZ: 0, feetFollowYaw: true,
      visemes: (f: number) => { const k = f - 18; return visemes && k >= 0 && k < visemes.o.length ? {o: visemes.o[k], w: visemes.w[k]} : {o: 0, w: 1}; },
    };
  }, [visemes]);
  const cam = sampleCamera(KEYS, frame);
  const pose = evaluate(perf, frame, fps, cam.pos);
  const Rig: React.FC = () => {
    const {camera} = useThree();
    camera.position.set(...cam.pos);
    (camera as THREE.PerspectiveCamera).fov = cam.fov ?? 34;
    camera.lookAt(...cam.target);
    camera.updateProjectionMatrix();
    return null;
  };
  return (
    <AbsoluteFill style={{background: BG_GRADIENT}}>
      <HUDBackdrop />
      <ThreeCanvas width={width} height={height} camera={{fov: 34, position: [0, 1.2, 4.6], near: 0.1, far: 60}} gl={{antialias: true, alpha: true}}>
        <Rig />
        <hemisphereLight args={['#d7e8ff', '#15263c', 1.0]} />
        <directionalLight position={[2.5, 3.8, 3.5]} intensity={2.4} color="#fff0de" />
        <directionalLight position={[-3, 2.2, -2.5]} intensity={1.5} color="#4fd1d1" />
        <directionalLight position={[0, 1, 4]} intensity={0.5} color="#ffffff" />
        <Doctor pose={pose} time={frame / fps} />
      </ThreeCanvas>
      <LogoBug size={150} top={54} right={56} opacity={1} />
      <div style={{position: 'absolute', top: 230, width: '100%'}}><ArabicText size={62} weight={800} display>مقدم تعليمي افتراضي</ArabicText></div>
      {visemes && <NarrationAudio file="audio/lower-back-pain/anatomy.wav" from={18} frames={340} />}
    </AbsoluteFill>
  );
};
