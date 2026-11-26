import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VideoProps} from '../lib/schema';
import {computeTimeline, totalFrames} from '../lib/timeline';
import {makeLayout} from '../styles/theme';
import {NarrationAudio} from '../lib/audioPolicy';
import {loadFonts} from '../styles/fonts';
import {FMCLogoOverlay} from '../components/FMCLogoOverlay';
import {FMCArabicTitle} from '../components/FMCArabicTitle';
import {InfoChip} from '../components/FMCMedicalHighlight';
import {SportsClosing, StageTitle} from '../scenes/sports/SportsParts';
import {CircleInset, DiscCross, FlexExtCompare, PowerTouch, Stage, StatCard} from '../scenes/catcow/CatCowParts';

export const durationForCatCow = (p: VideoProps) => totalFrames(computeTimeline(p.content, p.manifest));

export const CatCowReel: React.FC<VideoProps> = (props) => {
  loadFonts();
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const layout = makeLayout(width, height);
  const tl = useMemo(() => computeTimeline(props.content, props.manifest), [props.content, props.manifest]);
  const t = (id: string) => tl.find((x) => x.id === (id as any))!;
  const sec = (s: number) => Math.round(s * 30);
  const hk = t('cc_hook'), st = t('cc_stat'), dc = t('cc_disc'), sc = t('cc_science'), w1 = t('cc_w1'), w2 = t('cc_w2'), w3 = t('cc_w3'), w4 = t('cc_w4'), sf = t('cc_safe'), cl = t('closing');
  const end = (x: {from: number; duration: number}) => x.from + x.duration + 8;
  const closeFrom = cl.from + 4;
  const top = layout.safe.top - 40;
  const load = (start: number) => (f: number) => -Math.sin(2 * Math.PI * ((((f - start) * 0.5) % 60) / 60));
  const phaseChip = (from: number, to: number) => {
    const ph = ((((frame - from) * 0.5) % 60) / 60);
    const cat = ph < 0.5;
    return <InfoChip text={cat ? 'مع الزفير: تقويس لطيف نحو الأعلى' : 'مع الشهيق: تقعير لطيف نحو الأسفل'} from={from} to={to} x={540} y={1215} accent={cat ? '#F2A33A' : '#4FE6DA'} />;
  };
  return (
    <AbsoluteFill style={{background: '#0b1622', overflow: 'hidden'}}>
      {/* 1 hook */}
      <Stage cam="hero" from={hk.from} to={end(hk)} />
      <FMCArabicTitle text="ماذا يحدث لظهرك إذا مارست تمرين القطة والبقرة لمدة ٣٠ يوما؟" highlight="القطة والبقرة" from={hk.from + 8} dur={hk.duration - 6} top={top} left={layout.safe.left} right={layout.safe.right} />
      {/* 2 statistic (character stays low, infographic above) */}
      <Stage cam="hero" from={st.from} to={end(st)} scale={0.74} ty={430} />
      <StatCard from={st.from + 14} to={end(st) - 4} value={32.9} top={top + 90} />
      {/* 3 discs: Power Touch -> disc cross-section */}
      <Stage cam="close" from={dc.from} to={end(dc)} ty={190}><PowerTouch cam="close" from={dc.from + 10} to={end(dc) - 4} start={dc.from} lumbarOnly /></Stage>
      <DiscCross x={170} y={top + 70} w={740} from={dc.from + sec(1.4)} to={end(dc) - 4} load={load(dc.from)} />
      {/* 4 science: discs respond to loading, posture, daily activity */}
      <Stage cam="side" from={sc.from} to={end(sc)} ty={120}><PowerTouch cam="side" from={sc.from + 6} to={end(sc) - 4} start={sc.from} /></Stage>
      <DiscCross x={250} y={top + 60} w={580} from={sc.from + 8} to={end(sc) - 4} load={load(sc.from)} labels={false} />
      <FMCArabicTitle text="الأقراص تستجيب للحمل والوضعية والنشاط اليومي" highlight="تستجيب" from={sc.from + 4} dur={sc.duration} top={top + 520} left={layout.safe.left} right={layout.safe.right} />
      {/* 5 week 1 */}
      <Stage cam="hero" from={w1.from} to={end(w1)} />
      <FMCArabicTitle text="تمرين القطة والبقرة" highlight="القطة" from={w1.from + 6} dur={sec(10)} top={top} left={layout.safe.left} right={layout.safe.right} />
      {phaseChip(w1.from + sec(5), w1.from + sec(13))}
      <StageTitle badge="١" label="٣٠ يوما" title="الأسبوع الأول" from={w1.from + sec(13)} to={end(w1)} top={top - 10} />
      {/* 6 week 2 */}
      <Stage cam="side" from={w2.from} to={end(w2)} ty={160} />
      <StageTitle badge="٢" label="٣٠ يوما" title="الأسبوع الثاني" from={w2.from + 6} to={end(w2)} top={top - 10} />
      <CircleInset from={w2.from + 14} to={end(w2) - 4} cx={540} cy={560} r={230} load={load(w2.from)} />
      {/* 7 week 3 */}
      <Stage cam="close" from={w3.from} to={end(w3)} ty={150} />
      <StageTitle badge="٣" label="٣٠ يوما" title="الأسبوع الثالث" from={w3.from + 6} to={end(w3)} top={top - 10} />
      <FlexExtCompare from={w3.from + 14} to={end(w3) - 4} x={280} y={top + 170} />
      {/* 8 week 4 */}
      <Stage cam="side" from={w4.from} to={end(w4)} ty={120}><PowerTouch cam="side" from={w4.from + 8} to={end(w4) - 4} start={w4.from} /></Stage>
      <StageTitle badge="٤" label="٣٠ يوما" title="الأسبوع الرابع" from={w4.from + 6} to={end(w4)} top={top - 10} />
      {/* 9 safety */}
      <Stage cam="hero" from={sf.from} to={end(sf)} />
      <FMCArabicTitle text="تحرك بلطف وضمن المدى المريح" highlight="بلطف" from={sf.from + 6} dur={sf.duration} top={top} left={layout.safe.left} right={layout.safe.right} />
      <InfoChip text="أوقف التمرين إذا زادت الأعراض" from={sf.from + sec(2.5)} to={end(sf)} x={540} y={1215} accent="#F2A33A" />
      {/* 10 closing */}
      <SportsClosing from={closeFrom} dur={cl.from + cl.duration - closeFrom} />
      <FMCLogoOverlay size={140} top={58} right={58} opacity={frame < closeFrom ? 1 : Math.max(0, 1 - (frame - closeFrom) / 10)} />
      {tl.map((item) => (item.audioFile ? <NarrationAudio key={`a-${item.id}`} file={item.audioFile} from={item.from + item.audioFrom} frames={item.audioFrames} /> : null))}
    </AbsoluteFill>
  );
};
