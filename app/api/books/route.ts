import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sections, works } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/books
 * Returns all sections grouped under their parent work.
 */
export async function GET() {
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
      work_title: works.title,
      work_title_zh: works.title_zh,
    })
    .from(sections)
    .leftJoin(works, eq(sections.work_id, works.id))
    .orderBy(asc(sections.work_id), asc(sections.number));

  return NextResponse.json(rows);
}
