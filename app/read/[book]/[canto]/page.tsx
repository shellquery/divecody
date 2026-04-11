import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { getCanto, getSection, getAllWorks } from '@/lib/content';
import { getDorehImage } from '@/lib/dore';
import type { Lang } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import LangToggle from '@/components/LangToggle';
import CantoContent from '@/components/CantoContent';
import ThemeToggle from '@/components/ThemeToggle';
import PageSlider from '@/components/PageSlider';
import ReadingProgressSaver from '@/components/ReadingProgressSaver';

interface Params { book: string; canto: string }
interface SearchParams { lang?: string }

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { book, canto: cantoStr } = await params;
  const { lang: langParam } = await searchParams;

  const cantoNum = parseInt(cantoStr, 10);
  const lang: Lang =
    langParam === 'en' ? 'en' :
    langParam === 'bilingual' ? 'bilingual' :
    'zh';

  const section = await getSection(book);
  if (!section) notFound();
  if (isNaN(cantoNum) || cantoNum < 1 || cantoNum > section.canto_count) notFound();

  const zhIsPlaceholder = (lang === 'zh' || lang === 'bilingual') && section.zh_placeholder;
  const effectiveLang: Lang = zhIsPlaceholder && lang === 'zh' ? 'en' : lang;
  const adjLang: 'en' | 'zh' = effectiveLang === 'en' ? 'en' : 'zh';

  const prevNum = cantoNum > 1 ? cantoNum - 1 : null;
  const nextNum = cantoNum < section.canto_count ? cantoNum + 1 : null;

  const [cantoEn, cantoZh, illustrationUrl, allWorks, prevCanto, nextCanto] =
    await Promise.all([
      getCanto(book, cantoNum, 'en'),
      getCanto(book, cantoNum, 'zh'),
      getDorehImage(book, cantoNum),
      getAllWorks(),
      prevNum ? getCanto(book, prevNum, adjLang) : null,
      nextNum ? getCanto(book, nextNum, adjLang) : null,
    ]);

  const allSections = allWorks.flatMap((w) => w.sections);
  const work = allWorks.find((w) => w.id === section.work_id);

  const canto =
    lang === 'en'        ? cantoEn :
    lang === 'bilingual' ? cantoZh :
    zhIsPlaceholder      ? cantoEn : cantoZh;

  if (!canto || !cantoEn) notFound();

  const prevHref = prevNum ? `/read/${book}/${prevNum}?lang=${lang}` : undefined;
  const nextHref = nextNum ? `/read/${book}/${nextNum}?lang=${lang}` : undefined;

  const translatorEn = section.translator_en ?? 'Henry Wadsworth Longfellow (1867)';
  const translatorZh = section.translator_zh ?? translatorEn;

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      <Suspense fallback={null}><ReadingProgressSaver /></Suspense>
      <Suspense
        fallback={
          <div className="hidden md:block" style={{ width: 220, background: 'var(--bg-surface)' }} />
        }
      >
        <Sidebar sections={allSections} works={allWorks} />
      </Suspense>

      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Top bar */}
        <header
          className="topbar flex items-center justify-between pl-12 pr-3 py-2.5 md:px-6 md:py-3 shrink-0"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <h1 className="text-sm md:text-base font-medium tracking-wide truncate" style={{ color: 'var(--accent)' }}>
              {lang === 'zh' ? (work?.title_zh ?? work?.title) : work?.title}
            </h1>
            <span className="hidden md:inline" style={{ color: 'var(--border-light)' }}>|</span>
            <span className="hidden md:inline text-sm" style={{ color: 'var(--text-secondary)' }}>
              {lang === 'zh' ? (work?.author_zh ?? work?.author) : work?.author}
            </span>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            {zhIsPlaceholder && (
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(196,163,90,0.12)', color: 'var(--accent)', border: '1px solid var(--accent-dim)' }}>
                翻译生成中…
              </span>
            )}
            <div className="flex gap-1">
              <Link
                href={prevHref ?? '#'}
                aria-disabled={!prevNum}
                className="px-2 py-1.5 md:px-3 rounded text-xs md:text-sm transition-colors"
                style={{ background: prevNum ? 'var(--bg-active)' : 'var(--bg-hover)', color: prevNum ? 'var(--text-secondary)' : 'var(--text-muted)', border: '1px solid var(--border-light)', pointerEvents: prevNum ? 'auto' : 'none', opacity: prevNum ? 1 : 0.35 }}
              >
                <span className="inline md:hidden">‹</span>
                <span className="hidden md:inline">← {lang === 'zh' ? '上章' : 'Prev'}</span>
              </Link>
              <Link
                href={nextHref ?? '#'}
                aria-disabled={!nextNum}
                className="px-2 py-1.5 md:px-3 rounded text-xs md:text-sm transition-colors"
                style={{ background: nextNum ? 'var(--bg-active)' : 'var(--bg-hover)', color: nextNum ? 'var(--text-secondary)' : 'var(--text-muted)', border: '1px solid var(--border-light)', pointerEvents: nextNum ? 'auto' : 'none', opacity: nextNum ? 1 : 0.35 }}
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
        <PageSlider
          prevCanto={prevCanto ?? undefined}
          nextCanto={nextCanto ?? undefined}
          prevHref={prevHref}
          nextHref={nextHref}
          lang={adjLang}
          bookTitle={section.title}
          bookTitleZh={section.title_zh ?? section.title}
        >
          <CantoContent
            canto={canto}
            cantoEn={effectiveLang === 'bilingual' ? cantoEn : undefined}
            book_title={section.title}
            book_title_zh={section.title_zh ?? section.title}
            work_title={work?.title}
            work_title_zh={work?.title_zh ?? work?.title ?? undefined}
            work_author={lang === 'zh' ? (work?.author_zh ?? work?.author ?? undefined) : (work?.author ?? undefined)}
            lang={effectiveLang}
            translator={
              effectiveLang === 'en'
                ? `${translatorEn} · 英文版`
                : effectiveLang === 'bilingual'
                ? `${translatorZh}  ·  ${translatorEn}`
                : translatorZh
            }
            illustrationUrl={illustrationUrl}
          />
        </PageSlider>
      </div>
    </div>
  );
}
