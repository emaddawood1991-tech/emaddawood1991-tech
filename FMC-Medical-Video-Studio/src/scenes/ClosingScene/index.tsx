import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LogoReveal} from '../../components/FMCBranding';
import {Presenter} from '../../components/Presenter';
import {LightSweep} from '../../components/SceneTransitions';
import type {SceneProps} from '../common';
import {FACE_VIEW} from '../common';

/** Presenter returns with the official logo, name and slogan. */
export const ClosingScene: React.FC<SceneProps> = ({layout, item, speech}) => {
  const p = layout.portrait;
  return (
    <>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 30, paddingTop: p ? 120 : 0}}>
        {p && <Presenter width={300} view={FACE_VIEW} speech={speech} audioFrom={item.audioFrom} seed={6} circle />}
        <LogoReveal plate={p ? 440 : 400} delay={6} titleSize={p ? 88 : 80} sloganSize={p ? 46 : 42} />
      </AbsoluteFill>
      {!p && (
        <div style={{position: 'absolute', left: layout.safe.left, top: (layout.height - 360) / 2}}>
          <Presenter width={360} view={FACE_VIEW} speech={speech} audioFrom={item.audioFrom} seed={6} circle />
        </div>
      )}
      <LightSweep start={8} length={50} />
    </>
  );
};
