/** Bundle once, render several stills:  npx tsx scripts/stills.ts <CompositionId> <propsFile> <outDir> <frame,frame,…>  (stills only; no video) */
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync, readFileSync} from 'node:fs';
import {p} from '../lib/common';

const [id, propsFile, outDir, frames] = process.argv.slice(2);
const BROWSER = process.env.FMC_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const inputProps = JSON.parse(readFileSync(propsFile, 'utf8'));
mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: p('src', 'index.ts'), publicDir: p('assets')});
const comp = await selectComposition({serveUrl, id, inputProps, browserExecutable: BROWSER, chromiumOptions: {gl: 'angle'}});
for (const f of frames.split(',').map(Number)) {
  await renderStill({composition: comp, serveUrl, frame: f, output: `${outDir}/f${String(f).padStart(4, '0')}.png`, inputProps, browserExecutable: BROWSER, chromiumOptions: {gl: 'angle'}});
  console.log('still', f);
}
