/**
 * FMC DIRECTING SYSTEM — three reusable medical-video styles and a topic → style selector.
 *
 * Craft principles (rhythm, camera motivation, one signature move, hook in 3 s, readable hold times, "every shot needs a reason")
 * are adapted as GRAMMAR from the MIT-licensed Lemo Opuscar guides (DIRECTOR.md / TECHNIQUE.md). No code, assets, characters or
 * style names are copied. Opuscar's sound-design advice (foley on every action, SFX as transitions) is deliberately NOT adopted:
 * FMC_AUDIO forbids effects.
 *
 * All styles keep the official FMC identity (navy/teal brand colours, official logo, Arabic typography standards).
 * Forbidden everywhere: cartoon, cyberpunk, gaming, glitch, neon, sci-fi HUD, aggressive-tech looks.
 */
import type {SceneTypeKey} from './fmcStandards';

export type StyleKey = 'documentary' | 'commercial' | 'explainer3d';

export type LightingRig = {
  hemi: {sky: string; ground: string; intensity: number};
  lights: {position: [number, number, number]; intensity: number; color: string}[];
};

export type DirectorStyle = {
  key: StyleKey;
  name: string;
  intent: string;
  /** Visual language */
  look: {background: 'deep-navy-gradient' | 'bright-clinic' | 'dark-studio-graded'; contrast: 'moderate' | 'soft' | 'high-controlled'; materials: string; forbidden: string[]};
  lighting: LightingRig;
  /** Camera grammar: allowed moves and pacing */
  camera: {moves: string[]; minSegmentFrames: number; maxCameraSpeedMPerSec: number; signatureMove: string; holds: string};
  transitions: {primary: 'continuous-camera'; allowed: string[]; sfx: null};
  typography: {titlePx: number; cardPx: number; weight: number; maxCards: number};
  /** Preferred scene types (see SCENE_TYPES) in rough order of use */
  sceneBias: SceneTypeKey[];
  /** Doctor presence: share of frame height while on screen, per shot */
  doctor: {introPct: [number, number]; besideAnatomyPct: [number, number]; anatomyScenesDoctor: 'beside' | 'inset' | 'absent'};
  topics: string[];
};

const FORBIDDEN = ['cartoon', 'cyberpunk', 'gaming', 'glitch', 'neon', 'sci-fi-hud', 'aggressive-tech', 'whoosh'];

/** Identical to the rig hard-coded in DoctorExplainer before V7 (so adopting it changes no pixels). */
const RIG_DOCUMENTARY: LightingRig = {
  hemi: {sky: '#d7e8ff', ground: '#15263c', intensity: 1.0},
  lights: [
    {position: [2.5, 3.8, 3.5], intensity: 2.4, color: '#fff0de'},   // warm key, upper left
    {position: [-3, 2.2, -2.5], intensity: 1.5, color: '#4fd1d1'},   // teal rim (brand)
    {position: [0, 1, 4], intensity: 0.5, color: '#ffffff'},         // soft fill from camera
  ],
};

