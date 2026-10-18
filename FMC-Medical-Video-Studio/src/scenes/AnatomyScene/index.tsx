import React from 'react';
import {useCurrentFrame} from 'remotion';
import {AnimatedTitle} from '../../components/ArabicTitles';
import {AnatomyViewer} from '../../components/AnatomyViewer';
import {Callout, EducationalTag, HUDBackdrop, HUDFrame} from '../../components/MedicalHUD';
import {ANCHORS, orbit, projectToScreen, SPINE_CENTER, type CamKey} from '../../components/Medical3D';
import type {SceneProps} from '../common';
import {lift, stageRect} from '../common';

export const AnatomyScene: React.FC<SceneProps> = ({scene, layout, item}) => {
  const frame = useCurrentFrame();
  const r = stageRect(layout);
  const d = item.duration;
  const R = layout.portrait ? 74 : 62;
  const center: [number, number, number] = [0, SPINE_CENTER[1] + 4, SPINE_CENTER[2]];
  const tgt = lift(center, layout, 7);
  const cam: CamKey[] = [
    {f: 0, pos: orbit(center, R * 1.05, -35, 3), target: tgt, fov: 34},
    {f: d, pos: orbit(center, R * 0.78, -75, 4), target: tgt, fov: 30},
  ];
  const sz = layout.portrait ? 40 : 34;
  const labels = scene.onScreen.bullets ?? [];
  const anchors = [ANCHORS.vertebraL3, ANCHORS.discL2L3, ANCHORS.nerveRoot];
  const pts = anchors.map((a) => projectToScreen(a, cam, frame, r.w, r.h));
  const edge: ('left' | 'right')[] = layout.portrait ? ['left', 'right', 'left'] : ['right', 'right', 'right'];
  const ys = layout.portrait ? [r.h * 0.42, r.h * 0.5, r.h * 0.6] : [r.h * 0.33, r.h * 0.5, r.h * 0.67];
  return (
    <>
      <HUDBackdrop />
      <AnatomyViewer camera={cam} width={r.w} height={r.h} />
      <HUDFrame x={r.x + 40} y={r.y + 40} w={r.w - 80} h={r.h - 80} />
      {labels.slice(0, 3).map((l, i) => (
        <Callout key={l} label={l} anchor={pts[i]} labelY={ys[i]} edge={edge[i]} margin={layout.portrait ? 70 : 60} delay={40 + i * 28} size={sz} screenW={r.w} />
      ))}
      <div style={{position: 'absolute', top: layout.portrait ? layout.safe.top : layout.height * 0.3, ...(layout.portrait ? {left: layout.safe.left, right: layout.safe.right} : {right: layout.safe.right, width: layout.width * 0.36})}}>
        <AnimatedTitle text={scene.onScreen.title ?? ''} size={layout.portrait ? 72 : 62} weight={800} display delay={6} />
      </div>
      <EducationalTag size={layout.portrait ? 28 : 24} x={r.w / 2} y={layout.portrait ? layout.height - layout.safe.bottom - 10 : layout.height - 110} />
    </>
  );
};
