import React from 'react';
import {AbsoluteFill, Img, Loop, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {ss, win} from '../../components/FMCMedicalHighlight';
import {FONT_AR, FONT_DISPLAY} from '../../styles/theme';
import hero from '../../data/catcow/landmarks_hero.json';
import side from '../../data/catcow/landmarks_side.json';
import close from '../../data/catcow/landmarks_close.json';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export type Cam = 'hero' | 'side' | 'close';
const LM: Record<Cam, any> = {hero, side, close};
export const LOOP = 60, RATE = 0.5;                       // 60 rendered frames, played at half speed -> 4 s Cat-Cow cycle
const vidFrame = (t: number) => Math.floor(Math.max(0, t) * RATE) % LOOP;

/** The rigged 3D character (Blender render loop) inside a transformable stage. Children are drawn in the same transformed space (overlays track the body). */
export const Stage: React.FC<{cam: Cam; from: number; to: number; scale?: number; ty?: number; tx?: number; origin?: string; children?: React.ReactNode; fade?: number}> = ({cam, from, to, scale = 1, ty = 0, tx = 0, origin = '50% 60%', children, fade = 10}) => {
  const f = useCurrentFrame();
  const o = Math.min(ss(clamp((f - from) / fade)), 1 - ss(clamp((f - (to - fade)) / fade)));
  if (f < from - 1 || f > to + 1) return null;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <AbsoluteFill style={{transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: origin}}>
        <Loop durationInFrames={Math.round(LOOP / RATE)}>
          <OffthreadVideo src={staticFile(`catcow/${cam}.mp4`)} muted playbackRate={RATE} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </Loop>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Smoothly tracked spine landmarks (projected from the 3D rig) as 1080x1920 points for a given absolute frame. */
export const spinePoints = (cam: Cam, f: number, from: number) => {
  const fr = LM[cam].frames[vidFrame(f - from)];
  const names = ['pelvis', 'spine1', 'spine2', 'spine3', 'spine4', 'spine5', 'chest', 'neck'];
  return names.map((n) => [fr[n][0] * 1080, fr[n][1] * 1920] as [number, number]);
};

/** FMC Power Touch: controlled turquoise line following the lumbar-thoracic spine with soft depth, a gentle halo on the lumbar region and vertebra markers. No particles, no lasers. */
export const PowerTouch: React.FC<{cam: Cam; from: number; to: number; start: number; lumbarOnly?: boolean}> = ({cam, from, to, start, lumbarOnly = false}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 16, 16);
  if (o <= 0.001) return null;
  const pts = spinePoints(cam, f, start);
  const use = lumbarOnly ? pts.slice(0, 5) : pts;
  const d = use.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const reveal = ss(clamp((f - from) / 26));
  const lum = pts[2];
  const pulse = 1 + 0.06 * Math.sin((f - from) / 9);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, opacity: o}}>
      <defs>
        <radialGradient id="ptHalo"><stop offset="0" stopColor="#4FE6DA" stopOpacity="0.38" /><stop offset="1" stopColor="#4FE6DA" stopOpacity="0" /></radialGradient>
        <filter id="ptBlur"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>
      <circle cx={lum[0]} cy={lum[1]} r={150 * pulse * reveal} fill="url(#ptHalo)" />
      <path d={d} fill="none" stroke="#4FE6DA" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} filter="url(#ptBlur)" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - reveal} />
      <path d={d} fill="none" stroke="#7DF3EA" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - reveal} />
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - reveal} />
      {use.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={9} fill="#08182A" stroke="#7DF3EA" strokeWidth={3} opacity={reveal} />)}
    </svg>
  );
};

