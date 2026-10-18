import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {VideoProps} from '../lib/schema';
import {computeTimeline, totalFrames} from '../lib/timeline';
import {BG_GRADIENT, makeLayout} from '../styles/theme';
import {NarrationAudio} from '../lib/audioPolicy';
import {loadFonts} from '../styles/fonts';
import {Doctor} from '../components/Doctor/Doctor';
import {evaluate} from '../components/Doctor/engine';
import {buildCamera, buildPerformance, phrases, spineWorld, spineRot, SPINE} from '../components/Doctor/lowerBackScript';
import {LumbarSpine, ANCHORS, projectToScreen, sampleCamera} from '../components/Medical3D';
import {AnimatedTitle, ArabicText, InfoCard} from '../components/ArabicTitles';
import {Callout, EducationalTag, HUDBackdrop} from '../components/MedicalHUD';
import {LogoBug, LogoReveal} from '../components/FMCBranding';
import {SceneFade} from '../components/SceneTransitions';
import {COLORS} from '../styles/theme';

export const durationForDoctor = (p: VideoProps) => totalFrames(computeTimeline(p.content, p.manifest));

const Rig: React.FC<{frame: number; keys: ReturnType<typeof buildCamera>}> = ({frame, keys}) => {
  const {camera} = useThree();
  const c = sampleCamera(keys, frame);
  camera.position.set(...c.pos);
  (camera as THREE.PerspectiveCamera).fov = c.fov ?? 33;
  camera.lookAt(...c.target);
  camera.updateProjectionMatrix();
  return null;
};

const FloorShadow: React.FC<{x: number; z: number}> = ({x, z}) => {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 6, 64, 64, 62);
    gr.addColorStop(0, 'rgba(0,0,0,0.55)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh position={[x, 0.004, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.9, 0.9]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
};

