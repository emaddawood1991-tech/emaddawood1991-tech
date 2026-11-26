import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ss, win} from '../../components/FMCMedicalHighlight';
import {FONT_AR, FONT_DISPLAY} from '../../styles/theme';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export type Seg = {id: number; ss: number; len: number; speed?: number; zoom?: [number, number]; pos?: string; origin?: string};

/** Muted stock clip with slow-motion, crossfade and a gentle camera push. `from` is the absolute frame where the segment starts. */
export const ClipSeg: React.FC<{seg: Seg; from: number; fade?: number}> = ({seg, from, fade = 10}) => {
  const f = useCurrentFrame();
  const dur = Math.round(seg.len * 30);
  if (f < from - 1 || f > from + dur + 1) return null;
  const o = Math.min(ss(clamp((f - from) / fade)), 1 - ss(clamp((f - (from + dur - fade)) / fade)));
  const [z0, z1] = seg.zoom ?? [1.0, 1.06];
  const z = z0 + (z1 - z0) * clamp((f - from) / dur);
  const sp = seg.speed ?? 1;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: seg.origin ?? '50% 70%'}}>
        <Sequence from={from} durationInFrames={dur + 2} layout="none">
          <OffthreadVideo src={staticFile(`footage/sports-injury-rehab/raw/${seg.id}.mp4`)} muted playbackRate={sp} startFrom={Math.round(seg.ss * 30)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: seg.pos ?? '50% 50%'}} />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Soft red-orange pain highlight (pulsing, no hard glow) placed on the affected region. */
export const PainSpot: React.FC<{x: number; y: number; r?: number; from: number; to: number; color?: string}> = ({x, y, r = 70, from, to, color = '#F2622D'}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 14, 16);
  if (o <= 0.001) return null;
  const p = 1 + 0.08 * Math.sin((f - from) / 6);
  return (
    <div style={{position: 'absolute', left: x - r * p, top: y - r * p, width: r * 2 * p, height: r * 2 * p, borderRadius: '50%', opacity: o * 0.85, background: `radial-gradient(circle, ${color}00 52%, ${color}55 66%, ${color}00 100%)`, border: `3px solid ${color}`, boxShadow: `0 0 18px ${color}66`}} />
  );
};

/** Turquoise curved movement arrow (rehabilitation movement direction). */
export const MoveArrow: React.FC<{x: number; y: number; rot?: number; from: number; to: number; size?: number}> = ({x, y, rot = 0, from, to, size = 150}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 14, 14);
  if (o <= 0.001) return null;
  const k = clamp((f - from) / 26);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{position: 'absolute', left: x - size / 2, top: y - size / 2, opacity: o, transform: `rotate(${rot}deg)`}}>
      <path d="M18 74 Q50 8 82 66" fill="none" stroke="#4FE6DA" strokeWidth={5} strokeLinecap="round" strokeDasharray="130" strokeDashoffset={130 * (1 - ss(k))} />
      <path d="M70 62 L84 70 L88 53" fill="none" stroke="#4FE6DA" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={ss(clamp((k - 0.7) / 0.3))} />
    </svg>
  );
};

const Card: React.FC<{from: number; to: number; x?: number; y?: number; label: string; children: React.ReactNode}> = ({from, to, x = 72, y = 470, label, children}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 14, 14);
  if (o <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y + (1 - ss(clamp((f - from) / 16))) * 14, width: 310, opacity: o}}>
      <div style={{borderRadius: 22, padding: 14, background: 'rgba(8,24,42,0.78)', border: '2px solid rgba(79,230,218,0.7)'}}>
        <svg viewBox="0 0 200 200" width={282} height={282}>{children}</svg>
        <div dir="rtl" style={{fontFamily: FONT_AR, fontSize: 26, fontWeight: 700, color: '#fff', textAlign: 'center'}}>{label}</div>
        <div dir="rtl" style={{fontFamily: FONT_AR, fontSize: 20, fontWeight: 500, color: '#BFEFF0', textAlign: 'center'}}>رسم توضيحي مبسط</div>
      </div>
    </div>
  );
};
const BlenderInset: React.FC<{from: number; to: number; name: 'ankle' | 'hamstring' | 'knee'; label: string}> = ({from, to, name, label}) => {
  const f = useCurrentFrame();
  const k = Math.min(59, Math.max(0, Math.floor(((f - from) / 2.2) % 120)));
  const idx = (k < 60 ? k : 119 - k) + 1;
  return (
    <Card from={from} to={to} label={label}>
      <foreignObject x="0" y="0" width="200" height="200"><Img src={staticFile(`overlays/${name}/f_${String(idx).padStart(4, '0')}.png`)} style={{width: 200, height: 200}} /></foreignObject>
    </Card>
  );
};
const BONE = '#EADFC8', LIG = '#F28C28', MUS = '#C9694F';

