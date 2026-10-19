/**
 * ORIGINAL local paper-collage primitives (SVG/CSS only) for health-awareness / prevention / simple-education scenes.
 * Locally generated — no video-generation API, no stock footage, no external assets, no audio of any kind.
 * Independent implementation; nothing is taken from the gbro-collage-broll repository (whose workflow is paid Gemini video generation).
 * NOT for anatomy: realistic 3D remains the medical visual. Arabic text is always a real text layer (use ArabicText), never baked into shapes.
 *
 * Determinism: all jitter comes from remotion `random(seed)`; the "stop-motion" look steps time on twos (steppedFrame).
 */
import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';

/** Frame snapped to a coarser step (12 fps feel at 30 fps with step 2–3). Camera/light should NOT use this. */
export const steppedFrame = (frame: number, step = 2) => Math.floor(frame / step) * step;

export type Pt = [number, number];

/** Hand-cut polygon: a regular n-gon-ish blob with seeded radius jitter. Pure function → testable. */
export const cutPath = (seed: string, w: number, h: number, sides = 7, jitter = 0.12): string => {
  const pts: Pt[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const r = 0.5 * (1 + (random(`${seed}-${i}`) - 0.5) * 2 * jitter);
    pts.push([w * (0.5 + Math.cos(a) * r), h * (0.5 + Math.sin(a) * r)]);
  }
  return `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}Z`;
};

/** Flat colour field with fine paper grain (SVG turbulence; deterministic). */
export const CollageField: React.FC<{color: string; grain?: number}> = ({color, grain = 0.07}) => (
  <AbsoluteFill style={{background: color}}>
    <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: grain * 6}}>
      <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" /><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.6 0" /></filter>
      <rect width="100%" height="100%" filter="url(#paper)" />
    </svg>
  </AbsoluteFill>
);

/** One cut-paper piece: seeded polygon, optional halftone dots, offset shadow. Place with absolute left/top. */
export const PaperCutout: React.FC<{seed: string; w: number; h: number; fill: string; halftone?: {color: string; size?: number; opacity?: number}; shadow?: boolean; sides?: number; style?: React.CSSProperties}> = ({seed, w, h, fill, halftone, shadow = true, sides = 7, style}) => {
  const d = cutPath(seed, w, h, sides);
  const pid = `ht-${seed}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', overflow: 'visible', ...style}}>
      {halftone && (
        <pattern id={pid} width={halftone.size ?? 14} height={halftone.size ?? 14} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx={(halftone.size ?? 14) / 2} cy={(halftone.size ?? 14) / 2} r={(halftone.size ?? 14) * 0.28} fill={halftone.color} />
        </pattern>
      )}
      {shadow && <path d={d} transform="translate(6,8)" fill="rgba(20,30,50,0.28)" />}
      <path d={d} fill={fill} />
      {halftone && <path d={d} fill={`url(#${pid})`} opacity={halftone.opacity ?? 0.5} />}
    </svg>
  );
};

/** Slides a piece in from an edge, stepped on twos, with a small seeded settle; hidden before `start`. */
export const AssemblePiece: React.FC<{start: number; from?: 'left' | 'right' | 'top' | 'bottom'; distance?: number; frames?: number; step?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({start, from = 'left', distance = 900, frames = 14, step = 2, children, style}) => {
  const f = steppedFrame(useCurrentFrame(), step);
  const t = interpolate(f - start, [0, frames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  if (f < start) return null;
  const dx = from === 'left' ? -1 : from === 'right' ? 1 : 0, dy = from === 'top' ? -1 : from === 'bottom' ? 1 : 0;
  const settle = Math.sin(Math.min(1, t) * Math.PI) * 0.015; // tiny overshoot-and-settle (paper dropped into place)
  return <div style={{position: 'absolute', inset: 0, transform: `translate(${dx * distance * (1 - t)}px, ${dy * distance * (1 - t)}px) rotate(${(1 - t) * dx * 4 + settle * 20}deg)`, ...style}}>{children}</div>;
};
