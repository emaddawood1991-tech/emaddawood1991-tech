import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT_AR, FONT_DISPLAY} from '../../styles/theme';

type TextProps = {
  children: React.ReactNode;
  size: number;
  weight?: 500 | 600 | 700 | 800;
  color?: string;
  display?: boolean;
  align?: 'right' | 'center' | 'left';
  style?: React.CSSProperties;
};

/** Real RTL text layer. Never split into letters (that breaks Arabic joining). */
export const ArabicText: React.FC<TextProps> = ({children, size, weight = 600, color = COLORS.white, display, align = 'center', style}) => (
  <div
    dir="rtl"
    lang="ar"
    style={{
      fontFamily: display ? FONT_DISPLAY : FONT_AR,
      fontSize: size,
      fontWeight: weight,
      color,
      textAlign: align,
      lineHeight: 1.45,
      unicodeBidi: 'isolate',
      fontKerning: 'normal',
      letterSpacing: 0, // any letter-spacing breaks cursive Arabic
      wordBreak: 'keep-all',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Reveals by WORD (inline-block per word keeps shaping intact inside each word). */
export const AnimatedTitle: React.FC<Omit<TextProps, 'children'> & {delay?: number; stagger?: number; text: string}> = ({text, delay = 0, stagger = 4, ...rest}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  return (
    <ArabicText {...rest}>
      {words.map((w, i) => {
        const t = interpolate(frame - delay - i * stagger, [0, 14], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        return (
          <span key={i} style={{display: 'inline-block', opacity: t, transform: `translateY(${(1 - t) * 26}px)`, filter: `blur(${(1 - t) * 6}px)`}}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </ArabicText>
  );
};

/** Glass information card used for symptoms / key points. */
export const InfoCard: React.FC<{text: string; size: number; delay: number; accent?: string; width?: number}> = ({text, size, delay, accent = COLORS.turquoise, width}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <div
      style={{
        width,
        opacity: t,
        transform: `translateX(${(1 - t) * 60}px)`,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))',
        border: '1.5px solid rgba(255,255,255,0.22)',
        borderRight: `6px solid ${accent}`,
        borderRadius: 18,
        padding: `${size * 0.5}px ${size * 0.8}px`,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
      }}
    >
      <ArabicText size={size} weight={600} align="right">
        {text}
      </ArabicText>
    </div>
  );
};
