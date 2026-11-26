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
import {AnkleInset, ClipSeg, HamstringInset, KneeInset, MoveArrow, PainSpot, Progression, SportsClosing, StageTitle, type Seg} from '../scenes/sports/SportsParts';

export const durationForSports = (p: VideoProps) => totalFrames(computeTimeline(p.content, p.manifest));

/** Lays segments one after another inside a scene, overlapping by `ov` frames. Returns [seg, startFrame][]. */
const lay = (from: number, segs: Seg[], ov = 10) => {
  let c = from;
  return segs.map((s) => {
    const st = c;
    c += Math.round(s.len * 30) - ov;
    return [s, st] as const;
  });
};

export const SportsInjuryReel: React.FC<VideoProps> = (props) => {
  loadFonts();
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const layout = makeLayout(width, height);
  const tl = useMemo(() => computeTimeline(props.content, props.manifest), [props.content, props.manifest]);
  const t = (id: string) => tl.find((x) => x.id === (id as any))!;
  const sec = (s: number) => Math.round(s * 30);
  const op = t('opening'), ex = t('sx_examples'), as = t('sx_assess'), mo = t('sx_motion'), st = t('sx_strength'), re = t('sx_return'), cl = t('closing');
  const closeFrom = cl.from + 6;
  const tTop = layout.safe.top - 40;
  const title = (text: string, hl: string, a: number, b: number) => <FMCArabicTitle text={text} highlight={hl} from={a} dur={b - a} top={tTop} left={layout.safe.left} right={layout.safe.right} />;

  const opSegs = lay(op.from, [{id: 31328833, ss: 1.0, len: 4.4, speed: 0.6, zoom: [1.0, 1.08], origin: '50% 75%'}, {id: 7263165, ss: 0.0, len: 4.6, speed: 0.8, zoom: [1.0, 1.04]}]);
  const exSegs = lay(ex.from, [{id: 7299332, ss: 0.4, len: 4.2, zoom: [1.0, 1.04]}, {id: 7299360, ss: 0.3, len: 4.2, zoom: [1.0, 1.05]}, {id: 9517850, ss: 0.0, len: 4.2, zoom: [1.0, 1.05], origin: '40% 60%'}]);
  const asSegs = lay(as.from, [{id: 7986034, ss: 0.2, len: 4.6, zoom: [1.0, 1.06]}, {id: 8313525, ss: 1.0, len: 4.6}]);
  const moSegs = lay(mo.from, [{id: 29807500, ss: 0.2, len: 4.9, speed: 0.9, zoom: [1.02, 1.08], origin: '40% 70%'}, {id: 7477495, ss: 4.5, len: 4.9, speed: 0.9, zoom: [1.0, 1.06]}]);
  const stSegs = lay(st.from, [{id: 7477495, ss: 0.0, len: 4.9, speed: 0.9, zoom: [1.0, 1.06]}, {id: 29807500, ss: 0.5, len: 4.3, speed: 0.8, zoom: [1.1, 1.16], origin: '20% 75%'}]);
  const reSegs = lay(re.from, [{id: 8456711, ss: 0.0, len: 5.3, zoom: [1.0, 1.06]}, {id: 36109132, ss: 2.0, len: 4.9, zoom: [1.0, 1.06]}]);
  const segs = [...opSegs, ...exSegs, ...asSegs, ...moSegs, ...stSegs, ...reSegs];

  const chapters: Chapter[] = [
    {id: 'inj', num: '01', label: 'الإصابة', from: 0, to: as.from},
    {id: 'ev', num: '02', label: 'التقييم', from: as.from, to: mo.from},
    {id: 'mv', num: '03', label: 'الحركة', from: mo.from, to: st.from},
    {id: 'st', num: '04', label: 'القوة والتوازن', from: st.from, to: re.from},
    {id: 'rt', num: '05', label: 'العودة للرياضة', from: re.from, to: closeFrom},
  ];
  const v0 = (s: {from: number}) => s.from + 16;
  return (
    <AbsoluteFill style={{background: '#0b1622', overflow: 'hidden'}}>
      {segs.map(([s, from], i) => <ClipSeg key={i} seg={s} from={from} />)}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 420, background: 'linear-gradient(180deg, rgba(6,16,28,0.7) 0%, rgba(6,16,28,0) 100%)', pointerEvents: 'none', opacity: frame >= closeFrom ? 0 : 1}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 700, background: 'linear-gradient(0deg, rgba(6,16,28,0.55) 0%, rgba(6,16,28,0) 100%)', pointerEvents: 'none', opacity: frame >= closeFrom ? 0 : 1}} />

      {/* 1 opening */}
      <PainSpot x={700} y={1570} r={95} from={op.from + sec(4.1)} to={op.from + sec(5.0)} />
      {title('إصابة رياضية؟', 'رياضية', op.from + 6, op.from + sec(4.6))}
      {title('التأهيل الصحيح يبدأ بالتقييم', 'بالتقييم', op.from + sec(4.8), op.from + op.duration)}

      {/* 2 examples */}
      {title('إصابات شائعة', 'شائعة', ex.from + 6, as.from)}
      <AnkleInset from={ex.from + 14} to={ex.from + sec(3.9)} />
      <PainSpot x={240} y={1535} r={95} from={ex.from + 18} to={ex.from + sec(3.9)} />
      <InfoChip text="التواء الكاحل" from={ex.from + 18} to={ex.from + sec(3.9)} x={540} y={1010} accent="#F28C28" />
      <HamstringInset from={ex.from + sec(3.95)} to={ex.from + sec(7.8)} />
      <PainSpot x={870} y={800} r={125} from={ex.from + sec(4.0)} to={ex.from + sec(7.8)} />
      <InfoChip text="إجهاد أو تمزق عضلي" from={ex.from + sec(4.0)} to={ex.from + sec(7.8)} x={540} y={1010} accent="#F28C28" />
      <KneeInset from={ex.from + sec(7.9)} to={as.from} />
      <PainSpot x={930} y={960} r={105} from={ex.from + sec(8.0)} to={as.from} />
      <InfoChip text="إصابات الركبة" from={ex.from + sec(8.0)} to={as.from} x={540} y={1010} accent="#F28C28" />

      {/* 3 assessment */}
      <StageTitle badge="١" label="المرحلة الأولى" title="تقييم الإصابة" from={as.from + 6} to={mo.from} top={tTop - 10} />
      <InfoChip text="ألم شديد أو عدم القدرة على تحميل الوزن: راجع الطبيب" from={as.from + sec(4.7)} to={mo.from - 4} x={540} y={1010} accent="#F2A33A" />

      {/* 4 motion */}
      <StageTitle badge="٢" label="المرحلة الثانية" title="استعادة الحركة" from={mo.from + 6} to={st.from} top={tTop - 10} />
      <AnkleInset from={mo.from + 14} to={st.from - 4} />
      <MoveArrow x={620} y={1230} rot={-12} from={mo.from + sec(1.2)} to={mo.from + sec(4.4)} />
      <MoveArrow x={620} y={1230} rot={-12} from={mo.from + sec(5.2)} to={st.from - 4} />

      {/* 5 strength */}
      <StageTitle badge="٣" label="المرحلة الثالثة" title="القوة والتوازن" from={st.from + 6} to={re.from} top={tTop - 10} />
      <MoveArrow x={560} y={1180} rot={8} from={st.from + sec(1.2)} to={st.from + sec(4.4)} />
      <InfoChip text="تقوية بإشراف أخصائي" from={st.from + sec(5.0)} to={re.from - 4} x={540} y={1010} />

      {/* 6 return */}
      <StageTitle badge="٤" label="المرحلة الرابعة" title="العودة التدريجية للرياضة" from={re.from + 6} to={closeFrom} top={tTop - 10} />
      <Progression from={re.from + sec(1.0)} to={closeFrom - 4} y={1060} />

      <SportsClosing from={closeFrom} dur={cl.from + cl.duration - closeFrom} />
      <FMCMedicalTimeline chapters={chapters} top={1405} left={layout.safe.left} right={layout.safe.right} showFrom={sec(0.8)} showTo={closeFrom + 6} size={21} activeSize={24} />
      <FMCLogoOverlay size={140} top={58} right={58} opacity={frame < closeFrom ? 1 : Math.max(0, 1 - (frame - closeFrom) / 10)} />
      {tl.map((item) => (item.audioFile ? <NarrationAudio key={`a-${item.id}`} file={item.audioFile} from={item.from + item.audioFrom} frames={item.audioFrames} /> : null))}
    </AbsoluteFill>
  );
};
