/** Writes .tmp/carpal-props.json (content + manifest + visemes) for `remotion render/still CarpalReel --props=…`. No rendering, no network. */
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {loadContent, p} from '../lib/common';
import {ManifestSchema, VideoPropsSchema} from '../src/lib/schema';

const slug = 'carpal-tunnel';
const content = loadContent(slug);
const manifest = ManifestSchema.parse(JSON.parse(readFileSync(p('assets', 'audio', slug, 'manifest.json'), 'utf8')));
const visemes = JSON.parse(readFileSync(p('assets', 'audio', slug, 'visemes.json'), 'utf8'));
const props = VideoPropsSchema.parse({content, manifest, footage: null, preview: false, label: null, visemes, styleKey: 'documentary', music: null, sfx: null});
mkdirSync(p('.tmp'), {recursive: true});
writeFileSync(p('.tmp', 'carpal-props.json'), JSON.stringify(props));
console.log('wrote .tmp/carpal-props.json');
