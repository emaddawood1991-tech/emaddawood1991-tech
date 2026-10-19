import {z} from 'zod';

export const SCENE_IDS = ['opening', 'anatomy', 'symptoms', 'treatment', 'fmc', 'closing'] as const;
export type SceneId = (typeof SCENE_IDS)[number];

export const SceneSchema = z.object({
  id: z.enum(SCENE_IDS),
  plannedSec: z.number().positive(),
  /** Clean Arabic narration (QC'd, shown in captions/storyboard). */
  narration: z.string().min(1),
  /** Same text with diacritics added only where pronunciation needs it. Sent to TTS. */
  ttsText: z.string().min(1),
  onScreen: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    bullets: z.array(z.string()).optional(),
  }),
  visual: z.object({
    model: z.enum(['lumbar-spine', 'wrist-hand', 'none']),
    highlight: z.enum(['none', 'regions', 'disc-herniation', 'movement', 'median-nerve']),
    camera: z.string(),
    description: z.string(),
  }),
  footageQueries: z.array(z.string()).default([]),
  /** FMC audio policy: scenes may NOT declare sound effects (this used to be a latent trigger — the original content files said "soft-whoosh"). */
  sfx: z.array(z.string()).max(0, 'FMC audio policy: scenes cannot declare sound effects').default([]),
  /** Scene type A–F (see SCENE_TYPES in fmcStandards). Optional; enables the scene-variety check. */
  sceneType: z.enum(['A', 'B', 'C', 'D', 'E', 'F']).optional(),
});
export type Scene = z.infer<typeof SceneSchema>;

const Sign = z.object({by: z.string(), date: z.string(), notes: z.string().optional()}).nullable();

export const ContentSchema = z.object({
  slug: z.string(),
  topic: z.object({ar: z.string(), en: z.string()}),
  scenes: z.array(SceneSchema).min(2),
  services: z.array(z.string()),
  /** Optional per-episode timing override (frames of silence before/after narration inside a scene). */
  timing: z.object({lead: z.number().int().min(0), tail: z.number().int().min(0)}).optional(),
  instagramCaption: z.string(),
  hashtags: z.array(z.string()),
  sources: z.array(z.object({title: z.string(), url: z.string()})),
  approvals: z.object({
    /** Automated + model review. Never a substitute for the human sign-off below. */
    grammarReview: Sign,
    medicalTerminologyReview: Sign,
    medicalAccuracyReview: Sign,
    /** Human sign-offs. The pipeline refuses a final export until all are set. */
    scriptApproved: Sign,
    pronunciationApproved: Sign,
    approvedHash: z.string().nullable(),
  }),
});
export type Content = z.infer<typeof ContentSchema>;

export const ManifestSchema = z.object({
  provider: z.enum(['minimax', 'google']),
  model: z.string(),
  voice: z.string(),
  scriptHash: z.string(),
  scenes: z.array(z.object({id: z.enum(SCENE_IDS), file: z.string(), durationSec: z.number()})),
});
export type VoiceManifest = z.infer<typeof ManifestSchema>;

export const FootageSchema = z.record(
  z.string(),
  z.object({file: z.string(), credit: z.string(), url: z.string()}),
);
export type FootageMap = z.infer<typeof FootageSchema>;

export const VideoPropsSchema = z.object({
  content: ContentSchema,
  manifest: ManifestSchema.nullable(),
  footage: FootageSchema.nullable(),
  /** Preview renders have no narration and are watermarked; never publishable. */
  preview: z.boolean(),
  /** Relative paths inside assets/ (original ambient bed; effects are disabled by FMC_AUDIO_POLICY and always null). Null = none. */
  /** Per-scene mouth curves from scripts/char/visemes.py (null = presenter idles, mouth closed). */
  visemes: z.object({fps: z.number(), scenes: z.record(z.string(), z.object({o: z.array(z.number()), w: z.array(z.number())}))}).nullable().default(null),
  /** Watermark text for non-final renders (e.g. voiced draft awaiting pronunciation approval). */
  label: z.string().nullable().default(null),
  /** Director style (documentary | commercial | explainer3d); see src/lib/directorStyles.ts. */
  styleKey: z.enum(['documentary', 'commercial', 'explainer3d']).default('documentary'),
  music: z.string().nullable(),
  sfx: z.string().nullable(),
});
export type VideoProps = z.infer<typeof VideoPropsSchema>;
