import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { getCanto, getBookMeta, isZhPlaceholder } from '@/lib/content';
import { BOOKS, CANTO_COUNTS } from '@/lib/types';
import type { BookId, Lang } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import LangToggle from '@/components/LangToggle';
import CantoContent from '@/components/CantoContent';

interface Params {
  book: string;
  canto: string;
}
interface SearchParams {
  lang?: string;
}

export function generateStaticParams() {
  const params = [];
  for (const book of BOOKS) {
    for (let i = 1; i <= CANTO_COUNTS[book.id]; i++) {
      params.push({ book: book.id, canto: String(i) });
    }
  }
  return params;
}

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { book, canto: cantoStr } = await params;
  const { lang: langParam } = await searchParams;

  const bookId = book as BookId;
  const cantoNum = parseInt(cantoStr, 10);
  const lang: Lang =
    langParam === 'en' ? 'en' :
    langParam === 'bilingual' ? 'bilingual' :
    'zh';

  if (!BOOKS.find((b) => b.id === bookId)) notFound();
  const maxCanto = CANTO_COUNTS[bookId];
  if (isNaN(cantoNum) || cantoNum < 1 || cantoNum > maxCanto) notFound();

  // If Chinese is requested but only placeholder exists, flag it and show English
  const zhIsPlaceholder = (lang === 'zh' || lang === 'bilingual') && isZhPlaceholder(bookId);

  const cantoEn = getCanto(bookId, cantoNum, 'en');
  const cantoZh = getCanto(bookId, cantoNum, 'zh') ?? cantoEn;
  const meta = getBookMeta(bookId, 'en');

  const canto =
    lang === 'en' ? cantoEn :
    lang === 'bilingual' ? cantoZh :
    (zhIsPlaceholder ? cantoEn : cantoZh);

  if (!canto || !meta || !cantoEn) notFound();

  const effectiveLang: Lang = zhIsPlaceholder && lang === 'zh' ? 'en' : lang;
  const prevCanto = cantoNum > 1 ? cantoNum - 1 : null;
  const nextCanto = cantoNum < maxCanto ? cantoNum + 1 : null;

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      <Suspense fallback={<div style={{ width: 220, background: 'var(--bg-surface)' }} />}>
        <Sidebar />
      </Suspense>

      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <h1 className="text-base font-medium tracking-wide" style={{ color: 'var(--accent)' }}>
              神曲 · Divine Comedy
            </h1>
            <span style={{ color: 'var(--border-light)' }}>|</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {lang === 'en' ? 'Dante Alighieri' : '但丁 · 阿利吉耶里'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Status badge */}
            {zhIsPlaceholder && (
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(196,163,90,0.12)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-dim)',
                }}
              >
                中文翻译生成中…
              </span>
            )}

            {/* Prev / Next */}
            <div className="flex gap-1">
              <Link
                href={prevCanto ? `/read/${bookId}/${prevCanto}?lang=${lang}` : '#'}
                aria-disabled={!prevCanto}
                className="px-3 py-1.5 rounded text-sm transition-colors"
                style={{
                  background: prevCanto ? 'var(--bg-active)' : 'var(--bg-hover)',
                  color: prevCanto ? 'var(--text-secondary)' : 'var(--text-muted)',
                  border: '1px solid var(--border-light)',
                  pointerEvents: prevCanto ? 'auto' : 'none',
                  opacity: prevCanto ? 1 : 0.35,
                }}
              >
                ← {lang === 'zh' ? '上章' : 'Prev'}
              </Link>
              <Link
                href={nextCanto ? `/read/${bookId}/${nextCanto}?lang=${lang}` : '#'}
                aria-disabled={!nextCanto}
                className="px-3 py-1.5 rounded text-sm transition-colors"
                style={{
                  background: nextCanto ? 'var(--bg-active)' : 'var(--bg-hover)',
                  color: nextCanto ? 'var(--text-secondary)' : 'var(--text-muted)',
                  border: '1px solid var(--border-light)',
                  pointerEvents: nextCanto ? 'auto' : 'none',
                  opacity: nextCanto ? 1 : 0.35,
                }}
              >
                {lang === 'zh' ? '下章' : 'Next'} →
              </Link>
            </div>

            <LangToggle current={lang} />
          </div>
        </header>

        {/* Reading area */}
        <div className="flex-1 min-h-0">
          <CantoContent
            canto={canto!}
            cantoEn={effectiveLang === 'bilingual' ? cantoEn! : undefined}
            book_title={meta.title}
            book_title_zh={meta.title_zh}
            lang={effectiveLang}
            translator={
              effectiveLang === 'en'
                ? 'Henry Wadsworth Longfellow (1867) · 英文版'
                : effectiveLang === 'bilingual'
                ? `${meta.translator}  ·  Henry Wadsworth Longfellow (1867)`
                : meta.translator
            }
          />
        </div>
      </div>
    </div>
  );
}
