import type {Scene} from '../lib/schema';
import type {TimelineItem} from '../lib/timeline';
import type {Layout} from '../styles/theme';

export type SceneProps = {
  scene: Scene;
  layout: Layout;
  item: TimelineItem;
  footage: {file: string; credit: string} | null;
};

/** Stage rectangle for the 3D canvas: full-bleed in portrait, left 58% in landscape (text sits on the RTL start side). */
export const stageRect = (l: Layout) => (l.portrait ? {x: 0, y: 0, w: l.width, h: l.height} : {x: 0, y: 0, w: Math.round(l.width * 0.58), h: l.height});

/** Portrait: aim the camera above the model so the anatomy sits in the lower 60% and titles stay clear. */
export const lift = (t: [number, number, number], l: Layout, amount: number): [number, number, number] => (l.portrait ? [t[0], t[1] + amount, t[2]] : t);
