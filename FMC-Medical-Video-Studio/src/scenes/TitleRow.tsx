import React from 'react';
import {AnimatedTitle} from '../components/ArabicTitles';
import {Presenter} from '../components/Presenter';
import type {Layout} from '../styles/theme';
import {FACE_VIEW, PIP} from './common';

/** Presenter bubble + right-aligned Arabic title (RTL: title starts on the right). */
export const TitleRow: React.FC<{layout: Layout; title: string; speech: {o: number[]; w: number[]} | null; audioFrom: number; seed: number; titleSize?: number}> = ({layout, title, speech, audioFrom, seed, titleSize}) => {
  const p = layout.portrait;
  const d = PIP(layout);
  return (
    <div style={{position: 'absolute', display: 'flex', alignItems: 'center', gap: 28, flexDirection: 'row-reverse', ...(p ? {left: layout.safe.left, right: layout.safe.right, top: layout.safe.top - 40} : {right: layout.safe.right, width: layout.width * 0.36, top: layout.height * 0.1})}}>
      <div style={{flex: 1}}>
        <AnimatedTitle text={title} size={titleSize ?? (p ? 62 : 54)} weight={800} display delay={6} align="right" />
      </div>
      <Presenter width={d} view={FACE_VIEW} speech={speech} audioFrom={audioFrom} seed={seed} circle />
    </div>
  );
};
