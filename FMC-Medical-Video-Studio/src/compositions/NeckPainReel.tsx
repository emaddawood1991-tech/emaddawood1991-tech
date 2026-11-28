import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VideoProps} from '../lib/schema';
import {computeTimeline, totalFrames} from '../lib/timeline';
import {makeLayout} from '../styles/theme';
import {NarrationAudio} from '../lib/audioPolicy';
import {loadFonts} from '../styles/fonts';
import {FMCMedicalTimeline, type Chapter} from '../components/FMCMedicalTimeline';
import {FMCLogoOverlay} from '../components/FMCLogoOverlay';
import {FMCArabicTitle} from '../components/FMCArabicTitle';
import {InfoChip} from '../components/FMCMedicalHighlight';
import {ClosingV2} from '../scenes/catcow2/CatCow2Parts';
import {AnatFull, AnatInset, AnatOverlay, ClinLabel, Cut, MoveArrowH, MuscleGlow, PainGlow, Referral, RotArrow, kf, type CutSpec} from '../scenes/neck/NeckParts';

export const durationForNeck = (p: VideoProps) => totalFrames(computeTimeline(p.content, p.manifest));

/** Hand-keyed pain locus for the hook clip (cut time in seconds -> x,y in the 1080x1920 cut space). */
const HOOK_PAIN: [number, number, number][] = [[0.25, 360, 610], [1.0, 410, 640], [1.75, 330, 660], [2.5, 285, 650], [3.25, 300, 640], [4.0, 360, 590], [4.75, 330, 660], [5.5, 300, 660], [6.25, 360, 660], [7.0, 450, 620]];

