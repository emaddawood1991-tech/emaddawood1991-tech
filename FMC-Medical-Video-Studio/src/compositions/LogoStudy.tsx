import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BG_GRADIENT} from '../styles/theme';
import {LogoBug, LogoMark} from '../components/FMCBranding';

/** Still-only comparison of logo placements on a dark and a light scene (used for design review, not rendered in videos). */
export const LogoStudy: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{background: BG_GRADIENT, width: 1080, height: 960}}>
      <LogoBug size={150} top={54} right={56} opacity={1} />
      <LogoMark size={150} top={54} right={260} variant="seal" />
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#f4f8fb,#dbe7f0)', top: 960, height: 960}}>
      <LogoMark size={150} top={54} right={56} variant="bare" />
      <LogoMark size={150} top={54} right={260} variant="seal" />
    </AbsoluteFill>
  </AbsoluteFill>
);