/** Simplified (schematic, not patient-specific) anatomy insets. Lateral ankle: fibula, tibia, talus, calcaneus + the outer-ankle ligament group. */
export const AnkleInsetSvg: React.FC<{from: number; to: number}> = ({from, to}) => (
  <Card from={from} to={to} label="أربطة الكاحل">
    <rect x="86" y="8" width="26" height="92" rx="12" fill={BONE} />
    <rect x="52" y="8" width="22" height="84" rx="11" fill="#D8CCB0" />
    <ellipse cx="96" cy="112" rx="34" ry="20" fill={BONE} />
    <path d="M62 128 Q84 150 150 138 Q168 148 156 164 L60 164 Q44 150 62 128Z" fill="#D8CCB0" />
    <path d="M60 164 L166 164 Q176 172 168 184 L56 184 Q44 176 60 164Z" fill="#CBBE9F" />
    <path d="M64 96 L78 124" stroke={LIG} strokeWidth="6" strokeLinecap="round" />
    <path d="M62 98 L72 150" stroke={LIG} strokeWidth="6" strokeLinecap="round" />
    <path d="M60 100 L92 118" stroke={LIG} strokeWidth="6" strokeLinecap="round" />
    <circle cx="66" cy="106" r="22" fill="none" stroke="#F2622D" strokeWidth="2.5" strokeDasharray="5 5" />
  </Card>
);
export const HamstringInsetSvg: React.FC<{from: number; to: number}> = ({from, to}) => (
  <Card from={from} to={to} label="عضلات الفخذ الخلفية">
    <rect x="86" y="4" width="28" height="40" rx="10" fill={BONE} />
    <path d="M70 40 Q64 100 78 168 L96 168 L100 40Z" fill={MUS} opacity={0.95} />
    <path d="M100 40 L102 168 L124 168 Q136 100 130 40Z" fill="#B9553F" opacity={0.95} />
    <path d="M86 44 Q92 100 94 168" stroke="#EFC7B6" strokeWidth="2" fill="none" />
    <rect x="68" y="168" width="64" height="22" rx="10" fill={BONE} />
    <ellipse cx="100" cy="104" rx="40" ry="34" fill="none" stroke="#F2622D" strokeWidth="2.5" strokeDasharray="5 5" />
  </Card>
);
export const KneeInsetSvg: React.FC<{from: number; to: number}> = ({from, to}) => (
  <Card from={from} to={to} label="مفصل الركبة">
    <path d="M74 6 L126 6 L134 66 Q100 88 66 66Z" fill={BONE} />
    <path d="M62 92 Q100 82 138 92 L128 196 L72 196Z" fill="#D8CCB0" />
    <circle cx="100" cy="70" r="15" fill="#F1E8D4" />
    <path d="M84 70 L112 96" stroke="#F4D35E" strokeWidth="5" strokeLinecap="round" />
    <path d="M118 70 L90 98" stroke="#F4D35E" strokeWidth="5" strokeLinecap="round" />
    <path d="M68 88 Q84 100 96 90" stroke="#9EC5D6" strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d="M104 90 Q118 100 132 88" stroke="#9EC5D6" strokeWidth="6" fill="none" strokeLinecap="round" />
    <circle cx="100" cy="88" r="38" fill="none" stroke="#F2622D" strokeWidth="2.5" strokeDasharray="5 5" />
  </Card>
);

/** Progression: الحركة ← القوة ← التوازن ← العودة للنشاط (RTL, steps light up one by one). */
export const Progression: React.FC<{from: number; to: number; y?: number}> = ({from, to, y = 1130}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 14, 14);
  if (o <= 0.001) return null;
  const steps = ['الحركة', 'القوة', 'التوازن', 'العودة للنشاط'];
  return (
    <div dir="rtl" style={{position: 'absolute', left: 54, right: 54, top: y, opacity: o, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10}}>
      {steps.map((s, i) => {
        const on = ss(clamp((f - from - 14 - i * 26) / 18));
        return (
          <React.Fragment key={s}>
            {i > 0 ? <span style={{fontFamily: FONT_DISPLAY, fontSize: 38, color: '#4FE6DA', opacity: 0.4 + 0.6 * on}}>←</span> : null}
            <span style={{fontFamily: FONT_AR, fontSize: 36, fontWeight: 800, padding: '12px 22px', borderRadius: 18, color: on > 0.5 ? '#06121f' : '#fff', background: on > 0.5 ? '#4FE6DA' : 'rgba(9,24,42,0.78)', border: '2px solid #4FE6DA', whiteSpace: 'nowrap'}}>{s}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** Insets designed in Figma (vector illustration + Arabic label, exported PNG), shown with a gentle float. */
const FigmaInset: React.FC<{from: number; to: number; name: 'ankle' | 'hamstring' | 'knee'}> = ({from, to, name}) => {
  const f = useCurrentFrame();
  const o = win(f, from, to, 14, 14);
  if (o <= 0.001) return null;
  const k = ss(clamp((f - from) / 18));
  const bob = Math.sin((f - from) / 22) * 4;
  return (
    <div style={{position: 'absolute', left: 64, top: 450 + (1 - k) * 16 + bob, width: 380, opacity: o, filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.38))'}}>
      <Img src={staticFile(`overlays/figma/${name}.png`)} style={{width: 380, height: 'auto', display: 'block'}} />
    </div>
  );
};
export const AnkleInset: React.FC<{from: number; to: number}> = (p) => <FigmaInset {...p} name="ankle" />;
export const HamstringInset: React.FC<{from: number; to: number}> = (p) => <FigmaInset {...p} name="hamstring" />;
export const KneeInset: React.FC<{from: number; to: number}> = (p) => <FigmaInset {...p} name="knee" />;
