#!/usr/bin/env node
/**
 * Generates Android launcher icons from public/dante-portrait.jpg using sharp.
 * Must be run AFTER `npx cap add android` so the res directories exist.
 *
 * Generates:
 *   ic_launcher.png          — standard square icon (each mipmap density)
 *   ic_launcher_round.png    — same image, circular clip via PNG mask
 *   ic_launcher_foreground.png — adaptive icon foreground (image in inner 66.7%)
 */
import sharp from 'sharp';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'public', 'dante-portrait.jpg');

if (!existsSync(src)) {
  console.error('❌  public/dante-portrait.jpg not found');
  process.exit(1);
}

const resDir = join(root, 'android/app/src/main/res');
if (!existsSync(resDir)) {
  console.error('❌  android/app/src/main/res not found — run `npx cap add android` first');
  process.exit(1);
}

const BG = { r: 15, g: 14, b: 13, alpha: 1 }; // #0f0e0d

// Standard launcher icon sizes (dp × density)
const DENSITIES = [
  { name: 'mipmap-mdpi',    size: 48  },
  { name: 'mipmap-hdpi',    size: 72  },
  { name: 'mipmap-xhdpi',   size: 96  },
  { name: 'mipmap-xxhdpi',  size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 },
];

// Adaptive foreground: full canvas is 108dp equivalent, inner safe zone is 72dp (66.7%)
const ADAPTIVE_SIZES = [
  { name: 'mipmap-mdpi',    size: 108 },
  { name: 'mipmap-hdpi',    size: 162 },
  { name: 'mipmap-xhdpi',   size: 216 },
  { name: 'mipmap-xxhdpi',  size: 324 },
  { name: 'mipmap-xxxhdpi', size: 432 },
];

// Build circular SVG mask
function circleMask(size) {
  const r = size / 2;
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}" fill="white"/></svg>`
  );
}

async function makeLauncher(size) {
  const pad = Math.round(size * 0.04);
  const inner = size - pad * 2;
  const portrait = await sharp(src)
    .resize(inner, inner, { fit: 'cover', position: 'top' })
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: portrait, top: pad, left: pad }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function makeRound(size) {
  const flat = await makeLauncher(size);
  // Apply circular mask
  return sharp(flat)
    .composite([{ input: circleMask(size), blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function makeAdaptiveFg(size) {
  // Image occupies inner 66.7% (safe zone); outer 16.7% on each side is padding
  const inner = Math.round(size * 0.667);
  const pad = Math.floor((size - inner) / 2);
  const portrait = await sharp(src)
    .resize(inner, inner, { fit: 'cover', position: 'top' })
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: portrait, top: pad, left: pad }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

for (let i = 0; i < DENSITIES.length; i++) {
  const { name, size } = DENSITIES[i];
  const dir = join(resDir, name);
  mkdirSync(dir, { recursive: true });

  const launcher = await makeLauncher(size);
  writeFileSync(join(dir, 'ic_launcher.png'), launcher);
  console.log(`✅  ${name}/ic_launcher.png (${size}×${size})`);

  const round = await makeRound(size);
  writeFileSync(join(dir, 'ic_launcher_round.png'), round);
  console.log(`✅  ${name}/ic_launcher_round.png (${size}×${size})`);

  const { size: aSize } = ADAPTIVE_SIZES[i];
  const fg = await makeAdaptiveFg(aSize);
  writeFileSync(join(dir, 'ic_launcher_foreground.png'), fg);
  console.log(`✅  ${name}/ic_launcher_foreground.png (${aSize}×${aSize})`);
}

console.log('\n🎉  Android icons ready.');
