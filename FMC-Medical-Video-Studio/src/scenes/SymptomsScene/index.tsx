import React from 'react';
import {useCurrentFrame} from 'remotion';
import {AnimatedTitle, InfoCard} from '../../components/ArabicTitles';
import {AnatomyViewer} from '../../components/AnatomyViewer';
import {Callout, EducationalTag, HUDBackdrop, HUDFrame} from '../../components/MedicalHUD';
import {ANCHORS, L45_FOCUS, orbit, projectToScreen, type CamKey} from '../../components/Medical3D';
import {COLORS} from '../../styles/theme';
import {TitleRow} from '../TitleRow';
import type {SceneProps} from '../common';
import {lift, stageRect} from '../common';

export const SymptomsScene: React.FC<SceneProps> = ({scene, layout, item, speech}) => {
  const frame = useCurrentFrame();
  const r = stageRect(layout);
  const d = item.duration;
  const R = layout.portrait ? 60 : 44;
  const target = lift([L45_FOCUS[0], L45_FOCUS[1] - 1.5, L45_FOCUS[2]], layout, -1);
  const cam: CamKey[] = [
    {f: 0, pos: orbit(target, R * 1.5, -75, 6), target, fov: 32},
    {f: 40, pos: orbit(target, R, -55, 3), target, fov: 28},
    {f: d, pos: orbit(target, R * 0.92, -35, 2), target, fov: 27},
  ];
  const bullets = scene.onScreen.bullets ?? [];
  const sz = layout.portrait ? 40 : 34;
  const pt = projectToScreen(ANCHORS.discL4L5, cam, frame, r.w, r.h);
  return (
    <>
      <HUDBackdrop />
      <AnatomyViewer camera={cam} width={r.w} height={r.h} state={{bulge: [30, 90], glow: [30, 90], nerveGlow: [60, 110]}} />
      <HUDFrame x={r.x + 40} y={r.y + 40} w={r.w - 80} h={r.h - 80} />
      <Callout label="مثال توضيحي لبروز القرص" anchor={pt} labelY={layout.portrait ? r.h * 0.36 : r.h * 0.3} edge="left" margin={layout.portrait ? 70 : 60} delay={50} size={sz} accent={COLORS.amber} screenW={r.w} />
      <TitleRow layout={layout} title={scene.onScreen.title ?? ''} speech={speech} audioFrom={item.audioFrom} seed={3} />
      <div
        style={{
          position: 'absolute', display: 'flex', flexDirection: 'column', gap: 18,
          ...(layout.portrait ? {left: layout.safe.left, right: layout.safe.right, bottom: layout.safe.bottom + 10} : {right: layout.safe.right, width: layout.width * 0.36, top: layout.height * 0.34}),
        }}
      >
        {bullets.map((b, i) => (
          <InfoCard key={b} text={b} size={layout.portrait ? 38 : 32} delay={22 + i * 26} />
        ))}
      </div>
      <EducationalTag size={layout.portrait ? 28 : 24} x={r.w / 2} y={layout.portrait ? layout.height - layout.safe.bottom + 46 : layout.height - 110} />
    </>
  );
};
