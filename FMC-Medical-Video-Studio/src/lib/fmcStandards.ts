/**
 * FMC PRODUCTION STANDARDS — data the QC scripts enforce and the templates should import.
 * (Subjective qualities — Arabic pronunciation, medical accuracy, listening comfort — are NOT checkable here; see docs/FMC_PRODUCTION_STANDARDS.md.)
 */

export const CHARACTER_SPEC = {
  who: 'Single recurring male medical presenter, ~30–35 years, stylised 3D (not a robot, not a static image)',
  face: {facialHair: 'none', hair: 'short, neat, dark', eyes: 'friendly, blinking, saccades, eye contact with camera or the thing he explains'},
  outfit: {coat: 'white medical coat', scrubs: 'navy', logo: 'assets/logo/fmc-original-logo.png on the left chest, unmodified'},
  /** Words that must never name a mesh/group in Doctor.tsx. Enforced by standards-qc. */
  forbiddenIdentifiers: ['beard', 'mustache', 'moustache', 'stubble', 'goatee', 'jawbeard'],
  animation: {
    gesturesMustMatchMeaning: true,
    maxRepeatedGestureInRow: 1,   // never the same clip twice in a row (e.g. wave, wave)
    painGesture: 'hand on the correct lumbar region with a slight body turn, not waving at the camera',
    maxJointStepRadPerFrame: 0.45, // anim-qc: larger = a visible snap
    maxPlantedFootCmPerFrame: 1,
  },
} as const;

export const TYPOGRAPHY = {
  canvas: {w: 1080, h: 1920},
  /** Instagram UI: top ≈ 14 %, bottom ≈ 22 % (captions, buttons) plus right-hand action rail. Keep key text out of them. */
  safe: {top: 270, bottom: 420, left: 72, right: 120},
  minPx: {title: 64, cardText: 40, callout: 38, caption: 30},
  maxWords: {title: 6, card: 6, cardsPerScene: 3},
  hardMaxWords: {card: 9},
  font: '"FMC Arabic", "IBM Plex Sans Arabic"',
} as const;

export const SCENE_TYPES = {
  A: {name: 'Human introduction', use: 'relatable problem, doctor full-body/medium, direct address', shots: ['fullBodyIntro', 'mediumSpeaking']},
  B: {name: 'Pain demonstration', use: 'doctor indicates the affected region (turn + hand on region)', shots: ['demonstratePain']},
  C: {name: 'Anatomical explanation', use: 'full-screen 3D anatomy, camera reveals structures', shots: ['anatomyFocus']},
  D: {name: 'Interactive explanation', use: 'doctor touches/points at 3D structures', shots: ['explainAnatomy']},
  E: {name: 'Real-world treatment', use: 'licensed rehab footage or doctor-demonstrated exercise', shots: ['pointToTreatment', 'fullBodyIntro']},
  F: {name: 'Professional closing', use: 'doctor beside the ORIGINAL logo, uncluttered', shots: ['closing']},
} as const;
export type SceneTypeKey = keyof typeof SCENE_TYPES;

export const PACING = {
  maxSecondsSameCompositionInARow: 12,   // a composition = same scene type + same camera preset
  maxConsecutiveSameSceneType: 2,
  minDistinctSceneTypes: 3,
  firstFramesProblemWithinSec: 3,         // the problem is established immediately
};

/** Variety check over an ordered list of {type, seconds}. Returns human-readable problems. */
export const sceneVarietyProblems = (plan: {id: string; type: SceneTypeKey; sec: number}[]) => {
  const out: string[] = [];
  const distinct = new Set(plan.map((s) => s.type)).size;
  if (plan.length >= 4 && distinct < PACING.minDistinctSceneTypes) out.push(`only ${distinct} distinct scene type(s) in ${plan.length} scenes (min ${PACING.minDistinctSceneTypes})`);
  let run = 1;
  for (let i = 1; i < plan.length; i++) {
    run = plan[i].type === plan[i - 1].type ? run + 1 : 1;
    if (run > PACING.maxConsecutiveSameSceneType) out.push(`${run} consecutive "${plan[i].type}" scenes ending at ${plan[i].id}`);
  }
  for (const s of plan) if (s.sec > 22 && plan.length > 1) out.push(`scene ${s.id} is ${s.sec.toFixed(0)} s: split it or change the camera/scene type inside it`);
  return out;
};

export const LOGO = {
  file: 'assets/logo/fmc-original-logo.png',
  sha256: 'e173f134e28cbed3f9e47eb5db6ce4d299929270c74e5f6c97336806fb92fa30', // supplied official file; never recreate or edit
  needsAlpha: true,
  forbiddenFiles: [/fmc-logo-(ai|recreated|v\d)/i],
};
