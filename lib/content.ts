import { db } from '@/db';
import { works, sections, cantos } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import type { Canto, Section, Work } from './types';

export interface WorkWithSections extends Work {
  sections: Section[];
}

export async function getAllWorks(): Promise<WorkWithSections[]> {
  const [workRows, sectionRows] = await Promise.all([
    db.select().from(works).orderBy(asc(works.id)),
    db.select({
      id: sections.id,
      work_id: sections.work_id,
      title: sections.title,
      title_zh: sections.title_zh,
      number: sections.number,
      canto_count: sections.canto_count,
      emoji: sections.emoji,
      zh_placeholder: sections.zh_placeholder,
      translator_en: sections.translator_en,
      translator_zh: sections.translator_zh,
    }).from(sections).orderBy(asc(sections.work_id), asc(sections.number)),
  ]);

  return workRows.map((w) => ({
    ...w,
    sections: sectionRows.filter((s) => s.work_id === w.id),
  }));
}

export async function getAllSections(): Promise<Section[]> {
  return db
    .select({
      id: sections.id,
      work_id: sections.work_id,
      title: sections.title,
      title_zh: sections.title_zh,
      number: sections.number,
      canto_count: sections.canto_count,
      emoji: sections.emoji,
      zh_placeholder: sections.zh_placeholder,
      translator_en: sections.translator_en,
      translator_zh: sections.translator_zh,
    })
    .from(sections)
    .orderBy(asc(sections.work_id), asc(sections.number));
}

export async function getSection(bookId: string): Promise<Section | null> {
  const rows = await db
    .select({
      id: sections.id,
      work_id: sections.work_id,
      title: sections.title,
      title_zh: sections.title_zh,
      number: sections.number,
      canto_count: sections.canto_count,
      emoji: sections.emoji,
      zh_placeholder: sections.zh_placeholder,
      translator_en: sections.translator_en,
      translator_zh: sections.translator_zh,
    })
    .from(sections)
    .where(eq(sections.id, bookId))
    .limit(1);

  return rows[0] ?? null;
}

export async function isZhPlaceholder(bookId: string): Promise<boolean> {
  const rows = await db
    .select({ zh_placeholder: sections.zh_placeholder })
    .from(sections)
    .where(eq(sections.id, bookId))
    .limit(1);

  return rows[0]?.zh_placeholder ?? false;
}

export async function getCanto(
  bookId: string,
  cantoNum: number,
  lang: 'en' | 'zh',
): Promise<Canto | null> {
  const rows = await db
    .select({
      number: cantos.number,
      roman: cantos.roman,
      title_en: cantos.title_en,
      title_zh: cantos.title_zh,
      lines_en: cantos.lines_en,
      lines_zh: cantos.lines_zh,
    })
    .from(cantos)
    .where(and(eq(cantos.section_id, bookId), eq(cantos.number, cantoNum)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const lines =
    lang === 'zh'
      ? ((row.lines_zh ?? row.lines_en) as string[])
      : (row.lines_en as string[]);

  return {
    number: row.number,
    roman: row.roman,
    title:
      lang === 'zh'
        ? (row.title_zh ?? row.title_en ?? '')
        : (row.title_en ?? ''),
    lines,
  };
}

export async function getBookMeta(bookId: string) {
  const section = await getSection(bookId);
  if (!section) return null;
  return {
    id: section.id,
    title: section.title,
    title_zh: section.title_zh ?? '',
    canto_count: section.canto_count,
    translator: section.translator_zh ?? section.translator_en ?? '',
    translator_en: section.translator_en ?? '',
  };
}

export async function listCantos(
  bookId: string,
): Promise<Pick<Canto, 'number' | 'roman' | 'title'>[]> {
  const rows = await db
    .select({
      number: cantos.number,
      roman: cantos.roman,
      title_zh: cantos.title_zh,
      title_en: cantos.title_en,
    })
    .from(cantos)
    .where(eq(cantos.section_id, bookId))
    .orderBy(asc(cantos.number));

  return rows.map((r) => ({
    number: r.number,
    roman: r.roman,
    title: r.title_zh ?? r.title_en ?? '',
  }));
}
