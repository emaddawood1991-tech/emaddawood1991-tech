import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../../styles/theme';

/**
 * FMC official presenter — 2D puppet rig built on the supplied reference art (assets/character).
 * Real, audio-driven animation: the mouth is redrawn every frame from the narration's amplitude/spectrum
 * (see scripts/char/visemes.py), plus blinking, head sway/nod and breathing.
 * It is NOT a generative video model: no body gestures are synthesised (see README → Presenter limits).
 * Coordinates below are in pixels of assets/character/derived/presenter-hero*.png (1184 × 1156).
 */
const W = 1184, H = 1156;
const MOUTH = {x: 728, y: 405, rot: 11, a: 62, sag: 7, maxOpen: 36};
const EYES = [
  {x: 689, y: 274, rx: 40, ry: 25, rot: 12, skin: '#f0a283'},
  {x: 818, y: 300, rx: 44, ry: 26, rot: 12, skin: '#ea9576'},
];
const PIVOT = {x: 760, y: 1080};

export type Visemes = {fps: number; scenes: Record<string, {o: number[]; w: number[]}>};

const curve = (n: number, f: (t: number) => [number, number]) => Array.from({length: n + 1}, (_, i) => f(-1 + (2 * i) / n));

const mouthShapes = (o: number, wf: number) => {
  const a = MOUTH.a * wf * (1 - 0.1 * o);
  const top = (t: number) => MOUTH.sag * (1 - t * t);
  const thick = (t: number) => o * MOUTH.maxOpen * Math.pow(Math.max(0, 1 - t * t), 0.9);
  const topPts = curve(36, (t) => [t * a, top(t)]);
  const botPts = curve(36, (t) => [t * a, top(t) + thick(t)]);
  const toD = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const cavity = `${toD(topPts)} ${toD([...botPts].reverse()).replace('M', 'L')} Z`;
  const teethBot = curve(36, (t) => [t * a, top(t) + Math.min(thick(t) * 0.42, 11)]);
  const teeth = `${toD(topPts)} ${toD([...teethBot].reverse()).replace('M', 'L')} Z`;
  return {cavity, teeth, seam: toD(topPts), lower: toD(botPts), mid: top(0) + thick(0), a};
};

const Mouth: React.FC<{o: number; w: number}> = ({o, w}) => {
  const s = mouthShapes(o, w);
  const open = o > 0.06;
  return (
    <g transform={`translate(${MOUTH.x} ${MOUTH.y}) rotate(${MOUTH.rot})`}>
      <defs>
        <clipPath id="cav"><path d={s.cavity} /></clipPath>
        <linearGradient id="cavg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b1214" /><stop offset="1" stopColor="#1d0708" /></linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="1.1" /></filter>
      </defs>
      {open ? (
        <>
          <path d={s.cavity} fill="url(#cavg)" />
          <g clipPath="url(#cav)">
            <ellipse cx={0} cy={s.mid - o * MOUTH.maxOpen * 0.22} rx={s.a * 0.42} ry={Math.max(1, o * 11)} fill="#c9606a" opacity={o > 0.3 ? 0.95 : 0} filter="url(#soft)" />
            <path d={s.teeth} fill="#f3efe7" />
            <path d={s.seam} fill="none" stroke="#d8d2c6" strokeWidth={1.2} opacity={0.6} transform="translate(0 9)" />
          </g>
          {/* lower lip edge + soft lip shadow under the opening */}
          <path d={s.lower} fill="none" stroke="#b8514f" strokeWidth={3.2} strokeLinecap="round" opacity={0.75} />
          <path d={s.lower} fill="none" stroke="#f5a79a" strokeWidth={5} strokeLinecap="round" opacity={0.35} transform="translate(0 5)" filter="url(#soft)" />
        </>
      ) : null}
      {/* upper lip seam (visible when closed, softly covered when open) */}
      <path d={s.seam} fill="none" stroke="#8d3d3b" strokeWidth={open ? 3 : 3.4} strokeLinecap="round" opacity={open ? 0.8 : 0.9} />
    </g>
  );
};

