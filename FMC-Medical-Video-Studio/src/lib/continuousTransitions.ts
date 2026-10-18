/**
 * CONTINUOUS-CAMERA TRANSITIONS — the next scene emerges from the previous one instead of cutting to a new card.
 * Original design (no code or assets from OneTake or any other project; OneTake's PolyForm-Noncommercial licence forbids commercial reuse,
 * so only the general idea "no slide-to-slide cuts" informed this).
 *
 * A transition is data + a key builder: camera keys through a via-waypoint, plus reveal windows telling the templates when the
 * outgoing information fades and the incoming information appears BESIDE the structure the camera has just reached.
 * `sfx` is `null` by construction: smooth motion needs no sound (FMC_AUDIO.transitionSFX = false).
 */
import type {CamKey, V3} from './cameraFlow';

export type CamPreset = {pos: V3; target: V3; fov: number};
export type TransitionName = 'doctorToSpine' | 'spineToExplanation' | 'explanationToTreatment' | 'treatmentToClosing';

export type TransitionSpec = {
  name: TransitionName;
  story: string;
  /** frames, at 30 fps. 40–90 keeps it calm: 1.3–3 s */
  frames: [number, number];
  /** Where along the path the via-waypoint sits (0..1) and how far it is pushed toward/away from the target (negative = closer). */
  via: {at: number; push: number; lateral: number};
  /** Reveal windows as fractions of the transition: outgoing info fades out, incoming info fades in beside the structure. */
  reveal: {outgoing: [number, number]; incoming: [number, number]};
  /** Always null: transitions never carry sound. */
  sfx: null;
};

export const TRANSITIONS: Record<TransitionName, TransitionSpec> = {
  doctorToSpine: {
    name: 'doctorToSpine', frames: [54, 84],
    story: 'The doctor indicates the lower back; the camera approaches that region and the scene becomes the detailed anatomical model (the model is already in the world, so nothing cuts).',
    via: {at: 0.5, push: -0.25, lateral: 0.1}, reveal: {outgoing: [0, 0.35], incoming: [0.55, 1]}, sfx: null,
  },
  spineToExplanation: {
    name: 'spineToExplanation', frames: [48, 72],
    story: 'The camera moves through the relevant anatomical structures; Arabic information appears beside the structure it describes.',
    via: {at: 0.5, push: -0.15, lateral: -0.18}, reveal: {outgoing: [0, 0.3], incoming: [0.5, 1]}, sfx: null,
  },
  explanationToTreatment: {
    name: 'explanationToTreatment', frames: [60, 90],
    story: 'The camera pulls back from the anatomy into the full-body rehabilitation demonstration.',
    via: {at: 0.45, push: 0.35, lateral: 0.05}, reveal: {outgoing: [0, 0.4], incoming: [0.6, 1]}, sfx: null,
  },
  treatmentToClosing: {
    name: 'treatmentToClosing', frames: [48, 78],
    story: 'The last clinical image settles into the branded ending: presenter small beside the original logo.',
    via: {at: 0.5, push: 0.2, lateral: 0}, reveal: {outgoing: [0, 0.45], incoming: [0.55, 1]}, sfx: null,
  },
};

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t) as V3;

/** Camera keys for one transition: hold at `from` (f0), via-waypoint, arrive at `to` (f1). Feed the result to sampleCameraFlow. */
export const transitionKeys = (name: TransitionName, f0: number, f1: number, from: CamPreset, to: CamPreset): CamKey[] => {
  const spec = TRANSITIONS[name];
  const base = mix(from.pos, to.pos, spec.via.at);
  const tgt = mix(from.target, to.target, spec.via.at);
  const dir = [base[0] - tgt[0], base[1] - tgt[1], base[2] - tgt[2]];
  const len = Math.hypot(...dir) || 1;
  const k = spec.via.push; // metres toward (−) or away (+) from the target
  const side = [-dir[2] / len, 0, dir[0] / len];
  const pos: V3 = [base[0] + (dir[0] / len) * k + side[0] * spec.via.lateral, base[1] + (dir[1] / len) * k, base[2] + (dir[2] / len) * k + side[2] * spec.via.lateral];
  const mid = f0 + (f1 - f0) * spec.via.at;
  return [
    {f: f0, pos: from.pos, target: from.target, fov: from.fov},
    {f: mid, pos, target: tgt, fov: from.fov + (to.fov - from.fov) * spec.via.at},
    {f: f1, pos: to.pos, target: to.target, fov: to.fov},
  ];
};

/** Opacity (0..1) of the outgoing and incoming information at frame `f` of a transition running f0..f1. */
export const revealAt = (name: TransitionName, f0: number, f1: number, f: number) => {
  const r = TRANSITIONS[name].reveal, t = (f - f0) / (f1 - f0);
  const ramp = (a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  return {outgoing: 1 - ramp(r.outgoing[0], r.outgoing[1]), incoming: ramp(r.incoming[0], r.incoming[1])};
};
