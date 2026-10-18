import React from 'react';
import {Composition} from 'remotion';
import {AnatomyPreview} from './compositions/AnatomyPreview';
import {durationFor, MedicalExplainer} from './templates/MedicalExplainer';
import {VideoPropsSchema, ContentSchema, type VideoProps} from './lib/schema';
import {FPS} from './lib/timeline';
import lowerBackPain from '../content/lower-back-pain.json';

/** Studio default: preview of the example video with no audio. Real renders pass --props from scripts/render-video.ts */
const defaults: VideoProps = {content: ContentSchema.parse(lowerBackPain), manifest: null, footage: null, preview: true, label: null, visemes: null, music: null, sfx: null};

export const Root: React.FC = () => (
  <>
    <Composition
      id="Reel"
      component={MedicalExplainer}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={durationFor(defaults)}
      schema={VideoPropsSchema}
      defaultProps={defaults}
      calculateMetadata={({props}) => ({durationInFrames: durationFor(props)})}
    />
    <Composition
      id="TV"
      component={MedicalExplainer}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={durationFor(defaults)}
      schema={VideoPropsSchema}
      defaultProps={defaults}
      calculateMetadata={({props}) => ({durationInFrames: durationFor(props)})}
    />
    <Composition id="AnatomyPreview" component={AnatomyPreview} width={1080} height={1920} fps={FPS} durationInFrames={90} defaultProps={{}} />
  </>
);
