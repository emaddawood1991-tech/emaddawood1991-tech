/** Searches Pexels per scene queries, downloads one licensed clip per scene, records credit. Requires PEXELS_API_KEY. */
import {createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {arg, loadContent, needEnv, p} from '../lib/common';

const slug = arg('slug', 'lower-back-pain')!;
const orient = (arg('orientation', 'portrait') as 'portrait' | 'landscape');
const key = needEnv('PEXELS_API_KEY', 'Pexels footage — https://www.pexels.com/api/');
const c = loadContent(slug);
const dir = p('assets', 'footage', slug);
mkdirSync(dir, {recursive: true});
const BRAND_RISK = /(logo|brand|clinic name|hospital sign)/i;

const result: Record<string, {file: string; credit: string; url: string}> = {};
for (const s of c.scenes.filter((x) => x.footageQueries.length)) {
  let picked: any = null;
  for (const q of s.footageQueries) {
    const r = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&orientation=${orient}&size=medium&per_page=15`, {headers: {Authorization: key}});
    if (!r.ok) throw new Error(`Pexels HTTP ${r.status}`);
    const j: any = await r.json();
    picked = (j.videos ?? []).find((v: any) => v.duration >= 6 && v.duration <= 40 && !BRAND_RISK.test(v.url));
    if (picked) { console.log(`  ${s.id}: "${q}" → ${picked.url}`); break; }
  }
  if (!picked) { console.warn(`  ${s.id}: no footage found; scene falls back to 3D animation.`); continue; }
  const f = [...picked.video_files].filter((v: any) => v.file_type === 'video/mp4').sort((a: any, b: any) => Math.abs(a.height - (orient === 'portrait' ? 1920 : 1080)) - Math.abs(b.height - (orient === 'portrait' ? 1920 : 1080)))[0];
  const out = `${dir}/${s.id}-${orient}.mp4`;
  if (!existsSync(out)) await pipeline(Readable.fromWeb((await fetch(f.link)).body as any), createWriteStream(out));
  result[s.id] = {file: `footage/${slug}/${s.id}-${orient}.mp4`, credit: `${picked.user?.name ?? 'Pexels contributor'} / Pexels`, url: picked.url};
}
writeFileSync(`${dir}/footage-${orient}.json`, JSON.stringify(result, null, 2));
console.log('Footage map written. REVIEW each clip visually: no competing branding, not implying FMC staff/facility.');
