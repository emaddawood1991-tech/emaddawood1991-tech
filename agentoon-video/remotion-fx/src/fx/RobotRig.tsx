import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp, easeOutCubic } from "./math";

/** The approved Agentoon robot as a React SVG rig (ported 1:1 from kit/robot.js: same shapes, colours, pivots). Pose is a pure function of the frame,
 *  so lip-sync, blinking and gestures are deterministic. Use <Robot/> for the character and robotPose()/useRobotPose() to drive it. */
const C = { line: "#0B0F1A", teal: "#19B5A5", tealD: "#128F83", head: "#E9EDF2", face: "#F8FAFC", eye: "#14234B", red: "#E5484D", glow: "#D8FFF6", hand: "#E9EDF2" };
export type Mouth = "smile" | "open" | "big" | "flat" | "worry";
export type RobotPose = { mouth: Mouth; blink: number; lookX: number; lookY: number; armL: number; armR: number; head: number; bob: number; happy: boolean; bulb: number; lift: number; sx: number; sy: number; glow: number };
export const NEUTRAL: RobotPose = { mouth: "smile", blink: 1, lookX: 0, lookY: 0, armL: 6, armR: -6, head: 0, bob: 0, happy: false, bulb: 1, lift: 0, sx: 1, sy: 1, glow: 0 };
export type Gesture = { type: "wave" | "point" | "celebrate" | "wow" | "nod"; at: number; angle?: number; hand?: "L" | "R"; len?: number };
export type Lip = { fps: number; a: number[] };

/** Pose at `frame`: lip-sync from the loudness envelope (mouth + head bob on stress), periodic blink, idle bob, and timed gestures. `speaking` = [startFrame, endFrame][] windows. */
export function robotPose(frame: number, o: { lip?: Lip; speaking?: [number, number][]; gestures?: Gesture[]; fps?: number; seed?: number } = {}): RobotPose {
  const fps = o.fps ?? 30, p: RobotPose = { ...NEUTRAL };
  p.bob = Math.sin((frame + (o.seed ?? 0)) / 14) * 2.5;
  const per = 84, ph = (frame + (o.seed ?? 0) * 7) % per; if (ph < 6) p.blink = 1 - 0.9 * Math.sin((ph / 6) * Math.PI);
  const sp = (o.speaking ?? []).some(([a, b]) => frame >= a && frame <= b);
  if (o.lip && sp) { const i = Math.floor((frame / fps) * o.lip.fps), a = o.lip.a[i] ?? 0; p.mouth = a < 0.12 ? "smile" : a < 0.42 ? "open" : "big"; if (a > 0.7 && (o.lip.a[i - 1] ?? 0) <= 0.7) p.head -= 2; p.head += (a > 0.5 ? 1.5 : 0) * Math.sin(frame / 3); }
  for (const g of o.gestures ?? []) {
    const t = frame - g.at, len = g.len ?? (g.type === "wave" ? 44 : g.type === "celebrate" ? 46 : g.type === "point" ? 50 : 24); if (t < 0 || t > len) continue; const u = t / len, env = Math.sin(clamp(u) * Math.PI);
    const arm = (g.hand ?? "R") === "L" ? "armL" : "armR", s = (g.hand ?? "R") === "L" ? -1 : 1;
    if (g.type === "wave") { p[arm] = s * (168 - 12 * Math.sin(t / 3.2)) * clamp(Math.min(u * 6, (1 - u) * 6)) + (1 - clamp(Math.min(u * 6, (1 - u) * 6))) * s * 6; }
    if (g.type === "point") { const th = g.angle ?? -80; p[arm] = lerpA(s * 6, th, clamp(Math.min(u * 5, (1 - u) * 5))); p.head += Math.sign(th) * -6 * env; }
    if (g.type === "celebrate") { p.armL = 6 + 149 * env; p.armR = -6 - 144 * env; p.happy = true; p.mouth = "big"; p.lift = -Math.abs(Math.sin(u * Math.PI * 2)) * 46; p.glow = env; p.sy = 1 + 0.06 * Math.sin(u * Math.PI * 4); }
    if (g.type === "wow") { p.lift = -28 * Math.sin(clamp(u * 2) * Math.PI) * (u < 0.5 ? 1 : 0); p.sx = 1.05 * 0 + 1 + 0.04 * env; p.sy = 1 + 0.1 * env; p.mouth = "open"; p.bulb = 1 + 0.5 * env; p.head = -6 * env; }
    if (g.type === "nod") { p.head = 0; p.lookY = 0; p.bob += 7 * Math.sin(u * Math.PI * 4) * (1 - u); }
  }
  return p;
}
const lerpA = (a: number, b: number, t: number) => a + (b - a) * t;
export const useRobotPose = (o: Parameters<typeof robotPose>[1] = {}) => robotPose(useCurrentFrame(), o);

