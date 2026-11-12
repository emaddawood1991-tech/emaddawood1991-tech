import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {CameraBox, CrossLayer, Footage} from '../../components/FMCCinematicTransition';
import {CamRig, projectPoint} from '../../components/FMCAnatomyOverlay';
import {InfoChip, LeaderLabel, ss, win} from '../../components/FMCMedicalHighlight';
import {FMCArabicTitle} from '../../components/FMCArabicTitle';
import {anchors, CALIB_8313064, OVERLAY_CAM, SciaticaOverlay, type OverlayState} from '../../components/Medical3D/SciaticaOverlay';
import {DISC_ANCHORS, DiscRootModel} from '../../components/Medical3D/DiscRootModel';
import {FONT_AR} from '../../styles/theme';
import type {SciCtx} from '../../compositions/SciaticaEpisode';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const C = CALIB_8313064;
const A = anchors(C, 1);
const ORIGIN: [number, number] = [540, 864];
/** Same maths as CameraBox so screen-space labels can follow the zoomed footage. */
const mapPt = (p: [number, number], s: number, x = 0, y = 0, o: [number, number] = ORIGIN): [number, number] => [o[0] + (p[0] - o[0]) * s + x, o[1] + (p[1] - o[1]) * s + y];

/** Photographed back view + calibrated anatomy overlay (inside the same transform so the overlay stays on the body). */
const BodyLayer: React.FC<{from: number; dur: number; st: (f: number) => OverlayState; cam: {s0: number; s1: number; origin?: string; x0?: number; x1?: number; y0?: number; y1?: number}; fade?: number}> = ({from, dur, st, cam, fade = 14}) => {
  const f = useCurrentFrame();
  return (
    <CrossLayer from={from} dur={dur} fade={fade}>
      <CameraBox from={from} dur={dur} cam={cam}>
        <AbsoluteFill style={{transform: 'scale(1.7)', filter: 'blur(40px) brightness(0.92)'}}><Footage file="footage/sciatica/back_standing_pingpong.mp4" startFrom={Math.max(0, f - from)} /></AbsoluteFill>
        <AbsoluteFill><Footage file="footage/sciatica/back_standing_pingpong.mp4" startFrom={Math.max(0, f - from)} /></AbsoluteFill>
        <AbsoluteFill style={{zIndex: 5}}>
          <ThreeCanvas width={1080} height={1920} camera={OVERLAY_CAM} gl={{antialias: true, alpha: true}} onCreated={({camera}) => camera.lookAt(540, 960, 0)}>
            <ambientLight intensity={1.15} />
            <directionalLight position={[300, 1200, 800]} intensity={1.3} />
            <SciaticaOverlay st={st(f)} />
          </ThreeCanvas>
        </AbsoluteFill>
      </CameraBox>
    </CrossLayer>
  );
};