const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const DoctorExplainer: React.FC<VideoProps> = (props) => {
  loadFonts();
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const layout = makeLayout(width, height);
  const tl = useMemo(() => computeTimeline(props.content, props.manifest), [props.content, props.manifest]);
  const perf = useMemo(() => buildPerformance(tl, props.content, props.visemes), [tl, props.content, props.visemes]);
  const keys = useMemo(() => buildCamera(tl, props.content), [tl, props.content]);
  const cam = sampleCamera(keys, frame);
  const pose = evaluate(perf, frame, fps, cam.pos);
  const t = (id: string) => tl.find((x) => x.id === id)!;
  const an = t('anatomy'), sy = t('symptoms'), tr = t('treatment'), fm = t('fmc'), cl = t('closing');
  const total = totalFrames(tl);

  // spine hologram life
  const appear = an.from + 98, vanish = fm.from + 6;
  const sIn = ramp(frame, appear, appear + 26), sOut = 1 - ramp(frame, vanish, vanish + 24);
  const overshoot = 1 + 0.08 * Math.sin(Math.min(1, sIn) * Math.PI);
  const spineScale = SPINE.scale * Math.min(sIn, sOut) * (sIn < 1 ? overshoot : 1);
  const bulge = ramp(frame, sy.from + 175, sy.from + 235);
  const nerve = ramp(frame, sy.from + 290, sy.from + 340);
  const muscles = false; // simplified muscle capsules read poorly next to the character; flexion demo only
  const flex = (f: number) => (f > tr.from + 90 && f < tr.from + 300 ? Math.sin(((f - tr.from - 90) / 70) * Math.PI) * 0.6 * ramp(f, tr.from + 90, tr.from + 108) : 0);

  // 2D overlay helpers
  const stage = {w: width, h: height};
  const scene = (id: string) => props.content.scenes.find((s) => s.id === id)!;
  const anchor = (local: [number, number, number]) => projectToScreen(spineWorld(local, frame), keys, frame, stage.w, stage.h);

  const cardW = layout.width - layout.safe.left - layout.safe.right;
  const Cards: React.FC<{items: string[]; amber?: boolean; delay: number; size: number}> = ({items, amber, delay, size}) => (
    <div style={{position: 'absolute', left: layout.safe.left, right: layout.safe.right, bottom: layout.safe.bottom - 20, display: 'flex', flexDirection: 'column', gap: 10}}>
      {items.map((b, i) => (
        <InfoCard key={b} text={b} size={size} delay={delay + i * 24} accent={amber && i === items.length - 1 ? COLORS.amber : undefined} />
      ))}
    </div>
  );
  const Title: React.FC<{text: string; size?: number}> = ({text, size = 66}) => (
    <div style={{position: 'absolute', left: layout.safe.left, right: layout.safe.right, top: layout.safe.top - 30}}>
      <AnimatedTitle text={text} size={size} weight={800} display delay={6} />
    </div>
  );

  const frameInScene = (it: {from: number}) => frame - it.from;
  void cardW;

  return (
    <AbsoluteFill style={{background: BG_GRADIENT, overflow: 'hidden'}}>
      <HUDBackdrop />
      <ThreeCanvas width={width} height={height} camera={{fov: 33, position: [0, 1.3, 4.4], near: 0.1, far: 60}} gl={{antialias: true, alpha: true}}>
        <Rig frame={frame} keys={keys} />
        <hemisphereLight args={['#d7e8ff', '#15263c', 1.0]} />
        <directionalLight position={[2.5, 3.8, 3.5]} intensity={2.4} color="#fff0de" />
        <directionalLight position={[-3, 2.2, -2.5]} intensity={1.5} color="#4fd1d1" />
        <directionalLight position={[0, 1, 4]} intensity={0.5} color="#ffffff" />
        <FloorShadow x={pose.root.x} z={pose.root.z} />
        <Doctor pose={pose} time={frame / fps} />
        {spineScale > 0.0006 && (
          <group position={SPINE.pos} rotation={[0, spineRot(frame), 0]} scale={spineScale}>
            <group position={[-SPINE.center[0], -SPINE.center[1], -SPINE.center[2]]}>
              <LumbarSpine bulge={bulge} glow={bulge} nerveGlow={nerve} muscleGlow={ramp(frame, tr.from + 60, tr.from + 90)} showMuscles={muscles} flexion={flex(frame)} time={frame / fps} />
            </group>
          </group>
        )}
      </ThreeCanvas>

      {/* soft top scrim so titles stay readable over bright anatomy (not a banner; fades to nothing) */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 330, background: 'linear-gradient(180deg, rgba(14,36,60,0.62) 0%, rgba(14,36,60,0) 100%)', pointerEvents: 'none'}} />
      {/* ---- Arabic text / cards (real text layers) ---- */}
      <Sequence from={0} durationInFrames={t('opening').duration} layout="none">
        <SceneFade duration={t('opening').duration} first>
          <Title text={scene('opening').onScreen.title ?? ''} size={72} />
        </SceneFade>
      </Sequence>
      <Sequence from={an.from} durationInFrames={an.duration} layout="none">
        <SceneFade duration={an.duration}>
          <Title text={scene('anatomy').onScreen.title ?? ''} />
          {(() => {
            const pa = phrases(tl, props.content, 'anatomy');
            const rel = (f: number) => f - an.from;
            return (
              <>
                {frame > pa[0].e - 14 && <Callout label="الفقرات القطنية" anchor={anchor(ANCHORS.vertebraL3)} labelY={layout.height * 0.3} edge="right" margin={48} delay={rel(pa[0].e - 14)} size={34} screenW={stage.w} />}
                {frame > pa[1].s + 14 && <Callout label="القرص الغضروفي" anchor={anchor(ANCHORS.discL2L3)} labelY={layout.height * 0.4} edge="right" margin={48} delay={rel(pa[1].s + 14)} size={34} screenW={stage.w} />}
                {frame > pa[2].s + 30 && <Callout label="الأعصاب" anchor={anchor(ANCHORS.nerveRoot)} labelY={layout.height * 0.5} edge="right" margin={48} delay={rel(pa[2].s + 30)} size={34} screenW={stage.w} />}
              </>
            );
          })()}
          <div style={{position: 'absolute', top: layout.safe.top + 118, width: '100%', display: 'flex', justifyContent: 'center', opacity: 0.85}}><ArabicText size={24} weight={500} color={COLORS.silver}>نموذج تعليمي مبسّط — لا يمثّل حالة مريض بعينه</ArabicText></div>
        </SceneFade>
      </Sequence>
      <Sequence from={sy.from} durationInFrames={sy.duration} layout="none">
        <SceneFade duration={sy.duration}>
          <Title text={scene('symptoms').onScreen.title ?? ''} />
          <Cards items={scene('symptoms').onScreen.bullets ?? []} delay={40} size={31} />
        </SceneFade>
      </Sequence>
      <Sequence from={tr.from} durationInFrames={tr.duration} layout="none">
        <SceneFade duration={tr.duration}>
          <Title text={scene('treatment').onScreen.title ?? ''} />
          <Cards items={scene('treatment').onScreen.bullets ?? []} delay={50} size={36} />
        </SceneFade>
      </Sequence>
      <Sequence from={fm.from} durationInFrames={fm.duration} layout="none">
        <SceneFade duration={fm.duration}>
          <Title text={scene('fmc').onScreen.title ?? ''} size={64} />
          <Cards items={scene('fmc').onScreen.bullets ?? []} delay={36} size={34} amber />
        </SceneFade>
      </Sequence>
      <Sequence from={cl.from} durationInFrames={cl.duration + 30} layout="none">
        <AbsoluteFill style={{alignItems: 'center', paddingTop: 215}}>
          <LogoReveal plate={400} delay={6} titleSize={84} sloganSize={44} />
        </AbsoluteFill>
      </Sequence>

      <LogoBug size={150} top={54} right={56} opacity={frame < cl.from ? 1 : Math.max(0, 1 - (frame - cl.from) / 10)} />
      {tl.map((item) =>
        item.audioFile ? <NarrationAudio key={`a-${item.id}`} file={item.audioFile} from={item.from + item.audioFrom} frames={item.audioFrames} /> : null,
      )}
      {frameInScene(an) < -1 ? null : null}
    </AbsoluteFill>
  );
};
