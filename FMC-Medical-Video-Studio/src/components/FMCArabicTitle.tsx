import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_DISPLAY} from '../styles/theme';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (t: number) => t * t * (3 - 2 * t);

/**
 * Kinetic Arabic headline. Words (never letters) rise in with a critically-damped spring (no bounce), a thin turquoise rule
 * draws first, and optional keywords get a colour + animated underline. Exits with a soft fade at `from + dur`.
 */
export const FMCArabicTitle: React.FC<{
  text: string;
  highlight?: string;
  from: number;
  dur: number;
  size?: number;
  top: number;
  left: number;
  right: number;
  accent?: string;
}> = ({text, highlight = '', from, dur, size = 64, top, left, right, accent = '#4FE6DA'}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const out = 1 - ss(clamp((f - (from + dur - 12)) / 12));
  if (f < from - 2 || out <= 0.001) return null;
  const hl = new Set(highlight.split(' ').filter(Boolean));
  const words = text.split(' ');
  const rule = ss(clamp((f - from) / 20));
  return (
    <div style={{position: 'absolute', left, right, top, opacity: out}}>
      <div style={{width: 120 * rule, height: 4, borderRadius: 2, background: accent, margin: '0 auto 16px', opacity: 0.9}} />
      <div dir="rtl" lang="ar" style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: size * 0.28, fontFamily: FONT_DISPLAY, fontSize: size, fontWeight: 800, lineHeight: 1.32, color: COLORS.white, textShadow: '0 2px 18px rgba(4,14,26,0.55)'}}>
        {words.map((w, i) => {
          const p = spring({frame: f - from - 4 - i * 3, fps, config: {damping: 200, mass: 0.9, stiffness: 110}});
          const isHl = hl.has(w.replace(/[؟,،.:]/g, ''));
          const u = ss(clamp((f - from - 4 - i * 3 - 12) / 16));
          return (
            <span key={i} style={{display: 'inline-block', position: 'relative', opacity: clamp(p), transform: `translateY(${(1 - p) * 34}px)`, filter: `blur(${(1 - clamp(p)) * 5}px)`, color: isHl ? accent : COLORS.white}}>
              {w}
              {isHl ? <span style={{position: 'absolute', right: 0, bottom: -4, height: 5, width: `${u * 100}%`, borderRadius: 3, background: accent, opacity: 0.9}} /> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
};
