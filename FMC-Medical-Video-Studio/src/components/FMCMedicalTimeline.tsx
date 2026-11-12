import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT_AR} from '../styles/theme';

export type Chapter = {id: string; num: string; label: string; from: number; to: number};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (t: number) => t * t * (3 - 2 * t);

/**
 * Slim chapter timeline (frame-accurate). Chapters are laid out right→left (Arabic reading order); each segment fills with the
 * real progress through that chapter's [from,to) frames. Visible only between `showFrom` and `showTo` (soft fades).
 * No sound, no flashing: only smooth fill + a small head dot.
 */
export const FMCMedicalTimeline: React.FC<{chapters: Chapter[]; top: number; left: number; right: number; showFrom: number; showTo: number; size?: number; activeSize?: number}> = ({chapters, top, left, right, showFrom, showTo, size = 25, activeSize = 30}) => {
  const f = useCurrentFrame();
  const vis = Math.min(ss(clamp((f - showFrom) / 18)), 1 - ss(clamp((f - (showTo - 18)) / 18)));
  if (vis <= 0.001) return null;
  const gap = 10;
  return (
    <div dir="rtl" style={{position: 'absolute', left, right, top, opacity: vis, pointerEvents: 'none'}}>
      <div style={{display: 'flex', flexDirection: 'row', gap}}>
        {chapters.map((c) => {
          const p = ss(clamp((f - c.from) / Math.max(1, c.to - c.from)));
          const active = f >= c.from && f < c.to;
          const done = f >= c.to;
          return (
            <div key={c.id} style={{flex: 1}}>
              <div style={{position: 'relative', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.24)', overflow: 'visible'}}>
                <div style={{position: 'absolute', inset: 0, borderRadius: 3, background: active ? 'linear-gradient(270deg,#7DF3EA,#2FD4C8)' : '#2FD4C8', transform: `scaleX(${done ? 1 : p})`, transformOrigin: 'right center', opacity: done ? 0.75 : 1}} />
                {active ? <div style={{position: 'absolute', top: -4, right: `${(1 - p) * 100 === 0 ? 0 : p * 100}%`, width: 14, height: 14, borderRadius: 7, marginRight: -7, background: '#fff', boxShadow: '0 0 0 4px rgba(47,212,200,0.28)'}} /> : null}
              </div>
              <div style={{marginTop: 12, display: 'flex', gap: 8, alignItems: 'baseline', justifyContent: 'flex-start', opacity: active ? 1 : done ? 0.7 : 0.5, transition: 'none'}}>
                <span style={{fontFamily: FONT_AR, fontSize: active ? activeSize : size, fontWeight: 700, color: active ? '#7DF3EA' : '#E8EEF3', fontVariantNumeric: 'tabular-nums'}}>{c.num}</span>
                <span style={{fontFamily: FONT_AR, fontSize: active ? activeSize : size, fontWeight: active ? 700 : 600, color: '#fff', whiteSpace: 'nowrap'}}>{c.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
