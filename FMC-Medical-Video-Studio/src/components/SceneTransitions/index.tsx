import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {OVERLAP} from '../../lib/timeline';

/** Crossfade with a slight scale+blur so scene hand-offs feel cinematic, never flashy. */
export const SceneFade: React.FC<{duration: number; first?: boolean; last?: boolean; children: React.ReactNode}> = ({duration, first, last, children}) => {
  const frame = useCurrentFrame();
  const inT = first ? 1 : interpolate(frame, [0, OVERLAP], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const outT = last ? 1 : interpolate(frame, [duration - OVERLAP, duration], [1, 0], {extrapolateLeft: 'clamp', easing: Easing.in(Easing.quad)});
  const o = Math.min(inT, outT);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, transform: `scale(${1 + (1 - o) * 0.025})`, filter: `blur(${(1 - o) * 8}px)`}}>
      {children}
    </div>
  );
};

/** A soft light sweep used on hook/closing moments. */
export const LightSweep: React.FC<{start: number; length?: number}> = ({start, length = 40}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const t = interpolate(frame - start, [0, length], [-0.3, 1.3], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const o = interpolate(frame - start, [0, length * 0.5, length], [0, 0.35, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: o, background: `linear-gradient(105deg, transparent ${t * 100 - 12}%, rgba(255,255,255,0.35) ${t * 100}%, transparent ${t * 100 + 12}%)`, width}} />
  );
};
