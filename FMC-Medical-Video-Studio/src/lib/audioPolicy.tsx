/**
 * FMC AUDIO POLICY — single source of truth, enforced in code (not just declared).
 *
 * Default FMC video = Arabic narration + ONE extremely soft continuous music bed. Nothing else.
 *
 * Enforcement points (all import this file):
 *  - Compositions render audio ONLY through <NarrationAudio/> (below). Raw <Audio/>, <Html5Audio/> and un-muted video are
 *    forbidden in src/ — `npm run audio:qc` fails the build if one appears.
 *  - <PolicySfx/> renders NOTHING unless the matching policy flag is on AND an approval id is supplied.
 *  - scripts/render-video.ts calls enforceRenderProps() so a props file can never smuggle in music/sfx.
 *  - scripts/mix-audio.ts calls assertSfxAllowed() before it will synthesise any effect stem.
 *  - Music is mixed in the post stage (mix-audio.ts), never inside the Remotion render.
 */
import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';

export type SfxKind = 'transition' | 'character' | 'interface' | 'cameraMovement' | 'anatomyAnimation' | 'automaticWhoosh';

/** Canonical permanent audio configuration (V7). Frozen; every other name below is derived from it. */
export const FMC_AUDIO = Object.freeze({
  narration: true,
  backgroundMusic: true,

  transitionSFX: false,
  cameraSFX: false,
  characterSFX: false,
  interfaceSFX: false,
  anatomySFX: false,

  autoSoundEffects: false,

  musicStyle: 'ultra-soft-medical-ambient',
  piano: false,
  percussion: false,
  vocals: false,

  /** Embedded audio in stock footage / imported clips is always stripped unless a clip is explicitly approved. */
  footageAudio: false,
});

/** Older flag names, derived from FMC_AUDIO so there is only one place to change (kept for existing imports/QC). */
export const FMC_AUDIO_POLICY = Object.freeze({
  transitionSfxEnabled: FMC_AUDIO.transitionSFX,
  characterSfxEnabled: FMC_AUDIO.characterSFX,
  interfaceSfxEnabled: FMC_AUDIO.interfaceSFX,
  cameraMovementSfxEnabled: FMC_AUDIO.cameraSFX,
  anatomyAnimationSfxEnabled: FMC_AUDIO.anatomySFX,
  automaticWhooshesEnabled: FMC_AUDIO.autoSoundEffects,
  backgroundMusicEnabled: FMC_AUDIO.backgroundMusic,
  narrationEnabled: FMC_AUDIO.narration,
  backgroundMusicStyle: FMC_AUDIO.musicStyle,
  footageAudioEnabled: FMC_AUDIO.footageAudio,
});

/** Measured targets used by the mix stage and by audio-qc (single place to tune). */
export const FMC_AUDIO_TARGETS = Object.freeze({
  finalLufs: -16,
  truePeakCeilingDb: -1.5,
  narrationLufs: -18,
  musicLufs: -34,        // bed before ducking; ≈16 dB under narration
  musicFadeInSec: 2,
  musicFadeOutSec: 3,
  duck: 'sidechaincompress threshold=0.03 ratio=3.2 attack=60 release=1100',
  maxSfxRelativeDb: -30,  // only when an SFX is explicitly approved
});

const FLAG: Record<SfxKind, keyof typeof FMC_AUDIO_POLICY> = {
  transition: 'transitionSfxEnabled',
  character: 'characterSfxEnabled',
  interface: 'interfaceSfxEnabled',
  cameraMovement: 'cameraMovementSfxEnabled',
  anatomyAnimation: 'anatomyAnimationSfxEnabled',
  automaticWhoosh: 'automaticWhooshesEnabled',
};

export const sfxAllowed = (kind: SfxKind, approvalId?: string | null) => FMC_AUDIO_POLICY[FLAG[kind]] === true && !!approvalId;

/** Used by the mix stage. An effect stem needs BOTH the policy flag and an explicit approval id from the user. */
export const assertSfxAllowed = (kind: SfxKind, approvalId?: string | null) => {
  if (!sfxAllowed(kind, approvalId)) {
    throw new Error(
      `FMC audio policy: "${kind}" sound effects are disabled (${FLAG[kind]}=false). ` +
        `To use one, the user must approve it explicitly: set the policy flag AND pass --sfx-approval <id>. Default videos are narration + music only.`,
    );
  }
};

/** Narration is the ONLY audio a composition may render. */
export const NarrationAudio: React.FC<{file: string; from: number; frames: number}> = ({file, from, frames}) =>
  FMC_AUDIO_POLICY.narrationEnabled ? (
    <Sequence from={from} durationInFrames={frames + 6} layout="none">
      <Audio src={staticFile(file)} volume={1} />
    </Sequence>
  ) : null;

/** Optional effect. Renders nothing under the default policy. */
export const PolicySfx: React.FC<{kind: SfxKind; file: string; from: number; frames: number; approvalId?: string | null; volume?: number}> = ({kind, file, from, frames, approvalId, volume = 0.03}) =>
  sfxAllowed(kind, approvalId) ? (
    <Sequence from={from} durationInFrames={frames} layout="none">
      <Audio src={staticFile(file)} volume={volume} />
    </Sequence>
  ) : null;

/** Stock footage is ALWAYS muted by default. */
export const footageMuted = (approvedAudio = false) => !(FMC_AUDIO_POLICY.footageAudioEnabled && approvedAudio);

/** Applied by scripts/render-video.ts to the props file before every render. Throws on a policy breach. */
export const enforceRenderProps = <T extends {music?: string | null; sfx?: string | null}>(props: T): T => {
  if (props.sfx) throw new Error(`FMC audio policy: props.sfx="${props.sfx}" refused — effects are disabled by default.`);
  if (props.music) throw new Error('FMC audio policy: music must be mixed in the post stage (scripts/mix-audio.ts), not inside the Remotion render.');
  return {...props, music: null, sfx: null};
};
