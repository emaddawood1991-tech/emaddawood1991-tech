import React from "react";
import { clamp } from "./math";
import { RobotPose, NEUTRAL, robotPose, Lip } from "./RobotRig";

/** FULL-BODY control layer for the approved Agentoon robot (same shapes/colours/pivots as kit/robot.js and RobotRig.tsx; identity unchanged).
 *  Added controls: hip-pivot leg swing (legL/legR) + foot lift, body lean/weight shift, arm extension (arms reach out to point/present), hand wrist offset.
 *  Walking: leg angle = A sin(u); the stance foot moves backwards relative to the body at exactly the speed the body moves forwards
 *  (body speed = L * dTheta/dt of the stance leg), so planted feet do not slide. No Blender rig exists in the repo: this is the compatible control layer. */
const C = { line: "#0B0F1A", teal: "#19B5A5", tealD: "#128F83", head: "#E9EDF2", face: "#F8FAFC", eye: "#14234B", red: "#E5484D", glow: "#D8FFF6", hand: "#E9EDF2" };
export type Pose2 = RobotPose & { legL: number; legR: number; footL: number; footR: number; lean: number; extL: number; extR: number; handL: number; handR: number };
export const NEUTRAL2: Pose2 = { ...NEUTRAL, legL: 0, legR: 0, footL: 0, footR: 0, lean: 0, extL: 1, extR: 1, handL: 0, handR: 0 };
export const LEG_LEN = 40; // viewBox units from hip pivot (y=224) to foot centre (y=264)

