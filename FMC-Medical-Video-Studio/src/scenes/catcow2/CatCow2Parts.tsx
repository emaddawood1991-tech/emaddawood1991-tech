import React from 'react';
import {AbsoluteFill, Loop, OffthreadVideo, staticFile, useCurrentFrame, Img} from 'remotion';
import {ss, win} from '../../components/FMCMedicalHighlight';
import {FONT_AR, FONT_DISPLAY} from '../../styles/theme';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const LOOP2 = 60, RATE2 = 0.5;                                         // 60 rendered frames at half speed = 4 s cycle
export type Clip = 'hero_normal' | 'side_normal' | 'side_xray' | 'close_normal' | 'close_xray' | 'top_xray' | 'anat_disc' | 'anat_flex';

/** One rendered Blender loop with fade in/out, optional crop/scale. */
export const Clip2: React.FC<{clip: Clip; from: number; to: number; scale?: number; tx?: number; ty?: number; origin?: string; fade?: number; rate?: number; style?: React.CSSProperties}> = ({clip, from, to, scale = 1, tx = 0, ty = 0, origin = '50% 55%', fade = 12, rate = RATE2, style}) => {
  const f = useCurrentFrame();
  if (f < from - 1 || f > to + 1) return null;
  const o = Math.min(ss(clamp((f - from) / fade)), 1 - ss(clamp((f - (to - fade)) / fade)));
  return (
    <AbsoluteFill style={{opacity: o, ...style}}>
      <AbsoluteFill style={{transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: origin}}>
        <Loop durationInFrames={Math.round(LOOP2 / rate)}>
          <OffthreadVideo src={staticFile(`catcow2/${clip}.mp4`)} muted playbackRate={rate} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </Loop>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Soft turquoise medical highlight (restrained): halo + thin ring at a screen position, pulsing gently. */
export const SoftHighlight: React.FC<{x: number; y: number; r: number; from: number; to: number}> = ({x, y, r, from, to}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 18, 18);
  if (o <= 0.001) return null;
  const p = 1 + 0.05 * Math.sin((f - from) / 10);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, opacity: o}}>
      <defs><radialGradient id="sh"><stop offset="0" stopColor="#4FE6DA" stopOpacity="0.30" /><stop offset="1" stopColor="#4FE6DA" stopOpacity="0" /></radialGradient></defs>
      <circle cx={x} cy={y} r={r * p} fill="url(#sh)" />
      <circle cx={x} cy={y} r={r * 0.62 * p} fill="none" stroke="#7DF3EA" strokeWidth={3} opacity={0.8} />
    </svg>
  );
};

/** Animated anatomical label with a leader line to an anchor point. side: where the text sits. */
export const AnatLabel: React.FC<{text: string; ax: number; ay: number; tx: number; ty: number; from: number; to: number; color?: string; align?: 'left' | 'right'}> = ({text, ax, ay, tx, ty, from, to, color = '#7DF3EA', align = 'right'}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 14, 14);
  if (o <= 0.001) return null;
  const k = ss(clamp((f - from) / 18));
  return (
    <>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, opacity: o}}>
        <path d={`M${ax} ${ay} L${ax + (tx - ax) * k} ${ay + (ty - ay) * k}`} stroke={color} strokeWidth={2.6} fill="none" />
        <circle cx={ax} cy={ay} r={7} fill={color} />
      </svg>
      <div dir="rtl" style={{position: 'absolute', top: ty - 26, [align === 'right' ? 'left' : 'right']: align === 'right' ? tx : 1080 - tx, opacity: o * k, padding: '8px 20px', borderRadius: 16, background: 'rgba(8,24,42,0.86)', border: `2px solid ${color}`, fontFamily: FONT_AR, fontSize: 34, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap'} as React.CSSProperties}>{text}</div>
    </>
  );
};

/** Subtle chapter indicator: five dots on the left edge, the active one expands with its short Arabic name. */
export const ChapterDots: React.FC<{items: {label: string; from: number; to: number}[]; top?: number}> = ({items, top = 760}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 26, top, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start'}}>
      {items.map((it, i) => {
        const on = f >= it.from && f < it.to;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, opacity: 0.9}}>
            <div style={{width: on ? 16 : 10, height: on ? 16 : 10, borderRadius: 8, background: on ? '#4FE6DA' : 'rgba(255,255,255,0.45)', boxShadow: on ? '0 0 0 4px rgba(79,230,218,0.25)' : undefined}} />
            {on ? <div dir="rtl" style={{fontFamily: FONT_AR, fontSize: 24, fontWeight: 700, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)'}}>{it.label}</div> : null}
          </div>
        );
      })}
    </div>
  );
};

