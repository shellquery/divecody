#!/usr/bin/env tsx
/**
 * Seed the Neon database with Divine Comedy content from JSON source files.
 *
 * Setup:
 *   1. Create a Neon database at https://neon.tech
 *   2. Set DATABASE_URL in .env.local
 *   3. npx drizzle-kit push          (create tables)
 *   4. npx tsx --env-file=.env.local scripts/seed-db.ts   (import content)
 *
 * Re-running is safe — uses onConflictDoNothing().
 */
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { works, sections, cantos, illustrations } from '../db/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL is required. Run: npx tsx --env-file=.env.local scripts/seed-db.ts');
  process.exit(1);
}

const db = drizzle(neon(process.env.DATABASE_URL));

function readJson(relPath: string): unknown {
  return JSON.parse(readFileSync(join(root, relPath), 'utf-8'));
}

function cleanTitle(t: string): string {
  return t.replace(/\s+/g, ' ').trim();
}

interface CantoJson {
  number: number;
  roman: string;
  title: string;
  lines: string[];
}
interface BookJson {
  translator?: string;
  source?: string;
  license?: string;
  _placeholder?: boolean;
  cantos: CantoJson[];
}

const SECTION_DEFS = [
  { id: 'inferno',    number: 1, title: 'Inferno',    title_zh: '地狱篇', emoji: '🔥' },
  { id: 'purgatorio', number: 2, title: 'Purgatorio', title_zh: '炼狱篇', emoji: '⛰️' },
  { id: 'paradiso',   number: 3, title: 'Paradiso',   title_zh: '天堂篇', emoji: '✨' },
];

async function main() {
  console.log('🌱 Seeding database…\n');

  // ── Work ──────────────────────────────────────────────────────────────────
  await db.insert(works).values({
    id: 'divine-comedy',
    title: 'The Divine Comedy',
    title_zh: '神曲',
    author: 'Dante Alighieri',
    author_zh: '但丁',
  }).onConflictDoNothing();
  console.log('✅  Works');

  const doreMap = readJson('public/data/dore.json') as Record<string, Record<string, string>>;

  for (const def of SECTION_DEFS) {
    console.log(`\n📖  ${def.title}…`);

    const enBook = readJson(`data/parsed/${def.id}_en.json`) as BookJson;
    const zhBook = readJson(`data/parsed/${def.id}_zh.json`) as BookJson;
    const zhIsPlaceholder = zhBook._placeholder === true;

    // ── Section ────────────────────────────────────────────────────────────
    await db.insert(sections).values({
      id: def.id,
      work_id: 'divine-comedy',
      title: def.title,
      title_zh: def.title_zh,
      number: def.number,
      canto_count: enBook.cantos.length,
      translator_en: enBook.translator ?? null,
      translator_zh: zhIsPlaceholder ? null : (zhBook.translator ?? null),
      source_url: enBook.source ?? null,
      license: enBook.license ?? null,
      zh_placeholder: zhIsPlaceholder,
      emoji: def.emoji,
    }).onConflictDoNothing();

    // ── Build zh lookup ────────────────────────────────────────────────────
    const zhByNum = new Map<number, { title: string; lines: string[] }>();
    if (!zhIsPlaceholder) {
      for (const c of zhBook.cantos) {
        zhByNum.set(Number(c.number), {
          title: cleanTitle(String(c.title)),
          lines: c.lines,
        });
      }
    }

    // ── Cantos (batch of 10) ───────────────────────────────────────────────
    const rows = enBook.cantos.map((c) => ({
      section_id: def.id,
      number: Number(c.number),
      roman: String(c.roman),
      title_en: cleanTitle(String(c.title)),
      title_zh: zhByNum.get(Number(c.number))?.title ?? null,
      lines_en: c.lines,
      lines_zh: zhByNum.get(Number(c.number))?.lines ?? null,
    }));

    for (let i = 0; i < rows.length; i += 10) {
      await db.insert(cantos).values(rows.slice(i, i + 10)).onConflictDoNothing();
    }
    console.log(`   ✅  ${rows.length} cantos`);

    // ── Illustrations ──────────────────────────────────────────────────────
    const sectionIllus = doreMap[def.id] ?? {};
    const illusRows = Object.entries(sectionIllus).map(([num, url]) => ({
      section_id: def.id,
      canto_number: Number(num),
      url: String(url),
      artist: 'Gustave Doré',
      year: 1857,
    }));
    if (illusRows.length > 0) {
      await db.insert(illustrations).values(illusRows).onConflictDoNothing();
    }
    console.log(`   ✅  ${illusRows.length} illustrations`);
  }

  console.log('\n🎉  Seeding complete!');
}

main().catch((e) => { console.error(e); process.exit(1); });
