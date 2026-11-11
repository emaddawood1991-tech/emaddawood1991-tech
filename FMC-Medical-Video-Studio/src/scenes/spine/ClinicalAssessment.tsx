import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {CameraBox, CrossLayer, Footage} from '../../components/FMCCinematicTransition';
import {GuideLine, InfoChip, ss, win} from '../../components/FMCMedicalHighlight';
import {FMCArabicTitle} from '../../components/FMCArabicTitle';
import type {SpineCtx} from '../../compositions/SpineEarlyDetection';

/** Scene 5 (assessment, ~22.4–29.3 s): clinician with the chart → clinician reviewing a radiograph. Two separate supporting ideas; imaging is "when needed". */
export const ClinicalAssessment: React.FC<{c: SpineCtx}> = ({c}) => {
  const f = useCurrentFrame();
  const {tr, trXray, sec, layout} = c;
  const end = tr.from + tr.duration + 10;
  const pip = win(f, trXray + sec(1.0), end - 6, 18, 14);
  return (
    <>
      <CrossLayer from={tr.from} dur={trXray - tr.from + 14} fade={14}>
        <CameraBox from={tr.from} dur={trXray - tr.from + 14} cam={{s0: 1.0, s1: 1.1, x0: 0, x1: 14}}><Footage file="footage/spine-realistic/s4_consult.mp4" /></CameraBox>
      </CrossLayer>
      <CrossLayer from={trXray} dur={end - trXray} fade={14}>
        <CameraBox from={trXray} dur={end - trXray} cam={{s0: 1.0, s1: 1.08, y0: 0, y1: -18}}><Footage file="footage/spine-realistic/s4_xray_review.mp4" /></CameraBox>
      </CrossLayer>
      <FMCArabicTitle text="التشخيص يبدأ بالتقييم الطبي" highlight="التقييم" from={tr.from + 4} dur={end - tr.from - 4} top={layout.safe.top - 20} left={layout.safe.left} right={layout.safe.right} />
      {/* supporting information, animated separately and in step with the narration */}
      <GuideLine p0={[170, 1120]} p1={[910, 1120]} from={tr.from + sec(0.8)} to={trXray + 6} draw={24} width={2} />
      <InfoChip text="الفحص السريري" from={tr.from + sec(0.9)} to={end - 4} x={540} y={1160} />
      <InfoChip text="التصوير عند الحاجة" from={trXray + sec(0.5)} to={end - 4} x={540} y={1250} />
      {/* small reference radiograph (illustrative) beside the second chip */}
      <AbsoluteFill style={{opacity: pip, transform: `translateY(${(1 - ss(pip)) * 24}px)`}}>
        <div style={{position: 'absolute', left: 72, top: 1010, width: 170, height: 324, borderRadius: 14, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.35)', boxShadow: '0 12px 34px rgba(0,0,0,0.45)'}}>
          <Img src={staticFile('medical/scoliosis_xray_pd_crop.png')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.95) contrast(1.05)'}} />
        </div>
      </AbsoluteFill>
    </>
  );
};
