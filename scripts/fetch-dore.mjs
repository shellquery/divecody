#!/usr/bin/env node
/**
 * Fetches Gustave Doré illustration URLs from Wikimedia Commons
 * for each canto of Dante's Divine Comedy and writes them to
 * public/data/dore.json.
 *
 * Run: node scripts/fetch-dore.mjs
 * Or:  npm run fetch-dore
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'public', 'data', 'dore.json');
const THUMB_WIDTH = 900;
const UA = 'divecody/1.0 (https://github.com/shellquery/divecody)';

const BOOKS = [
  { id: 'inferno',    label: 'Inferno',    count: 34 },
  { id: 'purgatorio', label: 'Purgatorio', count: 33 },
  { id: 'paradiso',   label: 'Paradiso',   count: 33 },
];

async function api(params) {
  const url = 'https://commons.wikimedia.org/w/api.php?' +
    new URLSearchParams({ format: 'json', ...params }).toString();
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  return res.json();
}

async function categoryFiles(category, limit = 3) {
  const data = await api({
    action: 'query',
    list: 'categorymembers',
    cmtitle: 'Category:' + category,
    cmtype: 'file',
    cmlimit: String(limit),
  });
  return (data?.query?.categorymembers ?? []).map((m) => m.title);
}

async function imageThumbUrl(filename) {
  const data = await api({
    action: 'query',
    titles: filename,
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: String(THUMB_WIDTH),
  });
  if (!data) return null;
  for (const page of Object.values(data?.query?.pages ?? {})) {
    const ii = page?.imageinfo?.[0];
    if (ii?.thumburl) return ii.thumburl;
    if (ii?.url) return ii.url;
  }
  return null;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function resolveCantoUrl(bookLabel, n) {
  // Try multiple naming conventions used across Wikimedia Commons
  const variants = [
    `Gustave_Doré_-_${bookLabel}_Canto_${n}`,
    `Gustave_Doré_-_${bookLabel}_Canto_${String(n).padStart(2, '0')}`,
    `Gustave_Dore_-_${bookLabel}_Canto_${n}`,
    `Gustave_Dore_-_${bookLabel}_Canto_${String(n).padStart(2, '0')}`,
  ];
  for (const cat of variants) {
    const files = await categoryFiles(cat, 1);
    if (files.length) {
      const url = await imageThumbUrl(files[0]);
      if (url) return url;
    }
    await sleep(120);
  }
  return null;
}

async function main() {
  const result = {};

  for (const book of BOOKS) {
    result[book.id] = {};
    console.log(`\n📚  ${book.label} (${book.count} cantos)`);

    for (let n = 1; n <= book.count; n++) {
      const url = await resolveCantoUrl(book.label, n);
      if (url) {
        result[book.id][n] = url;
        process.stdout.write(`  ✅  Canto ${n}\n`);
      } else {
        process.stdout.write(`  ⚠️   Canto ${n} — not found\n`);
      }
      await sleep(250);
    }
  }

  mkdirSync(join(root, 'public', 'data'), { recursive: true });
  writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
  const total = Object.values(result).flatMap(Object.values).length;
  console.log(`\n🎉  ${total} illustrations saved → ${outPath}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
