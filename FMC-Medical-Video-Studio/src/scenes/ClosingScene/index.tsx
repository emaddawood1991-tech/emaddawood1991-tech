import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LogoReveal} from '../../components/FMCBranding';
import {LightSweep} from '../../components/SceneTransitions';
import type {SceneProps} from '../common';

export const ClosingScene: React.FC<SceneProps> = ({layout}) => (
  <>
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: layout.portrait ? layout.safe.bottom * 0.5 : 0}}>
      <LogoReveal plate={layout.portrait ? 520 : 440} delay={6} titleSize={layout.portrait ? 96 : 84} sloganSize={layout.portrait ? 50 : 44} />
    </AbsoluteFill>
    <LightSweep start={8} length={50} />
  </>
);
