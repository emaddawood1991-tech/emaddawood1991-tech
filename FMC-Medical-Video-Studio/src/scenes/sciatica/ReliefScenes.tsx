import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CrossLayer, CameraBox, Footage} from '../../components/FMCCinematicTransition';
import {InfoChip, ss, win} from '../../components/FMCMedicalHighlight';
import {FMCArabicTitle} from '../../components/FMCArabicTitle';
import {ThreeCanvas} from '@remotion/three';
import {OVERLAY_CAM, SciaticaOverlay, type OverlayState} from '../../components/Medical3D/SciaticaOverlay';
import {FONT_AR, FONT_DISPLAY} from '../../styles/theme';
import type {ReliefCtx} from '../../compositions/SciaticaEpisode';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const BodyCalm: React.FC<{from: number; dur: number; st: (f: number) => OverlayState; cam: {s0: number; s1: number}; dark?: number}> = ({from, dur, st, cam, dark = 0}) => {
  const f = useCurrentFrame();
  return (
    <CrossLayer from={from} dur={dur} fade={16}>
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
      {dark > 0 ? <AbsoluteFill style={{background: `rgba(8,22,38,${dark})`}} /> : null}
    </CrossLayer>
  );
};

/** Treatment scene: how pain can be eased. The red/orange pain marking retreats while one short idea at a time appears in step with the voice. */
export const ReliefScene: React.FC<{c: ReliefCtx}> = ({c}) => {
  const f = useCurrentFrame();
  const {tr, sec, layout} = c;
  const v0 = tr.from + 0.5 * 30; // voice start (≈ lead)
  const end = tr.from + tr.duration + 6;
  const st = (fr: number): OverlayState => ({bones: 0.8, nerves: 1, orange: 0.9, red: 1, pulse: fr / 30, dim: 1, calm: ss(clamp((fr - (v0 + sec(6.0))) / sec(14)))});
  // phrase windows (seconds from voice start), proportional to the narration text
  const chips = [
    {t: 'كثير من الحالات تتحسن مع الوقت', a: 0.3, b: 6.3},
    {t: 'نشاط خفيف قدر ما تسمح الأعراض', a: 6.5, b: 12.0},
    {t: 'تجنب الجلوس أو الراحة الطويلة', a: 12.2, b: 16.5},
    {t: 'غير وضعيتك بانتظام', a: 16.7, b: 18.4},
    {t: 'دفء أو كمادات باردة', a: 18.6, b: 21.8},
    {t: 'المسكنات بإشارة الطبيب أو الصيدلاني', a: 22.0, b: 27.5},
  ];
  return (
    <>
      <BodyCalm from={tr.from} dur={end - tr.from} st={st} cam={{s0: 1.04, s1: 1.0}} />
      <FMCArabicTitle text="كيف نخفف الألم؟" highlight="نخفف" from={tr.from + 6} dur={end - tr.from - 6} top={layout.safe.top - 40} left={layout.safe.left} right={layout.safe.right} />
      {chips.map((k, i) => <InfoChip key={i} text={k.t} from={v0 + sec(k.a)} to={v0 + sec(k.b)} x={540} y={1010} />)}
    </>
  );
};

/** Physiotherapy bridge: only text + calm anatomy (no exercises are shown here). */
export const TherapyBridgeScene: React.FC<{c: ReliefCtx}> = ({c}) => {
  const {fm, sec, layout} = c;
  const v0 = fm.from + 15;
  const end = fm.from + fm.duration + 6;
  const st = (fr: number): OverlayState => ({bones: 0.7, nerves: 1, orange: 0, red: 0, pulse: fr / 30, dim: 1, calm: 1});
  return (
    <>
      <BodyCalm from={fm.from} dur={end - fm.from} st={st} cam={{s0: 1.0, s1: 1.05}} />
      <FMCArabicTitle text="تمارين مناسبة لحالتك" highlight="مناسبة" from={fm.from + 6} dur={end - fm.from - 6} top={layout.safe.top - 40} left={layout.safe.left} right={layout.safe.right} />
      <InfoChip text="تقييم أولا" from={v0 + sec(0.4)} to={v0 + sec(3.4)} x={540} y={1010} />
      <InfoChip text="إطالة وتمارين بإشراف أخصائي" from={v0 + sec(3.6)} to={end - 4} x={540} y={1010} />
    </>
  );
};

