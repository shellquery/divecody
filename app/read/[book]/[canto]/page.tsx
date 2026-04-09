import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { getCanto, getBookMeta, isZhPlaceholder } from '@/lib/content';
import { BOOKS, CANTO_COUNTS } from '@/lib/types';
import type { BookId, Lang } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import LangToggle from '@/components/LangToggle';
import CantoContent from '@/components/CantoContent';
import ThemeToggle from '@/components/ThemeToggle';

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

  const prevHref = prevCanto ? `/read/${bookId}/${prevCanto}?lang=${lang}` : '#';
  const nextHref = nextCanto ? `/read/${bookId}/${nextCanto}?lang=${lang}` : '#';

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      <Suspense fallback={<div className="hidden md:block" style={{ width: 220, background: 'var(--bg-surface)' }} />}>
        <Sidebar />
      </Suspense>

      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Top bar — "topbar" class used by immersive mode CSS */}
        <header
          className="topbar flex items-center justify-between pl-12 pr-3 py-2.5 md:px-6 md:py-3 shrink-0"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
        >
          {/* Left: title (author hidden on mobile) */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <h1
              className="text-sm md:text-base font-medium tracking-wide truncate"
              style={{ color: 'var(--accent)' }}
            >
              神曲
              <span className="hidden sm:inline"> · Divine Comedy</span>
            </h1>
            <span className="hidden md:inline" style={{ color: 'var(--border-light)' }}>|</span>
            <span className="hidden md:inline text-sm" style={{ color: 'var(--text-secondary)' }}>
              {lang === 'en' ? 'Dante Alighieri' : '但丁 · 阿利吉耶里'}
            </span>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            {zhIsPlaceholder && (
              <span
                className="hidden sm:inline text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(196,163,90,0.12)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-dim)',
                }}
              >
                翻译生成中…
              </span>
            )}

            {/* Prev / Next */}
            <div className="flex gap-1">
              <Link
                href={prevHref}
                aria-disabled={!prevCanto}
                className="px-2 py-1.5 md:px-3 rounded text-xs md:text-sm transition-colors"
                style={{
                  background: prevCanto ? 'var(--bg-active)' : 'var(--bg-hover)',
                  color: prevCanto ? 'var(--text-secondary)' : 'var(--text-muted)',
                  border: '1px solid var(--border-light)',
                  pointerEvents: prevCanto ? 'auto' : 'none',
                  opacity: prevCanto ? 1 : 0.35,
                }}
              >
                <span className="inline md:hidden">‹</span>
                <span className="hidden md:inline">← {lang === 'zh' ? '上章' : 'Prev'}</span>
              </Link>
              <Link
                href={nextHref}
                aria-disabled={!nextCanto}
                className="px-2 py-1.5 md:px-3 rounded text-xs md:text-sm transition-colors"
                style={{
                  background: nextCanto ? 'var(--bg-active)' : 'var(--bg-hover)',
                  color: nextCanto ? 'var(--text-secondary)' : 'var(--text-muted)',
                  border: '1px solid var(--border-light)',
                  pointerEvents: nextCanto ? 'auto' : 'none',
                  opacity: nextCanto ? 1 : 0.35,
                }}
              >
                <span className="inline md:hidden">›</span>
                <span className="hidden md:inline">{lang === 'zh' ? '下章' : 'Next'} →</span>
              </Link>
            </div>

            <LangToggle current={lang} />
            <ThemeToggle />
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
            prevHref={prevCanto ? prevHref : undefined}
            nextHref={nextCanto ? nextHref : undefined}
          />
        </div>
      </div>
    </div>
  );
}
