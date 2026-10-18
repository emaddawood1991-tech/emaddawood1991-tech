import {continueRender, delayRender, staticFile} from 'remotion';

const ARABIC_RANGE = 'U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F, U+060C, U+061B, U+061F';

type Face = {family: string; file: string; weight: string; range?: string};
const FACES: Face[] = [
  ...(['500', '600'] as const).flatMap((w) => [
    {family: 'FMC Arabic', file: `ibm-plex-sans-arabic-arabic-${w}-normal.woff2`, weight: w, range: ARABIC_RANGE},
    {family: 'FMC Arabic', file: `ibm-plex-sans-arabic-latin-${w}-normal.woff2`, weight: w},
  ]),
  {family: 'FMC Arabic', file: 'ibm-plex-sans-arabic-arabic-700-normal.woff2', weight: '700', range: ARABIC_RANGE},
  {family: 'FMC Arabic', file: 'ibm-plex-sans-arabic-latin-600-normal.woff2', weight: '700'},
  ...(['700', '800'] as const).flatMap((w) => [
    {family: 'FMC Display', file: `cairo-arabic-${w}-normal.woff2`, weight: w, range: ARABIC_RANGE},
    {family: 'FMC Display', file: `cairo-latin-${w}-normal.woff2`, weight: w},
  ]),
];

let started = false;
/** Blocks rendering until every font face is loaded, so no frame is drawn with fallback glyphs. */
export const loadFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender('fmc-fonts', {timeoutInMilliseconds: 60000});
  Promise.all(
    FACES.map(async (f) => {
      const face = new FontFace(f.family, `url(${staticFile(`fonts/${f.file}`)}) format("woff2")`, {
        weight: f.weight,
        ...(f.range ? {unicodeRange: f.range} : {}),
      });
      await face.load();
      (document.fonts as unknown as {add: (f: FontFace) => void}).add(face);
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      throw new Error(`Font load failed: ${e}`);
    });
};
