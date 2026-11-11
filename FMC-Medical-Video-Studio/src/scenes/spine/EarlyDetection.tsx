import React from 'react';
import {CameraBox, CrossLayer, Footage} from '../../components/FMCCinematicTransition';
import {GuideLine, InfoChip} from '../../components/FMCMedicalHighlight';
import {FMCArabicTitle} from '../../components/FMCArabicTitle';
import type {SpineCtx} from '../../compositions/SpineEarlyDetection';

/** Scene 6 (early detection, ~29–38 s) in three beats: consultation → close-up of the medical explanation → reassuring clinical scene. */
export const EarlyDetection: React.FC<{c: SpineCtx}> = ({c}) => {
  const {fm, sec, layout} = c;
  const b1 = fm.from, b2 = fm.from + sec(2.75), b3 = fm.from + sec(5.35), end = fm.from + fm.duration + 6;
  return (
    <>
      <CrossLayer from={b1} dur={b2 - b1 + 14} fade={14}>
        <CameraBox from={b1} dur={b2 - b1 + 14} cam={{s0: 1.12, s1: 1.03}}><Footage file="footage/spine-realistic/s5_consult.mp4" /></CameraBox>
      </CrossLayer>
      <CrossLayer from={b2} dur={b3 - b2 + 14} fade={14}>
        <CameraBox from={b2} dur={b3 - b2 + 14} cam={{s0: 1.0, s1: 1.09, x0: 10, x1: -12}}><Footage file="footage/spine-realistic/s6b_closeup_chart.mp4" /></CameraBox>
      </CrossLayer>
      <CrossLayer from={b3} dur={end - b3} fade={14}>
        <CameraBox from={b3} dur={end - b3} cam={{s0: 1.08, s1: 1.0}}><Footage file="footage/spine-realistic/s6c_reassuring.mp4" /></CameraBox>
      </CrossLayer>
      <FMCArabicTitle text="الكشف المبكر يساعد على المتابعة المناسبة" highlight="المتابعة المناسبة" from={fm.from + 4} dur={end - fm.from - 4} top={layout.safe.top - 20} left={layout.safe.left} right={layout.safe.right} size={60} />
      <InfoChip text="خلال سنوات النمو" from={fm.from + sec(2.5)} to={b3 + 6} x={540} y={1180} />
      <InfoChip text="متابعة مناسبة لكل حالة" from={b3 + sec(0.6)} to={end - 4} x={540} y={1180} />
    </>
  );
};
