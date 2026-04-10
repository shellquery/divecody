#!/usr/bin/env node
/**
 * Fetches Gustave Doré illustration URLs from GITenberg (GitHub-hosted
 * Project Gutenberg books) and writes public/data/dore.json.
 *
 * Source repos are public-domain Doré editions mirrored on GitHub, so
 * this script works in environments where Wikimedia is blocked.
 *
 * Run: node scripts/fetch-dore.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root     = join(__dirname, '..');
const outPath  = join(root, 'public', 'data', 'dore.json');

const BASE = 'https://api.github.com/repos/GITenberg';
const RAW  = 'https://raw.githubusercontent.com/GITenberg';

async function ghJson(path) {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { 'User-Agent': 'divecody/1.0', Accept: 'application/vnd.github.v3+json' },
  });
  if (!res.ok) return null;
  return res.json();
}

function rawUrl(repo, imgPath) {
  return `${RAW}/${repo}/master/${imgPath}`;
}

// Each entry: [repo_name, images_subdir, book_key, filename_pattern]
// pattern: 'b' = use XX-NNNb.jpg (Inferno/vision-of-hell edition)
//          ''  = use XX-NNN.jpg excluding th.jpg (Purgatorio/Paradiso editions)
const REPOS = [
  // Inferno
  ['The-vision-of-hell.---13-and-illustrated-with-the-seventy-five-designs-of-Gustave-Dor-._8789',
   '8789-h/images', 'inferno', 'b'],
  ...Array.from({length:10}, (_,i) => {
    const n = String(i+1).padStart(2,'0'), id = 8779+i;
    return [`The-Divine-Comedy-by-Dante-Illustrated-Hell-Volume-${n}_${id}`,
            `${id}-h/images`, 'inferno', 'b'];
  }),
  // Purgatorio
  ['The-Divine-Comedy-by-Dante-Illustrated-Purgatory-Complete_8795', '8795-h/images', 'purgatorio', ''],
  ...['8790','8791','8792','8793','8794'].map((id,i) =>
    [`The-Divine-Comedy-by-Dante-Illustrated-Purgatory-Volume-${String(i+1).padStart(2,'0')}_${id}`,
     `${id}-h/images`, 'purgatorio', '']),
  // Paradiso
  ['The-Divine-Comedy-by-Dante-Illustrated-Paradise-Complete_8799', '8799-h/images', 'paradiso', ''],
  ...['8796','8797','8798'].map((id,i) =>
    [`The-Divine-Comedy-by-Dante-Illustrated-Paradise-Volume-${String(i+1).padStart(2,'0')}_${id}`,
     `${id}-h/images`, 'paradiso', '']),
];

const MAX = { inferno: 34, purgatorio: 33, paradiso: 33 };

async function main() {
  const result = { inferno: {}, purgatorio: {}, paradiso: {} };

  for (const [repo, imgDir, book, variant] of REPOS) {
    const files = await ghJson(`${repo}/contents/${imgDir}`);
    if (!files) continue;

    let added = 0;
    for (const f of files) {
      if (f.type !== 'file') continue;
      const name = f.name;
      // Skip thumbnails
      if (name.endsWith('th.jpg')) continue;

      let m;
      if (variant === 'b') {
        m = name.match(/^(\d+)-\d+b\.jpg$/);
      } else {
        m = name.match(/^(\d+)-\d+\.jpg$/) && !name.endsWith('b.jpg') ? name.match(/^(\d+)-\d+\.jpg$/) : null;
      }
      if (!m) continue;

      const canto = parseInt(m[1], 10);
      if (canto < 1 || canto > MAX[book]) continue;
      if (result[book][canto]) continue;  // already have one

      result[book][canto] = f.download_url;
      added++;
    }
    if (added) process.stdout.write(`  +${added} ${book} ← ${repo.split('_')[0].slice(-30)}\n`);
  }

  for (const [book, cantos] of Object.entries(result)) {
    const total = MAX[book];
    const found = Object.keys(cantos).length;
    const missing = Array.from({length:total}, (_,i)=>i+1).filter(n => !cantos[n]);
    console.log(`${book}: ${found}/${total}${missing.length ? `  missing: ${missing.join(',')}` : '  ✅'}`);
  }

  // Sort by canto number, write string keys
  const out = {};
  for (const [book, cantos] of Object.entries(result)) {
    out[book] = {};
    for (const k of Object.keys(cantos).map(Number).sort((a,b)=>a-b)) {
      out[book][String(k)] = cantos[k];
    }
  }

  mkdirSync(join(root, 'public', 'data'), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  const total = Object.values(out).flatMap(Object.values).length;
  console.log(`\n🎉  ${total} illustrations → ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
