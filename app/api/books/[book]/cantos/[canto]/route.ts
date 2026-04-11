import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sections, cantos, illustrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface Params { book: string; canto: string }

/**
 * GET /api/books/:book/cantos/:canto
 * Returns the full canto content (en + zh lines), section metadata,
 * and illustration if one exists.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> },
) {
  const { book, canto: cantoStr } = await params;
  const cantoNum = parseInt(cantoStr, 10);

  if (isNaN(cantoNum) || cantoNum < 1) {
    return NextResponse.json({ error: 'Invalid canto number' }, { status: 400 });
  }

  const [[section], [canto], [illustration]] = await Promise.all([
    db.select().from(sections).where(eq(sections.id, book)).limit(1),
    db.select().from(cantos)
      .where(and(eq(cantos.section_id, book), eq(cantos.number, cantoNum)))
      .limit(1),
    db.select().from(illustrations)
      .where(and(eq(illustrations.section_id, book), eq(illustrations.canto_number, cantoNum)))
      .limit(1),
  ]);

  if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  if (!canto)   return NextResponse.json({ error: 'Canto not found' },   { status: 404 });

  return NextResponse.json({
    section: {
      id: section.id,
      work_id: section.work_id,
      title: section.title,
      title_zh: section.title_zh,
      canto_count: section.canto_count,
      translator_en: section.translator_en,
      translator_zh: section.translator_zh,
      zh_placeholder: section.zh_placeholder,
    },
    canto: {
      number: canto.number,
      roman: canto.roman,
      title_en: canto.title_en,
      title_zh: canto.title_zh,
      lines_en: canto.lines_en,
      lines_zh: canto.lines_zh,
    },
    illustration: illustration
      ? { url: illustration.url, artist: illustration.artist, year: illustration.year }
      : null,
  });
}
