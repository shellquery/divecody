#!/usr/bin/env node
/**
 * Fetches Gustave Doré illustration URLs from Wikimedia Commons and writes
 * public/data/dore.json.  Strategy: query the top-level book category to get
 * all illustration filenames, then parse the Roman-numeral canto number from
 * the filename (e.g. "…Plate_8_(Canto_III_-_…).jpg" → Canto 3).
 *
 * Run: node scripts/fetch-dore.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root     = join(__dirname, '..');
const outPath  = join(root, 'public', 'data', 'dore.json');

const THUMB_W = 900;
const UA      = 'divecody/1.0 (https://github.com/shellquery/divecody)';

// ── Roman numeral parser ──────────────────────────────────────────────────────
const ROMAN_MAP = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
function romanToInt(s) {
  if (!s) return null;
  s = s.toUpperCase().trim();
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = ROMAN_MAP[s[i]], nxt = ROMAN_MAP[s[i+1]];
    if (!cur) return null;
    n += (nxt && nxt > cur) ? -cur : cur;
  }
  return n > 0 ? n : null;
}

// Filenames contain patterns like "(Canto_III_-_" or "(Canto_V_-_"
function cantoFromFilename(title) {
  const m = title.match(/[_(]Canto[_ ]([IVXLCDM]+)[_) -]/i);
  return m ? romanToInt(m[1]) : null;
}

// ── Wikimedia API helpers ─────────────────────────────────────────────────────
async function apiGet(params) {
  const url = 'https://commons.wikimedia.org/w/api.php?' +
    new URLSearchParams({ format:'json', origin:'*', ...params });
  const res = await fetch(url, { headers:{ 'User-Agent': UA } });
  if (!res.ok) { console.warn('  HTTP', res.status, url); return null; }
  return res.json();
}

/** Fetch ALL files from a category, following continuation tokens. */
async function allCategoryFiles(category) {
  const files = [];
  let cmcontinue;
  do {
    const params = {
      action: 'query', list: 'categorymembers',
      cmtitle: 'Category:' + category,
      cmtype: 'file', cmlimit: '500',
      ...(cmcontinue ? { cmcontinue } : {}),
    };
    const data = await apiGet(params);
    if (!data) break;
    files.push(...(data.query?.categorymembers ?? []).map(m => m.title));
    cmcontinue = data.continue?.cmcontinue;
  } while (cmcontinue);
  return files;
}

/** Get thumb URL for a batch of filenames (up to 50 per API call). */
async function thumbUrls(titles) {
  const map = {};
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const data = await apiGet({
      action: 'query', titles: batch.join('|'),
      prop: 'imageinfo', iiprop: 'url', iiurlwidth: String(THUMB_W),
    });
    for (const page of Object.values(data?.query?.pages ?? {})) {
      const ii = page.imageinfo?.[0];
      if (ii?.thumburl) map[page.title] = ii.thumburl;
      else if (ii?.url)  map[page.title] = ii.url;
    }
    if (i + 50 < titles.length) await sleep(200);
  }
  return map;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Per-book config ───────────────────────────────────────────────────────────
const BOOKS = [
  {
    id: 'inferno',
    cantos: 34,
    // try multiple category spellings; first non-empty wins
    categories: [
      'Gustave_Doré_-_Inferno',
      'Gustave_Dore_-_Inferno',
      "Gustave_Dore's_illustrations_to_Dante's_Inferno",
    ],
  },
  {
    id: 'purgatorio',
    cantos: 33,
    categories: [
      'Gustave_Doré_-_Purgatorio',
      'Gustave_Dore_-_Purgatorio',
      'Gustave_Doré_-_Purgatorio_archive',
      'Illustrations_by_Gustave_Doré_for_Purgatorio',
    ],
  },
  {
    id: 'paradiso',
    cantos: 33,
    categories: [
      'Gustave_Doré_-_Paradiso',
      'Gustave_Dore_-_Paradiso',
      'Gustave_Doré_-_Paradiso_archive',
      'Illustrations_by_Gustave_Doré_for_Paradiso',
    ],
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const result = {};

  for (const book of BOOKS) {
    console.log(`\n📚  ${book.id}`);
    result[book.id] = {};

    // Find the category that has files
    let allFiles = [];
    for (const cat of book.categories) {
      console.log(`  Trying category: ${cat}`);
      allFiles = await allCategoryFiles(cat);
      if (allFiles.length) { console.log(`  → ${allFiles.length} files`); break; }
      await sleep(300);
    }

    if (!allFiles.length) {
      console.log('  ⚠️  No files found in any category');
      continue;
    }

    // Keep only plausible Doré illustration files
    const relevant = allFiles.filter(t =>
      /\.(jpe?g|png)$/i.test(t) &&
      /(dor[eé]|dore)/i.test(t)
    );
    console.log(`  ${relevant.length} Doré files after filter`);

    // Map canto → first matching filename
    const cantoFile = {};
    for (const title of relevant) {
      const n = cantoFromFilename(title);
      if (n && n >= 1 && n <= book.cantos && !cantoFile[n]) {
        cantoFile[n] = title;
      }
    }

    const covered = Object.keys(cantoFile).length;
    console.log(`  ${covered}/${book.cantos} cantos matched`);

    // Fetch thumb URLs in batches
    const urls = await thumbUrls(Object.values(cantoFile));
    for (const [cantoStr, title] of Object.entries(cantoFile)) {
      if (urls[title]) result[book.id][cantoStr] = urls[title];
    }

    // Report missing
    const found = new Set(Object.keys(result[book.id]).map(Number));
    const missing = Array.from({length:book.cantos}, (_,i)=>i+1).filter(n=>!found.has(n));
    if (missing.length) console.log(`  ⚠️  Missing cantos: ${missing.join(', ')}`);
    else console.log('  ✅  All cantos covered');
  }

  mkdirSync(join(root, 'public', 'data'), { recursive: true });
  writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
  const total = Object.values(result).flatMap(Object.values).length;
  console.log(`\n🎉  ${total} illustrations saved → ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
