import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Robot2, pose2, walkDistance, Walk, Gest2 } from "../fx/RobotRig2";
import TL from "../../public/data/fsk-timeline.json";

/** Full-body test: walks in, stops, points at the "building", presents with one arm, explains with both hands, walks aside (facing left), invites. Head to feet visible. */
export const WALK_FRAMES = 390;
const W = 520, K = W / 200, FLOOR = 1520;
const WALKS: Walk[] = [{ from: 4, to: 118, ramp: 14 }, { from: 258, to: 322, ramp: 12 }];
const GESTS: Gest2[] = [{ type: "point", from: 124, to: 196 }, { type: "present", from: 200, to: 250, hand: "R" }, { type: "explain", from: 252, to: 300 }, { type: "both", from: 300, to: 340 }, { type: "invite", from: 340, to: 390 }];
export const RobotWalkTest: React.FC = () => {
  const f = useCurrentFrame();
  const x1 = -300 + walkDistance(f, WALKS[0]) * K; const x2 = walkDistance(f, WALKS[1]) * K; const aside = f > 250; const x = aside ? 470 + 0 - x2 + 0 : x1;
  const pose = pose2(f, { lip: TL.lip as any, speaking: [[30, 390]], walks: WALKS, gestures: GESTS, seed: 3 });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#2B1A10 0%,#0B0705 100%)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: FLOOR, height: 400, background: "linear-gradient(180deg,#3a2616,#120b07)", borderTop: "4px solid #e0a84a" }} />
      <div style={{ position: "absolute", left: 640, top: 760, width: 380, height: 760, background: "linear-gradient(180deg,#e0a84a33,#e0a84a11)", border: "3px solid #e0a84a", color: "#e0a84a", fontFamily: "monospace", fontSize: 30, padding: 20 }}>BUILDING<br />(placeholder for the test)</div>
      <div style={{ position: "absolute", left: x, top: FLOOR - W * 1.4 * (272 / 280), zIndex: 5 }}><Robot2 pose={pose} width={W} flip={aside && f < 330} shadow /></div>
      <div style={{ position: "absolute", left: 20, top: 20, color: "#fff", fontFamily: "monospace", fontSize: 28 }}>frame {f} · full-body test</div>
    </AbsoluteFill>
  );
};
