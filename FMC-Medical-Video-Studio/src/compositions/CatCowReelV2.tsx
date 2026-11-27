import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VideoProps} from '../lib/schema';
import {computeTimeline, totalFrames} from '../lib/timeline';
import {makeLayout} from '../styles/theme';
import {NarrationAudio} from '../lib/audioPolicy';
import {loadFonts} from '../styles/fonts';
import {FMCLogoOverlay} from '../components/FMCLogoOverlay';
import {FMCArabicTitle} from '../components/FMCArabicTitle';
import {AnatLabel, ChapterDots, ClosingV2, Clip2, lmPoint, PhaseChip, SoftHighlight, StatMini} from '../scenes/catcow2/CatCow2Parts';

export const durationForCatCow2 = (p: VideoProps) => totalFrames(computeTimeline(p.content, p.manifest));

/** FMC Cat-Cow V2: "تمرين تقويس الظهر ومدّه". Narration-driven; camera-varied Blender renders; no slideshow panels over the character. */
export const CatCowReelV2: React.FC<VideoProps> = (props) => {
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
  const dcMid = dc.from + Math.round(dc.duration * 0.5);
  const L = (clip: any, name: string, f: number, start: number, tf?: any) => lmPoint(clip, name, f, start, tf);
  const lum = (clip: any, start: number, tf?: any) => L(clip, 'L3', frame, start, tf);
  const chapters = [
    {label: 'المفهوم', from: 0, to: dc.from},
    {label: 'التشريح', from: dc.from, to: w1.from},
    {label: 'طريقة الأداء', from: w1.from, to: w2.from},
    {label: 'خطة ٣٠ يوما', from: w2.from, to: sf.from},
    {label: 'الأمان', from: sf.from, to: closeFrom},
  ];
  return (
    <AbsoluteFill style={{background: '#0b1622', overflow: 'hidden'}}>
      {/* 1 hook: full-body three-quarter view, studio, new terminology */}
      <Clip2 clip="hero_normal" from={hk.from} to={end(hk)} />
      <FMCArabicTitle text="تمرين تقويس الظهر ومدّه" highlight="تقويس الظهر" from={hk.from + 8} dur={hk.duration - 6} top={top} left={layout.safe.left} right={layout.safe.right} />
      {/* 2 statistic: compact card, character stays visible below */}
      <Clip2 clip="hero_normal" from={st.from} to={end(st)} scale={0.9} ty={120} />
      <StatMini from={st.from + 12} to={end(st) - 6} value={32.9} top={top + 40} />
      {/* 3 anatomy: body -> translucent layer -> vertebrae aligned (side x-ray) then disc cross-section orbit */}
      <Clip2 clip="side_xray" from={dc.from} to={dcMid + 8} />
      <AnatLabel text="الفقرات القطنية" ax={L('side_xray', 'L3', frame, dc.from)[0]} ay={L('side_xray', 'L3', frame, dc.from)[1]} tx={150} ty={1330} from={dc.from + sec(1.5)} to={dcMid} color="#7DF3EA" />
      <AnatLabel text="العجز" ax={L('side_xray', 'Sacrum', frame, dc.from)[0]} ay={L('side_xray', 'Sacrum', frame, dc.from)[1]} tx={150} ty={1450} from={dc.from + sec(3)} to={dcMid} color="#7DF3EA" />
      <Clip2 clip="anat_disc" from={dcMid} to={end(dc)} rate={0.5} />
      <AnatLabel text="الحلقة الليفية" ax={640} ay={900} tx={180} ty={1360} from={dcMid + sec(1.2)} to={end(dc) - 4} color="#F6D9A8" />
      <AnatLabel text="النواة الهلامية" ax={560} ay={960} tx={180} ty={1470} from={dcMid + sec(2.4)} to={end(dc) - 4} color="#8FC5FF" />
      {/* 4 science: lumbar flexion/extension stack + close x-ray; load shown qualitatively */}
      <Clip2 clip="anat_flex" from={sc.from} to={end(sc)} rate={0.5} />
      <FMCArabicTitle text="تتغير وضعية الفقرات والأحمال على الأقراص" highlight="الأحمال" from={sc.from + 6} dur={sc.duration - 4} top={top} left={layout.safe.left} right={layout.safe.right} />
      {/* 5 exercise how-to (demo): side view with phase chip and soft lumbar highlight */}
      <Clip2 clip="side_normal" from={w1.from} to={end(w1)} />
      <SoftHighlight x={lum('side_normal', w1.from)[0]} y={lum('side_normal', w1.from)[1]} r={170} from={w1.from + sec(4)} to={end(w1) - 6} />
      <PhaseChip from={w1.from + sec(3)} to={end(w1) - 4} y={1290} start={w1.from} />
      {/* 6 week 1: close lumbar view, learn the movement */}
      <Clip2 clip="close_normal" from={w2.from} to={end(w2)} />
      <FMCArabicTitle text="الأسبوع الأول: افهم الحركة" highlight="الأسبوع الأول" from={w2.from + 6} dur={w2.duration - 4} top={top} left={layout.safe.left} right={layout.safe.right} />
      <PhaseChip from={w2.from + sec(1.5)} to={end(w2) - 4} y={1290} start={w2.from} />
      {/* 7 weeks 2-3: top-down x-ray with lumbar close-up comparison */}
      <Clip2 clip="top_xray" from={w3.from} to={end(w3)} />
      <FMCArabicTitle text="الأسبوعان الثاني والثالث" highlight="الثاني والثالث" from={w3.from + 6} dur={w3.duration - 4} top={top} left={layout.safe.left} right={layout.safe.right} />
      {/* 8 week 4: full repetition, hero view; limits stated */}
      <Clip2 clip="hero_normal" from={w4.from} to={end(w4)} />
      <FMCArabicTitle text="النتائج تختلف بحسب الحالة" highlight="تختلف" from={w4.from + 6} dur={w4.duration - 4} top={top} left={layout.safe.left} right={layout.safe.right} />
      {/* 9 safety */}
      <Clip2 clip="hero_normal" from={sf.from} to={end(sf)} />
      <FMCArabicTitle text="تحرّك بلطف وضمن المدى المريح" highlight="بلطف" from={sf.from + 6} dur={sf.duration - 4} top={top} left={layout.safe.left} right={layout.safe.right} />
      {/* chapters + closing */}
      <ChapterDots items={chapters.map((c) => ({...c, to: c.to}))} top={820} />
      <ClosingV2 from={closeFrom} dur={cl.from + cl.duration - closeFrom} />
      <FMCLogoOverlay size={140} top={58} right={58} opacity={frame < closeFrom ? 1 : Math.max(0, 1 - (frame - closeFrom) / 10)} />
      {tl.map((item) => (item.audioFile ? <NarrationAudio key={`a-${item.id}`} file={item.audioFile} from={item.from + item.audioFrom} frames={item.audioFrames} /> : null))}
    </AbsoluteFill>
  );
};