export const DIRECTOR_STYLES: Record<StyleKey, DirectorStyle> = {
  documentary: {
    key: 'documentary',
    name: 'Premium Medical Documentary',
    intent: 'Calm, authoritative explanation with realistic anatomy and controlled lighting.',
    look: {background: 'deep-navy-gradient', contrast: 'moderate', materials: 'matte bone/cartilage, soft translucent nerve, no emissive glow', forbidden: FORBIDDEN},
    lighting: RIG_DOCUMENTARY,
    camera: {moves: ['slow dolly-in', 'gentle orbit ≤ 25°', 'pull-back reveal', 'long hold'], minSegmentFrames: 45, maxCameraSpeedMPerSec: 1.2, signatureMove: 'one continuous move from the doctor\'s gesture into the anatomy', holds: '≥ 1.5 s on every information beat'},
    transitions: {primary: 'continuous-camera', allowed: ['doctorToSpine', 'spineToExplanation', 'explanationToTreatment', 'treatmentToClosing'], sfx: null},
    typography: {titlePx: 64, cardPx: 40, weight: 700, maxCards: 3},
    sceneBias: ['A', 'B', 'C', 'D', 'E', 'F'],
    doctor: {introPct: [40, 55], besideAnatomyPct: [35, 45], anatomyScenesDoctor: 'beside'},
    topics: ['spine', 'joint', 'fracture', 'tendon', 'diagnosis', 'degenerative'],
  },
  commercial: {
    key: 'commercial',
    name: 'Modern Healthcare Commercial',
    intent: 'Bright, reassuring clinic atmosphere; the presenter is the human face; light, elegant typography.',
    look: {background: 'bright-clinic', contrast: 'soft', materials: 'clean white/teal surfaces, soft shadows', forbidden: FORBIDDEN},
    lighting: {
      hemi: {sky: '#f2f8ff', ground: '#9fb6cc', intensity: 1.25},
      lights: [
        {position: [2.2, 3.4, 3.8], intensity: 2.0, color: '#fff6ea'},
        {position: [-3, 2.0, -2.0], intensity: 1.0, color: '#7fdede'},
        {position: [0, 1, 4], intensity: 0.8, color: '#ffffff'},
      ],
    },
    camera: {moves: ['medium push-in', 'soft lateral drift', 'rack to information area'], minSegmentFrames: 40, maxCameraSpeedMPerSec: 1.4, signatureMove: 'doctor turns and the frame glides to the benefit/care information', holds: '≥ 1.5 s on every information beat'},
    transitions: {primary: 'continuous-camera', allowed: ['doctorToSpine', 'explanationToTreatment', 'treatmentToClosing'], sfx: null},
    typography: {titlePx: 64, cardPx: 42, weight: 700, maxCards: 3},
    sceneBias: ['A', 'B', 'E', 'D', 'F'],
    doctor: {introPct: [45, 55], besideAnatomyPct: [38, 45], anatomyScenesDoctor: 'beside'},
    topics: ['prevention', 'posture', 'ergonomics', 'general-practice', 'post-surgery-rehab', 'sports-injury', 'wellness', 'awareness'],
  },
  explainer3d: {
    key: 'explainer3d',
    name: 'Advanced Medical 3D Explainer',
    intent: 'Anatomy is the subject: layered structures, precise highlights, smooth technical demonstration. Doctor supports, never competes.',
    look: {background: 'dark-studio-graded', contrast: 'high-controlled', materials: 'layered translucent tissue, single accent highlight on the structure under discussion', forbidden: FORBIDDEN},
    lighting: {
      hemi: {sky: '#c7dcf2', ground: '#0e1c2e', intensity: 0.9},
      lights: [
        {position: [2.0, 3.2, 3.0], intensity: 2.6, color: '#fff4e6'},
        {position: [-3, 1.6, -2.8], intensity: 1.8, color: '#4fd1d1'},
        {position: [0, -1, 3.5], intensity: 0.4, color: '#9cc7f0'},
      ],
    },
    camera: {moves: ['close-up reveal', 'layer peel', 'slow orbit ≤ 35°', 'pull through structures'], minSegmentFrames: 50, maxCameraSpeedMPerSec: 1.2, signatureMove: 'camera travels through the layers to the exact injury site', holds: '≥ 2 s on every labelled structure'},
    transitions: {primary: 'continuous-camera', allowed: ['doctorToSpine', 'spineToExplanation', 'explanationToTreatment'], sfx: null},
    typography: {titlePx: 64, cardPx: 40, weight: 700, maxCards: 3},
    sceneBias: ['C', 'D', 'B', 'A', 'E', 'F'],
    doctor: {introPct: [40, 50], besideAnatomyPct: [30, 40], anatomyScenesDoctor: 'inset'},
    topics: ['nerve', 'carpal-tunnel', 'surgical', 'complex-joint', 'shoulder', 'knee', 'wrist', 'neuro-rehab', 'mechanism'],
  },
};

export type TopicBrief = {topic: string; tags?: string[]; goal?: 'explain-mechanism' | 'raise-awareness' | 'reassure' | 'prevent' | 'rehab'};

/** Deterministic selection: tag overlap decides; goal breaks ties. Falls back to the documentary style. */
export const selectDirectorStyle = (b: TopicBrief): {style: DirectorStyle; reason: string} => {
  const words = new Set([...(b.tags ?? []), ...b.topic.toLowerCase().split(/[^a-z0-9؀-ۿ-]+/)].filter(Boolean));
  const score = (s: DirectorStyle) => s.topics.filter((t) => words.has(t) || [...words].some((w) => w.length > 3 && (t.includes(w) || w.includes(t)))).length;
  const goalBias: Record<NonNullable<TopicBrief['goal']>, StyleKey> = {'explain-mechanism': 'explainer3d', 'raise-awareness': 'commercial', reassure: 'commercial', prevent: 'commercial', rehab: 'documentary'};
  const ranked = (Object.values(DIRECTOR_STYLES) as DirectorStyle[]).map((s) => ({s, n: score(s) + (b.goal && goalBias[b.goal] === s.key ? 0.5 : 0)})).sort((x, y) => y.n - x.n);
  const best = ranked[0];
  if (best.n === 0) return {style: DIRECTOR_STYLES.documentary, reason: 'no topic match — default Premium Medical Documentary'};
  return {style: best.s, reason: `topic/tags matched ${best.s.name} (score ${best.n})`};
};
