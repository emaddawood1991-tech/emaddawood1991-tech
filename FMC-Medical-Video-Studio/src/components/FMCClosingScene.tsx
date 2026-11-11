import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {CameraBox, CrossLayer, Footage} from './FMCCinematicTransition';
import {FONT_DISPLAY, FONT_AR} from '../styles/theme';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (t: number) => t * t * (3 - 2 * t);

/** Premium branded close: deep navy over softly blurred clinic footage, a soft light halo behind the ORIGINAL logo, white/turquoise Arabic type. */
export const FMCClosingScene: React.FC<{from: number; dur: number; bgFile: string}> = ({from, dur, bgFile}) => {
  const f = useCurrentFrame();
  const t = f - from;
  const logoIn = ss(clamp((t - 8) / 26));
  const nameIn = ss(clamp((t - 30) / 22));
  const sloganIn = ss(clamp((t - 48) / 22));
  const depth = 1 + 0.035 * clamp(t / dur);
  return (
    <CrossLayer from={from} dur={dur + 40} fade={16}>
      <CameraBox from={from} dur={dur} cam={{s0: 1.04, s1: 1.1}}><Footage file={bgFile} /></CameraBox>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,26,46,0.9) 0%, rgba(11,38,66,0.88) 55%, rgba(8,26,46,0.94) 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 34% at 50% 38%, rgba(79,230,218,0.16) 0%, rgba(79,230,218,0) 70%)'}} />
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div style={{position: 'absolute', top: 410, width: 560, height: 560, transform: `scale(${(0.9 + 0.1 * logoIn) * depth})`, opacity: logoIn}}>
          <div style={{position: 'absolute', inset: -60, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.94) 0%, rgba(240,248,252,0.82) 48%, rgba(240,248,252,0) 70%)'}} />
          <Img src={staticFile('logo/fmc-original-logo.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain'}} />
        </div>
        <div dir="rtl" style={{position: 'absolute', top: 1086, opacity: nameIn, transform: `translateY(${(1 - nameIn) * 26}px)`, fontFamily: FONT_DISPLAY, fontSize: 92, fontWeight: 800, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.5)'}}>مركز الفيصل الطبي</div>
        <div style={{position: 'absolute', top: 1218, width: 160 * sloganIn, height: 4, borderRadius: 2, background: '#4FE6DA'}} />
        <div dir="rtl" style={{position: 'absolute', top: 1248, opacity: sloganIn, transform: `translateY(${(1 - sloganIn) * 20}px)`, fontFamily: FONT_AR, fontSize: 52, fontWeight: 600, color: '#7DF3EA'}}>الرعاية المثالية</div>
        <div style={{position: 'absolute', top: 1328, opacity: sloganIn * 0.9, fontFamily: FONT_AR, fontSize: 34, fontWeight: 500, color: '#D6E4EE', letterSpacing: 2}}>Ideal Care</div>
      </AbsoluteFill>
    </CrossLayer>
  );
};
