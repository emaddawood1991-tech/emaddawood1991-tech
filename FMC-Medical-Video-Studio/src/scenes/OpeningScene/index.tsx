import React from 'react';
import {AnimatedTitle} from '../../components/ArabicTitles';
import {AnatomyViewer} from '../../components/AnatomyViewer';
import {HUDBackdrop, HUDFrame} from '../../components/MedicalHUD';
import {orbit, SPINE_CENTER, type CamKey} from '../../components/Medical3D';
import {NameBug} from '../../components/FMCBranding';
import {LightSweep} from '../../components/SceneTransitions';
import type {SceneProps} from '../common';
import {lift, stageRect} from '../common';

export const OpeningScene: React.FC<SceneProps> = ({scene, layout, item}) => {
  const r = stageRect(layout);
  const d = item.duration;
  const R = layout.portrait ? 82 : 66;
  const tgt = lift(SPINE_CENTER, layout, 11);
  const cam: CamKey[] = [
    {f: 0, pos: orbit(SPINE_CENTER, R * 1.12, 25, 6), target: tgt, fov: 36},
    {f: d, pos: orbit(SPINE_CENTER, R * 0.9, -35, 3), target: tgt, fov: 32},
  ];
  const t = layout.portrait ? {top: layout.safe.top + 20, left: layout.safe.left, right: layout.safe.right} : {top: layout.height * 0.3, right: layout.safe.right, width: layout.width * 0.36};
  return (
    <>
      <HUDBackdrop />
      <AnatomyViewer camera={cam} width={r.w} height={r.h} state={{glow: [20, 70], boneOpacity: 1}} />
      <HUDFrame x={r.x + 40} y={r.y + 40} w={r.w - 80} h={r.h - 80} />
      <div style={{position: 'absolute', ...t, ...(layout.portrait ? {} : {})}}>
        <AnimatedTitle text={scene.onScreen.title ?? scene.narration} size={layout.portrait ? 92 : 78} weight={800} display delay={8} />
      </div>
      <div style={{position: 'absolute', top: layout.safe.top - 70, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <NameBug size={layout.portrait ? 34 : 28} />
      </div>
      <LightSweep start={4} />
    </>
  );
};
