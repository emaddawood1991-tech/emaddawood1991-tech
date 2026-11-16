import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING, theme } from "./theme";
import { clamp, counterValue, easeOutCubic, easeOutExpo, formatNumber, odometerPositions } from "./math";

/** /agentoon-data-motion: frame-based data animation. Every component takes `start` (the frame of the narrated cue) and `dur`, so numbers land on the spoken word. */
type Base = { start?: number; dur?: number; color?: string };

export const AnimatedCounter: React.FC<Base & { from?: number; to: number; decimals?: number; prefix?: string; suffix?: string; size?: number; label?: string; ease?: (t: number) => number }> = ({ from = 0, to, start = 0, dur = 60, decimals = 0, prefix = "", suffix = "", size = 220, color = theme.lime, label, ease }) => {
  const frame = useCurrentFrame();
  const v = counterValue(frame, { from, to, start, dur, ease });
  const landed = frame >= start + dur;
  const pop = landed ? spring({ frame: frame - (start + dur), fps: 30, config: SPRING.slam }) : 0; // little overshoot when it lands on the target
  return (
    <div style={{ textAlign: "center", fontFamily: theme.body }}>
      <div style={{ fontWeight: 900, fontSize: size, color, lineHeight: 1, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums", transform: `scale(${1 + 0.06 * Math.sin(pop * Math.PI)})` }}>{prefix}{formatNumber(v, decimals)}{suffix}</div>
      {label && <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 34, color: "#9AA1AE", marginTop: 34, letterSpacing: ".06em" }}>{label}</div>}
    </div>
  );
};

/** Odometer / rolling digits: each column is a vertical strip 0-9-0 that rolls. */
export const RollingDigits: React.FC<Base & { to: number; digits: number; size?: number; suffix?: string; from?: number }> = ({ to, digits, from = 0, start = 0, dur = 60, size = 220, color = theme.lime, suffix = "" }) => {
  const frame = useCurrentFrame();
  const v = counterValue(frame, { from, to, start, dur, ease: easeOutCubic });
  const pos = odometerPositions(v, digits); const lh = size * 1.08;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: theme.body, fontWeight: 900, color }}>
      {pos.map((p, i) => (
        <div key={i} style={{ height: lh, width: size * 0.62, overflow: "hidden", position: "relative", margin: "0 3px", borderRadius: 18, background: "#161A22", border: "2px solid #2D3340", boxShadow: "inset 0 -14px 24px rgba(0,0,0,.35)" }}>
          <div style={{ transform: `translateY(${-(p % 10) * lh}px)` }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, j) => <div key={j} style={{ height: lh, lineHeight: `${lh}px`, fontSize: size, textAlign: "center" }}>{d}</div>)}
          </div>
        </div>
      ))}
      {suffix && <div style={{ fontSize: size * 0.7, marginLeft: 14, lineHeight: `${lh}px`, height: lh }}>{suffix}</div>}
    </div>
  );
};

export const ProgressBar: React.FC<Base & { to?: number; width?: number; height?: number; label?: string }> = ({ to = 100, start = 0, dur = 60, width = 900, height = 44, color = theme.lime, label }) => {
  const frame = useCurrentFrame(); const v = counterValue(frame, { from: 0, to, start, dur, ease: easeOutCubic });
  return (
    <div style={{ width, fontFamily: theme.body }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 40, color: "#fff", marginBottom: 12 }}><span>{label}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(v)}%</span></div>
      <div style={{ height, borderRadius: height / 2, background: "#1E222B", overflow: "hidden", border: "2px solid #2D3340" }}><div style={{ width: `${v}%`, height: "100%", borderRadius: height / 2, background: `linear-gradient(90deg, ${color}, #E6FF7A)`, boxShadow: `0 0 24px ${color}` }} /></div>
    </div>
  );
};

export const CircularProgress: React.FC<Base & { to?: number; size?: number; stroke?: number; showValue?: boolean }> = ({ to = 95, start = 0, dur = 70, size = 560, stroke = 44, color = theme.lime, showValue = true }) => {
  const frame = useCurrentFrame(); const v = counterValue(frame, { from: 0, to, start, dur, ease: easeOutCubic }); const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E222B" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ filter: `drop-shadow(0 0 16px ${color})` }} />
      </svg>
      {showValue && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.body, fontWeight: 900, fontSize: size * 0.3, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{Math.round(v)}%</div>}
    </div>
  );
};