/** Compact premium statistic card (does not cover the character): animated number, population wording, source. */
export const StatMini: React.FC<{from: number; to: number; value: number; top: number}> = ({from, to, value, top}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 16, 16);
  if (o <= 0.001) return null;
  const k = ss(clamp((f - from - 6) / 50));
  return (
    <div dir="rtl" style={{position: 'absolute', left: 56, right: 56, top, opacity: o, transform: `translateY(${(1 - ss(clamp((f - from) / 20))) * 18}px)`}}>
      <div style={{borderRadius: 26, padding: '16px 26px', background: 'rgba(8,24,42,0.82)', border: '2px solid rgba(79,230,218,0.75)', boxShadow: '0 12px 34px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 22}}>
        <div dir="ltr" style={{fontFamily: FONT_DISPLAY, fontSize: 84, fontWeight: 800, color: '#7DF3EA', lineHeight: 1}}>{(value * k).toFixed(1)}%</div>
        <div style={{flex: 1}}>
          <div style={{fontFamily: FONT_AR, fontSize: 34, fontWeight: 800, color: '#fff', lineHeight: 1.25}}>آلام أسفل الظهر لدى مشاركين في دراسة بدبي</div>
          <div style={{fontFamily: FONT_AR, fontSize: 24, fontWeight: 600, color: '#D6E4EE', lineHeight: 1.3, marginTop: 4}}>٣٢٫٩٪ من المشاركين · بيانات ٢٠٠٩</div>
          <div style={{fontFamily: FONT_AR, fontSize: 23, fontWeight: 500, color: '#9FB8CC', lineHeight: 1.3, marginTop: 4}}>Oman Medical Journal، ٢٠١٦ — دراسة PRO Dubai · ليست نسبة لكل سكان الإمارات</div>
        </div>
      </div>
    </div>
  );
};

/** Phase chips with simple arrows: تقويس الظهر للأعلى / مدّ الظهر بلطف, alternating with the loop phase. */
export const PhaseChip: React.FC<{from: number; to: number; y: number; start: number}> = ({from, to, y, start}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 14, 14);
  if (o <= 0.001) return null;
  const ph = ((((f - start) * RATE2) % LOOP2) / LOOP2);
  const cat = ph < 0.5;
  return (
    <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '14px 30px', borderRadius: 22, background: 'rgba(8,24,42,0.84)', border: `2px solid ${cat ? '#F2A33A' : '#4FE6DA'}`}}>
        <span style={{fontSize: 44, color: cat ? '#F2A33A' : '#4FE6DA', fontFamily: FONT_DISPLAY}}>{cat ? '↑' : '↓'}</span>
        <span style={{fontFamily: FONT_AR, fontSize: 40, fontWeight: 800, color: '#fff'}}>{cat ? 'تقويس الظهر للأعلى' : 'مدّ الظهر بلطف'}</span>
      </div>
    </div>
  );
};

/** Elegant light closing: original logo (no halo), navy name, turquoise slogan. */
export const ClosingV2: React.FC<{from: number; dur: number}> = ({from, dur}) => {
  const f = useCurrentFrame();
  const t = f - from;
  if (f < from - 1 || f > from + dur + 40) return null;
  const bg = ss(clamp(t / 18)), lg = ss(clamp((t - 6) / 24)), nm = ss(clamp((t - 24) / 20)), sg = ss(clamp((t - 40) / 20));
  return (
    <AbsoluteFill style={{opacity: bg, background: 'linear-gradient(180deg, #F7FAFC 0%, #E8F1F7 60%, #DCEBF4 100%)'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <circle cx={540} cy={780} r={430} fill="none" stroke="#4FE6DA" strokeWidth={2} opacity={0.35} /><circle cx={540} cy={780} r={520} fill="none" stroke="#4FE6DA" strokeWidth={1.5} opacity={0.2} />
        <rect x={430} y={1290} width={220 * sg} height={4} rx={2} fill="#4FE6DA" x2={0} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 520, display: 'flex', justifyContent: 'center', opacity: lg, transform: `scale(${0.94 + 0.06 * lg})`}}>
        <Img src={staticFile('logo/fmc-original-logo.png')} style={{width: 520, height: 520, objectFit: 'contain'}} />
      </div>
      <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, top: 1090, textAlign: 'center', opacity: nm, transform: `translateY(${(1 - nm) * 22}px)`, fontFamily: FONT_DISPLAY, fontSize: 92, fontWeight: 800, color: '#0B2A4A'}}>مركز الفيصل الطبي</div>
      <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, top: 1318, textAlign: 'center', opacity: sg, transform: `translateY(${(1 - sg) * 18}px)`, fontFamily: FONT_AR, fontSize: 56, fontWeight: 700, color: '#0E8F86'}}>الرعاية المثالية</div>
    </AbsoluteFill>
  );
};

// ---- landmark tracking (projected from the 3D rig; placeholder single-frame files are replaced by the 60-frame ones after rendering) ----
import lmHeroNormal from '../../data/catcow2/landmarks_hero_normal.json';
import lmSideNormal from '../../data/catcow2/landmarks_side_normal.json';
import lmSideXray from '../../data/catcow2/landmarks_side_xray.json';
import lmCloseNormal from '../../data/catcow2/landmarks_close_normal.json';
import lmCloseXray from '../../data/catcow2/landmarks_close_xray.json';
import lmTopXray from '../../data/catcow2/landmarks_top_xray.json';
const LMS: Record<string, any> = {hero_normal: lmHeroNormal, side_normal: lmSideNormal, side_xray: lmSideXray, close_normal: lmCloseNormal, close_xray: lmCloseXray, top_xray: lmTopXray};
/** Screen position (1080x1920) of a named landmark for the looping clip at absolute frame f (clip started at `start`). Applies the stage transform. */
export const lmPoint = (clip: Clip, name: string, f: number, start: number, tf: {scale?: number; tx?: number; ty?: number; origin?: [number, number]} = {}): [number, number] => {
  const fr = LMS[clip].frames;
  const v = fr[Math.floor(Math.max(0, f - start) * RATE2) % LOOP2 % fr.length] || fr[0];
  const [x, y] = (v[name] || [0.5, 0.5]) as [number, number];
  const s = tf.scale ?? 1, [ox, oy] = tf.origin ?? [540, 1056];
  return [ox + (x * 1080 - ox) * s + (tf.tx ?? 0), oy + (y * 1920 - oy) * s + (tf.ty ?? 0)];
};
