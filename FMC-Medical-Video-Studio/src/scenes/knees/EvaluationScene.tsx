import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraBox, CrossLayer, Footage} from '../../components/FMCCinematicTransition';
import {InfoChip, ss, win} from '../../components/FMCMedicalHighlight';
import {FMCArabicTitle} from '../../components/FMCArabicTitle';
import type {KneeCtx} from '../../compositions/KneeAlignmentEpisode';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Scene 5: a framed clinical window (child standing with the clinician → child examination) with three separately animated warning signs; Scene 6 first half: parent consultation. */
export const EvaluationScene: React.FC<{c: KneeCtx}> = ({c}) => {
  const f = useCurrentFrame();
  const {fm, cl, closeFrom, sec, layout} = c;
  const b2 = fm.from + sec(5.2);
  const end = fm.from + fm.duration + 6;
  const winTop = 360, winH = 700;
  const frameO = win(f, fm.from, end - 4, 16, 14);
  // voice-synchronised cues (narration 28.9–38.8 s): sign 1 ≈ +0.8 s, sign 2 ≈ +4.1 s, sign 3 ≈ +6.2 s
  const cue = [fm.from + sec(0.9), fm.from + sec(4.0), fm.from + sec(6.1)];
  return (
    <>
      <CrossLayer from={fm.from} dur={end - fm.from} fade={14}>
        <AbsoluteFill style={{background: 'linear-gradient(180deg,#0f1d2b,#0b1620)'}} />
        <div style={{position: 'absolute', left: layout.safe.left, right: layout.safe.right, top: winTop, height: winH, borderRadius: 30, overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.18)', opacity: frameO}}>
          <div style={{position: 'absolute', inset: 0}}>
            <CrossLayer from={fm.from} dur={b2 - fm.from + 14} fade={14}>
              <CameraBox from={fm.from} dur={b2 - fm.from + 14} cam={{s0: 1.06, s1: 1.0, origin: '50% 80%'}}>
                <Footage file="footage/knock-knees-bow-legs/s5a_child_standing_clinic.mp4" pos={`50% ${88 - 38 * ss(clamp((f - fm.from) / (b2 - fm.from)))}%`} />
              </CameraBox>
            </CrossLayer>
            <CrossLayer from={b2} dur={end - b2} fade={14}>
              <CameraBox from={b2} dur={end - b2} cam={{s0: 1.15, s1: 1.04}}><Footage file="footage/knock-knees-bow-legs/s5b_child_exam.mp4" /></CameraBox>
            </CrossLayer>
          </div>
        </div>
      </CrossLayer>
      <FMCArabicTitle text="متى نراجع الطبيب؟" highlight="الطبيب" from={fm.from + 4} dur={end - fm.from - 4} top={layout.safe.top - 40} left={layout.safe.left} right={layout.safe.right} />
      <InfoChip text="اختلاف واضح بين الساقين" from={cue[0]} to={end - 4} x={540} y={winTop + winH + 38} />
      <InfoChip text="ازدياد التقوس" from={cue[1]} to={end - 4} x={540} y={winTop + winH + 118} />
      <InfoChip text="ألم أو عرج" from={cue[2]} to={end - 4} x={540} y={winTop + winH + 198} />
      {/* scene 6, first half: reassuring parent consultation (full frame) */}
      <CrossLayer from={cl.from} dur={closeFrom - cl.from + 20} fade={16}>
        <CameraBox from={cl.from} dur={closeFrom - cl.from + 20} cam={{s0: 1.12, s1: 1.02, y0: 40, y1: 0}}><Footage file="footage/knock-knees-bow-legs/s6a_parent_consult.mp4" /></CameraBox>
      </CrossLayer>
      {void ss}{void clamp}
    </>
  );
};
