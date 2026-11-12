import React from 'react';
import {Composition} from 'remotion';
import {CharacterPreview} from './compositions/CharacterPreview';
import {LogoStudy} from './compositions/LogoStudy';
import {CollageStudy} from './compositions/CollageStudy';
import {WristStudy} from './compositions/WristStudy';
import {PoseLab} from './compositions/PoseLab';
import {SpineStudy} from './compositions/SpineStudy';
import {LimbStudy} from './compositions/LimbStudy';
import {KneeAlignmentEpisode, durationForKnee} from './compositions/KneeAlignmentEpisode';
import {SpineEarlyDetection, durationForSpineV2} from './compositions/SpineEarlyDetection';
import {SpineRealisticEpisode, durationForSpine} from './templates/SpineRealisticEpisode';
import {CarpalTunnelEpisode, durationForCarpal} from './templates/CarpalTunnelEpisode';
import {DoctorPreview} from './compositions/DoctorPreview';
import {DoctorExplainer, durationForDoctor} from './templates/DoctorExplainer';
import {AnatomyPreview} from './compositions/AnatomyPreview';
import {durationFor, MedicalExplainer} from './templates/MedicalExplainer';
import {VideoPropsSchema, ContentSchema, type VideoProps} from './lib/schema';
import {FPS} from './lib/timeline';
import lowerBackPain from '../content/lower-back-pain.json';

/** Studio default: preview of the example video with no audio. Real renders pass --props from scripts/render-video.ts */
const defaults: VideoProps = {content: ContentSchema.parse(lowerBackPain), manifest: null, footage: null, preview: true, label: null, visemes: null, styleKey: 'documentary', music: null, sfx: null};

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
    <Composition id="DoctorReel" component={DoctorExplainer} width={1080} height={1920} fps={FPS} durationInFrames={durationForDoctor(defaults)} schema={VideoPropsSchema} defaultProps={defaults} calculateMetadata={({props}) => ({durationInFrames: durationForDoctor(props)})} />
    <Composition id="CharacterPreview" component={CharacterPreview} width={1080} height={1920} fps={FPS} durationInFrames={340} defaultProps={{visemes: null}} />
    <Composition id="CollageStudy" component={CollageStudy} width={1080} height={1920} fps={FPS} durationInFrames={60} defaultProps={{}} />
    <Composition id="WristStudy" component={WristStudy} width={1080} height={1920} fps={FPS} durationInFrames={180} defaultProps={{}} />
    <Composition id="CarpalReel" component={CarpalTunnelEpisode} width={1080} height={1920} fps={FPS} durationInFrames={durationForCarpal(defaults)} schema={VideoPropsSchema} defaultProps={defaults} calculateMetadata={({props}) => ({durationInFrames: durationForCarpal(props)})} />
    <Composition id="SpineStudy" component={SpineStudy} width={1080} height={1920} fps={FPS} durationInFrames={1} defaultProps={{view: 'lateral'}} />
    <Composition id="SpineReel" component={SpineRealisticEpisode} width={1080} height={1920} fps={FPS} durationInFrames={durationForSpine(defaults)} schema={VideoPropsSchema} defaultProps={defaults} calculateMetadata={({props}) => ({durationInFrames: durationForSpine(props)})} />
    <Composition id="SpineV2" component={SpineEarlyDetection} width={1080} height={1920} fps={FPS} durationInFrames={durationForSpineV2(defaults)} schema={VideoPropsSchema} defaultProps={defaults} calculateMetadata={({props}) => ({durationInFrames: durationForSpineV2(props)})} />
    <Composition id="LimbStudy" component={LimbStudy} width={1080} height={1920} fps={FPS} durationInFrames={1} defaultProps={{state: 'knock', dist: 130}} />
    <Composition id="KneeReel" component={KneeAlignmentEpisode} width={1080} height={1920} fps={FPS} durationInFrames={durationForKnee(defaults)} schema={VideoPropsSchema} defaultProps={defaults} calculateMetadata={({props}) => ({durationInFrames: durationForKnee(props)})} />
    <Composition id="PoseLab" component={PoseLab} width={1080} height={1920} fps={FPS} durationInFrames={1} defaultProps={{}} />
    <Composition id="LogoStudy" component={LogoStudy} width={1080} height={1920} fps={FPS} durationInFrames={1} defaultProps={{}} />
    <Composition id="DoctorPreview" component={DoctorPreview} width={1080} height={1920} fps={FPS} durationInFrames={60} defaultProps={{}} />
    <Composition id="AnatomyPreview" component={AnatomyPreview} width={1080} height={1920} fps={FPS} durationInFrames={90} defaultProps={{}} />
  </>
);
