import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VideoProps} from '../lib/schema';
import {computeTimeline, FPS, OVERLAP, totalFrames} from '../lib/timeline';
import {BG_GRADIENT, makeLayout} from '../styles/theme';
import {loadFonts} from '../styles/fonts';
import {SceneFade} from '../components/SceneTransitions';
import {ArabicText} from '../components/ArabicTitles';
import {LogoBug} from '../components/FMCBranding';
import {NarrationAudio} from '../lib/audioPolicy';
import {OpeningScene} from '../scenes/OpeningScene';
import {AnatomyScene} from '../scenes/AnatomyScene';
import {SymptomsScene} from '../scenes/SymptomsScene';
import {TreatmentScene} from '../scenes/TreatmentScene';
import {FMCScene} from '../scenes/FMCScene';
import {ClosingScene} from '../scenes/ClosingScene';
import type {SceneProps} from '../scenes/common';
import type {SceneId} from '../lib/schema';

const SCENES: Record<SceneId, React.FC<SceneProps>> = {
  opening: OpeningScene,
  anatomy: AnatomyScene,
  symptoms: SymptomsScene,
  treatment: TreatmentScene,
  fmc: FMCScene,
  closing: ClosingScene,
};

export const timelineFor = (p: VideoProps) => computeTimeline(p.content, p.manifest);
export const durationFor = (p: VideoProps) => totalFrames(timelineFor(p));

/** Music bed ducks under narration so the voice always sits on top. */
export const MedicalExplainer: React.FC<VideoProps> = (props) => {
  loadFonts();
  const {width, height} = useVideoConfig();
  const frame = useCurrentFrame();
  const layout = makeLayout(width, height);
  const tl = timelineFor(props);
  const total = totalFrames(tl);
  const closing = tl[tl.length - 1];
  const logoOpacity = frame < closing.from ? 1 : Math.max(0, 1 - (frame - closing.from) / 10); // closing scene shows the large logo instead
  const windows = tl.filter((t) => t.audioFile).map((t) => [t.from + t.audioFrom, t.from + t.audioFrom + t.audioFrames] as [number, number]);

  return (
    <AbsoluteFill style={{background: BG_GRADIENT, overflow: 'hidden'}}>
      {tl.map((item, i) => {
        const scene = props.content.scenes[i];
        const Comp = SCENES[item.id];
        const fp = props.footage?.[item.id] ?? null;
        return (
          <Sequence key={item.id} from={item.from} durationInFrames={item.duration} layout="none">
            <SceneFade duration={item.duration} first={i === 0} last={i === tl.length - 1}>
              <Comp scene={scene} layout={layout} item={item} footage={fp ? {file: fp.file, credit: fp.credit} : null} speech={props.visemes?.scenes[item.id] ?? null} />
            </SceneFade>
          </Sequence>
        );
      })}

      {/* AUDIO POLICY (src/lib/audioPolicy.tsx): narration is the only audio rendered here. Music is mixed in post;
          all effect categories are disabled by policy and have no render path here. */}
      {tl.map((item) => (item.audioFile ? <NarrationAudio key={`a-${item.id}`} file={item.audioFile} from={item.from + item.audioFrom} frames={item.audioFrames} /> : null))}

      {/* No on-screen production-status banner. Review/draft status lives in the internal QC report only. */}
      <LogoBug size={layout.portrait ? 150 : 130} top={layout.portrait ? 54 : 40} right={layout.portrait ? 56 : 60} opacity={logoOpacity} />
    </AbsoluteFill>
  );
};


export {ArabicText, OVERLAP};
