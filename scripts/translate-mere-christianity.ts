#!/usr/bin/env tsx
/**
 * Translate Mere Christianity chapters to Chinese using Claude API.
 * Run: npx tsx --env-file=.env.local scripts/translate-mere-christianity.ts
 *
 * Requires:
 *   ANTHROPIC_API_KEY  — in .env.local
 *   DATABASE_URL       — in .env.local
 */
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and, inArray } from 'drizzle-orm';
import { existsSync } from 'node:fs';
import { cantos, sections } from '../db/schema';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');

const dbUrl = process.env.DATABASE_URL ?? process.env.divecody_DATABASE_URL;
if (!dbUrl) { console.error('❌  DATABASE_URL required'); process.exit(1); }

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) { console.error('❌  ANTHROPIC_API_KEY required'); process.exit(1); }

const db = drizzle(neon(dbUrl));

async function claude(prompt: string, model = 'claude-opus-4-6', maxTokens = 4096): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { content: { type: string; text: string }[] };
  return data.content[0].text;
}

const MC_SECTION_IDS = ['mc-book-1', 'mc-book-2', 'mc-book-3', 'mc-book-4'];

async function translateLines(titleEn: string, lines: string[]): Promise<string[]> {
  const text = lines.map((l, i) => `[${i + 1}] ${l}`).join('\n\n');

  const raw = await claude(
    `你是专业的文学翻译，请将《返璞归真》（C.S. Lewis, Mere Christianity）以下章节的英文段落翻译成流畅、准确的现代汉语。

章节标题：${titleEn}

要求：
- 保持刘易斯温和、通俗而深刻的文风
- 每段对应翻译，保持段落编号格式 [1] [2] ...
- 只输出翻译内容，不要加任何解释或前言

英文原文：
${text}`
  );

  // Parse [1] ... [2] ... back into array
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const marker = `[${i + 1}]`;
    const nextMarker = `[${i + 2}]`;
    const start = raw.indexOf(marker);
    if (start === -1) { result.push(lines[i]); continue; }
    const end = i + 1 < lines.length ? raw.indexOf(nextMarker, start) : raw.length;
    result.push(raw.slice(start + marker.length, end === -1 ? raw.length : end).trim());
  }
  return result;
}

function bar(done: number, total: number, width = 30): string {
  const filled = Math.round((done / total) * width);
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + `] ${done}/${total}`;
}

async function main() {
  // Fetch all cantos for Mere Christianity that still need translation
  const rows = await db
    .select({
      section_id: cantos.section_id,
      number: cantos.number,
      title_en: cantos.title_en,
      lines_en: cantos.lines_en,
      lines_zh: cantos.lines_zh,
    })
    .from(cantos)
    .where(inArray(cantos.section_id, MC_SECTION_IDS));

  // Sort by section order then chapter number
  const mcRows = rows
    .filter(r => MC_SECTION_IDS.includes(r.section_id))
    .sort((a, b) =>
      MC_SECTION_IDS.indexOf(a.section_id) - MC_SECTION_IDS.indexOf(b.section_id) ||
      a.number - b.number
    );

  const todo = mcRows.filter(r => !r.lines_zh);
  const total = mcRows.length;
  const alreadyDone = total - todo.length;

  console.log(`\n《返璞归真》中文翻译\n`);
  console.log(`总章节：${total}  已翻译：${alreadyDone}  待翻译：${todo.length}\n`);

  if (todo.length === 0) {
    console.log('✅  所有章节已翻译完成！');
    return;
  }

  let done = alreadyDone;

  for (const row of todo) {
    const label = `${row.section_id} / 第${row.number}章  ${row.title_en}`;
    process.stdout.write(`\n翻译中：${label}\n`);

    const linesEn = row.lines_en as string[];
    const linesZh = await translateLines(row.title_en ?? '', linesEn);

    await db
      .update(cantos)
      .set({ lines_zh: linesZh, title_zh: await translateTitle(row.title_en ?? '') })
      .where(and(eq(cantos.section_id, row.section_id), eq(cantos.number, row.number)));

    done++;
    console.log(`✅  完成  ${bar(done, total)}`);
  }

  // Mark all mc sections as no longer placeholder
  for (const id of MC_SECTION_IDS) {
    await db
      .update(sections)
      .set({ zh_placeholder: false, translator_zh: '克莱夫·斯泰普尔斯·刘易斯（1952）' })
      .where(eq(sections.id, id));
  }

  console.log(`\n🎉  翻译完成！共 ${done} 章节已写入数据库。\n`);
}

// Cache title translations to avoid redundant API calls
const titleCache = new Map<string, string>();
async function translateTitle(titleEn: string): Promise<string> {
  if (titleCache.has(titleEn)) return titleCache.get(titleEn)!;
  const zh = (await claude(
    `将《返璞归真》章节标题翻译成中文（简短，4-10字），只输出译文：${titleEn}`,
    'claude-haiku-4-5-20251001',
    64,
  )).trim();
  titleCache.set(titleEn, zh);
  return zh;
}

main().catch(e => { console.error(e); process.exit(1); });
