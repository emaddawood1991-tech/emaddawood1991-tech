#!/usr/bin/env node
// Builds a self-contained, portable skill bundle (zip) for the Agentoon 3D + video-edit skill.
//   node package-skill.mjs [--out out/agentoon-3d-video-skill.zip]
// Contents: SKILL.md, spec-reference.md, tool-definitions.json, scripts/ (edit.mjs, agentoon-tool.mjs, threejs/ without node_modules).
// Unzip into your agent's skills folder, run `npm install` once in scripts/threejs, done. No keys inside.
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(here, "..", ".claude", "skills", "agentoon-3d-video");
const ROOT = "agentoon-3d-video";

const crcTable = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (buf) => {
  let c = -1;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

function walk(dir, skip = () => false) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (skip(p, name)) return [];
    return statSync(p).isDirectory() ? walk(p, skip) : [p];
  });
}

export function buildZip(entries) {
  const date = new Date();
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const comp = deflateRawSync(data);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    chunks.push(local, nameBuf, comp);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0);
    c.writeUInt16LE(0x031e, 4);
    c.writeUInt16LE(20, 6);
    c.writeUInt16LE(0x0800, 8);
    c.writeUInt16LE(8, 10);
    c.writeUInt16LE(dosTime, 12);
    c.writeUInt16LE(dosDate, 14);
    c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(comp.length, 20);
    c.writeUInt32LE(data.length, 24);
    c.writeUInt16LE(nameBuf.length, 28);
    c.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    c.writeUInt32LE(offset, 42);
    central.push(c, nameBuf);
    offset += local.length + nameBuf.length + comp.length;
  }
  const cdSize = central.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cdSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, ...central, end]);
}

export function collect() {
  const entries = [];
  const add = (file, name) => entries.push({ name: `${ROOT}/${name}`, data: readFileSync(file) });
  for (const f of ["SKILL.md", "spec-reference.md", "tool-definitions.json"]) add(join(skillDir, f), f);
  add(join(here, "edit.mjs"), "scripts/edit.mjs");
  add(join(here, "agentoon-tool.mjs"), "scripts/agentoon-tool.mjs");
  const threeDir = join(here, "threejs");
  for (const f of walk(threeDir, (_, n) => n === "node_modules")) add(f, `scripts/threejs/${relative(threeDir, f).split("\\").join("/")}`);
  entries.push({ name: `${ROOT}/README.txt`, data: Buffer.from(
`Agentoon 3D + video edit skill
1. Put this folder in your agent's skills folder (Claude Code: ~/.claude/skills/agentoon-3d-video).
2. cd scripts/threejs && npm install   (once; needs Node 18+, FFmpeg and Playwright Chromium)
3. Ask your agent for something 3D or to edit a video. Tools for non-Claude platforms: tool-definitions.json.
Free and local. No API keys are used or stored.
`) });
  return entries;
}

function main() {
  const i = process.argv.indexOf("--out");
  const out = resolve(here, i > -1 ? process.argv[i + 1] : "out/agentoon-3d-video-skill.zip");
  mkdirSync(dirname(out), { recursive: true });
  const entries = collect();
  writeFileSync(out, buildZip(entries));
  console.log(`Wrote ${out} (${entries.length} files, ${(statSync(out).size / 1024).toFixed(0)} KB)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
