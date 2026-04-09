'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CopyButton from './CopyButton';
import type { Canto, Lang } from '@/lib/types';

interface Props {
  canto: Canto;
  cantoEn?: Canto;
  book_title: string;
  book_title_zh: string;
  lang: Lang;
  translator: string;
  prevHref?: string;
  nextHref?: string;
}

export default function CantoContent({ canto, cantoEn, book_title, book_title_zh, lang, translator, prevHref, nextHref }: Props) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [biOrder, setBiOrder] = useState<'zh' | 'en'>('zh');
  const [immersive, setImmersive] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const saved = localStorage.getItem('fontSize');
    if (saved) setFontSize(Number(saved));
  }, []);

  function adjustFont(delta: number) {
    setFontSize(prev => {
      const next = Math.min(26, Math.max(12, prev + delta));
      localStorage.setItem('fontSize', String(next));
      return next;
    });
  }

  const isBilingual = lang === 'bilingual' && cantoEn;

  useEffect(() => {
    if (immersive) {
      document.body.classList.add('immersive');
    } else {
      document.body.classList.remove('immersive');
    }
    return () => { document.body.classList.remove('immersive'); };
  }, [immersive]);

  // Clean up scroll class on unmount
  useEffect(() => {
    return () => { document.body.classList.remove('scroll-down'); };
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only fire if horizontal dominates and exceeds 60px
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx > 0 && prevHref) router.push(prevHref);   // swipe right → prev
    if (dx < 0 && nextHref) router.push(nextHref);   // swipe left  → next
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const current = e.currentTarget.scrollTop;
    const delta = current - lastScrollY.current;
    if (current <= 20) {
      document.body.classList.remove('scroll-down');
    } else if (delta > 6) {
      document.body.classList.add('scroll-down');
    } else if (delta < -6) {
      document.body.classList.remove('scroll-down');
    }
    lastScrollY.current = current;
  }

  function getTextToCopy() {
    if (isBilingual) {
      const header = `但丁《神曲·${book_title_zh}》${canto.title} / ${book_title} Canto ${canto.roman}\n\n`;
      const lines: string[] = [];
      const len = Math.max(canto.lines.length, cantoEn!.lines.length);
      for (let i = 0; i < len; i++) {
        const zh = canto.lines[i] ?? '';
        const en = cantoEn!.lines[i] ?? '';
        if (!zh.trim() && !en.trim()) {
          lines.push('');
        } else {
          const first = biOrder === 'zh' ? zh : en;
          const second = biOrder === 'zh' ? en : zh;
          if (first.trim()) lines.push(first.trim());
          if (second.trim()) lines.push(second.trim());
        }
      }
      return header + lines.join('\n') + `\n\n— ${translator}`;
    }
    const bookLabel = lang === 'zh' ? book_title_zh : book_title;
    const title = lang === 'zh'
      ? `但丁《神曲·${bookLabel}》${canto.title}\n`
      : `Dante's Divine Comedy — ${book_title}, Canto ${canto.roman}\n`;
    return title + canto.lines.join('\n') + `\n\n— ${translator}`;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Canto header */}
      <div
        className="canto-header flex items-center justify-between px-4 py-3 md:px-8 md:py-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            {lang === 'en' ? book_title : book_title_zh}
          </p>
          <h2 className="text-lg md:text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
            {lang === 'en' ? `Canto ${canto.roman}` : canto.title}
            {isBilingual && (
              <span className="text-base font-normal ml-3" style={{ color: 'var(--text-muted)' }}>
                · Canto {canto.roman}
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Bilingual order toggle */}
          {isBilingual && (
            <button
              onClick={() => setBiOrder(o => o === 'zh' ? 'en' : 'zh')}
              className="px-2 py-1 rounded text-xs"
              style={{
                background: 'var(--bg-active)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-secondary)',
              }}
              title="切换中英顺序"
            >
              {biOrder === 'zh' ? '中↑英↓' : '英↑中↓'}
            </button>
          )}
          {/* Font size controls */}
          <div className="flex items-center rounded overflow-hidden" style={{ border: '1px solid var(--border-light)' }}>
            <button
              onClick={() => adjustFont(-1)}
              className="flex items-center justify-center w-6 h-6 text-sm"
              style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)' }}
              title="减小字号"
            >
              A
            </button>
            <span className="text-xs px-1.5 select-none" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', minWidth: '2rem', textAlign: 'center', lineHeight: '1.5rem' }}>
              {fontSize}
            </span>
            <button
              onClick={() => adjustFont(1)}
              className="flex items-center justify-center w-6 h-6"
              style={{ background: 'var(--bg-active)', color: 'var(--text-secondary)', fontSize: '1rem' }}
              title="增大字号"
            >
              A
            </button>
          </div>
          <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
            {canto.lines.filter(l => l.trim()).length}{lang === 'en' ? ' lines' : ' 行'}
          </span>
          {/* Immersive mode */}
          <button
            onClick={() => setImmersive(v => !v)}
            className="flex items-center justify-center w-7 h-7 rounded text-sm"
            style={{
              background: 'var(--bg-active)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-muted)',
            }}
            title={immersive ? '退出沉浸阅读' : '沉浸阅读'}
          >
            {immersive ? '⊡' : '⊞'}
          </button>
          <CopyButton getText={getTextToCopy} />
        </div>
      </div>

      {/* Floating immersive exit button */}
      <button
        className="immersive-exit"
        onClick={() => setImmersive(false)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 100,
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.375rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          background: 'var(--bg-active)',
          border: '1px solid var(--border-light)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        ⊡ 退出沉浸
      </button>

      {/* Verse content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto fade-in canto-scroll"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto', fontSize: `${fontSize}px` }}>
          {isBilingual ? (
            (() => {
              const len = Math.max(canto.lines.length, cantoEn!.lines.length);
              const elements: React.ReactNode[] = [];
              for (let i = 0; i < len; i++) {
                const zh = canto.lines[i] ?? '';
                const en = cantoEn!.lines[i] ?? '';
                if (!zh.trim() && !en.trim()) {
                  elements.push(<div key={`gap-${i}`} style={{ height: '1em' }} />);
                } else {
                  const firstLine = biOrder === 'zh' ? zh : en;
                  const secondLine = biOrder === 'zh' ? en : zh;
                  const firstIsEn = biOrder === 'en';
                  elements.push(
                    <div key={`pair-${i}`} style={{ marginBottom: '0.6em' }}>
                      {firstLine.trim() && (
                        <p
                          className="select-text"
                          style={{
                            color: 'var(--text-primary)',
                            marginBottom: '0.05em',
                            fontFamily: 'Georgia, Palatino Linotype, serif',
                            fontSize: firstIsEn ? '0.9em' : '1em',
                            lineHeight: '1.75',
                            letterSpacing: firstIsEn ? '0.01em' : '0.02em',
                            paddingLeft: (firstIsEn && (en.startsWith('  ') || en.startsWith('\u2003'))) ? '1.5em' : '0',
                          }}
                        >
                          {firstLine.trim()}
                        </p>
                      )}
                      {secondLine.trim() && (
                        <p
                          className="select-text"
                          style={{
                            color: 'var(--text-muted)',
                            fontFamily: 'Georgia, Palatino Linotype, serif',
                            fontSize: firstIsEn ? '1em' : '0.875em',
                            lineHeight: '1.65',
                            letterSpacing: firstIsEn ? '0.02em' : '0.01em',
                            paddingLeft: (!firstIsEn && (en.startsWith('  ') || en.startsWith('\u2003'))) ? '1.5em' : '0',
                          }}
                        >
                          {secondLine.trim()}
                        </p>
                      )}
                    </div>
                  );
                }
              }
              return elements;
            })()
          ) : (
            canto.lines.map((line, idx) => {
              if (!line.trim()) {
                return <div key={idx} style={{ height: '0.75em' }} />;
              }
              const isIndented = line.startsWith('  ') || line.startsWith('\u2003');
              return (
                <p
                  key={idx}
                  className="leading-relaxed select-text"
                  style={{
                    color: 'var(--text-primary)',
                    paddingLeft: isIndented ? '1.5em' : '0',
                    marginBottom: '0.1em',
                    fontFamily: 'Georgia, Palatino Linotype, serif',
                    fontSize: '1em',
                    lineHeight: '1.85',
                    letterSpacing: lang === 'zh' ? '0.02em' : '0.01em',
                  }}
                >
                  {line.trim()}
                </p>
              );
            })
          )}
        </div>

        {/* Attribution footer */}
        <div
          className="pt-6 text-sm text-center"
          style={{
            borderTop: '1px solid var(--border)',
            color: 'var(--text-muted)',
            maxWidth: '680px',
            margin: '3rem auto 0',
          }}
        >
          <p>{translator}</p>
        </div>
      </div>
    </div>
  );
}
