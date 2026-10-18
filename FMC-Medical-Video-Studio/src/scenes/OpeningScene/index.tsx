import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AnimatedTitle} from '../../components/ArabicTitles';
import {HUDBackdrop} from '../../components/MedicalHUD';
import {Presenter} from '../../components/Presenter';
import {LightSweep} from '../../components/SceneTransitions';
import type {SceneProps} from '../common';

/** 0–6 s: the FMC presenter introduces the topic. */
export const OpeningScene: React.FC<SceneProps> = ({scene, layout, item, speech}) => {
  const p = layout.portrait;
  const cardW = p ? 880 : 880;
  return (
    <>
      <HUDBackdrop />
      <AbsoluteFill>
        <div style={{position: 'absolute', left: p ? (layout.width - cardW) / 2 : layout.safe.left, top: p ? 240 : (layout.height - cardW * 0.976) / 2}}>
          <Presenter width={cardW} speech={speech} audioFrom={item.audioFrom} seed={1} />
        </div>
        <div style={{position: 'absolute', ...(p ? {left: layout.safe.left, right: layout.safe.right, top: 1150} : {right: layout.safe.right, width: layout.width * 0.32, top: layout.height * 0.34})}}>
          <AnimatedTitle text={scene.onScreen.title ?? scene.narration} size={p ? 74 : 70} weight={800} display delay={10} />
        </div>
      </AbsoluteFill>
      <LightSweep start={4} />
    </>
  );
};
