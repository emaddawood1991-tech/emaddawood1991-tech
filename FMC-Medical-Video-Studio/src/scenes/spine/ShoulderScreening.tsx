import React from 'react';
import {CrossLayer, CameraBox, Footage} from '../../components/FMCCinematicTransition';
import {BackObservationOverlay, ShoulderLevelGuide} from '../../components/FMCAnatomyOverlay';
import {InfoChip} from '../../components/FMCMedicalHighlight';
import {FMCArabicTitle} from '../../components/FMCArabicTitle';
import type {SpineCtx} from '../../compositions/SpineEarlyDetection';

/** Scene 1 (shoulders, 0–~5.7 s) and Scene 2 (clinical observation of the back, ~5.7–9.8 s). */
export const ShoulderScreening: React.FC<{c: SpineCtx}> = ({c}) => {
  const {op, an, x1, sec, layout} = c;
  const s1End = an.from + 6;
  const s2End = x1 + 14;
  return (
    <>
      {/* ---- scene 1 ---- */}
      <CrossLayer from={0} dur={s1End} fade={10}>
        <div style={{position: 'absolute', inset: 0, background: '#3b3d40'}} />
        <CameraBox from={0} dur={s1End} cam={{s0: 1.1, s1: 1.16, y0: 140, y1: 100, x0: 0, x1: -12}}>
          <Footage file="footage/spine-realistic/s1_back_view_v2.mp4" />
          {/* guide: subject faces the camera squarely during the first ~1.5 s of this trimmed clip (source px) */}
          <ShoulderLevelGuide from={sec(0.35)} to={sec(1.9)} left={[400, 824]} right={[836, 824]} />
        </CameraBox>
      </CrossLayer>
      <FMCArabicTitle text="هل لاحظت اختلافا في مستوى الكتفين؟" highlight="الكتفين" size={52} from={4} dur={op.duration - 6} top={layout.safe.top - 60} left={layout.safe.left} right={layout.safe.right} />
      <InfoChip text="مرجع أفقي للمقارنة" from={sec(0.5)} to={sec(1.95)} x={540} y={1130} />

      {/* ---- scene 2 ---- */}
      <CrossLayer from={an.from} dur={s2End - an.from} fade={14}>
        <CameraBox from={an.from} dur={s2End - an.from} cam={{s0: 1.05, s1: 1.13, x0: 0, x1: -10}}>
          <Footage file="footage/spine-realistic/s2_exam_hand.mp4" />
          <BackObservationOverlay from={an.from + 10} to={s2End - 4} />
        </CameraBox>
      </CrossLayer>
      <FMCArabicTitle text="علامات تستدعي فحص العمود الفقري" highlight="فحص" from={an.from + 6} dur={s2End - an.from - 6} top={layout.safe.top - 20} left={layout.safe.left} right={layout.safe.right} />
      <InfoChip text="ملاحظة تماثل الظهر" from={an.from + sec(1.2)} to={s2End - 4} x={540} y={1330} />
    </>
  );
};
