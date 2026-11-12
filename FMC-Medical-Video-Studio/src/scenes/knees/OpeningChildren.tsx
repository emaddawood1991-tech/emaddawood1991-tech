import React from 'react';
import {CameraBox, CrossLayer, Footage} from '../../components/FMCCinematicTransition';
import {FMCArabicTitle} from '../../components/FMCArabicTitle';
import type {KneeCtx} from '../../compositions/KneeAlignmentEpisode';

/** Scene 1: real children's legs (licensed stock; shown as an everyday question, not as a diagnosis). Slow downward tracking, then a walking toddler. */
export const OpeningChildren: React.FC<{c: KneeCtx}> = ({c}) => {
  const {op, an, sec, layout} = c;
  const mid = sec(3.5);
  return (
    <>
      <CrossLayer from={0} dur={mid + 14} fade={10}>
        <CameraBox from={0} dur={mid + 14} cam={{s0: 1.22, s1: 1.1, y0: -150, y1: 70, origin: '50% 30%'}}><Footage file="footage/knock-knees-bow-legs/s1a_child_legs.mp4" /></CameraBox>
      </CrossLayer>
      <CrossLayer from={mid} dur={an.from + 6 - mid} fade={14}>
        <CameraBox from={mid} dur={an.from + 6 - mid} cam={{s0: 1.12, s1: 1.02, x0: 0, x1: 0}}><Footage file="footage/knock-knees-bow-legs/s1b_toddler_walking.mp4" /></CameraBox>
      </CrossLayer>
      <FMCArabicTitle text="هل شكل ساقي طفلك طبيعي؟" highlight="طبيعي" from={6} dur={op.duration - 8} top={layout.safe.top - 40} left={layout.safe.left} right={layout.safe.right} />
    </>
  );
};
