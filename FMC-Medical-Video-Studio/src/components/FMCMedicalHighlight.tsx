import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT_AR} from '../styles/theme';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ss = (t: number) => t * t * (3 - 2 * t);
export const TURQ = '#4FE6DA';

/** Fade window helper: 0→1 over `fin` frames from `from`, 1→0 over `fout` frames ending at `to`. */
export const win = (f: number, from: number, to: number, fin = 12, fout = 12) => Math.min(ss(clamp((f - from) / fin)), 1 - ss(clamp((f - (to - fout)) / fout)));

/** Thin animated guide line in screen/source coordinates; draws from p0 toward p1. */
export const GuideLine: React.FC<{p0: [number, number]; p1: [number, number]; from: number; to: number; draw?: number; dashed?: boolean; color?: string; width?: number}> = ({p0, p1, from, to, draw = 20, dashed, color = TURQ, width = 3}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 8, 14);
  if (o <= 0.001) return null;
  const k = ss(clamp((f - from) / draw));
  const x = p0[0] + (p1[0] - p0[0]) * k, y = p0[1] + (p1[1] - p0[1]) * k;
  return (
    <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: o}}>
      <line x1={p0[0]} y1={p0[1]} x2={x} y2={y} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? '14 12' : undefined} opacity={0.9} />
    </svg>
  );
};

/** Ring marker with a soft, slow pulse (no flashing). */
export const RingMarker: React.FC<{x: number; y: number; r?: number; from: number; to: number; color?: string}> = ({x, y, r = 28, from, to, color = TURQ}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 10, 14);
  if (o <= 0.001) return null;
  const pop = ss(clamp((f - from) / 14));
  const pulse = 1 + 0.06 * Math.sin((f - from) / 9);
  return (
    <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: o}}>
      <circle cx={x} cy={y} r={r * pop * pulse} fill="rgba(79,230,218,0.10)" stroke={color} strokeWidth={3} />
      <circle cx={x} cy={y} r={5 * pop} fill={color} />
    </svg>
  );
};

/** Four corner brackets framing a region (observation frame). */
export const CornerBrackets: React.FC<{x: number; y: number; w: number; h: number; from: number; to: number; len?: number; color?: string}> = ({x, y, w, h, from, to, len = 70, color = TURQ}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 14, 14);
  if (o <= 0.001) return null;
  const k = ss(clamp((f - from) / 18));
  const L = len * k;
  const p = (d: string) => <path d={d} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />;
  return (
    <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: o * 0.95}}>
      {p(`M${x},${y + L} L${x},${y} L${x + L},${y}`)}
      {p(`M${x + w - L},${y} L${x + w},${y} L${x + w},${y + L}`)}
      {p(`M${x},${y + h - L} L${x},${y + h} L${x + L},${y + h}`)}
      {p(`M${x + w - L},${y + h} L${x + w},${y + h} L${x + w},${y + h - L}`)}
    </svg>
  );
};

/** Horizontal scan line sweeping once through a region. */
export const ScanLine: React.FC<{x: number; w: number; y0: number; y1: number; from: number; dur: number; color?: string}> = ({x, w, y0, y1, from, dur, color = TURQ}) => {
  const f = useCurrentFrame();
  const k = clamp((f - from) / dur);
  if (k <= 0 || k >= 1) return null;
  const y = y0 + (y1 - y0) * ss(k);
  const o = Math.sin(Math.PI * k) * 0.7;
  return <div style={{position: 'absolute', left: x, width: w, top: y, height: 3, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: o}} />;
};

/** Educational chip (≥ 38 px Arabic). Rises softly; one per idea. */
export const InfoChip: React.FC<{text: string; from: number; to: number; x: number; y: number; accent?: string; align?: 'center' | 'right'}> = ({text, from, to, x, y, accent = TURQ, align = 'center'}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 14, 14);
  if (o <= 0.001) return null;
  const k = ss(clamp((f - from) / 18));
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(${align === 'center' ? '-50%' : '-100%'}, ${(1 - k) * 22}px)`, opacity: o}}>
      <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 30px 12px 26px', borderRadius: 18, background: 'rgba(9,24,42,0.74)', border: '1.5px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 30px rgba(0,0,0,0.28)'}}>
        <span style={{width: 10, height: 10, borderRadius: 5, background: accent}} />
        <span style={{fontFamily: FONT_AR, fontSize: 40, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap'}}>{text}</span>
      </div>
    </div>
  );
};

/** Small medical label attached to a point by a hairline leader. */
export const LeaderLabel: React.FC<{text: string; at: [number, number]; label: [number, number]; from: number; to: number; accent?: string; size?: number}> = ({text, at, label, from, to, accent = TURQ, size = 38}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 14, 14);
  if (o <= 0.001) return null;
  const k = ss(clamp((f - from) / 16));
  return (
    <>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: o}}>
        <line x1={label[0]} y1={label[1]} x2={label[0] + (at[0] - label[0]) * k} y2={label[1] + (at[1] - label[1]) * k} stroke={accent} strokeWidth={2.5} />
        <circle cx={at[0]} cy={at[1]} r={7 * k} fill={accent} />
      </svg>
      <div style={{position: 'absolute', left: label[0], top: label[1], transform: 'translate(-50%,-50%)', opacity: o}}>
        <div dir="rtl" style={{padding: '8px 22px', borderRadius: 14, background: 'rgba(9,24,42,0.78)', border: `1.5px solid ${accent}`, fontFamily: FONT_AR, fontSize: size, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap'}}>{text}</div>
      </div>
    </>
  );
};
