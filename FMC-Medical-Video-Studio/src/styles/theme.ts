export const COLORS = {
  blue: '#123B66',
  turquoise: '#00A6A6',
  white: '#FFFFFF',
  silver: '#E8EEF3',
  navy: '#102A43',
  // single restrained accent used ONLY to mark the problem area
  amber: '#F2A33A',
} as const;

export const FONT_AR = '"FMC Arabic", "IBM Plex Sans Arabic", sans-serif';
export const FONT_DISPLAY = '"FMC Display", "Cairo", sans-serif';

export type Layout = {
  portrait: boolean;
  width: number;
  height: number;
  /** Social-media safe margins (Reels UI covers top ~14%, bottom ~22%). */
  safe: {top: number; bottom: number; left: number; right: number};
};

export const makeLayout = (width: number, height: number): Layout => {
  const portrait = height > width;
  return {
    portrait,
    width,
    height,
    safe: portrait
      ? {top: Math.round(height * 0.12), bottom: Math.round(height * 0.2), left: 72, right: 72}
      : {top: 72, bottom: 72, left: 120, right: 120},
  };
};

export const BG_GRADIENT = `radial-gradient(120% 90% at 50% 38%, #1B4F82 0%, ${COLORS.blue} 38%, ${COLORS.navy} 100%)`;
