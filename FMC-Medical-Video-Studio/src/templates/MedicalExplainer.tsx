import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VideoProps} from '../lib/schema';
import {computeTimeline, FPS, OVERLAP, totalFrames} from '../lib/timeline';
import {BG_GRADIENT, makeLayout} from '../styles/theme';
import {loadFonts} from '../styles/fonts';
import {SceneFade} from '../components/SceneTransitions';
import {ArabicText} from '../components/ArabicTitles';
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
const musicVolume = (windows: [number, number][], base = 0.16, ducked = 0.06) => (f: number) => {
  for (const [a, b] of windows) {
    if (f >= a - 12 && f <= b + 12) {
      const edge = Math.min(f - (a - 12), b + 12 - f, 12) / 12;
      return base + (ducked - base) * Math.max(0, Math.min(1, edge));
    }
  }
  return base;
};

export const MedicalExplainer: React.FC<VideoProps> = (props) => {
  loadFonts();
  const {width, height} = useVideoConfig();
  const frame = useCurrentFrame();
  const layout = makeLayout(width, height);
  const tl = timelineFor(props);
  const total = totalFrames(tl);
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
              <Comp scene={scene} layout={layout} item={item} footage={fp ? {file: fp.file, credit: fp.credit} : null} />
            </SceneFade>
          </Sequence>
        );
      })}

      {/* narration (real generated audio only) */}
      {tl.map((item) =>
        item.audioFile ? (
          <Sequence key={`a-${item.id}`} from={item.from + item.audioFrom} durationInFrames={item.audioFrames + 6} layout="none">
            <Audio src={staticFile(item.audioFile)} volume={1} />
          </Sequence>
        ) : null,
      )}
      {props.music && <Audio src={staticFile(props.music)} volume={musicVolume(windows)} loop />}
      {props.sfx &&
        tl.map((item, i) =>
          i > 0 ? (
            <Sequence key={`s-${item.id}`} from={item.from} durationInFrames={FPS * 2} layout="none">
              <Audio src={staticFile(props.sfx!)} volume={0.35} />
            </Sequence>
          ) : null,
        )}

      {(props.preview || props.label) && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: layout.portrait ? 40 : 20, display: 'flex', justifyContent: 'center', pointerEvents: 'none'}}>
          <div style={{fontFamily: 'monospace', fontSize: layout.portrait ? 26 : 20, letterSpacing: 2, color: '#fff', background: 'rgba(190,30,45,0.85)', padding: '8px 18px', borderRadius: 6}}>
            {props.label ?? 'PREVIEW · NO VOICEOVER · NOT FOR PUBLICATION'}
          </div>
        </div>
      )}
      <ProgressHairline frame={frame} total={total} />
    </AbsoluteFill>
  );
};

const ProgressHairline: React.FC<{frame: number; total: number}> = ({frame, total}) => (
  <div style={{position: 'absolute', left: 0, bottom: 0, height: 4, width: `${(frame / total) * 100}%`, background: 'rgba(0,166,166,0.8)'}} />
);

export {ArabicText, OVERLAP};