/** Countdown from `from` seconds to 0 with a ring that depletes and a pulse on each tick. */
export const Countdown: React.FC<Base & { from?: number; size?: number }> = ({ from = 10, start = 0, dur = 300, size = 420, color = theme.amber }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = clamp((frame - start) / dur) * from; const left = Math.max(0, from - t); const sec = Math.ceil(left);
  const tickFrame = start + Math.floor((from - sec) * (dur / from)); const pulse = spring({ frame: frame - tickFrame, fps, config: SPRING.slam });
  const r = size / 2 - 20, c = 2 * Math.PI * r; const mm = String(Math.floor(sec / 60)).padStart(2, "0"), ss = String(sec % 60).padStart(2, "0");
  return (
    <div style={{ position: "relative", width: size, height: size, transform: `scale(${1 + 0.05 * (1 - pulse)})` }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E222B" strokeWidth={22} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={22} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (t / from)} style={{ filter: `drop-shadow(0 0 14px ${color})` }} /></svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.mono, fontWeight: 800, fontSize: size * 0.28, color: "#fff" }}>{mm}:{ss}</div>
    </div>
  );
};

export type Bar = { label: string; value: number; color?: string };
export const BarChart: React.FC<Base & { bars: Bar[]; width?: number; height?: number; max?: number; stagger?: number; unit?: string }> = ({ bars, start = 0, dur = 50, width = 940, height = 640, max, stagger = 8, color = theme.lime, unit = "" }) => {
  const frame = useCurrentFrame(); const m = max ?? Math.max(...bars.map((b) => b.value)) * 1.15; const bw = width / bars.length;
  return (
    <svg width={width} height={height + 90} style={{ overflow: "visible", fontFamily: theme.body }}>
      {[0, 0.25, 0.5, 0.75, 1].map((g) => <line key={g} x1={0} x2={width} y1={height - g * height} y2={height - g * height} stroke="#2D3340" strokeWidth={2} />)}
      {bars.map((b, i) => {
        const p = easeOutExpo(clamp((frame - start - i * stagger) / dur)); const h = (b.value / m) * height * p; const top = Math.max(...bars.map((x) => x.value)) === b.value;
        const x = i * bw + bw * 0.14, w = bw * 0.72, col = b.color ?? (top ? color : "#4A5262");
        return (
          <g key={i}>
            <rect x={x} y={height - h} width={w} height={h} rx={14} fill={col} style={{ filter: top ? `drop-shadow(0 0 18px ${col})` : "none" }} />
            <text x={x + w / 2} y={height - h - 16} textAnchor="middle" fontWeight={900} fontSize={44} fill="#fff" style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(b.value * p)}{unit}</text>
            <text x={x + w / 2} y={height + 56} textAnchor="middle" fontWeight={800} fontSize={34} fill="#C5CAD3">{b.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

export const LineChart: React.FC<Base & { points: number[]; width?: number; height?: number }> = ({ points, start = 0, dur = 70, width = 940, height = 520, color = theme.cyan }) => {
  const frame = useCurrentFrame(); const mx = Math.max(...points) * 1.1; const xy = points.map((v, i) => [(i / (points.length - 1)) * width, height - (v / mx) * height]);
  const d = xy.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" "); const p = easeOutCubic(clamp((frame - start) / dur));
  return (
    <svg width={width} height={height + 20} style={{ overflow: "visible" }}>
      <defs><linearGradient id="lcFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${d} L${width},${height} L0,${height} Z`} fill="url(#lcFill)" opacity={p} />
      <path d={d} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 0 12px ${color})` }} />
      {xy.map((q, i) => (i / (points.length - 1) <= p ? <circle key={i} cx={q[0]} cy={q[1]} r={9} fill="#0F1115" stroke={color} strokeWidth={5} /> : null))}
    </svg>
  );
};

/** numeric transition driven by a SPRING (overshoots then settles) between two values: use for "49 -> 120" style swaps synced to a cue frame. */
export const SpringNumber: React.FC<{ from: number; to: number; start?: number; decimals?: number; prefix?: string; suffix?: string; size?: number; color?: string; config?: { damping: number; stiffness: number; mass: number } }> = ({ from, to, start = 0, decimals = 0, prefix = "", suffix = "", size = 160, color = theme.cyan, config = { damping: 9, stiffness: 90, mass: 0.9 } }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const s = spring({ frame: frame - start, fps, config }); const v = from + (to - from) * s;
  return <div style={{ fontFamily: theme.body, fontWeight: 900, fontSize: size, color, fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em" }}>{prefix}{formatNumber(v, decimals)}{suffix}</div>;
};
