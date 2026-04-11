import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sections, cantos } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface Params { book: string }

/**
 * GET /api/books/:book
 * Returns section metadata plus the full canto list (number, roman, titles).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> },
) {
  const { book } = await params;

  const [section] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, book))
    .limit(1);

  if (!section) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const cantoList = await db
    .select({
      number: cantos.number,
      roman: cantos.roman,
      title_en: cantos.title_en,
      title_zh: cantos.title_zh,
    })
    .from(cantos)
    .where(eq(cantos.section_id, book))
    .orderBy(asc(cantos.number));

  return NextResponse.json({ section, cantos: cantoList });
}
