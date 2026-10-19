import type {Content, SceneId, VoiceManifest} from './schema';

export const FPS = 30;
export const OVERLAP = 10; // frames shared between neighbouring scenes (crossfade)
const AUDIO_LEAD = 8; // frames of silence before narration starts in a scene
const AUDIO_TAIL = 14;

export type TimelineItem = {
  id: SceneId;
  from: number;
  duration: number;
  audioFile: string | null;
  audioFrom: number; // frame offset inside the scene
  audioFrames: number;
};

export const computeTimeline = (content: Content, manifest: VoiceManifest | null): TimelineItem[] => {
  let cursor = 0;
  const LEAD = content.timing?.lead ?? AUDIO_LEAD, TAIL = content.timing?.tail ?? AUDIO_TAIL; // per-episode override (short reels)
  return content.scenes.map((scene, i) => {
    const a = manifest?.scenes.find((s) => s.id === scene.id) ?? null;
    const audioFrames = a ? Math.ceil(a.durationSec * FPS) : 0;
    const planned = Math.round(scene.plannedSec * FPS);
    // Narration decides the timing: never cut it off, never rewrite it.
    const duration = Math.max(planned, a ? audioFrames + LEAD + TAIL + OVERLAP : 0);
    const from = i === 0 ? 0 : cursor - OVERLAP;
    cursor = from + duration;
    return {id: scene.id, from, duration, audioFile: a?.file ?? null, audioFrom: OVERLAP + LEAD, audioFrames};
  });
};

export const totalFrames = (tl: TimelineItem[]) => {
  const last = tl[tl.length - 1];
  return last.from + last.duration;
};
