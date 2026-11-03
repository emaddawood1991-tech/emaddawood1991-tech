import { continueRender, delayRender, staticFile } from "remotion";
import type { Episode } from "./types";

/** Loads local fonts from public/ (no network needed at render time). */
export const loadEpisodeFonts = (fonts: Episode["fonts"]) => {
  (fonts ?? []).forEach((f) => {
    const handle = delayRender(`font ${f.family}`);
    const face = new FontFace(f.family, `url(${staticFile(f.src)})`, {
      weight: String(f.weight ?? 400),
    });
    face
      .load()
      .then(() => {
        (document.fonts as unknown as { add: (f: FontFace) => void }).add(face);
        continueRender(handle);
      })
      .catch((err) => {
        console.warn(`Font ${f.family} failed to load`, err);
        continueRender(handle);
      });
  });
};