/** Safety scene: when to be assessed, and the urgent warning signs. */
export const RedFlagScene: React.FC<{c: ReliefCtx}> = ({c}) => {
  const f = useCurrentFrame();
  const {sf, sec, layout} = c;
  const v0 = sf.from + 15;
  const end = sf.from + sf.duration + 6;
  const card = (txt: string, from: number, y: number, accent: string, size = 42) => {
    const o = win(f, from, end - 6, 16, 14);
    const k = ss(clamp((f - from) / 18));
    return o <= 0.001 ? null : (
      <div key={txt} dir="rtl" style={{position: 'absolute', left: 90, right: 90, top: y, opacity: o, transform: `translateY(${(1 - k) * 22}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '20px 30px', borderRadius: 22, background: 'rgba(9,24,42,0.8)', border: `2px solid ${accent}`, boxShadow: '0 12px 34px rgba(0,0,0,0.3)'}}>
          <span style={{width: 14, height: 14, borderRadius: 7, background: accent, flex: '0 0 auto'}} />
          <span style={{fontFamily: FONT_AR, fontSize: size, fontWeight: 700, color: '#fff', lineHeight: 1.35}}>{txt}</span>
        </div>
      </div>
    );
  };
  return (
    <>
      <CrossLayer from={sf.from} dur={end - sf.from} fade={16}>
        <CameraBox from={sf.from} dur={end - sf.from} cam={{s0: 1.12, s1: 1.04}}><Footage file="footage/sciatica/back_blur_bg.mp4" /></CameraBox>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,26,46,0.9), rgba(11,38,66,0.9))'}} />
      </CrossLayer>
      <FMCArabicTitle text="متى نراجع الطبيب؟" highlight="الطبيب" from={sf.from + 6} dur={end - sf.from - 6} top={layout.safe.top - 40} left={layout.safe.left} right={layout.safe.right} />
      {card('زيادة الألم الممتد إلى الساق: اطلب التقييم', v0 + sec(0.3), 470, '#F2A33A')}
      <div dir="rtl" style={{position: 'absolute', left: 90, right: 90, top: 690, fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 800, color: '#FF8A7A', opacity: win(f, v0 + sec(5.0), end - 6, 16, 14)}}>تقييم طبي عاجل عند:</div>
      {card('ضعف شديد أو مستمر في الساق', v0 + sec(5.4), 770, '#E5322D')}
      {card('تنميل في منطقة الحوض', v0 + sec(9.0), 920, '#E5322D')}
      {card('تغير في التحكم بالبول أو البراز', v0 + sec(11.3), 1070, '#E5322D')}
    </>
  );
};

/** Stretch demonstrations (footage supplied by the user, generated outside this project): three movements shown one after another. */
const MOVES = [
  {file: 'footage/sciatica/stretch1.mp4', at: 6, len: 173, num: 'الحركة الأولى', name: 'تمديد الظهر', hint: 'استلقاء على البطن ثم ارتكاز على الساعدين أو اليدين', pos: '50% 62%'},
  {file: 'footage/sciatica/stretch2.mp4', at: 168, len: 160, num: 'الحركة الثانية', name: 'الدوران الجانبي', hint: 'ركبتان مثنيتان وميل لطيف للساقين إلى الجانب', pos: '50% 60%'},
  {file: 'footage/sciatica/stretch3.mp4', at: 322, len: 166, num: 'الحركة الثالثة', name: 'تمديد الورك', hint: 'وضعية التسعين والتسعين بحركة بطيئة', pos: '50% 55%'},
];
export const StretchScene: React.FC<{c: ReliefCtx}> = ({c}) => {
  const f = useCurrentFrame();
  const {fm, layout} = c;
  const end = fm.from + fm.duration + 6;
  return (
    <>
      {MOVES.map((m, i) => {
        const a = fm.from + m.at, d = m.len + (i === MOVES.length - 1 ? end - fm.from - m.at - m.len : 12);
        const o = win(f, a + 6, a + m.len - 2, 14, 14);
        return (
          <React.Fragment key={m.file}>
            <CrossLayer from={a} dur={d} fade={14}>
              <CameraBox from={a} dur={d} cam={{s0: 1.0, s1: 1.05}}><Footage file={m.file} pos={m.pos} /></CameraBox>
              <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,16,28,0.62) 0%, rgba(6,16,28,0) 26%, rgba(6,16,28,0) 66%, rgba(6,16,28,0.7) 100%)'}} />
            </CrossLayer>
            {o > 0.001 ? (
              <div dir="rtl" style={{position: 'absolute', left: 72, right: 72, top: 330, opacity: o, transform: `translateY(${(1 - ss(clamp((f - a) / 16))) * 18}px)`}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '20px 30px', borderRadius: 24, background: 'rgba(9,24,42,0.78)', border: '2px solid #4FE6DA', boxShadow: '0 12px 34px rgba(0,0,0,0.35)'}}>
                  <span style={{fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 800, color: '#06121f', background: '#4FE6DA', borderRadius: 16, padding: '6px 20px', flex: '0 0 auto'}}>{i + 1}</span>
                  <div>
                    <div style={{fontFamily: FONT_AR, fontSize: 46, fontWeight: 800, color: '#fff', lineHeight: 1.25}}>{m.num}: {m.name}</div>
                    <div style={{fontFamily: FONT_AR, fontSize: 34, fontWeight: 600, color: '#BFEFF0', lineHeight: 1.3, marginTop: 4}}>{m.hint}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
      <FMCArabicTitle text="تمارين مناسبة لحالتك" highlight="مناسبة" from={fm.from + 6} dur={end - fm.from - 6} top={layout.safe.top - 40} left={layout.safe.left} right={layout.safe.right} />
    </>
  );
};
