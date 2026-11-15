import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { circleReveal, depthPush, diagonalWipe, whip } from "../fx/cinematic";
import { SCENES } from "./scenes";

export const TRANSITION = 14;
export const SHOWCASE_FRAMES = SCENES.reduce((a, s) => a + s.dur, 0) - TRANSITION * (SCENES.length - 1);
const pres = (p: string) => p === "circle" ? circleReveal({ cx: 50, cy: 46 }) : p === "diag" ? diagonalWipe(30) : p === "depth" ? depthPush() : whip(1);

/** All effects back to back; the transitions between scenes are the "professional scene transitions" demo (circle reveal, diagonal wipe, depth push, whip). */
export const Showcase: React.FC = () => (
  <TransitionSeries>
    {SCENES.flatMap((s, i) => {
      const seq = <TransitionSeries.Sequence key={s.id} durationInFrames={s.dur}><s.C /></TransitionSeries.Sequence>;
      return i < SCENES.length - 1 ? [seq, <TransitionSeries.Transition key={s.id + "t"} presentation={pres(s.pres) as never} timing={linearTiming({ durationInFrames: TRANSITION })} />] : [seq];
    })}
  </TransitionSeries>
);
