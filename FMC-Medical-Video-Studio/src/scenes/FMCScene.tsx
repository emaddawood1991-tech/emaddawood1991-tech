import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AnimatedTitle, ArabicText, InfoCard} from '../components/ArabicTitles';
import {HUDBackdrop} from '../components/MedicalHUD';
import {COLORS} from '../styles/theme';
import type {SceneProps} from './common';

/** Scene 5 — connects the education to current FMC services, plus the urgent-care safety note. */
export const FMCScene: React.FC<SceneProps> = ({scene, layout}) => {
  const bullets = scene.onScreen.bullets ?? []; // [service, service, urgent-care note]
  const services = bullets.slice(0, 2);
  const note = bullets[2];
  const p = layout.portrait;
  return (
    <>
      <HUDBackdrop />
      <AbsoluteFill style={{padding: p ? `${layout.safe.top}px ${layout.safe.left}px ${layout.safe.bottom}px` : `${layout.safe.top}px ${layout.safe.right}px`, justifyContent: 'center', gap: p ? 44 : 36, alignItems: p ? 'stretch' : 'flex-end'}}>
        <div style={{width: p ? '100%' : '55%'}}>
          <AnimatedTitle text={scene.onScreen.title ?? ''} size={p ? 80 : 68} weight={800} display delay={6} />
        </div>
        {scene.onScreen.subtitle && (
          <div style={{width: p ? '100%' : '55%'}}>
            <ArabicText size={p ? 42 : 36} weight={500} color={COLORS.silver}>{scene.onScreen.subtitle}</ArabicText>
          </div>
        )}
        <div style={{display: 'flex', flexDirection: 'column', gap: 20, width: p ? '100%' : '55%'}}>
          {services.map((s, i) => (
            <InfoCard key={s} text={s} size={p ? 46 : 38} delay={26 + i * 18} />
          ))}
          {note && <InfoCard text={note} size={p ? 34 : 29} delay={70} accent={COLORS.amber} />}
        </div>
      </AbsoluteFill>
    </>
  );
};
