import React from 'react';
import {Img, staticFile} from 'remotion';

/** Original FMC logo (transparent PNG, unmodified) in the upper-right corner; a soft shadow keeps it legible on any footage. */
export const FMCLogoOverlay: React.FC<{size: number; top: number; right: number; opacity: number}> = ({size, top, right, opacity}) => (
  <div style={{position: 'absolute', top, right, width: size, height: size, opacity, pointerEvents: 'none'}}>
    <div style={{position: 'absolute', inset: -10, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0) 72%)'}} />
    <Img src={staticFile('logo/fmc-original-logo.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))'}} />
  </div>
);
