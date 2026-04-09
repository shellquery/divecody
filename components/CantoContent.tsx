'use client';

import { useRef } from 'react';
import CopyButton from './CopyButton';
import type { Canto, Lang } from '@/lib/types';

interface Props {
  canto: Canto;
  cantoEn?: Canto;
  book_title: string;
  book_title_zh: string;
  lang: Lang;
  translator: string;
}

export default function CantoContent({ canto, cantoEn, book_title, book_title_zh, lang, translator }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  function getTextToCopy() {
    if (lang === 'bilingual' && cantoEn) {
      const header = `但丁《神曲·${book_title_zh}》${canto.title} / ${book_title} Canto ${canto.roman}\n\n`;
      const lines: string[] = [];
      const len = Math.max(canto.lines.length, cantoEn.lines.length);
      for (let i = 0; i < len; i++) {
        const zh = canto.lines[i] ?? '';
        const en = cantoEn.lines[i] ?? '';
        if (!zh.trim() && !en.trim()) {
          lines.push('');
        } else {
          if (zh.trim()) lines.push(zh.trim());
          if (en.trim()) lines.push(en.trim());
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

  const isBilingual = lang === 'bilingual' && cantoEn;

  return (
    <div className="flex flex-col h-full">
      {/* Canto header */}
      <div
        className="flex items-center justify-between px-8 py-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            {lang === 'en' ? book_title : book_title_zh}
          </p>
          <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
            {lang === 'en' ? `Canto ${canto.roman}` : canto.title}
            {isBilingual && (
              <span className="text-base font-normal ml-3" style={{ color: 'var(--text-muted)' }}>
                · Canto {canto.roman}
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {canto.lines.filter(l => l.trim()).length}{lang === 'en' ? ' lines' : ' 行'}
          </span>
          <CopyButton getText={getTextToCopy} />
        </div>
      </div>

      {/* Verse content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto fade-in"
        style={{ padding: '2rem 3rem 4rem' }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {isBilingual ? (
            // Bilingual interleaved rendering
            (() => {
              const len = Math.max(canto.lines.length, cantoEn!.lines.length);
              const elements: React.ReactNode[] = [];
              for (let i = 0; i < len; i++) {
                const zh = canto.lines[i] ?? '';
                const en = cantoEn!.lines[i] ?? '';
                if (!zh.trim() && !en.trim()) {
                  elements.push(<div key={`gap-${i}`} style={{ height: '1em' }} />);
                } else {
                  elements.push(
                    <div key={`pair-${i}`} style={{ marginBottom: '0.6em' }}>
                      {zh.trim() && (
                        <p
                          className="text-base select-text"
                          style={{
                            color: 'var(--text-primary)',
                            marginBottom: '0.1em',
                            fontFamily: 'Georgia, Palatino Linotype, serif',
                            lineHeight: '1.75',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {zh.trim()}
                        </p>
                      )}
                      {en.trim() && (
                        <p
                          className="text-sm select-text"
                          style={{
                            color: 'var(--text-muted)',
                            fontFamily: 'Georgia, Palatino Linotype, serif',
                            lineHeight: '1.65',
                            letterSpacing: '0.01em',
                            paddingLeft: en.startsWith('  ') || en.startsWith('\u2003') ? '1.5em' : '0',
                          }}
                        >
                          {en.trim()}
                        </p>
                      )}
                    </div>
                  );
                }
              }
              return elements;
            })()
          ) : (
            // Single-language rendering
            canto.lines.map((line, idx) => {
              if (!line.trim()) {
                return <div key={idx} style={{ height: '0.75em' }} />;
              }
              const isIndented = line.startsWith('  ') || line.startsWith('\u2003');
              const cleaned = line.trim();
              return (
                <p
                  key={idx}
                  className="text-base leading-relaxed select-text"
                  style={{
                    color: 'var(--text-primary)',
                    paddingLeft: isIndented ? '1.5em' : '0',
                    marginBottom: '0.1em',
                    fontFamily: 'Georgia, Palatino Linotype, serif',
                    lineHeight: '1.85',
                    letterSpacing: lang === 'zh' ? '0.02em' : '0.01em',
                  }}
                >
                  {cleaned}
                </p>
              );
            })
          )}
        </div>

        {/* Attribution footer */}
        <div
          className="mt-12 pt-6 text-sm text-center"
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
