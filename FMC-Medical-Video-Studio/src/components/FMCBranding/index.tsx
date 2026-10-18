import React from 'react';
import {Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_DISPLAY} from '../../styles/theme';
import {ArabicText} from '../ArabicTitles';

/** Exact official name. Do not edit: QC fails any other spelling. */
export const CLINIC_NAME_AR = 'مركز الفيصل الطبي';
export const SLOGAN = 'Ideal Care – الرعاية المثالية';

/** Small unobtrusive name bug (text only; the logo file is never altered or recreated). */
export const NameBug: React.FC<{size: number}> = ({size}) => (
  <div style={{opacity: 0.8}}>
    <ArabicText size={size} weight={600} color={COLORS.silver}>{CLINIC_NAME_AR}</ArabicText>
  </div>
);

/** Corner logo for every scene: the original, unmodified file on a soft glass seal (see LogoMark). Replaced the square white sticker plate. */
export const LogoBug: React.FC<{size: number; top: number; right: number; opacity: number}> = ({size, top, right, opacity}) => (
  <LogoMark size={size} top={top} right={right} opacity={opacity} variant="seal" />
);

/**
 * Elegant logo placement variants (the supplied PNG is always shown untouched; only the surface behind it changes):
 *  - "seal"  (dark scenes) : soft circular glass seal — near-opaque warm white, hairline turquoise ring, shallow shadow. Reads as a brand seal, not a sticker.
 *  - "bare"  (light scenes): the transparent PNG directly on the scene, no plate.
 * Placement: top-right, inside the Instagram-safe corner (right ≥ 56 px, top ≥ 54 px).
 */
export const LogoMark: React.FC<{size: number; top: number; right: number; opacity?: number; variant?: 'seal' | 'bare'}> = ({size, top, right, opacity = 1, variant = 'seal'}) => (
  <div
    style={{
      position: 'absolute', top, right, width: size, height: size, opacity,
      ...(variant === 'seal'
        ? {borderRadius: '50%', background: 'rgba(255,255,255,0.94)', padding: size * 0.09, boxShadow: '0 6px 18px rgba(8,24,44,0.28)', border: `1.5px solid ${COLORS.turquoise}55`}
        : {}),
    }}
  >
    <Img src={staticFile('logo/fmc-original-logo.png')} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  </div>
);

/** Animated logo reveal. The supplied logo file is shown untouched on its own white plate. */
export const LogoReveal: React.FC<{plate: number; delay?: number; titleSize: number; sloganSize: number}> = ({plate, delay = 0, titleSize, sloganSize}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 18, stiffness: 90}});
  const reveal = interpolate(frame - delay, [0, 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const textT = interpolate(frame - delay - 26, [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const sloganT = interpolate(frame - delay - 40, [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const ringR = interpolate(frame - delay, [0, 45], [0.2, 1.6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: titleSize * 0.5}}>
      <div style={{position: 'relative', width: plate, height: plate}}>
        <div style={{position: 'absolute', inset: -plate * 0.06, borderRadius: '50%', border: `2px solid ${COLORS.turquoise}`, opacity: 0.5 * (1 - reveal * 0.7), transform: `scale(${ringR})`}} />
        <div
          style={{
            width: plate, height: plate, borderRadius: plate * 0.12, overflow: 'hidden', background: COLORS.white,
            boxShadow: '0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.25)',
            transform: `scale(${0.82 + 0.18 * s})`, opacity: reveal,
            clipPath: `circle(${reveal * 75}% at 50% 50%)`,
          }}
        >
          <Img src={staticFile('logo/fmc-original-logo.png')} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
        </div>
      </div>
      <div style={{opacity: textT, transform: `translateY(${(1 - textT) * 24}px)`}}>
        <ArabicText size={titleSize} weight={800} display>{CLINIC_NAME_AR}</ArabicText>
      </div>
      <div style={{opacity: sloganT, transform: `translateY(${(1 - sloganT) * 18}px)`, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: sloganSize, color: COLORS.turquoise, direction: 'rtl', unicodeBidi: 'isolate', textAlign: 'center'}}>
        {SLOGAN}
      </div>
    </div>
  );
};
