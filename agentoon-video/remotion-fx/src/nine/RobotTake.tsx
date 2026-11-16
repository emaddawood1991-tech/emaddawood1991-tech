import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import lip from "../../public/data/take-lip.json";
import { Robot, robotPose } from "../fx/RobotRig";

/** The ORDINARY robot footage used as input for the demos: the approved robot speaking and waving on a plain studio background. */
export const takePose = (frame: number) => robotPose(frame, { lip: lip as never, speaking: [[6, 170]], seed: 3, gestures: [{ type: "wave", at: 8, hand: "R" }, { type: "point", at: 100, angle: -75, hand: "R", len: 46 }] });
export const RobotTake: React.FC<{ transparent?: boolean }> = ({ transparent }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: transparent ? "transparent" : "linear-gradient(180deg,#8d949e 0%,#6f7782 100%)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: transparent ? 0 : 520, display: "flex", justifyContent: "center" }}><Robot pose={takePose(f)} width={transparent ? 540 : 620} shadow={!transparent} /></div>
    </AbsoluteFill>
  );
};
