// Image-sequence subjects: transparent PNG frames of a footage take (the alpha channel is the subject mask / render layer).
export type Seq = { dir: string; frames: number; w: number; h: number };
export const ROBOT_SEQ: Seq = { dir: "robot-seq", frames: 170, w: 540, h: 756 };
export const seqSrc = (s: Seq, frame: number, loop = true) => `${s.dir}/f${String(loop ? ((frame % s.frames) + s.frames) % s.frames : Math.max(0, Math.min(frame, s.frames - 1))).padStart(4, "0")}.png`;
