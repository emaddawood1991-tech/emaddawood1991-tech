import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {VideoProps} from '../lib/schema';
import {computeTimeline, totalFrames} from '../lib/timeline';
import {BG_GRADIENT, makeLayout} from '../styles/theme';
import {TYPOGRAPHY} from '../lib/fmcStandards';
import {NarrationAudio} from '../lib/audioPolicy';
import {DIRECTOR_STYLES} from '../lib/directorStyles';
import {loadFonts} from '../styles/fonts';
import {Doctor} from '../components/Doctor/Doctor';
import {evaluate} from '../components/Doctor/engine';
import {phrases} from '../components/Doctor/lowerBackScript';
import {axialAt, buildCarpalCamera, buildCarpalPerformance, handWorld, handYaw, HW, ramp, wristStateAt} from '../components/Doctor/carpalScript';
import {AxialSection, WristHandModel, WRIST_ANCHORS, projectToScreen, sampleCamera} from '../components/Medical3D';
import {AnimatedTitle, ArabicText, InfoCard} from '../components/ArabicTitles';
import {Callout, HUDBackdrop} from '../components/MedicalHUD';
import {LogoBug, LogoReveal} from '../components/FMCBranding';
import {SceneFade} from '../components/SceneTransitions';
import {COLORS} from '../styles/theme';

export const durationForCarpal = (p: VideoProps) => totalFrames(computeTimeline(p.content, p.manifest));

/** Cross-section inset placement (world). */
export const AX = {pos: [0.62, 1.52, 0.24] as [number, number, number], scale: 0.062};
const axWorld = (l: [number, number, number]): [number, number, number] => [AX.pos[0] + l[0] * AX.scale, AX.pos[1] + l[1] * AX.scale, AX.pos[2] + l[2] * AX.scale];

