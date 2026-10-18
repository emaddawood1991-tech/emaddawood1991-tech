import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {COLORS} from '../../styles/theme';
import {ArabicText} from '../ArabicTitles';

/** Faint technical grid + vignette behind the 3D stage. */
export const HUDBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <div
        style={{
          position: 'absolute', inset: 0, opacity: 0.12,
          backgroundImage: `linear-gradient(${COLORS.silver} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.silver} 1px, transparent 1px)`,
          backgroundSize: '90px 90px',
          backgroundPosition: `0 ${frame * 0.4}px`,
          maskImage: 'radial-gradient(70% 60% at 50% 45%, #000 30%, transparent 100%)',
        }}
      />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(90% 80% at 50% 45%, transparent 55%, rgba(5,15,30,0.55) 100%)'}} />
    </>
  );
};

/** Corner brackets framing the anatomy viewport. */
export const HUDFrame: React.FC<{x: number; y: number; w: number; h: number; delay?: number}> = ({x, y, w, h, delay = 0}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const L = 70;
  const s = {position: 'absolute' as const, width: L, height: L, borderColor: COLORS.turquoise, opacity: 0.85 * t};
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
      <div style={{...s, left: 0, top: 0, borderLeft: '3px solid', borderTop: '3px solid'}} />
      <div style={{...s, right: 0, top: 0, borderRight: '3px solid', borderTop: '3px solid'}} />
      <div style={{...s, left: 0, bottom: 0, borderLeft: '3px solid', borderBottom: '3px solid'}} />
      <div style={{...s, right: 0, bottom: 0, borderRight: '3px solid', borderBottom: '3px solid'}} />
    </div>
  );
};

/** Callout: pulsing anchor dot on the anatomy, leader line to a label docked to the screen edge. */
export const Callout: React.FC<{
  label: string; anchor: [number, number]; labelY: number; edge: 'left' | 'right'; margin: number; delay: number; size: number; accent?: string; screenW: number;
}> = ({label, anchor, labelY, edge, margin, delay, size, accent = COLORS.turquoise, screenW}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const endX = edge === 'right' ? screenW - margin - size * 0.4 : margin + size * 0.4;
  const px = anchor[0] + (endX - anchor[0]) * t;
  const py = anchor[1] + (labelY - anchor[1]) * t;
  const ph = (frame % 45) / 45;
  return (
    <>
      <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}>
        <line x1={anchor[0]} y1={anchor[1]} x2={px} y2={py} stroke={accent} strokeWidth={2.5} opacity={0.9} />
        <circle cx={anchor[0]} cy={anchor[1]} r={8} fill={accent} opacity={t} />
        <circle cx={anchor[0]} cy={anchor[1]} r={8 + 16 * ph} fill="none" stroke={accent} strokeWidth={2} opacity={t * (1 - ph)} />
      </svg>
      <div
        style={{
          position: 'absolute', top: labelY, transform: 'translateY(-50%)',
          ...(edge === 'right' ? {right: margin} : {left: margin}),
          opacity: t, background: 'rgba(16,42,67,0.82)', border: `1.5px solid ${accent}`, borderRadius: 12,
          padding: `${size * 0.22}px ${size * 0.6}px`, backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
        }}
      >
        <ArabicText size={size} weight={600}>{label}</ArabicText>
      </div>
    </>
  );
};

/** Always-on tag clarifying that the 3D model is a simplified teaching model. */
export const EducationalTag: React.FC<{size: number; x: number; y: number}> = ({size, x, y}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translateX(-50%)', opacity: 0.85}}>
    <ArabicText size={size} weight={500} color={COLORS.silver}>نموذج تعليمي مبسّط — لا يمثّل حالة مريض بعينه</ArabicText>
  </div>
);
