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
    model: z.enum(['lumbar-spine', 'none']),
    highlight: z.enum(['none', 'regions', 'disc-herniation', 'movement']),
    camera: z.string(),
    description: z.string(),
  }),
  footageQueries: z.array(z.string()).default([]),
  sfx: z.array(z.string()).default([]),
});
export type Scene = z.infer<typeof SceneSchema>;

const Sign = z.object({by: z.string(), date: z.string(), notes: z.string().optional()}).nullable();

export const ContentSchema = z.object({
  slug: z.string(),
  topic: z.object({ar: z.string(), en: z.string()}),
  scenes: z.array(SceneSchema).min(2),
  services: z.array(z.string()),
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
  /** Relative paths inside assets/ (original ambient bed + soft whoosh). Null = none. */
  music: z.string().nullable(),
  sfx: z.string().nullable(),
});
export type VideoProps = z.infer<typeof VideoPropsSchema>;