const Rig: React.FC<{frame: number; keys: ReturnType<typeof buildCarpalCamera>}> = ({frame, keys}) => {
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

export const CarpalTunnelEpisode: React.FC<VideoProps> = (props) => {
  loadFonts();
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const layout = makeLayout(width, height);
  const tl = useMemo(() => computeTimeline(props.content, props.manifest), [props.content, props.manifest]);
  const perf = useMemo(() => buildCarpalPerformance(tl, props.content, props.visemes), [tl, props.content, props.visemes]);
  const keys = useMemo(() => buildCarpalCamera(tl, props.content), [tl, props.content]);
  const cam = sampleCamera(keys, frame);
  const pose = evaluate(perf, frame, fps, cam.pos);
  const t = (id: string) => tl.find((x) => x.id === id)!;
  const op = t('opening'), an = t('anatomy'), sy = t('symptoms'), tr = t('treatment'), cl = t('closing');
  const pa = phrases(tl, props.content, 'anatomy'), ps = phrases(tl, props.content, 'symptoms'), pt = phrases(tl, props.content, 'treatment');
  const rig = DIRECTOR_STYLES[props.styleKey ?? 'documentary'].lighting;
  const ws = wristStateAt(frame, tl, props.content);
  const ax = axialAt(frame, tl, props.content);
  const showHand = ws.skin > 0.01 || ws.bones > 0.01;
  const scene = (id: string) => props.content.scenes.find((s) => s.id === id)!;
  const stage = {w: width, h: height};
  const anchorH = (l: [number, number, number]) => projectToScreen(handWorld(l, frame), keys, frame, stage.w, stage.h);
  const anchorA = (l: [number, number, number]) => projectToScreen(axWorld(l), keys, frame, stage.w, stage.h);
  const CS = TYPOGRAPHY.minPx.callout;

  const Title: React.FC<{text: string; size?: number}> = ({text, size = 66}) => (
    <div style={{position: 'absolute', left: layout.safe.left, right: layout.safe.right, top: layout.safe.top - 30}}>
      <AnimatedTitle text={text} size={size} weight={800} display delay={6} />
    </div>
  );
  const Cards: React.FC<{items: {text: string; at: number}[]}> = ({items}) => (
    <div style={{position: 'absolute', left: layout.safe.left, right: layout.safe.right, bottom: TYPOGRAPHY.safe.bottom, display: 'flex', flexDirection: 'column', gap: 14}}>
      {items.map((b) => (frame >= b.at ? <InfoCard key={b.text} text={b.text} size={TYPOGRAPHY.minPx.cardText} delay={b.at - tr.from} /> : null))}
    </div>
  );
  /** Callout that fades out at `until`. */
  const CO: React.FC<{label: string; anchor: [number, number]; y: number; edge: 'left' | 'right'; from: number; base: number; until?: number; accent?: string}> = ({label, anchor, y, edge, from, base, until = 1e9, accent}) => {
    if (frame < from || frame > until + 12) return null;
    const vis = 1 - ramp(frame, until, until + 12);
    return (
      <div style={{position: 'absolute', inset: 0, opacity: vis}}>
        <Callout label={label} anchor={anchor} labelY={layout.height * y} edge={edge} margin={48} delay={from - base} size={CS} screenW={stage.w} accent={accent} />
      </div>
    );
  };

  return (
    <AbsoluteFill style={{background: BG_GRADIENT, overflow: 'hidden'}}>
      <HUDBackdrop />
      <ThreeCanvas width={width} height={height} camera={{fov: 33, position: [0, 1.3, 4.4], near: 0.1, far: 60}} gl={{antialias: true, alpha: true}}>
        <Rig frame={frame} keys={keys} />
        <hemisphereLight args={[rig.hemi.sky, rig.hemi.ground, rig.hemi.intensity]} />
        {rig.lights.map((l, i) => <directionalLight key={i} position={l.position} intensity={l.intensity} color={l.color} />)}
        <FloorShadow x={pose.root.x} z={pose.root.z} />
        <Doctor pose={pose} time={frame / fps} />
        {showHand && (
          <group position={HW.pos} rotation={[0, handYaw(frame), 0]} scale={HW.scale}>
            <WristHandModel {...ws} />
          </group>
        )}
        {ax.opacity > 0.01 && (
          <group position={AX.pos} scale={AX.scale}>
            <AxialSection compression={ax.compression} arrows={ax.arrows} opacity={ax.opacity} time={frame / fps} />
          </group>
        )}
      </ThreeCanvas>

      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 330, background: 'linear-gradient(180deg, rgba(14,36,60,0.62) 0%, rgba(14,36,60,0) 100%)', pointerEvents: 'none'}} />

      {/* ---------- text layers (real Arabic text) ---------- */}
      <Sequence from={0} durationInFrames={op.duration} layout="none">
        <SceneFade duration={op.duration} first><Title text={scene('opening').onScreen.title ?? ''} size={72} /></SceneFade>
      </Sequence>
      <Sequence from={an.from} durationInFrames={an.duration} layout="none">
        <SceneFade duration={an.duration}>
          <Title text={scene('anatomy').onScreen.title ?? ''} />
          <CO base={an.from} label="عظام الرسغ" anchor={anchorH(WRIST_ANCHORS.carpalBones)} y={0.3} edge="left" from={an.from + 78} until={pa[1].s + 40} />
          <CO base={an.from} label="الأوتار القابضة" anchor={anchorH(WRIST_ANCHORS.tendons)} y={0.38} edge="left" from={an.from + 102} until={pa[1].s + 40} />
          <CO base={an.from} label="الرباط الرسغي المستعرض" anchor={anchorH(WRIST_ANCHORS.ligament)} y={0.46} edge="left" from={an.from + 128} until={pa[1].s + 40} />
          <CO base={an.from} label="العصب المتوسط" anchor={anchorH(WRIST_ANCHORS.nerve)} y={0.54} edge="left" from={pa[1].s + 2} until={pa[1].s + 40} accent={COLORS.amber} />
          <CO base={an.from} label="العصب المتوسط" anchor={anchorA([1.35, 0.82, 0.3])} y={0.62} edge="right" from={pa[1].s + 62} accent={COLORS.amber} />
          <CO base={an.from} label="الرباط الرسغي المستعرض" anchor={anchorA([2.0, 1.25, 0.3])} y={0.7} edge="right" from={pa[1].s + 80} />
          <div style={{position: 'absolute', top: layout.safe.top + 118, width: '100%', display: 'flex', justifyContent: 'center', opacity: 0.85}}><ArabicText size={24} weight={500} color={COLORS.silver}>نموذج تعليمي مبسّط — لا يمثّل حالة مريض بعينه</ArabicText></div>
        </SceneFade>
      </Sequence>
      <Sequence from={sy.from} durationInFrames={sy.duration} layout="none">
        <SceneFade duration={sy.duration}>
          <Title text={scene('symptoms').onScreen.title ?? ''} />
          <CO base={sy.from} label="الإبهام" anchor={anchorH(WRIST_ANCHORS.thumbTip)} y={0.3} edge="right" from={ps[0].s + 22} until={ps[1].s - 6} />
          <CO base={sy.from} label="السبابة" anchor={anchorH(WRIST_ANCHORS.indexTip)} y={0.38} edge="right" from={ps[0].s + 52} until={ps[1].s - 6} />
          <CO base={sy.from} label="الوسطى" anchor={anchorH(WRIST_ANCHORS.middleTip)} y={0.46} edge="left" from={ps[0].s + 82} until={ps[1].s - 6} />
          <CO base={sy.from} label="نصف البنصر من جهة الإبهام" anchor={anchorH(WRIST_ANCHORS.ringTip)} y={0.54} edge="left" from={ps[0].s + 108} until={ps[1].s - 6} />
          <div style={{position: 'absolute', top: layout.safe.top + 118, width: '100%', display: 'flex', justifyContent: 'center', opacity: 0.85}}><ArabicText size={24} weight={500} color={COLORS.silver}>نموذج تعليمي مبسّط — لا يمثّل حالة مريض بعينه</ArabicText></div>
        </SceneFade>
      </Sequence>
      <Sequence from={tr.from} durationInFrames={tr.duration} layout="none">
        <SceneFade duration={tr.duration}>
          <Title text={scene('treatment').onScreen.title ?? ''} />
          <CO base={tr.from} label="الرسغ في وضع محايد" anchor={anchorH(WRIST_ANCHORS.wristCentre)} y={0.34} edge="left" from={pt[0].s + 90} until={pt[1].s + 40} />
          <Cards items={(scene('treatment').onScreen.bullets ?? []).map((text, i) => ({text, at: [pt[0].s + 14, pt[1].s + 10, pt[1].s + 46][i] ?? pt[1].s}))} />
        </SceneFade>
      </Sequence>
      <Sequence from={cl.from} durationInFrames={cl.duration + 30} layout="none">
        <AbsoluteFill style={{alignItems: 'center', paddingTop: 215}}>
          <LogoReveal plate={400} delay={6} titleSize={84} sloganSize={44} />
        </AbsoluteFill>
      </Sequence>

      <LogoBug size={150} top={54} right={56} opacity={frame < cl.from ? 1 : Math.max(0, 1 - (frame - cl.from) / 10)} />
      {tl.map((item) => (item.audioFile ? <NarrationAudio key={`a-${item.id}`} file={item.audioFile} from={item.from + item.audioFrom} frames={item.audioFrames} /> : null))}
      {void interpolate}
    </AbsoluteFill>
  );
};