const PathChips: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  const items = ['أسفل الظهر', 'الأرداف', 'الساق'];
  const o = win(f, from, to, 16, 14);
  if (o <= 0.001) return null;
  return (
    <div dir="rtl" style={{position: 'absolute', left: 72, right: 72, top: 1296, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, opacity: o}}>
      {items.map((t, i) => {
        const k = ss(clamp((f - from - i * 14) / 16));
        return (
          <React.Fragment key={t}>
            <span style={{fontFamily: FONT_AR, fontSize: 40, fontWeight: 700, color: '#fff', padding: '10px 26px', borderRadius: 16, background: 'rgba(9,24,42,0.78)', border: `2px solid ${i === 0 ? '#F28C28' : i === 1 ? '#E8603A' : '#E5322D'}`, opacity: k, transform: `translateY(${(1 - k) * 16}px)`}}>{t}</span>
            {i < 2 ? <span style={{fontFamily: FONT_AR, fontSize: 40, color: '#7DF3EA', opacity: k}}>←</span> : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** Scene 1 — pain pathway: bones appear inside the real body, the nerve is drawn, orange then red mark where the pain starts and where it travels. */
export const PainPathScene: React.FC<{c: SciCtx}> = ({c}) => {
  const {op, an, sec, layout} = c;
  const end = an.from + 8;
  const st = (f: number): OverlayState => ({bones: ss(clamp((f - sec(0.9)) / sec(1.7))), nerves: ss(clamp((f - sec(3.0)) / sec(2.8))), orange: ss(clamp((f - sec(2.5)) / sec(1.2))), red: ss(clamp((f - sec(4.7)) / sec(2.6))), pulse: f / 30, dim: ss(clamp((f - sec(5)) / sec(1.5)))});
  const m = (p: [number, number]) => p;
  return (
    <>
      <BodyLayer from={0} dur={end} st={st} cam={{s0: 1.0, s1: 1.05, origin: '50% 45%'}} fade={8} />
      <FMCArabicTitle text="مسار الألم" highlight="الألم" from={4} dur={op.duration - 4} top={layout.safe.top - 40} left={layout.safe.left} right={layout.safe.right} />
      <LeaderLabel text="ألم أسفل الظهر" at={mapPt(A.lowerBack, 1.025)} label={[240, 1190]} from={sec(2.7)} to={sec(6.9)} size={40} accent="#F28C28" />
      <LeaderLabel text="ألم يمتد إلى الساق" at={mapPt(A.thigh, 1.04)} label={[250, 1345]} from={sec(5.2)} to={sec(6.9)} size={40} accent="#E5322D" />
      <PathChips from={sec(7.0)} to={op.duration} />
      {void m}
    </>
  );
};

/** Scene 2 — anatomy: zoom into the lumbosacral roots on the body, then one illustrative close-up of a disc bulge irritating a root. */
export const NerveAnatomyScene: React.FC<{c: SciCtx}> = ({c}) => {
  const f = useCurrentFrame();
  const {an, sy, sec, layout, width, height} = c;
  const t0 = an.from, end = sy.from + 10;
  const zoomEnd = t0 + sec(8.2);
  // --- part A: roots + sciatic nerve on the real body (zoomed) ---
  const k = ss(clamp((f - t0) / sec(2.4)));
  const s = 1 + 1.25 * k;
  const stA = (fr: number): OverlayState => ({bones: 1, nerves: 1, orange: 0.0, red: 0.0, pulse: fr / 30, dim: 1});
  const rootsLabel = mapPt([C.x0 + 46, C.sacrumY - 40], s, 0, 0, [C.x0, 1230]);
  // origin for the zoom is the lumbosacral area; CameraBox origin is given in % of the frame
  const ox = (C.x0 / 1080) * 100, oy = (1230 / 1920) * 100;
  const sciaticLabel = mapPt([C.x0 + C.hipDX, C.hipY + 60], s, 0, 0, [C.x0, 1230]);
  // --- part B: disc / root close-up ---
  const tb = f - zoomEnd;
  const irr = ss(clamp((tb - sec(1.2)) / sec(1.8)));
  const dist = 56 - 17 * ss(clamp(tb / sec(7.5)));
  const camPos: [number, number, number] = [dist * 0.36 + Math.sin(tb * 0.01) * 1.5, 4.5 + dist * 0.04, -dist * 0.93];
  const look: [number, number, number] = [1, -0.8, -1.4];
  const cam = {pos: camPos, look, fov: 32};
  const P = (v: THREE.Vector3) => projectPoint(v, cam);
  return (
    <>
      <BodyLayerZoom from={t0} dur={zoomEnd - t0 + 12} st={stA} s0={1} s1={2.25} origin={`${ox}% ${oy}%`} />
      <FMCArabicTitle text="من العمود الفقري إلى العصب الوركي" highlight="العصب الوركي" from={t0 + 6} dur={end - t0 - 6} top={layout.safe.top - 40} left={layout.safe.left} right={layout.safe.right} size={56} />
      <LeaderLabel text="جذور الأعصاب" at={mapPt([C.x0 + 52, C.sacrumY - 50], 2.25, 0, 0, [C.x0, 1230])} label={[260, 1120]} from={t0 + sec(2.4)} to={zoomEnd + 6} size={40} accent="#F6C945" />
      <LeaderLabel text="العصب الوركي" at={mapPt([C.x0 + C.hipDX, C.hipY + 70], 2.25, 0, 0, [C.x0, 1230])} label={[820, 1260]} from={t0 + sec(4.2)} to={zoomEnd + 6} size={40} accent="#F6C945" />
      {void rootsLabel}{void sciaticLabel}
      <CrossLayer from={zoomEnd} dur={end - zoomEnd} fade={20}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, #33414f 0%, #10161d 78%)'}} />
        <ThreeCanvas width={width} height={height} camera={{fov: 32, position: camPos, near: 0.5, far: 300}} gl={{antialias: true, alpha: true}}>
          <CamRig pos={camPos} look={look} fov={32} />
          <hemisphereLight args={['#e3ecf3', '#40372c', 0.8]} />
          <directionalLight position={[20, 30, -30]} intensity={2.2} color="#fff1dc" />
          <directionalLight position={[-20, -10, -20]} intensity={0.9} color="#9cc7e6" />
          <DiscRootModel irritation={irr} time={f / 30} reveal={ss(clamp(tb / sec(1.2)))} />
        </ThreeCanvas>
        <LeaderLabel text="القرص بين الفقرتين" at={P(DISC_ANCHORS.disc)} label={[250, 640]} from={zoomEnd + sec(1.0)} to={end} size={40} accent="#B4C4CF" />
        <LeaderLabel text="جذر عصبي" at={P(DISC_ANCHORS.root)} label={[840, 600]} from={zoomEnd + sec(2.0)} to={end} size={40} accent="#F6C945" />
        <LeaderLabel text="تهيج أو ضغط" at={P(DISC_ANCHORS.contact)} label={[830, 1010]} from={zoomEnd + sec(3.4)} to={end} size={40} accent="#E5322D" />
        <InfoChip text="مثال توضيحي واحد فقط" from={zoomEnd + sec(1.6)} to={end} x={540} y={1250} />
        <div dir="rtl" style={{position: 'absolute', left: 72, right: 72, top: 1330, textAlign: 'center', fontFamily: FONT_AR, fontSize: 30, fontWeight: 500, color: '#E8EEF3', opacity: win(f, zoomEnd + sec(2.4), end, 16, 14)}}>تختلف أسباب عرق النسا من حالة لأخرى.</div>
      </CrossLayer>
    </>
  );
};

/** Zooming variant of BodyLayer (zoom into a point of the body). */
const BodyLayerZoom: React.FC<{from: number; dur: number; st: (f: number) => OverlayState; s0: number; s1: number; origin: string}> = ({from, dur, st, s0, s1, origin}) => {
  const f = useCurrentFrame();
  const k = ss(clamp((f - from) / 60));
  const s = s0 + (s1 - s0) * k;
  return (
    <CrossLayer from={from} dur={dur} fade={14}>
      <CameraBox from={from} dur={1} cam={{s0: s, s1: s, origin}}>
        <AbsoluteFill style={{transform: 'scale(1.7)', filter: 'blur(40px) brightness(0.92)'}}><Footage file="footage/sciatica/back_standing_pingpong.mp4" startFrom={Math.max(0, f - from)} /></AbsoluteFill>
        <AbsoluteFill><Footage file="footage/sciatica/back_standing_pingpong.mp4" startFrom={Math.max(0, f - from)} /></AbsoluteFill>
        <AbsoluteFill style={{zIndex: 5}}>
          <ThreeCanvas width={1080} height={1920} camera={OVERLAY_CAM} gl={{antialias: true, alpha: true}} onCreated={({camera}) => camera.lookAt(540, 960, 0)}>
            <ambientLight intensity={1.15} />
            <directionalLight position={[300, 1200, 800]} intensity={1.3} />
            <SciaticaOverlay st={st(f)} />
          </ThreeCanvas>
        </AbsoluteFill>
      </CameraBox>
    </CrossLayer>
  );
};

/** Scene 3 — symptoms on the body: pain, tingling, and sometimes weakness. */
export const SymptomsOnBody: React.FC<{c: SciCtx}> = ({c}) => {
  const f = useCurrentFrame();
  const {sy, sec, layout} = c;
  const end = sy.from + sy.duration + 6;
  const st = (fr: number): OverlayState => ({bones: 0.75, nerves: 1, orange: 0.8, red: 1, pulse: fr / 30, dim: 1});
  const base = sy.from;
  // tingling: small yellow-orange particles drifting down the leg path
  const dots = Array.from({length: 14}, (_, i) => {
    const t = ((f - base) * 0.012 + i / 14) % 1;
    const x = C.x0 + C.hipDX + Math.sin(i * 2.1 + (f - base) * 0.05) * 22;
    const y = C.hipY + 120 + t * 330;
    return {x, y, o: Math.sin(Math.PI * t) * win(f, base + sec(2.4), end, 14, 12)};
  });
  return (
    <>
      <BodyLayer from={base} dur={end - base} st={st} cam={{s0: 1.05, s1: 1.0, origin: '50% 45%'}} fade={16} />
      {/* sparkles live in screen space with the same slight zoom */}
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        {dots.map((d, i) => d.o > 0.02 ? <div key={i} style={{position: 'absolute', left: d.x - 5, top: d.y - 5, width: 10, height: 10, borderRadius: 5, background: '#F6C945', opacity: d.o * 0.9, boxShadow: '0 0 12px 4px rgba(246,201,69,0.55)'}} /> : null)}
      </AbsoluteFill>
      <FMCArabicTitle text="أعراض قد ترافق الألم" highlight="أعراض" from={base + 6} dur={end - base - 6} top={layout.safe.top - 40} left={layout.safe.left} right={layout.safe.right} />
      <LeaderLabel text="ألم أسفل الظهر" at={A.lowerBack} label={[240, 1190]} from={base + sec(0.4)} to={end - 4} size={40} accent="#F28C28" />
      <LeaderLabel text="ألم يمتد إلى الساق" at={A.thigh} label={[250, 1345]} from={base + sec(1.5)} to={end - 4} size={40} accent="#E5322D" />
      <LeaderLabel text="تنميل أو وخز" at={[A.thigh[0] + 6, A.thigh[1] + 150]} label={[870, 1345]} from={base + sec(2.6)} to={end - 4} size={40} accent="#F6C945" />
      <InfoChip text="وأحيانا ضعف في العضلات" from={base + sec(4.4)} to={end - 4} x={540} y={1030} />
    </>
  );
};
