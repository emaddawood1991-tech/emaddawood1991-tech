import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ss, win} from '../../components/FMCMedicalHighlight';
import {FONT_AR} from '../../styles/theme';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export type CutSpec = {name: string; len: number; ss?: number; speed?: number; zoom?: [number, number]; origin?: string; pan?: [number, number, number, number]};

/** Pre-cropped realistic footage (assets/neck/cuts) with crossfade, slow camera push and a transformed space shared by tracked overlays (children). `from` = absolute start frame, len = seconds. */
export const Cut: React.FC<{c: CutSpec; from: number; fade?: number; children?: React.ReactNode}> = ({c, from, fade = 10, children}) => {
  const f = useCurrentFrame();
  const dur = Math.round(c.len * 30);
  if (f < from - 1 || f > from + dur + 1) return null;
  const o = Math.min(ss(clamp((f - from) / fade)), 1 - ss(clamp((f - (from + dur - fade)) / fade)));
  const [z0, z1] = c.zoom ?? [1.0, 1.06];
  const k = ss(clamp((f - from) / dur));
  const z = z0 + (z1 - z0) * k;
  const [px0, py0, px1, py1] = c.pan ?? [0, 0, 0, 0];
  const tx = px0 + (px1 - px0) * k, ty = py0 + (py1 - py0) * k;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <AbsoluteFill style={{transform: `translate(${tx}px, ${ty}px) scale(${z})`, transformOrigin: c.origin ?? '50% 50%'}}>
        <Sequence from={from} durationInFrames={dur + 2} layout="none">
          <OffthreadVideo src={staticFile(`neck/cuts/${c.name}.mp4`)} muted playbackRate={c.speed ?? 1} startFrom={Math.round((c.ss ?? 0) * 30)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </Sequence>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Piecewise-linear keyframes [t(sec since clip start), x, y] -> position at frame f. Hand-keyed from the footage (verified on stills). */
export const kf = (pts: [number, number, number][], t: number): [number, number] => {
  if (t <= pts[0][0]) return [pts[0][1], pts[0][2]];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const a = pts[i - 1], b = pts[i], u = ss((t - a[0]) / (b[0] - a[0]));
      return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    }
  }
  const l = pts[pts.length - 1];
  return [l[1], l[2]];
};

/** Subtle red-orange pain localisation: soft radial gradient + very thin ring, gentle pulse. Follows (x,y) in the host transformed space. */
export const PainGlow: React.FC<{x: number; y: number; r?: number; from: number; to: number; color?: string; strength?: number}> = ({x, y, r = 120, from, to, color = '#FF3B1F', strength = 0.9}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 16, 16) * strength;
  if (o <= 0.001) return null;
  const p = 1 + 0.07 * Math.sin((f - from) / 8);
  return (
    <div style={{position: 'absolute', left: x - r * p, top: y - r * p, width: r * 2 * p, height: r * 2 * p, borderRadius: '50%', opacity: o, background: `radial-gradient(circle, ${color}E6 0%, ${color}99 38%, ${color}00 74%)`, boxShadow: `0 0 0 3px ${color}AA inset, 0 0 24px ${color}88`}} />
  );
};

/** Cervical anatomy render (Blender, transparent PNG) aligned over the real person. */
export const AnatOverlay: React.FC<{src: string; x: number; y: number; scale: number; rot?: number; from: number; to: number; opacity?: number; flip?: boolean; w?: number; h?: number}> = ({src, x, y, scale, rot = 0, from, to, opacity = 0.92, flip = false, w = 720, h = 960}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 24, 18) * opacity;
  if (o <= 0.001) return null;
  return (
    <Img src={staticFile(src)} style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: o, transform: `scale(${flip ? -scale : scale}, ${scale}) rotate(${rot}deg)`, transformOrigin: '50% 50%'}} />
  );
};

/** Looping Blender anatomy inset card (small, never over the demonstration). frames are 1..n. */
export const AnatInset: React.FC<{dir: string; n?: number; from: number; to: number; x: number; y: number; w?: number; label: string; sub?: string; speed?: number; ping?: boolean}> = ({dir, n = 60, from, to, x, y, w = 330, label, sub = 'رسم توضيحي مبسّط', speed = 0.5, ping = false}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 16, 16);
  if (o <= 0.001) return null;
  const k = Math.floor((f - from) * speed);
  const idx = (ping ? (k % (2 * n) < n ? k % (2 * n) : 2 * n - 1 - (k % (2 * n))) : k % n) + 1;
  const h = w * (4 / 3);
  return (
    <div style={{position: 'absolute', left: x, top: y + (1 - ss(clamp((f - from) / 16))) * 14, width: w, opacity: o}}>
      <div style={{borderRadius: 24, padding: 10, background: 'linear-gradient(180deg, rgba(14,40,66,0.9), rgba(8,24,42,0.9))', border: '2px solid rgba(79,230,218,0.7)', boxShadow: '0 10px 30px rgba(0,0,0,0.35)'}}>
        <Img src={staticFile(`neck/${dir}/f_${String(Math.min(n, Math.max(1, idx))).padStart(4, '0')}.png`)} style={{width: w - 20, height: (w - 20) * (4 / 3), display: 'block'}} />
        <div dir="rtl" style={{fontFamily: FONT_AR, fontSize: 28, fontWeight: 800, color: '#fff', textAlign: 'center'}}>{label}</div>
        <div dir="rtl" style={{fontFamily: FONT_AR, fontSize: 21, fontWeight: 500, color: '#BFEFF0', textAlign: 'center'}}>{sub}</div>
      </div>
    </div>
  );
};

