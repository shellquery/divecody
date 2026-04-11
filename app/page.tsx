import Link from 'next/link';
import { getAllWorks } from '@/lib/content';
import ThemeToggle from '@/components/ThemeToggle';
import LibraryContinue from '@/components/LibraryContinue';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const booksList = await getAllWorks();

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 shrink-0"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="text-sm font-medium tracking-wide" style={{ color: 'var(--accent)', fontFamily: 'Georgia, serif' }}>
          DiveCody · 书库
        </h1>
        <ThemeToggle />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Continue reading */}
        <Suspense fallback={null}>
          <LibraryContinue />
        </Suspense>

        {/* Book list */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>
            全部书籍 · All Books
          </h2>

          {booksList.map((work) => {
            const firstSection = work.sections[0];
            const totalChapters = work.sections.reduce((n, s) => n + s.canto_count, 0);

            return (
              <div
                key={work.id}
                className="rounded-lg overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                {/* Book header */}
                <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }}>
                        {work.title}
                      </h3>
                      {work.title_zh && (
                        <p className="text-sm mt-0.5" style={{ color: 'var(--accent)' }}>{work.title_zh}</p>
                      )}
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {work.author_zh ?? work.author}
                        <span className="mx-1.5" style={{ color: 'var(--border-light)' }}>·</span>
                        {work.sections.length} 卷 · {totalChapters} 章
                      </p>
                    </div>
                    {firstSection && (
                      <Link
                        href={`/read/${firstSection.id}/1?lang=zh`}
                        className="shrink-0 px-4 py-1.5 rounded text-xs font-medium transition-colors"
                        style={{
                          background: 'var(--bg-active)',
                          color: 'var(--accent)',
                          border: '1px solid var(--accent-dim)',
                        }}
                      >
                        开始阅读
                      </Link>
                    )}
                  </div>
                </div>

                {/* Sections */}
                <div className="flex flex-col">
                  {work.sections.map((sec, i) => (
                    <Link
                      key={sec.id}
                      href={`/read/${sec.id}/1?lang=zh`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--bg-hover)]"
                      style={{
                        borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                      }}
                    >
                      <span className="text-base w-6 text-center">{sec.emoji ?? '📖'}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {sec.title_zh ?? sec.title}
                        </span>
                      </div>
                      <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {sec.canto_count} 章
                      </span>
                      <span className="text-sm shrink-0" style={{ color: 'var(--text-muted)' }}>›</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
