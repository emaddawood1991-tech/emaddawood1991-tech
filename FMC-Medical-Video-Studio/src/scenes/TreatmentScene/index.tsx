import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {AnimatedTitle, ArabicText, InfoCard} from '../../components/ArabicTitles';
import {AnatomyViewer} from '../../components/AnatomyViewer';
import {EducationalTag, HUDBackdrop, HUDFrame} from '../../components/MedicalHUD';
import {orbit, SPINE_CENTER, type CamKey} from '../../components/Medical3D';
import {COLORS} from '../../styles/theme';
import type {SceneProps} from '../common';
import {lift, stageRect} from '../common';

export const TreatmentScene: React.FC<SceneProps> = ({scene, layout, item, footage}) => {
  const r = stageRect(layout);
  const d = item.duration;
  const bullets = scene.onScreen.bullets ?? [];
  const center = lift([0, SPINE_CENTER[1] + 2, SPINE_CENTER[2]], layout, 8);
  const R = layout.portrait ? 78 : 64;
  const cam: CamKey[] = [
    {f: 0, pos: orbit(center, R, 10, 4), target: center, fov: 33},
    {f: d, pos: orbit(center, R * 0.92, -40, 4), target: center, fov: 31},
  ];
  const sz = layout.portrait ? 38 : 32;
  const textBlock = (
    <div style={{position: 'absolute', display: 'flex', flexDirection: 'column', gap: 18, ...(layout.portrait ? {left: layout.safe.left, right: layout.safe.right, bottom: layout.safe.bottom + 10} : {right: layout.safe.right, width: layout.width * 0.36, top: layout.height * 0.34})}}>
      {bullets.map((b, i) => (
        <InfoCard key={b} text={b} size={sz} delay={30 + i * 30} />
      ))}
    </div>
  );
  const title = (
    <div style={{position: 'absolute', top: layout.portrait ? layout.safe.top : layout.height * 0.14, ...(layout.portrait ? {left: layout.safe.left, right: layout.safe.right} : {right: layout.safe.right, width: layout.width * 0.36})}}>
      <AnimatedTitle text={scene.onScreen.title ?? ''} size={layout.portrait ? 66 : 56} weight={800} display delay={6} />
    </div>
  );

  if (footage) {
    // Licensed stock footage, graded to the FMC palette. Clearly not FMC's own facility/staff.
    return (
      <AbsoluteFill>
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(footage.file)} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.85) contrast(1.05)'}} />
        </AbsoluteFill>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(16,42,67,0.75) 0%, rgba(18,59,102,0.35) 45%, rgba(16,42,67,0.85) 100%)'}} />
        {title}
        {textBlock}
        <div style={{position: 'absolute', top: layout.height - layout.safe.bottom + 46, width: '100%', display: 'flex', justifyContent: 'center', opacity: 0.8}}>
          <ArabicText size={layout.portrait ? 26 : 22} color={COLORS.silver} weight={500}>لقطات توضيحية للتمارين العلاجية</ArabicText>
        </div>
      </AbsoluteFill>
    );
  }

  // Fallback: rehabilitation concept animation (spine flexion/extension + core muscle highlight).
  return (
    <>
      <HUDBackdrop />
      <AnatomyViewer
        camera={cam}
        width={r.w}
        height={r.h}
        state={{showMuscles: true, muscleGlow: [10, 60], flexion: (f) => Math.sin((f / 45) * Math.PI) * 0.6}}
      />
      <HUDFrame x={r.x + 40} y={r.y + 40} w={r.w - 80} h={r.h - 80} />
      {title}
      {textBlock}
      <EducationalTag size={layout.portrait ? 28 : 24} x={r.w / 2} y={layout.portrait ? layout.height - layout.safe.bottom + 46 : layout.height - 110} />
    </>
  );
};
