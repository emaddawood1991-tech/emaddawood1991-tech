import React, {useMemo} from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import type {VideoProps} from '../lib/schema';
import {computeTimeline, totalFrames} from '../lib/timeline';
import {makeLayout, COLORS} from '../styles/theme';
import {TYPOGRAPHY} from '../lib/fmcStandards';
import {NarrationAudio} from '../lib/audioPolicy';
import {loadFonts} from '../styles/fonts';
import {AnimatedTitle, ArabicText} from '../components/ArabicTitles';
import {LogoBug, LogoReveal} from '../components/FMCBranding';
import {SpineModel, NORMAL_SPINE} from '../components/Medical3D/SpineModel';

export const durationForSpine = (p: VideoProps) => totalFrames(computeTimeline(p.content, p.manifest));

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (t: number) => t * t * (3 - 2 * t);
const ramp = (f: number, a: number, b: number) => ss(clamp((f - a) / (b - a)));

/** Fades a layer in/out over `fade` frames around [from, from+dur). */
const Layer: React.FC<{from: number; dur: number; fade?: number; children: React.ReactNode}> = ({from, dur, fade = 12, children}) => {
  const f = useCurrentFrame();
  const o = Math.min(ramp(f, from, from + fade), 1 - ramp(f, from + dur - fade, from + dur));
  if (f < from - 1 || f > from + dur + 1) return null;
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

/** Footage with a slow, constant camera move (push-in / pull-out). The clip's own audio is removed at source (-an) and muted here. */
const Clip: React.FC<{file: string; from: number; dur: number; s0: number; s1: number; x0?: number; x1?: number; y0?: number; y1?: number; startFrom?: number}> = ({file, from, dur, s0, s1, x0 = 0, x1 = 0, y0 = 0, y1 = 0, startFrom = 0}) => {
  const f = useCurrentFrame();
  const t = clamp((f - from) / dur);
  const e = ss(t);
  const s = s0 + (s1 - s0) * e, x = x0 + (x1 - x0) * e, y = y0 + (y1 - y0) * e;
  return (
    <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) scale(${s})`, transformOrigin: '50% 45%'}}>
      <OffthreadVideo src={staticFile(file)} muted startFrom={startFrom} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
  );
};

const Scene3DBackdrop: React.FC = () => <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 38%, #2f3a47 0%, #141a21 78%)'}} />;

const Lights: React.FC<{side: 'lateral' | 'posterior'}> = ({side}) => (
  <>
    <hemisphereLight args={['#dfe9f2', '#40372c', 0.75]} />
    <directionalLight position={side === 'lateral' ? [-80, 50, 40] : [30, 50, -90]} intensity={2.4} color="#fff1dc" />
    <directionalLight position={side === 'lateral' ? [60, -10, 60] : [-40, -10, 60]} intensity={0.9} color="#9cc7e6" />
  </>
);

const Cam: React.FC<{pos: [number, number, number]; fov?: number}> = ({pos, fov = 30}) => {
  const {camera} = useThree();
  camera.position.set(...pos);
  (camera as THREE.PerspectiveCamera).fov = fov;
  camera.lookAt(0, -4, 0);
  camera.updateProjectionMatrix();
  return null;
};

export const SpineRealisticEpisode: React.FC<VideoProps> = (props) => {
  loadFonts();
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const layout = makeLayout(width, height);
  const tl = useMemo(() => computeTimeline(props.content, props.manifest), [props.content, props.manifest]);
  const t = (id: string) => tl.find((x) => x.id === id)!;
  const op = t('opening'), an = t('anatomy'), sy = t('symptoms'), tr = t('treatment'), fm = t('fmc'), cl = t('closing');
  const sc = (id: string) => props.content.scenes.find((s) => s.id === id)!;
  const sec = (s: number) => Math.round(s * 30);

  // ---- beat map (global frames) ----
  const x1 = an.from + sec(4.1); // X-ray appears
  const sp3d = an.from + sec(7.1); // 3D curved spine appears
  const trXray = tr.from + sec(3.5); // clinician reviewing a radiograph

  const Title: React.FC<{text: string; size?: number}> = ({text, size = 64}) => (
    <div style={{position: 'absolute', left: layout.safe.left, right: layout.safe.right, top: layout.safe.top - 30}}>
      <AnimatedTitle text={text} size={size} weight={800} display delay={6} />
    </div>
  );
  const Note: React.FC<{text: string; from: number; until: number}> = ({text, from, until}) => {
    const o = Math.min(ramp(frame, from, from + 10), 1 - ramp(frame, until - 10, until));
    return o <= 0 ? null : (
      <div style={{position: 'absolute', left: 0, right: 0, bottom: TYPOGRAPHY.safe.bottom - 130, display: 'flex', justifyContent: 'center', opacity: o * 0.9}}>
        <ArabicText size={28} weight={500} color={COLORS.silver}>{text}</ArabicText>
      </div>
    );
  };
  const Tag: React.FC<{text: string; x: number; y: number; from: number; accent?: boolean}> = ({text, x, y, from, accent}) => {
    const o = ramp(frame, from, from + 14);
    return (
      <div style={{position: 'absolute', left: x, top: y, transform: 'translateX(-50%)', opacity: o}}>
        <div style={{padding: '10px 26px', borderRadius: 16, background: 'rgba(10,18,28,0.72)', border: `2px solid ${accent ? COLORS.amber : 'rgba(255,255,255,0.35)'}`, backdropFilter: 'blur(6px)'}}>
          <ArabicText size={TYPOGRAPHY.minPx.callout + 6} weight={700} color={accent ? COLORS.amber : COLORS.white}>{text}</ArabicText>
        </div>
      </div>
    );
  };

  // 3D animation params
  const scol = ramp(frame, sp3d + sec(0.5), sp3d + sec(2.2));
  const orbit = (frame - an.from) * 0.0012;
  const kyph = 38 + 30 * ramp(frame, sy.from + sec(2.7), sy.from + sec(5.2));
  const kyHl = ramp(frame, sy.from + sec(3.2), sy.from + sec(5.2));

  return (
    <AbsoluteFill style={{background: '#10161d', overflow: 'hidden'}}>
      {/* ============ SCENE 1 — opening ============ */}
      <Layer from={0} dur={op.duration + 6} fade={10}><Clip file="footage/spine-realistic/s1_back_view.mp4" from={0} dur={op.duration + 6} s0={1.0} s1={1.13} y0={0} y1={-30} /></Layer>

      {/* ============ SCENE 2 — scoliosis ============ */}
      <Layer from={an.from} dur={x1 - an.from + 14} fade={14}><Clip file="footage/spine-realistic/s2_exam_hand.mp4" from={an.from} dur={x1 - an.from + 14} s0={1.04} s1={1.12} /></Layer>
      <Layer from={x1} dur={sp3d - x1 + 14} fade={14}>
        <Scene3DBackdrop />
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          {(() => {
            const k = clamp((frame - x1) / (sp3d - x1 + 14));
            const sc2 = 1.02 + 0.1 * ss(k);
            return <Img src={staticFile('medical/scoliosis_xray_pd_crop.png')} style={{height: 1700, transform: `scale(${sc2}) translateY(${(0.5 - ss(k)) * 130}px)`, filter: 'contrast(1.08) brightness(0.96)', borderRadius: 6, boxShadow: '0 20px 80px rgba(0,0,0,0.55)'}} />;
          })()}
        </AbsoluteFill>
      </Layer>
      <Layer from={sp3d} dur={an.from + an.duration - sp3d + 4} fade={14}>
        <Scene3DBackdrop />
        <ThreeCanvas width={width} height={height} camera={{fov: 30, position: [0, 0, -135], near: 1, far: 800}} gl={{antialias: true, alpha: true}}>
          <Cam pos={[Math.sin(orbit) * 205 * 0.3, 0, -205 * Math.cos(orbit * 0.5)]} />
          <Lights side="posterior" />
          <SpineModel {...NORMAL_SPINE} scoliosis={scol} highlight="curve" highlightAmount={ramp(frame, sp3d + sec(1.3), sp3d + sec(2.6)) * 0.7} />
        </ThreeCanvas>
      </Layer>

      {/* ============ SCENE 3 — kyphosis (3D lateral comparison) ============ */}
      <Layer from={sy.from} dur={sy.duration + 6} fade={14}>
        <Scene3DBackdrop />
        <ThreeCanvas width={width} height={height} camera={{fov: 30, position: [-150, 0, 0], near: 1, far: 800}} gl={{antialias: true, alpha: true}}>
          <Cam pos={[-205 + (frame - sy.from) * -0.03, 0, 0]} />
          <Lights side="lateral" />
          <group position={[0, 0, -11]}><SpineModel {...NORMAL_SPINE} /></group>
          <group position={[0, 0, 11]}><SpineModel {...NORMAL_SPINE} kyphosis={kyph} highlight="thoracic" highlightAmount={kyHl} /></group>
        </ThreeCanvas>
        <Tag text="طبيعي" x={width * 0.27} y={height * 0.60} from={sy.from + sec(1.4)} />
        <Tag text="زيادة التحدب" x={width * 0.73} y={height * 0.60} from={sy.from + sec(4.0)} accent />
      </Layer>

      {/* ============ SCENE 4 — clinical evaluation ============ */}
      <Layer from={tr.from} dur={trXray - tr.from + 14} fade={14}><Clip file="footage/spine-realistic/s4_consult.mp4" from={tr.from} dur={trXray - tr.from + 14} s0={1.0} s1={1.1} /></Layer>
      <Layer from={trXray} dur={tr.from + tr.duration - trXray + 10} fade={14}><Clip file="footage/spine-realistic/s4_xray_review.mp4" from={trXray} dur={tr.from + tr.duration - trXray + 10} s0={1.0} s1={1.08} /></Layer>

      {/* ============ SCENE 5 — early detection ============ */}
      <Layer from={fm.from} dur={fm.duration + 6} fade={14}><Clip file="footage/spine-realistic/s5_consult.mp4" from={fm.from} dur={fm.duration + 6} s0={1.12} s1={1.02} /></Layer>

      {/* ============ SCENE 6 — branded ending ============ */}
      <Layer from={cl.from} dur={cl.duration + 30} fade={16}>
        <Clip file="footage/spine-realistic/s6_bg.mp4" from={cl.from} dur={cl.duration + 30} s0={1.02} s1={1.06} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(246,250,252,0.72) 0%, rgba(228,240,246,0.78) 100%)'}} />
      </Layer>

      {/* ---------- legibility scrim (top) ---------- */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 360, background: 'linear-gradient(180deg, rgba(8,18,30,0.66) 0%, rgba(8,18,30,0) 100%)', pointerEvents: 'none', opacity: frame >= cl.from + 12 ? 0 : 1}} />

      {/* ---------- text layers (real Arabic text) ---------- */}
      <Sequence from={0} durationInFrames={op.duration} layout="none"><Title text={sc('opening').onScreen.title ?? ''} /></Sequence>
      <Sequence from={an.from} durationInFrames={an.duration} layout="none"><Title text={sc('anatomy').onScreen.title ?? ''} /></Sequence>
      <Sequence from={sy.from} durationInFrames={sy.duration} layout="none"><Title text={sc('symptoms').onScreen.title ?? ''} /></Sequence>
      <Sequence from={tr.from} durationInFrames={tr.duration} layout="none"><Title text={sc('treatment').onScreen.title ?? ''} /></Sequence>
      <Sequence from={fm.from} durationInFrames={fm.duration} layout="none"><Title text={sc('fmc').onScreen.title ?? ''} size={58} /></Sequence>
      <Note text="صورة شعاعية توضيحية — لا تمثّل حالة مريض بعينه" from={x1 + 8} until={sp3d + 4} />
      <Note text="تمثيل توضيحي مبسّط — لا يمثّل حالة مريض بعينه" from={sp3d + 10} until={an.from + an.duration} />
      <Note text="تمثيل توضيحي مبسّط — لا يمثّل حالة مريض بعينه" from={sy.from + 10} until={sy.from + sy.duration} />
      <Sequence from={cl.from} durationInFrames={cl.duration + 30} layout="none">
        <AbsoluteFill style={{alignItems: 'center', paddingTop: 215}}>
          <LogoReveal plate={400} delay={6} titleSize={84} sloganSize={44} />
        </AbsoluteFill>
      </Sequence>

      <LogoBug size={150} top={54} right={56} opacity={frame < cl.from ? 1 : Math.max(0, 1 - (frame - cl.from) / 10)} />
      {tl.map((item) => (item.audioFile ? <NarrationAudio key={`a-${item.id}`} file={item.audioFile} from={item.from + item.audioFrom} frames={item.audioFrames} /> : null))}
      {void interpolate}
      {void THREE}
    </AbsoluteFill>
  );
};
