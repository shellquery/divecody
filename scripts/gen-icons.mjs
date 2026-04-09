#!/usr/bin/env node
/**
 * Generates PNG icons for PWA/iOS from public/icon.svg.
 * Runs automatically as part of `npm run build` (via prebuild hook).
 * Uses @resvg/resvg-js — pure WASM, no system dependencies.
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcSvg = join(root, 'public', 'icon.svg');

if (!existsSync(srcSvg)) {
  console.error('❌  public/icon.svg not found');
  process.exit(1);
}

const svgData = readFileSync(srcSvg);
mkdirSync(join(root, 'public', 'icons'), { recursive: true });

/** Render SVG to PNG buffer at given size */
function render(size) {
  const resvg = new Resvg(svgData, {
    fitTo: { mode: 'width', value: size },
  });
  return resvg.render().asPng();
}

/** Render maskable variant: SVG centered in safe-zone (80% of canvas) */
function renderMaskable(size) {
  const inner = Math.round(size * 0.8);
  const pad = Math.round((size - inner) / 2);
  // Wrap the SVG inside an SVG with background + padding
  const wrapped = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="#0f0e0d"/>
      <image href="data:image/svg+xml;base64,${Buffer.from(svgData).toString('base64')}"
             x="${pad}" y="${pad}" width="${inner}" height="${inner}"/>
    </svg>`;
  const resvg = new Resvg(Buffer.from(wrapped), {
    fitTo: { mode: 'width', value: size },
  });
  return resvg.render().asPng();
}

const targets = [
  { path: 'public/icons/icon-192.png',          size: 192, fn: render },
  { path: 'public/icons/icon-512.png',          size: 512, fn: render },
  { path: 'public/icons/icon-maskable-512.png', size: 512, fn: renderMaskable },
  { path: 'public/apple-touch-icon.png',        size: 180, fn: render },
];

for (const { path, size, fn } of targets) {
  const out = join(root, path);
  writeFileSync(out, fn(size));
  console.log(`✅  ${path} (${size}×${size})`);
}

console.log('\n🎉  PWA icons ready.');