/** Neck pain & cervicogenic headache — realistic footage + anatomy overlays + three demonstrated rehabilitation movements. */
export const NeckPainReel: React.FC<VideoProps> = (props) => {
  loadFonts();
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const layout = makeLayout(width, height);
  const tl = useMemo(() => computeTimeline(props.content, props.manifest), [props.content, props.manifest]);
  const t = (id: string) => tl.find((x) => x.id === (id as any))!;
  const sec = (s: number) => Math.round(s * 30);
  const hk = t('nk_hook'), an = t('nk_anatomy'), as = t('nk_assess'), m1 = t('nk_m1'), m2 = t('nk_m2'), m3 = t('nk_m3'), tr = t('nk_treat'), cl = t('closing');
  const closeFrom = cl.from + 4;
  const tTop = layout.safe.top - 40;
  const title = (text: string, hl: string, a: number, b: number) => <div style={{position: 'absolute', inset: 0, zIndex: 5}}><FMCArabicTitle text={text} highlight={hl} from={a} dur={b - a} top={tTop} left={layout.safe.left} right={layout.safe.right} /></div>;
  const chapters: Chapter[] = [
    {id: 'where', num: '01', label: 'مكان الألم', from: 0, to: an.from},
    {id: 'anat', num: '02', label: 'الفقرات والعضلات', from: an.from, to: as.from},
    {id: 'eval', num: '03', label: 'التقييم', from: as.from, to: m1.from},
    {id: 'pt', num: '04', label: 'العلاج الطبيعي', from: m1.from, to: closeFrom},
  ];
  // --- scene 1: hook
  const hookClip: CutSpec = {name: 'hook', len: hk.duration / 30 + 0.4, zoom: [1.0, 1.2], origin: '38% 38%'};
  const hp = kf(HOOK_PAIN, Math.max(0, (frame - hk.from) / 30));
  // --- scene 2: anatomy (match cut: front neck close-up -> profile + cervical overlay -> upper-cervical 3D)
  const anS = an.from, anE = an.from + an.duration;
  const profAt = anS + sec(1.8), orbitAt = anS + sec(6.6);
  const OV = {x: 372, y: 988, scale: 1.4};
  return (
    <AbsoluteFill style={{background: '#0b1622', overflow: 'hidden'}}>
      {/* 1 */}
      <Cut c={hookClip} from={hk.from}>
        <PainGlow x={hp[0]} y={hp[1]} r={130} from={hk.from + sec(1.0)} to={hk.from + hk.duration - 4} />
      </Cut>
      {title('ألم الرقبة يرافقه صداع؟', 'صداع؟', hk.from + 8, hk.from + hk.duration)}

      {/* 2 */}
      <Cut c={{name: 'neck_front', len: 2.5, zoom: [1.0, 1.08], origin: '50% 40%'}} from={anS}>
        <PainGlow x={540} y={700} r={170} from={anS + 10} to={anS + sec(2.2)} />
      </Cut>
      <Cut c={{name: 'prof_w', len: (orbitAt - profAt) / 30 + 0.5, speed: 0.45, zoom: [1.0, 1.06], origin: '52% 45%'}} from={profAt}>
        <AnatOverlay src="neck/side/f_0001.png" x={OV.x} y={OV.y} scale={OV.scale} flip from={profAt + 14} to={orbitAt + 6} />
        <Referral pts={[[560, 790], [520, 690], [470, 600], [430, 560]]} from={profAt + sec(1.6)} to={orbitAt + 4} />
      </Cut>
      <AnatFull dir="upper" from={orbitAt} to={anE - 2} speed={0.5} />
      {title('الصداع المرتبط بالرقبة', 'المرتبط', anS + 8, anE)}
      <InfoChip text="العضلات والمفاصل العنقية" from={anS + sec(3.0)} to={orbitAt - 4} x={540} y={1450} />
      <ClinLabel text="الفقرات العنقية C1–C7" at={[480, 1000]} label={[1010, 1110]} from={profAt + sec(1.2)} to={orbitAt - 4} />
      <ClinLabel text="عضلات أسفل الجمجمة" at={[600, 770]} label={[420, 640]} from={orbitAt + sec(0.6)} to={anE - 4} color="#F6A25C" />

      {/* 3 */}
      <Cut c={{name: 'assess1', len: 5.2, zoom: [1.0, 1.12], origin: '55% 40%'}} from={as.from} />
      <Cut c={{name: 'assess2', len: 4.6, zoom: [1.02, 1.1], origin: '50% 35%'}} from={as.from + sec(4.6)} />
      {title('التقييم أول خطوة للعلاج', 'التقييم', as.from + 6, m1.from)}
      <ClinLabel text="فحص حركة الرقبة" at={[690, 880]} label={[560, 1330]} from={as.from + sec(1.2)} to={as.from + sec(4.6)} />
      <ClinLabel text="وضعية الكتف والظهر" at={[520, 1210]} label={[1010, 1480]} from={as.from + sec(2.4)} to={as.from + sec(4.6)} />
      <ClinLabel text="الأعراض وطبيعتها" at={[540, 900]} label={[1010, 1380]} from={as.from + sec(5.4)} to={m1.from - 4} />

      {/* movements */}
      <Cut c={{name: 'profile', len: m1.duration / 30 + 0.2, zoom: [1.05, 1.0], origin: '45% 45%'}} from={m1.from}>
        <MoveArrowH x0={330} y0={900} x1={560} y1={900} from={m1.from + sec(1.2)} to={m1.from + m1.duration - 6} />
      </Cut>
      {title('سحب الذقن للخلف', 'الذقن', m1.from + 6, m2.from)}
      <AnatInset dir="tuck" from={m1.from + sec(0.8)} to={m2.from} x={40} y={1030} w={300} label="سحب الذقن" ping={false} />

      <Cut c={{name: 'm2', len: m2.duration / 30 + 0.2, zoom: [1.0, 1.08], origin: '50% 40%'}} from={m2.from}>
        <MuscleGlow x={400} y={1250} rx={150} ry={220} rot={-12} from={m2.from + sec(0.6)} to={m3.from} />
        <MuscleGlow x={720} y={1250} rx={150} ry={220} rot={12} from={m2.from + sec(0.6)} to={m3.from} />
        <MoveArrowH x0={300} y0={1180} x1={470} y1={1180} from={m2.from + sec(1.0)} to={m3.from} />
        <MoveArrowH x0={800} y0={1180} x1={630} y1={1180} from={m2.from + sec(1.0)} to={m3.from} />
      </Cut>
      {title('تقريب لوحي الكتف', 'لوحي', m2.from + 6, m3.from)}
      <AnatInset dir="back" from={m2.from + sec(0.8)} to={m3.from} x={40} y={1030} w={300} label="لوحا الكتف" />

      <Cut c={{name: 'm3', len: m3.duration / 30 + 0.2, speed: 0.7, zoom: [1.0, 1.06], origin: '50% 38%'}} from={m3.from}>
        <RotArrow cx={560} cy={460} r={230} from={m3.from + sec(0.6)} to={tr.from} />
      </Cut>
      {title('تحريك الرقبة بلطف', 'بلطف', m3.from + 6, tr.from)}
      <AnatInset dir="rot" from={m3.from + sec(0.8)} to={tr.from} x={40} y={1030} w={300} label="دوران الرقبة" />

      {/* treatment */}
      <Cut c={{name: 'treat', len: tr.duration / 30 + 0.2, zoom: [1.0, 1.1], origin: '40% 45%'}} from={tr.from} />
      {title('علاج طبيعي يناسب حالتك', 'يناسب', tr.from + 6, closeFrom)}
      <InfoChip text="تختلف بحسب الحالة" from={tr.from + sec(1.5)} to={closeFrom - 20} x={540} y={1010} />

      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 440, background: 'linear-gradient(180deg, rgba(6,16,28,0.62) 0%, rgba(6,16,28,0) 100%)', pointerEvents: 'none', opacity: frame >= closeFrom - 4 ? 0 : 1}} />
      <ClosingV2 from={closeFrom} dur={cl.from + cl.duration - closeFrom} />
      <FMCMedicalTimeline chapters={chapters} top={1620} left={layout.safe.left} right={layout.safe.right} showFrom={sec(0.8)} showTo={closeFrom + 6} size={21} activeSize={24} />
      <FMCLogoOverlay size={140} top={58} right={58} opacity={frame < closeFrom ? 1 : Math.max(0, 1 - (frame - closeFrom) / 10)} />
      {tl.map((item) => (item.audioFile ? <NarrationAudio key={`a-${item.id}`} file={item.audioFile} from={item.from + item.audioFrom} frames={item.audioFrames} /> : null))}
    </AbsoluteFill>
  );
};
