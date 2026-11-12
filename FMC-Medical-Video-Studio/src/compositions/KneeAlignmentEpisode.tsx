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
import {OpeningChildren} from '../scenes/knees/OpeningChildren';
import {KneeAndBowScenes} from '../scenes/knees/AlignmentScenes';
import {GrowthComparison} from '../scenes/knees/GrowthComparison';
import {EvaluationScene} from '../scenes/knees/EvaluationScene';

export const durationForKnee = (p: VideoProps) => totalFrames(computeTimeline(p.content, p.manifest));

export type KneeCtx = {op: TimelineItem; an: TimelineItem; sy: TimelineItem; tr: TimelineItem; fm: TimelineItem; cl: TimelineItem; sec: (s: number) => number; closeFrom: number; layout: Layout; width: number; height: number};

/** Episode: knock knees & bow legs in children. Timing derives from the real narration timeline. */
export const KneeAlignmentEpisode: React.FC<VideoProps> = (props) => {
  loadFonts();
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const layout = makeLayout(width, height);
  const tl = useMemo(() => computeTimeline(props.content, props.manifest), [props.content, props.manifest]);
  const t = (id: string) => tl.find((x) => x.id === id)!;
  const sec = (s: number) => Math.round(s * 30);
  const op = t('opening'), an = t('anatomy'), sy = t('symptoms'), tr = t('treatment'), fm = t('fmc'), cl = t('closing');
  const closeFrom = cl.from + sec(5.7); // the closing sentence naming the centre starts here
  const c: KneeCtx = {op, an, sy, tr, fm, cl, sec, closeFrom, layout, width, height};
  const chapters: Chapter[] = [
    {id: 'knock', num: '01', label: 'تقارب الركبتين', from: an.from, to: sy.from},
    {id: 'bow', num: '02', label: 'تقوس الساقين', from: sy.from, to: tr.from},
    {id: 'growth', num: '03', label: 'مراحل النمو', from: tr.from, to: fm.from},
    {id: 'eval', num: '04', label: 'متى نراجع الطبيب؟', from: fm.from, to: closeFrom},
  ];
  return (
    <AbsoluteFill style={{background: '#0e151c', overflow: 'hidden'}}>
      <OpeningChildren c={c} />
      <KneeAndBowScenes c={c} />
      <GrowthComparison c={c} />
      <EvaluationScene c={c} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 380, background: 'linear-gradient(180deg, rgba(6,16,28,0.6) 0%, rgba(6,16,28,0) 100%)', pointerEvents: 'none', opacity: frame >= closeFrom ? 0 : 1}} />
      <FMCClosingScene from={closeFrom} dur={cl.from + cl.duration - closeFrom} bgFile="footage/knock-knees-bow-legs/s6_bg.mp4" />
      <FMCMedicalTimeline chapters={chapters} top={1405} left={layout.safe.left} right={layout.safe.right} showFrom={an.from - 4} showTo={closeFrom + 6} size={22} activeSize={25} />
      <FMCLogoOverlay size={140} top={58} right={58} opacity={frame < closeFrom ? 1 : Math.max(0, 1 - (frame - closeFrom) / 10)} />
      {tl.map((item) => (item.audioFile ? <NarrationAudio key={`a-${item.id}`} file={item.audioFile} from={item.from + item.audioFrom} frames={item.audioFrames} /> : null))}
    </AbsoluteFill>
  );
};
