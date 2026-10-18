/** Phase-1 audit of the delivered V5 video + source: measures doctor scale per scene (from the real camera path + skeleton), bottom overlay pixels, audio events. */
import {readFileSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {loadContent, p} from '../lib/common';
import {ManifestSchema} from '../src/lib/schema';
import {computeTimeline} from '../src/lib/timeline';
import {buildCamera, buildPerformance} from '../src/components/Doctor/lowerBackScript';
import {evaluate} from '../src/components/Doctor/engine';
import {projectToScreen} from '../src/components/Medical3D/project';

const c = loadContent('lower-back-pain');
const m = ManifestSchema.parse(JSON.parse(readFileSync(p('assets', 'audio', 'lower-back-pain', 'manifest.json'), 'utf8')));
const vis = JSON.parse(readFileSync(p('assets', 'audio', 'lower-back-pain', 'visemes.json'), 'utf8'));
const tl = computeTimeline(c, m);
const perf = buildPerformance(tl, c, vis);
const keys = buildCamera(tl);
const out: Record<string, unknown> = {scenes: {}};
for (const t of tl) {
  const rows: {f: number; heightPct: number; headInFrame: boolean}[] = [];
  for (let k = 0.15; k < 1; k += 0.2) {
    const f = Math.round(t.from + t.duration * k);
    const pose = evaluate(perf, f, 30, [0, 1.3, 4]);
    const head = projectToScreen([pose.root.x, 1.82, pose.root.z], keys, f, 1080, 1920);
    const feet = projectToScreen([pose.root.x, 0, pose.root.z], keys, f, 1080, 1920);
    rows.push({f, heightPct: +((Math.abs(feet[1] - head[1]) / 1920) * 100).toFixed(0), headInFrame: head[0] > 40 && head[0] < 1040 && head[1] > 0});
  }
  (out.scenes as Record<string, unknown>)[t.id] = rows;
}
// bottom overlay: average colour of the bottom 4 rows across 12 frames of the delivered V5
const V = p('output', 'V5', 'FMC_Lower_Back_Pain_V5.mp4');
const samples: number[][] = [];
for (let i = 1; i <= 12; i++) {
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(i * 6.5), '-i', V, '-frames:v', '1', '-vf', 'crop=1080:4:0:1916,scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  samples.push([buf[0], buf[1], buf[2]]);
}
out.bottomRowRGB = samples;
writeFileSync(p('output', 'V6', 'audit_v5_data.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1).slice(0, 2500));
