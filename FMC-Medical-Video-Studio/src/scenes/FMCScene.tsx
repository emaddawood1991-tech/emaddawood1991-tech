import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AnimatedTitle, InfoCard} from '../components/ArabicTitles';
import {HUDBackdrop} from '../components/MedicalHUD';
import {Presenter} from '../components/Presenter';
import {COLORS} from '../styles/theme';
import type {SceneProps} from './common';

/** FMC message: the presenter explains the services; urgent-care safety note stays on screen. */
export const FMCScene: React.FC<SceneProps> = ({scene, layout, item, speech}) => {
  const bullets = scene.onScreen.bullets ?? []; // [service, service, urgent-care note]
  const services = bullets.slice(0, 2);
  const note = bullets[2];
  const p = layout.portrait;
  const cardW = p ? 780 : 700;
  return (
    <>
      <HUDBackdrop />
      <AbsoluteFill>
        <div style={{position: 'absolute', left: p ? (layout.width - cardW) / 2 : layout.safe.left, top: p ? 250 : (layout.height - cardW * 0.976) / 2}}>
          <Presenter width={cardW} speech={speech} audioFrom={item.audioFrom} seed={5} />
        </div>
        <div style={{position: 'absolute', display: 'flex', flexDirection: 'column', gap: p ? 18 : 22, ...(p ? {left: layout.safe.left, right: layout.safe.right, top: 250 + cardW * 0.976 + 40} : {right: layout.safe.right, width: layout.width * 0.4, top: layout.height * 0.16})}}>
          <AnimatedTitle text={scene.onScreen.title ?? ''} size={p ? 64 : 60} weight={800} display delay={6} />
          {services.map((s, i) => (
            <InfoCard key={s} text={s} size={p ? 40 : 38} delay={26 + i * 18} />
          ))}
          {note && <InfoCard text={note} size={p ? 29 : 28} delay={70} accent={COLORS.amber} />}
        </div>
      </AbsoluteFill>
    </>
  );
};
