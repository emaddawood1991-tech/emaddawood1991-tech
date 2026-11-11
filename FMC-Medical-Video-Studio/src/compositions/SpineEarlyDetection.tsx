import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VideoProps} from '../lib/schema';
import {computeTimeline, totalFrames, type TimelineItem} from '../lib/timeline';
import {makeLayout, type Layout} from '../styles/theme';
import {NarrationAudio} from '../lib/audioPolicy';
import {loadFonts} from '../styles/fonts';
import {FMCMedicalTimeline, type Chapter} from '../components/FMCMedicalTimeline';
import {FMCLogoOverlay} from '../components/FMCLogoOverlay';
import {FMCClosingScene} from '../components/FMCClosingScene';
import {ShoulderScreening} from '../scenes/spine/ShoulderScreening';
import {ScoliosisExplanation} from '../scenes/spine/ScoliosisExplanation';
import {KyphosisComparison} from '../scenes/spine/KyphosisComparison';
import {ClinicalAssessment} from '../scenes/spine/ClinicalAssessment';
import {EarlyDetection} from '../scenes/spine/EarlyDetection';

export const durationForSpineV2 = (p: VideoProps) => totalFrames(computeTimeline(p.content, p.manifest));

/** Shared scene timing, derived from the REAL narration timeline (nothing hard-coded to seconds except beat offsets inside scenes). */
export type SpineCtx = {
  op: TimelineItem; an: TimelineItem; sy: TimelineItem; tr: TimelineItem; fm: TimelineItem; cl: TimelineItem;
  x1: number; sp3d: number; trXray: number;
  sec: (s: number) => number;
  layout: Layout; width: number; height: number;
};

export const SpineEarlyDetection: React.FC<VideoProps> = (props) => {
  loadFonts();
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const layout = makeLayout(width, height);
  const tl = useMemo(() => computeTimeline(props.content, props.manifest), [props.content, props.manifest]);
  const t = (id: string) => tl.find((x) => x.id === id)!;
  const sec = (s: number) => Math.round(s * 30);
  const op = t('opening'), an = t('anatomy'), sy = t('symptoms'), tr = t('treatment'), fm = t('fmc'), cl = t('closing');
  const x1 = an.from + sec(4.1);          // radiograph appears with the word "الجنف" approaching
  const sp3d = an.from + sec(6.3);         // larger 3D spine
  const trXray = tr.from + sec(3.5);       // clinician reviewing a radiograph
  const c: SpineCtx = {op, an, sy, tr, fm, cl, x1, sp3d, trXray, sec, layout, width, height};
  const chapters: Chapter[] = [
    {id: 'signs', num: '01', label: 'العلامات', from: 0, to: x1},
    {id: 'scoliosis', num: '02', label: 'الجنف', from: x1, to: sy.from},
    {id: 'kyphosis', num: '03', label: 'الحدبة', from: sy.from, to: tr.from},
    {id: 'diagnosis', num: '04', label: 'التشخيص', from: tr.from, to: fm.from},
    {id: 'early', num: '05', label: 'الكشف المبكر', from: fm.from, to: cl.from},
  ];
  return (
    <AbsoluteFill style={{background: '#0e151c', overflow: 'hidden'}}>
      <ShoulderScreening c={c} />
      <ScoliosisExplanation c={c} />
      <KyphosisComparison c={c} />
      <ClinicalAssessment c={c} />
      <EarlyDetection c={c} />
      {/* legibility scrim for titles */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 380, background: 'linear-gradient(180deg, rgba(6,16,28,0.62) 0%, rgba(6,16,28,0) 100%)', pointerEvents: 'none', opacity: frame >= cl.from + 10 ? 0 : 1}} />
      <FMCClosingScene from={cl.from} dur={cl.duration} bgFile="footage/spine-realistic/s6_bg.mp4" />
      <FMCMedicalTimeline chapters={chapters} top={1405} left={layout.safe.left} right={layout.safe.right} showFrom={sec(0.6)} showTo={cl.from + 6} />
      <FMCLogoOverlay size={140} top={58} right={58} opacity={frame < cl.from ? 1 : Math.max(0, 1 - (frame - cl.from) / 10)} />
      {tl.map((item) => (item.audioFile ? <NarrationAudio key={`a-${item.id}`} file={item.audioFile} from={item.from + item.audioFrom} frames={item.audioFrames} /> : null))}
    </AbsoluteFill>
  );
};
