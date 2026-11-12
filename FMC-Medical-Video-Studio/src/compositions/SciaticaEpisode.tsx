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
import {NerveAnatomyScene, PainPathScene, SymptomsOnBody} from '../scenes/sciatica/BodyAnatomyScenes';
import {ReliefScene, RedFlagScene, TherapyBridgeScene} from '../scenes/sciatica/ReliefScenes';

export type SciCtx = {op: TimelineItem; an: TimelineItem; sy: TimelineItem; sec: (s: number) => number; layout: Layout; width: number; height: number};

/** Part 1 of the sciatica episode (pain pathway, nerve anatomy, symptoms). The movement sections need real exercise footage (see output/Sciatica). */
const part1Items = (p: VideoProps) => {
  const sub = {...p.content, scenes: p.content.scenes.filter((s) => ['opening', 'anatomy', 'symptoms'].includes(s.id))};
  return {sub, man: p.manifest ? {...p.manifest, scenes: p.manifest.scenes.filter((s) => ['opening', 'anatomy', 'symptoms'].includes(s.id))} : null};
};
const END_CARD = 120;
export const durationForSciPart1 = (p: VideoProps) => {
  const {sub, man} = part1Items(p);
  return totalFrames(computeTimeline(sub, man)) + END_CARD;
};

export const SciaticaPart1: React.FC<VideoProps> = (props) => {
  loadFonts();
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const layout = makeLayout(width, height);
  const {sub, man} = useMemo(() => part1Items(props), [props.content, props.manifest]);
  const tl = useMemo(() => computeTimeline(sub, man), [sub, man]);
  const t = (id: string) => tl.find((x) => x.id === id)!;
  const sec = (s: number) => Math.round(s * 30);
  const op = t('opening'), an = t('anatomy'), sy = t('symptoms');
  const endMain = sy.from + sy.duration;
  const c: SciCtx = {op, an, sy, sec, layout, width, height};
  const chapters: Chapter[] = [
    {id: 'path', num: '01', label: 'مسار الألم', from: 0, to: an.from},
    {id: 'anat', num: '02', label: 'التشريح', from: an.from, to: endMain},
    {id: 'm1', num: '03', label: 'تمديد الظهر', from: endMain, to: endMain + 1},
    {id: 'm2', num: '04', label: 'الدوران الجانبي', from: endMain + 1, to: endMain + 2},
    {id: 'm3', num: '05', label: 'تمديد الورك', from: endMain + 2, to: endMain + 3},
    {id: 'safe', num: '06', label: 'الأمان', from: endMain + 3, to: endMain + 4},
  ];
  return (
    <AbsoluteFill style={{background: '#0e151c', overflow: 'hidden'}}>
      <PainPathScene c={c} />
      <NerveAnatomyScene c={c} />
      <SymptomsOnBody c={c} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 380, background: 'linear-gradient(180deg, rgba(6,16,28,0.55) 0%, rgba(6,16,28,0) 100%)', pointerEvents: 'none', opacity: frame >= endMain ? 0 : 1}} />
      <FMCClosingScene from={endMain} dur={END_CARD} bgFile="footage/sciatica/back_blur_bg.mp4" />
      <FMCMedicalTimeline chapters={chapters} top={1405} left={layout.safe.left} right={layout.safe.right} showFrom={sec(0.8)} showTo={endMain + 6} size={21} activeSize={24} />
      <FMCLogoOverlay size={140} top={58} right={58} opacity={frame < endMain ? 1 : Math.max(0, 1 - (frame - endMain) / 10)} />
      {tl.map((item) => (item.audioFile ? <NarrationAudio key={`a-${item.id}`} file={item.audioFile} from={item.from + item.audioFrom} frames={item.audioFrames} /> : null))}
    </AbsoluteFill>
  );
};


export type ReliefCtx = SciCtx & {tr: TimelineItem; fm: TimelineItem; sf: TimelineItem; cl: TimelineItem};
export const durationForSciRelief = (p: VideoProps) => totalFrames(computeTimeline(p.content, p.manifest));

/** Sciatica: what the pain is, where it travels, and how it can be eased. The stretching section will be added from footage supplied by the user. */
export const SciaticaRelief: React.FC<VideoProps> = (props) => {
  loadFonts();
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const layout = makeLayout(width, height);
  const tl = useMemo(() => computeTimeline(props.content, props.manifest), [props.content, props.manifest]);
  const t = (id: string) => tl.find((x) => x.id === id)!;
  const sec = (s: number) => Math.round(s * 30);
  const op = t('opening'), an = t('anatomy'), sy = t('symptoms'), tr = t('treatment'), fm = t('fmc'), sf = t('safety'), cl = t('closing');
  const closeFrom = cl.from + 4;
  const c: ReliefCtx = {op, an, sy, sec, layout, width, height, tr, fm, sf, cl};
  const chapters: Chapter[] = [
    {id: 'path', num: '01', label: 'مسار الألم', from: 0, to: an.from},
    {id: 'anat', num: '02', label: 'التشريح', from: an.from, to: tr.from},
    {id: 'relief', num: '03', label: 'تخفيف الألم', from: tr.from, to: sf.from},
    {id: 'doctor', num: '04', label: 'متى نراجع الطبيب؟', from: sf.from, to: closeFrom},
  ];
  return (
    <AbsoluteFill style={{background: '#0e151c', overflow: 'hidden'}}>
      <PainPathScene c={c} />
      <NerveAnatomyScene c={c} />
      <SymptomsOnBody c={c} />
      <ReliefScene c={c} />
      <TherapyBridgeScene c={c} />
      <RedFlagScene c={c} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 380, background: 'linear-gradient(180deg, rgba(6,16,28,0.55) 0%, rgba(6,16,28,0) 100%)', pointerEvents: 'none', opacity: frame >= closeFrom ? 0 : 1}} />
      <FMCClosingScene from={closeFrom} dur={cl.from + cl.duration - closeFrom} bgFile="footage/sciatica/back_blur_bg.mp4" />
      <FMCMedicalTimeline chapters={chapters} top={1405} left={layout.safe.left} right={layout.safe.right} showFrom={sec(0.8)} showTo={closeFrom + 6} size={23} activeSize={26} />
      <FMCLogoOverlay size={140} top={58} right={58} opacity={frame < closeFrom ? 1 : Math.max(0, 1 - (frame - closeFrom) / 10)} />
      {tl.map((item) => (item.audioFile ? <NarrationAudio key={`a-${item.id}`} file={item.audioFile} from={item.from + item.audioFrom} frames={item.audioFrames} /> : null))}
    </AbsoluteFill>
  );
};