/** Sagittal disc cross-section: vertebral endplates, annulus fibrosus (concentric lamellae) and nucleus pulposus. `load` (-1 flexion .. +1 extension) only shifts the nucleus slightly and narrows one side of the disc: a schematic, not a measurement. */
export const DiscCross: React.FC<{x: number; y: number; w: number; from: number; to: number; load?: (f: number) => number; labels?: boolean; circle?: boolean}> = ({x, y, w, from, to, load, labels = true, circle = false}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 16, 16);
  if (o <= 0.001) return null;
  const L = load ? load(f) : 0;
  const k = ss(clamp((f - from) / 22));
  const H = w * 0.62;
  const discH = H * 0.34 * (1 - 0.03 * Math.abs(L)), nuc = L * 6;
  const cx = w / 2, cy = H / 2;
  const lam = Array.from({length: 9});
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: H, opacity: o, transform: `scale(${0.94 + 0.06 * k})`, transformOrigin: '50% 50%'}}>
      <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} style={{overflow: 'visible', clipPath: circle ? `circle(${H * 0.5}px at 50% 50%)` : undefined, background: circle ? 'rgba(8,24,42,0.9)' : undefined}}>
        <defs>
          <linearGradient id="vb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F4ECD8" /><stop offset="1" stopColor="#CDBF9F" /></linearGradient>
          <radialGradient id="nuc"><stop offset="0" stopColor="#9EE7F5" stopOpacity="0.95" /><stop offset="0.7" stopColor="#4DB6D6" stopOpacity="0.85" /><stop offset="1" stopColor="#2E86AA" stopOpacity="0.8" /></radialGradient>
        </defs>
        <path d={`M${w * 0.14} 0 H${w * 0.86} V${cy - discH / 2 - 8} Q${cx} ${cy - discH / 2 + 2} ${w * 0.14} ${cy - discH / 2 - 8} Z`} fill="url(#vb)" />
        <path d={`M${w * 0.14} ${H} H${w * 0.86} V${cy + discH / 2 + 8} Q${cx} ${cy + discH / 2 - 2} ${w * 0.14} ${cy + discH / 2 + 8} Z`} fill="url(#vb)" />
        {lam.map((_, i) => {
          const s = 1 - i * 0.075; const ww = w * 0.74 * s, hh = discH * (1 - i * 0.07);
          return <rect key={i} x={cx - ww / 2} y={cy - hh / 2} width={ww} height={hh} rx={hh * 0.46} fill={i === 0 ? '#E9D3B4' : 'none'} stroke={i % 2 ? '#B58F66' : '#D8B88E'} strokeWidth={2.2} opacity={i === 0 ? 1 : 0.95} />;
        })}
        <ellipse cx={cx + nuc} cy={cy} rx={w * 0.2} ry={discH * 0.3} fill="url(#nuc)" stroke="#BFF0F8" strokeWidth={2} />
        <ellipse cx={cx + nuc - w * 0.05} cy={cy - discH * 0.08} rx={w * 0.07} ry={discH * 0.09} fill="#FFFFFF" opacity={0.35} />
      </svg>
      {labels ? (
        <>
          <Label t="الحلقة الليفية" px={w * 0.12} py={cy + discH / 2 - 6} tx={-10} ty={H + 36} side="left" />
          <Label t="النواة اللبية" px={cx + nuc + w * 0.16} py={cy} tx={w + 10} ty={cy - 70} side="right" />
          <Label t="الفقرة" px={w * 0.78} py={H * 0.12} tx={w + 10} ty={-20} side="right" />
        </>
      ) : null}
    </div>
  );
};
const Label: React.FC<{t: string; px: number; py: number; tx: number; ty: number; side: 'left' | 'right'}> = ({t, px, py, tx, ty, side}) => (
  <>
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}><path d={`M${px} ${py} L${tx} ${ty + 26}`} stroke="#7DF3EA" strokeWidth={2.4} fill="none" /><circle cx={px} cy={py} r={5} fill="#7DF3EA" /></svg>
    <div dir="rtl" style={{position: 'absolute', left: side === 'right' ? tx : undefined, right: side === 'left' ? undefined : undefined, top: ty, transform: side === 'left' ? `translateX(${tx}px)` : undefined, padding: '8px 18px', borderRadius: 16, background: 'rgba(8,24,42,0.86)', border: '2px solid rgba(79,230,218,0.8)', fontFamily: FONT_AR, fontSize: 34, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap'}}>{t}</div>
  </>
);

/** Animated UAE-participant statistic: counter, 10x10 people pictogram, population/measurement qualification, source. */
export const StatCard: React.FC<{from: number; to: number; value: number; top: number}> = ({from, to, value, top}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 18, 16);
  if (o <= 0.001) return null;
  const k = ss(clamp((f - from - 8) / 60));
  const n = value * k;
  const lit = Math.round(value);
  return (
    <div dir="rtl" style={{position: 'absolute', left: 54, right: 54, top, opacity: o, transform: `translateY(${(1 - ss(clamp((f - from) / 22))) * 24}px)`}}>
      <div style={{borderRadius: 30, padding: '26px 34px 22px', background: 'rgba(8,24,42,0.86)', border: '2px solid rgba(79,230,218,0.75)', boxShadow: '0 16px 44px rgba(0,0,0,0.38)'}}>
        <div style={{fontFamily: FONT_AR, fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.3}}>آلام أسفل الظهر لدى مشاركين إماراتيين</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 28, marginTop: 10}}>
          <div dir="ltr" style={{fontFamily: FONT_DISPLAY, fontSize: 124, fontWeight: 800, color: '#7DF3EA', lineHeight: 1}}>{n.toFixed(1)}%</div>
          <div style={{flex: 1, display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 5}}>
            {Array.from({length: 100}).map((_, i) => {
              const on = i < lit * k;
              return <div key={i} style={{aspectRatio: '1 / 1.5', borderRadius: '45% 45% 22% 22%', background: on ? '#4FE6DA' : 'rgba(190,215,235,0.22)'}} />;
            })}
          </div>
        </div>
        <div style={{fontFamily: FONT_AR, fontSize: 28, fontWeight: 600, color: '#D6E4EE', marginTop: 12, lineHeight: 1.35}}>دراسة في عيادات الرعاية الأولية بدبي — بيانات عام ٢٠٠٩ — ٣٩٨٥ مشاركا إماراتيا</div>
        <div style={{fontFamily: FONT_AR, fontSize: 22, fontWeight: 500, color: '#9FB8CC', marginTop: 6, lineHeight: 1.3}}>النسبة تخص المشاركين في الدراسة وليست كل سكان الإمارات · المصدر: Oman Medical Journal، ٢٠١٦</div>
      </div>
    </div>
  );
};