/** Turquoise straight movement arrow with a travelling head (direction of the rehabilitation movement). */
export const MoveArrowH: React.FC<{x0: number; y0: number; x1: number; y1: number; from: number; to: number; width?: number}> = ({x0, y0, x1, y1, from, to, width = 7}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 14, 14);
  if (o <= 0.001) return null;
  const k = ss(clamp((((f - from) % 60) / 38)));
  const cx = x0 + (x1 - x0) * k, cy = y0 + (y1 - y0) * k;
  const a = Math.atan2(y1 - y0, x1 - x0);
  const hx = 22, hy = 14;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, opacity: o}}>
      <line x1={x0} y1={y0} x2={cx} y2={cy} stroke="#4FE6DA" strokeWidth={width} strokeLinecap="round" opacity={0.95} />
      <g transform={`translate(${cx} ${cy}) rotate(${(a * 180) / Math.PI})`}>
        <path d={`M0 0 L${-hx} ${-hy} M0 0 L${-hx} ${hy}`} stroke="#4FE6DA" strokeWidth={width} strokeLinecap="round" fill="none" />
      </g>
      <circle cx={x0} cy={y0} r={8} fill="#08182A" stroke="#7DF3EA" strokeWidth={3} />
    </svg>
  );
};

/** Curved rotation arrow around a head (soft turquoise). */
export const RotArrow: React.FC<{cx: number; cy: number; r: number; from: number; to: number; flip?: boolean}> = ({cx, cy, r, from, to, flip = false}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 16, 16);
  if (o <= 0.001) return null;
  const k = ss(clamp((((f - from) % 80) / 50)));
  const s = flip ? -1 : 1;
  const d = `M ${cx - r * s} ${cy} A ${r} ${r * 0.35} 0 0 ${flip ? 0 : 1} ${cx + r * s} ${cy}`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, opacity: o}}>
      <path d={d} fill="none" stroke="#4FE6DA" strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
      <path d={d} fill="none" stroke="#4FE6DA22" strokeWidth={22} strokeLinecap="round" />
    </svg>
  );
};

/** Short clinical label with a leader line to a point (positions in the same space as the footage). */
export const ClinLabel: React.FC<{text: string; at: [number, number]; label: [number, number]; from: number; to: number; color?: string; size?: number}> = ({text, at, label, from, to, color = '#7DF3EA', size = 34}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 14, 14);
  if (o <= 0.001) return null;
  const k = ss(clamp((f - from) / 18));
  return (
    <>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, opacity: o}}>
        <line x1={at[0]} y1={at[1]} x2={at[0] + (label[0] - at[0]) * k} y2={at[1] + (label[1] - at[1]) * k} stroke={color} strokeWidth={3} />
        <circle cx={at[0]} cy={at[1]} r={8} fill={color} />
      </svg>
      <div dir="rtl" style={{position: 'absolute', left: label[0] - 20, top: label[1] - size, transform: 'translateX(-100%)', opacity: o * k, padding: '8px 20px', borderRadius: 16, background: 'rgba(8,24,42,0.86)', border: `2px solid ${color}`, fontFamily: FONT_AR, fontSize: size, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap'}}>{text}</div>
    </>
  );
};

/** Pain-referral pattern: soft red-orange band that travels from the upper neck toward the back of the head (possible pattern, not a diagnosis). */
export const Referral: React.FC<{pts: [number, number][]; from: number; to: number}> = ({pts, from, to}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 20, 18);
  if (o <= 0.001) return null;
  const k = ss(clamp((f - from) / 40));
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, opacity: o}}>
      <defs><filter id="rf"><feGaussianBlur stdDeviation="14" /></filter></defs>
      <path d={d} fill="none" stroke="#F2502D" strokeWidth={46} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} filter="url(#rf)" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
      <path d={d} fill="none" stroke="#FF8A4C" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 18" pathLength={1} opacity={0.95} />
    </svg>
  );
};

/** Full-frame Blender anatomy loop (transparent PNG sequence) on a deep navy studio gradient with soft vignette. */
export const AnatFull: React.FC<{dir: string; n?: number; from: number; to: number; speed?: number; scale?: number; ty?: number}> = ({dir, n = 60, from, to, speed = 0.5, scale = 1.0, ty = 0}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 16, 16);
  if (o <= 0.001) return null;
  const idx = (Math.floor((f - from) * speed) % n) + 1;
  return (
    <AbsoluteFill style={{opacity: o, background: 'radial-gradient(ellipse at 50% 42%, #17476b 0%, #0d2740 60%, #08182a 100%)'}}>
      <Img src={staticFile(`neck/${dir}/f_${String(idx).padStart(4, '0')}.png`)} style={{position: 'absolute', left: 0, top: 260 + ty, width: 1080, height: 1440, transform: `scale(${scale})`}} />
    </AbsoluteFill>
  );
};

/** Soft elliptical muscle highlight (orange = selected muscular tension area) in host space. */
export const MuscleGlow: React.FC<{x: number; y: number; rx: number; ry: number; rot?: number; from: number; to: number; color?: string}> = ({x, y, rx, ry, rot = 0, from, to, color = '#FF8A3D'}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 18, 18);
  if (o <= 0.001) return null;
  const p = 1 + 0.04 * Math.sin((f - from) / 10);
  return <div style={{position: 'absolute', left: x - rx * p, top: y - ry * p, width: rx * 2 * p, height: ry * 2 * p, borderRadius: '50%', transform: `rotate(${rot}deg)`, opacity: o * 0.8, background: `radial-gradient(ellipse, ${color}99 0%, ${color}55 45%, ${color}00 72%)`}} />;
};