const Eyelids: React.FC<{blink: number}> = ({blink}) => (
  <>
    {EYES.map((e, i) => {
      const h = e.ry * 2 * blink;
      return (
        <g key={i} transform={`translate(${e.x} ${e.y}) rotate(${e.rot})`} opacity={blink > 0.02 ? 1 : 0}>
          <defs>
            <clipPath id={`lid${i}`}><rect x={-e.rx - 4} y={-e.ry - 4} width={e.rx * 2 + 8} height={h + 4} /></clipPath>
            <filter id={`lidsoft${i}`}><feGaussianBlur stdDeviation="1.6" /></filter>
          </defs>
          <g clipPath={`url(#lid${i})`}>
            <ellipse cx={0} cy={0} rx={e.rx + 2} ry={e.ry + 3} fill={e.skin} filter={`url(#lidsoft${i})`} />
          </g>
          <path d={`M${-e.rx + 4} ${-e.ry + h - 2} Q0 ${-e.ry + h + 5} ${e.rx - 4} ${-e.ry + h - 2}`} fill="none" stroke="#3c2118" strokeWidth={3.2} strokeLinecap="round" opacity={blink > 0.5 ? 0.9 : blink * 1.4} />
        </g>
      );
    })}
  </>
);

/** Blink schedule: a quick double-frame-eased blink every ~3.2–4.6 s (deterministic per seed). */
const blinkAt = (frame: number, seed: number) => {
  const period = 100 + ((seed * 37) % 40);
  const f = (frame + seed * 23) % period;
  if (f > 6) return 0;
  return f < 3 ? f / 3 : 1 - (f - 3) / 3;
};

export const Presenter: React.FC<{
  width: number;
  /** viewport on the hero art, in hero px. Default = whole panel. */
  view?: {x: number; y: number; w: number; h: number};
  speech: {o: number[]; w: number[]} | null;
  /** frame (inside this scene) at which the narration audio starts */
  audioFrom: number;
  seed?: number;
  circle?: boolean;
  style?: React.CSSProperties;
}> = ({width, view = {x: 0, y: 0, w: W, h: H}, speech, audioFrom, seed = 1, circle, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const k = Math.max(0, Math.min((speech?.o.length ?? 1) - 1, frame - audioFrom));
  const speaking = !!speech && frame >= audioFrom && frame - audioFrom < (speech?.o.length ?? 0);
  const o = speaking ? speech!.o[k] : 0;
  const wf = speaking ? speech!.w[k] : 1;
  const blink = blinkAt(frame, seed);
  const s = width / view.w;
  const height = view.h * s;
  // head motion: slow sway + small nod on emphasis + breathing (rotation about the neck)
  const rot = Math.sin(t * 0.9 + seed) * 1.0 + Math.sin(t * 2.3) * 0.35;
  const nod = o * 5 + Math.sin(t * 1.7) * 2;
  const breathe = 1 + Math.sin(t * 1.6) * 0.003;
  return (
    <div style={{position: 'relative', width, height, overflow: 'hidden', borderRadius: circle ? '50%' : 38, boxShadow: '0 28px 70px rgba(0,0,0,0.45)', border: `3px solid ${COLORS.turquoise}`, background: '#274f78', ...style}}>
      <div style={{position: 'absolute', left: -view.x * s, top: -view.y * s, width: W * s, height: H * s, transformOrigin: `${PIVOT.x * s}px ${PIVOT.y * s}px`, transform: `rotate(${rot}deg) translateY(${nod * s}px) scale(${breathe})`}}>
        <Img src={staticFile('character/derived/presenter-hero-closed.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
        <svg viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          <Eyelids blink={blink} />
          <Mouth o={o} w={wf} />
        </svg>
      </div>
    </div>
  );
};

/** Matted full-body pose (hands on lower back, pain glow from the reference sheet) with a pulsing pain-location ring. */
export const PainPose: React.FC<{height: number; delay?: number}> = ({height, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const k = height / 1032;
  const w = 612 * k;
  const inT = interpolate(frame - delay, [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const pulse = 0.5 + 0.5 * Math.sin(t * 4);
  return (
    <div style={{position: 'relative', width: w, height, opacity: inT, transform: `translateX(${(1 - inT) * -80}px) translateY(${Math.sin(t * 1.4) * 4}px) rotate(${Math.sin(t * 0.9) * 0.4}deg)`, transformOrigin: '50% 100%'}}>
      <Img src={staticFile('character/derived/presenter-pose-pain.png')} style={{width: '100%', height: '100%'}} />
      <svg viewBox="0 0 612 1032" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}>
        <circle cx={320} cy={500} r={70 + 28 * pulse} fill="none" stroke={COLORS.amber} strokeWidth={5} opacity={0.35 + 0.5 * (1 - pulse)} />
        <circle cx={320} cy={500} r={40} fill={COLORS.amber} opacity={0.12 + 0.12 * pulse} />
      </svg>
    </div>
  );
};