/** the character. `width` in px (height = 1.4 x width). `neon` applies SVG filter ids defined by the parent when set (see NeonOutline children mode). */
export const Robot: React.FC<{ pose?: RobotPose; width?: number; shadow?: boolean; style?: React.CSSProperties; flip?: boolean }> = ({ pose = NEUTRAL, width = 300, shadow = true, style, flip }) => {
  const p = pose; const st = { stroke: C.line, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const eye = (cx: number) => <g transform={`translate(${p.lookX},${p.lookY}) translate(${cx},90) scale(${1},${p.blink}) translate(${-cx},-90)`}><ellipse cx={cx} cy={90} rx={9} ry={14} fill={C.eye} /><circle cx={cx + 3} cy={85} r={3.2} fill="#fff" /></g>;
  const mouth = { smile: <path d="M84 110 Q100 124 116 110" fill="none" stroke={C.eye} strokeWidth={5} strokeLinecap="round" />, open: <ellipse cx={100} cy={114} rx={9} ry={8} fill={C.eye} />, flat: <path d="M88 114 L112 114" fill="none" stroke={C.eye} strokeWidth={5} strokeLinecap="round" />, worry: <path d="M86 118 Q100 106 114 118" fill="none" stroke={C.eye} strokeWidth={5} strokeLinecap="round" />, big: <path d="M80 106 Q100 134 120 106 Z" fill={C.eye} /> }[p.mouth];
  return (
    <svg viewBox="0 0 200 280" width={width} height={width * 1.4} style={{ overflow: "visible", ...style }}>
      {shadow && <ellipse cx={100} cy={272} rx={52} ry={8} fill="#000" opacity={0.22} />}
      <g transform={`translate(0,${p.lift}) ${flip ? "translate(200,0) scale(-1,1)" : ""} translate(100,272) scale(${p.sx},${p.sy}) translate(-100,-272)`}>
        <g><rect x={72} y={222} width={20} height={38} rx={10} fill={C.tealD} {...st} /><ellipse cx={80} cy={264} rx={17} ry={8} fill={C.line} /><rect x={108} y={222} width={20} height={38} rx={10} fill={C.tealD} {...st} /><ellipse cx={120} cy={264} rx={17} ry={8} fill={C.line} /></g>
        <g transform={`translate(0,${p.bob})`}>
          <g transform={`rotate(${p.armL} 61 162)`}><rect x={52} y={156} width={18} height={52} rx={9} fill={C.teal} {...st} /><circle cx={61} cy={214} r={11} fill={C.hand} {...st} /></g>
          <g transform={`rotate(${p.armR} 139 162)`}><rect x={130} y={156} width={18} height={52} rx={9} fill={C.teal} {...st} /><circle cx={139} cy={214} r={11} fill={C.hand} {...st} /></g>
          <rect x={56} y={136} width={88} height={96} rx={30} fill={C.teal} {...st} />
          <circle cx={100} cy={184} r={20} fill={C.glow} opacity={p.glow * 0.9} /><circle cx={100} cy={184} r={11} fill={C.glow} stroke={C.line} strokeWidth={2.5} />
          <g transform={`rotate(${p.head} 100 136)`}>
            <line x1={100} y1={42} x2={100} y2={16} {...st} /><circle cx={100} cy={11} r={9 * p.bulb} fill={C.red} {...st} />
            <rect x={23} y={76} width={14} height={32} rx={7} fill={C.tealD} {...st} /><rect x={163} y={76} width={14} height={32} rx={7} fill={C.tealD} {...st} />
            <rect x={34} y={40} width={132} height={100} rx={36} fill={C.head} {...st} /><rect x={50} y={58} width={100} height={64} rx={24} fill={C.face} opacity={0.9} />
            {p.happy ? <g fill="none" stroke={C.eye} strokeWidth={6} strokeLinecap="round"><path d="M68 96 Q78 80 88 96" /><path d="M112 96 Q122 80 132 96" /></g> : <g>{eye(78)}{eye(122)}</g>}
            {mouth}
          </g>
        </g>
      </g>
    </svg>
  );
};
