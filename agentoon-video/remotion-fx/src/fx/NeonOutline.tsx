import React from "react";
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { SPRING, theme } from "./theme";
import { Seq, seqSrc } from "./subject";

/** /neon-outline: glowing outline that follows the ACTUAL alpha silhouette of the subject (RGBA PNG: robot render layer, cut-out presenter, Blender alpha pass).
 *  Built from SVG filters on the subject's own alpha, so it adapts to any silhouette:
 *   dilate(alpha) minus alpha = contour ring -> flooded with neon -> blurred for glow; a rotating bright band masks a travelling highlight along the contour;
 *   a pulse ring expands out of the silhouette on a beat; background is separated with a vignette + tinted halo. */
export type NeonProps = { intro?: boolean; seq?: Seq; src: string; imgW: number; imgH: number; x: number; y: number; width: number; color?: string; color2?: string; pulseEvery?: number; ring?: number; title?: string };

export const NeonOutline: React.FC<NeonProps> = ({ seq, src, imgW, imgH, x, y, width, color = theme.cyan, color2 = theme.magenta, pulseEvery = 45, ring = 5, title, intro = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const href = staticFile(seq ? seqSrc(seq, frame) : src); const k = width / imgW, h = imgH * k, pad = 90;
  const enter = spring({ frame, fps, config: SPRING.settle });
  const lineIn = interpolate(frame, [10, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const beat = (frame % pulseEvery) / pulseEvery; // 0..1 inside each pulse
  const pulseR = 4 + beat * 34, pulseA = (1 - beat) * 0.9 * (frame > 20 ? 1 : 0);
  const breathe = 0.78 + 0.22 * Math.sin(frame / 6);
  const sweep = (frame * 7) % 360;
  const r1 = Math.max(1, ring * k * 1.7), glow = 16 * breathe;

  return (
    <AbsoluteFill style={{ background: "#05060A", overflow: "hidden" }}>
      {/* background separation: dark field, tinted halo behind subject that pulses with the beat, faint grid, vignette */}
      <AbsoluteFill style={{ background: `radial-gradient(60% 42% at ${(x + width / 2) / 10.8}% ${(y + h / 2) / 19.2}%, ${color}33 0%, transparent 70%)`, opacity: 0.55 + 0.45 * (1 - beat) }} />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.05) 2px, transparent 2px)", backgroundSize: "90px 90px", backgroundPosition: `${frame * 1.2}px ${frame * 0.8}px`, maskImage: "radial-gradient(70% 55% at 50% 48%, #000 20%, transparent 75%)", WebkitMaskImage: "radial-gradient(70% 55% at 50% 48%, #000 20%, transparent 75%)" }} />
      <div style={{ position: "absolute", left: x - pad, top: y - pad + (1 - enter) * 120, width: width + pad * 2, height: h + pad * 2, opacity: Math.min(1, enter * 2) }}>
        <svg width={width + pad * 2} height={h + pad * 2} viewBox={`${-pad} ${-pad} ${width + pad * 2} ${h + pad * 2}`} style={{ overflow: "visible" }}>
          <defs>
            {/* contour ring from the silhouette's own alpha */}
            <filter id="nRing" filterUnits="userSpaceOnUse" x={-pad} y={-pad} width={width + pad * 2} height={h + pad * 2}>
              <feMorphology in="SourceAlpha" operator="dilate" radius={r1} result="d" />
              <feComposite in="d" in2="SourceAlpha" operator="out" result="ring" />
              <feFlood floodColor={color} result="c" /><feComposite in="c" in2="ring" operator="in" />
            </filter>
            <filter id="nRing2" filterUnits="userSpaceOnUse" x={-pad} y={-pad} width={width + pad * 2} height={h + pad * 2}>
              <feMorphology in="SourceAlpha" operator="dilate" radius={r1} result="d" />
              <feComposite in="d" in2="SourceAlpha" operator="out" result="ring" />
              <feFlood floodColor={color2} result="c" /><feComposite in="c" in2="ring" operator="in" />
            </filter>
            <filter id="nGlow" filterUnits="userSpaceOnUse" x={-pad} y={-pad} width={width + pad * 2} height={h + pad * 2}>
              <feMorphology in="SourceAlpha" operator="dilate" radius={r1 + 2} result="d" />
              <feGaussianBlur in="d" stdDeviation={glow} result="b" />
              <feFlood floodColor={color} result="c" /><feComposite in="c" in2="b" operator="in" />
            </filter>
            <filter id="nPulse" filterUnits="userSpaceOnUse" x={-pad} y={-pad} width={width + pad * 2} height={h + pad * 2}>
              <feMorphology in="SourceAlpha" operator="dilate" radius={pulseR * k * 1.2 + 2} result="d" />
              <feMorphology in="SourceAlpha" operator="dilate" radius={Math.max(1, pulseR * k * 1.2 - 3)} result="d0" />
              <feComposite in="d" in2="d0" operator="out" result="band" />
              <feGaussianBlur in="band" stdDeviation={1.5} result="bb" />
              <feFlood floodColor={color2} result="c" /><feComposite in="c" in2="bb" operator="in" />
            </filter>
            <linearGradient id="nBand" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#fff" stopOpacity="1" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
            <mask id="nSweep" maskUnits="userSpaceOnUse" x={-pad} y={-pad} width={width + pad * 2} height={h + pad * 2}>
              <g transform={`rotate(${sweep} ${width / 2} ${h / 2})`}><rect x={width / 2 - width * 0.5} y={-h} width={width} height={h * 3} fill="url(#nBand)" /></g>
            </mask>
          </defs>
          {/* 1 wide glow (breathing) */}
          <image href={href} width={width} height={h} filter="url(#nGlow)" opacity={0.85 * lineIn * breathe} />
          {/* 2 base contour */}
          <image href={href} width={width} height={h} filter="url(#nRing)" opacity={0.55 * lineIn} />
          {/* 3 travelling bright highlight along the contour (rotating band mask), two-tone */}
          <g mask="url(#nSweep)" opacity={lineIn}><image href={href} width={width} height={h} filter="url(#nRing2)" /></g>
          {/* 4 pulse ring expanding off the silhouette */}
          <image href={href} width={width} height={h} filter="url(#nPulse)" opacity={pulseA} />
          {/* 5 the subject itself on top */}
          <image href={href} width={width} height={h} />
        </svg>
      </div>
      {title && <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center", fontFamily: theme.body, fontWeight: 900, fontSize: 84, letterSpacing: "-.02em", color: "#fff", textShadow: `0 0 24px ${color}`, opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{title}</div>}
      <AbsoluteFill style={{ background: "radial-gradient(80% 60% at 50% 50%, transparent 55%, rgba(0,0,0,.65) 100%)" }} />
    </AbsoluteFill>
  );
};
