import { db } from '@/db';
import { illustrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getDorehImage(
  book: string,
  canto: number,
): Promise<string | undefined> {
  const rows = await db
    .select({ url: illustrations.url })
    .from(illustrations)
    .where(
      and(
        eq(illustrations.section_id, book),
        eq(illustrations.canto_number, canto),
      ),
    )
    .limit(1);

  return rows[0]?.url;
}