export const Robot2: React.FC<{ pose?: Pose2; width?: number; shadow?: boolean; style?: React.CSSProperties; flip?: boolean }> = ({ pose = NEUTRAL2, width = 300, shadow = true, style, flip }) => {
  const p = pose; const st = { stroke: C.line, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const eye = (cx: number) => <g transform={`translate(${p.lookX},${p.lookY}) translate(${cx},90) scale(${1},${p.blink}) translate(${-cx},-90)`}><ellipse cx={cx} cy={90} rx={9} ry={14} fill={C.eye} /><circle cx={cx + 3} cy={85} r={3.2} fill="#fff" /></g>;
  const mouth = { smile: <path d="M84 110 Q100 124 116 110" fill="none" stroke={C.eye} strokeWidth={5} strokeLinecap="round" />, open: <ellipse cx={100} cy={114} rx={9} ry={8} fill={C.eye} />, flat: <path d="M88 114 L112 114" fill="none" stroke={C.eye} strokeWidth={5} strokeLinecap="round" />, worry: <path d="M86 118 Q100 106 114 118" fill="none" stroke={C.eye} strokeWidth={5} strokeLinecap="round" />, big: <path d="M80 106 Q100 134 120 106 Z" fill={C.eye} /> } as any;
  const arm = (side: "L" | "R") => {
    const L = side === "L"; const ext = L ? p.extL : p.extR; const ang = L ? p.armL : p.armR; const px = L ? 61 : 139; const hx = (L ? p.handL : p.handR) * (L ? -1 : 1);
    return (
      <g transform={`rotate(${ang} ${px} 162)`}>
        <rect x={px - 9} y={156} width={18} height={52 * ext} rx={9} fill={C.teal} {...st} />
        <circle cx={px + hx} cy={214 + 52 * (ext - 1)} r={11 + (ext > 1.1 ? 1.5 : 0)} fill={C.hand} {...st} />
      </g>
    );
  };
  return (
    <svg viewBox="0 0 200 280" width={width} height={width * 1.4} style={{ overflow: "visible", ...style }}>
      {shadow && <ellipse cx={100} cy={272} rx={52} ry={8} fill="#000" opacity={0.22} />}
      <g transform={`translate(0,${p.lift}) ${flip ? "translate(200,0) scale(-1,1)" : ""} translate(100,272) scale(${p.sx},${p.sy}) translate(-100,-272)`}>
        <g transform={`translate(0,${-p.footL}) rotate(${p.legL} 82 224)`}><rect x={72} y={222} width={20} height={38} rx={10} fill={C.tealD} {...st} /><ellipse cx={80} cy={264} rx={17} ry={8} fill={C.line} /></g>
        <g transform={`translate(0,${-p.footR}) rotate(${p.legR} 118 224)`}><rect x={108} y={222} width={20} height={38} rx={10} fill={C.tealD} {...st} /><ellipse cx={120} cy={264} rx={17} ry={8} fill={C.line} /></g>
        <g transform={`translate(0,${p.bob}) rotate(${p.lean} 100 232)`}>
          {arm("L")}{arm("R")}
          <rect x={56} y={136} width={88} height={96} rx={30} fill={C.teal} {...st} />
          <circle cx={100} cy={184} r={20} fill={C.glow} opacity={p.glow * 0.9} /><circle cx={100} cy={184} r={11} fill={C.glow} stroke={C.line} strokeWidth={2.5} />
          <g transform={`rotate(${p.head} 100 136)`}>
            <line x1={100} y1={42} x2={100} y2={16} {...st} /><circle cx={100} cy={11} r={9 * p.bulb} fill={C.red} {...st} />
            <rect x={23} y={76} width={14} height={32} rx={7} fill={C.tealD} {...st} /><rect x={163} y={76} width={14} height={32} rx={7} fill={C.tealD} {...st} />
            <rect x={34} y={40} width={132} height={100} rx={36} fill={C.head} {...st} /><rect x={50} y={58} width={100} height={64} rx={24} fill={C.face} opacity={0.9} />
            {p.happy ? <g fill="none" stroke={C.eye} strokeWidth={6} strokeLinecap="round"><path d="M68 96 Q78 80 88 96" /><path d="M112 96 Q122 80 132 96" /></g> : <g>{eye(78)}{eye(122)}</g>}
            {mouth[p.mouth]}
          </g>
        </g>
      </g>
    </svg>
  );
};

/* ---------- walking: stance foot speed == body speed ---------- */
export type Walk = { from: number; to: number; ramp?: number; amp?: number; stepsPerSec?: number };
const gaitW = (f: number, w: Walk) => { const r = w.ramp ?? 14; return clamp(Math.min((f - w.from) / r, (w.to - f) / r)); };
/** body forward speed in viewBox units per second at frame f (0 outside the walk) */
export const walkSpeed = (f: number, w: Walk, fps = 30) => {
  if (f < w.from || f > w.to) return 0; const A = ((w.amp ?? 24) * Math.PI) / 180 * gaitW(f, w), om = Math.PI * (w.stepsPerSec ?? 1.9), u = om * ((f - w.from) / fps);
  return LEG_LEN * Math.cos(A * Math.sin(u)) * A * om * Math.abs(Math.cos(u)); // d/dt (L sin(theta)) of the stance leg
};
/** forward distance (viewBox units) walked between w.from and frame f (numeric integral, deterministic) */
export const walkDistance = (f: number, w: Walk, fps = 30) => { let x = 0; const end = Math.min(f, w.to); for (let k = Math.ceil(w.from); k < end; k++) x += walkSpeed(k + 0.5, w, fps) / fps; return x; };
/** leg/arm/body pose for a walk at frame f (zero weight outside = neutral) */
export function walkPose(f: number, w: Walk, fps = 30): Partial<Pose2> {
  const wt = f >= w.from && f <= w.to ? gaitW(f, w) : 0; if (wt <= 0) return {};
  const A = (w.amp ?? 24) * wt, om = Math.PI * (w.stepsPerSec ?? 1.9), u = om * ((f - w.from) / fps), s = Math.sin(u), c = Math.cos(u);
  return { legL: -A * s, legR: A * s, footL: 7 * wt * Math.max(0, c), footR: 7 * wt * Math.max(0, -c), armL: 6 - 26 * wt * s, armR: -6 - 26 * wt * s, bob: 4.2 * wt * Math.abs(s) - 2, lean: 2.6 * wt * s, head: 1.6 * wt * s };
}
/** foot centre x relative to the hip in viewBox units (forward positive) for the planted-foot test */
export const footForward = (f: number, w: Walk, leg: "L" | "R", fps = 30) => { const p = walkPose(f, w, fps); const ang = ((leg === "L" ? -(p.legL ?? 0) : -(p.legR ?? 0)) * Math.PI) / 180; return LEG_LEN * Math.sin(ang); };

/* ---------- arm gestures (override arms/head/eyes; layered after the walk) ---------- */
export type Gest2 = { type: "point" | "present" | "both" | "explain" | "invite"; from: number; to: number; hand?: "L" | "R"; angle?: number; look?: number };
const eio = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
export function gesturePose(f: number, gs: Gest2[], fps = 30): Partial<Pose2> {
  const out: Partial<Pose2> = {};
  for (const g of gs) {
    if (f < g.from || f > g.to) continue; const k = eio(Math.min((f - g.from) / 10, (g.to - f) / 10)), t = (f - g.from) / fps, R = (g.hand ?? "R") === "R";
    const a = R ? "armR" : "armL", e = R ? "extR" : "extL", hd = R ? "handR" : "handL", sgn = R ? -1 : 1;
    if (g.type === "point") { const th = g.angle ?? -92; (out as any)[a] = (R ? -6 : 6) + (th - (R ? -6 : 6)) * k; (out as any)[e] = 1 + 0.26 * k; (out as any)[hd] = 2 * Math.sin(t * 5) * k; out.head = (out.head ?? 0) + (R ? 5 : -5) * k; out.lookX = (R ? 5 : -5) * k; out.lean = (out.lean ?? 0) + (R ? 3 : -3) * k; }
    if (g.type === "present") { const th = g.angle ?? -58; (out as any)[a] = (R ? -6 : 6) + (th * (R ? 1 : -1) - (R ? -6 : 6)) * k + 5 * Math.sin(t * 3.1) * k; (out as any)[e] = 1 + 0.18 * k; (out as any)[hd] = 3 * Math.sin(t * 4) * k; out.head = (out.head ?? 0) + (R ? 4 : -4) * k; }
    if (g.type === "both") { out.armL = 6 + (52 + 8 * Math.sin(t * 3.4)) * k; out.armR = -6 - (52 + 8 * Math.sin(t * 3.4 + 1.2)) * k; out.extL = out.extR = 1 + 0.12 * k; out.handL = 3 * Math.sin(t * 4.2) * k; out.handR = 3 * Math.sin(t * 4.2 + 1) * k; out.lean = (out.lean ?? 0) + 1.4 * Math.sin(t * 2) * k; out.head = (out.head ?? 0) + 3 * Math.sin(t * 2.3) * k; }
    if (g.type === "explain") { out.armL = 6 + (28 + 16 * Math.sin(t * 5.2)) * k; out.armR = -6 - (30 + 18 * Math.sin(t * 4.3 + 1.7)) * k; out.extL = 1 + 0.08 * k; out.extR = 1 + 0.08 * k; out.handL = 2.5 * Math.sin(t * 6) * k; out.handR = 2.5 * Math.sin(t * 5.1 + 2) * k; out.head = (out.head ?? 0) + 3 * Math.sin(t * 1.9) * k; }
    if (g.type === "invite") { const sw = eio((f - g.from) / 22); out.armL = 6 + (118 - 20 * (1 - sw)) * k; out.armR = -6 - (118 - 20 * (1 - sw)) * k; out.extL = out.extR = 1 + 0.15 * k; out.happy = false; out.mouth = "big"; out.lean = (out.lean ?? 0) - 2 * k; out.handL = 3 * Math.sin(t * 3) * k; out.handR = -3 * Math.sin(t * 3) * k; }
  }
  return out;
}
/** complete pose: lip-sync/blink/idle from robotPose + walk + gestures */
export function pose2(f: number, o: { lip?: Lip; speaking?: [number, number][]; walks?: Walk[]; gestures?: Gest2[]; fps?: number; seed?: number }): Pose2 {
  const fps = o.fps ?? 30; const base = robotPose(f, { lip: o.lip, speaking: o.speaking, fps, seed: o.seed });
  let p: Pose2 = { ...NEUTRAL2, ...base };
  for (const w of o.walks ?? []) p = { ...p, ...walkPose(f, w, fps) } as Pose2;
  const g = gesturePose(f, o.gestures ?? [], fps); p = { ...p, ...g } as Pose2;
  // gentle idle arm drift so standing hands are never frozen
  const idle = 1.6 * Math.sin(f / 21 + (o.seed ?? 0)); if (!g.armL) p.armL = (p.armL ?? 6) + idle; if (!g.armR) p.armR = (p.armR ?? -6) - idle * 0.8;
  return p;
}
