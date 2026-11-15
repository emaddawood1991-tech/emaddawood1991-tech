// Agentoon.ai shared FX tokens. Import from every effect so styles stay consistent.
export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const theme = {
  ink: "#0F1115", paper: "#EFE6D4", paperDark: "#D9CDB4", white: "#FFFFFF", lime: "#C8F031", amber: "#FFB23E", red: "#FF5A4D", cyan: "#35F2FF", magenta: "#FF3DF2",
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace', body: 'Inter, "Helvetica Neue", Arial, sans-serif',
};
/** Spring presets: "pop" overshoots a little (cards, stickers); "settle" is critically damped (camera, panels). */
export const SPRING = {
  pop: { damping: 13, stiffness: 140, mass: 0.8 },
  settle: { damping: 26, stiffness: 110, mass: 1 },
  slam: { damping: 11, stiffness: 220, mass: 0.7 },
};
