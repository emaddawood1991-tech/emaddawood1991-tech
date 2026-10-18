/**
 * Reusable camera presets for the FMC presenter (vertical 1080×1920, FOV 32–34°).
 * Every preset has a STANDARD it must satisfy; `scripts/standards-qc.ts` computes the real on-screen doctor height from
 * position/target/FOV and fails the check if a preset drifts out of range, so future edits cannot silently make him huge again.
 */
export type V3 = [number, number, number];
export type CamPreset = {pos: V3; target: V3; fov: number};

export const CAM = {
  WIDE: {pos: [0.0, 1.4, 6.0], target: [-0.08, 1.2, 0], fov: 34},
  BESIDE: {pos: [0.06, 1.45, 6.7], target: [0.06, 1.3, 0], fov: 34},
  CLOSE: {pos: [-0.04, 1.32, 3.5], target: [-0.12, 1.24, 0], fov: 34},
  ANAT: {pos: [0.45, 1.25, 2.6], target: [0.45, 1.22, -0.1], fov: 34},
  L45: {pos: [0.44, 1.0, 1.95], target: [0.44, 0.97, -0.1], fov: 32},
  END: {pos: [-0.2, 1.7, 3.2], target: [-0.26, 2.0, 0], fov: 32},
} satisfies Record<string, CamPreset>;

export type ShotKind = 'fullBodyIntro' | 'mediumSpeaking' | 'explainAnatomy' | 'demonstratePain' | 'pointToTreatment' | 'closeUpSpeaking' | 'anatomyFocus' | 'closing';

/** Standards per shot. doctorPct = doctor head-to-toe as % of frame height; visibleMaxM = max world height shown (close/anatomy shots). */
export const SHOT_STANDARDS: Record<ShotKind, {preset: keyof typeof CAM; doctorPct?: [number, number]; visibleMaxM?: number; note: string}> = {
  fullBodyIntro:     {preset: 'WIDE',   doctorPct: [40, 55], note: 'full body, feet and head both inside the frame'},
  mediumSpeaking:    {preset: 'CLOSE',  visibleMaxM: 2.4,    note: 'waist-up; hands stay inside frame; no text cards may cover the torso'},
  explainAnatomy:    {preset: 'BESIDE', doctorPct: [35, 45], note: 'doctor beside the model, anatomy ≥ doctor in visual weight'},
  demonstratePain:   {preset: 'CLOSE',  visibleMaxM: 2.4,    note: 'waist-up, slight turn, hand on the correct lumbar region'},
  pointToTreatment:  {preset: 'BESIDE', doctorPct: [35, 45], note: 'doctor gestures toward the information area, not at the camera'},
  closeUpSpeaking:   {preset: 'CLOSE',  visibleMaxM: 2.4,    note: 'face and both shoulders inside frame'},
  anatomyFocus:      {preset: 'ANAT',   visibleMaxM: 2.0,    note: 'full-screen anatomy; doctor optional/partial'},
  closing:           {preset: 'END',    visibleMaxM: 2.4,    note: 'doctor small and uncluttered beside the original logo'},
};

export const DOCTOR_HEIGHT_M = 1.78; // skeleton: hipY .9 + torso/neck/head ≈ 1.78 m with hair

/** World height visible at the target distance. */
export const visibleHeightM = (c: CamPreset) => {
  const d = Math.hypot(c.pos[0] - c.target[0], c.pos[1] - c.target[1], c.pos[2] - c.target[2]);
  return 2 * d * Math.tan((c.fov * Math.PI) / 360);
};
export const doctorPct = (c: CamPreset) => (DOCTOR_HEIGHT_M / visibleHeightM(c)) * 100;
