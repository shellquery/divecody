#!/usr/bin/env node
/**
 * Generates PNG icons from public/dante-portrait.jpg using sharp.
 * Runs automatically as part of `npm run build` (via prebuild hook).
 */
import sharp from 'sharp';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'public', 'dante-portrait.jpg');

if (!existsSync(src)) {
  console.error('❌  public/dante-portrait.jpg not found');
  process.exit(1);
}

const BG = { r: 15, g: 14, b: 13, alpha: 1 };

async function makeIcon(size) {
  const pad = Math.round(size * 0.04);
  const inner = size - pad * 2;
  const buf = await sharp(src)
    .resize(inner, inner, { fit: 'cover', position: 'top' })
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 3, background: BG } })
    .composite([{ input: buf, top: pad, left: pad }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function makeMaskable(size) {
  const inner = Math.round(size * 0.80);
  const pad = Math.floor((size - inner) / 2);
  const buf = await sharp(src)
    .resize(inner, inner, { fit: 'cover', position: 'top' })
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 3, background: BG } })
    .composite([{ input: buf, top: pad, left: pad }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const targets = [
  { path: 'public/icons/icon-192.png',          size: 192, fn: makeIcon },
  { path: 'public/icons/icon-512.png',          size: 512, fn: makeIcon },
  { path: 'public/icons/icon-maskable-512.png', size: 512, fn: makeMaskable },
  { path: 'public/apple-touch-icon.png',        size: 180, fn: makeIcon },
];

mkdirSync(join(root, 'public/icons'), { recursive: true });

for (const { path, size, fn } of targets) {
  const buf = await fn(size);
  writeFileSync(join(root, path), buf);
  console.log(`✅  ${path} (${size}×${size})`);
}

console.log('\n🎉  Icons ready.');