/** Circular anatomy inset (used above the character in week 2). */
export const CircleInset: React.FC<{from: number; to: number; cx: number; cy: number; r: number; load: (f: number) => number}> = ({from, to, cx, cy, r, load}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 16, 16);
  if (o <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, opacity: o}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(8,24,42,0.92)', border: '3px solid #4FE6DA', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', overflow: 'hidden'}} />
      <DiscCross x={r * 0.1} y={r * 0.38} w={r * 1.8} from={from} to={to} load={load} labels={false} />
    </div>
  );
};

/** Flexion (cat) / extension (cow) mini comparison from the rig's spine landmarks. */
export const FlexExtCompare: React.FC<{from: number; to: number; x: number; y: number}> = ({from, to, x, y}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 16, 16);
  if (o <= 0.001) return null;
  const fl = side.frames[15], ex = side.frames[45];
  const names = ['pelvis', 'spine1', 'spine2', 'spine3', 'spine4', 'spine5', 'chest'];
  const path = (fr: any) => names.map((n, i) => `${i ? 'L' : 'M'}${(fr[n][0] * 1080 - 120) * 0.5} ${(fr[n][1] * 1920 - 700) * 0.5}`).join(' ');
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 520, opacity: o}}>
      <div style={{borderRadius: 26, padding: 18, background: 'rgba(8,24,42,0.86)', border: '2px solid rgba(79,230,218,0.75)'}}>
        <svg width={484} height={210} viewBox="-30 -40 484 210">
          <path d={path(fl)} stroke="#F2A33A" strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d={path(ex)} stroke="#4FE6DA" strokeWidth={7} fill="none" strokeLinecap="round" />
        </svg>
        <div dir="rtl" style={{display: 'flex', justifyContent: 'space-around', fontFamily: FONT_AR, fontSize: 30, fontWeight: 700, color: '#fff'}}>
          <span style={{color: '#F2A33A'}}>تقويس (قطة)</span><span style={{color: '#7DF3EA'}}>تقعير (بقرة)</span>
        </div>
      </div>
    </div>
  );
};
